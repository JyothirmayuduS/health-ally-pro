# Medora — Enterprise Hospital ERP & EHR Suite

Medora is a modern, premium Electronic Health Record (EMR) and Electronic Resource Planning (ERP) platform designed to digitize healthcare workflows from front-desk reception to lab diagnostics, pharmacy fulfillment, patient engagement, and administrative auditing.

---

## 📸 Dashboard Screenshots

*Note: All dashboards and portal screenshots were captured at 50% browser zoom to display the full, responsive, grid-based administrative layout.*

### 🏢 Staff Desks

#### Reception Dashboard
*Live queue management, appointment scheduling, and front-desk actions.*
![Reception Dashboard](screenshots/reception-dashboard.png)

#### Walk-in Fast Track (Step 1: Database Search)
*Quick-search existing patients with initials-colored avatars and clean visual separations.*
![Walk-in Search](screenshots/walkin-search.png)

#### Walk-in Fast Track (Step 1: Quick Registration)
*Single-screen patient onboarding with instant grid layouts.*
![Walk-in Register](screenshots/walkin-register.png)

#### Walk-in Fast Track (Step 4: Token Issued)
*Check-in completion success screen issuing patient queues.*
![Walk-in Success](screenshots/walkin-success.png)

---

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

### 👤 Patient Portal (Medora Care)

#### 1. Care Booking
*Allows patients to search specialists, book slots instantly, and track live queue wait times.*
![Patient Care Booking](screenshots/patient-care.png)

#### 2. Clinical Records & Health
*Aggregates prescriptions, daily medication tracking logs, and historical lab reports.*
![Patient Health Records](screenshots/patient-health.png)

#### 3. Clinical Nutrition (Diet Planner)
*Provides thyroid-safe, medication-synced recipes categorized by budget tiers.*
![Patient Diet Planner](screenshots/patient-diet.png)

#### 4. Recovery Movement (Move Planner)
*Guides patient recovery with thyroid-safe physical mobility video routines.*
![Patient Move Planner](screenshots/patient-move.png)

#### 5. User Profile & Dependents
*Manages patient personal records, family dependents, and authorization consents.*
![Patient Profile](screenshots/patient-profile.png)

---

## 🚀 Key Modules & Functions (One-Line Summary)

### 🏢 Reception Portal (`/reception`)
- **Queue Dashboard**: Monitored waiting lines to track checking-in patients and on-duty doctors in real-time.
- **Walk-in Booking**: Wizard-based workflow to lookup patients or register new ones and assign queue tokens.
- **Appointments & Day Sheet**: Chronological appointment book keeping track of clinic time slots and status.
- **Insurance Claims**: Insurance lookup and pre-authorization paperwork filing status registry.
- **Vitals Desk**: Quick vitals capture modal to input blood pressure, temperature, and pulse rate.
- **Leave Request**: Portal allowing staff to check leaves and request new absences.

### 🩺 Doctor Workspace (`/doctor`)
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

### 🧪 Laboratory & Diagnostics (`/lab`)
- **Collection Queue**: Phlebotomy drawer matching sample vials to barcodes.
- **Processing Analyzer**: Workbench to log analyzer values and flag high-risk critical alerts.
- **Validation Desk**: Supervisor dashboard to double-sign off results before printing.
- **QC Run Registry**: Levey-Jennings database to trace calibration results and run quality controls.
- **Sample Storage**: Structured inventory grid showing specimen positions in freezer racks.

### 💊 Pharmacy Management (`/pharmacy`)
- **Dispensing Line**: Prescription dispatch counter verifying medication batches and patient matches.
- **Inventory Stock**: Medicine list keeping track of shelf location and tests remaining.
- **Purchase Orders**: Supplier procurement workflow generating PO drafts and recording goods received notes.
- **Controlled Drugs**: Compliance book requiring dual signatures to dispense scheduled medicines.
- **Storage Map**: Visual grid showing A-Z storage shelves to easily locate medicines.

### 📊 Admin Panel (`/admin`)
- **Analytics & Revenue**: Executive ledger showing hospital collections, OPD trends, and financial reports.
- **HR & Staffing**: Directory managing hospital staff accounts, roles, and shift configurations.
- **Doctor Roster**: Interactive calendar scheduler detailing physician duties and department coverage.
- **HR Performance**: Appraisal ledger calculating performance indices and recommending salary hikes.

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
