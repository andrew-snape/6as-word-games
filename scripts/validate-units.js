#!/usr/bin/env node
// Validates every games/*/units/*.json file and cross-checks index.html links.
// Run with: node scripts/validate-units.js
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WORD_RE = /^[A-Za-z]+$/;
const VALID_DIFFICULTIES = ['yellow', 'green', 'blue', 'purple'];

const errors = [];
const warnings = [];

function rel(p) {
  return path.relative(ROOT, p);
}

function findUnitFiles(gameDir) {
  const unitsDir = path.join(ROOT, 'games', gameDir, 'units');
  if (!fs.existsSync(unitsDir)) return [];
  return fs
    .readdirSync(unitsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(unitsDir, f));
}

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    errors.push(`${rel(filePath)}: invalid JSON (${e.message})`);
    return null;
  }
}

function validateWordle(filePath, data) {
  const f = rel(filePath);
  if (typeof data.unitName !== 'string' || !data.unitName.trim()) {
    errors.push(`${f}: missing or empty "unitName"`);
  }
  if (!Array.isArray(data.words) || data.words.length === 0) {
    errors.push(`${f}: "words" must be a non-empty array`);
    return;
  }
  const lengths = new Set();
  const seen = new Set();
  for (const w of data.words) {
    if (typeof w !== 'string' || !WORD_RE.test(w)) {
      errors.push(`${f}: word "${w}" must contain only letters (no spaces/punctuation/numbers)`);
      continue;
    }
    lengths.add(w.length);
    const upper = w.toUpperCase();
    if (seen.has(upper)) warnings.push(`${f}: word "${w}" appears more than once`);
    seen.add(upper);
  }
  if (lengths.size > 1) {
    warnings.push(
      `${f}: words are not all the same length (${[...lengths].sort((a, b) => a - b).join(', ')}) ` +
      '-- the board sizes itself to whichever word is picked, so this makes the puzzle inconsistent between plays'
    );
  }
  if (data.words.length < 2) {
    warnings.push(`${f}: only ${data.words.length} word(s) -- "Play Again" will always pick the same word`);
  }
}

function validateConnections(filePath, data) {
  const f = rel(filePath);
  if (typeof data.unitName !== 'string' || !data.unitName.trim()) {
    errors.push(`${f}: missing or empty "unitName"`);
  }
  if (!Array.isArray(data.groups) || data.groups.length !== 4) {
    errors.push(
      `${f}: "groups" must be an array of exactly 4 groups (found ${Array.isArray(data.groups) ? data.groups.length : 'none'})`
    );
    return;
  }

  const allWords = [];
  const difficulties = [];
  data.groups.forEach((g, i) => {
    const label = `${f}: group ${i + 1}`;
    if (typeof g.category !== 'string' || !g.category.trim()) {
      errors.push(`${label}: missing or empty "category"`);
    }
    if (!VALID_DIFFICULTIES.includes(g.difficulty)) {
      errors.push(`${label}: "difficulty" must be one of ${VALID_DIFFICULTIES.join('/')} (got "${g.difficulty}")`);
    } else {
      difficulties.push(g.difficulty);
    }
    if (!Array.isArray(g.words) || g.words.length !== 4) {
      errors.push(
        `${label}: "words" must be an array of exactly 4 words (found ${Array.isArray(g.words) ? g.words.length : 'none'})`
      );
      return;
    }
    for (const w of g.words) {
      if (typeof w !== 'string' || !WORD_RE.test(w)) {
        errors.push(`${label}: word "${w}" must contain only letters (no spaces/punctuation)`);
      } else {
        allWords.push(w.toUpperCase());
      }
    }
  });

  const counts = new Map();
  for (const w of allWords) counts.set(w, (counts.get(w) || 0) + 1);
  for (const [w, count] of counts) {
    if (count > 1) errors.push(`${f}: word "${w}" appears in more than one group (all 16 words must be unique)`);
  }

  const dupDifficulty = difficulties.filter((d, i) => difficulties.indexOf(d) !== i);
  if (dupDifficulty.length > 0) {
    warnings.push(
      `${f}: difficulty "${dupDifficulty[0]}" used more than once -- normally each of yellow/green/blue/purple appears exactly once`
    );
  }
}

function validateGridGame(filePath, data, { requireGridSize }) {
  const f = rel(filePath);
  if (typeof data.unitName !== 'string' || !data.unitName.trim()) {
    errors.push(`${f}: missing or empty "unitName"`);
  }
  if (!Array.isArray(data.words) || data.words.length === 0) {
    errors.push(`${f}: "words" must be a non-empty array`);
    return;
  }

  let maxLen = 0;
  const seen = new Set();
  for (const w of data.words) {
    if (typeof w !== 'string' || !WORD_RE.test(w)) {
      errors.push(`${f}: word "${w}" must contain only letters (no spaces/punctuation)`);
      continue;
    }
    const upper = w.toUpperCase();
    if (seen.has(upper)) warnings.push(`${f}: word "${w}" appears more than once`);
    seen.add(upper);
    maxLen = Math.max(maxLen, w.length);
  }

  if (!requireGridSize && data.gridSize === undefined) return;

  const gridSize = data.gridSize;
  if (typeof gridSize !== 'number' || !Number.isInteger(gridSize) || gridSize <= 0) {
    errors.push(`${f}: "gridSize" must be a positive integer`);
    return;
  }
  if (gridSize < maxLen) {
    errors.push(`${f}: gridSize (${gridSize}) is smaller than the longest word (${maxLen} letters) -- it can never be placed`);
  } else if (gridSize < maxLen + 2) {
    warnings.push(`${f}: gridSize (${gridSize}) is tight for the longest word (${maxLen} letters) -- recommend at least ${maxLen + 2}`);
  }
}

function checkHomepageLinks() {
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(indexPath)) {
    warnings.push('index.html not found -- skipped homepage link cross-check');
    return;
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const linkRe = /href="games\/(wordle|connections|wordsearch|wordhunt)\/index\.html\?unit=([\w-]+)"/g;
  const linked = { wordle: new Set(), connections: new Set(), wordsearch: new Set(), wordhunt: new Set() };
  let m;
  while ((m = linkRe.exec(html))) {
    linked[m[1]].add(m[2]);
  }

  for (const game of Object.keys(linked)) {
    const existingIds = findUnitFiles(game).map((f) => path.basename(f, '.json'));
    for (const unitId of linked[game]) {
      if (!existingIds.includes(unitId)) {
        errors.push(`index.html: links to games/${game}/units/${unitId}.json but that file doesn't exist`);
      }
    }
    for (const unitId of existingIds) {
      if (!linked[game].has(unitId)) {
        warnings.push(`games/${game}/units/${unitId}.json exists but isn't linked from index.html`);
      }
    }
  }
}

function main() {
  for (const filePath of findUnitFiles('wordle')) {
    const data = readJSON(filePath);
    if (data) validateWordle(filePath, data);
  }
  for (const filePath of findUnitFiles('connections')) {
    const data = readJSON(filePath);
    if (data) validateConnections(filePath, data);
  }
  for (const filePath of findUnitFiles('wordsearch')) {
    const data = readJSON(filePath);
    if (data) validateGridGame(filePath, data, { requireGridSize: true });
  }
  for (const filePath of findUnitFiles('wordhunt')) {
    const data = readJSON(filePath);
    if (data) validateGridGame(filePath, data, { requireGridSize: true });
  }

  checkHomepageLinks();

  if (warnings.length) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  - ${w}`);
    console.log('');
  }

  if (errors.length) {
    console.log('Errors:');
    for (const e of errors) console.log(`  - ${e}`);
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }

  console.log(`All unit files valid. ${warnings.length} warning(s).`);
}

main();
