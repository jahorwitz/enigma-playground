// All 3D dimensions in decimetres-ish scene units. The case is centred on x/z with its base at y = 0.

export const CASE = { w: 3.4, h: 1.0, d: 2.9 }
export const TOP = CASE.h
export const FRONT = CASE.d / 2

export const QWERTZ = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML']

const rowLayout = (spacing: number, rowsZ: number[]) => (letter: string) => {
  for (let r = 0; r < QWERTZ.length; r++) {
    const i = QWERTZ[r].indexOf(letter)
    if (i !== -1) return { x: (i - (QWERTZ[r].length - 1) / 2) * spacing, z: rowsZ[r] }
  }
  throw new Error(`no layout for ${letter}`)
}

export const keyPos = rowLayout(0.33, [0.44, 0.76, 1.08])
export const lampPos = rowLayout(0.31, [-0.6, -0.32, -0.04])

/** Plugboard sockets sit on the front face: x across, y up. */
export const socketPos = (letter: string) => {
  const { x, z } = rowLayout(0.33, [0.74, 0.47, 0.2])(letter)
  return { x, y: z }
}

export const ROTOR = {
  radius: 0.34,
  width: 0.2,
  axisY: TOP + 0.22,
  z: -1.1,
  slotX: [-0.5, 0, 0.5],
  reflectorX: -1.06,
  entryX: 1.02,
  /** Angle (around the axle, from straight up toward the operator) of the reading window. */
  readAngle: Math.PI / 4,
}
