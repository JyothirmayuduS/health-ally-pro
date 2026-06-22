import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  RefreshCw,
} from "lucide-react";
import { useLab, formatRelative } from "@/lab/store";
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

const NAV_PRIMARY = [
  { to: "/lab", end: true, label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/lab/orders", label: "Orders", icon: ClipboardList, key: "orders" },
  { to: "/lab/collection", label: "Collection", icon: TestTube2, key: "collection" },
  { to: "/lab/processing", label: "Processing", icon: Microscope, key: "processing" },
  { to: "/lab/validation", label: "Validation", icon: CheckCircle2, key: "validation" },
];

const NAV_SECONDARY = [
  { to: "/lab/catalog", label: "Test Catalog", icon: BookOpen, key: "catalog" },
  { to: "/lab/samples", label: "Sample Tracking", icon: Boxes, key: "samples" },
  { to: "/lab/reports", label: "Reports", icon: BarChart3, key: "reports" },
  { to: "/lab/settings", label: "Settings", icon: Settings2, key: "settings" },
];

function NavItem({ to, end, label, icon: Icon, badge, testid }) {
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
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/90 text-[var(--sage-900)] group-data-[active=true]:bg-white">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function LabShell() {
  const { orders, role, activeStaff, setRole, resetSeed, hospital } = useLab();
  const location = useLocation();

  const counts = {
    orders: orders.filter((o) => o.status === "ordered").length,
    collection: orders.filter((o) => o.status === "ordered" || o.status === "collected").length,
    processing: orders.filter((o) => o.status === "processing").length,
    validation: orders.filter((o) => o.status === "validation").length,
  };

  return (
    <div className="min-h-screen flex bg-[var(--paper)] grain-bg">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-stone-200 bg-white/70 backdrop-blur-md flex flex-col" data-testid="lab-sidebar">
        <div className="p-5 border-b border-stone-200/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[var(--sage-700)] flex items-center justify-center shadow-sm">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold text-[var(--ink)] tracking-tight">Medora Lab</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-500">{hospital.clia}</div>
            </div>
          </div>
        </div>

        <nav className="px-3 py-4 flex-1 overflow-y-auto">
          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 px-3 mb-2">Workflow</div>
          <div className="space-y-0.5">
            {NAV_PRIMARY.map(({ key, ...n }) => (
              <NavItem
                key={key}
                {...n}
                badge={counts[key]}
                testid={`nav-${key}`}
              />
            ))}
          </div>

          <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 px-3 mt-6 mb-2">
            Reference
          </div>
          <div className="space-y-0.5">
            {NAV_SECONDARY.map(({ key, ...n }) => (
              <NavItem key={key} {...n} testid={`nav-${key}`} />
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-stone-200/70">
          <button
            onClick={resetSeed}
            data-testid="reset-seed-btn"
            className="w-full text-[11px] font-mono uppercase tracking-wider text-stone-500 hover:text-[var(--sage-700)] flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-stone-100 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Reset mock data
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-stone-200 bg-white/60 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20" data-testid="lab-topbar">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              data-testid="global-search-input"
              placeholder="Search patient, MRN, order ID, accession…"
              className="pl-9 h-9 bg-white border-stone-200 focus-visible:ring-[var(--sage-500)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-stone-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Lab Open · Day Shift
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="role-switcher-btn"
                  className="gap-2 border-stone-200"
                >
                  <div className="h-7 w-7 rounded-full bg-[var(--sage-100)] flex items-center justify-center text-[11px] font-semibold text-[var(--sage-900)]">
                    {activeStaff.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[13px] font-medium">{activeStaff}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      {role.replace("_", " ")}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-wider text-stone-500">
                  Switch role (demo)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="switch-technician"
                  onClick={() => setRole("lab_technician")}
                >
                  <Microscope className="h-4 w-4 mr-2" /> Lab Technician
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-testid="switch-supervisor"
                  onClick={() => setRole("lab_supervisor")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Lab Supervisor
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
