export type NoteTemplate = {
  id: string;
  label: string;
  complaint: string;
  objective: string;
  assessment: string;
  plan: string;
};

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "follow-up",
    label: "Stable follow-up",
    complaint: "Patient returns for scheduled follow-up. No new acute complaints.",
    objective: "Vitals stable. Physical exam unremarkable. No acute distress.",
    assessment: "Chronic conditions stable on current regimen.",
    plan: "Continue current medications. Routine labs as indicated. RTC in 3 months.",
  },
  {
    id: "htn-review",
    label: "HTN review",
    complaint: "Follow-up for blood pressure management.",
    objective: "BP as recorded today. Home readings reviewed. No headache, chest pain, or vision changes.",
    assessment: "Hypertension — assess control vs target.",
    plan: "Adjust antihypertensive if needed. Lifestyle counseling. Repeat BP in 2 weeks.",
  },
  {
    id: "dm-review",
    label: "Diabetes review",
    complaint: "Diabetes follow-up. Diet and medication adherence discussed.",
    objective: "Weight and vitals reviewed. Foot exam normal. No hypoglycemic episodes reported.",
    assessment: "Type 2 diabetes — glycemic control under review.",
    plan: "Order HbA1c. Continue metformin. Diabetes education reinforced.",
  },
  {
    id: "respiratory",
    label: "Respiratory exacerbation",
    complaint: "Worsening shortness of breath / cough. Inhaler use increased.",
    objective: "SpO2 and respiratory rate noted. Wheeze on auscultation. No cyanosis.",
    assessment: "Acute asthma exacerbation — moderate.",
    plan: "Nebulizer / bronchodilator. Short steroid burst if indicated. RTC 48–72h or ED if worse.",
  },
];
