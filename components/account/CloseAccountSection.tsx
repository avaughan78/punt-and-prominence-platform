export function CloseAccountSection() {
  return (
    <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <p className="text-sm font-semibold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Close your account
      </p>
      <p className="text-xs text-gray-400 max-w-sm">
        To close your account and remove your data, email{' '}
        <a
          href="mailto:hello@puntandprominence.co.uk?subject=Account closure request"
          className="text-[#1C2B3A] font-medium hover:underline"
        >
          hello@puntandprominence.co.uk
        </a>
        . We&apos;ll handle it within 30 days in line with UK GDPR.
      </p>
    </div>
  )
}
