'use client'
import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { loadGoogleMaps } from '@/lib/googleMaps'

const CAMBRIDGE = { lat: 52.2053, lng: 0.1218 }

interface Props {
  lat: number | null
  lng: number | null
  onConfirm: (address: string, lat: number, lng: number) => void
  onClose: () => void
}

export function MapPickerModal({ lat, lng, onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)    // eslint-disable-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const geocoderRef = useRef<any>(null)
  const [address, setAddress] = useState('')
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [geocoding, setGeocoding] = useState(false)

  function reverseGeocode(latLng: { lat: number; lng: number }) {
    if (!geocoderRef.current) return
    setGeocoding(true)
    geocoderRef.current.geocode({ location: latLng }, (results: any, status: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (status === 'OK' && results?.[0]) {
        setAddress(results[0].formatted_address.replace(/, UK$/, '').replace(/, United Kingdom$/, ''))
      }
      setGeocoding(false)
    })
  }

  useEffect(() => {
    if (!containerRef.current) return

    loadGoogleMaps().then(() => {
      if (mapRef.current) return
      const G = window.google.maps
      const center = lat && lng ? { lat, lng } : CAMBRIDGE

      const map = new G.Map(containerRef.current, {
        center,
        zoom: lat && lng ? 17 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: G.ControlPosition.RIGHT_CENTER },
      })

      const marker = new G.Marker({
        map: lat && lng ? map : undefined,
        position: center,
        draggable: true,
        animation: G.Animation.DROP,
      })

      geocoderRef.current = new G.Geocoder()

      if (lat && lng) reverseGeocode({ lat, lng })

      marker.addListener('dragend', () => {
        const pos = marker.getPosition()
        const latlng = { lat: pos.lat(), lng: pos.lng() }
        setPending(latlng)
        reverseGeocode(latlng)
      })

      map.addListener('click', (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const latlng = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        marker.setPosition(e.latLng)
        marker.setMap(map)
        setPending(latlng)
        reverseGeocode(latlng)
      })

      mapRef.current = map
      markerRef.current = marker
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    if (!pending) return
    onConfirm(address, pending.lat, pending.lng)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <p className="font-semibold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Pick your location
          </p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div ref={containerRef} style={{ height: 360 }} />

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
