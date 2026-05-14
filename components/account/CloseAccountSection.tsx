export function CloseAccountSection() {
  return (
    <div className="pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
      <p className="text-xs text-gray-400" style={{ fontFamily: "'Inter', sans-serif" }}>
        To close your account, email{' '}
        <a
          href="mailto:hello@puntandprominence.co.uk?subject=Account closure request"
          className="hover:underline"
          style={{ color: '#9ca3af' }}
        >
          hello@puntandprominence.co.uk
        </a>
        . We&apos;ll handle it within 30 days under UK GDPR.
      </p>
    </div>
  )
}
