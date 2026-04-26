import { PulseForm } from "./PulseForm";

export default async function PulseFormPage({ params }: { params: { projectId: string } }) {
  const projectId = params.projectId;

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

        <PulseForm projectId={projectId} />
      </div>
    </div>
  );
}
