// Pharmacy desk mock store — context + localStorage persistence
// Mirrors the lab store pattern: status transitions, dispense, stock updates, audit history.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SEED } from "./mockData";

const STORAGE_KEY = "oakhaven.pharmacy.v3";

const PharmacyContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === SEED.version) return parsed;
    }
  } catch (_) {
    // ignore
  }
  return JSON.parse(JSON.stringify(SEED));
}

export function PharmacyProvider({ children }) {
  const [state, setState] = useState(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      /* quota — ignore */
    }
  }, [state]);

  // ---------- Lookups ----------
  const getPatient = useCallback(
    (id) => state.patients.find((p) => p.id === id) || null,
    [state.patients],
  );
  const getStaff = useCallback(
    (id) => state.staff.find((s) => s.id === id) || null,
    [state.staff],
  );
  const getDrug = useCallback(
    (id) => state.inventory.find((d) => d.id === id) || null,
    [state.inventory],
  );

  const drugOnHand = useCallback((drugId) => {
    const drug = state.inventory.find((d) => d.id === drugId);
    if (!drug) return 0;
    return drug.batches.reduce((acc, b) => acc + (b.qty || 0), 0);
  }, [state.inventory]);

  // ---------- Helpers ----------
  const appendHistory = (rx, entry) => ({
    ...rx,
    history: [...(rx.history || []), { at: new Date().toISOString(), ...entry }],
  });

  const updateRx = useCallback((id, mutate) => {
    setState((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.map((rx) => (rx.id === id ? mutate(rx) : rx)),
    }));
  }, []);

  // ---------- Prescription status transitions ----------
  const beginReview = useCallback(
    (id, actor = "Riley Chen") =>
      updateRx(id, (rx) =>
        appendHistory({ ...rx, status: "in_review" }, { by: actor, action: "Opened for review" }),
      ),
    [updateRx],
  );

  const sendToDispense = useCallback(
    (id, actor = "Riley Chen") =>
      updateRx(id, (rx) =>
        appendHistory(
          { ...rx, status: "ready_to_dispense" },
          { by: actor, action: "Reviewed — cleared" },
        ),
      ),
    [updateRx],
  );

  const holdRx = useCallback(
    (id, reason, actor = "Riley Chen") =>
      updateRx(id, (rx) =>
        appendHistory(
          { ...rx, status: "on_hold", notes: reason ? `${rx.notes || ""}\n[HOLD] ${reason}` : rx.notes },
          { by: actor, action: `Placed on hold${reason ? " — " + reason : ""}` },
        ),
      ),
    [updateRx],
  );

  const rejectRx = useCallback(
    (id, reason, actor = "Riley Chen") =>
      updateRx(id, (rx) =>
        appendHistory(
          { ...rx, status: "cancelled" },
          { by: actor, action: `Rejected${reason ? " — " + reason : ""}` },
        ),
      ),
    [updateRx],
  );

  const startDispensing = useCallback(
    (id, actor = "Riley Chen") =>
      updateRx(id, (rx) =>
        appendHistory({ ...rx, status: "dispensing" }, { by: actor, action: "Started dispense" }),
      ),
    [updateRx],
  );

  // Decrement inventory across batches FIFO by expiry — partial allowed
  const decrementStock = useCallback((drugId, qtyNeeded) => {
    let remaining = qtyNeeded;
    const usedLots = [];
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId || remaining <= 0) return d;
        // sort batches by nearest expiry
        const sorted = [...d.batches].sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
        const newBatches = sorted.map((b) => {
          if (remaining <= 0 || b.qty <= 0) return b;
          const take = Math.min(b.qty, remaining);
          remaining -= take;
          if (take > 0) usedLots.push({ lot: b.lot, take });
          return { ...b, qty: b.qty - take };
        });
        return { ...d, batches: newBatches };
      }),
    }));
    return { fulfilled: qtyNeeded - remaining, shortfall: remaining, usedLots };
  }, []);

  const completeDispense = useCallback(
    (id, { partial = false, actor = "Riley Chen" } = {}) => {
      updateRx(id, (rx) => {
        const lotsForLabel = [];
        rx.items.forEach((item) => {
          const { usedLots } = decrementStock(item.drugId, item.quantity);
          if (usedLots && usedLots.length) lotsForLabel.push(...usedLots);
        });
        return appendHistory(
          {
            ...rx,
            status: "dispensed",
            dispensedAt: new Date().toISOString(),
            label: { batchLot: lotsForLabel.map((l) => l.lot).join(", ") || "—" },
          },
          {
            by: actor,
            action: `${partial ? "Partially dispensed" : "Dispensed"} · ${lotsForLabel.map((l) => l.lot).join(", ") || "no batch"}`,
          },
        );
      });
    },
    [updateRx, decrementStock],
  );

  const markCollected = useCallback(
    (id, actor = "Riley Chen") =>
      updateRx(id, (rx) =>
        appendHistory(
          { ...rx, status: "collected", collectedAt: new Date().toISOString() },
          { by: actor, action: "Collected by patient" },
        ),
      ),
    [updateRx],
  );

  // ---------- Refills ----------
  const setRefillStatus = useCallback((id, status, extra = {}) => {
    setState((prev) => ({
      ...prev,
      refills: prev.refills.map((r) => (r.id === id ? { ...r, status, ...extra } : r)),
    }));
  }, []);

  const approveRefill = useCallback(
    (id) => {
      // approving a refill creates a new Rx in `new` status (linked to original)
      const refill = state.refills.find((r) => r.id === id);
      if (!refill) return;
      const drug = state.inventory.find(
        (d) =>
          d.name.toLowerCase() === refill.drugSnapshot.name.toLowerCase() &&
          d.strength === refill.drugSnapshot.strength,
      );
      const newRx = {
        id: `rx_R${Math.floor(Math.random() * 9000 + 1000)}`,
        patientId: refill.patientId,
        prescribedByStaffId: "stf_phm_01",
        encounterId: null,
        priority: "routine",
        status: "ready_to_dispense",
        createdAt: new Date().toISOString(),
        items: [
          {
            drugId: drug ? drug.id : null,
            medicationName: refill.drugSnapshot.name,
            dosage: refill.drugSnapshot.strength,
            frequency: "Per previous Rx",
            duration: "30 days",
            quantity: 30,
            instructions: "Refill of original Rx " + (refill.originalRxId || "—"),
          },
        ],
        refillsAllowed: Math.max(0, (refill.remainingRefills || 0) - 1),
        refillsUsed: 1,
        notes: "Refill approved from " + refill.source,
        history: [
          {
            at: new Date().toISOString(),
            by: "Riley Chen",
            action: "Refill approved — Rx generated",
          },
        ],
      };
      setState((prev) => ({
        ...prev,
        prescriptions: [newRx, ...prev.prescriptions],
        refills: prev.refills.map((r) =>
          r.id === id ? { ...r, status: "approved", approvedAt: new Date().toISOString() } : r,
        ),
      }));
    },
    [state.refills, state.inventory],
  );

  const denyRefill = useCallback(
    (id, reason) => setRefillStatus(id, "denied", { deniedReason: reason }),
    [setRefillStatus],
  );

  const createPharmacistRefill = useCallback((rxId) => {
    const rx = state.prescriptions.find((r) => r.id === rxId);
    if (!rx) return;
    const item = rx.items[0];
    const refill = {
      id: `ref_${Math.floor(Math.random() * 9000 + 3000)}`,
      originalRxId: rx.id,
      patientId: rx.patientId,
      drugSnapshot: { name: item.medicationName, strength: item.dosage, form: "—" },
      requestedAt: new Date().toISOString(),
      source: "pharmacist",
      status: "pending",
      remainingRefills: Math.max(0, (rx.refillsAllowed || 0) - (rx.refillsUsed || 0)),
      daysSupplyLeft: 0,
      autoRefillEligible: false,
    };
    setState((prev) => ({ ...prev, refills: [refill, ...prev.refills] }));
  }, [state.prescriptions]);

  // ---------- Inventory mutations ----------
  const receiveStock = useCallback((drugId, { lot, qty, expiry }) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId) return d;
        const existing = d.batches.find((b) => b.lot === lot);
        if (existing) {
          return {
            ...d,
            batches: d.batches.map((b) =>
              b.lot === lot ? { ...b, qty: b.qty + qty } : b,
            ),
          };
        }
        return { ...d, batches: [...d.batches, { lot, qty, expiry }] };
      }),
    }));
  }, []);

  const adjustStock = useCallback((drugId, lot, delta) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId) return d;
        return {
          ...d,
          batches: d.batches.map((b) =>
            b.lot === lot ? { ...b, qty: Math.max(0, b.qty + delta) } : b,
          ),
        };
      }),
    }));
  }, []);

  const quarantineBatch = useCallback((drugId, lot) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId) return d;
        return { ...d, batches: d.batches.map((b) => (b.lot === lot ? { ...b, qty: 0 } : b)) };
      }),
    }));
  }, []);

  // Doctor handoff (used by stub doctor portal)
  const submitFromDoctor = useCallback((payload) => {
    const rx = {
      id: `rx_${Math.floor(Math.random() * 9000 + 1500)}`,
      patientId: payload.patientId,
      prescribedByStaffId: payload.doctorId,
      encounterId: payload.encounterId || null,
      priority: payload.priority || "routine",
      status: "new",
      createdAt: new Date().toISOString(),
      items: payload.items,
      refillsAllowed: payload.refillsAllowed ?? 0,
      refillsUsed: 0,
      notes: payload.notes || "",
      history: [
        {
          at: new Date().toISOString(),
          by: (state.staff.find((s) => s.id === payload.doctorId) || {}).name || "Doctor",
          action: "Prescription submitted",
        },
      ],
    };
    setState((prev) => ({ ...prev, prescriptions: [rx, ...prev.prescriptions] }));
    return rx;
  }, [state.staff]);

  const resetDemoData = useCallback(() => {
    const fresh = JSON.parse(JSON.stringify(SEED));
    setState(fresh);
  }, []);

  // ---------- Derived ----------
  const counts = useMemo(() => {
    const by = (s) => state.prescriptions.filter((r) => r.status === s).length;
    return {
      new: by("new"),
      in_review: by("in_review"),
      ready_to_dispense: by("ready_to_dispense"),
      dispensing: by("dispensing"),
      dispensed: by("dispensed"),
      collected: by("collected"),
      on_hold: by("on_hold"),
      urgent: state.prescriptions.filter(
        (r) => r.priority === "urgent" && !["collected", "cancelled"].includes(r.status),
      ).length,
      refillsPending: state.refills.filter((r) => r.status === "pending").length,
      lowStock: state.inventory.filter(
        (d) => d.batches.reduce((a, b) => a + b.qty, 0) <= d.reorderLevel,
      ).length,
      expiringSoon: state.inventory.filter((d) =>
        d.batches.some((b) => {
          const days = (new Date(b.expiry) - Date.now()) / 86_400_000;
          return b.qty > 0 && days < 90;
        }),
      ).length,
    };
  }, [state.prescriptions, state.refills, state.inventory]);

  const value = {
    ...state,
    counts,
    getPatient,
    getStaff,
    getDrug,
    drugOnHand,
    // rx
    beginReview,
    sendToDispense,
    holdRx,
    rejectRx,
    startDispensing,
    completeDispense,
    markCollected,
    // refills
    approveRefill,
    denyRefill,
    createPharmacistRefill,
    // inventory
    receiveStock,
    adjustStock,
    quarantineBatch,
    // misc
    submitFromDoctor,
    resetDemoData,
  };

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used inside <PharmacyProvider>");
  return ctx;
}

// Status display config — single source of truth for badges
export const STATUS_META = {
  new:               { label: "New",              tone: "amber",  dot: "bg-amber-500" },
  in_review:         { label: "In review",        tone: "blue",   dot: "bg-sky-500" },
  ready_to_dispense: { label: "Ready to dispense",tone: "sage",   dot: "bg-emerald-500" },
  dispensing:        { label: "Dispensing",       tone: "violet", dot: "bg-violet-500" },
  dispensed:         { label: "Ready for pickup", tone: "teal",   dot: "bg-teal-500" },
  collected:         { label: "Collected",        tone: "stone",  dot: "bg-stone-400" },
  on_hold:           { label: "On hold",          tone: "rose",   dot: "bg-rose-500" },
  cancelled:         { label: "Cancelled",        tone: "stone",  dot: "bg-stone-300" },
};

export const TONE_CLASSES = {
  amber:  "bg-amber-50 text-amber-800 border-amber-200",
  blue:   "bg-sky-50 text-sky-800 border-sky-200",
  sage:   "bg-emerald-50 text-emerald-800 border-emerald-200",
  violet: "bg-violet-50 text-violet-800 border-violet-200",
  teal:   "bg-teal-50 text-teal-800 border-teal-200",
  stone:  "bg-stone-100 text-stone-700 border-stone-200",
  rose:   "bg-rose-50 text-rose-800 border-rose-200",
};
