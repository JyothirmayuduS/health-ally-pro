import { createFileRoute, Link } from "@tanstack/react-router";
import { DependentDetailPage } from "@/components/patient/profile/DependentDetailPage";
import { getDependent } from "@/lib/dependents-store";
import { DEPENDENTS } from "@/lib/patient-profile-data";

function resolveDependent(id: string) {
  return getDependent(id) ?? DEPENDENTS.find((d) => d.id === id);
}

export const Route = createFileRoute("/profile/dependents/$dependentId")({
  head: ({ params }) => {
    const dep = resolveDependent(params.dependentId);
    return {
      meta: [{ title: dep ? `${dep.name} — Medora` : "Dependent — Medora" }],
    };
  },
  component: function DependentDetailRoute() {
    const { dependentId } = Route.useParams();
    const dependent = resolveDependent(dependentId);
    if (!dependent) {
      return (
        <div className="py-16 text-center">
          <p className="text-ink-muted">Dependent not found.</p>
          <Link to="/profile/dependents/" className="mt-4 inline-block text-clay">
            Back to family profiles
          </Link>
        </div>
      );
    }
    return <DependentDetailPage dependentId={dependentId} />;
  },
});
