import { NextResponse, type NextRequest } from "next/server";

import { ACCOUNT_ID_RE, onboardingLink, syncSellerStatus } from "@/lib/payments";
import { getSellerByAccount } from "@/lib/store";

/**
 * Stripe sends sellers here when an onboarding link has expired or been used.
 * Issues a fresh link, unless the account is already fully connected.
 */
export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get("account") ?? "";
  const seller = ACCOUNT_ID_RE.test(account) ? await getSellerByAccount(account) : undefined;
  if (!seller?.stripeAccountId) {
    return NextResponse.redirect(new URL("/seller", request.url));
  }

  const status = await syncSellerStatus(seller.stripeAccountId);
  if (status.chargesEnabled) {
    return NextResponse.redirect(
      new URL(`/seller/return?account=${seller.stripeAccountId}`, request.url)
    );
  }
  return NextResponse.redirect(await onboardingLink(seller.stripeAccountId));
}
