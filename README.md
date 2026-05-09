# 👨‍🏫 Faculty Substitute System - KIIT University

A mobile application for KIIT University faculty members to request and manage substitute teachers when they are unable to take their scheduled classes.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## 📱 Features

### For Faculty Members
- **🔐 Authentication**: Secure login/registration with KIIT email (@kiit.ac.in)
- **📝 Request Substitute**: Create requests when unable to take a class
- **📁 My Requests**: View and manage your own substitute requests
- **📋 View Requests**: See available requests from other faculty and accept them
- **❌ Cancel Requests**: Cancel pending requests if no longer needed

### App Highlights
- 📅 Native date picker (calendar popup)
- 🕐 Native time picker with 12-hour AM/PM format
- 👁️ Password visibility toggle
- 📱 Optimized for Android & iOS
- 🎨 Professional UI designed for faculty (30-55 age group)
- ☰ Hamburger menu with profile & logout

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React Native, Expo SDK 54, TypeScript |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Supabase Auth with email verification |
| **Navigation** | Expo Router v6 |

## 🏗️ System Architecture (Proper Design)

Formal architecture artifacts are available in [docs/architecture/system-design.md](docs/architecture/system-design.md).

![Faculty Substitute System Architecture](docs/architecture/system-design.svg)

Downloadable files:
- [SVG Diagram](docs/architecture/system-design.svg)
- [PNG Diagram](docs/architecture/system-design.png)
- [Mermaid Source](docs/architecture/system-design.mmd)

## 📂 Project Structure

```
Faculty_app/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Main application entry
│   ├── database.py            # Supabase connection
│   ├── models.py              # Pydantic models
│   ├── routes/                # API routes
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── requests.py       # Substitute request endpoints
│   │   └── users.py          # User management endpoints
│   ├── database/
│   │   └── schema.sql        # Database schema
│   └── requirements.txt       # Python dependencies
│
└── faculty-app/               # React Native Frontend
    ├── app/                   # Screens (Expo Router)
    │   ├── _layout.tsx       # Root layout
    │   ├── index.tsx         # Home screen
    │   ├── login.tsx         # Login screen
    │   ├── register.tsx      # Registration screen
    │   ├── request-substitute.tsx  # Create request form
    │   ├── my-requests.tsx   # User's requests list
    │   └── view-requests.tsx # Available requests list
    ├── context/
    │   └── AuthContext.tsx   # Authentication state
    ├── services/
    │   └── api.ts            # API communication layer
    └── package.json          # Node dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Expo Go app on your mobile device
- Supabase account

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server (accessible from mobile devices)
uvicorn main:app --reload --host 0.0.0.0
```

### Frontend Setup

```bash
# Navigate to frontend
cd faculty-app

# Install dependencies
npm install

# Start Expo
npx expo start
```

### Configure Mobile Connection

1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Update `faculty-app/services/api.ts`:
   ```typescript
   const LOCAL_IP = 'YOUR_COMPUTER_IP'; // e.g., '192.168.1.100'
   ```

3. Scan QR code with Expo Go app

## 📸 Screenshots

| Home Screen | Request Form | My Requests |
|-------------|--------------|-------------|
| Welcome screen with action cards | Create substitute request | View & manage your requests |

## 🔑 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new faculty |
| POST | `/api/auth/login` | Login with credentials |
| GET | `/api/requests/` | Get all pending requests |
| POST | `/api/requests/` | Create new substitute request |
| GET | `/api/requests/teacher/{id}/` | Get user's requests |
| PUT | `/api/requests/{id}/accept/` | Accept a request |
| PUT | `/api/requests/{id}/cancel/` | Cancel a request |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👨‍💻 Authors

**Utkarsh Nigam**
- GitHub: [@UtkarshNigam11](https://github.com/UtkarshNigam11)

**Sujoy Dutta**
- GitHub: [@dutta-sujoy](https://github.com/dutta-sujoy)

## 📄 License

This project is for educational purposes at KIIT University.

---

<p align="center">Made with ❤️ for KIIT Faculty</p>
