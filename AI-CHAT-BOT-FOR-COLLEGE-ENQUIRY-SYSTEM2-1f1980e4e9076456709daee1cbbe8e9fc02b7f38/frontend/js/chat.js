/* ===== chat.js - Chat Interface ===== */

let chatInitialized = false;

// ── Render a single message ────────────────────────────────────
function renderMessage(message, sender, timestamp) {
  const isUser = sender === 'user';
  const time = timestamp ? timeAgo(timestamp) : 'just now';
  const avatar = isUser ? '👤' : '🤖';

  return `
    <div class="message ${sender}">
      <div class="message-avatar">${avatar}</div>
      <div>
        <div class="message-content">${escapeHtml(message)}</div>
        <div class="message-time">${time}</div>
      </div>
    </div>`;
}

// ── Scroll to bottom of chat ───────────────────────────────────
function scrollToBottom() {
  const messages = document.getElementById('chat-messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}

// ── Show typing indicator ──────────────────────────────────────
function showTyping() {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;
  const div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'message bot';
  div.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  messages.appendChild(div);
  scrollToBottom();
}

function hideTyping() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) indicator.remove();
}

// ── Load chat history ──────────────────────────────────────────
async function loadChatHistory() {
  const messages = document.getElementById('chat-messages');
  if (!messages) return;

  const res = await ChatAPI.getHistory(50);
  if (!res.ok) return;

  const history = res.data.data || [];
  if (history.length === 0) {
    // Show welcome message
    messages.innerHTML = renderMessage(
      "Hello! 👋 Welcome to the College Enquiry System. I'm your virtual assistant. Ask me anything about admissions, courses, fees, or facilities!",
      'bot',
      new Date().toISOString()
    );
  } else {
    messages.innerHTML = history.map(item =>
      renderMessage(item.message, item.sender, item.timestamp)
    ).join('');
  }
  scrollToBottom();
}

// ── Send message ───────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chat-input');
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  const messages = document.getElementById('chat-messages');
  const sendBtn = document.getElementById('send-btn');

  // Add user message to UI
  messages.insertAdjacentHTML('beforeend', renderMessage(message, 'user', new Date().toISOString()));
  input.value = '';
  input.style.height = 'auto';
  if (sendBtn) sendBtn.disabled = true;
  scrollToBottom();

  // Show typing
  showTyping();

  // Send to API
  const res = await ChatAPI.send(message);
  hideTyping();
  if (sendBtn) sendBtn.disabled = false;

  if (res.ok) {
    const botMessage = res.data.data.bot_response;
    messages.insertAdjacentHTML('beforeend', renderMessage(botMessage, 'bot', new Date().toISOString()));
  } else if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  } else {
    messages.insertAdjacentHTML('beforeend', renderMessage(
      'Sorry, something went wrong. Please try again.',
      'bot',
      new Date().toISOString()
    ));
  }
  scrollToBottom();
}

// ── Quick questions ────────────────────────────────────────────
function sendQuickMessage(msg) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = msg;
    sendMessage();
  }
}

// ── Clear chat display ─────────────────────────────────────────
async function clearChat() {
  await ChatAPI.clear();
  const messages = document.getElementById('chat-messages');
  if (messages) {
    messages.innerHTML = renderMessage(
      "Chat cleared. How can I help you?",
      'bot',
      new Date().toISOString()
    );
  }
}

// ── Auto-resize textarea ───────────────────────────────────────
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// ── Init chat page ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const chatPage = document.getElementById('chat-messages');
  if (!chatPage) return;

  // Check auth
  const user = await requireAuth();
  if (!user) return;
  setNavbarUser(user);

  await loadChatHistory();
  chatInitialized = true;

  // Input events
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    input.addEventListener('input', () => autoResize(input));
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (clearBtn) clearBtn.addEventListener('click', clearChat);

  // Quick question buttons
  document.querySelectorAll('.quick-question').forEach(btn => {
    btn.addEventListener('click', () => sendQuickMessage(btn.dataset.question));
  });
});
