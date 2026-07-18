(function () {
  const root = document.querySelector('.checkout');
  const publicId = root.dataset.publicId;
  const statusEl = document.getElementById('status');
  const statusLabel = document.getElementById('status-label');
  const confirmationsEl = document.getElementById('confirmations');

  const TERMINAL_STATUSES = ['confirmed', 'expired', 'cancelled'];
  const POLL_INTERVAL_MS = 8000;

  async function poll() {
    try {
      const res = await fetch(`/i/${publicId}/status`);
      if (res.ok) {
        const data = await res.json();
        statusEl.dataset.status = data.status;
        statusLabel.textContent = `Status: ${data.status}`;
        confirmationsEl.textContent = `${data.confirmations} / ${data.confirmationsRequired} confirmations`;

        if (TERMINAL_STATUSES.includes(data.status)) {
          return;
        }
      }
    } catch {
      // network hiccup, just retry next tick
    }
    setTimeout(poll, POLL_INTERVAL_MS);
  }

  function bindCopy(buttonId, textId) {
    const btn = document.getElementById(buttonId);
    const el = document.getElementById(textId);
    if (!btn || !el) return;
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(el.textContent.trim());
      const original = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = original), 1500);
    });
  }

  bindCopy('copy-address', 'address');
  bindCopy('copy-amount', 'amount');

  poll();
})();
