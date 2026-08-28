import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const ORIGIN = process.env.TEST_ORIGIN ?? 'https://zikrmediaofficial.vercel.app';
const MUSHAF_URL = `${ORIGIN}/mushaf`;
const IS_LOCAL_TEST = ORIGIN.includes('manus.computer');
const DEBUG_PORT = 9223;
const PROFILE = `/tmp/zikr-slow3g-chrome-${Date.now()}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await sleep(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      } else if (message.method) {
        this.events.push(message);
      }
    });
  }

  async send(method, params = {}) {
    const id = ++this.nextId;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }

  eventsFor(method) {
    return this.events.filter((event) => event.method === method);
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  return result.result?.value;
}

async function evaluateWithTimeout(cdp, expression, timeoutMs = 12000) {
  return Promise.race([
    evaluate(cdp, expression),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Runtime evaluation timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);
}

async function emulate(cdp, { offline, latency, downloadThroughput, uploadThroughput }) {
  await cdp.send('Network.emulateNetworkConditions', {
    offline,
    latency,
    downloadThroughput,
    uploadThroughput,
  });
}

async function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return { socket, cdp: new CdpClient(socket) };
}

async function runBrowserTest() {
  const chrome = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--window-size=390,844',
    `--user-data-dir=${PROFILE}`,
    `--remote-debugging-port=${DEBUG_PORT}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const version = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const browserConnection = await connectCdp(version.webSocketDebuggerUrl);
    const browserCdp = browserConnection.cdp;
    const targets = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
    if (!pageTarget) throw new Error('No Chromium page target was found');
    const pageConnection = await connectCdp(pageTarget.webSocketDebuggerUrl);
    const { socket, cdp } = pageConnection;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Log.enable');
    await browserCdp.send('Browser.grantPermissions', { origin: ORIGIN, permissions: ['notifications'] });

    // Slow 3G: 400ms RTT and approximately 400kbps down/up.
    await emulate(cdp, {
      offline: false,
      latency: 400,
      downloadThroughput: 50 * 1024,
      uploadThroughput: 50 * 1024,
    });
    await cdp.send('Page.navigate', { url: MUSHAF_URL });
    await sleep(30000);

    const initial = await evaluateWithTimeout(cdp, `(
      async () => ({
      readyState: document.readyState,
      title: document.title,
      hasMushafHeading: document.body.innerText.includes('المصحف الشريف'),
      hasSurahSearch: Boolean(document.querySelector('input[placeholder*="سورة"]')),
      serviceWorkerSupported: 'serviceWorker' in navigator,
      registrations: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).map((r) => ({scope:r.scope,active:Boolean(r.active),controller:Boolean(navigator.serviceWorker.controller)})) : [],
      online: navigator.onLine,
      })
    )()`);

    // Simulate a temporary network outage, then recover it. The page runtime
    // must not throw and the registration should remain available.
    await emulate(cdp, {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await sleep(2500);
    const offlineState = await evaluate(cdp, `({ online: navigator.onLine, controller: Boolean(navigator.serviceWorker?.controller) })`);

    await emulate(cdp, {
      offline: false,
      latency: 50,
      downloadThroughput: 1_500 * 1024,
      uploadThroughput: 750 * 1024,
    });
    await sleep(6000);

    const recovered = await evaluateWithTimeout(cdp, `(
      async () => {
        await Promise.all([
          fetch('/mushaf', { cache: 'no-store' }).catch(() => null),
          fetch('/offline-content/v1/manifest.json', { cache: 'no-store' }).catch(() => null),
        ]);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
      online: navigator.onLine,
      registrations: 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).map((r) => ({scope:r.scope,active:Boolean(r.active),controller:Boolean(navigator.serviceWorker.controller),waiting:Boolean(r.waiting)})) : [],
      caches: 'caches' in window ? await caches.keys() : [],
      mushafCached: 'caches' in window ? (await caches.match('/mushaf'))?.status ?? null : null,
      manifestCached: 'caches' in window ? (await caches.match('/offline-content/v1/manifest.json'))?.status ?? null : null,
        };
      }
    )()`);

    await emulate(cdp, {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await sleep(800);
    const offlineProbe = await evaluateWithTimeout(cdp, `fetch('/mushaf', { cache: 'no-store' }).then(async (response) => ({
      status: response.status,
      hasMushafHeading: (await response.text()).includes('المصحف الشريف'),
    })).catch((error) => ({ status: 0, error: String(error) }))`);
    await emulate(cdp, {
      offline: false,
      latency: 50,
      downloadThroughput: 1_500 * 1024,
      uploadThroughput: 750 * 1024,
    });

    const notificationResults = await evaluateWithTimeout(cdp, `(
      async () => {
        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
        if (!registration) return { supported: false, reason: 'service-worker-ready-timeout' };
        const controller = navigator.serviceWorker.controller;
        if (!controller) return { supported: false, reason: 'no-controller' };
        controller.postMessage({ type: 'SHOW_PRAYER_NOTIFICATION', prayerName: 'الفجر' });
        controller.postMessage({ type: 'SHOW_DHIKR_NOTIFICATION', kind: 'salawat', text: 'اختبار التذكير' });
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const notifications = registration.getNotifications ? await registration.getNotifications() : [];
        return {
          supported: true,
          permission: 'Notification' in window ? Notification.permission : 'unsupported',
          count: notifications.length,
          titles: notifications.map((notification) => notification.title),
        };
      }
    )()`);

    const consoleErrors = cdp.eventsFor('Runtime.consoleAPICalled')
      .filter((event) => ['error', 'assert'].includes(event.params?.type))
      .map((event) => event.params.args?.map((arg) => arg.value ?? arg.description).join(' '));
    const pageErrors = cdp.eventsFor('Log.entryAdded')
      .filter((event) => event.params?.entry?.level === 'error')
      .map((event) => event.params.entry.text);
    const expectedNetworkErrors = pageErrors.filter((message) =>
      message.includes('ERR_INTERNET_DISCONNECTED') ||
      message.includes('ERR_CONNECTION_CLOSED') ||
      message.includes('status of 401') ||
      message.includes('/_vercel/insights/script.js') ||
      message.includes('/_vercel/speed-insights/script.js') ||
      message.includes('violates the following Content Security Policy directive') ||
      (IS_LOCAL_TEST && message.includes('status of 404'))
    );
    const unexpectedPageErrors = pageErrors.filter((message) => !expectedNetworkErrors.includes(message));

    socket.close();
    browserConnection.socket.close();
    return { initial, offlineState, recovered, offlineProbe, notificationResults, consoleErrors, pageErrors, expectedNetworkErrors, unexpectedPageErrors };
  } finally {
    chrome.kill('SIGTERM');
  }
}

async function runServiceWorkerHandlerSimulation() {
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  const listeners = new Map();
  const notifications = [];
  const clientsList = [{
    url: `${ORIGIN}/mushaf`,
    focus: async () => 'focused',
    navigate: async (url) => ({ url, focus: async () => 'navigated-focused' }),
  }];
  const cacheStore = new Map();
  const cache = {
    async add(asset) { cacheStore.set(asset, { status: 200, asset }); },
    async put(request, response) { cacheStore.set(typeof request === 'string' ? request : request.url, response); },
    async match(request) { return cacheStore.get(typeof request === 'string' ? request : request.url) ?? null; },
  };
  const cachesMock = {
    async open() { return cache; },
    async keys() { return ['zikr-v7']; },
    async match(request) { return cache.match(request); },
    async delete() { return true; },
  };
  const selfMock = {
    location: { origin: ORIGIN },
    registration: {
      async showNotification(title, options) { notifications.push({ title, options }); },
    },
    skipWaiting() {},
    clients: {
      async matchAll() { return clientsList; },
      async openWindow(url) { return { url }; },
    },
    addEventListener(type, handler) { listeners.set(type, handler); },
  };
  const context = vm.createContext({
    self: selfMock,
    clients: selfMock.clients,
    caches: cachesMock,
    URL: globalThis.URL,
    Request: class Request { constructor(url) { this.url = url; this.method = 'GET'; this.destination = ''; this.headers = { get: () => 'text/html' }; } },
    Response: class Response { constructor(body, options = {}) { this.body = body; this.status = options.status ?? 200; this.ok = this.status >= 200 && this.status < 300; this.headers = options.headers ?? {}; } clone() { return this; } async json() { return JSON.parse(this.body); } },
    fetch: async (request) => {
      const url = typeof request === 'string' ? request : request.url;
      if (url.includes('manifest.json')) {
        return new Response(JSON.stringify({ datasets: {}, routes: [] }), { status: 200 });
      }
      return new Response('ok', { status: 200 });
    },
    console,
    Promise,
    setTimeout,
    clearTimeout,
  });
  vm.runInContext(source, context, { filename: 'public/sw.js' });

  const waitUntilCalls = [];
  const messageHandler = listeners.get('message');
  if (!messageHandler) throw new Error('Service Worker message handler was not registered');
  messageHandler({ data: { type: 'SHOW_PRAYER_NOTIFICATION', prayerName: 'الفجر' }, waitUntil: (promise) => waitUntilCalls.push(promise) });
  messageHandler({ data: { type: 'SHOW_DHIKR_NOTIFICATION', kind: 'salawat', text: 'اختبار التذكير' }, waitUntil: (promise) => waitUntilCalls.push(promise) });
  await Promise.all(waitUntilCalls);

  const pushHandler = listeners.get('push');
  if (!pushHandler) throw new Error('Service Worker push handler was not registered');
  const pushWait = [];
  pushHandler({ data: { json: () => ({ title: 'اختبار Push', body: 'رسالة اختبار', url: '/mushaf', tag: 'test-push' }) }, waitUntil: (promise) => pushWait.push(promise) });
  await Promise.all(pushWait);

  const clickHandler = listeners.get('notificationclick');
  if (!clickHandler) throw new Error('Service Worker notificationclick handler was not registered');
  const clickWait = [];
  clickHandler({ notification: { data: { url: '/mushaf' }, close() {} }, waitUntil: (promise) => clickWait.push(promise) });
  await Promise.all(clickWait);

  return {
    registeredEvents: [...listeners.keys()],
    notificationCount: notifications.length,
    notificationTitles: notifications.map((item) => item.title),
    notificationTargets: notifications.map((item) => item.options.data?.url),
    clickHandled: true,
  };
}

const startedAt = Date.now();
const browser = await runBrowserTest();
const handlers = await runServiceWorkerHandlerSimulation();
const result = {
  startedAt: new Date().toISOString(),
  durationMs: Date.now() - startedAt,
  browser,
  handlers,
};
console.log(JSON.stringify(result, null, 2));

const failures = [];
if (!browser.initial.hasMushafHeading || !browser.initial.hasSurahSearch) failures.push('Mushaf did not render during Slow 3G load');
if (!browser.initial.serviceWorkerSupported) failures.push('Service Worker unsupported');
if (!browser.recovered.registrations?.some((registration) => registration.active && registration.controller)) failures.push('Service Worker did not recover as active controller');
if (browser.offlineProbe.status !== 200 || !browser.offlineProbe.hasMushafHeading) failures.push('Mushaf did not remain readable during offline probe');
if (browser.notificationResults.supported && browser.notificationResults.count < 2) failures.push(`Expected at least 2 browser notifications, got ${browser.notificationResults.count}`);
if (handlers.notificationCount !== 3) failures.push(`Expected 3 simulated notifications, got ${handlers.notificationCount}`);
if (!handlers.registeredEvents.includes('notificationclick')) failures.push('notificationclick handler missing');
if (browser.consoleErrors.length > 0 || browser.unexpectedPageErrors.length > 0) failures.push('Unexpected browser errors were recorded');
if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exitCode = 1;
}
