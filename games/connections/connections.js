(() => {
  const MAX_MISTAKES = 4;

  const gridEl = document.getElementById('grid');
  const solvedGroupsEl = document.getElementById('solved-groups');
  const messageEl = document.getElementById('message');
  const unitNameEl = document.getElementById('unit-name');
  const mistakesEl = document.getElementById('mistakes');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const deselectBtn = document.getElementById('deselect-btn');
  const submitBtn = document.getElementById('submit-btn');
  const playAgainBtn = document.getElementById('play-again');
  const statsLineEl = document.getElementById('stats-line');

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unit') || 'unit1';

  let groups = [];
  let wordInfo = {};
  let tileOrder = [];
  let selected = new Set();
  let solvedCategories = new Set();
  let mistakesRemaining = MAX_MISTAKES;
  let gameOver = false;

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function updateStatsDisplay() {
    if (statsLineEl) statsLineEl.textContent = Stats.summaryText('connections');
  }

  function showMessage(text, ms) {
    messageEl.textContent = text;
    if (ms) {
      setTimeout(() => {
        if (messageEl.textContent === text) {
          messageEl.textContent = '';
        }
      }, ms);
    }
  }

  function renderMistakes() {
    mistakesEl.innerHTML = 'Mistakes remaining: ' +
      Array.from({ length: MAX_MISTAKES }).map((_, i) =>
        `<span class="dot ${i < mistakesRemaining ? '' : 'used'}"></span>`
      ).join('');
  }

  function renderSolvedGroups() {
    solvedGroupsEl.innerHTML = '';
    for (const group of groups) {
      if (!solvedCategories.has(group.category)) continue;
      const div = document.createElement('div');
      div.className = `solved-group diff-${group.difficulty}`;
      div.innerHTML = `<div class="cat-name">${group.category}</div><div class="cat-words">${group.words.join(', ')}</div>`;
      solvedGroupsEl.appendChild(div);
    }
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    const remaining = tileOrder.filter((word) => !solvedCategories.has(wordInfo[word].category));
    for (const word of remaining) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      if (selected.has(word)) tile.classList.add('selected');
      tile.textContent = word;
      tile.addEventListener('click', () => toggleSelect(word));
      gridEl.appendChild(tile);
    }
  }

  function toggleSelect(word) {
    if (gameOver) return;
    if (selected.has(word)) {
      selected.delete(word);
    } else {
      if (selected.size >= 4) return;
      selected.add(word);
    }
    renderGrid();
  }

  function checkWin() {
    if (solvedCategories.size === groups.length) {
      gameOver = true;
      showMessage('You found all the groups! Well done!');
      playAgainBtn.style.display = 'inline-block';
      Stats.record('connections', true);
      updateStatsDisplay();
    }
  }

  function revealRemaining() {
    for (const group of groups) {
      solvedCategories.add(group.category);
    }
    renderSolvedGroups();
    renderGrid();
  }

  function handleSubmit() {
    if (gameOver) return;
    if (selected.size !== 4) {
      showMessage('Select 4 words first', 1200);
      return;
    }

    const selectedWords = Array.from(selected);
    const categories = selectedWords.map((w) => wordInfo[w].category);
    const allMatch = categories.every((c) => c === categories[0]);

    if (allMatch) {
      solvedCategories.add(categories[0]);
      selected = new Set();
      renderSolvedGroups();
      renderGrid();
      checkWin();
      return;
    }

    const counts = {};
    for (const c of categories) counts[c] = (counts[c] || 0) + 1;
    const closest = Math.max(...Object.values(counts));

    document.querySelectorAll('.tile.selected').forEach((tile) => tile.classList.add('shake'));

    mistakesRemaining -= 1;
    renderMistakes();

    if (closest === 3) {
      showMessage('One away...', 1500);
    }

    setTimeout(() => {
      selected = new Set();
      renderGrid();

      if (mistakesRemaining <= 0) {
        gameOver = true;
        showMessage('Out of guesses! Here are the groups:');
        revealRemaining();
        playAgainBtn.style.display = 'inline-block';
        Stats.record('connections', false);
        updateStatsDisplay();
      }
    }, 400);
  }

  function startGame() {
    selected = new Set();
    solvedCategories = new Set();
    mistakesRemaining = MAX_MISTAKES;
    gameOver = false;
    messageEl.textContent = '';
    playAgainBtn.style.display = 'none';

    const allWords = [];
    for (const group of groups) {
      for (const word of group.words) {
        allWords.push(word);
      }
    }
    tileOrder = shuffle(allWords);

    renderMistakes();
    renderSolvedGroups();
    renderGrid();
  }

  shuffleBtn.addEventListener('click', () => {
    if (gameOver) return;
    const remaining = tileOrder.filter((word) => !solvedCategories.has(wordInfo[word].category));
    const solved = tileOrder.filter((word) => solvedCategories.has(wordInfo[word].category));
    tileOrder = [...solved, ...shuffle(remaining)];
    renderGrid();
  });

  deselectBtn.addEventListener('click', () => {
    selected = new Set();
    renderGrid();
  });

  submitBtn.addEventListener('click', handleSubmit);
  playAgainBtn.addEventListener('click', startGame);

  fetch(`units/${unitId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error('Unit not found');
      return res.json();
    })
    .then((data) => {
      groups = data.groups.map((g) => ({
        ...g,
        words: g.words.map((w) => w.toUpperCase()),
      }));
      unitNameEl.textContent = data.unitName || unitId;

      wordInfo = {};
      for (const group of groups) {
        for (const word of group.words) {
          wordInfo[word] = { category: group.category, difficulty: group.difficulty };
        }
      }

      startGame();
      updateStatsDisplay();
    })
    .catch(() => {
      unitNameEl.textContent = '';
      showMessage("Couldn't load this unit. Ask your teacher to check the link.");
    });
})();
