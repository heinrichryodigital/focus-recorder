import type { Metadata } from "next";
import { isDemoPlan, isDemoProvider } from "../../../lib/mock-payments";
import CheckoutDemo from "./checkout-demo";
import "../checkout.css";

export const metadata: Metadata = {
  title: "Checkout simulation",
  description: "A local Stripe and PayPal simulation. No charge, purchase, or activation license.",
  robots: { index: false, follow: false },
};

export default async function DemoPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <CheckoutDemo initialPlan={isDemoPlan(query.plan) ? query.plan : "pro"}
    initialProvider={isDemoProvider(query.provider) ? query.provider : "paypal"} />;
}
