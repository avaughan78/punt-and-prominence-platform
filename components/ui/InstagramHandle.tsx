
interface Props {
  handle: string
  displayName?: string
  size?: 'sm' | 'md'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(handle: string) {
  const colors = [
    ['#f09433','#e6683c','#dc2743','#cc2366'],
    ['#405de6','#5851db','#833ab4','#c13584'],
    ['#fd1d1d','#833ab4','#405de6','#5851db'],
    ['#f09433','#833ab4','#405de6','#fd1d1d'],
    ['#c13584','#e1306c','#fd1d1d','#f77737'],
  ]
  const idx = handle.charCodeAt(0) % colors.length
  return colors[idx]
}

export function InstagramHandle({ handle, displayName, size = 'md' }: Props) {
  const [c1, c2, c3] = avatarColor(handle)
  const label = displayName ?? handle
  const sz = size === 'sm' ? 28 : 36
  const textSz = size === 'sm' ? '9px' : '11px'
  const handleSz = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 group"
      onClick={e => e.stopPropagation()}
    >
      {/* Avatar with Instagram gradient ring */}
      <div
        className="shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: sz + 4,
          height: sz + 4,
          background: `linear-gradient(45deg, ${c1}, ${c2}, ${c3})`,
          padding: 2,
        }}
      >
        <div
          className="rounded-full flex items-center justify-center bg-white"
          style={{ width: sz, height: sz }}
        >
          <div
            className="rounded-full flex items-center justify-center font-bold"
            style={{
              width: sz - 4,
              height: sz - 4,
              background: `linear-gradient(45deg, ${c1}33, ${c3}33)`,
              fontSize: textSz,
              color: c2,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {initials(label)}
          </div>
        </div>
      </div>

      {/* Handle + icon */}
      <div className="flex flex-col leading-tight">
        {displayName && displayName !== handle && (
          <span className="text-xs font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {displayName}
          </span>
        )}
        <span
          className={`${handleSz} font-medium group-hover:underline flex items-center gap-1`}
          style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
        >
          {/* Instagram camera icon */}
          <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
          @{handle}
        </span>
      </div>
    </a>
  )
}
