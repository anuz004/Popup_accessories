import { supabase } from "@/lib/supabase";

export async function subscribeNewsletter(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) return { error: "Enter a valid email address" };
  const { error } = await supabase.from("newsletter_subscribers").insert({ email: normalized });
  if (error && error.code !== "23505") return { error: error.message };
  return { error: null };
}

export async function sendContactMessage(input: { name: string; email: string; phone: string; message: string }) {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim() || null,
    message: input.message.trim(),
  };
  if (!payload.name || !/^\S+@\S+\.\S+$/.test(payload.email) || !payload.message) {
    return { error: "Please fill in your name, a valid email, and a message" };
  }
  const { error } = await supabase.from("contact_messages").insert(payload);
  return { error: error?.message ?? null };
}
