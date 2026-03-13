import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface SiteInvestigation {
  url: string;
  name: string;
  searchArticle: string;
  searchUrl?: string;
  searchMethod?: string;
  requiresLogin: boolean;
  isClientSideRendered: boolean;
  searchFormStructure?: string;
  resultsStructure?: string;
  cssSelectors?: {
    brand?: string[];
    article?: string[];
    partName?: string[];
    price?: string[];
    stock?: string[];
    delivery?: string[];
  };
  notes: string[];
  screenshot?: string;
}

async function investigateAutoTrade(): Promise<SiteInvestigation> {
  const investigation: SiteInvestigation = {
    url: 'https://autotrade.su',
    name: 'AutoTrade',
    searchArticle: '48157-33062',
    requiresLogin: false,
    isClientSideRendered: true,
    notes: [],
    cssSelectors: {}
  };

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('\n=== Investigating AutoTrade ===\n');
    
    await page.goto('https://autotrade.su/vladivostok', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    // Find the search input and fill it
    const searchInput = await page.waitForSelector('input[name="article"]', { timeout: 5000 });
    if (searchInput) {
      await searchInput.fill(investigation.searchArticle);
      investigation.notes.push('Filled search input');
      
      // Wait for button to become enabled
      await page.waitForTimeout(1000);
      
      // Try clicking the submit button with force
      try {
        await page.click('button[type="submit"]', { force: true });
        investigation.notes.push('Clicked submit button');
      } catch (e) {
        // Alternative: trigger form submit via JavaScript
        await page.evaluate(() => {
          const form = document.querySelector('#oem-search') as HTMLFormElement;
          if (form) {
            // Remove disabled attribute from button
            const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (btn) {
              btn.disabled = false;
              btn.click();
            }
          }
        });
        investigation.notes.push('Submitted form via JavaScript');
      }
      
      // Wait for navigation or results
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle').catch(() => {});
      
      investigation.searchUrl = page.url();
      investigation.notes.push(`Current URL: ${investigation.searchUrl}`);
      
      // Take screenshot
      const screenshot = path.join(screenshotsDir, 'autotrade-search-results.png');
      await page.screenshot({ path: screenshot, fullPage: true });
      investigation.screenshot = screenshot;
      
      // Check if we have results or still on main page
      const pageContent = await page.content();
      fs.writeFileSync(path.join(screenshotsDir, 'autotrade-results-page.html'), pageContent);
      
      // Look for result elements
      const possibleSelectors = [
        '.search-results',
        '.result-item',
        '[class*="product"]',
        '[class*="part"]',
        'table.results tbody tr',
        '[data-article]',
      ];
      
      let foundResults = false;
      for (const selector of possibleSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          investigation.notes.push(`Found ${count} elements with selector: ${selector}`);
          foundResults = true;
          
          // Get sample HTML
          const samples = await page.locator(selector).first().evaluate((el: any) => el.outerHTML);
          investigation.resultsStructure = samples;
          break;
        }
      }
      
      if (!foundResults) {
        investigation.notes.push('⚠️ No results found - may need API call or different approach');
      }
    }

    // Check search form structure
    const formHTML = await page.evaluate(() => {
      const form = document.querySelector('#oem-search');
      return form ? form.outerHTML : '';
    });
    investigation.searchFormStructure = formHTML.substring(0, 1500);
    
    investigation.searchMethod = 'POST to /vladivostok/find';
    investigation.notes.push('Form action: POST /vladivostok/find');
    investigation.notes.push('Form is client-side rendered, button disabled by default');

  } catch (error: any) {
    investigation.notes.push(`ERROR: ${error.message}`);
  } finally {
    await browser.close();
  }

  return investigation;
}

async function investigateTISS(): Promise<SiteInvestigation> {
  const investigation: SiteInvestigation = {
    url: 'https://my.tiss.ru',
    name: 'TISS',
    searchArticle: '48157-33062',
    requiresLogin: true,
    isClientSideRendered: false,
    notes: [],
    cssSelectors: {}
  };

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('\n=== Investigating TISS ===\n');
    
    await page.goto('https://my.tiss.ru', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    // Take initial screenshot
    const initialScreenshot = path.join(screenshotsDir, 'tiss-main-page.png');
    await page.screenshot({ path: initialScreenshot, fullPage: true });
    investigation.notes.push(`Initial screenshot: ${initialScreenshot}`);
    
    // Save page HTML
    const pageHTML = await page.content();
    fs.writeFileSync(path.join(screenshotsDir, 'tiss-main-page.html'), pageHTML);
    investigation.notes.push('Saved main page HTML');
    
    // Check if login is required
    const loginForm = await page.locator('input[name="Login"], input[name="Password"]').count();
    if (loginForm > 0) {
      investigation.requiresLogin = true;
      investigation.notes.push('⚠️ Site requires login to access');
      investigation.notes.push('Login form detected on main page');
      
      // Get login form structure
      const formHTML = await page.evaluate(() => {
        const form = document.querySelector('form');
        return form ? form.outerHTML : '';
      });
      investigation.searchFormStructure = formHTML.substring(0, 1000);
    }
    
    // Try to find API endpoints by examining network requests
    const apiEndpoints: string[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('api') || url.includes('search') || url.includes('catalog')) {
        apiEndpoints.push(url);
      }
    });
    
    await page.waitForTimeout(3000);
    
    if (apiEndpoints.length > 0) {
      investigation.notes.push(`Detected API endpoints: ${apiEndpoints.join(', ')}`);
    }
    
    investigation.searchUrl = 'Requires authentication';
    investigation.searchMethod = 'Unknown - requires login';
    
  } catch (error: any) {
    investigation.notes.push(`ERROR: ${error.message}`);
  } finally {
    await browser.close();
  }

  return investigation;
}

async function manualAnalysis() {
  console.log('\n=== Manual Analysis of Sites ===\n');
  
  // Read saved HTML files
  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  console.log('\n--- AutoTrade Analysis ---');
  const autotradeHTML = fs.readFileSync(path.join(screenshotsDir, 'autotrade-results-page.html'), 'utf-8');
  
  // Search for common patterns
  const autotradePatterns = {
    pricePatterns: autotradeHTML.match(/class="[^"]*price[^"]*"/gi) || [],
    brandPatterns: autotradeHTML.match(/class="[^"]*brand[^"]*"/gi) || [],
    articlePatterns: autotradeHTML.match(/class="[^"]*article[^"]*"|class="[^"]*code[^"]*"/gi) || [],
    stockPatterns: autotradeHTML.match(/class="[^"]*stock[^"]*"|class="[^"]*availability[^"]*"/gi) || [],
  };
  
  console.log('AutoTrade CSS patterns found:', autotradePatterns);
  
  console.log('\n--- TISS Analysis ---');
  console.log('TISS requires authentication - cannot analyze without login credentials');
  
  return {
    autotradePatterns
  };
}

async function main() {
  const results: SiteInvestigation[] = [];

  // Investigate both sites
  results.push(await investigateAutoTrade());
  results.push(await investigateTISS());
  
  // Manual analysis
  const analysis = await manualAnalysis();

  // Generate comprehensive report
  const reportPath = path.join(__dirname, 'supplier-investigation-final-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ results, analysis }, null, 2));
  console.log(`\n\n=== Final Report saved to: ${reportPath} ===\n`);

  // Generate markdown report
  let markdownReport = '# Auto Parts Supplier Investigation - Final Report\n\n';
  markdownReport += `**Test Article:** 48157-33062\n`;
  markdownReport += `**Investigation Date:** ${new Date().toLocaleDateString('ru-RU')}\n\n`;
  markdownReport += `---\n\n`;
  
  for (const result of results) {
    markdownReport += `## ${result.name}\n\n`;
    markdownReport += `### Basic Information\n`;
    markdownReport += `- **URL:** ${result.url}\n`;
    markdownReport += `- **Search URL Pattern:** ${result.searchUrl || 'N/A'}\n`;
    markdownReport += `- **Search Method:** ${result.searchMethod || 'N/A'}\n`;
    markdownReport += `- **Requires Login:** ${result.requiresLogin ? '⚠️ YES' : '✅ NO'}\n`;
    markdownReport += `- **Rendering Type:** ${result.isClientSideRendered ? '⚠️ Client-side (SPA/React/Vue)' : '✅ Server-side HTML'}\n\n`;
    
    markdownReport += `### Investigation Notes\n`;
    result.notes.forEach(note => {
      markdownReport += `- ${note}\n`;
    });
    markdownReport += `\n`;
    
    if (result.searchFormStructure) {
      markdownReport += `### Search Form Structure\n`;
      markdownReport += `\`\`\`html\n${result.searchFormStructure}\n\`\`\`\n\n`;
    }
    
    if (result.resultsStructure) {
      markdownReport += `### Results HTML Structure\n`;
      markdownReport += `\`\`\`html\n${result.resultsStructure}\n\`\`\`\n\n`;
    }
    
    if (result.cssSelectors && Object.keys(result.cssSelectors).length > 0) {
      markdownReport += `### CSS Selectors for Data Extraction\n`;
      Object.entries(result.cssSelectors).forEach(([key, values]) => {
        if (values && values.length > 0) {
          markdownReport += `- **${key}:** ${values.join(', ')}\n`;
        }
      });
      markdownReport += `\n`;
    }
    
    markdownReport += `### Scraping Strategy\n`;
    if (result.requiresLogin) {
      markdownReport += `⚠️ **Requires Authentication:**\n`;
      markdownReport += `- Need to implement login flow first\n`;
      markdownReport += `- Store session cookies/tokens\n`;
      markdownReport += `- Then perform searches with authenticated session\n\n`;
    } else if (result.isClientSideRendered) {
      markdownReport += `⚠️ **Client-Side Rendered:**\n`;
      markdownReport += `- Use Playwright/Puppeteer for browser automation\n`;
      markdownReport += `- OR reverse-engineer API calls (check Network tab)\n`;
      markdownReport += `- Wait for JavaScript to load before scraping\n\n`;
    } else {
      markdownReport += `✅ **Simple HTTP Requests:**\n`;
      markdownReport += `- Can use axios/fetch with form data\n`;
      markdownReport += `- Parse HTML with cheerio/jsdom\n\n`;
    }
    
    markdownReport += `---\n\n`;
  }
  
  const markdownPath = path.join(__dirname, 'supplier-investigation-final-report.md');
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`Markdown report saved to: ${markdownPath}\n`);
}

main().catch(console.error);
