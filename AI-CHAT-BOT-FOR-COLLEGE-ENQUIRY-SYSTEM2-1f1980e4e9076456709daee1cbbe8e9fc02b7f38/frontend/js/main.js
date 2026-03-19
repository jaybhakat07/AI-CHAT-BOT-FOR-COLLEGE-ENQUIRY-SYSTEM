/* ===== main.js - Shared utilities ===== */

// ── Alert/Toast ────────────────────────────────────────────────
function showAlert(message, type = 'info', containerId = 'alert-container', duration = 4000) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(div);

  if (duration > 0) {
    setTimeout(() => div.remove(), duration);
  }
  return div;
}

function clearAlerts(containerId = 'alert-container') {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

// ── Escape HTML ────────────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

// ── Form Validation ────────────────────────────────────────────
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  let errorEl = field.nextElementSibling;
  if (!errorEl || !errorEl.classList.contains('form-error')) {
    errorEl = document.createElement('p');
    errorEl.className = 'form-error';
    field.parentNode.insertBefore(errorEl, field.nextSibling);
  }
  errorEl.textContent = message;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove('error');
  const errorEl = field.nextElementSibling;
  if (errorEl && errorEl.classList.contains('form-error')) {
    errorEl.remove();
  }
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => el.remove());
}

// ── Button Loading State ───────────────────────────────────────
function setButtonLoading(btn, loading, text = 'Loading...') {
  if (!btn) return;
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._originalText || text;
  }
}

// ── Format Date ────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(dateStr);
}

// ── Modal ──────────────────────────────────────────────────────
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
  }
});

// ── Pagination ─────────────────────────────────────────────────
// Global registry for pagination callbacks (avoids eval / function.toString())
const _paginationCallbacks = {};

function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Register callback under container ID
  _paginationCallbacks[containerId] = onPageChange;

  function pageBtn(page, label, disabled, active) {
    return `<button class="page-btn${active ? ' active' : ''}" data-pagination="${containerId}" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  }

  let html = pageBtn(currentPage - 1, '&#8249;', currentPage <= 1, false);

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  if (start > 1) {
    html += pageBtn(1, '1', false, false);
    if (start > 2) html += '<span style="padding:0 4px">...</span>';
  }
  for (let i = start; i <= end; i++) {
    html += pageBtn(i, i, false, i === currentPage);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) html += '<span style="padding:0 4px">...</span>';
    html += pageBtn(totalPages, totalPages, false, false);
  }
  html += pageBtn(currentPage + 1, '&#8250;', currentPage >= totalPages, false);

  container.innerHTML = html;
  container.querySelectorAll('[data-pagination]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cb = _paginationCallbacks[btn.dataset.pagination];
      if (cb) cb(Number(btn.dataset.page));
    });
  });
}

// ── Category Badge ─────────────────────────────────────────────
function categoryBadge(category) {
  const colors = { admissions: 'primary', courses: 'success', fees: 'warning', facilities: 'danger' };
  return `<span class="badge badge-${colors[category] || 'primary'}">${escapeHtml(category)}</span>`;
}

// ── Capitalize ─────────────────────────────────────────────────
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Debounce ───────────────────────────────────────────────────
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
