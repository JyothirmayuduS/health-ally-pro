# AXON / MultiSpec vs Medora — Feature tally

Reference: AXON SOFTWARE v2024.0.11 [MultiSpec] screenshots (Dr. Sahithi Dwarampudi MAIN SCREEN).

Updated: 2026-07-22

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Medora has working UI |
| 🟡 | Partial / mock / localStorage |
| ❌ | Missing |
| ➕ | **Added this round** |

---

## Top menu comparison

| AXON module | Medora equivalent | Status |
|-------------|-------------------|--------|
| Doctor | `/doctor` portal + 30+ specialty desks | ✅ |
| Reception | `/reception` | ✅ |
| Masters | **Admin → Hospital masters** | ➕ 🟡 |
| Wards | Reception admissions + nursing beds + admin OT | 🟡 |
| Accounts | Billing desk + reception billing (no GL) | 🟡 |
| Reports | Reception reports + admin registers | ➕ 🟡 |
| Others | Admin hospital-units, announcements | 🟡 |
| Customize | Admin settings, white-label | 🟡 |
| Import | No ICD/drug import wizard | ❌ |
| Utility | Docker, status API | 🟡 |
| Help / Exit | Marketing legal pages | 🟡 |

---

## Reception (AXON dropdown)

| AXON feature | Medora | Status |
|--------------|--------|--------|
| Patient registration (F5) | `/reception/register` | ✅ |
| Appointments (F2) | `/reception/appointments` | ✅ |
| Receipt (F3) | `/reception/billing` | ✅ |
| In patient view | `/reception/admissions` | ✅ |
| Indoor bill | Billing encounters | 🟡 |
| Vaccination (F4) | **`/reception/vaccination`** | ➕ |
| Vaccine stock/register | Pharmacy inventory (flu) | 🟡 |
| Address book (F6) | **`/reception/address-book`** | ➕ |
| Patient reminders / birthdays | **`/reception/reminders`** | ➕ |
| Investigations (Ctrl+I) | Doctor orders + lab desk | ✅ |
| Pending investigations | Lab validation queue | ✅ |
| SMS / WhatsApp log | Masters → comms templates | ➕ 🟡 (no live gateway) |
| Daily transaction | `/reception/day-sheet` | ✅ |

---

## Masters (AXON)

| AXON master | Medora route | Status |
|-------------|--------------|--------|
| Medicine master | Admin pharmacy formulary | ✅ |
| Diagnosis / ICD | **`/admin/masters/diagnosis`** | ➕ |
| Investigation | **`/admin/masters/investigations`** | ➕ |
| Vaccine schedule | **`/admin/masters/vaccines`** | ➕ |
| Clinical templates | Doctor Rx templates | ✅ |
| Standard OPD / Indoor Rx | Doctor templates (partial) | 🟡 |
| Advise | **`/admin/masters/advise`** | ➕ |
| Referring doctor | **`/admin/masters/referring-doctors`** | ➕ |
| Staff / employee | Admin staff | ✅ |
| SMS / Email templates | **`/admin/masters/comms`** | ➕ |
| Translations | Rx print i18n only | 🟡 |

---

## Clinical MAIN SCREEN

| AXON field | Medora | Status |
|------------|--------|--------|
| Vitals (Wt, Ht, Temp, Pulse, RR, BP, SpO₂) | Reception + nursing vitals | ✅ |
| Head circumference | **Extra vitals preset `hc`** | ➕ |
| MUAC | **Extra vitals preset `muac`** | ➕ |
| BMI / BSA auto | **`computeBmi` / `computeBsa` helpers** | ➕ |
| ICD code picker | **`IcdPicker` component** | ➕ |
| Diagnosis history | Patient history tab | 🟡 |
| Copy Rx | Doctor Rx workflow | 🟡 |
| Std Rx / templates | Doctor Rx templates | ✅ |
| View Rx / print | Prescription preview | ✅ |
| Advise | Masters advise templates | ➕ |
| Multilingual Rx | EN/HI/TE/TA print | 🟡 (UI English-only) |

---

## Reports / Registers (AXON)

| AXON register | Medora | Status |
|---------------|--------|--------|
| OPD register | **`/admin/registers` → OPD** | ➕ |
| Indoor patients | **`/admin/registers` → Indoor** | ➕ |
| Vaccine register | **`/admin/registers` + vaccination desk** | ➕ |
| Prescriptions register | **`/admin/registers` → Rx** | ➕ |
| Next visit / reminders | **`/admin/registers` + reception reminders** | ➕ |
| NABH / BSY / RSBY | Not implemented | ❌ |
| Notifiable disease | Not implemented | ❌ |
| Gynec registers | Not implemented | ❌ |
| Attendance sheet | Staff leave only | 🟡 |
| Image & document register | Patient reports archive | 🟡 |

---

## Still missing for full AXON-class HMS

These require larger builds (not in this PR):

1. **General ledger / Tally integration** — chart of accounts, AP/AR
2. **Live SMS/WhatsApp gateway** — Twilio / Meta Business API
3. **ICD import wizard** — bulk ICD-10 file upload
4. **U-WIN / government immunization reporting**
5. **RIS/PACS** — DICOM imaging
6. **NABH indicator exports**
7. **Referring doctor commission payout** in accounts
8. **Digital signature on Rx** (image upload exists in AXON customize)
9. **Full UI i18n** — Hindi/Marathi/Gujarati chrome
10. **LIS instrument interfacing**

---

## Where to find new features

- Admin hub: **http://127.0.0.1:8787/admin/masters**
- Registers: **http://127.0.0.1:8787/admin/registers**
- Reception vaccination: **http://127.0.0.1:8787/reception/vaccination**
- Reminders: **http://127.0.0.1:8787/reception/reminders**
- Address book: **http://127.0.0.1:8787/reception/address-book**

Login: `admin@oakhaven.demo` / `MedoraDemo!2026Admin` or `reception@oakhaven.demo` / `MedoraDemo!2026Front`
