(() => {
  const DIRECTIONS = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  const MAX_ATTEMPTS_PER_WORD = 400;
  const MAX_FULL_GRID_ATTEMPTS = 30;

  const gridEl = document.getElementById('grid');
  const wordListEl = document.getElementById('word-list');
  const messageEl = document.getElementById('message');
  const unitNameEl = document.getElementById('unit-name');
  const newPuzzleBtn = document.getElementById('new-puzzle-btn');
  const printBtn = document.getElementById('print-btn');

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unit') || 'unit1';

  let words = [];
  let gridSize = 12;
  let grid = [];
  let foundWords = new Set();
  let pendingAnchor = null;
  let pressCell = null;
  let pressMoved = false;
  let colorIndex = 0;

  function randomLetter() {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }

  function canPlace(g, word, row, col, dir) {
    const [dr, dc] = dir;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
      const cell = g[r][c];
      if (cell !== null && cell !== word[i]) return false;
    }
    return true;
  }

  function place(g, word, row, col, dir) {
    const [dr, dc] = dir;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      g[r][c] = word[i];
    }
  }

  function tryGenerateGrid() {
    const g = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    const sortedWords = words.slice().sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
      let placed = false;
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_WORD; attempt++) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        if (canPlace(g, word, row, col, dir)) {
          place(g, word, row, col, dir);
          placed = true;
          break;
        }
      }
      if (!placed) return null;
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (g[r][c] === null) g[r][c] = randomLetter();
      }
    }

    return g;
  }

  function generateGrid() {
    for (let i = 0; i < MAX_FULL_GRID_ATTEMPTS; i++) {
      const g = tryGenerateGrid();
      if (g) return g;
    }
    return tryGenerateGrid() || Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => randomLetter())
    );
  }

  function cellKey(r, c) {
    return `${r},${c}`;
  }

  function getLinePath(a, b) {
    const dr = b.r - a.r;
    const dc = b.c - a.c;
    if (dr === 0 && dc === 0) return [a];
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    const path = [];
    for (let i = 0; i <= steps; i++) {
      path.push({ r: a.r + stepR * i, c: a.c + stepC * i });
    }
    return path;
  }

  function pathToWord(path) {
    return path.map(({ r, c }) => grid[r][c]).join('');
  }

  function cellEl(r, c) {
    return gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }

  function clearSelectionHighlight() {
    gridEl.querySelectorAll('.cell.selecting').forEach((el) => el.classList.remove('selecting'));
  }

  function highlightPath(path) {
    clearSelectionHighlight();
    for (const { r, c } of path) {
      const el = cellEl(r, c);
      if (el) el.classList.add('selecting');
    }
  }

  function setAnchor(cell) {
    pendingAnchor = cell;
    const el = cellEl(cell.r, cell.c);
    if (el) el.classList.add('anchor');
  }

  function clearAnchor() {
    if (!pendingAnchor) return;
    const el = cellEl(pendingAnchor.r, pendingAnchor.c);
    if (el) el.classList.remove('anchor');
    pendingAnchor = null;
  }

  function markFound(path, word) {
    const colorClass = `found-${colorIndex % 8}`;
    colorIndex++;
    for (const { r, c } of path) {
      const el = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (el) {
        el.classList.remove('selecting');
        el.classList.add(colorClass);
      }
    }
    foundWords.add(word);
    const li = wordListEl.querySelector(`[data-word="${word}"]`);
    if (li) li.classList.add('found');
  }

  function attemptFinish(a, b) {
    clearSelectionHighlight();
    const path = getLinePath(a, b);
    if (!path) return;
    const forward = pathToWord(path);
    const backward = forward.split('').reverse().join('');
    const match = words.find((w) => !foundWords.has(w) && (w === forward || w === backward));
    if (match) {
      markFound(path, match);
      if (foundWords.size === words.length) {
        messageEl.textContent = 'You found every word! Great work!';
      }
    }
  }

  function cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.classList.contains('cell')) return null;
    return { r: Number(el.dataset.r), c: Number(el.dataset.c) };
  }

  function sameCell(a, b) {
    return !!a && !!b && a.r === b.r && a.c === b.c;
  }

  // Selection works two ways, so it's forgiving on touch devices:
  // 1. Drag from the first letter to the last and release.
  // 2. Tap the first letter, then tap the last letter (no dragging needed).
  // Tapping the same anchor cell twice cancels the selection.
  function onPointerDown(e) {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    pressCell = cell;
    pressMoved = false;
    highlightPath([cell]);
  }

  function onPointerMove(e) {
    if (!pressCell) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    if (!sameCell(cell, pressCell)) pressMoved = true;
    const path = getLinePath(pressCell, cell);
    if (path) highlightPath(path);
  }

  function onPointerUp(e) {
    if (!pressCell) return;
    const point = e.changedTouches ? e.changedTouches[0] : e;
    const releaseCell = cellFromPoint(point.clientX, point.clientY) || pressCell;

    if (pressMoved && !sameCell(releaseCell, pressCell)) {
      // A real drag: it defines its own selection outright.
      clearAnchor();
      attemptFinish(pressCell, releaseCell);
    } else if (pendingAnchor === null) {
      // First tap: remember it and wait for the second tap.
      clearSelectionHighlight();
      setAnchor(pressCell);
    } else if (sameCell(pressCell, pendingAnchor)) {
      // Tapped the anchor again: cancel.
      clearSelectionHighlight();
      clearAnchor();
    } else {
      // Second tap: finish the selection from the anchor.
      const anchor = pendingAnchor;
      clearAnchor();
      attemptFinish(anchor, pressCell);
    }

    pressCell = null;
    pressMoved = false;
  }

  function renderGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridEl.style.width = 'min(94vw, 480px)';
    gridEl.innerHTML = '';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.textContent = grid[r][c];
        gridEl.appendChild(cell);
      }
    }
  }

  function renderWordList() {
    wordListEl.innerHTML = '';
    for (const word of words) {
      const li = document.createElement('li');
      li.textContent = word;
      li.dataset.word = word;
      wordListEl.appendChild(li);
    }
  }

  function startPuzzle() {
    foundWords = new Set();
    colorIndex = 0;
    messageEl.textContent = '';
    grid = generateGrid();
    renderGrid();
    renderWordList();
  }

  gridEl.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  newPuzzleBtn.addEventListener('click', startPuzzle);
  printBtn.addEventListener('click', () => window.print());

  fetch(`units/${unitId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error('Unit not found');
      return res.json();
    })
    .then((data) => {
      words = data.words.map((w) => w.toUpperCase());
      gridSize = data.gridSize || Math.max(12, ...words.map((w) => w.length));
      unitNameEl.textContent = data.unitName || unitId;
      startPuzzle();
    })
    .catch(() => {
      unitNameEl.textContent = '';
      messageEl.textContent = "Couldn't load this unit. Ask your teacher to check the link.";
    });
})();
