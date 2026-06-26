/** Mobile bottom nav: Care tab active routes */
export function isCareRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/care") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/queue") ||
    pathname.startsWith("/doctors")
  );
}

/** Mobile bottom nav: Health tab active routes */
export function isHealthRoute(pathname: string): boolean {
  return (
    pathname === "/health" ||
    pathname.startsWith("/medications") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/reports")
  );
}

/** Mobile bottom nav: Exercise / Move tab */
export function isExerciseRoute(pathname: string): boolean {
  return pathname === "/exercise" || pathname.startsWith("/exercise/");
}

export function isPatientHubRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/care") ||
    pathname === "/health" ||
    pathname.startsWith("/diet") ||
    pathname.startsWith("/exercise") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/queue") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/medications") ||
    pathname.startsWith("/prescriptions") ||
    pathname.startsWith("/profile") ||
    pathname === "/doctors"
  );
}
