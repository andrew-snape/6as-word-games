(() => {
  const NEIGHBOR_OFFSETS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];
  const MAX_ATTEMPTS_PER_WORD = 500;
  const MAX_FULL_GRID_ATTEMPTS = 40;
  const DEFAULT_TIME_SECONDS = 90;

  const gridEl = document.getElementById('grid');
  const wordListEl = document.getElementById('word-list');
  const messageEl = document.getElementById('message');
  const unitNameEl = document.getElementById('unit-name');
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const currentWordEl = document.getElementById('current-word');
  const undoBtn = document.getElementById('undo-btn');
  const clearBtn = document.getElementById('clear-btn');
  const submitBtn = document.getElementById('submit-btn');
  const newPuzzleBtn = document.getElementById('new-puzzle-btn');
  const statsLineEl = document.getElementById('stats-line');

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unit') || 'unit1';

  let words = [];
  let gridSize = 11;
  let timeSeconds = DEFAULT_TIME_SECONDS;
  let grid = [];
  let foundWords = new Set();
  let path = [];
  let colorIndex = 0;
  let timeLeft = DEFAULT_TIME_SECONDS;
  let timerHandle = null;
  let gameOver = false;

  function randomLetter() {
    return String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function key(cell) {
    return `${cell.r},${cell.c}`;
  }

  function neighborsOf(cell) {
    const out = [];
    for (const [dr, dc] of NEIGHBOR_OFFSETS) {
      const r = cell.r + dr;
      const c = cell.c + dc;
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) out.push({ r, c });
    }
    return out;
  }

  function tryPlaceWord(g, word) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_WORD; attempt++) {
      const startR = Math.floor(Math.random() * gridSize);
      const startC = Math.floor(Math.random() * gridSize);
      if (g[startR][startC] !== null && g[startR][startC] !== word[0]) continue;

      const wordPath = [{ r: startR, c: startC }];
      const visited = new Set([key(wordPath[0])]);
      let ok = true;

      for (let i = 1; i < word.length; i++) {
        const options = shuffle(neighborsOf(wordPath[wordPath.length - 1])).filter((n) => {
          if (visited.has(key(n))) return false;
          const cellVal = g[n.r][n.c];
          return cellVal === null || cellVal === word[i];
        });
        if (options.length === 0) {
          ok = false;
          break;
        }
        const next = options[0];
        wordPath.push(next);
        visited.add(key(next));
      }

      if (ok) return wordPath;
    }
    return null;
  }

  function tryGenerateGrid() {
    const g = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    const sorted = words.slice().sort((a, b) => b.length - a.length);
    for (const word of sorted) {
      const wordPath = tryPlaceWord(g, word);
      if (!wordPath) return null;
      wordPath.forEach(({ r, c }, i) => {
        g[r][c] = word[i];
      });
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

  function cellEl(r, c) {
    return gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }

  function isAdjacent(a, b) {
    return Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1 && !(a.r === b.r && a.c === b.c);
  }

  function renderPath() {
    gridEl.querySelectorAll('.cell.path').forEach((el) => el.classList.remove('path'));
    for (const { r, c } of path) {
      const el = cellEl(r, c);
      if (el) el.classList.add('path');
    }
    currentWordEl.textContent = path.map(({ r, c }) => grid[r][c]).join('');
  }

  function updateScore() {
    scoreEl.textContent = `Found: ${foundWords.size} / ${words.length}`;
  }

  function markFound(wordPath, word) {
    const colorClass = `found-${colorIndex % 8}`;
    colorIndex++;
    for (const { r, c } of wordPath) {
      const el = cellEl(r, c);
      if (el) el.classList.add(colorClass);
    }
    foundWords.add(word);
    const li = wordListEl.querySelector(`[data-word="${word}"]`);
    if (li) li.classList.add('found');
    updateScore();
  }

  function endGame(reason) {
    if (gameOver) return;
    gameOver = true;
    clearInterval(timerHandle);
    path = [];
    renderPath();
    for (const word of words) {
      if (!foundWords.has(word)) {
        const li = wordListEl.querySelector(`[data-word="${word}"]`);
        if (li) li.classList.add('found');
      }
    }
    messageEl.textContent = reason === 'time'
      ? `Time's up! You found ${foundWords.size} of ${words.length}.`
      : `You found every word! Great work!`;
    Stats.record('wordhunt', reason === 'all-found');
    updateStatsDisplay();
  }

  function updateStatsDisplay() {
    if (statsLineEl) statsLineEl.textContent = Stats.summaryText('wordhunt');
  }

  function tickTimer() {
    timeLeft -= 1;
    timerEl.textContent = `${timeLeft}s`;
    timerEl.classList.toggle('low', timeLeft <= 15);
    if (timeLeft <= 0) {
      endGame('time');
    }
  }

  function handleCellTap(cell) {
    if (gameOver) return;
    if (path.length === 0) {
      path = [cell];
      renderPath();
      return;
    }
    const last = path[path.length - 1];
    const alreadyUsed = path.some((p) => p.r === cell.r && p.c === cell.c);
    if (alreadyUsed || !isAdjacent(last, cell)) return;
    path.push(cell);
    renderPath();
  }

  function handleSubmit() {
    if (gameOver || path.length === 0) return;
    const forward = path.map(({ r, c }) => grid[r][c]).join('');
    const backward = forward.split('').reverse().join('');
    const match = words.find((w) => !foundWords.has(w) && (w === forward || w === backward));
    if (match) {
      markFound(path, match);
      messageEl.textContent = '';
      if (foundWords.size === words.length) {
        endGame('all-found');
      }
    } else {
      messageEl.textContent = `"${forward}" isn't on the list`;
      setTimeout(() => {
        if (messageEl.textContent === `"${forward}" isn't on the list`) messageEl.textContent = '';
      }, 1200);
    }
    path = [];
    renderPath();
  }

  function handleUndo() {
    if (gameOver || path.length === 0) return;
    path.pop();
    renderPath();
  }

  function handleClear() {
    if (gameOver) return;
    path = [];
    renderPath();
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
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          handleCellTap({ r, c });
        });
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
    clearInterval(timerHandle);
    foundWords = new Set();
    path = [];
    colorIndex = 0;
    gameOver = false;
    timeLeft = timeSeconds;
    messageEl.textContent = '';
    currentWordEl.textContent = '';
    timerEl.textContent = `${timeLeft}s`;
    timerEl.classList.remove('low');
    grid = generateGrid();
    renderGrid();
    renderWordList();
    updateScore();
    timerHandle = setInterval(tickTimer, 1000);
  }

  undoBtn.addEventListener('click', handleUndo);
  clearBtn.addEventListener('click', handleClear);
  submitBtn.addEventListener('click', handleSubmit);
  newPuzzleBtn.addEventListener('click', startPuzzle);

  fetch(`units/${unitId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error('Unit not found');
      return res.json();
    })
    .then((data) => {
      words = data.words.map((w) => w.toUpperCase());
      gridSize = data.gridSize || Math.max(10, ...words.map((w) => w.length));
      timeSeconds = data.timeSeconds || DEFAULT_TIME_SECONDS;
      unitNameEl.textContent = data.unitName || unitId;
      startPuzzle();
      updateStatsDisplay();
    })
    .catch(() => {
      unitNameEl.textContent = '';
      messageEl.textContent = "Couldn't load this unit. Ask your teacher to check the link.";
    });
})();
