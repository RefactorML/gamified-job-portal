# 🎯 Gamified Job Portal with Points Ecosystem

A modern job portal built with a gamified experience to motivate students through task-based point rewards, while providing recruiters with an efficient hiring dashboard and admins with full platform control.

## 🚀 Project Objective

Create a dual-role platform that:
- Encourages **students** to complete career-building tasks by awarding points.
- Allows **recruiters** to post jobs and track applicants.
- Enables **admins** to manage and monitor all platform activity.
  
All users interact with a **points ecosystem** that drives engagement through rewards and achievements.

---

## 🧩 Core Features

### ✅ Authentication System
- **Google OAuth via NextAuth.js** (no Clerk)
- **Role-based Access Control:**
  - Student
  - Recruiter
  - Admin

---

### 🎓 Student Portal

#### 📊 Dashboard
- Displays total points, rank, and progress toward the next milestone.
- Optional: Badge system for milestone completions.
- Quick links to: Tasks, Referrals, Applied Jobs, Resume Upload

#### 🎮 Gamified Tasks
| Task               | Points | Description                                            |
|--------------------|--------|--------------------------------------------------------|
| Daily Sign-in      | 10     | Earn daily login reward                               |
| Refer a Peer       | 200    | Earn when referral signs up via unique link           |
| Apply for a Job    | 5      | Earn points on successful job applications            |
| Upload Resume      | 20     | Upload or update profile resume                       |
| Complete Profile   | 50     | Fill all required profile fields                      |

#### 📋 Job Board
- Active job listings with filter/search capabilities.
- Apply button triggers points award upon application.

#### 🤝 Referrals
- Generate & share a unique referral code/link.
- Track successful vs. pending referrals and earned points.

---

### 💼 Recruiter Dashboard
- Post and manage job listings.
- View applicants with filters (Points, Skills).
- Optional: Premium listings via **Razorpay** (India) and **Stripe** (International).

---

### 🛠️ Admin Panel
- **User Management**: View, edit, or delete student/recruiter accounts.
- **Task Configuration**: Create/edit tasks, set custom points.
  - Optional: Configure bonus milestones (e.g., 5000 pts = Premium Badge)
- **Job Management**: Approve or remove job postings.
- **Analytics Dashboard**:
  - Daily active users
  - Total points awarded
  - Referral conversions
  - Task completion metrics

---

### 🏆 Task Points Leaderboard
- Real-time leaderboard filtered by:
  - Skills (e.g., Frontend, DevOps)
  - College/University
  - Experience Level
  - Referrals

---

## 🛡️ Non-Functional Requirements
- **Responsive Design**: Mobile-first & accessible layout
- **Security**: Role-based access, input sanitization, secure APIs
- **Performance**: Lazy-loaded images, server-side data fetching (Next.js)
- **Scalability**: Optimized MongoDB schema for high performance

---

## 🧰 Tech Stack

| Layer         | Technology                            |
|---------------|----------------------------------------|
| Frontend      | React.js, TypeScript, Tailwind CSS (Optional: ShadCN UI) |
| State Mgmt    | Context API                            |
| Backend       | Node.js, MongoDB                       |
| Auth          | NextAuth.js (Google OAuth)             |
| Payments      | Razorpay (IN), Stripe (INTL)           |
| Deployment    | Vercel or AWS                          |

---

## 📦 Deliverables

1. **GitHub Repository**  
   - Public access  
   - Well-documented README  
   - Meaningful commits  
   - `.env.example` file for environment variables  

2. **Live Demo**  
   - Hosted on [Vercel](https://vercel.com) or AWS  
   - Public landing page  
   - Login options for student & recruiter  
   - Functional: Tasks, Referrals, Job Board, Admin Panel, Leaderboard

3. **Project Write-Up (Markdown or PDF)**  
   Includes:
   - 📄 **Data Models**: User, Task, Referral, Job, Application  
   - 🧠 **Context API Structure**  
   - 🔐 **NextAuth Role Handling**  
   - ☁️ **AWS Integrations** (if applicable)  
   - 🧩 **Key Challenges & Solutions**

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gamified-job-portal.git
cd gamified-job-portal
