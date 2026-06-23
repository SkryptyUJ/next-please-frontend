import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white border-transparent disabled:bg-blue-300",
  secondary:
    "bg-white hover:bg-zinc-50 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700",
  danger:
    "bg-red-600 hover:bg-red-700 text-white border-transparent disabled:bg-red-300",
  ghost:
    "bg-transparent hover:bg-zinc-100 text-zinc-700 border-transparent dark:text-zinc-200 dark:hover:bg-zinc-800",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
