import { DialEyebrow } from "@/components/DialEyebrow";
import type { Page } from "@/context/RouterContext";

const CONTENT: Partial<Record<Page, { title: string; intro: string; sections: { heading: string; body: string }[] }>> = {
  faq: {
    title: "Frequently Asked Questions",
    intro: "Quick answers about ordering, delivery, payment and care.",
    sections: [
      { heading: "How do I pay?", body: "Orders are currently Cash on Delivery. You pay the courier when your order arrives." },
      { heading: "How long does delivery take?", body: "Orders are normally dispatched within 24 hours and delivered in 3–6 business days, depending on your pincode." },
      { heading: "Can I change an order?", body: "Contact the store as soon as possible with your order number. Changes are only possible before dispatch." },
      { heading: "Are the watches covered by warranty?", body: "Yes. Watches include a one-year warranty against manufacturing and movement defects, subject to the terms below." },
    ],
  },
  warranty: {
    title: "Warranty",
    intro: "Every watch is inspected before dispatch and includes limited manufacturer coverage.",
    sections: [
      { heading: "Coverage", body: "The one-year warranty covers manufacturing faults in the movement and internal components under normal use." },
      { heading: "Exclusions", body: "Straps, batteries, cosmetic wear, accidental damage, water damage beyond the stated rating, and unauthorised repairs are not covered." },
      { heading: "Making a claim", body: "Contact us with your order number, a description of the issue and clear photographs. Keep your order confirmation as proof of purchase." },
    ],
  },
  returns: {
    title: "Returns & Exchanges",
    intro: "If an item arrives damaged or incorrect, let us know promptly so we can make it right.",
    sections: [
      { heading: "Report an issue", body: "Contact us within 48 hours of delivery with your order number and unedited photos of the product and packaging." },
      { heading: "Return condition", body: "Approved returns must be unused, unworn and sent back with all original packaging, tags and accessories." },
      { heading: "Refunds", body: "After inspection, eligible refunds are processed to an agreed payment method. Original delivery fees may be non-refundable unless the item was faulty or incorrect." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "We collect only the information needed to process orders, answer messages and improve the storefront.",
    sections: [
      { heading: "Information we collect", body: "Order details, delivery address, phone number and email address are collected when you order. Contact and newsletter forms collect the details you submit." },
      { heading: "How it is used", body: "We use your information to fulfil orders, provide support, prevent abuse and send marketing only when you opt in." },
      { heading: "Your choices", body: "You may ask us to correct or delete your information, or unsubscribe from marketing at any time by contacting the store." },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "These terms apply when you browse the site or place an order with Popup Accessories.",
    sections: [
      { heading: "Orders", body: "An order is a request to purchase. We may contact you to confirm availability, delivery details or pricing before accepting it." },
      { heading: "Product information", body: "We aim to present colours, specifications and prices accurately. Minor visual differences may occur between illustrations, screens and the delivered item." },
      { heading: "Acceptable use", body: "Do not misuse the site, attempt unauthorised access, submit fraudulent orders or interfere with its operation." },
    ],
  },
};

export function InfoPage({ kind }: { kind: "faq" | "warranty" | "returns" | "privacy" | "terms" }) {
  const content = CONTENT[kind]!;
  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 pt-28 md:pt-36 pb-24">
      <DialEyebrow hour="XII" label="Customer Care" />
      <h1 className="font-display text-4xl md:text-5xl text-white mb-4">{content.title}</h1>
      <p className="text-white/50 text-sm md:text-base max-w-2xl mb-12">{content.intro}</p>
      <div className="space-y-4">
        {content.sections.map((section) => (
          <section key={section.heading} className="rounded-[20px] bg-[#111114] border border-white/[0.06] p-6 md:p-8">
            <h2 className="font-display text-xl text-white mb-3">{section.heading}</h2>
            <p className="text-white/55 text-sm leading-7">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
