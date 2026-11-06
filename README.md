# Training

A small static React app with two views:

- **Plan**: a 6-week strength plan with 2 sessions a week (12 sessions), stored as JSON under `plan/`
- **Log**: finished workouts stored as JSON under `workouts/`

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

`npm run build` first runs `npm run check` (`scripts/check-plan.ts`), which validates `plan/` against the rules below and tests the Continue and previous/next logic. A broken plan file fails the build, including the GitHub Pages deploy.

## The plan

Two sessions a week. The owner does two other workouts elsewhere.

| Weeks | Block | Sessions |
| --- | --- | --- |
| 1–3 | Upper-body block | Upper A, Upper B |
| 4–6 | Lower-body block | Lower A, Lower B |

Rules for every session:

- Upper or lower only, never mixed.
- Three wrist-friendly main lifts: neutral grips, straps on pulls, and landmine or dumbbell pressing instead of heavy barbell pressing.
- Exactly one small core exercise.
- About 20 minutes (roughly a third of a ~60 minute session) of wrist rehab, using the shared circuit in `plan/wrist.json`.

| Session | Main lifts | Core |
| --- | --- | --- |
| Upper A | Neutral-grip DB bench press, chest-supported row, landmine press | Dead bug |
| Upper B | Neutral-grip DB incline press, one-arm DB row (strap), seated neutral-grip DB press | Bird dog |
| Lower A | Back or goblet squat, Romanian deadlift (straps), Bulgarian split squat | Side plank |
| Lower B | Goblet squat, single-leg Romanian deadlift (straps), reverse lunge | Suitcase hold |

Progression inside each 3-week block:

1. **Intro** (weeks 1 and 4): find working weights at RPE 6–7, leaving 2–3 reps in the tank.
2. **Build** (weeks 2 and 5): keep the same weights and do more reps (top of the range, +2 reps on rows and single-leg work).
3. **Top week** (weeks 3 and 6): add a little load and bring reps back to 6–8, plus an extra set on the third upper lift. Last sets at RPE 8, never a grind.

There is no deload week inside a block. At 2 sessions a week, a block is only 6 sessions, and the switch from upper to lower already rests the muscles from the first block. After week 6, take an easy week before starting the plan again. The wrist dose keeps building gently across all six weeks, peaking in week 5, and drops back to standard reps in week 6.

### Edit the plan

- `plan/week-01.json` … `plan/week-06.json`: the week's block, theme, and goal, plus its two sessions.
- `plan/wrist.json`: the shared wrist circuit. It is added to every session.

A week file looks like this (shortened):

```json
{
  "week": 1,
  "block": "upper",
  "blockWeek": 1,
  "title": "Intro",
  "goal": "Learn Upper A and Upper B. Every set ends with 2–3 reps left.",
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
      "notes": "First upper day.",
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
          "exercises": [
            {
              "id": "dead-bug",
              "name": "Dead bug",
              "sets": 3,
              "reps": "10 / side",
              "restSeconds": 45,
              "load": "Bodyweight",
              "notes": "Low back stays on the floor."
            }
          ]
        }
      ]
    }
  ]
}
```

The week's `wrist` values (`sets`, `load`, `notes`, and `reps` per drill id) overlay `plan/wrist.json`, so you define the circuit once and set the dose per week.

### What the browser remembers

Only the last opened session, so the overview's Continue card and `#/session/current` can take you back to it. It is stored in `localStorage` under `cursor-plan-last-session`, and ignored if that session no longer exists in `plan/`. The app has no set ticking or progress counters. Older set-tracking data in the browser (`cursor-plan-progress-v1` / `-v2`) is deleted on load.

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
