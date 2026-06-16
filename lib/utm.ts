// UTM parameter persistence across page navigations.
// Problem: user lands on / with ?utm_source=google, clicks CTA → goes to /basvur.
// The UTM params are lost when they navigate. SessionStorage bridges this.

export function persistUTMParams() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')
  if (source) sessionStorage.setItem('utm_source', source)
  if (medium) sessionStorage.setItem('utm_medium', medium)
  if (campaign) sessionStorage.setItem('utm_campaign', campaign)
}

export function getUTMParams() {
  if (typeof window === 'undefined') return { utmSource: 'direct', utmMedium: '', utmCampaign: '' }
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || sessionStorage.getItem('utm_source') || 'direct',
    utmMedium: params.get('utm_medium') || sessionStorage.getItem('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || sessionStorage.getItem('utm_campaign') || '',
  }
}
