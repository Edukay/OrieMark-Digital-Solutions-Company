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
  discount: 0,
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

function goToCheckout() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty! Add some products first.');
    showPage('shop');
    return;
  }
  showPage('checkout');
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

  // Product card click to open modal
  $$('.product-card', grid).forEach(card => {
    card.addEventListener('click', () => {
      const productId = +card.dataset.id;
      openProductModal(productId);
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
    <div class="product-card card-fade-in" data-id="${p.id}">
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
// PRODUCT MODAL
// ============================================
function initProductModal() {
  const modal = $('#productModal');
  const overlay = $('#modalOverlay');
  const closeBtn = $('#modalClose');
  const addToCartBtn = $('#modalAddToCart');
  const wishlistBtn = $('#modalWishlist');

  if (!modal) return;

  // Close handlers
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Add to cart from modal
  addToCartBtn?.addEventListener('click', () => {
    const productId = +addToCartBtn.dataset.id;
    addToCart(productId, addToCartBtn);
  });

  // Wishlist from modal
  wishlistBtn?.addEventListener('click', () => {
    const productId = +wishlistBtn.dataset.id;
    toggleWishlist(productId, wishlistBtn);
  });
}

function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modal = $('#productModal');
  if (!modal) return;

  // Populate modal content
  const modalImage = $('#modalImage');
  const modalCategory = $('#modalCategory');
  const modalName = $('#modalProductName');
  const modalRating = $('#modalRating');
  const modalPrice = $('#modalPrice');
  const modalTags = $('#modalTags');
  const modalDescription = $('#modalDescription');
  const modalSpecs = $('#modalSpecs');
  const addToCartBtn = $('#modalAddToCart');
  const wishlistBtn = $('#modalWishlist');

  // Image
  if (product.Image) {
    modalImage.innerHTML = product.Image;
  } else if (product.emoji) {
    modalImage.innerHTML = `<span class="emoji">${product.emoji}</span>`;
  }

  // Basic info
  modalCategory.textContent = product.category;
  modalName.textContent = product.name;

  // Rating
  const stars = buildStars(product.rating);
  modalRating.innerHTML = `<span class="stars">${stars}</span> <span>${product.rating} (${product.reviews} reviews)</span>`;

  // Price
  const oldPrice = product.oldPrice ? `<span class="old">₦${product.oldPrice.toLocaleString()}</span>` : '';
  modalPrice.innerHTML = `<span class="current">₦${product.price.toLocaleString()}</span>${oldPrice}`;

  // Tags
  modalTags.innerHTML = product.tags.map(tag => `<span>${tag}</span>`).join('');

  // Description
  modalDescription.textContent = product.description;

  // Specifications
  if (product.specs) {
    const specsHtml = buildSpecsHTML(product.specs);
    modalSpecs.innerHTML = specsHtml;
  } else {
    modalSpecs.innerHTML = '';
  }

  // Update button states
  addToCartBtn.dataset.id = product.id;
  addToCartBtn.disabled = !product.inStock;
  addToCartBtn.textContent = product.inStock ? 'Add to Cart' : 'Out of Stock';
  addToCartBtn.style.opacity = product.inStock ? '1' : '0.4';
  addToCartBtn.style.cursor = product.inStock ? 'pointer' : 'not-allowed';

  wishlistBtn.dataset.id = product.id;
  if (state.wishlist.has(product.id)) {
    wishlistBtn.classList.add('active');
    wishlistBtn.textContent = '♥';
  } else {
    wishlistBtn.classList.remove('active');
    wishlistBtn.textContent = '♡';
  }

  // Show modal
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = $('#productModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function buildSpecsHTML(specs) {
  let html = '<h4>Specifications</h4><div class="product-modal-specs-grid">';
  
  for (const [key, value] of Object.entries(specs)) {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    if (Array.isArray(value)) {
      html += `
        <div class="spec-item">
          <span class="spec-label">${label}</span>
          <span class="spec-value">${value.join(', ')}</span>
        </div>`;
    } else {
      html += `
        <div class="spec-item">
          <span class="spec-label">${label}</span>
          <span class="spec-value">${value}</span>
        </div>`;
    }
  }
  
  html += '</div>';
  return html;
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
  initProductModal();
  initChatbot();
  initAuth();
  initCheckout();
  renderProducts();
  initReveal();

  // Wire all nav data-page links
  $$('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(el.dataset.page);
    });
  });

// ============================================
// AUTH — Sign In / Sign Up
// ============================================
function initAuth() {
  const authBtn     = $('#authBtn');
  const authModal   = $('#authModal');
  const authBackdrop = $('#authBackdrop');
  const authClose   = $('#authClose');
  const authTabs    = $$('.auth-tab');
  const authForms   = $$('.auth-form');
  const switchBtns  = $$('.auth-link-btn');
  const signinForm = $('#signinForm');
  const signupForm  = $('#signupForm');
  const authSuccess = $('#authSuccess');
  const successClose = $('#authSuccessClose');

  if (!authModal) return;

  // Open modal
  authBtn?.addEventListener('click', () => {
    authModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('#signinEmail')?.focus();
  });

  // Close modal
  const closeAuth = () => {
    authModal.classList.remove('open');
    document.body.style.overflow = '';
    // Reset form
    setTimeout(() => {
      switchAuthTab('signin');
      signinForm?.reset();
      signupForm?.reset();
    }, 300);
  };

  authClose?.addEventListener('click', closeAuth);
  authBackdrop?.addEventListener('click', closeAuth);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal.classList.contains('open')) {
      closeAuth();
    }
  });

  // Tab switching
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchAuthTab(tab.dataset.tab);
    });
  });

  function switchAuthTab(tab) {
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    authForms.forEach(f => f.classList.toggle('active', f.id === `${tab}Form`));
  }

  // Switch via buttons
  switchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchAuthTab(btn.dataset.switch);
    });
  });

  // Sign In
  signinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#signinEmail').value.trim();
    const password = $('#signinPassword').value;

    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    // Simulate sign in (replace with real API)
    const users = JSON.parse(localStorage.getItem('oriemark_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Save session
      localStorage.setItem('oriemark_session', JSON.stringify({
        name: user.name,
        email: user.email,
        loggedIn: true
      }));
      updateAuthUI(true, user.name);
      closeAuth();
      alert(`Welcome back, ${user.name}!`);
    } else {
      alert('Invalid email or password. Please sign up if you don\'t have an account.');
    }
  });

  // Sign Up
  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim();
    const phone = $('#signupPhone').value.trim();
    const password = $('#signupPassword').value;
    const confirm = $('#signupConfirm').value;
    const newsletter = signupForm.querySelector('[name="newsletter"]')?.checked;

    if (!name || !email || !password) {
      alert('Please fill in all required fields');
      return;
    }

    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem('oriemark_users') || '[]');

    // Check if email exists
    if (users.find(u => u.email === email)) {
      alert('An account with this email already exists. Please sign in.');
      switchAuthTab('signin');
      return;
    }

    // Add new user
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone: phone || '',
      password,
      newsletter: newsletter || false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('oriemark_users', JSON.stringify(users));

    // Auto sign in
    localStorage.setItem('oriemark_session', JSON.stringify({
      name: newUser.name,
      email: newUser.email,
      loggedIn: true
    }));

    // Show success
    authForms.forEach(f => f.classList.remove('active'));
    authSuccess.classList.add('active');
    $('#successMessage').textContent = `Thanks for signing up, ${name}! We\'ll keep you updated on our services and promotions.`;
  });

  // Success close
  successClose?.addEventListener('click', () => {
    authSuccess.classList.remove('active');
    updateAuthUI(true, JSON.parse(localStorage.getItem('oriemark_session') || '{}').name);
    closeAuth();
  });

  // Check existing session
  const session = JSON.parse(localStorage.getItem('oriemark_session') || '{}');
  if (session.loggedIn) {
    updateAuthUI(true, session.name);
  }
}

function updateAuthUI(loggedIn, name = '') {
  const authBtn = $('#authBtn');
  if (!authBtn) return;

  if (loggedIn) {
    authBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <span>${name || 'Account'}</span>
    `;
    authBtn.title = 'Click to sign out';
    
    // Add click to sign out
    authBtn.onclick = () => {
      if (confirm('Sign out of your account?')) {
        localStorage.removeItem('oriemark_session');
        updateAuthUI(false);
      }
    };
  } else {
    authBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <span>Sign In</span>
    `;
    authBtn.title = 'Sign in or sign up';
    authBtn.onclick = null;
  }
}

// ============================================
// CHECKOUT
// ============================================
function initCheckout() {
  const paymentOptions = $$('.payment-option');
  const cardDetails = $('#cardDetails');
  const transferDetails = $('#transferDetails');
  const ussdDetails = $('#ussdDetails');
  const placeOrderBtn = $('#placeOrderBtn');
  const promoBtn = $('#applyPromo');
  const promoInput = $('#promoCode');
  const promoMessage = $('#promoMessage');

  if (!placeOrderBtn) return;

  // Payment method switching
  paymentOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      paymentOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      
      const method = opt.dataset.method;
      cardDetails?.classList.toggle('hidden', method !== 'card');
      transferDetails?.classList.toggle('hidden', method !== 'transfer');
      ussdDetails?.classList.toggle('hidden', method !== 'ussd');
    });
  });

  // Update checkout summary
  updateCheckoutSummary();

  // Promo code
  promoBtn?.addEventListener('click', () => {
    const code = promoInput?.value.trim().toUpperCase();
    if (code === 'ORIE10') {
      promoMessage.textContent = '✓ Promo code applied! 10% off your order';
      promoMessage.className = 'promo-message success';
      state.discount = 0.10;
    } else if (code === 'FIRST20') {
      promoMessage.textContent = '✓ First order discount! 20% off your order';
      promoMessage.className = 'promo-message success';
      state.discount = 0.20;
    } else if (code) {
      promoMessage.textContent = '✕ Invalid promo code';
      promoMessage.className = 'promo-message error';
      state.discount = 0;
    }
    updateCheckoutSummary();
  });

  // Place order
  placeOrderBtn?.addEventListener('click', () => {
    // Validate form
    const firstName = $('#checkoutFirstName')?.value.trim();
    const lastName = $('#checkoutLastName')?.value.trim();
    const email = $('#checkoutEmail')?.value.trim();
    const phone = $('#checkoutPhone')?.value.trim();
    const address = $('#checkoutAddress')?.value.trim();
    const city = $('#checkoutCity')?.value.trim();
    const state = $('#checkoutState')?.value;
    const paymentMethod = $$('.payment-option.active')[0]?.dataset.method || 'card';

    if (!firstName || !lastName || !email || !phone || !address || !city || !state) {
      alert('Please fill in all required fields');
      return;
    }

    if (state.cart.length === 0) {
      alert('Your cart is empty. Add some products first!');
      showPage('shop');
      return;
    }

    // Calculate totals
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = calculateShipping(state);
    const tax = (subtotal * 0.075);
    const discount = state.discount ? subtotal * state.discount : 0;
    const total = subtotal + shipping + tax - discount;

    // Create order
    const order = {
      id: 'ORD-' + Date.now(),
      date: new Date().toISOString(),
      customer: { firstName, lastName, email, phone, address, city, state },
      items: state.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty
      })),
      subtotal,
      shipping,
      tax,
      discount,
      total,
      paymentMethod,
      status: 'pending'
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('oriemark_orders') || '[]');
    orders.push(order);
    localStorage.setItem('oriemark_orders', JSON.stringify(orders));

    // Clear cart
    state.cart = [];
    updateCartUI();

    // Show confirmation
    showOrderConfirmation(order);
  });
}

function updateCheckoutSummary() {
  const itemsContainer = $('#checkoutItems');
  const subtotalEl = $('#checkoutSubtotal');
  const taxEl = $('#checkoutTax');
  const totalEl = $('#checkoutTotal');
  const btnTotal = $('#btnTotal');
  const shippingEl = $('#checkoutShipping');

  if (!itemsContainer) return;

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="checkout-empty">
        <div class="checkout-empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to your cart before checking out.</p>
        <a class="btn btn-primary" data-page="shop" href="#">Browse Gadgets</a>
      </div>`;
    subtotalEl.textContent = '₦0';
    taxEl.textContent = '₦0';
    totalEl.textContent = '₦0';
    btnTotal.textContent = '₦0';
    shippingEl.textContent = '—';
    return;
  }

  // Render items
  itemsContainer.innerHTML = state.cart.map(item => `
    <div class="summary-item">
      <div class="si-image">${item.Image ? '<img src="' + item.Image + '" alt="' + item.name + '">' : (item.emoji || '📦')}</div>
      <div class="si-details">
        <div class="si-name">${item.name}</div>
        <div class="si-qty">Qty: ${item.qty}</div>
        <div class="si-price">₦${(item.price * item.qty).toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  // Calculate totals
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = calculateShipping(state);
  const tax = subtotal * 0.075;
  const discount = state.discount ? subtotal * state.discount : 0;
  const total = subtotal + shipping + tax - discount;

  subtotalEl.textContent = '₦' + subtotal.toLocaleString();
  taxEl.textContent = '₦' + Math.round(tax).toLocaleString();
  totalEl.textContent = '₦' + Math.round(total).toLocaleString();
  btnTotal.textContent = '₦' + Math.round(total).toLocaleString();
  shippingEl.textContent = shipping === 0 ? 'Free Delivery' : '₦' + shipping.toLocaleString();
}

function calculateShipping(state) {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  // Free shipping for orders above ₦500,000
  if (subtotal >= 500000) return 0;
  // Flat rate shipping
  return 2500;
}

function showOrderConfirmation(order) {
  // Create confirmation modal
  const modal = document.createElement('div');
  modal.className = 'order-confirm-modal';
  modal.innerHTML = `
    <div class="oc-backdrop"></div>
    <div class="oc-container">
      <div class="oc-icon">✅</div>
      <h2>Order Placed Successfully!</h2>
      <p class="oc-order-id">Order ID: <strong>${order.id}</strong></p>
      <p class="oc-amount">Total Amount: <strong>₦${Math.round(order.total).toLocaleString()}</strong></p>
      
      <div class="oc-payment-info">
        <h3>Payment Instructions</h3>
        ${order.paymentMethod === 'transfer' ? `
          <p>Please transfer <strong>₦${Math.round(order.total).toLocaleString()}</strong> to:</p>
          <div class="oc-bank-details">
            <p><strong>GTBank:</strong> 058-291-0831</p>
            <p><strong>Account Name:</strong> OrieMark Digital Solutions</p>
          </div>
          <p class="oc-note">Use your order ID as payment reference</p>
        ` : order.paymentMethod === 'ussd' ? `
          <p>Dial <strong>*770*0582910831#</strong> to pay ₦${Math.round(order.total).toLocaleString()}</p>
        ` : `
          <p>You will receive a payment link via SMS/Email shortly.</p>
        `}
      </div>
      
      <div class="oc-contact">
        <p>📞 Questions? Call +234 813 401 8159 or chat with us</p>
      </div>
      
      <button class="btn btn-primary btn-lg" onclick="location.reload()">Continue Shopping</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add styles for confirmation modal
  const style = document.createElement('style');
  style.textContent = `
    .order-confirm-modal {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    }
    .oc-backdrop {
      position: absolute; inset: 0;
      background: rgba(2,13,31,0.8); backdrop-filter: blur(4px);
    }
    .oc-container {
      position: relative; background: white; border-radius: 16px;
      padding: 40px; max-width: 480px; width: 90%; text-align: center;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .oc-icon { font-size: 56px; margin-bottom: 16px; }
    .oc-container h2 { font-size: 24px; color: #050e1f; margin-bottom: 12px; }
    .oc-order-id { font-size: 14px; color: #2a4170; margin-bottom: 4px; }
    .oc-amount { font-size: 18px; color: #050e1f; margin-bottom: 24px; }
    .oc-payment-info {
      background: #f0f7ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;
    }
    .oc-payment-info h3 { font-size: 16px; color: #050e1f; margin-bottom: 12px; }
    .oc-payment-info p { font-size: 14px; color: #2a4170; margin-bottom: 8px; }
    .oc-bank-details { background: white; padding: 12px; border-radius: 8px; margin: 12px 0; }
    .oc-bank-details p { margin: 4px 0; }
    .oc-note { font-size: 13px; color: #6b85ae; font-style: italic; }
    .oc-contact { font-size: 14px; color: #2a4170; margin-bottom: 24px; }
  `;
  document.head.appendChild(style);
}

  // Initial nav style for home
  applyNavStyle('home');
  setNavActive('home');

  // Trigger hero animation
  setTimeout(() => initReveal(), 200);
});
