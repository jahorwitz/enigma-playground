/** three.js needs WebGL 2. Some phones and browsers only offer WebGL 1, or none at all. */
export function hasWebGL2() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    // Hand the probe context straight back; mobile browsers allow only a few at once.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** Phones and tablets get a lighter scene: lower resolution, smaller shadows, no MSAA. */
export const isLowPower = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 720)
