export interface DDIRule {
  drugA: string;
  drugB: string;
  severity: "major" | "moderate" | "minor";
  effect: string;
  recommendation: string;
}

export const DDI_RULES: DDIRule[] = [
  {
    drugA: "Warfarin",
    drugB: "Aspirin",
    severity: "major",
    effect: "Increased risk of severe bleeding due to additive antiplatelet/anticoagulant effects.",
    recommendation: "Avoid concurrent use unless specifically directed. Monitor INR and signs of bleeding."
  },
  {
    drugA: "Metformin",
    drugB: "Alcohol",
    severity: "moderate",
    effect: "Potentiates Metformin's effect on lactate metabolism, raising the risk of lactic acidosis.",
    recommendation: "Advise patient to avoid excessive alcohol consumption while taking Metformin."
  },
  {
    drugA: "Amlodipine",
    drugB: "Simvastatin",
    severity: "moderate",
    effect: "Amlodipine increases systemic exposure of Simvastatin, raising myopathy/rhabdomyolysis risk.",
    recommendation: "Limit Simvastatin dose to a maximum of 20 mg/day if taken with Amlodipine."
  },
  {
    drugA: "Ciprofloxacin",
    drugB: "Calcium Carbonate",
    severity: "moderate",
    effect: "Chelation by calcium reduces gastrointestinal absorption of Ciprofloxacin.",
    recommendation: "Administer Ciprofloxacin at least 2 hours before or 6 hours after antacids/calcium."
  },
  {
    drugA: "Fluoxetine",
    drugB: "Tramadol",
    severity: "major",
    effect: "Increased risk of serotonin syndrome and potential reduction of Tramadol's analgesic efficacy.",
    recommendation: "Monitor closely for serotonergic signs (tremor, hyperreflexia). Consider alternative analgesics."
  },
  {
    drugA: "Sertraline",
    drugB: "Tramadol",
    severity: "major",
    effect: "Risk of serotonin syndrome via combined serotonergic pathways.",
    recommendation: "Monitor for mental status changes and autonomic instability. Discontinue if serotonin syndrome suspected."
  },
  {
    drugA: "Methotrexate",
    drugB: "Ibuprofen",
    severity: "major",
    effect: "NSAIDs reduce renal clearance of Methotrexate, leading to toxicity (bone marrow suppression).",
    recommendation: "Avoid concurrent use. Use alternative non-NSAID analgesics (e.g., Paracetamol)."
  },
  {
    drugA: "Digoxin",
    drugB: "Amiodarone",
    severity: "major",
    effect: "Amiodarone increases serum Digoxin concentrations by reducing renal/non-renal clearance.",
    recommendation: "Reduce Digoxin dose by 30% to 50% when initiating Amiodarone. Monitor serum Digoxin levels."
  },
  {
    drugA: "Clopidogrel",
    drugB: "Omeprazole",
    severity: "moderate",
    effect: "Omeprazole inhibits CYP2C19, reducing Clopidogrel activation and antiplatelet efficacy.",
    recommendation: "Consider using Pantoprazole as an alternative PPI which has less CYP2C19 inhibition."
  },
  {
    drugA: "Nitroglycerin",
    drugB: "Sildenafil",
    severity: "major",
    effect: "Severe, life-threatening hypotension due to synergistic vasodilatory action.",
    recommendation: "Strictly contraindicated. Sildenafil should not be used within 24 hours of Nitroglycerin."
  },
  {
    drugA: "Spironolactone",
    drugB: "Potassium Chloride",
    severity: "major",
    effect: "Additive potassium-retaining effects increase risk of severe hyperkalemia.",
    recommendation: "Avoid co-administration unless serum potassium is actively monitored daily."
  },
  {
    drugA: "Atorvastatin",
    drugB: "Gemfibrozil",
    severity: "major",
    effect: "Gemfibrozil inhibits statin glucuronidation, raising statin levels and risk of rhabdomyolysis.",
    recommendation: "Avoid combination. Choose alternative lipid-lowering agents."
  },
  {
    drugA: "Lisinopril",
    drugB: "Spironolactone",
    severity: "moderate",
    effect: "Hyperkalemic risks are elevated through joint inhibition of aldosterone pathways.",
    recommendation: "Monitor serum potassium levels within 1-2 weeks of initiation/dose changes."
  },
  {
    drugA: "Clarithromycin",
    drugB: "Simvastatin",
    severity: "major",
    effect: "Strong CYP3A4 inhibition by Clarithromycin significantly increases Simvastatin levels.",
    recommendation: "Hold Simvastatin therapy during course of Clarithromycin. Monitor for muscle pain."
  },
  {
    drugA: "Levofloxacin",
    drugB: "Amiodarone",
    severity: "major",
    effect: "Additive prolongation of the QT interval, increasing risks of Torsades de Pointes.",
    recommendation: "Avoid concurrent use. Use alternative non-fluoroquinolone antibiotic if possible."
  },
  {
    drugA: "Gliclazide",
    drugB: "Ciprofloxacin",
    severity: "moderate",
    effect: "Ciprofloxacin may enhance the hypoglycemic effect of sulfonylureas.",
    recommendation: "Monitor blood glucose levels frequently. Educate patient on signs of hypoglycemia."
  },
  {
    drugA: "Levodopa",
    drugB: "Iron Supplements",
    severity: "moderate",
    effect: "Iron chelates Levodopa, reducing its bioavailability and clinical efficacy.",
    recommendation: "Space administration by at least 2 hours."
  },
  {
    drugA: "Levothyroxine",
    drugB: "Calcium Carbonate",
    severity: "moderate",
    effect: "Calcium decreases absorption of Levothyroxine from the gut.",
    recommendation: "Separate administration times by at least 4 hours."
  },
  {
    drugA: "Ketoconazole",
    drugB: "Simvastatin",
    severity: "major",
    effect: "Potent CYP3A4 inhibitor increases Simvastatin exposure, elevating myopathy risk.",
    recommendation: "Contraindicated. Discontinue Simvastatin during Ketoconazole treatment."
  },
  {
    drugA: "Theophylline",
    drugB: "Ciprofloxacin",
    severity: "major",
    effect: "Ciprofloxacin inhibits theophylline clearance, increasing risk of seizures and arrhythmias.",
    recommendation: "Avoid concurrent use. If necessary, monitor theophylline levels closely and adjust dose."
  }
];
