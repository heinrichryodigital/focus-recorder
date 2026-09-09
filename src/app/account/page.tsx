import type { Metadata } from "next";
import Account from "./account";
import { accountReturnPath } from "@/lib/account-contract";
import "../checkout/checkout.css";

export const metadata: Metadata = { title: "Your Focus Recorder account", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  return <Account next={accountReturnPath(query.next)} reset={query.mode === "reset"} />;
}
