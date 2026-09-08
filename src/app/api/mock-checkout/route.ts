import { handleMockCheckout } from "../../../lib/mock-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleMockCheckout(request);
}

// Explicitly handled methods also receive the same no-store error response.
export const GET = POST;
export const PUT = POST;
export const PATCH = POST;
export const DELETE = POST;
export const OPTIONS = POST;
