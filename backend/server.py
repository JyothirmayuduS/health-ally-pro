"""Medora Lab Portal — FastAPI backend.

Provides:
- Emergent Google OAuth session exchange + cookie auth
- Role-based access (lab_supervisor / lab_technician / doctor / receptionist)
- Lab order CRUD (replaces/syncs with frontend mock store) including doctor & reception entry points
- Catalog & patient lookups
- Reports / analytics endpoints
"""
from __future__ import annotations

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any

import requests
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, status
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("medora.lab")

# ---------------------------------------------------------------------------
# Mongo
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

USERS = db.users
SESSIONS = db.user_sessions
ORDERS = db.lab_orders
PATIENTS = db.lab_patients

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

ROLES = {"lab_supervisor", "lab_technician", "doctor", "receptionist"}

# ---------------------------------------------------------------------------
# Catalog (server-side reference)
# ---------------------------------------------------------------------------
LAB_CATALOG: List[Dict[str, Any]] = [
    {"code": "CBC", "name": "Complete Blood Count", "section": "hematology",
     "sample_type": "Whole blood (EDTA)", "tube": "Lavender", "tat_hours": 2, "fasting": False, "price": 18,
     "parameters": [
         {"key": "WBC", "label": "White Blood Cells", "unit": "10^9/L", "ref_low": 4.0, "ref_high": 11.0, "critical_low": 2.0, "critical_high": 30.0},
         {"key": "RBC", "label": "Red Blood Cells", "unit": "10^12/L", "ref_low": 4.2, "ref_high": 5.9},
         {"key": "HGB", "label": "Hemoglobin", "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.5, "critical_low": 7.0, "critical_high": 20.0},
         {"key": "HCT", "label": "Hematocrit", "unit": "%", "ref_low": 36, "ref_high": 52},
         {"key": "PLT", "label": "Platelets", "unit": "10^9/L", "ref_low": 150, "ref_high": 400, "critical_low": 50, "critical_high": 1000},
     ]},
    {"code": "LIPID", "name": "Lipid Panel", "section": "biochemistry",
     "sample_type": "Serum", "tube": "Gold (SST)", "tat_hours": 4, "fasting": True, "price": 32,
     "parameters": [
         {"key": "TC", "label": "Total Cholesterol", "unit": "mg/dL", "ref_low": 0, "ref_high": 200},
         {"key": "LDL", "label": "LDL Cholesterol", "unit": "mg/dL", "ref_low": 0, "ref_high": 130},
         {"key": "HDL", "label": "HDL Cholesterol", "unit": "mg/dL", "ref_low": 40, "ref_high": 100},
         {"key": "TG", "label": "Triglycerides", "unit": "mg/dL", "ref_low": 0, "ref_high": 150},
     ]},
    {"code": "HBA1C", "name": "HbA1c", "section": "biochemistry",
     "sample_type": "Whole blood (EDTA)", "tube": "Lavender", "tat_hours": 4, "fasting": False, "price": 24,
     "parameters": [{"key": "HBA1C", "label": "Glycated Hemoglobin", "unit": "%", "ref_low": 4.0, "ref_high": 5.6, "critical_high": 14.0}]},
    {"code": "TFT", "name": "Thyroid Function Test", "section": "endocrinology",
     "sample_type": "Serum", "tube": "Gold (SST)", "tat_hours": 6, "fasting": False, "price": 38,
     "parameters": [
         {"key": "TSH", "label": "TSH", "unit": "mIU/L", "ref_low": 0.4, "ref_high": 4.0},
         {"key": "T3", "label": "Free T3", "unit": "pg/mL", "ref_low": 2.3, "ref_high": 4.2},
         {"key": "T4", "label": "Free T4", "unit": "ng/dL", "ref_low": 0.8, "ref_high": 1.8},
     ]},
    {"code": "UA", "name": "Urinalysis", "section": "urinalysis",
     "sample_type": "Urine (mid-stream)", "tube": "Yellow cup", "tat_hours": 2, "fasting": False, "price": 14,
     "parameters": [
         {"key": "COLOR", "label": "Color", "unit": "", "ref_text": "Yellow"},
         {"key": "PROT", "label": "Protein", "unit": "", "ref_text": "Negative"},
         {"key": "GLU", "label": "Glucose", "unit": "", "ref_text": "Negative"},
         {"key": "PH", "label": "pH", "unit": "", "ref_low": 4.5, "ref_high": 8.0},
     ]},
    {"code": "LFT", "name": "Liver Function Test", "section": "biochemistry",
     "sample_type": "Serum", "tube": "Gold (SST)", "tat_hours": 4, "fasting": False, "price": 36,
     "parameters": [
         {"key": "ALT", "label": "ALT (SGPT)", "unit": "U/L", "ref_low": 7, "ref_high": 56, "critical_high": 500},
         {"key": "AST", "label": "AST (SGOT)", "unit": "U/L", "ref_low": 10, "ref_high": 40, "critical_high": 500},
         {"key": "ALP", "label": "Alkaline Phosphatase", "unit": "U/L", "ref_low": 44, "ref_high": 147},
         {"key": "TBIL", "label": "Total Bilirubin", "unit": "mg/dL", "ref_low": 0.1, "ref_high": 1.2},
         {"key": "ALB", "label": "Albumin", "unit": "g/dL", "ref_low": 3.5, "ref_high": 5.0},
     ]},
]
CATALOG_BY_CODE = {t["code"]: t for t in LAB_CATALOG}


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "lab_technician"
    created_at: datetime


class PromoteIn(BaseModel):
    role: str


class PatientIn(BaseModel):
    name: str
    mrn: Optional[str] = None
    age: int
    sex: str
    phone: Optional[str] = None


class OrderCreate(BaseModel):
    patient_id: Optional[str] = None  # for doctor flow with existing patient
    patient: Optional[PatientIn] = None  # for reception walk-in
    test_code: str
    priority: str = "routine"  # routine | urgent | stat
    notes: Optional[str] = ""
    fasting: bool = False


class ResultsIn(BaseModel):
    results: Dict[str, str]
    complete: bool = False


class CancelIn(BaseModel):
    reason: str


class ValidateIn(BaseModel):
    comment: Optional[str] = ""


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
async def _get_session_token(request: Request) -> Optional[str]:
    token = request.cookies.get("session_token")
    if token:
        return token
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip() or None
    return None


async def _resolve_user(token: str) -> Optional[Dict[str, Any]]:
    session = await SESSIONS.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires = session.get("expires_at")
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires and expires < datetime.now(timezone.utc):
        return None
    return await USERS.find_one({"user_id": session["user_id"]}, {"_id": 0})


async def require_user(request: Request) -> Dict[str, Any]:
    token = await _get_session_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await _resolve_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


def require_role(*roles: str):
    async def _check(user: Dict[str, Any] = Depends(require_user)) -> Dict[str, Any]:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role in {roles}")
        return user

    return _check


# ---------------------------------------------------------------------------
# App + router
# ---------------------------------------------------------------------------
app = FastAPI(title="Medora Lab API")
api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"service": "medora-lab", "status": "ok"}


# ---- Auth ----
@api.post("/auth/google/exchange")
async def auth_exchange(payload: Dict[str, str], response: Response):
    """Exchange Emergent session_id (URL fragment) for a persistent session_token cookie."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    try:
        r = requests.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": session_id}, timeout=12)
    except requests.RequestException as exc:
        logger.error("Emergent auth call failed: %s", exc)
        raise HTTPException(status_code=502, detail="Auth provider unreachable") from exc

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email, name = data["email"], data.get("name") or data["email"]
    picture = data.get("picture")
    session_token = data["session_token"]

    # First user becomes supervisor; everyone else defaults to lab_technician
    existing = await USERS.find_one({"email": email}, {"_id": 0})
    if existing:
        await USERS.update_one({"user_id": existing["user_id"]}, {"$set": {"name": name, "picture": picture}})
        user_id = existing["user_id"]
    else:
        count = await USERS.count_documents({})
        role = "lab_supervisor" if count == 0 else "lab_technician"
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await USERS.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await SESSIONS.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        "session_token", session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600,
    )
    user = await USERS.find_one({"user_id": user_id}, {"_id": 0})
    return {"ok": True, "user": user}


@api.get("/auth/me")
async def auth_me(user: Dict[str, Any] = Depends(require_user)):
    return user


@api.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = await _get_session_token(request)
    if token:
        await SESSIONS.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---- Users / RBAC ----
@api.get("/users")
async def users_list(user: Dict[str, Any] = Depends(require_role("lab_supervisor"))):
    cur = USERS.find({}, {"_id": 0}).sort("created_at", 1)
    return [u async for u in cur]


@api.patch("/users/{user_id}/role")
async def update_role(user_id: str, payload: PromoteIn, _: Dict[str, Any] = Depends(require_role("lab_supervisor"))):
    if payload.role not in ROLES:
        raise HTTPException(status_code=400, detail=f"role must be one of {sorted(ROLES)}")
    res = await USERS.update_one({"user_id": user_id}, {"$set": {"role": payload.role}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return await USERS.find_one({"user_id": user_id}, {"_id": 0})


@api.get("/users/staff")
async def users_staff(_: Dict[str, Any] = Depends(require_user)):
    """Lab/doctor staff directory (lightweight)."""
    cur = USERS.find({}, {"_id": 0, "user_id": 1, "name": 1, "role": 1, "picture": 1})
    return [u async for u in cur]


# ---- Catalog ----
@api.get("/lab/catalog")
async def catalog():
    return LAB_CATALOG


# ---- Patients ----
@api.get("/lab/patients")
async def patients_list(_: Dict[str, Any] = Depends(require_user)):
    cur = PATIENTS.find({}, {"_id": 0}).sort("name", 1)
    return [p async for p in cur]


@api.post("/lab/patients")
async def patients_create(payload: PatientIn, user: Dict[str, Any] = Depends(require_role("receptionist", "doctor", "lab_supervisor"))):
    pid = f"p-{uuid.uuid4().hex[:8]}"
    mrn = payload.mrn or f"MR-{uuid.uuid4().hex[:6].upper()}"
    doc = {
        "id": pid,
        "name": payload.name,
        "mrn": mrn,
        "age": payload.age,
        "sex": payload.sex,
        "phone": payload.phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"],
    }
    await PATIENTS.insert_one(doc.copy())
    return doc


# ---- Orders ----
def _next_history(order: Dict[str, Any], actor: str, action: str, note: str = "") -> List[Dict[str, Any]]:
    h = list(order.get("history") or [])
    h.append({"at": datetime.now(timezone.utc).isoformat(), "actor": actor, "action": action, "note": note})
    return h


async def _create_order(*, patient_id: str, doctor_user: Dict[str, Any], test_code: str, priority: str,
                        notes: str, fasting: bool, source: str) -> Dict[str, Any]:
    cat = CATALOG_BY_CODE.get(test_code)
    if not cat:
        raise HTTPException(status_code=400, detail=f"Unknown test_code: {test_code}")
    if priority not in {"routine", "urgent", "stat"}:
        raise HTTPException(status_code=400, detail="priority must be routine|urgent|stat")
    order_id = f"LO-{datetime.now(timezone.utc).strftime('%y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    accession = f"ACC-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": order_id,
        "accession": accession,
        "patient_id": patient_id,
        "doctor_user_id": doctor_user["user_id"],
        "doctor_name": doctor_user["name"],
        "test_code": test_code,
        "test_name": cat["name"],
        "status": "ordered",
        "priority": priority,
        "source": source,
        "notes": notes,
        "fasting": fasting,
        "ordered_at": now,
        "collected_at": None,
        "completed_at": None,
        "validated_at": None,
        "released_at": None,
        "cancelled_at": None,
        "cancel_reason": None,
        "assigned_to": None,
        "collector": None,
        "validated_by": None,
        "results": {},
        "history": [{"at": now, "actor": doctor_user["name"], "action": "Order placed",
                     "note": f"{priority.upper()} · via {source}"}],
    }
    await ORDERS.insert_one(doc.copy())
    return doc


@api.post("/lab/orders")
async def order_create_doctor(payload: OrderCreate, user: Dict[str, Any] = Depends(require_role("doctor", "lab_supervisor"))):
    if not payload.patient_id:
        raise HTTPException(status_code=400, detail="patient_id required for doctor flow")
    patient = await PATIENTS.find_one({"id": payload.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return await _create_order(
        patient_id=payload.patient_id, doctor_user=user, test_code=payload.test_code,
        priority=payload.priority, notes=payload.notes or "", fasting=payload.fasting, source="doctor",
    )


@api.post("/lab/orders/walkin")
async def order_create_walkin(payload: OrderCreate, user: Dict[str, Any] = Depends(require_role("receptionist", "lab_supervisor"))):
    if not payload.patient:
        raise HTTPException(status_code=400, detail="patient details required for walk-in")
    pid = f"p-{uuid.uuid4().hex[:8]}"
    patient = {
        "id": pid,
        "name": payload.patient.name,
        "mrn": payload.patient.mrn or f"MR-{uuid.uuid4().hex[:6].upper()}",
        "age": payload.patient.age,
        "sex": payload.patient.sex,
        "phone": payload.patient.phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"],
        "walk_in": True,
    }
    await PATIENTS.insert_one(patient.copy())
    return await _create_order(
        patient_id=pid, doctor_user=user, test_code=payload.test_code,
        priority=payload.priority, notes=payload.notes or "Walk-in lab",
        fasting=payload.fasting, source="reception",
    )


@api.get("/lab/orders")
async def orders_list(user: Dict[str, Any] = Depends(require_user)):
    q: Dict[str, Any] = {}
    if user["role"] == "doctor":
        q["doctor_user_id"] = user["user_id"]
    cur = ORDERS.find(q, {"_id": 0}).sort("ordered_at", -1)
    return [o async for o in cur]


@api.get("/lab/orders/{order_id}")
async def order_get(order_id: str, _: Dict[str, Any] = Depends(require_user)):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o


@api.post("/lab/orders/{order_id}/collect")
async def order_collect(order_id: str, payload: Dict[str, Any], user: Dict[str, Any] = Depends(require_role("lab_technician", "lab_supervisor"))):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    history = _next_history(o, user["name"], "Sample collected", payload.get("note", ""))
    await ORDERS.update_one({"id": order_id}, {"$set": {
        "status": "collected",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "collector": user["name"],
        "history": history,
    }})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


@api.post("/lab/orders/{order_id}/reject-collection")
async def order_reject_collection(order_id: str, payload: CancelIn, user: Dict[str, Any] = Depends(require_role("lab_technician", "lab_supervisor"))):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    history = _next_history(o, user["name"], "Rejected at collection", payload.reason)
    await ORDERS.update_one({"id": order_id}, {"$set": {
        "status": "ordered", "collected_at": None, "collector": None, "history": history,
    }})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


@api.post("/lab/orders/{order_id}/process")
async def order_process(order_id: str, user: Dict[str, Any] = Depends(require_role("lab_technician", "lab_supervisor"))):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if o["status"] in {"collected"}:
        history = _next_history(o, user["name"], "Processing started")
        await ORDERS.update_one({"id": order_id}, {"$set": {
            "status": "processing",
            "assigned_to": f"Tech: {user['name']}",
            "history": history,
        }})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


@api.post("/lab/orders/{order_id}/results")
async def order_results(order_id: str, payload: ResultsIn, user: Dict[str, Any] = Depends(require_role("lab_technician", "lab_supervisor"))):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    updates = {"results": payload.results}
    if payload.complete:
        updates["status"] = "validation"
        updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        history = _next_history(o, user["name"], "Results entered", "Submitted for validation")
    else:
        history = list(o.get("history") or [])
    updates["history"] = history
    await ORDERS.update_one({"id": order_id}, {"$set": updates})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


@api.post("/lab/orders/{order_id}/validate")
async def order_validate(order_id: str, payload: ValidateIn, user: Dict[str, Any] = Depends(require_role("lab_supervisor"))):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    history = _next_history(o, user["name"], "Validated & released", payload.comment or "Released")
    now = datetime.now(timezone.utc).isoformat()
    await ORDERS.update_one({"id": order_id}, {"$set": {
        "status": "validated",
        "validated_at": now,
        "released_at": now,
        "validated_by": user["name"],
        "history": history,
    }})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


@api.post("/lab/orders/{order_id}/reject-validation")
async def order_reject_validation(order_id: str, payload: CancelIn, user: Dict[str, Any] = Depends(require_role("lab_supervisor"))):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    history = _next_history(o, user["name"], "Rejected for re-processing", payload.reason)
    await ORDERS.update_one({"id": order_id}, {"$set": {
        "status": "processing", "completed_at": None, "history": history,
    }})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


@api.post("/lab/orders/{order_id}/cancel")
async def order_cancel(order_id: str, payload: CancelIn, user: Dict[str, Any] = Depends(require_user)):
    o = await ORDERS.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    # doctor can cancel their own; supervisor any
    if user["role"] not in {"lab_supervisor", "receptionist"} and o.get("doctor_user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Cannot cancel another doctor's order")
    history = _next_history(o, user["name"], "Cancelled", payload.reason)
    await ORDERS.update_one({"id": order_id}, {"$set": {
        "status": "cancelled",
        "cancelled_at": datetime.now(timezone.utc).isoformat(),
        "cancel_reason": payload.reason,
        "history": history,
    }})
    return await ORDERS.find_one({"id": order_id}, {"_id": 0})


# ---- Analytics ----
@api.get("/lab/analytics")
async def analytics(_: Dict[str, Any] = Depends(require_user)):
    orders = [o async for o in ORDERS.find({}, {"_id": 0})]
    by_test: Dict[str, int] = {}
    by_section: Dict[str, int] = {}
    by_day: Dict[str, int] = {}
    tats: List[float] = []
    criticals: List[Dict[str, Any]] = []
    by_status = {"ordered": 0, "collected": 0, "processing": 0, "validation": 0, "validated": 0, "cancelled": 0}
    for o in orders:
        by_test[o["test_code"]] = by_test.get(o["test_code"], 0) + 1
        cat = CATALOG_BY_CODE.get(o["test_code"])
        if cat:
            by_section[cat["section"]] = by_section.get(cat["section"], 0) + 1
        day = (o.get("ordered_at") or "")[:10]
        if day:
            by_day[day] = by_day.get(day, 0) + 1
        by_status[o.get("status", "ordered")] = by_status.get(o.get("status", "ordered"), 0) + 1
        if o.get("released_at") and o.get("ordered_at"):
            try:
                ord_dt = datetime.fromisoformat(o["ordered_at"])
                rel_dt = datetime.fromisoformat(o["released_at"])
                tats.append((rel_dt - ord_dt).total_seconds() / 3600)
            except ValueError:
                pass
        # criticals
        if cat and o.get("results"):
            for p in cat["parameters"]:
                v = o["results"].get(p["key"])
                if v is None or v == "":
                    continue
                try:
                    n = float(v)
                except (TypeError, ValueError):
                    continue
                if (("critical_low" in p and n <= p["critical_low"]) or
                        ("critical_high" in p and n >= p["critical_high"])):
                    criticals.append({"order_id": o["id"], "param": p["label"], "value": v, "at": o.get("completed_at")})

    avg_tat = round(sum(tats) / len(tats), 2) if tats else None
    return {
        "totals": {"orders": len(orders), "validated": by_status["validated"],
                   "pending": sum(by_status[s] for s in ("ordered", "collected", "processing", "validation")),
                   "cancelled": by_status["cancelled"]},
        "by_status": by_status,
        "by_test": by_test,
        "by_section": by_section,
        "by_day": by_day,
        "avg_tat_hours": avg_tat,
        "criticals": criticals[:25],
    }


# ---- Seed (dev helper) ----
@api.post("/dev/seed")
async def seed(_: Dict[str, Any] = Depends(require_role("lab_supervisor"))):
    """Seed demo patients + a couple of orders so the lab looks alive."""
    sample_patients = [
        {"id": "p-1001", "name": "Amara Okafor", "mrn": "MR-23841", "age": 34, "sex": "F", "phone": "+1 555-0118"},
        {"id": "p-1002", "name": "Ravi Sundaram", "mrn": "MR-23912", "age": 58, "sex": "M", "phone": "+1 555-0224"},
        {"id": "p-1003", "name": "Sofia Marchetti", "mrn": "MR-24017", "age": 27, "sex": "F", "phone": "+1 555-0339"},
        {"id": "p-1004", "name": "Thabo Mokoena", "mrn": "MR-24108", "age": 45, "sex": "M", "phone": "+1 555-0441"},
        {"id": "p-1005", "name": "Yuki Tanaka", "mrn": "MR-24205", "age": 62, "sex": "F", "phone": "+1 555-0552"},
    ]
    for p in sample_patients:
        await PATIENTS.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    return {"ok": True, "patients": len(sample_patients)}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
