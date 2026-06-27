# Medora — Enterprise Hospital ERP & EHR Suite

Medora is a modern, premium, and state-of-the-art Electronic Health Record (EMR) and Enterprise Resource Planning (ERP) platform designed for busy healthcare institutions. Engineered to digitize hospitals using paper-based or disjointed legacy software, Medora unifies operations from front-desk reception to lab diagnostics, pharmacy fulfillment, doctor consultations, and administrative auditing.

---

## 📸 Screenshots

### Walk-in Fast Track (Step 1: Database Search)
*Features iOS-style tab switching, colored initials-based avatars, and layout boundaries designed to prevent overlapping.*
![Step 1: Search Existing](screenshots/walkin-search.png)

### Walk-in Fast Track (Step 1: Quick Registration)
*Permits lightning-fast walk-in onboarding with validation-friendly field grids.*
![Step 1: Register New](screenshots/walkin-register.png)

### Walk-in Fast Track (Step 4: Token Issued)
*Renders a clean, high-contrast queue token badge for patient direction.*
![Step 4: Token Success](screenshots/walkin-success.png)

---

## 🚀 Key Modules & Capabilities

### 1. Reception Desk (`/reception`)
- **Queue Management**: Real-time arrival monitoring and live waiting status checks.
- **Fast-Track Walk-ins**: Seamless patient lookup or registration, on-duty doctor matching, slot booking, and queue token issuance in a 4-step wizard.
- **Insurance & Pre-Authorization**: High-fidelity claim submission, documentation upload, and status filtering.
- **Appointments & Day Sheet**: Chronological grids for daily rosters and cash drawer auditing.

### 2. Clinical Doctor Board (`/doctor`)
- **Patient Dossiers**: Unified electronic medical records (EMR) showcasing vitals, histories, and allergy logs.
- **Encounter Workspaces**: Chief complaints, physical exams, and dynamic order sheets.
- **Order Entry**: Immediate lab request queues, radiology ordering, and digital prescription builder.

### 3. Lab & Phlebotomy Bench (`/lab`)
- **Collection Queue**: Phlebotomy workflows for sample draws with barcode mapping.
- **Processing Analyzer**: Bench tech result entries, abnormal value flagging, and QC checks.
- **Validation & Release**: Supervisor co-sign board to review results and push files directly to EHR.
- **QC Runs & Reagents**: Levey-Jennings charts, control run logging, and low-stock reagent tracking.
- **Sample Storage**: Structured freezer grid layout matching racks to stored specimens.

### 4. Pharmacy & Supply Chain (`/pharmacy`)
- **Prescription Dispensing**: Real-time order fulfillment with batch-tracking verification.
- **Inventory & Purchase Orders**: Automated low-stock trigger rules, purchase order flow, and GRN updates.
- **Refill Management**: Ward replenishment queues and stock movement history.
- **Controlled Substances**: Double-signature logging for heavy compliance medications.

### 5. Admin & HR Portal (`/admin`)
- **Analytics & Revenue**: Hospital financial health metrics, collection trends, and branch diagnostics.
- **Roster & Occupancy**: Automated doctor shifts scheduling and bed occupancy monitor.
- **HR & Performance Dossier**: Automated staff leave tracking, performance indexes, and hike calculations.

---

## 🛠 Tech Stack

- **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [@tanstack/react-router](https://tanstack.com/router/latest) (Type-safe routing)
- **Styling**: Vanilla TailwindCSS + Custom CSS tokens (Curated OKLCH and HSL colors)
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
   *Copy the sample file and add your Supabase credentials (this is ignored by Git automatically).*
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

Environment files such as `.env`, `.env.local`, and other `.env.*` configurations are explicitly ignored in `.gitignore` to prevent any keys or configuration details from leaking to public remotes. Always use `.env.local` for local execution keys.
