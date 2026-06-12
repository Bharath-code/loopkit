/**
 * /dashboard/settings — email preferences and digest preview.
 *
 * Lets the user opt in/out of the Sunday email digest, and includes
 * a "Send test digest" button so they can preview what the cron
 * will deliver to their inbox.
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Send, Check, X } from "lucide-react";

export default function DashboardSettingsPage() {
  const user = useQuery(api.users.me);
  const prefs = useQuery(api.email.getMyPreferences);
  const optIn = useMutation(api.email.optInSelf);
  const optOut = useMutation(api.email.optOutSelf);
  const sendTest = useMutation(api.email.sendWeeklyDigest);

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  const subscribed = prefs?.emailOptIn ?? false;

  const handleToggle = async () => {
    if (subscribed) {
      await optOut();
    } else {
      await optIn();
    }
  };

  const handleSendTest = async () => {
    if (!user._id) return;
    setSending(true);
    setSendResult(null);
    try {
      const result = (await sendTest({
        userId: user._id as Id<"users">,
      })) as { ok: boolean; error?: string };
      if (result.ok) {
        setSendResult({ ok: true, message: "Test digest sent. Check your inbox." });
      } else {
        setSendResult({
          ok: false,
          message: result.error ?? "Failed to send. Try again later.",
        });
      }
    } catch (err) {
      setSendResult({
        ok: false,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 fade-up max-w-2xl">
      <header>
        <h1 className="text-title text-white mb-2">Settings</h1>
        <p className="text-zinc-400 text-sm">
          Notification preferences for {user.email ?? "your account"}.
        </p>
      </header>

      {/* ─── Email digest ──────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">
              Sunday digest
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              A weekly recap every Sunday morning. Tasks completed, shipping
              score, your one-thing, and a link to your dashboard.
              Plain text, no marketing, no tracking pixels.
            </p>

            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  subscribed ? "bg-violet-600" : "bg-zinc-700"
                }`}
                role="switch"
                aria-checked={subscribed}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    subscribed ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-zinc-300">
                {subscribed ? (
                  <>
                    <Check className="h-3.5 w-3.5 inline text-emerald-400 mr-1" />
                    Subscribed
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 inline text-zinc-500 mr-1" />
                    Not subscribed
                  </>
                )}
              </span>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <Button
                onClick={handleSendTest}
                disabled={sending || !subscribed}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? "Sending..." : "Send test digest"}
              </Button>
              <p className="text-xs text-zinc-500 mt-2">
                Previews the email you'd receive next Sunday. Requires
                Resend to be configured on the server.
              </p>

              {sendResult && (
                <div
                  className={`mt-3 p-3 rounded-lg text-xs ${
                    sendResult.ok
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-300 border border-red-500/20"
                  }`}
                >
                  {sendResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Forward look ─────────────────────────────────────── */}
      <Card className="p-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-2">Coming soon</h2>
        <ul className="text-sm text-zinc-500 space-y-1.5">
          <li>• Streak-at-risk notifications (the day before your streak breaks)</li>
          <li>• Push notifications when a `ship` is posted to your wins</li>
          <li>• Public profile URL with custom handle</li>
        </ul>
      </Card>
    </div>
  );
}
