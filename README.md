
md
Copy
Edit
# 🏥 Clinic Front Desk Management System

A full-stack **Healthcare Front Desk Management System** that allows front desk staff to manage doctors, appointments, queues, and patient interactions.  
Built with **Next.js (Frontend)**, **NestJS (Backend)**, and **PostgreSQL** (Supabase hosted).

---

## 🚀 Features

### **Authentication**
- User login & registration (JWT-based)
- Secure password hashing using bcrypt

### **Doctors Management**
- Add, edit, delete doctors
- Real-time availability check
- Next available time & status badges

### **Appointments**
- Book, cancel, and reschedule appointments
- Prevents time clashes
- View daily schedules per doctor

### **Queue Management**
- Track patient waiting queue
- Real-time updates

---

## 🛠 Tech Stack

**Frontend**
- Next.js
- TailwindCSS
- Axios
- Lucide Icons

**Backend**
- NestJS
- TypeORM
- PostgreSQL (Supabase)

---

## 📂 Project Structure

clinic/
│
├── backend/ # NestJS backend
│ ├── src/
│ ├── dist/
│ └── package.json
│
├── frontend/ # Next.js frontend
│ ├── app/
│ ├── components/
│ └── package.json
│
└── README.md

yaml
Copy
Edit

---

## ⚙️ Local Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/your-username/clinic.git
cd clinic
2. Backend Setup (NestJS)
Navigate to backend

bash
Copy
Edit
cd backend
Install dependencies

bash
Copy
Edit
npm install
Create .env file in backend folder:

env
Copy
Edit
DB_HOST=db.bhfthummtpkuttfzqhtw.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=ck8nExTZ7idPIdWE
DB_NAME=postgres
JWT_SECRET=super_secret_key
Run backend

bash
Copy
Edit
npm run start:dev
Backend will run on http://localhost:3000

3. Frontend Setup (Next.js)
Navigate to frontend

bash
Copy
Edit
cd ../frontend
Install dependencies

bash
Copy
Edit
npm install
Create .env.local in frontend folder:

env
Copy
Edit
NEXT_PUBLIC_API_URL=http://localhost:3000
Run frontend

bash
Copy
Edit
npm run dev
Frontend will run on http://localhost:3001 (or next available port).

📌 API Endpoints
Auth
POST /auth/register → Register a new user

POST /auth/login → Login and get JWT token

Doctors
GET /doctors → Get all doctors

POST /doctors → Add doctor

DELETE /doctors/:id → Delete doctor

GET /doctors/:id/schedule → Get doctor's availability

Appointments
POST /appointments → Create appointment

PATCH /appointments/:id/reschedule → Reschedule appointment

GET /appointments/check → Check availability

🔒 Security
All passwords hashed using bcrypt

JWT authentication for protected routes

CORS enabled for frontend-backend communication

👨‍💻 Author
Vilas C.P
📧 Email: vilaspgowda1000@gmail.com

📜 License
MIT License