// Populates a <select id="unit-picker"> from this game's units/index.json manifest
// and navigates to the chosen unit on change. Expects to run from a game's own
// index.html, so "units/index.json" resolves relative to that page.
(() => {
  const selectEl = document.getElementById('unit-picker');
  if (!selectEl) return;

  const params = new URLSearchParams(window.location.search);
  const currentUnit = params.get('unit') || 'unit1';

  fetch('units/index.json')
    .then((res) => {
      if (!res.ok) throw new Error('manifest not found');
      return res.json();
    })
    .then((data) => {
      selectEl.innerHTML = '';
      for (const unit of data.units) {
        const opt = document.createElement('option');
        opt.value = unit.id;
        opt.textContent = unit.name;
        if (unit.id === currentUnit) opt.selected = true;
        selectEl.appendChild(opt);
      }
    })
    .catch(() => {
      selectEl.innerHTML = '<option>Couldn\'t load units</option>';
    });

  selectEl.addEventListener('change', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('unit', selectEl.value);
    window.location.href = url.toString();
  });
})();
