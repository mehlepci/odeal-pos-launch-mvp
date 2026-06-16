// Client-side GTM dataLayer helper.
// See DECISIONS.md D-006.
//
// Usage: pushEvent('cta_click', { cta_label: 'Hemen Başvur', location: 'hero' })
// GTM then routes this to GA4, Meta Pixel, Google Ads, etc. — without a code deploy.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function pushEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
