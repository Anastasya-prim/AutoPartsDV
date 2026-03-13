# Auto Parts Supplier Websites - Investigation Report

**Investigation Date:** March 10, 2026  
**Test Article:** 48157-33062

---

## Site 1: AutoTrade (https://autotrade.su)

### Summary
- **URL:** https://autotrade.su/vladivostok
- **Login Required:** ❌ NO
- **Rendering Type:** ⚠️ **Client-Side (JavaScript/SPA)**
- **Scraping Difficulty:** 🔴 HIGH - Requires browser automation

### Search Form Structure

**Form Location:** Main page (`/vladivostok`)

```html
<form id="oem-search" action="/vladivostok/find" method="post">
  <div class="input-group">
    <input id="request" 
           class="input-group-field" 
           type="search" 
           name="article" 
           placeholder="Введите номер детали" 
           required="">
    <div class="input-group-button">
      <button class="button" type="submit" disabled="">
        <!-- Submit button starts disabled -->
      </button>
    </div>
  </div>
</form>
```

### Search URL Pattern

**Method:** POST  
**Endpoint:** `/vladivostok/find`  
**Parameters:**
- `article` - The part number to search for

**Example:**
```
POST https://autotrade.su/vladivostok/find
Content-Type: application/x-www-form-urlencoded

article=48157-33062
```

### Technical Details

1. **Client-Side Rendering:**
   - The site is heavily JavaScript-dependent
   - Search button is disabled by default and enabled via JavaScript
   - Results are likely loaded via AJAX/API calls
   - Server-side rendering is minimal

2. **Implementation Challenges:**
   - Submit button starts `disabled`, requires JavaScript to enable
   - May use CSRF tokens or session validation
   - Results might be loaded via separate API endpoints
   - Need to intercept network requests to find actual API

### Scraping Strategy for AutoTrade

#### Option 1: Browser Automation (Recommended)
```typescript
import { chromium } from 'playwright';

async function searchAutoTrade(article: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Navigate to search page
  await page.goto('https://autotrade.su/vladivostok');
  
  // Fill search form
  await page.fill('input[name="article"]', article);
  
  // Wait for button to become enabled
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type="submit"]');
    return btn && !btn.disabled;
  });
  
  // Click search button
  await page.click('button[type="submit"]');
  
  // Wait for results
  await page.waitForLoadState('networkidle');
  
  // Extract results (structure to be determined)
  const results = await page.evaluate(() => {
    // Extract data from page
    return {
      // To be implemented based on results page structure
    };
  });
  
  await browser.close();
  return results;
}
```

#### Option 2: Reverse Engineer API
1. Open browser DevTools → Network tab
2. Perform a search
3. Look for XHR/Fetch requests
4. Identify the actual API endpoint
5. Replicate the API call with axios/fetch

**Look for:**
- Requests to `/api/`, `/search/`, `/catalog/`
- JSON responses
- Headers: Authorization, X-CSRF-Token, etc.

### Expected Results Structure

**Status:** ❓ UNKNOWN - Requires actual search to determine

The results page HTML structure needs to be captured after a successful search. Based on common patterns, likely includes:

- Result container: `.search-results`, `.product-list`, `table.results`
- Each result item with:
  - Brand/Manufacturer
  - Article number
  - Part name/description
  - Price
  - Stock/availability
  - Delivery time
  - Supplier info

---

## Site 2: TISS (https://my.tiss.ru)

### Summary
- **URL:** https://my.tiss.ru
- **Login Required:** ✅ **YES** - Full authentication required
- **Rendering Type:** Server-Side with SPA after login
- **Scraping Difficulty:** 🔴 VERY HIGH - Requires authentication

### Login Form Structure

```html
<form class="app-page__form app-form" id="form" method="post">
  <input type="text" 
         id="login" 
         name="Login" 
         placeholder="E-mail" 
         required>
  
  <input type="password" 
         id="password" 
         name="Password" 
         placeholder="Пароль" 
         required>
  
  <input name="__RequestVerificationToken" 
         type="hidden" 
         value="..." >
  
  <button type="submit" 
          id="submitButton" 
          name="submitButton" 
          disabled="">Войти</button>
</form>
```

### Authentication Details

1. **Technology Stack:**
   - ASP.NET Core Identity
   - OAuth 2.0 / OpenID Connect
   - Anti-forgery tokens (`__RequestVerificationToken`)

2. **Login Flow:**
   ```
   1. GET /identity/login
      ↓ Extract __RequestVerificationToken
   
   2. POST /identity/login
      Body: Login, Password, __RequestVerificationToken
      ↓ Returns cookies/session
   
   3. Redirect to /after-login
      ↓ OAuth callback
   
   4. Access main application with session cookies
   ```

3. **Cookies/Tokens Required:**
   - `.AspNetCore.Culture` - Culture setting
   - Session cookies from authentication
   - Possibly JWT tokens in headers

### Search Functionality

**Status:** ❓ UNKNOWN - Cannot access without authentication

**Expected Pattern (after login):**
- Search interface likely in main application area
- May use REST API endpoints like `/api/catalog/search`
- Results might be JSON format
- Requires authenticated session headers

### Scraping Strategy for TISS

#### Prerequisites
⚠️ **Requires valid credentials** (email + password)

```typescript
import { chromium } from 'playwright';

async function authenticateAndSearchTISS(
  email: string, 
  password: string, 
  article: string
) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 1. Navigate to login page
  await page.goto('https://my.tiss.ru');
  
  // 2. Wait for form to be enabled
  await page.waitForFunction(() => {
    const btn = document.querySelector('#submitButton');
    return btn && !btn.hasAttribute('disabled');
  }, { timeout: 10000 });
  
  // 3. Fill login form
  await page.fill('input[name="Login"]', email);
  await page.fill('input[name="Password"]', password);
  
  // 4. Submit form
  await page.click('#submitButton');
  
  // 5. Wait for redirect to main app
  await page.waitForURL('**/after-login**', { timeout: 15000 });
  
  // 6. Now search for parts
  // (Search form structure unknown - need to inspect after login)
  
  // Save session cookies for future requests
  const cookies = await context.cookies();
  
  await browser.close();
  return { cookies, results: [] };
}
```

#### Alternative: API Approach (If Possible)

1. Login via API:
```typescript
const response = await axios.post('https://my.tiss.ru/identity/login', {
  Login: email,
  Password: password,
  __RequestVerificationToken: token, // Extract from GET first
}, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  withCredentials: true,
});

// Store cookies from response
const cookies = response.headers['set-cookie'];
```

2. Use cookies for subsequent requests

---

## Comparison Table

| Feature | AutoTrade | TISS |
|---------|-----------|------|
| **Login Required** | ❌ No | ✅ Yes |
| **Rendering** | Client-side (SPA) | Server + SPA |
| **Scraping Method** | Browser automation | Browser automation + Auth |
| **Difficulty** | 🔴 High | 🔴 Very High |
| **Rate Limiting** | Unknown | Unknown |
| **Search Method** | POST form | Unknown (requires login) |
| **Results Format** | HTML (dynamic) | Unknown |
| **Credentials Needed** | ❌ No | ✅ Yes |

---

## Recommendations

### For AutoTrade:
1. ✅ **Use Playwright for automation** - Most reliable approach
2. Intercept network calls to find API endpoints (if any)
3. Implement rate limiting / delays to avoid detection
4. Cache results to minimize requests
5. Consider rotating IP addresses if doing heavy scraping

### For TISS:
1. ⚠️ **Requires user credentials** - Cannot scrape without account
2. Must implement full authentication flow
3. Need to inspect search interface after login
4. Store and reuse session cookies
5. Handle token refresh/expiration
6. **Legal consideration:** Check Terms of Service for scraping policy

### General Best Practices:
- Add `User-Agent` headers to appear as normal browser
- Respect `robots.txt`
- Implement exponential backoff on errors
- Cache results to reduce load
- Monitor for changes in HTML structure
- Add error handling for auth failures, timeouts, etc.

---

## Next Steps

1. **AutoTrade:**
   - [ ] Perform actual search with article `48157-33062`
   - [ ] Capture results page HTML structure
   - [ ] Document CSS selectors for data extraction
   - [ ] Test API endpoint detection via Network tab

2. **TISS:**
   - [ ] Obtain test credentials (or request from client)
   - [ ] Login and explore search interface
   - [ ] Document post-authentication search flow
   - [ ] Capture results structure

3. **Implementation:**
   - [ ] Create adapter classes for each supplier
   - [ ] Implement browser automation with Playwright
   - [ ] Add error handling and retries
   - [ ] Create data mapping to unified format

---

## Code Structure for Implementation

```
server/src/parts/suppliers/
├── base.adapter.ts           # Base class with common logic
├── supplier-adapter.interface.ts  # Interface definition
├── autotrade.adapter.ts      # AutoTrade implementation
├── tiss.adapter.ts           # TISS implementation
└── index.ts                  # Export all adapters
```

### Base Adapter Interface:

```typescript
export interface SupplierAdapter {
  name: string;
  search(article: string): Promise<PartOffer[]>;
  requiresAuth: boolean;
  authenticate?(credentials: any): Promise<void>;
}

export interface PartOffer {
  supplier: string;
  brand: string;
  article: string;
  name: string;
  price: number;
  quantity: number;
  deliveryDays: number;
  availability: 'in_stock' | 'order' | 'out_of_stock';
}
```

---

**Investigation Status:** 🟡 Partial - Further testing needed with actual searches
