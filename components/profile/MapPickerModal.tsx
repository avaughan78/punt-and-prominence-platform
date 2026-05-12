'use client'
import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const CAMBRIDGE = { lat: 52.2053, lng: 0.1218 }

interface Props {
  lat: number | null
  lng: number | null
  onConfirm: (address: string, lat: number, lng: number) => void
  onClose: () => void
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

export function MapPickerModal({ lat, lng, onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const [address, setAddress] = useState<string>('')
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    import('leaflet').then(L => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = lat && lng ? { lat, lng } : CAMBRIDGE
      const map = L.map(containerRef.current!).setView([center.lat, center.lng], lat && lng ? 17 : 14)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const marker = L.marker([center.lat, center.lng], { draggable: true })
      if (lat && lng) {
        marker.addTo(map)
        setGeocoding(true)
        reverseGeocode(lat, lng).then(addr => { setAddress(addr); setGeocoding(false) })
      }

      async function placePin(latlng: { lat: number; lng: number }) {
        marker.setLatLng(latlng)
        if (!map.hasLayer(marker)) marker.addTo(map)
        setPending(latlng)
        setGeocoding(true)
        const addr = await reverseGeocode(latlng.lat, latlng.lng)
        setAddress(addr)
        setGeocoding(false)
      }

      marker.on('dragend', () => placePin(marker.getLatLng()))
      map.on('click', (e) => placePin(e.latlng))

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    if (!pending) return
    onConfirm(address, pending.lat, pending.lng)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <p className="font-semibold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Pick your location
          </p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Map */}
        <div ref={containerRef} style={{ height: 360 }} />

        {/* Footer */}
        <div className="px-4 py-3 border-t border-black/5 flex items-center gap-3">
          <MapPin className="w-4 h-4 shrink-0" style={{ color: '#6BE6B0' }} />
          <p className="text-sm text-gray-600 flex-1 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
            {geocoding
              ? <span className="flex items-center gap-1.5 text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Finding address…</span>
              : address || <span className="text-gray-400">Click the map to drop a pin</span>
            }
          </p>
          <Button size="sm" onClick={handleConfirm} disabled={!pending || geocoding}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}
