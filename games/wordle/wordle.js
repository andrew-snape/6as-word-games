(() => {
  const MAX_GUESSES = 6;
  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
  ];

  const boardEl = document.getElementById('board');
  const keyboardEl = document.getElementById('keyboard');
  const messageEl = document.getElementById('message');
  const unitNameEl = document.getElementById('unit-name');
  const playAgainBtn = document.getElementById('play-again');
  const statsLineEl = document.getElementById('stats-line');

  const params = new URLSearchParams(window.location.search);
  const unitId = params.get('unit') || 'unit1';

  let words = [];
  let unitName = '';
  let answer = '';
  let wordLength = 5;
  let currentGuess = '';
  let guesses = [];
  let gameOver = false;
  const keyStatus = {};

  const dictionaryCache = {};
  let dictionary = new Set();
  let dictionaryReady = false;

  function loadDictionary(length) {
    dictionaryReady = false;
    if (dictionaryCache[length]) {
      dictionary = dictionaryCache[length];
      dictionaryReady = true;
      return;
    }
    fetch(`dictionary/${length}.json`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        const set = new Set(list);
        dictionaryCache[length] = set;
        dictionary = set;
        dictionaryReady = true;
      })
      .catch(() => {
        dictionary = new Set();
        dictionaryReady = true;
      });
  }

  function isValidWord(guess) {
    return dictionary.has(guess) || words.includes(guess);
  }

  function updateStatsDisplay() {
    if (statsLineEl) statsLineEl.textContent = Stats.summaryText('wordle');
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

  function pickAnswer() {
    return words[Math.floor(Math.random() * words.length)];
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < MAX_GUESSES; r++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;
      row.dataset.row = String(r);
      for (let c = 0; c < wordLength; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.col = String(c);
        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function buildKeyboard() {
    keyboardEl.innerHTML = '';
    for (const rowKeys of KEYBOARD_ROWS) {
      const row = document.createElement('div');
      row.className = 'kb-row';
      for (const key of rowKeys) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'key';
        btn.dataset.key = key;
        if (key === 'ENTER' || key === 'BACK') {
          btn.classList.add('wide');
          btn.textContent = key === 'ENTER' ? 'Enter' : 'Del';
        } else {
          btn.textContent = key;
        }
        btn.addEventListener('click', () => handleKey(key));
        row.appendChild(btn);
      }
      keyboardEl.appendChild(row);
    }
  }

  function resetKeyboardColors() {
    for (const k in keyStatus) delete keyStatus[k];
    keyboardEl.querySelectorAll('.key').forEach((btn) => {
      btn.classList.remove('correct', 'present', 'absent');
    });
  }

  function evaluateGuess(guess) {
    const result = new Array(wordLength).fill('absent');
    const answerLetters = answer.split('');
    const remaining = {};

    for (let i = 0; i < wordLength; i++) {
      if (guess[i] === answerLetters[i]) {
        result[i] = 'correct';
      } else {
        remaining[answerLetters[i]] = (remaining[answerLetters[i]] || 0) + 1;
      }
    }

    for (let i = 0; i < wordLength; i++) {
      if (result[i] === 'correct') continue;
      const letter = guess[i];
      if (remaining[letter] > 0) {
        result[i] = 'present';
        remaining[letter] -= 1;
      }
    }

    return result;
  }

  const STATUS_RANK = { absent: 0, present: 1, correct: 2 };

  function updateKeyboardColors(guess, result) {
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const status = result[i];
      if (!keyStatus[letter] || STATUS_RANK[status] > STATUS_RANK[keyStatus[letter]]) {
        keyStatus[letter] = status;
        const btn = keyboardEl.querySelector(`.key[data-key="${letter}"]`);
        if (btn) {
          btn.classList.remove('correct', 'present', 'absent');
          btn.classList.add(status);
        }
      }
    }
  }

  function renderCurrentGuess() {
    const row = boardEl.querySelector(`.row[data-row="${guesses.length}"]`);
    if (!row) return;
    const tiles = row.querySelectorAll('.tile');
    tiles.forEach((tile, i) => {
      const letter = currentGuess[i] || '';
      tile.textContent = letter;
      tile.classList.toggle('filled', !!letter);
    });
  }

  function submitGuess() {
    if (currentGuess.length !== wordLength) {
      showMessage(`Type ${wordLength} letters`, 1200);
      return;
    }

    if (!dictionaryReady) {
      showMessage('Still loading -- try again in a moment', 1200);
      return;
    }

    if (!isValidWord(currentGuess)) {
      showMessage('Not a real word', 1200);
      return;
    }

    const guess = currentGuess;
    const result = evaluateGuess(guess);
    const row = boardEl.querySelector(`.row[data-row="${guesses.length}"]`);
    const tiles = row.querySelectorAll('.tile');
    tiles.forEach((tile, i) => {
      tile.classList.add(result[i]);
    });
    updateKeyboardColors(guess, result);

    guesses.push(guess);
    currentGuess = '';

    if (guess === answer) {
      gameOver = true;
      showMessage("You got it! Well done!");
      playAgainBtn.style.display = 'inline-block';
      Stats.record('wordle', true);
      updateStatsDisplay();
      return;
    }

    if (guesses.length >= MAX_GUESSES) {
      gameOver = true;
      showMessage(`Out of guesses! The word was ${answer}`);
      playAgainBtn.style.display = 'inline-block';
      Stats.record('wordle', false);
      updateStatsDisplay();
      return;
    }

    renderCurrentGuess();
  }

  function handleKey(key) {
    if (gameOver) return;

    if (key === 'ENTER') {
      submitGuess();
      return;
    }

    if (key === 'BACK') {
      currentGuess = currentGuess.slice(0, -1);
      renderCurrentGuess();
      return;
    }

    if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
      currentGuess += key;
      renderCurrentGuess();
    }
  }

  function startGame() {
    answer = pickAnswer();
    wordLength = answer.length;
    currentGuess = '';
    guesses = [];
    gameOver = false;
    messageEl.textContent = '';
    playAgainBtn.style.display = 'none';
    buildBoard();
    resetKeyboardColors();
    loadDictionary(wordLength);
  }

  document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    const key = e.key.toUpperCase();
    if (key === 'ENTER') {
      handleKey('ENTER');
    } else if (key === 'BACKSPACE') {
      handleKey('BACK');
    } else if (/^[A-Z]$/.test(key)) {
      handleKey(key);
    }
  });

  playAgainBtn.addEventListener('click', startGame);

  fetch(`units/${unitId}.json`)
    .then((res) => {
      if (!res.ok) throw new Error('Unit not found');
      return res.json();
    })
    .then((data) => {
      words = data.words.map((w) => w.toUpperCase());
      unitName = data.unitName || unitId;
      unitNameEl.textContent = unitName;
      buildKeyboard();
      startGame();
      updateStatsDisplay();
    })
    .catch(() => {
      unitNameEl.textContent = '';
      showMessage("Couldn't load this unit. Ask your teacher to check the link.");
    });
})();
