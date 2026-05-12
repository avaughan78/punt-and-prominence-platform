'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { BusinessSearchPicker } from '@/components/profile/BusinessSearchPicker'
import { MapPickerModal } from '@/components/profile/MapPickerModal'

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
  const [form, setForm] = useState<FormState>({
    business_name: '',
    address_line: '',
    latitude: null,
    longitude: null,
    category: 'other',
    bio: '',
    instagram_handle: '',
    website_url: '',
  })

  function set(key: keyof FormState, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleGoogleSelect(name: string, address: string, lat: number, lng: number) {
    setForm(f => ({ ...f, business_name: name, address_line: address, latitude: lat, longitude: lng }))
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
              <p className="text-sm text-gray-500">Search for your business on Google, or enter the details manually.</p>
            </div>

            <BusinessSearchPicker onSelect={handleGoogleSelect} />

            <Input
              label="Business name"
              placeholder="The Mill Road Café"
              value={form.business_name}
              onChange={e => set('business_name', e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="123 Mill Road, Cambridge, CB1 2AZ"
                  value={form.address_line}
                  onChange={e => set('address_line', e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] outline-none border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  title="Pick on map"
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors hover:bg-[#1C2B3A] group"
                  style={{ border: '1.5px solid rgba(0,0,0,0.1)', background: 'white' }}
                >
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#6BE6B0] transition-colors" />
                </button>
              </div>
            </div>

            {form.latitude && form.longitude && (
              <div className="rounded-xl overflow-hidden -mt-1" style={{ border: '1.5px solid rgba(0,0,0,0.08)' }}>
                <iframe
                  title="Location"
                  width="100%"
                  height="160"
                  style={{ display: 'block', border: 'none' }}
                  src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=17&output=embed`}
                />
              </div>
            )}

            <Button onClick={saveStep1} loading={saving}>
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
            <Input
              label="Website"
              type="url"
              placeholder="https://yoursite.com"
              value={form.website_url}
              onChange={e => set('website_url', e.target.value)}
            />

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
                Your profile is set up. Now post your first invite — tell creators what you&apos;re offering and watch the matches roll in.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <Button className="flex-1" onClick={() => router.push('/business/invites/new')}>
                Post your first invite
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
