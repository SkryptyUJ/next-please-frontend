import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
};

export function Field({ label, hint, error, id, className, ...rest }: FieldProps) {
  const inputId = id ?? rest.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
      <input
        id={inputId}
        className={`rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 ${className ?? ""}`}
        {...rest}
      />
      {hint && !error && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
