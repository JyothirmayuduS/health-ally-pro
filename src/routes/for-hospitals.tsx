import { createFileRoute } from "@tanstack/react-router";
import ForHospitalsPage from "@/components/marketing/ForHospitalsPage";

export const Route = createFileRoute("/for-hospitals")({
  head: () => ({
    meta: [
      { title: "Medora for Hospitals — Multi-specialty HMS" },
      {
        name: "description",
        content:
          "License Medora for your multi-specialty hospital: specialty doctor desks, 3D anatomy, lab, pharmacy, billing, and patient engagement.",
      },
    ],
  }),
  component: ForHospitalsPage,
});
