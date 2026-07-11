/** True when Stripe online payments can be verified (server). */
export function isOnlinePaymentProviderConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

/** Client-safe check (publishable key present). */
export function isOnlinePaymentProviderConfiguredClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim())
}
