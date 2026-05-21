# 📄 Federal-SLM-System

> **Privacy-Preserving Federated Document Intelligence Platform using OCR, Small Language Models (SLM), Federated Learning, and Blockchain Auditing**

---

## 🚀 Overview

**Federal-SLM-System** is an advanced AI-powered document intelligence platform designed for organizations handling sensitive documents such as healthcare records, legal files, insurance claims, research datasets, and financial reports.

The system extracts structured insights from scanned documents using **PaddleOCR** and **Small Language Models (SLM)** while ensuring that sensitive data never leaves the organization.

Unlike traditional centralized AI systems, this platform uses:

* **Federated Learning** for collaborative model training
* **Blockchain-based audit logging** for immutable transparency
* **Privacy-preserving analytics**
* **Role-based secure access**
* **OCR + AI-powered semantic extraction**

The platform enables multiple organizations to collaboratively improve AI models **without sharing raw data**.

---

## ✨ Key Features

* 📄 OCR-based document extraction using PaddleOCR
* 🧠 Structured semantic understanding using Ollama + LangChain
* 🤝 Federated Learning with Flower (FedAvg)
* 🔐 Privacy-preserving architecture
* ⛓️ Blockchain-powered audit logging
* 📊 Analytics dashboards and training management
* 👥 Multi-role authentication system
* 🏢 Organization-based data isolation
* ⚡ FastAPI microservice architecture
* 📦 Docker-ready deployment support

---

# 🏗️ System Architecture

The platform consists of multiple integrated subsystems:

```text
Frontend (React + Vite)
        │
        ▼
FastAPI Backend API
        │
 ┌───────────────┬─────────────────┐
 ▼               ▼                 ▼
OCR Service   SLM Pipeline    Federated Learning
(PaddleOCR)   (Ollama)        (Flower)
        │
        ▼
Blockchain Audit Logger
        │
        ▼
Database + File Storage
```

---

# 🧩 Core Components

## 1️⃣ Frontend Dashboard

Built using:

* React 19
* Vite
* TailwindCSS
* Zustand
* Axios
* Framer Motion
* Recharts

### Supported Roles

| Role       | Features                                            |
| ---------- | --------------------------------------------------- |
| ADMIN      | User approval, schema management, blockchain viewer |
| ORG        | Upload documents, train models, manage datasets     |
| RESEARCHER | Analytics, model testing, insight viewing           |

---

## 2️⃣ FastAPI Backend

The backend acts as the central orchestration layer.

### Responsibilities

* Authentication & authorization
* Document ingestion
* OCR coordination
* SLM processing
* Federated training orchestration
* Blockchain logging
* Dataset management

---

## 3️⃣ OCR Microservice

Uses **PaddleOCR** to extract:

* Text
* Tables
* Layouts
* Handwritten content

### Technologies

* PaddleOCR
* OpenCV
* Pillow
* NumPy

---

## 4️⃣ SLM Pipeline

The system uses:

* Ollama
* LangChain
* gemma3:2b

### Extraction Modes

| Mode              | Description                       |
| ----------------- | --------------------------------- |
| Numeric Fast Path | Regex-based structured extraction |
| Schema-Driven LLM | AI-based semantic extraction      |

---

## 5️⃣ Federated Learning

Implemented using **Flower (flwr)**.

### Features

* Privacy-preserving training
* FedAvg aggregation
* Multi-organization collaboration
* Local-only dataset training
* Dynamic feature handling

---

## 6️⃣ Blockchain Audit System

Every critical action is logged on a custom blockchain.

### Logged Events

* Document processing
* Model updates
* Federated aggregation
* Training initialization

### Security Features

* SHA-256 hashing
* Proof-of-Work
* Cryptographic signatures
* Immutable logs

---

# 🔄 Complete Data Flow

```text
Document Upload
        ▼
OCR Extraction
        ▼
SLM Semantic Analysis
        ▼
Structured JSON Generation
        ▼
Dataset Storage
        ▼
Federated Training
        ▼
Global Model Aggregation
        ▼
Blockchain Audit Logging
```

---

# 🧠 AI & ML Workflow

## OCR Extraction

```text
Image/PDF
   ▼
PaddleOCR
   ▼
Raw Text
```

---

## SLM Semantic Understanding

```text
OCR Text
   ▼
LangChain Prompt
   ▼
Ollama (gemma3:2b)
   ▼
Structured JSON Output
```

---

## Federated Learning

```text
Global Model
    ▼
Organization Nodes
    ▼
Local Training
    ▼
Encrypted Weight Updates
    ▼
FedAvg Aggregation
    ▼
Updated Global Model
```

---

# 📂 Project Structure

```text
Federal-SLM-System/
│
├── backend/
│   ├── api/
│   ├── services/
│   ├── blockchain/
│   ├── storage/
│   └── models/
│
├── frontend/
│   ├── src/
│   ├── pages/
│   ├── components/
│   └── store/
│
├── federated/
│   ├── server/
│   └── client/
│
├── ocr_service/
│
├── docker/
│
└── requirements/
```

---

# 🗃️ Database Schema

## Main Tables

| Table          | Purpose                    |
| -------------- | -------------------------- |
| Users          | Authentication & roles     |
| Documents      | Uploaded document metadata |
| OCRResults     | Extracted OCR text         |
| SLMInsights    | Structured AI outputs      |
| SchemaConfig   | Dynamic schemas            |
| BlockchainLogs | Immutable audit records    |

---

# 🔐 Security Architecture

## Authentication

* JWT-based authentication
* bcrypt password hashing
* Role-based authorization

## Privacy

* Local-only document storage
* Federated training
* Secure aggregation
* Blockchain verification

## Recommended Production Enhancements

* HTTPS enforcement
* Strong JWT secrets
* Rate limiting
* Differential privacy integration

---

# ⚙️ Technology Stack

## Frontend

| Technology  | Purpose           |
| ----------- | ----------------- |
| React 19    | UI                |
| TailwindCSS | Styling           |
| Zustand     | State management  |
| Axios       | API communication |
| Recharts    | Analytics         |

---

## Backend

| Technology | Purpose           |
| ---------- | ----------------- |
| FastAPI    | REST API          |
| SQLAlchemy | ORM               |
| Pydantic   | Validation        |
| LangChain  | LLM orchestration |
| Ollama     | Local LLM runtime |
| PyTorch    | ML training       |

---

## AI & Federated Learning

| Technology | Purpose            |
| ---------- | ------------------ |
| PaddleOCR  | OCR engine         |
| Flower     | Federated learning |
| PyTorch    | Neural networks    |
| NumPy      | Tensor operations  |

---

# 📡 API Endpoints

## Authentication

```http
POST /auth/register
POST /auth/login
```

## Document Processing

```http
POST /documents/upload
POST /ocr/extract
POST /slm/analyze
```

## Federated Learning

```http
POST /federated/train
GET /federated/status
```

## Blockchain

```http
GET /blockchain/logs
GET /blockchain/chain
```

---

# 🖥️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/thanushshetty9353/Federal-SLM-System.git
cd Federal-SLM-System
```

---

## 2️⃣ Install Backend Dependencies

```bash
pip install -r requirements_backend.txt
```

---

## 3️⃣ Install OCR Dependencies

```bash
pip install -r requirements_ocr.txt
```

---

## 4️⃣ Install Federated Learning Dependencies

```bash
pip install -r requirements_fl.txt
```

---

## 5️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

# ▶️ Running the System

## Start Ollama

```bash
ollama serve
ollama pull gemma3:2b
```

---

## Start OCR Service

```bash
uvicorn ocr_service.app:app --port 9001
```

---

## Start Backend

```bash
uvicorn backend.main:app --reload --port 8000
```

---

## Start Frontend

```bash
cd frontend
npm run dev
```

---

## Start Federated Server

```bash
python -m federated.server.server
```

---

## Start Federated Client

```bash
python -m federated.client.client 1
```

---

# 🐳 Docker Deployment

Docker Compose support is included.

```bash
docker-compose up --build
```

---

# 📊 Use Cases

## 🏥 Healthcare

* Medical record intelligence
* Cancer diagnostics
* Clinical report analysis

## 🏦 Finance

* Financial document extraction
* Fraud analysis
* Secure collaborative AI

## ⚖️ Legal

* Contract intelligence
* Legal document analysis
* Compliance tracking

## 🧪 Research

* Multi-institution collaboration
* Privacy-preserving AI research

---

# 👨‍💻 Author

## Thanush Shetty

📧 Email:
`thanushshetty7@gmail.com`

🌐 Portfolio:
[thanush-shetty-portfolio.vercel.app](https://thanush-shetty-portfolio.vercel.app/?utm_source=chatgpt.com)

---

# 📜 License

This project is intended for educational, research, and enterprise innovation purposes.

---

# 🙌 Acknowledgements

Special thanks to the open-source communities behind:

* PaddleOCR
* FastAPI
* Flower
* PyTorch
* LangChain
* Ollama
* React

---

# ⭐ Final Note

**Federal-SLM-System** demonstrates how modern AI, federated learning, privacy-preserving analytics, and blockchain auditing can be combined into a powerful real-world intelligent document processing platform.

This project focuses on:

* Data privacy
* Secure AI collaboration
* Intelligent automation
* Scalable architecture
* Transparent auditing
