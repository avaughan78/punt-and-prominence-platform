'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function PuntQRCode({ puntCode, size = 120 }: { puntCode: string; size?: number }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(`${window.location.origin}/verify/${puntCode}`)
  }, [puntCode])

  if (!url) return <div style={{ width: size, height: size }} />

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-2.5 bg-white rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
        <QRCodeSVG value={url} size={size} level="M" marginSize={0} />
      </div>
      <p className="text-[10px] text-gray-400 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Scan to verify at the venue
      </p>
    </div>
  )
}
