import json
import time
import logging
import threading
import sqlite3
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class ExecutionEngine:
    def __init__(self, db_path, sim_engine, mqtt_broker, state_manager):
        self._db_path = db_path
        self._sim = sim_engine
        self._mqtt = mqtt_broker
        self._state = state_manager
        self._running = False
        self._time_thread = None
        self._active = {}

    def start(self):
        self._running = True
        self._mqtt.subscribe("#", self._on_mqtt_event)
        self._time_thread = threading.Thread(target=self._time_loop, daemon=True)
        self._time_thread.start()
        logger.info("[ENG] Execution engine started")

    def stop(self):
        self._running = False

    def _on_mqtt_event(self, topic, payload):
        for wf in self._load_enabled():
            t = wf.get("trigger", {})
            if t.get("type") != "mqtt_event":
                continue
            if not self._topic_matches(t.get("topic", ""), topic):
                continue
            cond = t.get("condition", "")
            if cond and not self._eval_trigger_cond(cond, payload):
                continue
            logger.info(f"[ENG] MQTT trigger: {wf['name']} on {topic}")
            self._run_async(wf, {"topic": topic, "payload": payload})

    def _time_loop(self):
        while self._running:
            now = datetime.now()
            for wf in self._load_enabled():
                t = wf.get("trigger", {})
                if t.get("type") == "time" and self._cron_matches(t.get("cron",""), now):
                    logger.info(f"[ENG] Time trigger: {wf['name']}")
                    self._run_async(wf, {"time": now.isoformat()})
            time.sleep(30)

    def _run_async(self, wf, ctx):
        wid = wf["id"]
        if wid in self._active and self._active[wid].is_alive():
            return
        t = threading.Thread(target=self._run, args=(wf, ctx), daemon=True)
        self._active[wid] = t
        t.start()

    def _run(self, wf, ctx):
        wid, name = wf["id"], wf["name"]
        self._audit(wid, "execution_started", ctx)
        for cond in wf.get("conditions", []):
            if not self._check_condition(cond):
                logger.info(f"[ENG] Condition failed: {name}")
                self._audit(wid, "condition_failed", cond)
                return
        ep = wf.get("error_policy", {})
        retries = ep.get("retry_count", 2)
        for i, action in enumerate(wf.get("actions", [])):
            ok = False
            for attempt in range(retries + 1):
                try:
                    self._run_action(action, wid)
                    ok = True
                    break
                except Exception as e:
                    logger.warning(f"[ENG] Action {i} attempt {attempt+1}: {e}")
                    if attempt < retries:
                        time.sleep(ep.get("retry_backoff_seconds", 3))
            if not ok:
                on_fail = ep.get("on_failure", "notify_user")
                self._audit(wid, "action_failed", {"action": action})
                if on_fail == "pause":
                    self._set_enabled(wid, False)
                return
        self._audit(wid, "execution_completed", {"actions": len(wf.get("actions", []))})
        logger.info(f"[ENG] Completed: {name}")

    def _run_action(self, action, wid):
        atype = action.get("type")
        if atype == "device_control":
            dev_id = action.get("device", "")
            cmd = action.get("command", "on")
            dev = self._sim.get_device(dev_id)
            if not dev:
                raise ValueError(f"Device not found: {dev_id}")
            if cmd in ("on", "toggle"):
                params = action.get("params") or {}
                dev.on(**{k: v for k, v in params.items() if k in ("brightness", "speed")})
            elif cmd == "off":
                dev.off()
            self._audit(wid, "action_device", {"device": dev_id, "cmd": cmd})
        elif atype == "delay":
            secs = int(action.get("seconds", 1))
            logger.info(f"[ENG] Waiting {secs}s")
            time.sleep(secs)
        elif atype == "notify":
            msg = action.get("message", "OpenClaw alert")
            logger.info(f"[NOTIFY] {msg}")
            self._audit(wid, "action_notify", {"message": msg})
        elif atype == "robot_move":
            dev_id = action.get("device", "robot_1")
            cmd = action.get("command", "forward")
            dev = self._sim.get_device(dev_id)
            if not dev:
                raise ValueError(f"Robot not found: {dev_id}")
            if cmd == "stop":
                dev.stop()
            else:
                dev.move(cmd)
                dur = (action.get("params") or {}).get("duration", 1000)
                time.sleep(dur / 1000)
                dev.stop()
            self._audit(wid, "action_robot", {"device": dev_id, "cmd": cmd})

    def _check_condition(self, cond):
        ctype = cond.get("type")
        if ctype == "time":
            now = datetime.now().strftime("%H:%M")
            after, before = cond.get("after","00:00"), cond.get("before","23:59")
            if after <= before:
                return after <= now <= before
            return now >= after or now <= before
        elif ctype == "numeric":
            field = cond.get("field","").replace("/",".")
            op = cond.get("operator","gt")
            thr = float(cond.get("value", 0))
            val = self._state.get(field)
            if val is None: return False
            val = float(val)
            return {"gt": val>thr,"lt": val<thr,"gte": val>=thr,"lte": val<=thr,"eq": val==thr}.get(op, False)
        elif ctype == "state":
            field = cond.get("field","").replace("/",".")
            return str(self._state.get(field,"")) == str(cond.get("value",""))
        return True

    def _topic_matches(self, pattern, topic):
        try:
            import paho.mqtt.client as mqtt
            return mqtt.topic_matches_sub(pattern, topic)
        except Exception:
            return pattern == topic

    def _eval_trigger_cond(self, expr, payload):
        try:
            env = {"payload": str(payload.get("detected") or payload.get("value") or ""), **payload}
            return bool(eval(expr, {"__builtins__": {}}, env))
        except Exception:
            return True

    def _cron_matches(self, cron, now):
        try:
            parts = cron.strip().split()
            if len(parts) == 5:
                return now.minute == int(parts[0]) and now.hour == int(parts[1]) and now.second < 30
            if ":" in cron:
                h, m = map(int, cron.split(":"))
                return now.hour == h and now.minute == m and now.second < 30
        except Exception:
            pass
        return False

    def _load_enabled(self):
        try:
            conn = sqlite3.connect(self._db_path)
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM workflows WHERE enabled=1").fetchall()
            conn.close()
            return [{
                "id": r["id"], "name": r["name"],
                "trigger": json.loads(r["trigger_json"]),
                "conditions": json.loads(r["conditions_json"]),
                "actions": json.loads(r["actions_json"]),
                "error_policy": json.loads(r["error_policy_json"]),
            } for r in rows]
        except Exception as e:
            logger.error(f"[ENG] Load failed: {e}")
            return []

    def _set_enabled(self, wid, enabled):
        conn = sqlite3.connect(self._db_path)
        conn.execute("UPDATE workflows SET enabled=? WHERE id=?", (int(enabled), wid))
        conn.commit()
        conn.close()

    def _audit(self, wid, event, detail):
        try:
            conn = sqlite3.connect(self._db_path)
            conn.execute("INSERT INTO audit_log (workflow_id, event, detail) VALUES (?,?,?)",
                         (wid, event, json.dumps(detail)))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"[ENG] Audit failed: {e}")