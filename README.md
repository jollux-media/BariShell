# BariShell

**Standalone project.** Own git repo in this folder. Not part of disaudio or Palettrast — see [../PROJECTS.md](../PROJECTS.md).

A simple web app to visualize where **jazz shell chord** voicings (root, 3rd, and 7th only) can be played on a **baritone guitar** neck.

## Features

- Interactive fretboard with color-coded chord tones (root, 3rd, 7th)
- Two classic shell shapes:
  - **6–4–3** — root on the 6th string
  - **5–3–2** — root on the 5th string
- Chord types: maj7, dom7, min7, half-diminished (m7♭5)
- Tunings:
  - **B–E–A–D–F#–B** (standard baritone, same intervals as guitar, down a fourth)
  - **A–D–G–C–E–A** (alternate baritone tuning)
- List of all playable positions up the neck for the selected chord

Shapes follow the same movable forms as on standard guitar; only the open-string reference pitches change with baritone tuning.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Tech

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- No backend — theory and layout run entirely in the browser

## License

MIT
