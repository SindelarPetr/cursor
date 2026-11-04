# Training

A small static React app with two views:

- **Plan** — a 6-week, 4-day strength block (24 sessions) stored as JSON under `plan/`
- **Log** — finished workouts stored as JSON under `workouts/`

It is built with Vite and published to GitHub Pages at [https://sindelarpetr.github.io/cursor/](https://sindelarpetr.github.io/cursor/).

Hash routes (they work under `/cursor/` on GitHub Pages):

| URL | View |
| --- | --- |
| `#/plan` or `#/` | Plan overview |
| `#/session/w1-upper-a` | Gym mode for that session |
| `#/session/current` | Gym mode for the suggested session |
| `#/log` | Logged workouts |

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

## Edit the 6-week plan

Four days a week: **Upper A, Lower A, Upper B, Lower B**. A session is never mixed upper/lower. Every session has three main lifts, exactly one core exercise, and a ~20 minute wrist-rehab block.

Files:

- `plan/week-01.json` … `plan/week-06.json` — week theme plus the four sessions
- `plan/wrist.json` — the shared wrist circuit (merged onto every session at build time)

A week file looks like:

```json
{
  "week": 1,
  "title": "Foundation",
  "goal": "Learn the four sessions. Leave 2–3 reps every set.",
  "wrist": {
    "sets": 2,
    "load": "Very light. Pain-free only.",
    "notes": "Stay inside a comfortable range.",
    "reps": {
      "flex-ext": "10",
      "pro-sup": "8 / way",
      "rad-uln": "8 / way",
      "grip": "10",
      "circles": "6 circles / way"
    }
  },
  "sessions": [
    {
      "id": "w1-upper-a",
      "focus": "upper",
      "variant": "A",
      "title": "Upper A",
      "suggestedDay": "Monday",
      "durationMinutes": 60,
      "notes": "Neutral grips only.",
      "blocks": [
        {
          "id": "main",
          "kind": "main",
          "title": "Main lifts",
          "exercises": [
            {
              "id": "ng-db-bench",
              "name": "Neutral-grip DB bench press",
              "sets": 4,
              "reps": "6–8",
              "restSeconds": 150,
              "load": "RPE 6–7. Leave 3 reps.",
              "notes": "Palms face each other. No barbell bench."
            }
          ]
        },
        {
          "id": "core",
          "kind": "core",
          "title": "Core",
          "exercises": []
        }
      ]
    }
  ]
}
```

`wrist.sets`, `wrist.load`, `wrist.notes`, and `wrist.reps` overlay `plan/wrist.json` so you can change the circuit once and still dose it by week. Week 6 is a deload (fewer sets, easier RPE).

Gym-mode set checkmarks are stored in the browser (`localStorage`), not in git.

## Add a logged workout

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

Files are imported at build time. Invalid JSON (or a file missing required fields) fails the build.

The checked-in log files are clearly marked as sample content.

## Enable GitHub Pages (one-time)

The workflow in `.github/workflows/deploy.yml` builds the app and deploys it on every push to `main`, and can also be started by hand with **Actions → Deploy to GitHub Pages → Run workflow**.

Before the first deploy goes live, a repo admin needs to:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Merge this app to `main` (or run the workflow manually) and wait for the deploy job to finish.
