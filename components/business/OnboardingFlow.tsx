'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { MapPickerModal } from '@/components/profile/MapPickerModal'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { normalizeUrl } from '@/lib/utils'

const CAMBRIDGE_BOUNDS = { sw: { lat: 52.15, lng: 0.03 }, ne: { lat: 52.27, lng: 0.22 } }
function stripCountry(s: string) { return s.replace(/, United Kingdom$/, '').replace(/, UK$/, '') }

const CATEGORIES = [
  { value: 'dining', label: 'Dining & drinks' },
  { value: 'retail', label: 'Retail & shopping' },
  { value: 'experience', label: 'Experience' },
  { value: 'fitness', label: 'Fitness & wellness' },
  { value: 'beauty', label: 'Beauty & lifestyle' },
  { value: 'other', label: 'Other' },
]

interface FormState {
  business_name: string
  address_line: string
  latitude: number | null
  longitude: number | null
  category: string
  bio: string
  instagram_handle: string
  website_url: string
}

const STEPS = ['Your business', 'A bit more detail', 'All set!']

export function OnboardingFlow({ contactName }: { contactName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [websiteUrlError, setWebsiteUrlError] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const acLoadedRef = useRef(false)
  const [form, setForm] = useState<FormState>({
    business_name: '',
    address_line: '',
    latitude: null,
    longitude: null,
    category: 'dining',
    bio: '',
    instagram_handle: '',
    website_url: '',
  })

  useEffect(() => {
    if (acLoadedRef.current) return
    loadGoogleMaps().then(() => {
      if (!searchRef.current || acLoadedRef.current) return
      acLoadedRef.current = true
      const bounds = new window.google.maps.LatLngBounds(CAMBRIDGE_BOUNDS.sw, CAMBRIDGE_BOUNDS.ne)
      const ac = new window.google.maps.places.Autocomplete(searchRef.current, {
        bounds,
        strictBounds: false,
        componentRestrictions: { country: 'gb' },
        fields: ['name', 'formatted_address', 'geometry', 'types'],
      })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        const isEstablishment = (place.types ?? []).includes('establishment')
        setForm(f => ({
          ...f,
          ...(isEstablishment ? { business_name: place.name ?? f.business_name } : {}),
          address_line: stripCountry(place.formatted_address ?? ''),
          latitude: place.geometry!.location!.lat(),
          longitude: place.geometry!.location!.lng(),
        }))
        if (searchRef.current) searchRef.current.value = ''
      })
    })
  }, [])

  function set(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleMapConfirm(address: string, lat: number, lng: number, name?: string) {
    setForm(f => ({
      ...f,
      address_line: address,
      latitude: lat,
      longitude: lng,
      ...(name ? { business_name: name } : {}),
    }))
  }

  async function saveStep1() {
    if (!form.business_name.trim()) { toast.error('Please enter your business name'); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: form.business_name,
        address_line: form.address_line,
        latitude: form.latitude,
        longitude: form.longitude,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(1)
  }

  async function saveStep2() {
    if (form.website_url) {
      const normalized = normalizeUrl(form.website_url)
      if (!normalized) { setWebsiteUrlError('Enter a valid URL (e.g. www.yoursite.com)'); return }
      setForm(f => ({ ...f, website_url: normalized }))
      setWebsiteUrlError(null)
    }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: form.category,
        bio: form.bio || null,
        instagram_handle: form.instagram_handle || null,
        website_url: form.website_url || null,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    setStep(2)
  }

  return (
    <>
      {showMap && (
        <MapPickerModal
          lat={form.latitude}
          lng={form.longitude}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                  style={{
                    background: i < step ? '#6BE6B0' : i === step ? '#F5B800' : 'rgba(0,0,0,0.08)',
                    color: i <= step ? '#1C2B3A' : '#9ca3af',
                  }}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <p className="text-[10px] mt-1 text-center" style={{ color: i === step ? '#1C2B3A' : '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                  {label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-0.5 flex-1 -mt-4 transition-all" style={{ background: i < step ? '#6BE6B0' : 'rgba(0,0,0,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Find your business, {contactName.split(' ')[0]}
              </h2>
              <p className="text-sm text-gray-500">Search by name or address, or tap the pin to pick it on the map.</p>
            </div>

            {/* Search row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Business name or address…"
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                title="Pick on map instead"
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:bg-[#1C2B3A] group"
                style={{ border: '1.5px solid rgba(0,0,0,0.1)', background: 'white' }}
              >
                <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#6BE6B0] transition-colors" />
              </button>
            </div>

            {/* Result: shown once populated */}
            {(form.business_name || form.address_line) && (
              <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: 'rgba(107,230,176,0.06)', border: '1.5px solid rgba(107,230,176,0.25)' }}>
                <p className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Found</p>
                <Input
                  label="Business name"
                  placeholder="The Mill Road Café"
                  value={form.business_name}
                  onChange={e => set('business_name', e.target.value)}
                  required
                />
                <Input
                  label="Address"
                  placeholder="123 Mill Road, Cambridge, CB1 2AZ"
                  value={form.address_line}
                  onChange={e => set('address_line', e.target.value)}
                />
                {form.latitude && form.longitude && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                    <iframe
                      title="Location"
                      width="100%"
                      height="160"
                      style={{ display: 'block', border: 'none' }}
                      src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=17&output=embed`}
                    />
                  </div>
                )}
              </div>
            )}

            <Button onClick={saveStep1} loading={saving} disabled={!form.business_name.trim()}>
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                A bit more about {form.business_name}
              </h2>
              <p className="text-sm text-gray-500">Help creators understand what you do. Everything except category is optional.</p>
            </div>

            <Select
              label="Category"
              options={CATEGORIES}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            />
            <Textarea
              label="Bio"
              placeholder="Tell creators a bit about your business, what makes it special, and the kind of content you're looking for..."
              rows={4}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
            />
            <Input
              label="Instagram handle"
              placeholder="yourbusiness"
              value={form.instagram_handle}
              onChange={e => set('instagram_handle', e.target.value.replace(/^@/, ''))}
              hint="Without the @"
            />
            <div>
              <Input
                label="Website"
                placeholder="https://yoursite.com"
                value={form.website_url}
                onChange={e => { set('website_url', e.target.value); setWebsiteUrlError(null) }}
              />
              {websiteUrlError && <p className="text-xs text-red-500 mt-1">{websiteUrlError}</p>}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={saveStep2} loading={saving} className="flex-1">Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center gap-6 py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
            >
              <Check className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1C2B3A] mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {form.business_name} is live!
              </h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Your profile is set up. Now post your first collab — tell creators what you&apos;re offering and watch the matches roll in.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Button className="flex-1" onClick={() => router.push('/business/invites/new')}>
                Post your first collab
              </Button>
              <Button variant="ghost" onClick={() => router.push('/business')}>
                Go to dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
