(() => {
  const KEY = 'wordgames-theme';
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function getStored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function setStored(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) -- toggle still works for this page load
    }
  }

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function currentTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function updateButton() {
    btn.textContent = currentTheme() === 'dark' ? '☀️' : '🌙';
  }

  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setStored(next);
    updateButton();
  });

  updateButton();
})();
