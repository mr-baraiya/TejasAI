import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\ef62d010-fb52-4fe6-850a-5eaff784dd40';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function sendCdpCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function captureScreenshot(width, height, outputPath) {
  console.log(`Starting capture for ${width}x${height} -> ${outputPath}`);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=' + path.join(process.env.TEMP, 'chrome_dbg_' + width),
    `--window-size=${width},${height}`,
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const version = await fetchJson('http://127.0.0.1:9222/json/version');
    const ws = new WebSocket(version.webSocketDebuggerUrl);

    await new Promise((resolve) => (ws.onopen = resolve));

    // Create new target page
    const { targetId } = await sendCdpCommand(ws, 'Target.createTarget', {
      url: 'http://localhost:5173',
    });

    const targetWsUrl = `ws://127.0.0.1:9222/devtools/page/${targetId}`;
    const pageWs = new WebSocket(targetWsUrl);
    await new Promise((resolve) => (pageWs.onopen = resolve));

    await sendCdpCommand(pageWs, 'Page.enable');
    await sendCdpCommand(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });

    await sendCdpCommand(pageWs, 'Page.navigate', { url: 'http://localhost:5173' });
    await new Promise((r) => setTimeout(r, 2000));

    const { data } = await sendCdpCommand(pageWs, 'Page.captureScreenshot', {
      format: 'png',
    });

    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Saved screenshot (${buffer.length} bytes) to: ${outputPath}`);

    pageWs.close();
    ws.close();
  } finally {
    chrome.kill();
  }
}

async function main() {
  await captureScreenshot(1440, 900, path.join(ARTIFACT_DIR, 'after_1440.png'));
  await captureScreenshot(390, 844, path.join(ARTIFACT_DIR, 'after_390.png'));
  console.log('Capture finished successfully!');
}

main().catch(console.error);
