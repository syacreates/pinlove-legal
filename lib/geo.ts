/** Position actuelle (GPS), avec des messages d'erreur lisibles. */
export function getCurrentPosition(): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('La localisation n’est pas disponible sur cet appareil.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) }),
      err => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Autorise la localisation pour PinLove dans les réglages du téléphone.'
          : 'Impossible d’obtenir ta position. Réessaie à l’extérieur ou près d’une fenêtre.',
      )),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    )
  })
}

/** Lien SMS pré-rempli (syntaxe différente sur iOS et Android). */
export function smsUrl(phone: string, body: string): string {
  const number = phone.replace(/[^\d+]/g, '')
  const isApple = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent)
  return `sms:${number}${isApple ? '&' : '?'}body=${encodeURIComponent(body)}`
}

export function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`
}
