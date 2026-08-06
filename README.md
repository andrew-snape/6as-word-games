# 6AS Word Games

A free, static, no-login word games site for the class: Wordle, Connections,
and a Word Search generator. Hosted on GitHub Pages, updated by adding small
JSON files -- no game code changes needed for a new unit.

## Adding a new Wordle unit

1. Create a new file at `games/wordle/units/unitN.json` (pick the next free
   number, e.g. `unit4.json`), in this format:

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
   <li><a class="btn" href="games/wordle/index.html?unit=unit4">Term 3 Week 5 Spelling</a></li>
   ```

3. Commit and push. GitHub Pages redeploys automatically on every push to
   `main`.

### How the Wordle game works

- The answer is chosen at random from the unit's word list each time the page
  loads or "Play Again" is pressed.
- Guesses aren't restricted to the unit's own word list -- students can type
  any word of the right length, same as real Wordle. This keeps the game from
  being solvable by just cycling through the other four words.
- 6 guesses, green/yellow/grey tiles, on-screen keyboard plus physical
  keyboard support.

## Adding a new Connections unit

Create `games/connections/units/unitN.json` with exactly 4 groups of 4 words
each (16 unique words total, `difficulty` is one of `yellow`/`green`/`blue`/
`purple`, easiest to hardest):

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

Then link it from the homepage the same way as a Wordle unit. Connections
needs a teacher to supply the four category groupings -- Claude Code can
draft sensible groupings from source material (e.g. a unit planner) but the
categories should be reviewed, since grouping by concept is a judgement call.

Students tap 4 tiles and press Submit. A correct group locks in with its
colour; a wrong guess costs one of 4 mistakes, and "one away" hints show when
3 of the 4 selected words share a category. Shuffle rearranges the remaining
tiles.

## Adding a new Word Search unit

Create `games/wordsearch/units/unitN.json`:

```json
{
  "unitName": "Term 3 Week 4 Spelling",
  "words": ["OCEAN", "TIGER", "PLANT", "STORM", "CHAIR"],
  "gridSize": 12
}
```

`gridSize` should comfortably exceed your longest word -- as a rule of thumb,
at least `longest word length + 2`. The grid is regenerated fresh (new random
placements) on every page load and via the "New Puzzle" button, so the same
unit plays differently each time. Students select a word by dragging (mouse)
or swiping (touch) from its first to last letter, in any of the 8 directions,
forwards or backwards. Includes a print stylesheet so it can double as a
worksheet.

## Current units

- **Wordle**: Sample Spelling Words (demo), Sharing the Planet: Market Words,
  Sharing the Planet: Enterprise Values
- **Connections**: Sharing the Planet: What's My Business?
- **Word Search**: Sharing the Planet: What's My Business?

The "Sharing the Planet" units are drawn from the Year 6 "What's My Business?"
unit of inquiry (social enterprise, ALWS partnerships, global citizenship).

## The ongoing workflow

The easiest way to add a unit: paste your word list (or a unit planner) to
Claude Code and say something like *"Here's this week's spelling list for
Term 3 Week 5: OCEAN, TIGER, ... Please create a new Wordle unit, link it from
the homepage, commit and push."* For Connections, also supply (or ask Claude
Code to draft, then review) the four category groupings.

## Local testing

Because the games load unit data with `fetch()`, opening `index.html`
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
