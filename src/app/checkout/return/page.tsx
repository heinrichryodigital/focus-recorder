import type { Metadata } from "next";
import CheckoutReturn from "./checkout-return";
import "../checkout.css";

export const metadata: Metadata = {
  title: "Your Pro activation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ReturnPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  // Provider return parameters never determine payment or activation status.
  return <CheckoutReturn checkoutId={typeof query.checkout === "string" ? query.checkout : ""} />;
}
