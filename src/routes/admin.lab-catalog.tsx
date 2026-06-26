import { createFileRoute } from "@tanstack/react-router";
import LabCatalogEditor from "@/components/shared/LabCatalogEditor";
import { loadLabCatalog, updateCatalogItem, addCatalogItem } from "@/lib/shared/lab-catalog";
import { useState } from "react";
import type { LabCatalogItem } from "@/lib/lab-desk/mockData";

export const Route = createFileRoute("/admin/lab-catalog")({
  component: AdminLabCatalog,
});

function AdminLabCatalog() {
  const [catalog, setCatalog] = useState(() => loadLabCatalog());

  function onUpdatePrice(code: string, price: number) {
    setCatalog(updateCatalogItem(code, { price }, catalog));
  }

  function onAddTest(item: LabCatalogItem) {
    setCatalog(addCatalogItem(item, catalog));
  }

  return (
    <div className="space-y-5" data-testid="admin-lab-catalog">
      <LabCatalogEditor
        mode="admin"
        catalog={catalog}
        onUpdatePrice={onUpdatePrice}
        onAddTest={onAddTest}
      />
    </div>
  );
}
