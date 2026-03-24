# 🧠 OpenClaw AI Automation Platform (Master Context)

## 📌 Project Overview

This project is an **AI-powered no-code automation platform** built on top of OpenClaw.

- OpenClaw acts as the **execution engine**
- This platform acts as the **user interface + orchestration layer**

### 🎯 Goal

To enable users to:
- Create IoT and robotics automations using **chat (AI)**
- Edit and visualize workflows using a **drag-and-drop builder**
- Execute automations via **OpenClaw skills**
- Simulate and control devices (with or without hardware)

---

## 🧠 Core Concept

> "Talk → Workflow → Execution"

User describes automation → AI converts to structured workflow → System executes via OpenClaw.

---

## 🏗️ System Architecture

### 1. Frontend Layer

Components:
- Chat Interface (AI-first interaction)
- Visual Workflow Builder (editable flows)
- Dashboard (device + system state)
- Event Timeline (logs)

Key Principle:
- Frontend NEVER directly communicates with OpenClaw
- Always goes through backend

---

### 2. AI Layer

Responsibilities:
- Convert natural language → workflow JSON
- Suggest improvements
- Assist user interaction

Important Rule:
- AI does NOT execute actions
- AI only generates/modifies workflows

---

### 3. Backend (Core System)

#### Modules:

##### a. Workflow Manager
- Store workflows
- CRUD operations
- Versioning
- Enable/disable

##### b. Execution Engine
- Runs workflows
- Supports:
  - Triggers
  - Conditions
  - Multiple actions
  - Delays
  - State-based logic

##### c. Event Bus
- Handles all events (sensor + internal)
- Options:
  - MQTT (recommended)
  - Redis Pub/Sub

##### d. OpenClaw Adapter
- Bridge between system and OpenClaw

```python
class OpenClawAdapter:
    def run_action(action):
        pass
```

##### e. State Manager
- Tracks:
  - Device states
  - Sensor values
  - Robot status

##### f. Simulation Engine
- Simulated sensors:
  - Motion
  - Temperature
  - Soil moisture
- Simulated devices:
  - Light
  - Fan
  - Robot

---

### 4. OpenClaw Layer

- Handles execution of actions
- Uses skills

Flow:
Backend → OpenClaw → Skill → Device

---

### 5. Device Layer

Modes:

#### Simulation Mode
- Virtual devices
- Used for development/demo

#### Real Device Mode
- ESP32
- Raspberry Pi
- Robots

Communication:
- MQTT (preferred)
- HTTP fallback

---

### 6. Data Layer

Database:
- SQLite (initial)
- PostgreSQL (later)

Stores:
- Workflows
- Logs
- Device states

---

## 🔄 System Flows

### Chat → Automation

User → Chat → AI → Workflow JSON → Backend → Execution Engine

### Event → Action

Sensor/Event → Event Bus → Execution Engine → OpenClaw Adapter → Device

---

## 🧩 Workflow Schema

```json
{
  "name": "Example",
  "trigger": {},
  "conditions": [],
  "actions": []
}
```

---

## 🔥 Supported Workflow Features

- Event triggers
- Conditions (time, numeric, state)
- Delays
- Multiple actions
- Mode/state-based logic
- Robotics actions
- Notifications

---

## 🧪 Example Workflows

### 1. Night Lighting
- Motion → after 10PM → light ON → delay → OFF

### 2. Temperature Cooling
- Temp > 30 → fan ON + notify

### 3. Security Mode
- If mode active + motion → lights + camera + alert

### 4. Robot Obstacle Avoidance
- Obstacle → stop → turn

### 5. Smart Irrigation
- Moisture low + morning → pump ON → delay → OFF

---

## 🎯 MVP Scope

### Must Have:
- Chat → workflow generation
- Visual builder (basic)
- Execution engine
- Simulation system
- OpenClaw adapter
- Dashboard

### Not in MVP:
- Marketplace
- Multi-user
- Cloud sync

---

## ⚡ Tech Stack

Backend:
- FastAPI (Python)

Frontend:
- React / Next.js

Event System:
- Python async → MQTT later

Database:
- SQLite → PostgreSQL

Simulation:
- Python classes

---

## 🧠 Key Design Principles

1. Decouple from OpenClaw (use adapter)
2. Event-driven architecture
3. Simulation-first development
4. AI assists, does not execute

---

## 🚀 Development Roadmap

### Week 1
- Backend skeleton
- Workflow schema
- Simulation engine

### Week 2
- Execution engine
- Event system

### Week 3
- AI workflow generation
- OpenClaw integration

### Week 4
- Frontend (chat + builder)
- Dashboard

---

## 💥 Product Vision

A unified platform combining:
- Chat-based automation
- Visual workflow editing
- IoT + robotics control
- AI-assisted creation

---

## 🔮 Future Features

- AI suggestions
- Context awareness
- Mobile app
- Skill marketplace
- Cloud sync
- Robotics advanced control

---

## 🧠 Summary

This system transforms:

User intent → Structured workflows → Real-world automation

Built on:
- OpenClaw (execution)
- AI (creation)
- Event system (logic)
- Simulation (development)

