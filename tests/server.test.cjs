'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = 4297;
const BASE = `http://127.0.0.1:${PORT}`;
let child;
let config;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function waitForHealth() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error('server did not become healthy');
}

async function readSse(url, headers, count, timeout = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    assert.equal(response.status, 200);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const events = [];
    let buffer = '';
    while (events.length < count) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let index;
      while ((index = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const type = block.split('\n').find(line => line.startsWith('event: '))?.slice(7);
        const data = block.split('\n').find(line => line.startsWith('data: '))?.slice(6);
        if (type) events.push({ type, data: data ? JSON.parse(data) : null });
      }
    }
    return events;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

test.before(async () => {
  child = spawn(process.execPath, ['server.cjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), CAPACITY: '10', START_COINS: '1000' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', chunk => process.stderr.write(chunk));
  await waitForHealth();
  config = JSON.parse(fs.readFileSync(path.join(ROOT, '.live-config.json'), 'utf8'));
});

test.after(async () => {
  if (!child) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    sleep(2000),
  ]);
});

test('join, queue, comment, gift, promote, QR, and host auth work over HTTP', async () => {
  const cfg = await (await fetch(`${BASE}/api/config`)).json();
  assert.equal(cfg.roomCode, config.roomCode);
  assert.equal(cfg.capacity, 10);
  assert.match(cfg.joinUrl, /\/j\?c=/);

  const joined = [];
  for (let i = 0; i < 11; i += 1) {
    const response = await fetch(`${BASE}/api/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: cfg.roomCode, clientId: `test-client-${i}`.padEnd(12, '0'), name: `친구${i}` }),
    });
    assert.equal(response.status, 200);
    joined.push(await response.json());
  }
  assert.equal(joined.filter(item => item.state === 'admitted').length, 10);
  const waiter = joined.find(item => item.state === 'waiting');
  assert.ok(waiter);
  assert.equal(waiter.position, 1);

  const first = joined[0];
  const comment = await fetch(`${BASE}/api/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` },
    body: JSON.stringify({ text: '안녕하세요', clientMsgId: 'test-comment-1' }),
  });
  assert.equal(comment.status, 200);

  const gift = await (await fetch(`${BASE}/api/gift`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${first.token}` },
    body: JSON.stringify({ giftId: 'fireworks', clientMsgId: 'test-gift-1' }),
  })).json();
  assert.equal(gift.ok, true);
  assert.equal(gift.balance, 970);

  const hostLogin = await fetch(`${BASE}/host?key=${config.hostKey}`, { redirect: 'manual' });
  assert.equal(hostLogin.status, 302);
  const cookie = hostLogin.headers.get('set-cookie')?.split(';')[0];
  assert.ok(cookie);
  const unauthorized = await fetch(`${BASE}/api/host/state`);
  assert.equal(unauthorized.status, 401);
  const liveUnauthorized = await fetch(`${BASE}/live`, { redirect: 'manual' });
  assert.equal(liveUnauthorized.status, 401);
  const liveAuthorized = await fetch(`${BASE}/live`, { headers: { Cookie: cookie }, redirect: 'manual' });
  assert.equal(liveAuthorized.status, 200);
  const liveHtml = await liveAuthorized.text();
  assert.match(liveHtml, /LIVE STAGE/);
  const hostState = await (await fetch(`${BASE}/api/host/state`, { headers: { Cookie: cookie } })).json();
  assert.equal(hostState.room.capacity, 10);
  assert.equal(hostState.room.occupied, 10);

  const hostEvents = await readSse(`${BASE}/api/host/stream`, { Cookie: cookie }, 1);
  assert.equal(hostEvents[0].type, 'hello');
  assert.equal(hostEvents[0].data.snapshot.room.occupied, 10);

  const leave = await fetch(`${BASE}/api/leave`, { method: 'POST', headers: { Authorization: `Bearer ${first.token}` } });
  assert.equal(leave.status, 204);
  const promoted = await (await fetch(`${BASE}/api/wait?w=${encodeURIComponent(waiter.waitToken)}`)).json();
  assert.equal(promoted.state, 'admitted');
  assert.ok(promoted.token);

  const qr = await (await fetch(`${BASE}/api/qr.svg`)).text();
  assert.ok(qr.startsWith('<svg'));
  const joinPage = await (await fetch(`${BASE}/j?c=${cfg.roomCode}`)).text();
  assert.match(joinPage, /一起看直播/);

  const audienceEvents = await readSse(`${BASE}/api/stream?t=${encodeURIComponent(promoted.token)}`, {}, 1);
  assert.equal(audienceEvents[0].type, 'hello');
  assert.equal(audienceEvents[0].data.me.seat.name, '친구10');

  const reset = await (await fetch(`${BASE}/api/host/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'resetAll' }),
  })).json();
  assert.equal(reset.ok, true);
  assert.equal(reset.room.occupied, 0);
});

test('server enforces comment rate limits and rejects unknown gifts', async () => {
  const cfg = await (await fetch(`${BASE}/api/config`)).json();
  const join = await (await fetch(`${BASE}/api/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ c: cfg.roomCode, clientId: 'ratelimit-client', name: '속도' }),
  })).json();
  assert.equal(join.state, 'admitted');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${join.token}` };
  for (let i = 0; i < 3; i += 1) {
    const response = await fetch(`${BASE}/api/comment`, {
      method: 'POST', headers,
      body: JSON.stringify({ text: `rate ${i}`, clientMsgId: `rate-${i}` }),
    });
    assert.equal(response.status, 200);
  }
  const limited = await fetch(`${BASE}/api/comment`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'rate 4', clientMsgId: 'rate-4' }),
  });
  assert.equal(limited.status, 429);
  const gift = await fetch(`${BASE}/api/gift`, {
    method: 'POST', headers,
    body: JSON.stringify({ giftId: 'not-a-gift', clientMsgId: 'bad-gift' }),
  });
  assert.equal(gift.status, 400);
});
