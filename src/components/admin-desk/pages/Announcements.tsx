import { useState } from "react";
import { useAdminStore } from "@/lib/admin-desk/store";
import { type AnnouncementPriority, type AnnouncementTarget } from "@/lib/shared/announcements";
import { Megaphone, AlertTriangle, Trash2, Calendar, Users, FlaskConical, Pill, Home, Plus, X } from "lucide-react";

export default function AdminAnnouncements() {
  const { announcements, createAnnouncement, expireAnnouncement } = useAdminStore();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [targets, setTargets] = useState<AnnouncementTarget[]>(["all"]);
  const [expiryHours, setExpiryHours] = useState("24");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    const expiresAt = new Date(Date.now() + Number(expiryHours) * 3600_000).toISOString();
    createAnnouncement({
      title,
      body,
      priority,
      targetModules: targets,
      createdBy: "Admin User",
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    // Reset and close
    setTitle("");
    setBody("");
    setPriority("normal");
    setTargets(["all"]);
    setExpiryHours("24");
    setModalOpen(false);
  };

  const handleToggleTarget = (target: AnnouncementTarget) => {
    if (target === "all") {
      setTargets(["all"]);
    } else {
      let next = targets.filter((t) => t !== "all");
      if (next.includes(target)) {
        next = next.filter((t) => t !== target);
        if (next.length === 0) next = ["all"];
      } else {
        next.push(target);
      }
      setTargets(next);
    }
  };

  const activeAnnouncements = announcements?.filter((a) => a.status === "active") ?? [];
  const expiredAnnouncements = announcements?.filter((a) => a.status === "expired") ?? [];

  return (
    <div className="space-y-6" data-testid="admin-announcements">
      {/* Header quick action */}
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] text-ink-400">
          Create announcements targeting Reception, Lab, Pharmacy or Hospital-wide feeds.
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-plum px-3 py-1.5 text-[12px] font-medium text-white hover:bg-plum-soft hover:text-plum transition flex items-center gap-1 shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Announcement
        </button>
      </div>

      {/* Active Notices */}
      <div className="space-y-4">
        <h3 className="text-[11.5px] uppercase font-mono tracking-widest text-ink-400">Active Board ({activeAnnouncements.length})</h3>
        
        {activeAnnouncements.length === 0 ? (
          <div className="surface p-8 text-center text-ink-400">
            No active announcements. Click "New Announcement" above to broadcast.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`surface p-5 flex flex-col justify-between border-l-4 ${
                  ann.priority === "emergency"
                    ? "border-l-red-500 bg-red-50/20"
                    : ann.priority === "urgent"
                    ? "border-l-amber-500 bg-amber-50/20"
                    : "border-l-teal bg-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border ${
                      ann.priority === "emergency"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : ann.priority === "urgent"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-teal-soft text-teal border-teal/20"
                    }`}>
                      {ann.priority}
                    </span>
                    <div className="flex gap-1">
                      {ann.targetModules.map((m) => (
                        <span key={m} className="bg-stone-100 text-ink-600 rounded px-1.5 py-0.5 text-[9px] uppercase font-mono">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h4 className="font-heading font-semibold text-ink-950 text-[14.5px] leading-snug">{ann.title}</h4>
                  <p className="text-[12.5px] text-ink-600 leading-relaxed">{ann.body}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-100/60 flex items-center justify-between text-[11px] text-ink-400">
                  <div>
                    By {ann.createdBy} · Expires {new Date(ann.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button
                    onClick={() => expireAnnouncement(ann.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    title="Archive/Deactivate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History / Archive */}
      {expiredAnnouncements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11.5px] uppercase font-mono tracking-widest text-ink-400">Archived Board ({expiredAnnouncements.length})</h3>
          <div className="surface overflow-hidden divide-y divide-ink-100">
            {expiredAnnouncements.map((ann) => (
              <div key={ann.id} className="px-5 py-3 flex items-center justify-between text-[13px] hover:bg-bone/20">
                <div>
                  <span className="font-semibold text-ink-900">{ann.title}</span>
                  <span className="ml-2 text-[10px] font-mono text-ink-400">Expired: {new Date(ann.expiresAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-1">
                  {ann.targetModules.map((m) => (
                    <span key={m} className="bg-stone-50 text-ink-400 rounded px-1 py-0.5 text-[8.5px] uppercase font-mono border">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcaster Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="surface max-w-md w-full overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="border-b border-ink-100 px-6 py-4 flex items-center justify-between bg-bone/20">
              <h3 className="font-heading font-semibold text-ink-950 flex items-center gap-1.5">
                <Megaphone className="h-5 w-5 text-plum" />
                New Board Broadcast
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-ink-400 hover:text-ink-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="block text-[11.5px] uppercase font-mono text-ink-400">Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., System Maintenance Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11.5px] uppercase font-mono text-ink-400">Message details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter detailed notice info..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11.5px] uppercase font-mono text-ink-400">Expiration</label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="w-full rounded border-stone-300 text-[13px] focus:ring-plum focus:border-plum"
                  >
                    <option value="2">2 Hours</option>
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="72">3 Days</option>
                    <option value="168">7 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="block text-[11.5px] uppercase font-mono text-ink-400">Target feeds</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Desks" },
                    { value: "reception", label: "Reception" },
                    { value: "lab", label: "Laboratory" },
                    { value: "pharmacy", label: "Pharmacy" },
                    { value: "ipd", label: "IPD Ward" },
                  ].map((tg) => {
                    const isChecked = targets.includes(tg.value as AnnouncementTarget);
                    return (
                      <button
                        type="button"
                        key={tg.value}
                        onClick={() => handleToggleTarget(tg.value as AnnouncementTarget)}
                        className={`rounded px-2.5 py-1 text-[11.5px] font-medium border transition ${
                          isChecked
                            ? "bg-plum-soft border-plum text-plum font-semibold"
                            : "bg-white border-stone-200 text-ink-500 hover:bg-stone-50"
                        }`}
                      >
                        {tg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-ink-100 px-6 py-4 flex justify-end gap-2 shrink-0 bg-bone/20">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-ink-200 px-3 py-1.5 text-[12px] font-medium text-ink-700 bg-white hover:bg-bone transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-plum px-3 py-1.5 text-[12px] font-medium text-white hover:bg-plum-soft hover:text-plum transition"
              >
                Broadcast Now
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
