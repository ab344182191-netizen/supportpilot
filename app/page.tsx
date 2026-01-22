"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles, Phone, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Salam! SupportPilot me aap kya poochna chahte hain?" },
  ]);

  // Lead capture
  const [needsLead, setNeedsLead] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, needsLead, loading]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || "Request failed");

      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);

      if (data.needsLead) {
        setNeedsLead(true);
        setPendingQuestion(text);
      } else {
        setNeedsLead(false);
        setPendingQuestion("");
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${err?.message ?? "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!leadPhone.trim() || !pendingQuestion) return;

    setLeadSaving(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          question: pendingQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.details || data?.error || "Lead save failed");

      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Shukriya! Hum jald aap se contact kar lenge." },
      ]);

      setNeedsLead(false);
      setPendingQuestion("");
      setLeadName("");
      setLeadPhone("");
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Error: ${err?.message ?? "Unknown error"}` },
      ]);
    } finally {
      setLeadSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">SupportPilot</h1>
              <p className="text-sm text-slate-300">
                Gemini + Supabase • FAQ bot + lead capture
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Online
          </div>
        </div>

        {/* Chat Card */}
        <div className="mt-6 rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
          <div className="h-[480px] overflow-y-auto p-4 md:p-6">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={[
                    "mb-3 flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start",
                  ].join(" ")}
                >
                  {m.role === "assistant" && (
                    <div className="mt-1 grid h-9 w-9 place-items-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/20">
                      <span className="text-xs font-semibold text-indigo-200">SP</span>
                    </div>
                  )}

                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1",
                      m.role === "user"
                        ? "bg-indigo-500/20 ring-indigo-300/20"
                        : "bg-white/10 ring-white/10",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>

                  {m.role === "user" && (
                    <div className="mt-1 grid h-9 w-9 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                      <span className="text-xs font-semibold text-slate-200">You</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {loading && (
              <div className="mb-3 flex items-center gap-3">
                <div className="mt-1 grid h-9 w-9 place-items-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/20">
                  <span className="text-xs font-semibold text-indigo-200">SP</span>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/10">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4 md:p-5">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message SupportPilot..."
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-indigo-400/40"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/80 px-4 py-3 text-sm font-medium text-white ring-1 ring-indigo-300/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </form>

            {/* Lead form (animated) */}
            <AnimatePresence>
              {needsLead && (
                <motion.form
                  onSubmit={submitLead}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.18 }}
                  className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Contact details</div>
                      <div className="text-xs text-slate-300">
                        Hum aap se contact kar ke jawab de dein ge.
                      </div>
                    </div>
                    <div className="hidden items-center gap-2 text-xs text-slate-300 md:flex">
                      <Phone className="h-4 w-4" />
                      Lead capture
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Name (optional)"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400/40"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        placeholder="Mobile number (required)"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-10 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={leadSaving || !leadPhone.trim()}
                    className="mt-3 w-full rounded-2xl bg-emerald-500/80 px-4 py-3 text-sm font-medium text-white ring-1 ring-emerald-300/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {leadSaving ? "Saving..." : "Submit"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Tip: Add more FAQs in Supabase → Table Editor → faqs.
        </p>
      </div>
    </main>
  );
}