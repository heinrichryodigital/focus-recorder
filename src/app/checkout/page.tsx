import type { Metadata } from "next";
import Checkout from "./checkout";
import "./checkout.css";

export const metadata: Metadata = {
  title: "Focus Pro — $9 USD per month",
  description: "Subscribe to Focus Pro for your account with PayPal. $9 USD per month, automatically renewed until cancelled.",
  robots: { index: false, follow: true },
  referrer: "no-referrer",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  return <Checkout cancelled={query.cancelled === "1"} />;
}
