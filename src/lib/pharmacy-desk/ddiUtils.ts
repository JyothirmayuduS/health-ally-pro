import { DDI_RULES, type DDIRule } from "./ddiData";

export interface DDIAlert {
  rule: DDIRule;
  drugA: string;
  drugB: string;
}

/**
 * Checks for clinical drug-drug interactions between medications.
 * Checks interaction between any new drugs being dispensed, and between
 * new drugs and the patient's existing active medications.
 */
export function checkDDI(currentDrugs: string[], patientActiveDrugs: string[]): DDIAlert[] {
  const alerts: DDIAlert[] = [];
  const checkedKeys = new Set<string>();

  const checkPair = (d1: string, d2: string) => {
    const name1 = d1.trim().toLowerCase();
    const name2 = d2.trim().toLowerCase();
    if (!name1 || !name2 || name1 === name2) return;

    const key = [name1, name2].sort().join("|");
    if (checkedKeys.has(key)) return;
    checkedKeys.add(key);

    for (const rule of DDI_RULES) {
      const ruleA = rule.drugA.trim().toLowerCase();
      const ruleB = rule.drugB.trim().toLowerCase();

      const match =
        (ruleA === name1 && ruleB === name2) ||
        (ruleA === name2 && ruleB === name1);

      if (match) {
        alerts.push({
          rule,
          drugA: d1,
          drugB: d2,
        });
      }
    }
  };

  // 1. Check interactions within the new prescription items
  for (let i = 0; i < currentDrugs.length; i++) {
    for (let j = i + 1; j < currentDrugs.length; j++) {
      checkPair(currentDrugs[i], currentDrugs[j]);
    }
  }

  // 2. Check interactions between new prescription items and active medications
  for (const curr of currentDrugs) {
    for (const act of patientActiveDrugs) {
      checkPair(curr, act);
    }
  }

  return alerts;
}
