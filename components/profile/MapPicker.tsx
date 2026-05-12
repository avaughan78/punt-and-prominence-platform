'use client'
import { useEffect, useRef } from 'react'

const CAMBRIDGE = { lat: 52.2053, lng: 0.1218 }

interface Props {
  lat: number | null
  lng: number | null
  onMove: (address: string, lat: number, lng: number) => void
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address ?? {}
    const parts = [
      [a.house_number, a.road].filter(Boolean).join(' '),
      a.city ?? a.town ?? a.village ?? '',
      a.postcode ?? '',
    ].filter(Boolean)
    return parts.join(', ') || data.display_name
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export function MapPicker({ lat, lng, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Fix webpack-mangled icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = lat && lng ? { lat, lng } : CAMBRIDGE
      const map = L.map(containerRef.current!).setView([center.lat, center.lng], lat && lng ? 16 : 14)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const marker = L.marker([center.lat, center.lng], { draggable: true })
      if (lat && lng) marker.addTo(map)

      marker.on('dragend', async () => {
        const pos = marker.getLatLng()
        const addr = await reverseGeocode(pos.lat, pos.lng)
        onMove(addr, pos.lat, pos.lng)
      })

      map.on('click', async (e) => {
        marker.setLatLng(e.latlng)
        if (!map.hasLayer(marker)) marker.addTo(map)
        const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng)
        onMove(addr, e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when parent updates lat/lng (e.g. via text search)
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || !lat || !lng) return
    marker.setLatLng([lat, lng])
    if (!map.hasLayer(marker)) marker.addTo(map)
    map.setView([lat, lng], Math.max(map.getZoom(), 16))
  }, [lat, lng])

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(0,0,0,0.08)' }}>
      <div ref={containerRef} style={{ height: 240 }} />
      <p className="text-xs text-gray-400 px-3 py-2" style={{ fontFamily: "'Inter', sans-serif" }}>
        Click the map or drag the pin to set your exact location
      </p>
    </div>
  )
}
