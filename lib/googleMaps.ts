declare global {
  interface Window { google?: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(); return }

    if (document.getElementById('gplaces-script')) {
      const t = setInterval(() => {
        if (window.google?.maps) { clearInterval(t); resolve() }
      }, 100)
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY
    if (!apiKey) { console.warn('NEXT_PUBLIC_GOOGLE_PLACES_KEY not set'); return }

    const script = document.createElement('script')
    script.id = 'gplaces-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}
