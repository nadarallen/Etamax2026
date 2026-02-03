# 🚀 Etamax 2026 - Official College Fest Platform

Welcome to the official repository for **Etamax 2026**, the annual cultural and technical fest. This platform serves as the central hub for all fest activities, including event management, student registrations, payments, and administration.

![Etamax Theme](https://img.shields.io/badge/Theme-Galaxy%20%2F%20Space-purple?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-In%20Development-green?style=for-the-badge)

## 🌟 Key Features

### 👨‍🎓 For Students
- **Seamless Registration**: Sign up and login to browse all events.
- **Event Discovery**: Filter events by category (Technical, Cultural, Sports) and type (Solo, Duo, Group).
- **Team Management**: Create and manage teams for group events with a "My Teams" dashboard.
- **Secure Payments**: Integrated **Razorpay** gateway for instant online payments.
- **Live Status**: Track payment status (Confirmed/Pending) in real-time.
- **Profile**: View registered events and slots.

### 🛡️ For Admins
- **Interactive Dashboard**: Real-time statistics on total registrations, revenue, and usage.
- **Event Management**: Create, edit, and delete events with custom pricing, team sizes, and slots.
- **Slot Management**: dynamic slot allocation (Time, Venue, Day).
- **Registration Reports**: View detailed lists of registered students.
- **Export Data**: **Download PDF reports** and **Excel/CSV sheets** for every event with a single click.
- **Offline Desk**: A dedicated "Rapid Payment" mode for on-spot registrations at the college desk.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom Galaxy-themed animations.
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM).
- **Authentication**: Custom Session-based Auth with JOSE (JWT).
- **Payment**: [Razorpay](https://razorpay.com/) Integration.
- **Icons**: [Lucide React](https://lucide.dev/).
- **Utilities**: `jspdf`, `jspdf-autotable`, `framer-motion`, `zod`.

## 🚀 Getting Started (Run with Docker)

This project uses **Docker** for a consistent and easy setup. You do not need Node.js installed on your machine, only Docker Desktop.

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 2. Setup Environment
Create a `.env` file in the root directory (or rename `.env.example`).
**Critical Variables to Set:**
```env
# Database (Internal Docker)
MONGODB_URI=mongodb://mongo:27017/etamax_prod

# Secrets
NEXTAUTH_SECRET=secure_random_string
JWT_SECRET=secure_random_string

# Admin Config (For Seeding)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password

# Redis
UPSTASH_REDIS_REST_URL=http://redis-http:80
UPSTASH_REDIS_REST_TOKEN=change_this_token

# Payment (Razorpay)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
```

### 3. Run Application
Open your terminal in the project folder and run:
```powershell
docker compose up --build --scale app=1
```
*Wait for the logs to say "Ready in xms".*

### 4. Create Super Admin
Once the app is running, open this link in your browser to create the Admin account automatically:
👉 **[http://localhost/api/admin/seed](http://localhost/api/admin/seed)**

You should see: `{"success": true, ...}`.

### 5. Access the App
- **Website**: [http://localhost](http://localhost)
- **Admin Login**: [http://localhost/login](http://localhost/login) (Use credentials from `.env`)

## 📂 Project Structure

- `src/app`: Next.js App Router pages.
- `src/components`: Reusable UI components (Modals, Cards, Forms).
- `src/server-actions`: Server-side logic for DB operations (Secure).
- `src/models`: Mongoose schemas (User, Event, Team, Registration).
- `src/lib`: Utility functions (DB connection, Auth helpers).

## 🤝 Contribution

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

This project is proprietary software for **Etamax 2026**.
