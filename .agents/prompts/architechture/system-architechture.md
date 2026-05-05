You are a senior software architect.

I will provide a list of User Stories for an AI-powered EdTech system.

Your task is to design a complete system architecture and workflows based on these user stories.
<user story>

## 🎯 REQUIREMENTS

From the given User Stories, generate the following:

### 1. System Overview (High-Level Architecture)

* Identify main layers:

  * Client Layer
  * API Gateway
  * Backend Services
  * AI Agent Layer
  * Data Layer
  * Infrastructure
* Identify all components/services
* Clearly show relationships between components

👉 Output as:

* Explanation (short but clear)
* PlantUML Component Diagram (.puml)

---

### 2. Core Workflows (Business Flow)

Generate at least these flows:

* Learning / Tutor Flow
* Assessment Workflow (exam lifecycle)
* AI Chat Orchestration Flow
* Adaptive Learning Flow

👉 For each flow:

* Provide step-by-step description
* Provide PlantUML Sequence Diagram (.puml)

---

### 3. AI Agent Architecture

* Identify all agents (Orchestrator, Tutor, Assessment, Analytics, Planning, etc.)
* Define:

  * Responsibilities
  * Inputs/Outputs
  * Interaction between agents
* Explain how Orchestrator routes requests

---

### 4. Backend Service Design

* Identify services:

  * User Service
  * Course/Class Service
  * Learning Service
  * Assessment Service
  * Analytics Service
  * Notification Service
* Map each service to related User Stories

---

### 5. Data Layer Design

* Define:

  * Relational DB (what tables)
  * Vector DB (for RAG)
  * Cache (Redis)
* Explain how data flows between them

---

### 6. Event-Driven & Queue Design

* Explain where async processing is needed
* Define use cases:

  * Grading
  * Notifications
  * Analytics
* Suggest queue system (e.g., BullMQ/Kafka)

---

## 📌 OUTPUT FORMAT

Your response MUST follow this structure:

1. System Overview Explanation
2. PlantUML – System Overview
3. Workflows (each with explanation + PlantUML)
4. AI Agent Architecture
5. Backend Services Mapping
6. Data Layer Design
7. Event-driven Design

---

## ❗ IMPORTANT RULES

* Do NOT give generic explanation
* Everything MUST map back to the User Stories
* Use clear technical language
* Keep explanations concise but precise
* All diagrams MUST be valid PlantUML syntax

---

## 📥 USER STORIES

<PASTE USER STORIES HERE>

---

Generate the full system design now.
