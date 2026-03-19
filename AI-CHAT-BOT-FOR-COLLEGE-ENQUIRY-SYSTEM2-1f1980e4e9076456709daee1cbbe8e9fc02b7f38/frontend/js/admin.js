/* ===== admin.js - Admin Panel Functionality ===== */

// ── Require admin auth ─────────────────────────────────────────
async function requireAdminAuth() {
  const res = await AdminAPI.check();
  if (!res.ok) {
    window.location.href = 'admin_login.html';
    return null;
  }
  return res.data.data;
}

// ── Admin Login ────────────────────────────────────────────────
async function handleAdminLogin(e) {
  e.preventDefault();
  clearAlerts();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('Email and password are required', 'error');
    return;
  }

  const btn = document.getElementById('admin-login-btn');
  setButtonLoading(btn, true, 'Logging in...');

  const res = await AdminAPI.login({ email, password });
  setButtonLoading(btn, false, 'Admin Login');

  if (res.ok) {
    showAlert('Login successful!', 'success');
    setTimeout(() => { window.location.href = 'admin_dashboard.html'; }, 1000);
  } else {
    showAlert(res.data.message || 'Login failed', 'error');
  }
}

// ── Admin Logout ───────────────────────────────────────────────
async function handleAdminLogout() {
  await AdminAPI.logout();
  window.location.href = 'admin_login.html';
}

// ── Load Dashboard Stats ───────────────────────────────────────
async function loadDashboardStats() {
  const res = await AdminAPI.getDashboard();
  if (!res.ok) return;

  const stats = res.data.data;
  const els = {
    'stat-users': stats.total_users,
    'stat-inquiries': stats.total_inquiries,
    'stat-pending': stats.pending_inquiries,
    'stat-resolved': stats.resolved_inquiries,
    'stat-faqs': stats.total_faqs,
    'stat-chats': stats.total_chats,
  };
  for (const [id, val] of Object.entries(els)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

// ── FAQ Management ─────────────────────────────────────────────
let faqPage = 1;

async function loadAdminFAQs(page = 1) {
  faqPage = page;
  const tbody = document.getElementById('faq-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="loading-overlay"><span class="spinner"></span> Loading...</td></tr>';

  const res = await AdminAPI.getFaqs(page);
  if (!res.ok) {
    tbody.innerHTML = '<tr><td colspan="5">Failed to load FAQs</td></tr>';
    return;
  }

  const { data: faqs, pagination } = res.data.data;

  if (faqs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">No FAQs found</td></tr>';
  } else {
    tbody.innerHTML = faqs.map(faq => `
      <tr>
        <td data-label="ID">${faq.faq_id}</td>
        <td data-label="Category">${categoryBadge(faq.category)}</td>
        <td data-label="Question">${escapeHtml(faq.question)}</td>
        <td data-label="Updated">${formatDate(faq.updated_at)}</td>
        <td data-label="Actions">
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="openEditFAQ(${faq.faq_id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteFAQ(${faq.faq_id})">Delete</button>
          </div>
        </td>
      </tr>`).join('');
  }

  if (pagination) {
    renderPagination('faq-pagination', pagination.page, pagination.pages,
      (p) => loadAdminFAQs(p));
  }
}

async function openEditFAQ(faqId) {
  const res = await FAQAPI.getById(faqId);
  if (!res.ok) { showAlert('Failed to load FAQ', 'error'); return; }

  const faq = res.data.data;
  document.getElementById('faq-id').value = faq.faq_id;
  document.getElementById('faq-category').value = faq.category;
  document.getElementById('faq-question').value = faq.question;
  document.getElementById('faq-answer').value = faq.answer;
  document.getElementById('faq-keywords').value = faq.keywords || '';
  document.getElementById('faq-modal-title').textContent = 'Edit FAQ';
  openModal('faq-modal');
}

function openCreateFAQ() {
  const form = document.getElementById('faq-form');
  if (form) form.reset();
  const idEl = document.getElementById('faq-id');
  if (idEl) idEl.value = '';
  const titleEl = document.getElementById('faq-modal-title');
  if (titleEl) titleEl.textContent = 'Create FAQ';
  openModal('faq-modal');
}

async function saveFAQ(e) {
  e.preventDefault();
  const faqId = document.getElementById('faq-id').value;
  const payload = {
    category: document.getElementById('faq-category').value,
    question: document.getElementById('faq-question').value.trim(),
    answer: document.getElementById('faq-answer').value.trim(),
    keywords: document.getElementById('faq-keywords').value.trim(),
  };

  if (!payload.question || !payload.answer) {
    showAlert('Question and answer are required', 'error');
    return;
  }

  const btn = document.getElementById('save-faq-btn');
  setButtonLoading(btn, true, 'Saving...');

  const res = faqId ? await AdminAPI.updateFaq(faqId, payload) : await AdminAPI.createFaq(payload);
  setButtonLoading(btn, false, 'Save');

  if (res.ok) {
    showAlert(faqId ? 'FAQ updated!' : 'FAQ created!', 'success');
    closeModal('faq-modal');
    loadAdminFAQs(faqPage);
  } else {
    showAlert(res.data.message || 'Save failed', 'error');
  }
}

async function deleteFAQ(faqId) {
  if (!confirm('Are you sure you want to delete this FAQ?')) return;
  const res = await AdminAPI.deleteFaq(faqId);
  if (res.ok) {
    showAlert('FAQ deleted', 'success');
    loadAdminFAQs(faqPage);
  } else {
    showAlert('Delete failed', 'error');
  }
}

// ── Inquiry Management ─────────────────────────────────────────
let inquiryPage = 1;

async function loadAdminInquiries(page = 1) {
  inquiryPage = page;
  const tbody = document.getElementById('inquiry-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="loading-overlay"><span class="spinner"></span> Loading...</td></tr>';

  const res = await AdminAPI.getInquiries(page);
  if (!res.ok) {
    tbody.innerHTML = '<tr><td colspan="7">Failed to load inquiries</td></tr>';
    return;
  }

  const { data: inquiries, pagination } = res.data.data;

  if (inquiries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-500)">No inquiries found</td></tr>';
  } else {
    tbody.innerHTML = inquiries.map(inq => `
      <tr>
        <td data-label="ID">${inq.inquiry_id}</td>
        <td data-label="Student">${escapeHtml(inq.full_name)}<br><small style="color:var(--gray-500)">${escapeHtml(inq.email)}</small></td>
        <td data-label="Category">${categoryBadge(inq.category)}</td>
        <td data-label="Subject">${escapeHtml(inq.subject)}</td>
        <td data-label="Status"><span class="status-${inq.status}">${capitalize(inq.status)}</span></td>
        <td data-label="Date">${formatDate(inq.created_at)}</td>
        <td data-label="Actions">
          <button class="btn btn-sm btn-outline" onclick="openReplyModal(${inq.inquiry_id})">Reply</button>
        </td>
      </tr>`).join('');
  }

  if (pagination) {
    renderPagination('inquiry-pagination', pagination.page, pagination.pages,
      (p) => loadAdminInquiries(p));
  }
}

async function openReplyModal(inquiryId) {
  const res = await AdminAPI.getInquiries();  // get from list (simplification)
  // Fetch individual inquiry details from the list data
  const allRes = await AdminAPI.getInquiries(1);
  const inquiries = allRes.ok ? allRes.data.data.data : [];
  const inq = inquiries.find(i => i.inquiry_id === inquiryId);

  if (!inq) {
    showAlert('Inquiry not found', 'error');
    return;
  }

  document.getElementById('reply-inquiry-id').value = inq.inquiry_id;
  document.getElementById('reply-subject').textContent = inq.subject;
  document.getElementById('reply-message').textContent = inq.message;
  document.getElementById('reply-status').value = inq.status;
  document.getElementById('reply-text').value = inq.admin_reply || '';
  openModal('reply-modal');
}

async function saveReply(e) {
  e.preventDefault();
  const inquiryId = document.getElementById('reply-inquiry-id').value;
  const status = document.getElementById('reply-status').value;
  const admin_reply = document.getElementById('reply-text').value.trim();

  const btn = document.getElementById('save-reply-btn');
  setButtonLoading(btn, true, 'Saving...');

  const res = await AdminAPI.updateInquiry(inquiryId, { status, admin_reply });
  setButtonLoading(btn, false, 'Save Reply');

  if (res.ok) {
    showAlert('Reply saved!', 'success');
    closeModal('reply-modal');
    loadAdminInquiries(inquiryPage);
  } else {
    showAlert(res.data.message || 'Save failed', 'error');
  }
}

// ── Users ──────────────────────────────────────────────────────
let userPage = 1;

async function loadUsers(page = 1) {
  userPage = page;
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="loading-overlay"><span class="spinner"></span> Loading...</td></tr>';
  const res = await AdminAPI.getUsers(page);
  if (!res.ok) { tbody.innerHTML = '<tr><td colspan="5">Failed to load users</td></tr>'; return; }

  const { data: users, pagination } = res.data.data;
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">No users found</td></tr>';
  } else {
    tbody.innerHTML = users.map(u => `
      <tr>
        <td data-label="ID">${u.user_id}</td>
        <td data-label="Name">${escapeHtml(u.full_name)}</td>
        <td data-label="Email">${escapeHtml(u.email)}</td>
        <td data-label="Phone">${escapeHtml(u.phone || 'N/A')}</td>
        <td data-label="Joined">${formatDate(u.created_at)}</td>
      </tr>`).join('');
  }
  if (pagination) renderPagination('users-pagination', pagination.page, pagination.pages, (p) => loadUsers(p));
}

// ── Responses Management ───────────────────────────────────────
let _responsesCache = {};

async function loadResponses() {
  const container = document.getElementById('responses-list');
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading...</div>';
  const res = await AdminAPI.getResponses();
  if (!res.ok) { container.innerHTML = '<p>Failed to load responses</p>'; return; }

  const responses = res.data.data;
  // Store in cache for safe access by ID
  _responsesCache = {};
  responses.forEach(r => { _responsesCache[r.response_id] = r; });

  if (responses.length === 0) {
    container.innerHTML = '<p style="color:var(--gray-500);text-align:center">No custom responses found</p>';
    return;
  }

  container.innerHTML = responses.map(r => `
    <div class="card" style="margin-bottom:0.75rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">
        <div>
          <span class="badge badge-primary">${escapeHtml(r.query_type)}</span>
          <p style="margin-top:0.5rem;font-size:0.9rem">${escapeHtml(r.bot_response)}</p>
          <small style="color:var(--gray-500)">${formatDate(r.created_at)}</small>
        </div>
        <div class="table-actions">
          <button class="btn btn-sm btn-outline" data-action="edit-response" data-id="${r.response_id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-action="delete-response" data-id="${r.response_id}">Delete</button>
        </div>
      </div>
    </div>`).join('');

  // Attach event listeners using delegation on the container
  container.querySelectorAll('[data-action="edit-response"]').forEach(btn => {
    btn.addEventListener('click', () => openEditResponse(Number(btn.dataset.id)));
  });
  container.querySelectorAll('[data-action="delete-response"]').forEach(btn => {
    btn.addEventListener('click', () => deleteResponse(Number(btn.dataset.id)));
  });
}

function openCreateResponse() {
  document.getElementById('response-id').value = '';
  document.getElementById('response-query-type').value = '';
  document.getElementById('response-text').value = '';
  document.getElementById('response-modal-title').textContent = 'Add Response';
  openModal('response-modal');
}

function openEditResponse(id) {
  const r = _responsesCache[id];
  if (!r) { showAlert('Response data not found', 'error'); return; }
  document.getElementById('response-id').value = r.response_id;
  document.getElementById('response-query-type').value = r.query_type;
  document.getElementById('response-text').value = r.bot_response;
  document.getElementById('response-modal-title').textContent = 'Edit Response';
  openModal('response-modal');
}

async function saveResponse(e) {
  e.preventDefault();
  const id = document.getElementById('response-id').value;
  const payload = {
    query_type: document.getElementById('response-query-type').value.trim(),
    bot_response: document.getElementById('response-text').value.trim(),
  };

  if (!payload.query_type || !payload.bot_response) {
    showAlert('All fields are required', 'error');
    return;
  }

  const btn = document.getElementById('save-response-btn');
  setButtonLoading(btn, true, 'Saving...');

  const res = id ? await AdminAPI.updateResponse(id, payload) : await AdminAPI.createResponse(payload);
  setButtonLoading(btn, false, 'Save');

  if (res.ok) {
    showAlert(id ? 'Response updated!' : 'Response created!', 'success');
    closeModal('response-modal');
    loadResponses();
  } else {
    showAlert(res.data.message || 'Save failed', 'error');
  }
}

async function deleteResponse(id) {
  if (!confirm('Delete this response?')) return;
  const res = await AdminAPI.deleteResponse(id);
  if (res.ok) {
    showAlert('Response deleted', 'success');
    loadResponses();
  } else {
    showAlert('Delete failed', 'error');
  }
}

// ── Tabs ───────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = document.getElementById(tabId);
      if (content) content.classList.add('active');

      // Load data for active tab
      if (tabId === 'tab-faqs') loadAdminFAQs();
      if (tabId === 'tab-inquiries') loadAdminInquiries();
      if (tabId === 'tab-users') loadUsers();
      if (tabId === 'tab-responses') loadResponses();
    });
  });
}

// ── Init Admin Dashboard ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Admin login page
  const adminLoginForm = document.getElementById('admin-login-form');
  if (adminLoginForm) {
    // Check if already logged in
    const res = await AdminAPI.check();
    if (res.ok) window.location.href = 'admin_dashboard.html';
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    return;
  }

  // Admin dashboard page
  const adminDashboard = document.getElementById('admin-dashboard');
  if (!adminDashboard) return;

  const admin = await requireAdminAuth();
  if (!admin) return;

  // Set admin name
  const adminNameEl = document.getElementById('admin-name');
  if (adminNameEl) adminNameEl.textContent = admin.full_name;

  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleAdminLogout);

  // Load stats
  await loadDashboardStats();

  // Init tabs
  initTabs();

  // Load default tab content
  loadAdminFAQs();
  loadAdminInquiries();

  // FAQ form
  const faqForm = document.getElementById('faq-form');
  if (faqForm) faqForm.addEventListener('submit', saveFAQ);

  // Reply form
  const replyForm = document.getElementById('reply-form');
  if (replyForm) replyForm.addEventListener('submit', saveReply);

  // Response form
  const responseForm = document.getElementById('response-form');
  if (responseForm) responseForm.addEventListener('submit', saveResponse);
});
