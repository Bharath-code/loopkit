"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormTextarea } from "@/components/form-textarea";

const pulseSubmitSchema = z.object({
  text: z
    .string()
    .min(1, "Please share your feedback")
    .max(500, "Feedback must be under 500 characters"),
});

type PulseSubmitForm = z.infer<typeof pulseSubmitSchema>;

const MAX_CHARS = 500;

export function PulseForm({ projectId }: { projectId: string }) {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PulseSubmitForm>({
    resolver: zodResolver(pulseSubmitSchema),
    defaultValues: { text: "" },
  });

  const textValue = watch("text");
  const charCount = textValue?.length ?? 0;
  const nearLimit = charCount > MAX_CHARS * 0.9;

  const onSubmit = async (data: PulseSubmitForm) => {
    try {
      const res = await fetch("/api/pulse/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text: data.text }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        setError("root", {
          message: responseData.error || "Failed to submit feedback",
        });
        return;
      }

      setIsSuccess(true);
      reset();
    } catch {
      setError("root", {
        message: "Network error. Please try again.",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
        <p className="text-green-400 font-medium">
          Thank you for your feedback!
        </p>
        <button
          onClick={() => setIsSuccess(false)}
          className="mt-4 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormTextarea
        label=""
        registration={register("text")}
        placeholder="What could be improved?"
        rows={4}
        maxLength={MAX_CHARS}
        error={errors.text}
        hint=""
        className="[&_label]:sr-only"
      />
      <div className="flex justify-between items-center mb-4 -mt-1">
        <p className="text-xs text-zinc-500">
          HTML will be stripped automatically
        </p>
        <p
          className={`text-xs ${nearLimit ? "text-amber-400" : "text-zinc-500"}`}
        >
          {charCount}/{MAX_CHARS}
        </p>
      </div>
      {errors.root && (
        <p className="text-sm text-red-400 mb-4">{errors.root.message}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !textValue?.trim()}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors cursor-pointer"
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
