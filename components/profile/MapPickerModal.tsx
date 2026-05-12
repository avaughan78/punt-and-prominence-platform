'use client'
import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { loadGoogleMaps } from '@/lib/googleMaps'

const CAMBRIDGE = { lat: 52.2053, lng: 0.1218 }

interface Props {
  lat: number | null
  lng: number | null
  onConfirm: (address: string, lat: number, lng: number, name?: string) => void
  onClose: () => void
}

function stripCountry(s: string) {
  return s.replace(/, United Kingdom$/, '').replace(/, UK$/, '')
}

export function MapPickerModal({ lat, lng, onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)    // eslint-disable-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [address, setAddress] = useState('')
  const [placeName, setPlaceName] = useState('')
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [geocoding, setGeocoding] = useState(false)
  const [hint, setHint] = useState('')

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
        animation: G.Animation.DROP,
      })

      const placesService = new G.places.PlacesService(map)

      // If reopening with an existing pin, show address
      if (lat && lng) {
        setGeocoding(true)
        new G.Geocoder().geocode({ location: { lat, lng } }, (results: any, status: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          if (status === 'OK' && results?.[0]) setAddress(stripCountry(results[0].formatted_address))
          setGeocoding(false)
        })
      }

      map.addListener('click', (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (e.placeId) {
          e.stop()
          setHint('')
          setGeocoding(true)
          placesService.getDetails(
            { placeId: e.placeId, fields: ['name', 'formatted_address', 'geometry'] },
            (place: any, status: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              if (status === 'OK' && place?.geometry?.location) {
                const latlng = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
                marker.setPosition(place.geometry.location)
                marker.setMap(map)
                setPending(latlng)
                setPlaceName(place.name ?? '')
                setAddress(stripCountry(place.formatted_address ?? ''))
              }
              setGeocoding(false)
            }
          )
        } else {
          setHint("Tap a business marker on the map — or close this and use the search box or type manually.")
        }
      })

      mapRef.current = map
      markerRef.current = marker
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    if (!pending) return
    onConfirm(address, pending.lat, pending.lng, placeName || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <div>
            <p className="font-semibold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Find your business on the map
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Tap a business marker to select it</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div ref={containerRef} style={{ height: 360 }} />

        {/* Hint shown when user clicks empty space */}
        {hint && (
          <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100" style={{ fontFamily: "'Inter', sans-serif" }}>
            {hint}
          </div>
        )}

        <div className="px-4 py-3 border-t border-black/5 flex items-center gap-3">
          <MapPin className="w-4 h-4 shrink-0" style={{ color: '#6BE6B0' }} />
          <div className="flex-1 min-w-0">
            {geocoding
              ? <span className="flex items-center gap-1.5 text-sm text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading…</span>
              : pending
                ? <>
                    {placeName && <p className="text-sm font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{placeName}</p>}
                    <p className="text-xs text-gray-500 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{address}</p>
                  </>
                : <span className="text-sm text-gray-400">No business selected</span>
            }
          </div>
          <Button size="sm" onClick={handleConfirm} disabled={!pending || geocoding}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  )
}
