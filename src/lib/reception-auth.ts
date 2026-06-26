/** Stub auth guard for reception routes — replace with Supabase session check later */
export function useReceptionAuth() {
  return {
    isAuthenticated: true,
    role: "receptionist" as const,
    user: {
      name: "Priya Sharma",
      role: "Receptionist",
    },
  };
}

export function requireReceptionist(): boolean {
  return true;
}
