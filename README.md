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

## 🚀 Getting Started

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/abhishekkulbainur/Etamax2026.git
cd Etamax2026
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
# Database
MONGODB_URI=mongodb+srv://<your-db-url>

# Authentication
JWT_SECRET=your_super_secret_key

# Razorpay (Payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Admin Access
ADMIN_SECRET=your_admin_creation_secret
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

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
