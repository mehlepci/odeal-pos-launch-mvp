// GA4 Measurement Protocol — server-side event tracking.
// See DECISIONS.md D-006 for why we use a two-layer tracking approach.
//
// In dev/demo: logs to console (no API key needed).
// In production: set GA4_MEASUREMENT_ID and GA4_API_SECRET in Vercel env vars.

export async function trackServerEvent(
  eventName: string,
  params: Record<string, string | number>,
  clientId = 'server-generated'
) {
  const measurementId = process.env.GA4_MEASUREMENT_ID
  const apiSecret = process.env.GA4_API_SECRET

  if (!measurementId || !apiSecret) {
    console.log(`[GA4 Server Event - Demo Mode] ${eventName}`, params)
    return
  }

  // engagement_time_msec makes the event count in Realtime/standard reports.
  // debug_mode (env-gated) surfaces it in GA4 DebugView for live demos — kept
  // out of production so real reporting isn't flagged as debug traffic.
  const eventParams: Record<string, string | number> = {
    ...params,
    engagement_time_msec: 100,
  }
  if (process.env.GA4_DEBUG_MODE === 'true') eventParams.debug_mode = 1

  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: clientId,
        events: [{ name: eventName, params: eventParams }],
      }),
    }
  )

  if (!res.ok) {
    console.error(`[GA4] event failed: ${res.status} ${await res.text()}`)
  }
}
