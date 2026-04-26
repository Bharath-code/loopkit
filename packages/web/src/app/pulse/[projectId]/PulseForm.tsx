"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export function PulseForm({ projectId }: { projectId: string }) {
  const [text, setText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitResponse = useMutation(api.pulse.submitResponse);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Convex natively queues this if offline
      await submitResponse({
        projectId: projectId as Id<"projects">,
        text,
      });
      setIsSuccess(true);
      setText("");
    } catch (error) {
      console.error("Failed to submit feedback", error);
      // Even if offline, Convex handles it gracefully in the background,
      // but if an actual error throws, we log it.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
        <p className="text-green-400 font-medium">Thank you for your feedback!</p>
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
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        placeholder="What could be improved?"
        rows={4}
        className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none mb-4"
      />
      <button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors cursor-pointer"
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}
