type Props = {
  title: string;
  description?: string;
};

export function PortalPlaceholder({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <p className="label-eyebrow">Coming soon</p>
      <h1 className="mt-3 text-balance text-4xl tracking-tight md:text-5xl">{title}</h1>
      {description && <p className="mt-4 max-w-prose text-ink-muted">{description}</p>}
      <div className="card-soft mt-8 p-8">
        <p className="text-sm text-ink-muted">
          This module is scaffolded and ready for feature implementation. Navigation, auth, and
          database foundation are in place.
        </p>
      </div>
    </div>
  );
}
