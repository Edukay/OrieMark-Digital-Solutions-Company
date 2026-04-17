// ============================================
// ORIEMARK DIGITAL SOLUTIONS
// js/app.js — Core Application Logic
// ============================================

'use strict';

// ---- STATE ----
const state = {
  currentPage: 'home',
  cart: [],
  wishlist: new Set(),
  shopFilter: 'All',
  shopSearch: '',
  shopSort: 'default',
  chatOpen: false,
  chatMessages: [],
  navScrolled: false,
};

// ---- DOM HELPERS ----
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ============================================
// NAVIGATION
// ============================================
function initNav() {
  const navbar  = $('#navbar');
  const ham     = $('#hamburger');
  const mobileM = $('#mobileMenu');
  const logoBtn = $$('.nav-logo, .logo-nav-trigger');

  // Scroll behavior
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const isHeroPage = state.currentPage === 'home';

    if (y > 40) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('dark-bg');
      $$('.nav-link').forEach(l => l.classList.remove('light-link'));
      $$('.nav-logo').forEach(l => l.classList.remove('light'));
    } else if (isHeroPage) {
      navbar.classList.remove('scrolled');
      navbar.classList.add('dark-bg');
      $$('.nav-link').forEach(l => l.classList.add('light-link'));
      $$('.nav-logo').forEach(l => l.classList.add('light'));
    }
    lastScroll = y;
  }, { passive: true });

  // Hamburger
  ham?.addEventListener('click', () => {
    ham.classList.toggle('open');
    mobileM.classList.toggle('open');
  });

  // Close mobile on link click
  $$('#mobileMenu a').forEach(a => {
    a.addEventListener('click', () => {
      ham?.classList.remove('open');
      mobileM?.classList.remove('open');
    });
  });
}

function setNavActive(page) {
  $$('.nav-link[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
}

function applyNavStyle(page) {
  const navbar = $('#navbar');
  if (page === 'home' && window.scrollY <= 40) {
    navbar.classList.add('dark-bg');
    navbar.classList.remove('scrolled');
    $$('.nav-link').forEach(l => l.classList.add('light-link'));
    $$('.nav-logo').forEach(l => l.classList.add('light'));
  } else {
    navbar.classList.remove('dark-bg');
    navbar.classList.add('scrolled');
    $$('.nav-link').forEach(l => l.classList.remove('light-link'));
    $$('.nav-logo').forEach(l => l.classList.remove('light'));
  }
}

// ============================================
// PAGE ROUTING
// ============================================
function showPage(page) {
  state.currentPage = page;

  // Hide all pages
  $$('.page').forEach(p => p.classList.remove('active'));

  // Show target
  const target = $(`#page-${page}`);
  if (target) target.classList.add('active');

  // Nav state
  setNavActive(page);
  applyNavStyle(page);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger reveals
  setTimeout(() => initReveal(), 100);

  // Close mobile menu
  $('#hamburger')?.classList.remove('open');
  $('#mobileMenu')?.classList.remove('open');

  // Re-initialize shop controls when visiting shop page
  if (page === 'shop') {
    initShopControls();
    renderProducts();
  }
}

// ============================================
// SCROLL REVEAL
// ============================================
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.transitionDelay = `${i * 0.06}s`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  $$('.reveal').forEach(el => {
    el.classList.remove('visible');
    observer.observe(el);
  });
}

// ============================================
// CART
// ============================================
function updateCartUI() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  $$('.cart-count').forEach(el => {
    el.textContent = count;
    el.classList.toggle('visible', count > 0);
  });
}

function addToCart(productId, buttonEl) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    state.cart.push({ ...product, qty: 1 });
  }

  updateCartUI();

  // Button feedback
  if (buttonEl) {
    buttonEl.classList.add('added');
    buttonEl.textContent = '✓';
    setTimeout(() => {
      buttonEl.classList.remove('added');
      buttonEl.textContent = '+';
    }, 1400);
  }

  showToast(`${product.name} added to cart 🛒`);
}

function toggleWishlist(productId, btnEl) {
  if (state.wishlist.has(productId)) {
    state.wishlist.delete(productId);
    btnEl?.classList.remove('active');
    btnEl && (btnEl.textContent = '♡');
  } else {
    state.wishlist.add(productId);
    btnEl?.classList.add('active');
    btnEl && (btnEl.textContent = '♥');
    showToast('Added to wishlist ❤️');
  }
}

// ============================================
// TOAST
// ============================================
function showToast(message) {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================
// SHOP — PRODUCTS RENDER
// ============================================
function renderProducts() {
  const grid = $('#productsGrid');
  if (!grid) return;

  let items = PRODUCTS.slice();

  // Filter by category
  if (state.shopFilter !== 'All') {
    items = items.filter(p => p.category === state.shopFilter);
  }

  // Filter by search
  if (state.shopSearch.trim()) {
    const q = state.shopSearch.toLowerCase();
    items = items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort
  if (state.shopSort === 'price-asc')  items.sort((a, b) => a.price - b.price);
  if (state.shopSort === 'price-desc') items.sort((a, b) => b.price - a.price);
  if (state.shopSort === 'rating')     items.sort((a, b) => b.rating - a.rating);
  if (state.shopSort === 'name')       items.sort((a, b) => a.name.localeCompare(b.name));

  // Update count
  const countEl = $('#shopCount');
  if (countEl) countEl.textContent = `${items.length} product${items.length !== 1 ? 's' : ''} found`;

  // Render
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">📦</div>
        <h3>No products found</h3>
        <p>Try a different search term or category filter.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(product => buildProductCard(product)).join('');

  // Bind events
  $$('.add-to-cart', grid).forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(+btn.dataset.id, btn);
    });
  });

  $$('.wishlist-btn', grid).forEach(btn => {
    if (state.wishlist.has(+btn.dataset.id)) {
      btn.classList.add('active');
      btn.textContent = '♥';
    }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(+btn.dataset.id, btn);
    });
  });
}

function buildProductCard(p) {
  const stars = buildStars(p.rating);
  const oldPrice = p.oldPrice
    ? `<span class="p-old">₦${p.oldPrice.toLocaleString()}</span>`
    : '';
  const badge = p.badge
    ? `<div class="p-badge ${p.badge}">${p.badge === 'new' ? 'New' : p.badge === 'hot' ? '🔥 Hot' : 'Sale'}</div>`
    : '';
  const stockOverlay = !p.inStock
    ? `<div style="position:absolute;inset:0;background:rgba(255,255,255,0.65);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#6b85ae;letter-spacing:.05em">OUT OF STOCK</div>`
    : '';

  return `
    <div class="product-card card-fade-in">
      <div class="product-img">
        ${badge}
        <button class="wishlist-btn" data-id="${p.id}">♡</button>
        ${p.Image || p.emoji || ''}
        ${stockOverlay}
      </div>
      <div class="product-info">
        <div class="p-category">${p.category}</div>
        <div class="p-name">${p.name}</div>
        <div class="p-rating">
          <span class="stars">${stars}</span>
          <span class="p-rating-num">${p.rating} (${p.reviews})</span>
        </div>
        <div class="p-price-row">
          <div class="p-prices">
            <span class="p-price">₦${p.price.toLocaleString()}</span>
            ${oldPrice}
          </div>
          <button class="add-to-cart" data-id="${p.id}" ${!p.inStock ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''}>+</button>
        </div>
      </div>
    </div>`;
}

function buildStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function initShopControls() {
  // Search
  const searchInput = $('#shopSearch');
  searchInput?.addEventListener('input', (e) => {
    state.shopSearch = e.target.value;
    renderProducts();
  });

  // Category chips
  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.shopFilter = chip.dataset.cat;
      $$('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
  });

  // Sort
  const sortSel = $('#shopSort');
  sortSel?.addEventListener('change', (e) => {
    state.shopSort = e.target.value;
    renderProducts();
  });
}

// ============================================
// CHATBOT — AI-POWERED (Claude API)
// ============================================
const CHAT_SYSTEM_PROMPT = `You are Ori, the friendly and knowledgeable AI assistant for OrieMark Digital Solutions — a Nigerian digital agency and smart gadget retailer.

OrieMark services:
- Web Development (from ₦150,000)
- Mobile App Development
- Product & Graphics Design
- Online Advertising through Google and Meta (Facebook/Instagram)
- Sales of Smart Gadgets (phones, smartwatches, audio, laptops, accessories)

Personality: Warm, professional, concise. Use Nigerian-friendly language where appropriate. Always end with a helpful next step.

Key info:
- Phone/WhatsApp: +234 813 401 8159
- Email: oriemark32@gmail.com
- Instagram: @Orie_mark
- Facebook: OrieMark
- Working hours: Mon–Fri, 9am–6pm WAT

For product questions, mention that prices are in Nigerian Naira (₦) and delivery is available nationwide.
Keep responses under 3 sentences unless asked for detail. Be helpful and conversion-focused.`;

async function callClaudeAPI(userMessage, conversationHistory) {
  const messages = conversationHistory.map(m => ({
    role: m.role,
    content: m.content
  }));
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: CHAT_SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      return data.content[0].text;
    }
    return "I'm having trouble connecting right now. Please contact us at oriemark32@gmail.com 📧";
  } catch (err) {
    return "I'm having trouble connecting right now. Please reach us at oriemark32@gmail.com or WhatsApp +234 813 401 8159 📞";
  }
}

function initChatbot() {
  const launcher    = $('#chatLauncher');
  const chatWindow  = $('#chatWindow');
  const chatClose   = $('#chatClose');
  const chatInput   = $('#chatInput');
  const chatSend    = $('#chatSend');
  const chatBody    = $('#chatBody');
  const quickReplies = $('#quickReplies');

  if (!launcher) return;

  // Toggle
  launcher.addEventListener('click', () => {
    state.chatOpen = !state.chatOpen;
    chatWindow.classList.toggle('hidden', !state.chatOpen);
    launcher.classList.toggle('open', state.chatOpen);
    launcher.innerHTML = state.chatOpen ? '✕' : getChatIcon();
    if (state.chatOpen) {
      setTimeout(() => chatInput?.focus(), 300);
      quickReplies.style.display = 'flex';
    }
  });

  chatClose?.addEventListener('click', () => {
    state.chatOpen = false;
    chatWindow.classList.add('hidden');
    launcher.classList.remove('open');
    launcher.innerHTML = getChatIcon();
  });

  // Send
  chatSend?.addEventListener('click', sendMessage);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Quick replies
  $$('.quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.trim();
      quickReplies.style.display = 'none';
      sendMessageText(text);
    });
  });

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    quickReplies.style.display = 'none';
    await sendMessageText(text);
  }

  async function sendMessageText(text) {
    appendMsg('user', text);
    state.chatMessages.push({ role: 'user', content: text });

    // Typing indicator
    const typingEl = appendTyping();

    const reply = await callClaudeAPI(text, state.chatMessages.slice(0, -1));
    typingEl.remove();

    appendMsg('bot', reply);
    state.chatMessages.push({ role: 'assistant', content: reply });
  }

  function appendMsg(role, text) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }
}

function getChatIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initShopControls();
  initChatbot();
  renderProducts();
  initReveal();

  // Wire all nav data-page links
  $$('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(el.dataset.page);
    });
  });

  // Initial nav style for home
  applyNavStyle('home');
  setNavActive('home');

  // Trigger hero animation
  setTimeout(() => initReveal(), 200);
});
