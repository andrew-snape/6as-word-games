# 6AS Word Games

A free, static, no-login word games site for the class: a Wordle clone (built),
plus Connections and Word Search (coming later). Hosted on GitHub Pages,
updated by adding small JSON files — no game code changes needed for a new
unit.

## Adding a new Wordle unit

1. Create a new file at `games/wordle/units/unitN.json` (pick the next free
   number, e.g. `unit2.json`), in this format:

   ```json
   {
     "unitName": "Term 3 Week 5 Spelling",
     "words": ["OCEAN", "TIGER", "PLANT", "STORM", "CHAIR"]
   }
   ```

   All words in a unit should be the same length -- the board sizes itself to
   whichever word gets picked as the answer.

2. Add a link to it on the homepage (`index.html`), inside the Wordle
   `<ul class="unit-list">`:

   ```html
   <li><a class="btn" href="games/wordle/index.html?unit=unit2">Term 3 Week 5 Spelling</a></li>
   ```

3. Commit and push. GitHub Pages redeploys automatically on every push to
   `main`.

The easiest way to do this: paste your word list to Claude Code and say
something like *"Here's this week's spelling list for Term 3 Week 5: OCEAN,
TIGER, ... Please create a new Wordle unit, link it from the homepage, commit
and push."*

## How the Wordle game works

- The answer is chosen at random from the unit's word list each time the page
  loads or "Play Again" is pressed.
- Guesses aren't restricted to the unit's own word list -- students can type
  any word of the right length, same as real Wordle. This keeps the game from
  being solvable by just cycling through the other four words.
- 6 guesses, green/yellow/grey tiles, on-screen keyboard plus physical
  keyboard support. Works on iPad/Chromebook browsers, no login or backend.

## Connections and Word Search

Not built yet. Planned data formats, for when they're added:

**Connections** (`games/connections/units/unitN.json`):
```json
{
  "unitName": "Term 3 Water Cycle Vocabulary",
  "groups": [
    { "category": "States of Water", "words": ["ICE", "VAPOUR", "LIQUID", "STEAM"], "difficulty": "yellow" },
    { "category": "Water Cycle Stages", "words": ["EVAPORATION", "CONDENSATION", "PRECIPITATION", "COLLECTION"], "difficulty": "green" },
    { "category": "Bodies of Water", "words": ["OCEAN", "RIVER", "LAKE", "STREAM"], "difficulty": "blue" },
    { "category": "Weather Words", "words": ["CLOUD", "RAIN", "HUMIDITY", "MIST"], "difficulty": "purple" }
  ]
}
```
Connections needs a teacher to supply the four category groupings -- Claude
Code can't infer how words relate from a flat list.

**Word Search** (`games/wordsearch/units/unitN.json`):
```json
{
  "unitName": "Term 3 Week 4 Spelling",
  "words": ["OCEAN", "TIGER", "PLANT", "STORM", "CHAIR"],
  "gridSize": 12
}
```

## Local testing

Because the game loads unit data with `fetch()`, opening `index.html`
directly from disk (`file://...`) won't work -- browsers block `fetch` of
local files under that protocol. Run a tiny local server from the repo root
instead:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## GitHub Pages

Served from the root of the `main` branch. Settings -> Pages -> Source:
`main` / `/ (root)`.
