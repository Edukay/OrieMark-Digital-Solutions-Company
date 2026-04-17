# OrieMark Digital Solutions — Website

**Version:** 1.0.0  
**Built for:** OrieMark Digital Solutions  
**Type:** Multi-page static website with AI chatbot

---

## Project Structure

```
oriemark/
├── index.html          ← Main HTML (all 3 pages)
├── css/
│   └── main.css        ← Full design system & all styles
├── js/
│   ├── products.js     ← Product data store (20 gadgets)
│   └── app.js          ← All logic: nav, shop, cart, chatbot
├── assets/             ← For logo, product images, icons
└── README.md           ← This file
```

---

## Pages

### 1. Homepage (`#page-home`)
- Animated hero with floating service cards
- Services overview grid (5 cards)
- "Why OrieMark" section with stats
- CTA strip with chatbot trigger
- Footer with links and contact

### 2. Services Page (`#page-services`)
- Page hero with gradient background
- Detailed breakdown of all 4 services with tech tags
- 3-tier pricing table (Starter / Growth / Enterprise)

### 3. Smart Gadgets Store (`#page-shop`)
- 20 products across 5 categories
- Live search (by name, category, tags)
- Category filter chips (Smartphones / Smartwatches / Audio / Laptops / Accessories)
- Sort by price, rating, name
- Add to cart with toast notification
- Wishlist toggle

---

## Key Features

### AI Chatbot (Ori)
- Powered by Claude claude-sonnet-4-20250514
- System prompt pre-loaded with OrieMark context
- Sliding chat window with typing indicator
- Quick reply buttons for common queries
- Conversation history maintained in session

To enable the real AI responses:
1. The chatbot calls `https://api.anthropic.com/v1/messages`
2. API key is handled by the hosting environment (see Hosting section)
3. In production, **never expose the API key in frontend JS**
4. Use a backend proxy (Node.js/Express or Vercel serverless function)

### Search & Filter
- Real-time search across product name, category, and tags
- Category filter with active state
- Sort: default, price low→high, price high→low, top rated, A–Z
- Zero-results state with friendly message

### Navigation
- Transparent on hero, solid on scroll
- Sticky, blur-backdrop navbar
- Smooth page transitions (SPA-style)
- Mobile hamburger menu with slide-down panel
- Active link underline animation

### Cart
- Add/remove items
- Visual badge counter on nav
- Toast notifications on add
- Wishlist toggle with heart icon

---

## Customisation Guide

### Update Brand Info
In `index.html`, search for these placeholders:
- `hello@oriemark.ng` → your real email
- `+234 800 000 000` → your real phone
- `Lagos, Nigeria` → your real address

### Update Products
Edit `js/products.js`. Each product has:
```js
{
  id: 1,
  name: "Product Name",
  category: "Smartphones",   // Must match CATEGORIES array
  price: 820000,             // In Naira (₦), no commas
  oldPrice: 950000,          // null if no discount
  rating: 4.9,
  reviews: 312,
  emoji: "📱",               // Replace with <img> path when ready
  badge: "sale",             // "sale" | "new" | "hot" | null
  tags: ["5G", "200MP"],     // Used in search
  description: "...",
  inStock: true
}
```

### Replace Emoji with Real Images
In `js/app.js`, in `buildProductCard()`, replace:
```js
<span>${p.emoji}</span>
```
With:
```js
<img src="assets/products/${p.id}.jpg" alt="${p.name}" style="max-height:140px;object-fit:contain">
```

### Update Service Pricing
In `index.html`, find the `.pricing-grid` section and update the `₦` price figures.

---

## Hosting Options

### Option A: Vercel (Recommended — Free)
```bash
# Install Vercel CLI
npm i -g vercel

# From project folder
vercel

# Follow prompts → your site will be live at oriemark.vercel.app
# Add custom domain in Vercel dashboard
```

### Option B: Netlify (Free)
1. Drag & drop the `oriemark/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Connect custom domain in Settings → Domain Management

### Option C: cPanel / Shared Hosting (Namecheap, etc.)
1. Zip the project folder
2. Upload via cPanel File Manager to `public_html/`
3. Unzip in place

---

## AI Chatbot — Production Setup

For production, create a backend proxy to protect your API key:

### Vercel Serverless Function (`/api/chat.js`)
```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();
  res.json(data);
}
```

Then in `app.js`, change the fetch URL from:
```js
'https://api.anthropic.com/v1/messages'
```
To:
```js
'/api/chat'
```

And add `ANTHROPIC_API_KEY=sk-ant-...` to your Vercel environment variables.

---

## Next Steps / Roadmap

- [ ] Add real product images to `/assets/products/`
- [ ] Connect Paystack or Flutterwave for checkout
- [ ] Add a Contact/Quote form with email delivery (Formspree or Resend)
- [ ] Integrate Google Analytics 4
- [ ] Add WhatsApp chat button (wa.me link)
- [ ] Build backend proxy for Claude API
- [ ] Add product detail modal/page
- [ ] Set up domain (e.g., oriemark.ng)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 (semantic) |
| Styling | Vanilla CSS with CSS variables |
| Logic | Vanilla JavaScript (ES6+) |
| Fonts | Bricolage Grotesque + DM Sans (Google Fonts) |
| AI | Claude claude-sonnet-4-20250514 via Anthropic API |
| Hosting | Vercel / Netlify / cPanel |

---

*Built by Claude for OrieMark Digital Solutions — 2025*
