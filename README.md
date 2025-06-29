# 🚆 RailGuardian — Smart Hygiene & Maintenance System for Indian Railways

**RailGuardian** is a lightweight, AI-assisted platform designed to modernize how hygiene, maintenance, and complaint management is handled across India's train coaches — without needing complex infrastructure or passenger apps.

---

## 🧠 Problem Statement

Indian trains, despite being used by millions daily, suffer from inconsistent hygiene standards, inefficient staff monitoring, and delayed responses to passenger complaints. Existing systems are outdated, rely on manual logs, and often lack real-time accountability — especially in remote regions with poor network access.

---

## 💡 What RailGuardian Does

RailGuardian digitizes the hygiene & safety workflow with an offline-first system using:

- **QR-based checkpoints** inside train coaches for cleaning staff
- **Photo capture & AI verification** to confirm real cleaning activity
- **Offline storage** and background syncing for low-network zones
- **Automatic complaint assignment** based on QR scans by passengers
- **Smart admin dashboard** for station/zonal managers with hygiene logs and performance reports

---

## 🔧 Key Features

### 🧹 For Staff (Android App)
- Scan QR/NFC tags inside coaches to mark cleaning
- Upload real-time cleaning proof photo
- Lightweight AI model (on-device) checks for cleanliness
- Works offline with delayed sync

### 🤖 For AI Engine
- TensorFlow Lite-based model detects "clean" vs "unclean" toilet photo
- Alerts raised for fake uploads or poor-quality photos

### 🧾 For Passengers
- Scan QR code inside any coach to report issues (form-based)
- No need to download app — mobile browser interface
- Complaints are auto-assigned based on coach QR

### 📊 For Admins
- View coach-wise cleaning history
- Track staff scans and performance
- Analyze complaint heatmaps
- Export audit-ready reports

---

## 🔒 Why It Works in Real-World India

- ✅ **Offline-first** design with SQLite sync
- ✅ **No dependency on smartphone apps** for passengers
- ✅ **AI-assisted validation** to avoid fake uploads
- ✅ **Modular deployment** — works with basic Android phones
- ✅ **Compatible with SMS/USSD fallback (planned)**

---

## 🎯 Real-World Use Cases

- Cleanliness monitoring in **Shatabdi/Rajdhani** class trains
- Staff management by **OBHS contractors**
- Live dashboards for **Station Managers**
- Railway complaint digitization without a public app

---

## 🌍 Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React + Tailwind CSS        |
| Mobile App | React Native + SQLite       |
| Backend    | Node.js + MongoDB/Postgres  |
| AI         | TensorFlow Lite (tinyML)    |

---

## 🚧 Current Status

- ✅ Admin dashboard: 100% complete
- ✅ QR flow + AI photo check: 80% working prototype
- ✅ Complaint system: 70% integrated
- 🔜 Offline fallback & station map modules under progress

---

## 📽️ Demo Video (Coming Soon)

Want to see it in action? Stay tuned for a full walkthrough.  
*Pilot testing and mock demo expected in upcoming release.*

---

## 🙋‍♂️ Built By

Ayush Shrivastava, 
Nimit Aryan,
Yash Kumar Sharma. 

2nd Year BTech CSE, BML Munjal University  
Working in a team to digitize public infrastructure with minimal tech, maximum impact.

---

## 📬 Want to Collaborate?

If you're from a civic-tech org, startup, railway tech division, or government innovation body — we’d love to connect and pilot this where it matters.

---

> ⚠️ This project is intended for **educational**, **pilot**, and **early-stage deployment** purposes only.  
> The content or system does **not represent** Indian Railways or any official entity — yet.  
> All logos/trademarks used are for demonstration purposes.

---
