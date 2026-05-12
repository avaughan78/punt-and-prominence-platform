'use client'
import { useState } from 'react'

interface Props {
  handle: string
  displayName?: string
  size?: 'sm' | 'md'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function gradientColors(handle: string) {
  const palettes = [
    ['#f09433', '#e6683c', '#dc2743', '#cc2366'],
    ['#405de6', '#5851db', '#833ab4', '#c13584'],
    ['#fd1d1d', '#833ab4', '#405de6', '#5851db'],
    ['#f09433', '#833ab4', '#405de6', '#fd1d1d'],
    ['#c13584', '#e1306c', '#fd1d1d', '#f77737'],
  ]
  return palettes[handle.charCodeAt(0) % palettes.length]
}

export function InstagramHandle({ handle, displayName, size = 'md' }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const [c1, c2, c3] = gradientColors(handle)
  const label = displayName ?? handle
  const outerSz = size === 'sm' ? 32 : 44
  const innerSz = outerSz - 4
  const avatarSz = innerSz - 4
  const textSz = size === 'sm' ? '9px' : '12px'
  const handleSz = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 group"
      onClick={e => e.stopPropagation()}
    >
      {/* Gradient ring + avatar */}
      <div
        className="shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: outerSz,
          height: outerSz,
          background: `linear-gradient(45deg, ${c1}, ${c2}, ${c3})`,
          padding: 2,
        }}
      >
        <div
          className="rounded-full bg-white flex items-center justify-center overflow-hidden"
          style={{ width: innerSz, height: innerSz }}
        >
          {!imgFailed ? (
            <img
              src={`https://unavatar.io/instagram/${handle}`}
              alt={handle}
              width={avatarSz}
              height={avatarSz}
              className="rounded-full object-cover"
              style={{ width: avatarSz, height: avatarSz }}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center font-bold w-full h-full"
              style={{
                background: `linear-gradient(45deg, ${c1}33, ${c3}33)`,
                fontSize: textSz,
                color: c2,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {initials(label)}
            </div>
          )}
        </div>
      </div>

      {/* Name + handle */}
      <div className="flex flex-col leading-tight">
        {displayName && (
          <span className="text-xs font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {displayName}
          </span>
        )}
        <span
          className={`${handleSz} font-medium group-hover:underline flex items-center gap-1`}
          style={{ color: '#6b7280', fontFamily: "'Inter', sans-serif" }}
        >
          <svg className="w-3 h-3 opacity-60 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
          @{handle}
        </span>
      </div>
    </a>
  )
}
