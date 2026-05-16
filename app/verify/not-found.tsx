import { Star, AlertCircle } from 'lucide-react'

export default function VerifyNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <div className="w-full max-w-xs text-center">

        {/* Branded card shell */}
        <div
          className="bg-white rounded-3xl px-6 py-8 mb-4"
          style={{
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            border: '1.5px solid transparent',
            background: 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045) border-box',
          }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-5">
            <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
            <span className="text-sm font-semibold text-[#1C2B3A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Punt &amp; Prominence
            </span>
          </div>

          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            <AlertCircle className="w-7 h-7" style={{ color: '#ef4444' }} />
          </div>

          <h1
            className="text-lg font-bold text-[#1C2B3A] mb-2"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Code not found
          </h1>
          <p className="text-sm text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
            This punt code doesn&apos;t match any active collab. Please check the code and try again.
          </p>
        </div>

        <p className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
          Punt &amp; Prominence · Cambridge collabs
        </p>
      </div>
    </div>
  )
}
