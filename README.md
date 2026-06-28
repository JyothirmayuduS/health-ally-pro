# Medora — Enterprise Hospital ERP & EHR Suite

Medora is a modern, premium, Electronic Health Record (EMR) and Enterprise Resource Planning (ERP) platform designed to digitize healthcare workflows from front-desk reception to lab diagnostics, pharmacy fulfillment, patient engagement, and administrative auditing.

---

## 📸 Dashboard Screenshots

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

### 👤 Patient Portal (Medora Care)
*The following screenshots showcase the mobile-responsive patient dashboard taken at 50% browser zoom.*

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
- **Consultation Queue**: Doctor's dashboard showing checking-in patients assigned to them for active encounters.
- **Patient EMR**: Patient history logs displaying diagnostic records, vitals graphs, and medication archives.
- **E-Prescriptions**: Virtual prescriber to build medication instructions and send them to the pharmacy.
- **Order Panel**: Clinic order workspace to request lab tests and radiology imaging from inside encounters.

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
