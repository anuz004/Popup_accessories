import { useEffect, useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import { database } from "@/lib/api";
import { toast } from "sonner";

interface MessageRow { id: string; name: string; email: string; phone: string | null; message: string; status: string; created_at: string }
interface SubscriberRow { id: string; email: string; active: boolean; created_at: string }

export function InboxTab() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      database.from("contact_messages").select("*").order("created_at", { ascending: false }),
      database.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
    ]).then(([messageResult, subscriberResult]) => {
      if (messageResult.error) toast.error(messageResult.error.message);
      if (subscriberResult.error) toast.error(subscriberResult.error.message);
      setMessages((messageResult.data as MessageRow[]) ?? []);
      setSubscribers((subscriberResult.data as SubscriberRow[]) ?? []);
      setLoading(false);
    });
  }, []);

  const resolve = async (row: MessageRow) => {
    const { error } = await database.from("contact_messages").update({ status: "resolved" }).eq("id", row.id);
    if (error) return toast.error(error.message);
    setMessages((current) => current.map((message) => message.id === row.id ? { ...message, status: "resolved" } : message));
  };

  if (loading) return <div className="flex items-center justify-center gap-2 py-12 text-sm text-white/40"><Loader2 size={16} className="animate-spin" /> Loading inbox…</div>;

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-6"><h1 className="font-display text-2xl text-white mb-1">Customer Inbox</h1><p className="text-white/40 text-sm">{messages.filter((m) => m.status !== "resolved").length} open messages</p></div>
        <div className="space-y-3">
          {messages.map((row) => (
            <article key={row.id} className="rounded-2xl border border-white/[0.06] bg-[#111114] p-5">
              <div className="flex gap-3">
                <Mail size={16} className="mt-1 shrink-0 text-gold" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-white">{row.name} <a href={`mailto:${row.email}`} className="text-white/40 hover:text-gold">&lt;{row.email}&gt;</a></p>
                    <time className="text-xs text-white/30">{new Date(row.created_at).toLocaleString("en-IN")}</time>
                  </div>
                  {row.phone && <a href={`tel:${row.phone}`} className="mt-1 block text-xs text-white/40 hover:text-gold">{row.phone}</a>}
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/65">{row.message}</p>
                  {row.status !== "resolved" ? <button onClick={() => resolve(row)} className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400"><Check size={12} /> Mark resolved</button> : <span className="mt-4 inline-block text-xs text-white/30">Resolved</span>}
                </div>
              </div>
            </article>
          ))}
          {messages.length === 0 && <p className="py-8 text-center text-sm text-white/40">No customer messages yet.</p>}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl text-white">Newsletter Subscribers</h2>
        <p className="mb-4 text-sm text-white/40">{subscribers.filter((row) => row.active).length} active subscribers</p>
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111114]">
          {subscribers.map((row) => <div key={row.id} className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3 last:border-0"><a href={`mailto:${row.email}`} className="text-sm text-white/70 hover:text-gold">{row.email}</a><time className="text-xs text-white/30">{new Date(row.created_at).toLocaleDateString("en-IN")}</time></div>)}
          {subscribers.length === 0 && <p className="py-8 text-center text-sm text-white/40">No subscribers yet.</p>}
        </div>
      </section>
    </div>
  );
}
