'use client'
import { useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { loadGoogleMaps } from '@/lib/googleMaps'

interface Props {
  onSelect: (name: string, address: string, lat: number, lng: number) => void
}

// Cambridge bounding box
const CAMBRIDGE_BOUNDS = {
  sw: { lat: 52.15, lng: 0.03 },
  ne: { lat: 52.27, lng: 0.22 },
}

function stripCountry(address: string) {
  return address.replace(/, United Kingdom$/, '').replace(/, UK$/, '')
}

export function BusinessSearchPicker({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    loadGoogleMaps().then(() => {
      if (!inputRef.current || loadedRef.current) return
      loadedRef.current = true

      const bounds = new window.google.maps.LatLngBounds(
        CAMBRIDGE_BOUNDS.sw,
        CAMBRIDGE_BOUNDS.ne,
      )

      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        bounds,
        strictBounds: false,
        componentRestrictions: { country: 'gb' },
        types: ['establishment'],
        fields: ['name', 'formatted_address', 'geometry'],
      })

      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        onSelect(
          place.name ?? '',
          stripCountry(place.formatted_address ?? ''),
          place.geometry.location.lat(),
          place.geometry.location.lng(),
        )
        if (inputRef.current) inputRef.current.value = ''
      })
    })
  }, [onSelect])

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'rgba(107,230,176,0.08)', border: '1.5px solid rgba(107,230,176,0.3)' }}>
      <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Find your business on Google
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Start typing your business name…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all bg-white"
          style={{
            border: '1.5px solid rgba(0,0,0,0.1)',
            fontFamily: "'Inter', sans-serif",
            color: '#1C2B3A',
          }}
          autoComplete="off"
        />
      </div>
      <p className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
        Selecting your business fills in the name, address, and map pin automatically.
        Not listed? Fill in the fields below manually.
      </p>
    </div>
  )
}
