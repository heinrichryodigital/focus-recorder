import type { Metadata } from "next";
import { isDemoPlan, isDemoProvider } from "../../lib/mock-payments";
import CheckoutDemo from "./checkout-demo";
import "./checkout.css";

export const metadata: Metadata = {
  title: "Try the checkout",
  description: "Explore a Stripe or PayPal checkout simulation for Focus Recorder. No charges, account details, or real purchases.",
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const plan = isDemoPlan(query.plan) ? query.plan : "pro";
  const provider = isDemoProvider(query.provider) ? query.provider : "stripe";
  return <CheckoutDemo initialPlan={plan} initialProvider={provider} />;
}
