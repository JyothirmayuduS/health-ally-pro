import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  TestTube2,
  Microscope,
  CheckCircle2,
  BookOpen,
  BarChart3,
  Boxes,
  Settings2,
  FlaskConical,
  Search,
  ChevronDown,
  LogOut,
  Users2,
  Stethoscope,
  ClipboardPlus,
} from "lucide-react";
import { useLab } from "@/lab/store";
import { useAuth } from "@/lab/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERSONA = {
  lab_supervisor: { label: "Lab Supervisor", accent: "bg-[var(--sage-700)]" },
  lab_technician: { label: "Lab Technician", accent: "bg-indigo-500" },
  doctor: { label: "Doctor", accent: "bg-sky-600" },
  receptionist: { label: "Receptionist", accent: "bg-amber-600" },
};

const LAB_NAV = [
  { to: "/lab", end: true, label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/lab/orders", label: "Orders", icon: ClipboardList, key: "orders" },
  { to: "/lab/collection", label: "Collection", icon: TestTube2, key: "collection" },
  { to: "/lab/processing", label: "Processing", icon: Microscope, key: "processing" },
  { to: "/lab/validation", label: "Validation", icon: CheckCircle2, key: "validation" },
];
const LAB_REF_NAV = [
  { to: "/lab/catalog", label: "Test Catalog", icon: BookOpen, key: "catalog" },
  { to: "/lab/samples", label: "Sample Tracking", icon: Boxes, key: "samples" },
  { to: "/lab/reports", label: "Reports", icon: BarChart3, key: "reports" },
  { to: "/lab/settings", label: "Settings", icon: Settings2, key: "settings" },
];

const DOCTOR_NAV = [
  { to: "/doctor", end: true, label: "My Patients", icon: LayoutDashboard, key: "doctor-home" },
  { to: "/doctor/new-order", label: "Place Order", icon: ClipboardPlus, key: "new-order" },
  { to: "/doctor/results", label: "My Results", icon: BarChart3, key: "results" },
];

const RECEPTION_NAV = [
  { to: "/reception", end: true, label: "Walk-in Desk", icon: LayoutDashboard, key: "reception" },
  { to: "/reception/walkin", label: "New Walk-in", icon: ClipboardPlus, key: "walkin" },
];

const ADMIN_NAV = [{ to: "/admin/users", label: "Team & Roles", icon: Users2, key: "team" }];

function navForRole(role) {
  if (role === "doctor") return { primary: DOCTOR_NAV, secondary: [] };
  if (role === "receptionist") return { primary: RECEPTION_NAV, secondary: [] };
  // lab roles see lab
  const secondary = role === "lab_supervisor" ? [...LAB_REF_NAV, ...ADMIN_NAV] : LAB_REF_NAV;
  return { primary: LAB_NAV, secondary };
}

function Item({ to, end, label, icon: Icon, badge, testid }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={testid}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all",
          isActive
            ? "bg-[var(--sage-700)] text-white shadow-sm"
            : "text-stone-600 hover:bg-stone-100 hover:text-[var(--ink)]",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge !== 0 && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/90 text-[var(--sage-900)]">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { orders, hospital } = useLab();
  const location = useLocation();
  const navigate = useNavigate();
  const persona = PERSONA[user?.role] || PERSONA.lab_technician;

  const { primary, secondary } = navForRole(user?.role);

  // Build counts for lab role only
  const counts = {
    orders: orders.filter((o) => o.status === "ordered").length,
    collection: orders.filter((o) => ["ordered", "collected"].includes(o.status)).length,
    processing: orders.filter((o) => o.status === "processing").length,
    validation: orders.filter((o) => o.status === "validation").length,
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[var(--paper)] grain-bg">
      <aside className="w-64 shrink-0 border-r border-stone-200 bg-white/70 backdrop-blur-md flex flex-col" data-testid="app-sidebar">
        <div className="p-5 border-b border-stone-200/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[var(--sage-700)] flex items-center justify-center shadow-sm">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold text-[var(--ink)] tracking-tight">Medora</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-500">{hospital.clia}</div>
            </div>
          </div>
        </div>

        <nav className="px-3 py-4 flex-1 overflow-y-auto">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 px-3 mb-2 flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full", persona.accent)} />
            {persona.label}
          </div>
          <div className="space-y-0.5">
            {primary.map(({ key, ...n }) => (
              <Item key={key} {...n} badge={user?.role?.startsWith("lab_") ? counts[key] : undefined} testid={`nav-${key}`} />
            ))}
          </div>
          {secondary.length > 0 && (
            <>
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 px-3 mt-6 mb-2">Reference</div>
              <div className="space-y-0.5">
                {secondary.map(({ key, ...n }) => (
                  <Item key={key} {...n} testid={`nav-${key}`} />
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-stone-200/70">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-stone-500 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All systems normal
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-stone-200 bg-white/60 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20" data-testid="topbar">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              data-testid="global-search-input"
              placeholder="Search patient, MRN, order ID, accession…"
              className="pl-9 h-9 bg-white border-stone-200 focus-visible:ring-[var(--sage-500)]"
            />
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="user-menu-btn" className="gap-2 border-stone-200">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-[var(--sage-100)] flex items-center justify-center text-[11px] font-semibold text-[var(--sage-900)]">
                      {user?.name?.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  <div className="text-left leading-tight">
                    <div className="text-[13px] font-medium">{user?.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      {persona.label}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user?.role === "lab_supervisor" && (
                  <DropdownMenuItem onClick={() => navigate("/admin/users")} data-testid="menu-team">
                    <Users2 className="h-4 w-4 mr-2" /> Team & roles
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" key={location.pathname}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
