'use client'
import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface Suggestion {
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    house_number?: string
    postcode?: string
    city?: string
    town?: string
    village?: string
  }
}

interface Props {
  value: string
  onChange: (address: string, lat: number, lng: number) => void
}

function shortAddress(s: Suggestion): string {
  const a = s.address
  const parts = [
    [a.house_number, a.road].filter(Boolean).join(' '),
    a.city ?? a.town ?? a.village ?? '',
    a.postcode ?? '',
  ].filter(Boolean)
  return parts.join(', ')
}

export function AddressPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 3) { setSuggestions([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ', Cambridge, UK')}&format=json&addressdetails=1&limit=5&countrycodes=gb`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
      } catch {
        setSuggestions([])
      }
      setLoading(false)
    }, 400)
  }

  function handleSelect(s: Suggestion) {
    const addr = shortAddress(s)
    setQuery(addr)
    setSuggestions([])
    setOpen(false)
    onChange(addr, parseFloat(s.lat), parseFloat(s.lon))
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-[#1C2B3A] mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Address
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Start typing your address…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            border: '1.5px solid rgba(0,0,0,0.1)',
            background: '#fff',
            fontFamily: "'Inter', sans-serif",
            color: '#1C2B3A',
          }}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
          style={{ border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}
        >
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-start gap-2"
                style={{ fontFamily: "'Inter', sans-serif", borderBottom: i < suggestions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-[#1C2B3A] leading-snug">{shortAddress(s) || s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
