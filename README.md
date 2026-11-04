# Workouts

A small static React app that lists training sessions stored as plain JSON files in this repo. It is built with Vite and published to GitHub Pages at [https://sindelarpetr.github.io/cursor/](https://sindelarpetr.github.io/cursor/).

## Run locally

```bash
npm install
npm run dev
```

The Vite base path is `/cursor/`, so the local app is at [http://localhost:5173/cursor/](http://localhost:5173/cursor/).

```bash
npm run build
npm run preview
```

Preview serves the production build at [http://localhost:4173/cursor/](http://localhost:4173/cursor/).

## Add a workout

1. Copy any file in `workouts/` (or create a new one).
2. Name it something like `YYYY-MM-DD-short-slug.json`.
3. Fill in the fields below and commit. The next build on `main` picks it up.

```json
{
  "date": "2026-11-04",
  "type": "strength",
  "durationMinutes": 50,
  "title": "Full body",
  "notes": "Optional. Leave this field out if you do not need it.",
  "exercises": [
    { "name": "Back squat", "sets": 4, "reps": 5, "weightKg": 100 },
    { "name": "Easy jog", "distanceKm": 6.2, "notes": "Optional per-exercise note" }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `date` | yes | `YYYY-MM-DD` |
| `type` | yes | `strength`, `run`, `cycling`, or `other` |
| `durationMinutes` | yes | Number of minutes |
| `title` | yes | Shown as the workout heading |
| `notes` | no | Shown under the exercise list |
| `exercises` | yes | Array of exercises |
| `exercises[].name` | yes | Exercise name |
| `exercises[].sets` | no | Used with `reps` as `4×5` |
| `exercises[].reps` | no | Used with `sets` as `4×5` |
| `exercises[].weightKg` | no | Appended as `100 kg` |
| `exercises[].distanceKm` | no | Appended as `6.2 km` |
| `exercises[].notes` | no | Extra line under that exercise |

Files are imported at build time, so you do not need a server or database. Invalid JSON (or a file missing required fields) fails the build.

The checked-in files are clearly marked as sample content.

## Enable GitHub Pages (one-time)

The workflow in `.github/workflows/deploy.yml` builds the app and deploys it on every push to `main`, and can also be started by hand with **Actions → Deploy to GitHub Pages → Run workflow**.

Before the first deploy goes live, a repo admin needs to:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Merge this app to `main` (or run the workflow manually) and wait for the deploy job to finish.
