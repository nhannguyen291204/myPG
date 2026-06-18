import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none select-none";

const styles: Record<Variant, string> = {
  primary: "bg-navy-600 text-white active:bg-navy-900",
  secondary: "bg-navy-400 text-white active:opacity-90",
  outline: "border border-navy-600 text-navy-600 bg-transparent active:bg-navy-600/5",
};

export default function Button({
  variant = "primary",
  type = "button", // mặc định "button" để không vô tình submit form
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button type={type} className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
