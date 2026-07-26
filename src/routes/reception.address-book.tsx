import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { loadAddressBook, saveAddressBook, type AddressBookEntry } from "@/lib/hospital-masters";
import {
  DeskPanel,
  DeskTable,
  DeskThead,
  DeskTh,
  DeskTd,
  DeskTr,
} from "@/components/desk-shell/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/reception/address-book")({
  component: AddressBookPage,
});

function AddressBookPage() {
  const [rows, setRows] = useState<AddressBookEntry[]>(() => loadAddressBook());

  function saveAll() {
    saveAddressBook(rows);
    toast.success("Address book saved");
  }

  return (
    <div className="space-y-4" data-testid="reception-address-book">
      <DeskPanel title="Address book" subtitle="Referrers, TPAs, reference labs, internal contacts">
        <div className="flex justify-end border-b border-ink-100 p-3">
          <button
            type="button"
            onClick={saveAll}
            className="rounded-md bg-sage px-4 py-2 text-[12px] text-white"
          >
            Save
          </button>
        </div>
        <DeskTable>
          <DeskThead>
            <DeskTh>Name</DeskTh>
            <DeskTh>Role</DeskTh>
            <DeskTh>Organization</DeskTh>
            <DeskTh>Phone</DeskTh>
            <DeskTh>Tags</DeskTh>
          </DeskThead>
          <tbody>
            {rows.map((r) => (
              <DeskTr key={r.id}>
                <DeskTd>{r.name}</DeskTd>
                <DeskTd>{r.role}</DeskTd>
                <DeskTd>{r.organization ?? "—"}</DeskTd>
                <DeskTd>{r.phone}</DeskTd>
                <DeskTd>{(r.tags ?? []).join(", ") || "—"}</DeskTd>
              </DeskTr>
            ))}
          </tbody>
        </DeskTable>
      </DeskPanel>
    </div>
  );
}
