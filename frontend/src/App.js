import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LabProvider } from "@/lab/store";
import LabShell from "@/lab/LabShell";
import LabDashboard from "@/lab/pages/Dashboard";
import Orders from "@/lab/pages/Orders";
import Collection from "@/lab/pages/Collection";
import Processing from "@/lab/pages/Processing";
import Validation from "@/lab/pages/Validation";
import Catalog from "@/lab/pages/Catalog";
import Samples from "@/lab/pages/Samples";
import Reports from "@/lab/pages/Reports";
import Settings from "@/lab/pages/Settings";

function App() {
  return (
    <div className="App">
      <LabProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/lab" replace />} />
            <Route path="/lab" element={<LabShell />}>
              <Route index element={<LabDashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="collection" element={<Collection />} />
              <Route path="processing" element={<Processing />} />
              <Route path="validation" element={<Validation />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="samples" element={<Samples />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/lab" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </LabProvider>
    </div>
  );
}

export default App;
