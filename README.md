# Medora — Clinical Doctor EMR & EHR Workspace

Medora is a modern, premium Electronic Health Record (EMR) and clinical consulting platform designed to digitize healthcare provider workflows, patient charts, electronic prescribing, and appointment scheduling.

---

## 📸 Clinical Workspace Screenshots

*Note: All clinical portal screenshots were captured at 50% browser zoom to display the full, responsive, grid-based layout.*

### 🩺 Doctor Workspace

#### 1. Home Dashboard
*Clinician overview featuring consult queues, active patients, critical alerts panel, next-actions, and daily stats.*
![Doctor Home](screenshots/doctor-dashboard.png)

#### 2. Patient Chart / EMR
*Comprehensive patient file displaying clinical timelines, lab values, prescriptions, and an interactive 3D anatomy body map.*
![Doctor Patient EMR](screenshots/doctor-patient-emr.png)

#### 3. Patients Panel
*Hospital directory displaying all active clinic patients sorted by clinical priority, status, and alerts.*
![Doctor Patients List](screenshots/doctor-patients-list.png)

#### 4. Live Queue Board
*Interactive consultation desk tracker showing queue positions, wait durations, and check-in updates.*
![Doctor Live Queue](screenshots/doctor-live-queue.png)

#### 5. Inbox (Results to Review)
*Unified review page to inspect laboratory results, imaging files, and patient-shared diaries.*
![Doctor Inbox](screenshots/doctor-inbox.png)

#### 6. Prescribe Tool
*Build electronic prescriptions, perform medication reconciliation, and select from template protocols.*
![Doctor Prescribe](screenshots/doctor-prescribe.png)

#### 7. Schedule Grid
*View monthly, weekly, or daily visit appointments checklist.*
![Doctor Schedule](screenshots/doctor-schedule.png)

#### 8. Referrals Log
*Send, receive, and accept care transition handoffs across specialists.*
![Doctor Referrals](screenshots/doctor-referrals.png)

#### 9. Booking Slot Configurator
*Adjust consultation price fees, spacing times, and weekday active shifts.*
![Doctor Booking Slots](screenshots/doctor-booking-slots.png)

#### 10. Doctor Profile
*Manage clinical availability, review active ratings, and access technical support.*
![Doctor Profile](screenshots/doctor-profile.png)

---

## 🚀 Key Doctor Portal Modules & Functions (One-Line Summary)

- **Home Dashboard**: Central hub displaying active consultations, wait times, approvals, next actions, and clinical stats.
- **Patient Chart / EMR**: Detailed medical history view containing vital logs, diagnosis history, and a 3D body map.
- **Patients Panel**: Filterable patient directory sorting active hospital patients by clinical status.
- **Live Queue**: Real-time consultation monitor to call, pause, or check out waiting clinic queue tokens.
- **Inbox Review**: Centralized mailbox to inspect and sign off on laboratory results and patient food diary photos.
- **E-Prescriptions**: Virtual prescriber to build medication instructions and send them to the pharmacy.
- **Schedule Calendar**: Integrated scheduler for managing daily in-person and video consultations.
- **Referrals Handoff**: Dedicated coordinator to exchange inbound and outbound patient referrals.
- **Slot Manager**: Availability scheduler to adjust slot timings, consultation pricing, and clinic room.
- **Doctor Profile**: Clinician profile management screen displaying feedback metrics and support lines.

---

## 🛠 Tech Stack

- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [@tanstack/react-router](https://tanstack.com/router/latest)
- **Styling**: Vanilla TailwindCSS + Custom styling variables
- **Icons**: Lucide React
- **Notifications**: Sonner toasts

---

## ⚙️ Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/JyothirmayuduS/health-ally-pro.git
   cd health-ally-pro
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   *Copy the sample file and add your Supabase credentials (ignored by Git).*
   ```bash
   cp .env.example .env.local
   ```
   Add your keys in `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Git Policies

All `.env`, `.env.local`, and custom `.env.*` configuration files are explicitly ignored in `.gitignore` to prevent api key leaks.
