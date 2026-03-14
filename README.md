# 🛡️ Protect Yourself - Cybersecurity Dashboard

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)

## 📌 Overview
**Protect Yourself** is a comprehensive, modern cybersecurity dashboard designed to simulate and display real-time threat intelligence, network anomalies, and security alerts. It features a Next.js frontend and a FastAPI backend running machine learning models for anomaly detection, spam monitoring, and phishing prevention.

## ✨ Features
- **🌐 Real-Time Threat Map:** Visualizes live cyber attacks occurring globally with interactive UI components.
- **🎣 Phishing Detection:** Machine learning-powered endpoint (simulated BERT + XGBoost) to predict phishing URLs and analyze suspicious domains.
- **📊 Security & Anomaly Logs:** Analyzes uploaded log files against known attack signatures (DDoS, SQLi, Zero-Day, etc.) and heuristic thresholds.
- **🔒 Spam Monitoring:** Tracks blocked and junk emails in real-time.
- **⚡ High-Performance Backend:** Built on Python's FastAPI and SQLAlchemy for rapid response times.
- **💻 Modern UI:** Built with Next.js App Router, Tailwind CSS, and optimized for an amazing user experience.

## 🏗️ Architecture Stack
- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite Database
- **ML Signatures:** Pre-loaded CSV datasets for various attack parameters (`DDoS`, `Botnets`, `SQL Injection`, `Zero-Day`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup (FastAPI & ML)
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
Initialize the database and start the server:
```bash
python init_db.py
python main.py
```
*The API will be available at `http://localhost:8000`*


### 2. Frontend Setup (Next.js)
Open a new terminal, navigate to the `frontend` directory:
```bash
cd frontend
npm install
```
Start the development server:
```bash
npm run dev
```
*The frontend dashboard will be available at `http://localhost:3000`*

---

## 🐳 Docker Deployment (Optional)
This project includes Docker support for easy deployment. Use `docker-compose` to spin up both the frontend and backend together.
```bash
docker-compose up --build
```

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
