import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormTextareaProps {
  label: string;
  error?: FieldError;
  hint?: string;
  registration: UseFormRegisterReturn;
  className?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export function FormTextarea({
  label,
  error,
  hint,
  registration,
  className,
  placeholder,
  rows = 4,
  maxLength,
  showCount = false,
}: FormTextareaProps) {
  const valueLength = registration.name ? 0 : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <textarea
        {...registration}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={!!error}
        className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
      />
      <div className="flex justify-between items-center">
        <div>
          {error && <p className="text-xs text-destructive">{error.message}</p>}
          {!error && hint && (
            <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {showCount && maxLength && (
          <p className="text-xs text-zinc-500">
            {valueLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
