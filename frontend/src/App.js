import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Register from "@/pages/Register";
import Patients from "@/pages/Patients";
import Appointments from "@/pages/Appointments";
import NewAppointment from "@/pages/NewAppointment";
import CheckIn from "@/pages/CheckIn";
import Queue from "@/pages/Queue";
import Billing from "@/pages/Billing";
import CashDrawer from "@/pages/CashDrawer";
import Insurance from "@/pages/Insurance";
import Reports from "@/pages/Reports";
import TokenDisplay from "@/pages/TokenDisplay";

function App() {
  return (
    <div className="App">
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/reception" replace />} />
            <Route path="/reception/token-display" element={<TokenDisplay />} />
            <Route element={<AppLayout />}>
              <Route path="/reception" element={<Dashboard />} />
              <Route path="/reception/register" element={<Register />} />
              <Route path="/reception/patients" element={<Patients />} />
              <Route path="/reception/appointments" element={<Appointments />} />
              <Route path="/reception/appointments/new" element={<NewAppointment />} />
              <Route path="/reception/check-in" element={<CheckIn />} />
              <Route path="/reception/queue" element={<Queue />} />
              <Route path="/reception/billing" element={<Billing />} />
              <Route path="/reception/cash-drawer" element={<CashDrawer />} />
              <Route path="/reception/insurance" element={<Insurance />} />
              <Route path="/reception/reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/reception" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </div>
  );
}

export default App;
