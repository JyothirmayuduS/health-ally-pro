// Pharmacy desk mock store — context + localStorage persistence (v5)
// Workflow: new → in_review → ready_to_dispense → dispensing → dispensed → collected
// + walk-in Rx (no doctor), add-drug, transfer, quarantine, multi-batch FEFO dispense.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SEED } from "./mockData";

const STORAGE_KEY = "oakhaven.pharmacy.v5";

const PharmacyContext = createContext(null);

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === SEED.version) return parsed;
    }
  } catch (_) { /* ignore */ }
  return JSON.parse(JSON.stringify(SEED));
}

export function PharmacyProvider({ children }) {
  const [state, setState] = useState(loadInitial);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* quota */ }
  }, [state]);

  // ---------- Lookups ----------
  const getPatient = useCallback((id) => state.patients.find((p) => p.id === id) || null, [state.patients]);
  const getStaff   = useCallback((id) => state.staff.find((s) => s.id === id) || null,    [state.staff]);
  const getDrug    = useCallback((id) => state.inventory.find((d) => d.id === id) || null, [state.inventory]);

  const drugOnHand = useCallback((drugId) => {
    const drug = state.inventory.find((d) => d.id === drugId);
    if (!drug) return 0;
    return drug.batches.reduce((acc, b) => acc + (b.qty || 0), 0);
  }, [state.inventory]);

  // FEFO pick plan — returns list of {lot, take, expiry} without mutating state
  const planFEFO = useCallback((drugId, qtyNeeded) => {
    const drug = state.inventory.find((d) => d.id === drugId);
    if (!drug) return { plan: [], shortfall: qtyNeeded };
    const sorted = [...drug.batches].filter((b) => b.qty > 0).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
    let remaining = qtyNeeded;
    const plan = [];
    sorted.forEach((b) => {
      if (remaining <= 0) return;
      const take = Math.min(b.qty, remaining);
      plan.push({ lot: b.lot, take, expiry: b.expiry });
      remaining -= take;
    });
    return { plan, shortfall: Math.max(0, remaining) };
  }, [state.inventory]);

  // ---------- Helpers ----------
  const appendHistory = (rx, entry) => ({
    ...rx, history: [...(rx.history || []), { at: new Date().toISOString(), ...entry }],
  });
  const updateRx = useCallback((id, mutate) => {
    setState((prev) => ({ ...prev, prescriptions: prev.prescriptions.map((rx) => (rx.id === id ? mutate(rx) : rx)) }));
  }, []);

  // ---------- Rx transitions ----------
  const beginReview      = useCallback((id, actor = "Riley Chen") => updateRx(id, (rx) => appendHistory({ ...rx, status: "in_review"       }, { by: actor, action: "Opened for review" })), [updateRx]);
  const sendToDispense   = useCallback((id, actor = "Riley Chen") => updateRx(id, (rx) => appendHistory({ ...rx, status: "ready_to_dispense"}, { by: actor, action: "Reviewed — cleared" })), [updateRx]);
  const startDispensing  = useCallback((id, actor = "Riley Chen") => updateRx(id, (rx) => appendHistory({ ...rx, status: "dispensing"      }, { by: actor, action: "Started dispense" })), [updateRx]);
  const markCollected    = useCallback((id, actor = "Riley Chen") => updateRx(id, (rx) => appendHistory({ ...rx, status: "collected", collectedAt: new Date().toISOString() }, { by: actor, action: "Collected by patient" })), [updateRx]);
  const holdRx           = useCallback((id, reason, actor = "Riley Chen") => updateRx(id, (rx) => appendHistory({ ...rx, status: "on_hold", notes: reason ? `${rx.notes || ""}\n[HOLD] ${reason}` : rx.notes }, { by: actor, action: `Placed on hold${reason ? " — " + reason : ""}` })), [updateRx]);
  const rejectRx         = useCallback((id, reason, actor = "Riley Chen") => updateRx(id, (rx) => appendHistory({ ...rx, status: "cancelled" }, { by: actor, action: `Rejected${reason ? " — " + reason : ""}` })), [updateRx]);

  // Decrement specific lots — supports multi-batch picks per line
  const applyPicks = useCallback((picks /* [{ drugId, lots: [{lot, take}] }] */) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        const pick = picks.find((p) => p.drugId === d.id);
        if (!pick) return d;
        return {
          ...d,
          batches: d.batches.map((b) => {
            const lot = pick.lots.find((l) => l.lot === b.lot);
            if (!lot) return b;
            return { ...b, qty: Math.max(0, b.qty - lot.take) };
          }),
        };
      }),
    }));
  }, []);

  // Complete dispense with explicit picks per item (multi-batch UX)
  const completeDispense = useCallback((id, { picks, partial = false, actor = "Riley Chen" } = {}) => {
    const rx = state.prescriptions.find((r) => r.id === id);
    if (!rx) return;
    // Default to FEFO if no picks provided
    const finalPicks = picks || rx.items.map((it) => {
      const { plan } = planFEFO(it.drugId, it.quantity);
      return { drugId: it.drugId, lots: plan.map((p) => ({ lot: p.lot, take: p.take })) };
    });
    applyPicks(finalPicks);
    const lotsForLabel = finalPicks.flatMap((p) => p.lots.map((l) => l.lot));
    updateRx(id, (rx2) => appendHistory({
      ...rx2,
      status: "dispensed",
      dispensedAt: new Date().toISOString(),
      labelBatchLots: lotsForLabel,
      pickPlan: finalPicks,
    }, { by: actor, action: `${partial ? "Partially dispensed" : "Dispensed"} · ${lotsForLabel.join(", ") || "no batch"}` }));
  }, [state.prescriptions, planFEFO, applyPicks, updateRx]);

  // ---------- Walk-in Rx (counter / OTC / pharmacist-entered) ----------
  const submitWalkInRx = useCallback((payload) => {
    const rx = {
      id: `rx_W${Math.floor(Math.random() * 9000 + 1000)}`,
      rxNumber: `RX-WALK-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientId: payload.patientId,
      prescribedByStaffId: payload.doctorId || null,
      walkIn: true,
      encounterId: null,
      priority: payload.priority || "routine",
      status: payload.skipReview ? "ready_to_dispense" : "new",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
      items: payload.items,
      refillsAllowed: payload.refillsAllowed ?? 0,
      refillsUsed: 0,
      notes: payload.notes || "Walk-in counter Rx",
      history: [{
        at: new Date().toISOString(),
        by: "Riley Chen",
        action: payload.skipReview ? "Walk-in OTC — cleared at counter" : "Walk-in Rx entered",
      }],
    };
    setState((prev) => ({ ...prev, prescriptions: [rx, ...prev.prescriptions] }));
    return rx;
  }, []);

  // ---------- Refills ----------
  const setRefillStatus = useCallback((id, status, extra = {}) => {
    setState((prev) => ({ ...prev, refills: prev.refills.map((r) => (r.id === id ? { ...r, status, ...extra } : r)) }));
  }, []);

  const approveRefill = useCallback((id) => {
    const refill = state.refills.find((r) => r.id === id);
    if (!refill) return;
    const drug = state.inventory.find((d) => d.name.toLowerCase() === refill.drugSnapshot.name.toLowerCase() && d.strength === refill.drugSnapshot.strength);
    const newRx = {
      id: `rx_R${Math.floor(Math.random() * 9000 + 1000)}`,
      rxNumber: `RX-REF-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientId: refill.patientId,
      prescribedByStaffId: "stf_phm_01",
      encounterId: null,
      priority: "routine",
      status: "ready_to_dispense",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
      items: [{
        drugId: drug ? drug.id : null,
        medicationName: refill.drugSnapshot.name,
        dosage: refill.drugSnapshot.strength,
        frequency: "Per previous Rx",
        duration: "30 days",
        quantity: 30,
        instructions: "Refill of original Rx " + (refill.originalRxId || "—"),
      }],
      refillsAllowed: Math.max(0, (refill.remainingRefills || 0) - 1),
      refillsUsed: 1,
      notes: "Refill approved from " + refill.source,
      history: [{ at: new Date().toISOString(), by: "Riley Chen", action: "Refill approved — Rx generated" }],
    };
    setState((prev) => ({
      ...prev,
      prescriptions: [newRx, ...prev.prescriptions],
      refills: prev.refills.map((r) => (r.id === id ? { ...r, status: "approved", approvedAt: new Date().toISOString() } : r)),
    }));
  }, [state.refills, state.inventory]);

  const denyRefill = useCallback((id, reason) => setRefillStatus(id, "denied", { deniedReason: reason }), [setRefillStatus]);

  // ---------- Inventory mutations ----------
  const receiveStock = useCallback((drugId, { lot, qty, expiry }) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId) return d;
        const existing = d.batches.find((b) => b.lot === lot);
        if (existing) return { ...d, batches: d.batches.map((b) => (b.lot === lot ? { ...b, qty: b.qty + qty } : b)) };
        return { ...d, batches: [...d.batches, { lot, qty, expiry }] };
      }),
    }));
  }, []);

  const adjustStock = useCallback((drugId, lot, delta, reason = "Manual adjust") => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId) return d;
        return { ...d, batches: d.batches.map((b) => (b.lot === lot ? { ...b, qty: Math.max(0, b.qty + delta) } : b)) };
      }),
    }));
    // best-effort: silent log via console for demo
    if (typeof console !== "undefined") console.info(`[stock] adjust ${drugId} ${lot} ${delta} (${reason})`);
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

  // Transfer drug to a new rack/tray/slot (also supports zone change)
  const transferDrug = useCallback((drugId, newLocation /* {zone,aisle,rack,tray,slot} */) => {
    setState((prev) => ({
      ...prev,
      inventory: prev.inventory.map((d) => {
        if (d.id !== drugId) return d;
        const code = `${newLocation.rack}-T${String(newLocation.tray).padStart(2, "0")}-S${newLocation.slot}`;
        return { ...d, location: { ...newLocation, code } };
      }),
    }));
  }, []);

  // Add a brand new drug to the master
  const addDrug = useCallback((payload) => {
    const id = `drg_${Math.random().toString(36).slice(2, 8)}`;
    const code = `${payload.location.rack}-T${String(payload.location.tray).padStart(2, "0")}-S${payload.location.slot}`;
    const drug = {
      id,
      name: payload.name,
      generic: payload.generic || payload.name,
      brand: payload.brand || "",
      form: payload.form, strength: payload.strength, route: payload.route || "PO",
      sku: payload.sku || id.toUpperCase(), barcode: payload.barcode || "",
      rxRequired: !!payload.rxRequired, controlled: payload.controlled || null,
      flags: payload.flags || [],
      interactionTags: payload.interactionTags || [],
      pregnancyCategory: payload.pregnancyCategory || "—",
      location: { ...payload.location, code },
      reorderLevel: payload.reorderLevel || 50,
      unitPrice: payload.unitPrice || 0,
      supplier: payload.supplier || "—",
      batches: payload.batch ? [payload.batch] : [],
    };
    setState((prev) => ({ ...prev, inventory: [drug, ...prev.inventory] }));
    return drug;
  }, []);

  // ---------- Search (global) ----------
  const searchCatalog = useCallback((rawQuery, { limit = 8 } = {}) => {
    const q = (rawQuery || "").trim().toLowerCase();
    if (!q) return [];
    // very simple fuzzy: token includes; also support location code matching
    const tokens = q.split(/\s+/).filter(Boolean);
    const score = (d) => {
      const hay = [
        d.name, d.generic, d.brand, d.sku, d.barcode,
        d.form, d.strength, (d.location && d.location.code) || "",
        (d.flags || []).join(" "),
      ].join(" ").toLowerCase();
      let s = 0;
      tokens.forEach((t) => {
        if (hay.includes(t)) s += 2;
        if ((d.name || "").toLowerCase().startsWith(t)) s += 3;
        // very loose typo tolerance
        if (lev(t, (d.name || "").toLowerCase().slice(0, t.length + 1)) <= 1) s += 1;
      });
      return s;
    };
    return state.inventory
      .map((d) => ({ d, s: score(d) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.d);
  }, [state.inventory]);

  const recordSearch = useCallback((q) => {
    if (!q || !q.trim()) return;
    setRecentSearches((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 10));
  }, []);

  const resetDemoData = useCallback(() => setState(JSON.parse(JSON.stringify(SEED))), []);

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
      urgent: state.prescriptions.filter((r) => r.priority === "urgent" && !["collected", "cancelled"].includes(r.status)).length,
      refillsPending: state.refills.filter((r) => r.status === "pending").length,
      lowStock: state.inventory.filter((d) => d.batches.reduce((a, b) => a + b.qty, 0) <= d.reorderLevel).length,
      outOfStock: state.inventory.filter((d) => d.batches.reduce((a, b) => a + b.qty, 0) === 0).length,
      expiringSoon: state.inventory.filter((d) =>
        d.batches.some((b) => {
          const days = (new Date(b.expiry) - Date.now()) / 86_400_000;
          return b.qty > 0 && days < 90;
        }),
      ).length,
      controlledDrugs: state.inventory.filter((d) => d.controlled).length,
    };
  }, [state.prescriptions, state.refills, state.inventory]);

  const value = {
    ...state,
    counts,
    recentSearches,
    // lookups
    getPatient, getStaff, getDrug, drugOnHand, planFEFO,
    // rx
    beginReview, sendToDispense, holdRx, rejectRx, startDispensing, completeDispense, markCollected,
    // walk-in
    submitWalkInRx,
    // refills
    approveRefill, denyRefill,
    // inventory
    receiveStock, adjustStock, quarantineBatch, transferDrug, addDrug,
    // search
    searchCatalog, recordSearch,
    // misc
    resetDemoData,
  };

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) throw new Error("usePharmacy must be used inside <PharmacyProvider>");
  return ctx;
}

// Status display config
export const STATUS_META = {
  new:               { label: "New",               tone: "amber",  dot: "bg-amber-500" },
  in_review:         { label: "In review",         tone: "blue",   dot: "bg-sky-500" },
  ready_to_dispense: { label: "Ready to dispense", tone: "sage",   dot: "bg-emerald-500" },
  dispensing:        { label: "Dispensing",        tone: "violet", dot: "bg-violet-500" },
  dispensed:         { label: "Ready for pickup",  tone: "teal",   dot: "bg-teal-500" },
  collected:         { label: "Collected",         tone: "stone",  dot: "bg-stone-400" },
  on_hold:           { label: "On hold",           tone: "rose",   dot: "bg-rose-500" },
  cancelled:         { label: "Cancelled",         tone: "stone",  dot: "bg-stone-300" },
};

export const TONE_CLASSES = {
  amber:  "bg-amber-50 text-amber-800 border-amber-200",
  blue:   "bg-sky-50 text-sky-800 border-sky-200",
  sage:   "bg-emerald-50 text-emerald-800 border-emerald-200",
  violet: "bg-violet-50 text-violet-800 border-violet-200",
  teal:   "bg-teal-50 text-teal-800 border-teal-200",
  stone:  "bg-stone-100 text-stone-700 border-stone-200",
  rose:   "bg-rose-50 text-rose-800 border-rose-200",
  sky:    "bg-sky-50 text-sky-800 border-sky-200",
};

// tiny Levenshtein for fuzzy search (kept simple, capped)
function lev(a, b) {
  if (!a || !b) return Math.max((a || "").length, (b || "").length);
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}
