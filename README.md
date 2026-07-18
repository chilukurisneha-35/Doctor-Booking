# MedConnect - Book a Doctor App

MedConnect is a full-stack healthcare booking platform designed to streamline patient-to-provider connectivity. By offering dynamic specialist browsing, secure real-time slot scheduling, secure medical record storage, and role-based dashboards, the platform significantly reduces administrative overhead and improves patient-doctor collaboration.

Developed as a modern full-stack web application using the **MERN (MongoDB, Express, React, Node.js)** technology stack.

---

## 👥 Project Team
* **Shanmukha Venkata Vardhan Thatavarthy** (Team Lead)
* **Yemineni Kavya** (Member)

---

## 📂 Phase-Wise Project Documentation
Detailed documentation corresponding to each phase of the project lifecycle is included in this repo under [`/documentation`](./documentation):

1. 💡 **[Phase 1: Brainstorming & Ideation](./documentation/1_Brainstorming_and_Ideation)**
   * Problem statement selection, idea brainstorming/prioritization matrix, Patient/Doctor/Admin problem statements, and Empathy Map Canvas.
2. 📋 **[Phase 2: Requirement Analysis](./documentation/2_Requirement_Analysis)**
   * Data Flow Diagrams, functional & non-functional requirements, and technology stack rationale.
3. 📐 **[Phase 3: Project Design](./documentation/3_Project_Design)**
   * Problem-solution fit, proposed solution, and solution architecture.
4. 📅 **[Phase 4: Project Planning](./documentation/4_Project_Planning)**
   * Sprint planning and delivery schedule.
5. 🧪 **[Phase 5: User Acceptance Testing (UAT)](./documentation/5_User_Acceptance_Testing)**
   * UAT test cases and functional specification sign-off.

Also included: the [MERN stack write-up](./documentation/Full%20Stack%20Development%20With%20MERN%20document.pdf).

Demo videos (frontend, backend, and full walkthrough) are too large to host in this repo — they're available here: https://drive.google.com/drive/folders/1MLTuhBKXx4XQcoT5XnJbsmydUAb3fFJ3?usp=sharing

---

## 🛠️ Technology Stack
* **Frontend:** React.js, Vite, Vanilla CSS (Glassmorphism, CSS Variable dynamic themes), Lucide Icons.
* **Backend:** Node.js, Express.js (REST API).
* **Database:** MongoDB (NoSQL), Mongoose ODM.
* **Storage:** Local Filesystem (configured dynamically via Multer).
* **Authentication:** Stateless JSON Web Tokens (JWT), Bcrypt password encryption.

---

## 📂 Folder Structure
```
smartbridge project/
├── backend/
│   ├── config/
│   │   └── db.js            # Mongoose MongoDB connection config
│   ├── middleware/
│   │   └── authMiddleware.js # JWT & Role authorization checks
│   ├── models/
│   │   ├── Appointment.js   # Booking appointments
│   │   ├── DoctorProfile.js # Doctor specialties & available slots
│   │   ├── Document.js      # Patient uploaded medical files metadata
│   │   ├── Notification.js  # Alarm notification logs
│   │   └── User.js          # Main auth accounts (bcrypt pre-save hook)
│   ├── routes/
│   │   ├── admins.js        # Admin endpoints (approvals & statistics)
│   │   ├── auth.js          # Authentication (register, logins, profile check)
│   │   ├── doctors.js       # Doctor controls (slots, review documents, prescriptions)
│   │   └── patients.js      # Patient controls (booking, document uploads, alerts)
│   ├── scripts/
│   │   └── verify_connection_and_auth.js # Database programmatic test validator
│   ├── uploads/             # Physical storage folder for uploaded records
│   ├── .env                 # Environment variables config
│   ├── package.json         # Backend node packages
│   └── server.js            # Express entry application driver
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx   # Role-based dashboard navigation panel
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx  # Admin page controls
│   │   │   ├── DoctorDashboard.jsx # Doctor page controls
│   │   │   ├── Login.jsx           # Sign in page
│   │   │   ├── PatientDashboard.jsx# Patient page controls
│   │   │   └── Register.jsx        # Account registration
│   │   ├── App.jsx          # Root client coordinator
│   │   ├── AuthContext.jsx  # React state store for user sessions & JWTs
│   │   ├── index.css        # Glassmorphic custom CSS rules
│   │   └── main.jsx         # App bootstrapping
│   ├── index.html           # Document shell
│   ├── package.json         # Client package dependencies
│   └── vite.config.js       # Vite server proxy configurations
```

---

## 🚀 Setup & Launch Instructions

### Prerequisites
* Install [Node.js](https://nodejs.org/) (v16.0.0 or above).
* Install and run [MongoDB Community Server](https://www.mongodb.com/try/download/community) locally at `mongodb://127.0.0.1:27017`.

### 1. Backend Server Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your own values (this file is gitignored and never committed):
   ```bash
   cp .env.example .env
   ```
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/book_a_doctor
   JWT_SECRET=replace_this_with_a_long_random_secret
   ADMIN_SEED_EMAIL=admin@doctor.com
   ADMIN_SEED_PASSWORD=replace_this_with_a_strong_password
   ```
4. Start the Express development server:
   ```bash
   npm start
   ```
   *Note: On initial boot, if no admin account exists yet, the server seeds one using `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` from your `.env`. If those aren't set, seeding is skipped.*

### 2. Frontend client Setup
1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite React client environment:
   ```bash
   npm run dev
   ```
4. Access the web application on: `http://localhost:3000` (or the local numerical address `http://127.0.0.1:3000`).

---

## 🧪 API Verification & Testing

### Programmatic Integration Test
We have implemented a Node.js integration script to test database connectivity, pre-save encryption, model schemas, and login matching.
1. Run the test script inside the `backend` folder:
   ```bash
   node scripts/verify_connection_and_auth.js
   ```
2. On successful verification, the console will print:
   `Backend Integration Code Verification: SUCCESS!`

### Production Frontend Build Check
Verify client files compilation and asset bundles:
```bash
cd frontend
npm run build
```
On successful build, Vite will compile assets into the `/dist` directory.
