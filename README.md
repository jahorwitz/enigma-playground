# Enigma Playground

An interactive, 3D Enigma I cipher machine for learning how Enigma worked.

- **Set the daily key**: wheel order (rotors I–VIII), ring settings, start positions, reflector (UKW-A/B/C) and plugboard cables.
- **Type**: click the 3D keys or use your keyboard. Watch the rotors step and the lamp light up. `Backspace` undoes a letter.
- **Follow the current**: the signal path diagram traces each key press through plugboard → rotors → reflector → back.
- **Learn**: open the `?` markers on the machine or work through the 11 lessons, from the keyboard to how Bletchley Park broke it.
- **Share**: copy the ciphertext and a link that loads your exact settings, so a friend can decrypt it.

The cipher engine (`src/enigma/engine.ts`) is checked against known test vectors, including the double-step anomaly.

## Develop

```bash
npm install
npm run dev
```

`npm test` runs the engine tests. `npm run build` outputs a static site to `dist/`.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
The Vite `base` is relative (`./`), so the site works under any repository name.

Built with React, three.js (@react-three/fiber + drei), and zustand.
