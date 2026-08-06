(() => {
  const poolEl = document.getElementById('letter-pool');
  const answerEl = document.getElementById('answer-row');
  const messageEl = document.getElementById('message');
  const unitNameEl = document.getElementById('unit-name');
  const statsLineEl = document.getElementById('stats-line');
  const solvedCountEl = document.getElementById('solved-count');
  const undoBtn = document.getElementById('undo-btn');
  const clearBtn = document.getElementById('clear-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const submitBtn = document.getElementById('submit-btn');
  const revealBtn = document.getElementById('reveal-btn');
  const nextBtn = document.getElementById('next-btn');

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unit') || 'unit1';

  let words = [];
  let word = '';
  let tiles = []; // { id, char, placed }
  let answerOrder = []; // tile ids in the order placed
  let roundOver = false;
  let solvedThisSession = 0;

  function updateStatsDisplay() {
    if (statsLineEl) statsLineEl.textContent = Stats.summaryText('anagram');
  }

  function showMessage(text, ms) {
    messageEl.textContent = text;
    if (ms) {
      setTimeout(() => {
        if (messageEl.textContent === text) messageEl.textContent = '';
      }, ms);
    }
  }

  function pickWord() {
    if (words.length === 1) return words[0];
    let next = word;
    while (next === word) {
      next = words[Math.floor(Math.random() * words.length)];
    }
    return next;
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scrambledOrder(target) {
    let order = target.split('').map((_, i) => i);
    if (target.length > 1) {
      let attempts = 0;
      do {
        order = shuffleArray(order);
        attempts++;
      } while (order.every((v, i) => v === i) && attempts < 10);
    }
    return order;
  }

  function buildTiles() {
    const order = scrambledOrder(word);
    tiles = order.map((charIndex, i) => ({ id: i, char: word[charIndex], placed: false }));
  }

  function render() {
    answerEl.innerHTML = '';
    for (let i = 0; i < word.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'letter-tile slot';
      const tileId = answerOrder[i];
      if (tileId !== undefined) {
        const tile = tiles.find((t) => t.id === tileId);
        slot.textContent = tile.char;
        slot.classList.add('filled');
        slot.addEventListener('click', () => removeFromAnswer(tileId));
      }
      answerEl.appendChild(slot);
    }

    poolEl.innerHTML = '';
    for (const tile of tiles) {
      if (tile.placed) continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'letter-tile pool-tile';
      btn.textContent = tile.char;
      btn.disabled = roundOver;
      btn.addEventListener('click', () => addToAnswer(tile.id));
      poolEl.appendChild(btn);
    }
  }

  function addToAnswer(tileId) {
    if (roundOver) return;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || tile.placed) return;
    tile.placed = true;
    answerOrder.push(tileId);
    render();
  }

  function removeFromAnswer(tileId) {
    if (roundOver) return;
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile) return;
    tile.placed = false;
    answerOrder = answerOrder.filter((id) => id !== tileId);
    render();
  }

  function currentGuess() {
    return answerOrder.map((id) => tiles.find((t) => t.id === id).char).join('');
  }

  function handleUndo() {
    if (roundOver || answerOrder.length === 0) return;
    removeFromAnswer(answerOrder[answerOrder.length - 1]);
  }

  function handleClear() {
    if (roundOver) return;
    tiles.forEach((t) => (t.placed = false));
    answerOrder = [];
    render();
  }

  function handleShuffle() {
    if (roundOver) return;
    const poolTiles = shuffleArray(tiles.filter((t) => !t.placed));
    let i = 0;
    tiles = tiles.map((t) => (t.placed ? t : poolTiles[i++]));
    render();
  }

  function endRound(won) {
    roundOver = true;
    if (won) {
      solvedThisSession += 1;
      solvedCountEl.textContent = `Solved: ${solvedThisSession}`;
    }
    Stats.record('anagram', won);
    updateStatsDisplay();
    nextBtn.style.display = 'inline-block';
    render();
  }

  function handleSubmit() {
    if (roundOver) return;
    const guess = currentGuess();
    if (guess.length !== word.length) {
      showMessage(`Place all ${word.length} letters first`, 1400);
      return;
    }
    if (guess === word) {
      showMessage('Correct! Well done!');
      endRound(true);
      return;
    }
    showMessage('Not quite -- try again', 1400);
    tiles.forEach((t) => (t.placed = false));
    answerOrder = [];
    render();
  }

  function handleReveal() {
    if (roundOver) return;
    showMessage(`The word was: ${word}`);
    endRound(false);
  }

  function startRound() {
    word = pickWord();
    roundOver = false;
    answerOrder = [];
    messageEl.textContent = '';
    nextBtn.style.display = 'none';
    buildTiles();
    render();
  }

  undoBtn.addEventListener('click', handleUndo);
  clearBtn.addEventListener('click', handleClear);
  shuffleBtn.addEventListener('click', handleShuffle);
  submitBtn.addEventListener('click', handleSubmit);
  revealBtn.addEventListener('click', handleReveal);
  nextBtn.addEventListener('click', startRound);

  fetch(`units/${unitId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error('Unit not found');
      return res.json();
    })
    .then((data) => {
      words = data.words.map((w) => w.toUpperCase());
      unitNameEl.textContent = data.unitName || unitId;
      solvedCountEl.textContent = `Solved: ${solvedThisSession}`;
      startRound();
      updateStatsDisplay();
    })
    .catch(() => {
      unitNameEl.textContent = '';
      showMessage("Couldn't load this unit. Ask your teacher to check the link.");
    });
})();
