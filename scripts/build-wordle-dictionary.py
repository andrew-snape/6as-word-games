#!/usr/bin/env python3
# Regenerates games/wordle/dictionary/<N>.json from the system word list.
#
# Requires a plain word list at /usr/share/dict/words (on Debian/Ubuntu:
# `apt-get install wamerican`, or `wbritish` for British spellings). That
# list is a general-purpose dictionary, not curated for a classroom, so
# this script filters out profanity and slurs (see BLOCK_PREFIXES /
# BLOCK_WHOLE below) before writing the per-length JSON files that
# games/wordle/wordle.js fetches to validate guesses. The filter list is a
# best-effort pass, not a guarantee -- if a word slips through, add it to
# BLOCK_WHOLE and rerun.
#
# Run with: python3 scripts/build-wordle-dictionary.py [lengths...]
# e.g.: python3 scripts/build-wordle-dictionary.py 5 6 7 8

import json
import os
import re
import sys

SRC = "/usr/share/dict/words"
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "games", "wordle", "dictionary")

BLOCK_PREFIXES = [
    "fuck", "shit", "cunt", "cock", "dick", "prick", "twat", "bitch", "bastard",
    "damn", "whore", "slut", "piss", "arse", "ass", "bugger", "bloody", "crap",
    "wank", "bollock", "shag", "boob", "titt", "penis", "vagina", "anal", "anus",
    "erect", "orgasm", "porn", "rape", "molest", "pedo", "nazi", "nigg", "chink",
    "spic", "kike", "fagg", "retard", "hooker", "hore", "cum", "jizz", "semen",
    "horny", "kinky", "fetish", "climax", "nude", "naked", "strip", "sperm",
    "condom", "abort", "drunk", "booze", "cocain", "heroin", "meth", "weed",
]

BLOCK_WHOLE = {
    "hell", "hells", "damn", "damns", "sex", "sexy", "gays", "homos", "queer",
    "queers", "nigger", "niggers", "spade", "spades",
    "snigger", "sniggers", "sniggered", "spunk", "spunky", "coolie", "coolies",
    "midget", "midgets", "gypped",
}


def is_blocked(word):
    if word in BLOCK_WHOLE:
        return True
    return any(word.startswith(stem) for stem in BLOCK_PREFIXES)


def main():
    lengths = [int(a) for a in sys.argv[1:]] or [5, 6, 7]

    if not os.path.exists(SRC):
        print(f"No word list found at {SRC}. Install one first, e.g.:")
        print("  apt-get install wamerican")
        sys.exit(1)

    with open(SRC, "r", encoding="latin-1") as f:
        raw = [line.strip() for line in f]

    os.makedirs(OUT_DIR, exist_ok=True)

    for n in lengths:
        pattern = re.compile(rf"^[a-z]{{{n}}}$")
        candidates = [w for w in raw if pattern.fullmatch(w)]
        clean = sorted(set(w.upper() for w in candidates if not is_blocked(w)))
        out_path = os.path.join(OUT_DIR, f"{n}.json")
        with open(out_path, "w") as f:
            json.dump(clean, f)
        print(f"{n} letters: {len(clean)} words -> {out_path}")


if __name__ == "__main__":
    main()
