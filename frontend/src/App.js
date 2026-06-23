import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/lib/auth/authContext";
import LoginPage from "@/components/auth/LoginPage";
import PharmacyLayout from "@/components/pharmacy-desk/PharmacyLayout";
import Dashboard from "@/routes/PharmacyDashboard";
import Prescriptions from "@/routes/PharmacyPrescriptions";
import Dispense from "@/routes/PharmacyDispense";
import Refills from "@/routes/PharmacyRefills";
import Inventory from "@/routes/PharmacyInventory";
import Search from "@/routes/PharmacySearch";
import StorageMap from "@/routes/PharmacyStorageMap";
import Landing from "@/routes/Landing";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/pharmacy" element={<PharmacyLayout />}>
              <Route index               element={<Dashboard />} />
              <Route path="prescriptions" element={<Prescriptions />} />
              <Route path="dispense"      element={<Dispense />} />
              <Route path="refills"       element={<Refills />} />
              <Route path="inventory"     element={<Inventory />} />
              <Route path="inventory/map" element={<StorageMap />} />
              <Route path="search"        element={<Search />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
