import { apkDoctor } from "@/lib/doctor-apk-data";

type Props = {
  title?: string;
  subtitle: string;
  showSearch?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
};

export function DoctorScreenHeader({
  title,
  subtitle,
  showSearch = false,
  search = "",
  onSearchChange = () => {},
}: Props) {
  const heading = title ?? apkDoctor.shortName;

  return (
    <header className="mb-6 space-y-2 sm:mb-8">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8A8F8C]">CLINIC</p>
      <h1 className="font-serif text-[1.75rem] font-semibold leading-tight text-[#1B3B2E] sm:text-[2rem]">
        {heading}
      </h1>
      <p className="text-sm text-[#8A8F8C]">{subtitle}</p>
      {showSearch && (
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patients, results…"
          className="mt-2 h-11 w-full max-w-md rounded-xl border border-[#E8E4DF] bg-white px-3.5 text-sm outline-none focus:border-[#B8735D]/50"
        />
      )}
    </header>
  );
}
