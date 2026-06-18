import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
};

export default function Header({ title, onBack, right, subtitle }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-navy-900 text-white">
      <div className="flex h-14 items-center gap-2 px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="-ml-1 p-1 active:opacity-70"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-medium leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-white/70">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
