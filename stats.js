// Shared per-device streak tracker (localStorage-backed, no login/account).
// Usage: Stats.record('wordle', true/false) at the end of a game, Stats.get('wordle') to read.
const Stats = (() => {
  const KEY = 'wordgames-stats-v1';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) -- stats just won't persist
    }
  }

  function record(gameKey, won) {
    const data = load();
    const g = data[gameKey] || { played: 0, won: 0, streak: 0, bestStreak: 0 };
    g.played += 1;
    if (won) {
      g.won += 1;
      g.streak += 1;
      g.bestStreak = Math.max(g.bestStreak, g.streak);
    } else {
      g.streak = 0;
    }
    data[gameKey] = g;
    save(data);
    return g;
  }

  function get(gameKey) {
    const data = load();
    return data[gameKey] || { played: 0, won: 0, streak: 0, bestStreak: 0 };
  }

  function summaryText(gameKey) {
    const s = get(gameKey);
    if (s.played === 0) return 'Play a round to start your streak!';
    return `Played: ${s.played} · Streak: ${s.streak} · Best: ${s.bestStreak}`;
  }

  return { record, get, summaryText };
})();
