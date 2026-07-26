/** Common carrier labels for seller ship forms. */
export const SHIPPING_CARRIERS = [
  'USPS',
  'UPS',
  'FedEx',
  'DHL',
  'Amazon Logistics',
  'Other',
] as const

export type ShippingCarrier = (typeof SHIPPING_CARRIERS)[number] | string

/** Build a public tracking URL when carrier is recognized. */
export function trackingUrl(
  carrier?: string | null,
  trackingNumber?: string | null
): string | null {
  const number = (trackingNumber || '').trim()
  if (!number) return null
  const encoded = encodeURIComponent(number)
  const c = (carrier || '').trim().toLowerCase()
  if (c.includes('usps')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`
  }
  if (c.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${encoded}`
  }
  if (c.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${encoded}`
  }
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${carrier || 'tracking'} ${number}`
  )}`
}

export function formatShipmentLabel(input: {
  carrier?: string | null
  trackingNumber?: string | null
}): string | null {
  const carrier = (input.carrier || '').trim()
  const tracking = (input.trackingNumber || '').trim()
  if (!carrier && !tracking) return null
  if (carrier && tracking) return `${carrier} · ${tracking}`
  return carrier || tracking
}
