import { SectionCard } from "./SectionCard";

export type SupplementItem = {
  id: string;
  index: string;
  name: string;
  imageUrl: string;
};

const defaultImages = [
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&h=160&fit=crop",
  "https://images.unsplash.com/photo-1550572017-edd226b30d85?w=120&h=160&fit=crop",
  "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=120&h=160&fit=crop",
  "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=120&h=160&fit=crop",
  "https://images.unsplash.com/photo-1620916564558-4fac8e68d6b3?w=120&h=160&fit=crop",
  "https://images.unsplash.com/photo-1587854692152-cf800aba4b7b?w=120&h=160&fit=crop",
];

type Props = {
  items: SupplementItem[];
  title?: string;
  subtitle?: string;
};

export function SupplementsPanel({
  items,
  title = "Your Vitamin Supplements",
  subtitle = "Don't forget to take your daily vitamin supplement today!",
}: Props) {
  return (
    <SectionCard
      variant="white"
      title={title}
      subtitle={subtitle}
      className="min-h-[520px]"
    >
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="group flex flex-col rounded-[22px] bg-[#EEF6D4]/70 p-4 transition-all hover:bg-[#EEF6D4] hover:shadow-[0_4px_16px_rgba(28,42,46,0.06)]"
          >
            <span className="text-[11px] font-bold text-[#CBD5E1]">{item.index}</span>
            <div className="flex flex-1 items-center justify-center py-3">
              <img
                src={item.imageUrl || defaultImages[i % defaultImages.length]}
                alt=""
                className="h-20 w-auto object-contain drop-shadow-[0_8px_16px_rgba(28,42,46,0.12)] transition-transform group-hover:scale-105"
              />
            </div>
            <p className="text-center text-xs font-bold text-[#1C2A2E]">{item.name}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-2" aria-hidden>
        <span className="h-1.5 w-7 rounded-full bg-[#1C2A2E]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBD5E1]" />
      </div>
    </SectionCard>
  );
}
