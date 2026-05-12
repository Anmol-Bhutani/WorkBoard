# WorkBoard — Next-Gen Team Task Manager

WorkBoard is a high-performance, aesthetically driven project management application built for focused teams. It features a stunning glassmorphic interface, real-time synchronization, and a custom-engineered social authentication experience.

![WorkBoard Dashboard](https://images.unsplash.com/photo-1540350394557-8d14678e7f91?auto=format&fit=crop&q=80&w=2000)

## ✨ Core Features

- 💎 **Premium Glassmorphic UI:** A state-of-the-art interface built with React and Framer Motion for ultra-smooth transitions.
- 🔐 **Social Authentication Boards:** Custom-engineered Google and GitHub account selection windows for a production-grade login experience.
- 📊 **Work Velocity Engine:** Automated project progress calculation based on task status (Todo, In Progress, In Review, Done).
- 🔄 **Lifecycle Management:** Move projects seamlessly between Active, On Hold, Completed, and Archived states.
- 🎯 **Role-Based Access:** Secure Admin and Member roles to protect workspace integrity.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Framer Motion, Lucide Icons, React Hot Toast.
- **Backend:** Node.js, Express, Prisma ORM.
- **Database:** PostgreSQL (for Production), SQLite (for Development).
- **Styling:** Vanilla CSS (Modern CSS3 Variables & Flexbox).

## 🚀 Quick Start (Development)

1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd WorkBoard
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the app:** Open [http://localhost:5173](http://localhost:5173)

## 🌐 Deployment (Production)

This application is designed to be deployed on **Railway**.

### Environment Variables Required:

**Backend:**
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure string for token signing.
- `FRONTEND_URL`: Your live frontend URL.

**Frontend:**
- `VITE_API_URL`: Your live backend API URL.

---

Built with ❤️ by **Anmol Bhutani** for the Ethara.AI Assessment.
