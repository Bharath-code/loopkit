import { redirect } from "next/navigation";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export default async function PulseFormPage({ params, searchParams }: { params: { projectId: string }, searchParams: { success?: string } }) {
  const projectId = params.projectId;

  // Render form
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            P
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Leave Feedback</h1>
          <p className="text-sm text-zinc-400">Your feedback goes directly to the founders to help prioritize the roadmap.</p>
        </div>

        {searchParams.success ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-green-400 font-medium">Thank you for your feedback!</p>
          </div>
        ) : (
          <form action={async (formData) => {
            "use server";
            const text = formData.get("text") as string;
            if (text && text.trim().length > 0) {
              await fetchMutation(api.pulse.submitResponse, {
                projectId: projectId as any,
                text,
              });
              redirect(`/pulse/${projectId}?success=true`);
            }
          }}>
            <textarea
              name="text"
              required
              placeholder="What could be improved?"
              rows={4}
              className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none mb-4"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors cursor-pointer"
            >
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
