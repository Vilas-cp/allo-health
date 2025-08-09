🏥 Clinic Front Desk Management SystemA full-stack Healthcare Front Desk Management System that helps clinics manage doctors, patients, appointments, and queues efficiently.The backend is powered by NestJS and hosted on AWS, and the frontend is built with Next.js.The database is hosted on Supabase PostgreSQL.

🚀 Features

*   User Authentication — Login & Registration using JWT.
    
*   Doctor Management — Add, edit, delete doctors.
    
*   Real-Time Availability — Check doctor availability and next available slot.
    
*   Appointment Management — Book, cancel, reschedule with time clash prevention.
    
*   Queue Tracking — Monitor patients waiting in real time.
    

🛠 Tech Stack

Frontend:

*   Next.js
    
*   TailwindCSS
    
*   Axios
    
*   Lucide Icons
    

Backend:

*   NestJS
    
*   TypeORM
    
*   PostgreSQL (Supabase)
    
*   Hosted on AWS EC2
    

📂 Project Structure
clinic/
│
├── backend/ # NestJS backend (AWS hosted)
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

⚙️ Running the Project Locally

In production, the backend API runs on AWS.These steps let you run both backend and frontend locally for development.

1️⃣ Clone the Repositorygit clone [https://github.com/your-username/clinic.git](https://github.com/your-username/clinic.git)cd clinic

2️⃣ Backend Setup (NestJS)cd backendnpm install

Create .env inside the backend folder:DB\_HOST=DB\_PORT=DB\_USERNAME=DB\_PASSWORD=DB\_NAME=JWT\_SECRET=

Run the backend:npm run start:devBackend runs on [http://localhost:3000](http://localhost:3000)

3️⃣ Frontend Setup (Next.js)cd ../frontendnpm install

Create .env.local inside the frontend folder:

For Local BackendNEXT\_PUBLIC\_API\_URL=[http://localhost:3000](http://localhost:3000)

(Optional) For AWS BackendNEXT\_PUBLIC\_API\_URL=https://your-aws-backend-url.com

Run the frontend:npm run devFrontend runs on [http://localhost:3001](http://localhost:3001) (or next available port).

📌 Main API Endpoints

Auth:

*   POST /auth/register → Register a new user
    
*   POST /auth/login → Login and get JWT token
    

Doctors:

*   GET /doctors → List all doctors
    
*   POST /doctors → Add new doctor
    
*   DELETE /doctors/:id → Delete doctor
    
*   GET /doctors/:id/schedule → Check doctor's availability
    

Appointments:

*   POST /appointments → Book appointment
    
*   PATCH /appointments/:id/reschedule → Reschedule
    
*   GET /appointments/check → Check availability
    

🔒 Security

*   bcrypt password hashing
    
*   JWT authentication for protected APIs
    
*   CORS enabled for frontend-backend communication
    

🌐 Production Info

*   Backend: Hosted on AWS EC2
    
*   Database: Supabase PostgreSQL
    
*   Frontend: Can be hosted on Vercel/Netlify (connects to AWS backend)
    

👨‍💻 AuthorVilas C.P📧 vilaspgowda1000@gmail.com

📜 LicenseMIT License