import { useEffect, useState } from "react";
import {
  getClinicalDietProfile,
  loadClinicalDietProfile,
  type ClinicalDietProfile,
} from "@/lib/patient-diet-profile";

export function useClinicalDietProfile(): {
  profile: ClinicalDietProfile;
  loading: boolean;
  refresh: () => Promise<ClinicalDietProfile>;
} {
  const [profile, setProfile] = useState<ClinicalDietProfile>(() => getClinicalDietProfile());
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const next = await loadClinicalDietProfile();
      setProfile(next);
      return next;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { profile, loading, refresh };
}
