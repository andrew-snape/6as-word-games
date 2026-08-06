# 6AS Word Games

A free, static, no-login word games site for the class: Wordle, Connections,
a Word Search generator, and Word Hunt. Hosted on GitHub Pages, updated by
adding small JSON files -- no game code changes needed for a new unit. A
validation script (see below) catches malformed unit files before they go
live.

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

2. Add an entry to `games/wordle/units/index.json`:

   ```json
   { "id": "unit4", "name": "Term 3 Week 5 Spelling" }
   ```

   This one file drives both the homepage's unit list and the dropdown
   selector on the Wordle page itself -- nothing else needs editing.

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
- Tracks a per-device win streak (see "Streak tracking" below).

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

Then add it to `games/connections/units/index.json` the same way as a Wordle
unit. Connections needs a teacher to supply the four category groupings --
Claude Code can draft sensible groupings from source material (e.g. a unit
planner) but the categories should be reviewed, since grouping by concept is
a judgement call.

Students tap 4 tiles and press Submit. A correct group locks in with its
colour; a wrong guess costs one of 4 mistakes, and "one away" hints show when
3 of the 4 selected words share a category. Shuffle rearranges the remaining
tiles. Tracks a per-device win streak (see "Streak tracking" below).

## Adding a new Word Search unit

Create `games/wordsearch/units/unitN.json`:

```json
{
  "unitName": "Term 3 Week 4 Spelling",
  "words": ["OCEAN", "TIGER", "PLANT", "STORM", "CHAIR"],
  "gridSize": 12
}
```

Then add it to `games/wordsearch/units/index.json` the same way as a Wordle
unit.

`gridSize` should comfortably exceed your longest word -- as a rule of thumb,
at least `longest word length + 2`. The grid is regenerated fresh (new random
placements) on every page load and via the "New Puzzle" button, so the same
unit plays differently each time. Includes a print stylesheet so it can
double as a worksheet.

Students select a word two ways, in any of the 8 directions, forwards or
backwards:
- **Tap the first letter, then tap the last letter** -- the more reliable
  option on touch devices, since it doesn't need an accurate drag.
- **Drag from the first letter to the last** -- works well with a mouse or
  trackpad.

Tapping the same (anchored) letter twice cancels the selection. No streak
tracking here -- Word Search has no win/lose state (it's open-ended), so a
streak doesn't fit.

## Adding a new Word Hunt unit

Create `games/wordhunt/units/unitN.json`:

```json
{
  "unitName": "Term 3 Week 4 Spelling",
  "words": ["OCEAN", "TIGER", "PLANT", "STORM", "CHAIR"],
  "gridSize": 11,
  "timeSeconds": 90
}
```

Then add it to `games/wordhunt/units/index.json` the same way as a Wordle
unit.

`gridSize` and the word-length rule of thumb are the same as Word Search.
`timeSeconds` is optional (defaults to 90).

Unlike Word Search, words aren't hidden in straight lines -- each one is
placed along a path of touching (including diagonal) letters, so the same
word can bend and double back through the grid. Students tap letters one at
a time (each tap must touch the previous one and can't reuse a letter
already in the current word) and press Submit before the timer runs out.
Undo removes the last letter, Clear resets the current attempt. Score is
just how many of the unit's words got found in time -- there's no dictionary
check, so only words from the unit's list count (this is spelling/vocab
practice, not open-ended Boggle). Tracks a per-device streak: a full clear
before time's up counts as a win, running out of time counts as a loss (see
"Streak tracking" below). Note that hitting "New Puzzle" mid-round doesn't
count as a loss -- only the two natural end states do.

## Current units

- **Wordle**: General Words, Maths Words, Sharing the Planet: Market Words,
  Sharing the Planet: Enterprise Values
- **Connections**: Sharing the Planet: What's My Business?
- **Word Search**: Sharing the Planet: What's My Business?
- **Word Hunt**: General & Maths Words

The "Sharing the Planet" units are drawn from the Year 6 "What's My Business?"
unit of inquiry (social enterprise, ALWS partnerships, global citizenship).

## The ongoing workflow

The easiest way to add a unit: paste your word list (or a unit planner) to
Claude Code and say something like *"Here's this week's spelling list for
Term 3 Week 5: OCEAN, TIGER, ... Please create a new Wordle unit, add it to
the manifest, commit and push."* For Connections, also supply (or ask Claude
Code to draft, then review) the four category groupings.

Adding a unit is now always the same two steps regardless of game: create
`games/<game>/units/unitN.json`, then add `{ "id": "unitN", "name": "..." }`
to `games/<game>/units/index.json`. Both the homepage and the in-game unit
picker (see below) read from that manifest, so there's only one place to
register a new unit -- no separate homepage HTML to keep in sync.

## Unit picker

Every game page has a dropdown (populated from that game's `units/index.json`)
so students and teachers can switch between units without going back to the
homepage or typing a `?unit=` URL. Selecting a different unit reloads the
page with that unit loaded.

## Dark mode

A sun/moon toggle button (top-right on every page) switches between light and
dark. It defaults to following the device's system preference, but an
explicit toggle is remembered per-device (via `localStorage`) and overrides
that from then on. Printed worksheets (Word Search, and Word Hunt if you ever
add print support there) always print in light mode regardless of the
on-screen theme, so they don't waste ink.

## Streak tracking

Wordle, Connections, and Word Hunt track a simple per-device win streak
(played / current streak / best streak) via `localStorage` -- no login or
account needed, and it resets if a student switches devices. Word Search
doesn't have one, since it has no win/lose state to track. The shared logic
lives in `stats.js` (`Stats.record(gameKey, won)` / `Stats.get(gameKey)`).

## Validating unit files

Before pushing a new or edited unit, run:

```
node scripts/validate-units.js
```

It checks each game's rules (Wordle word-length consistency, Connections'
4-groups-of-4 structure and unique words, Word Search/Word Hunt gridSize vs.
longest word), that every word contains only letters, and cross-checks each
game's `units/index.json` manifest against the unit files that actually exist
(in both directions -- a manifest entry with no matching file is an error, a
unit file missing from the manifest is a warning). Exits non-zero on errors.
This also runs automatically on every push and pull request via
`.github/workflows/validate.yml`, so a bad unit file gets caught before (or
right after) it reaches `main`.

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
