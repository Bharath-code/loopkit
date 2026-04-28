import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps {
  label: string;
  error?: FieldError;
  hint?: string;
  registration: UseFormRegisterReturn;
  className?: string;
  type?: string;
  placeholder?: string;
}

export function FormInput({
  label,
  error,
  hint,
  registration,
  className,
  type = "text",
  placeholder,
}: FormInputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        {...registration}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
      {!error && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
