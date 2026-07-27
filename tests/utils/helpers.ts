import { Page, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface ConsoleError {
  type: string;
  text: string;
  url: string;
  lineNumber: number;
}

export interface NetworkError {
  url: string;
  status: number;
  statusText: string;
}

export interface PageResult {
  url: string;
  title: string;
  consoleErrors: ConsoleError[];
  networkErrors: NetworkError[];
  screenshot?: string;
  timestamp: string;
}

export function setupConsoleCapture(page: Page): ConsoleError[] {
  const errors: ConsoleError[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push({
        type: 'console.error',
        text: msg.text(),
        url: page.url(),
        lineNumber: 0,
      });
    }
  });
  page.on('pageerror', (err) => {
    errors.push({
      type: 'pageerror',
      text: err.message,
      url: page.url(),
      lineNumber: 0,
    });
  });
  return errors;
}

export function setupNetworkCapture(page: Page): NetworkError[] {
  const errors: NetworkError[] = [];
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400 && !response.url().includes('socket.io') && !response.url().includes('favicon')) {
      errors.push({
        url: response.url(),
        status,
        statusText: response.statusText(),
      });
    }
  });
  return errors;
}

export async function capturePageResult(
  page: Page,
  consoleErrors: ConsoleError[],
  networkErrors: NetworkError[],
  outputDir: string,
): Promise<PageResult> {
  const slug = page.url().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80);
  const screenshotPath = path.join(outputDir, `${slug}.png`);

  let screenshot: string | undefined;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    screenshot = screenshotPath;
  } catch {
    screenshot = undefined;
  }

  return {
    url: page.url(),
    title: await page.title(),
    consoleErrors: [...consoleErrors],
    networkErrors: [...networkErrors],
    screenshot,
    timestamp: new Date().toISOString(),
  };
}

export function saveResults(results: PageResult[], filename: string, outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filePath}`);
}
