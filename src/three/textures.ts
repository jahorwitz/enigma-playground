import * as THREE from 'three'

const cache = new Map<string, THREE.Texture>()

const FONT = '"Barlow Condensed", "Arial Narrow", sans-serif'

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  cache.set(key, tex)
  return tex
}

/** Round key cap: ivory letter on a black cap. */
export const keyCapTexture = (letter: string) =>
  make(`key-${letter}`, 128, 128, (ctx) => {
    ctx.fillStyle = '#1b1916'
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = '#efe6cf'
    ctx.font = `600 78px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, 64, 70)
  })

/** Lamp window: frosted glass with a dark stencilled letter. */
export const lampTexture = (letter: string) =>
  make(`lamp-${letter}`, 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 58, 6, 64, 64, 70)
    g.addColorStop(0, '#fffaf0')
    g.addColorStop(1, '#d9d0bd')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
    ctx.fillStyle = '#2a241c'
    ctx.font = `700 76px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, 64, 70)
  })

/** Brass bezel with a clear centre, framing a rotor's reading window. */
export const windowFrameTexture = () =>
  make('window-frame', 128, 64, (ctx) => {
    ctx.clearRect(0, 0, 128, 64)
    ctx.strokeStyle = '#d4ad55'
    ctx.lineWidth = 9
    ctx.strokeRect(5, 5, 118, 54)
  })

/**
 * Alphabet ring wrapped around a rotor. Each glyph is rotated so it reads upright in the window
 * at the top of a rotor whose axle runs left–right (see Rotor.tsx for the geometry).
 */
export const rotorRingTexture = () =>
  make('ring', 26 * 64, 96, (ctx) => {
    ctx.fillStyle = '#e8dfc6'
    ctx.fillRect(0, 0, 26 * 64, 96)
    for (let i = 0; i < 26; i++) {
      const cx = i * 64 + 32
      ctx.strokeStyle = 'rgba(40,30,20,0.25)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(i * 64, 0)
      ctx.lineTo(i * 64, 96)
      ctx.stroke()
      ctx.save()
      ctx.translate(cx, 48)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = '#231d17'
      ctx.font = `700 52px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String.fromCharCode(65 + i), 0, 3)
      ctx.restore()
    }
  })

/** Small engraved label for plugboard sockets and brass plates. */
export const labelTexture = (text: string, opts: { fg?: string; bg?: string; w?: number; h?: number; size?: number } = {}) => {
  const { fg = '#e9dfc4', bg = 'rgba(0,0,0,0)', w = 128, h = 64, size = 44 } = opts
  return make(`label-${text}-${fg}-${bg}-${w}-${h}-${size}`, w, h, (ctx) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = fg
    ctx.font = `600 ${size}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 2)
  })
}

/** Fine noise used as a roughness/bump map for the crackle-painted top plate. */
export const crackleTexture = () =>
  make('crackle', 256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + Math.random() * 110
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  })

/** Oak grain for the wooden case. */
export const woodTexture = () => {
  const tex = make('wood', 512, 512, (ctx) => {
    ctx.fillStyle = '#6b4526'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 140; i++) {
      const y = Math.random() * 512
      ctx.strokeStyle = `rgba(${40 + Math.random() * 30},${22 + Math.random() * 15},10,${0.15 + Math.random() * 0.25})`
      ctx.lineWidth = 1 + Math.random() * 3
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= 512; x += 32) ctx.lineTo(x, y + Math.sin(x / 70 + i) * 6 + Math.random() * 2)
      ctx.stroke()
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}
