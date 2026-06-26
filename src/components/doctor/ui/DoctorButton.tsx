import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "lime";
};

export function DoctorButton({ variant = "primary", className, ...props }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
        variant === "primary" && "bg-[#1B3B2E] text-white hover:bg-[#254A3A]",
        variant === "secondary" &&
          "border border-[#E8E4DF] bg-white text-[#1B3B2E] hover:bg-[#F5F2ED]",
        variant === "lime" && "bg-[#B8735D] text-white hover:bg-[#A66550]",
        className,
      )}
      {...props}
    />
  );
}

export const doctorInputClass =
  "w-full rounded-2xl border border-[#E8E4DF] bg-white px-4 py-3 text-sm text-[#1B3B2E] placeholder:text-[#8A8F8C] focus:border-[#B8735D]/40 focus:outline-none focus:ring-2 focus:ring-[#B8735D]/20";
