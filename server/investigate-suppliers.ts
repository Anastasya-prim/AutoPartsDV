import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface SiteInvestigation {
  url: string;
  name: string;
  searchArticle: string;
  searchUrl?: string;
  requiresLogin: boolean;
  isClientSideRendered: boolean;
  searchFormStructure?: string;
  resultsStructure?: string;
  notes: string[];
  screenshot?: string;
}

async function investigateSite(url: string, name: string): Promise<SiteInvestigation> {
  const investigation: SiteInvestigation = {
    url,
    name,
    searchArticle: '48157-33062',
    requiresLogin: false,
    isClientSideRendered: false,
    notes: [],
  };

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    console.log(`\n=== Investigating ${name} (${url}) ===\n`);
    
    // Navigate to the site
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }
    
    const initialScreenshot = path.join(screenshotsDir, `${name.toLowerCase().replace(/\s/g, '-')}-initial.png`);
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    investigation.notes.push(`Initial screenshot: ${initialScreenshot}`);

    // Look for search form
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[name*="query"]',
      'input[name*="q"]',
      'input[placeholder*="поиск"]',
      'input[placeholder*="артикул"]',
      'input.search',
      '#search',
      '[name="article"]',
      '[name="code"]',
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.waitForSelector(selector, { timeout: 2000 });
        if (searchInput) {
          investigation.notes.push(`Found search input: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!searchInput) {
      investigation.notes.push('Could not find search input automatically - attempting manual analysis');
      
      // Try to get the page HTML to analyze manually
      const html = await page.content();
      
      // Save full HTML for manual inspection
      const htmlPath = path.join(screenshotsDir, `${name.toLowerCase().replace(/\s/g, '-')}-page.html`);
      fs.writeFileSync(htmlPath, html);
      investigation.notes.push(`Saved page HTML to: ${htmlPath}`);
      
      // Extract all forms
      const formMatch = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi);
      if (formMatch && formMatch.length > 0) {
        investigation.searchFormStructure = formMatch.map((f, i) => 
          `\n=== Form ${i + 1} ===\n${f.substring(0, 800)}`
        ).join('\n');
        investigation.notes.push(`Found ${formMatch.length} form(s) on the page`);
      }
      
      // Try common search URLs for TISS
      if (name.toLowerCase().includes('tiss')) {
        investigation.notes.push('Attempting direct search URL for TISS...');
        const directSearchUrl = `${url}/search?q=${investigation.searchArticle}`;
        try {
          await page.goto(directSearchUrl, { waitUntil: 'networkidle', timeout: 15000 });
          await page.waitForTimeout(2000);
          
          const resultsScreenshot = path.join(screenshotsDir, `${name.toLowerCase().replace(/\s/g, '-')}-results-attempt.png`);
          await page.screenshot({ path: resultsScreenshot, fullPage: true });
          investigation.notes.push(`Direct search attempted, screenshot: ${resultsScreenshot}`);
          
          investigation.searchUrl = page.url();
          const bodyHTML = await page.evaluate(() => document.body.innerHTML);
          investigation.resultsStructure = bodyHTML.substring(0, 5000);
        } catch (e: any) {
          investigation.notes.push(`Direct search failed: ${e.message}`);
        }
      }
    } else {
      // Get the form structure
      const formElement = await searchInput.evaluateHandle((input: any) => {
        return input.closest('form') || input.parentElement;
      });
      
      const formHTML = await formElement.evaluate((el: any) => el.outerHTML);
      investigation.searchFormStructure = formHTML.substring(0, 1000);
      investigation.notes.push('Captured search form structure');

      // Get the form to find submit button first
      const parentForm = await page.evaluateHandle(() => {
        const input = document.querySelector('input[type="search"]') as HTMLInputElement;
        return input?.closest('form') || input?.parentElement;
      });

      // Enter the search article
      await searchInput.fill(investigation.searchArticle);
      investigation.notes.push(`Entered search article: ${investigation.searchArticle}`);
      await page.waitForTimeout(1000);

      // Try to submit the form
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Найти")',
        'button:has-text("Поиск")',
        'button.search-button',
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const submitBtn = await page.waitForSelector(selector, { timeout: 1000 });
          if (submitBtn && await submitBtn.isVisible()) {
            // Wait for button to be enabled
            await page.waitForTimeout(500);
            await submitBtn.click();
            submitted = true;
            investigation.notes.push(`Clicked submit button: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!submitted) {
        // Try to submit the form programmatically
        try {
          await page.evaluate(() => {
            const form = document.querySelector('form#oem-search') as HTMLFormElement;
            if (form) {
              form.submit();
            }
          });
          investigation.notes.push('Submitted form programmatically');
          submitted = true;
        } catch (e) {
          investigation.notes.push('Could not submit form');
        }
      }

      // Wait for results or navigation
      await page.waitForTimeout(3000);
      
      // Wait for content to load
      await page.waitForLoadState('networkidle').catch(() => {});
      
      // Check if we're still on the same URL or navigated
      const currentUrl = page.url();
      investigation.searchUrl = currentUrl;
      investigation.notes.push(`Search URL: ${currentUrl}`);

      // Check for login requirement
      const loginIndicators = ['login', 'signin', 'auth', 'войти', 'вход'];
      const pageContent = await page.content();
      if (loginIndicators.some(indicator => currentUrl.toLowerCase().includes(indicator)) ||
          loginIndicators.some(indicator => pageContent.toLowerCase().includes(`форма ${indicator}`) || pageContent.toLowerCase().includes(`окно ${indicator}`))) {
        investigation.requiresLogin = true;
        investigation.notes.push('⚠️ Site appears to require login');
      }

      // Take screenshot of results
      const resultsScreenshot = path.join(screenshotsDir, `${name.toLowerCase().replace(/\s/g, '-')}-results.png`);
      await page.screenshot({ path: resultsScreenshot, fullPage: true });
      investigation.screenshot = resultsScreenshot;
      investigation.notes.push(`Results screenshot: ${resultsScreenshot}`);

      // Analyze results structure
      const possibleResultContainers = [
        '.search-results',
        '.results',
        '.products',
        '.items',
        '.product-list',
        '.parts-list',
        '[class*="result"]',
        '[class*="product"]',
        '[class*="part"]',
        'table.results tbody tr',
        'table tbody tr',
        '.list-item',
        '.card',
        '[data-product]',
        '[data-part]',
      ];

      let resultsHTML = '';
      let foundResults = false;
      
      for (const selector of possibleResultContainers) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            investigation.notes.push(`Found ${elements.length} results with selector: ${selector}`);
            foundResults = true;
            
            // Get the HTML of first few results
            const firstResults = elements.slice(0, Math.min(3, elements.length));
            for (let i = 0; i < firstResults.length; i++) {
              const html = await firstResults[i].evaluate((el: any) => el.outerHTML);
              resultsHTML += `\n\n=== Result ${i + 1} (selector: ${selector}) ===\n${html}`;
            }
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (resultsHTML) {
        investigation.resultsStructure = resultsHTML.substring(0, 8000);
        
        // Try to extract specific field patterns
        const fields = await page.evaluate(() => {
          const result: any = {};
          
          // Look for price patterns
          const priceElements = document.querySelectorAll('[class*="price"], [class*="cost"], [data-price]');
          if (priceElements.length > 0) {
            result.priceSelectors = Array.from(priceElements).slice(0, 3).map((el: any) => ({
              class: el.className,
              text: el.textContent?.trim().substring(0, 50)
            }));
          }
          
          // Look for brand patterns
          const brandElements = document.querySelectorAll('[class*="brand"], [class*="manufacturer"], [data-brand]');
          if (brandElements.length > 0) {
            result.brandSelectors = Array.from(brandElements).slice(0, 3).map((el: any) => ({
              class: el.className,
              text: el.textContent?.trim().substring(0, 50)
            }));
          }
          
          // Look for article/code patterns
          const articleElements = document.querySelectorAll('[class*="article"], [class*="code"], [class*="sku"], [data-article]');
          if (articleElements.length > 0) {
            result.articleSelectors = Array.from(articleElements).slice(0, 3).map((el: any) => ({
              class: el.className,
              text: el.textContent?.trim().substring(0, 50)
            }));
          }
          
          // Look for stock/availability patterns
          const stockElements = document.querySelectorAll('[class*="stock"], [class*="availability"], [class*="quantity"], [data-stock]');
          if (stockElements.length > 0) {
            result.stockSelectors = Array.from(stockElements).slice(0, 3).map((el: any) => ({
              class: el.className,
              text: el.textContent?.trim().substring(0, 50)
            }));
          }
          
          return result;
        });
        
        if (Object.keys(fields).length > 0) {
          investigation.notes.push(`Detected field patterns: ${JSON.stringify(fields, null, 2)}`);
        }
      } else if (!foundResults) {
        // Fallback: get main content HTML
        const mainContent = await page.evaluate(() => {
          const main = document.querySelector('main') || 
                       document.querySelector('#main') || 
                       document.querySelector('.main') ||
                       document.querySelector('#content') ||
                       document.querySelector('.content');
          return main ? main.innerHTML : document.body.innerHTML;
        });
        investigation.resultsStructure = mainContent.substring(0, 5000);
        investigation.notes.push('Could not find specific results container, captured main content HTML');
      }

      // Check if it's client-side rendered (SPA)
      const scriptTags = await page.$$eval('script', (scripts: any[]) => 
        scripts.some((s: any) => {
          const src = s.src || '';
          const content = s.textContent || '';
          return src.includes('react') || src.includes('vue') || src.includes('angular') || 
                 content.includes('React') || content.includes('Vue') || content.includes('Angular') ||
                 src.includes('app.js') || src.includes('bundle.js');
        })
      );
      
      investigation.isClientSideRendered = scriptTags;
      investigation.notes.push(investigation.isClientSideRendered ? 
        '⚠️ Site appears to be client-side rendered (SPA)' : 
        '✓ Site appears to be server-side rendered'
      );
    }

  } catch (error: any) {
    investigation.notes.push(`ERROR: ${error.message}`);
    console.error(`Error investigating ${name}:`, error.message);
  } finally {
    await browser.close();
  }

  return investigation;
}

async function main() {
  const sites = [
    { url: 'https://autotrade.su', name: 'AutoTrade' },
    { url: 'https://my.tiss.ru', name: 'TISS' },
  ];

  const results: SiteInvestigation[] = [];

  for (const site of sites) {
    const result = await investigateSite(site.url, site.name);
    results.push(result);
  }

  // Generate report
  const reportPath = path.join(__dirname, 'supplier-investigation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n\n=== Report saved to: ${reportPath} ===\n`);

  // Generate readable markdown report
  let markdownReport = '# Supplier Websites Investigation Report\n\n';
  markdownReport += `**Article tested:** 48157-33062\n\n`;
  
  for (const result of results) {
    markdownReport += `## ${result.name}\n\n`;
    markdownReport += `- **URL:** ${result.url}\n`;
    markdownReport += `- **Search URL:** ${result.searchUrl || 'N/A'}\n`;
    markdownReport += `- **Requires Login:** ${result.requiresLogin ? '⚠️ Yes' : '✓ No'}\n`;
    markdownReport += `- **Rendering:** ${result.isClientSideRendered ? '⚠️ Client-side (SPA)' : '✓ Server-side'}\n\n`;
    
    markdownReport += `### Notes:\n`;
    result.notes.forEach(note => {
      markdownReport += `- ${note}\n`;
    });
    
    if (result.searchFormStructure) {
      markdownReport += `\n### Search Form Structure:\n\`\`\`html\n${result.searchFormStructure}\n\`\`\`\n\n`;
    }
    
    if (result.resultsStructure) {
      markdownReport += `### Results Structure:\n\`\`\`html\n${result.resultsStructure}\n\`\`\`\n\n`;
    }
    
    markdownReport += `---\n\n`;
  }

  const markdownPath = path.join(__dirname, 'supplier-investigation-report.md');
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`Markdown report saved to: ${markdownPath}\n`);
}

main().catch(console.error);
