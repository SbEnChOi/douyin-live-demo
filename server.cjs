'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const { createRoom, GIFTS } = require('./lib/room.cjs');
const { MEMES } = require('./lib/memes.cjs');
const { createHub } = require('./lib/sse.cjs');
const { loadConfig, lanCandidates, chooseLanIp, resolveJoinBase, privateIpv4, argValue } = require('./lib/config.cjs');
const { qrSvg } = require('./lib/qr.cjs');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PORT = Math.max(1, Math.min(65535, Number(argValue('port') || process.env.PORT) || 4177));
const CAPACITY = Math.max(1, Math.min(50, Number(argValue('capacity') || process.env.CAPACITY) || 10));
const START_COINS = Math.max(1, Math.min(100000, Number(argValue('coins') || process.env.START_COINS) || 1000));
const config = loadConfig(ROOT);
const selected = chooseLanIp(config, PORT);
let selectedIp = selected.ip;
let joinBase = resolveJoinBase({ ip: selectedIp, port: PORT });
const joinUrl = () => `${joinBase}/j?c=${config.roomCode}`;

const room = createRoom({ capacity: CAPACITY, startCoins: START_COINS });
const hub = createHub();
const joinLimits = new Map();
const startedAt = Date.now();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; '));
}

function sendJson(res, status, body, extra = {}) {
  if (res.writableEnded) return;
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
    ...extra,
  });
  res.end(payload);
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  if (res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(text);
}

function sendHtml(res, status, html) {
  sendText(res, status, html, 'text/html; charset=utf-8');
}

function errorStatus(error) {
  return ({
    no_seat: 401,
    paused: 423,
    rate_limited: 429,
    insufficient_coins: 409,
    invalid: 400,
    invalid_gift: 400,
    invalid_attachment: 400,
    queue_full: 503,
    duplicate: 409,
  })[error] || 400;
}

function errorMessage(error) {
  return ({
    no_seat: '入场信息已失效，请刷新页面。',
    paused: '直播暂时停止了。',
    rate_limited: '发送太快了，请稍后再试。',
    insufficient_coins: '直播币不足。',
    invalid: '内容格式不对。',
    invalid_gift: '没有这个礼物。',
    invalid_attachment: '这个表情包不在限定包里。',
    queue_full: '排队人数已满。',
    duplicate: '刚刚已经发过了。',
  })[error] || '请求失败，请稍后再试。';
}

function remoteIp(req) {
  return String(req.socket.remoteAddress || '').replace(/^::ffff:/, '');
}

function allowJoin(ip) {
  const now = Date.now();
  let entry = joinLimits.get(ip);
  if (!entry || now >= entry.reset) {
    entry = { count: 0, reset: now + 60000 };
    joinLimits.set(ip, entry);
  }
  if (entry.count >= 60) return false;
  entry.count += 1;
  return true;
}

function readJson(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let failed = false;
    const chunks = [];
    req.on('data', chunk => {
      if (failed) return;
      size += chunk.length;
      if (size > limit) {
        failed = true;
        reject(Object.assign(new Error('too_large'), { status: 413 }));
        req.resume();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (failed) return;
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(Object.assign(new Error('bad_json'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function cookies(req) {
  const result = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a ?? ''));
  const right = Buffer.from(String(b ?? ''));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}

function hostKeyFrom(req) {
  return cookies(req).live_host || '';
}

function isHost(req) {
  return safeEqual(hostKeyFrom(req), config.hostKey);
}

function bearer(req) {
  const header = String(req.headers.authorization || '');
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return String(req.headers['x-seat-token'] || '').trim();
}

function publicConfig() {
  return {
    roomCode: config.roomCode,
    joinUrl: joinUrl(),
    joinBase,
    capacity: room.capacity,
    room: room.state(),
    gifts: GIFTS,
    memes: MEMES,
    serverTime: Date.now(),
    startedAt,
    lanCandidates: selected.candidates,
    selectedIp,
  };
}

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method not allowed');
    return;
  }
  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  let target = pathname;
  if (target === '/' || target === '/index.html') target = '/index.html';
  else if (target === '/j' || target === '/j/') target = '/join.html';
  else if (target === '/live' || target === '/live/') target = '/live.html';
  const file = path.resolve(DIST, `.${target}`);
  if (file !== DIST && !file.startsWith(DIST + path.sep)) {
    sendText(res, 403, 'Forbidden');
    return;
  }
  try {
    const stat = await fsp.stat(file);
    if (!stat.isFile()) throw new Error('not a file');
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const cache = /\.(html|js|css)$/i.test(file) ? 'no-cache' : 'public, max-age=86400';
    securityHeaders(res);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Cache-Control': cache,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
  } catch {
    sendText(res, 404, 'Not found');
  }
}

function openAudienceStream(req, res, url) {
  const token = url.searchParams.get('t') || '';
  const connected = room.connectStream(token);
  if (!connected) {
    sendJson(res, 401, { error: 'no_seat', message: errorMessage('no_seat') });
    return;
  }
  const { seat, event } = connected;
  const client = hub.add(req, res, {
    kind: 'audience',
    seatId: seat.id,
    token,
    onClose: () => {
      room.disconnectStream(token);
    },
  });
  if (client.closed) return;
  hub.raw(client, 'hello', room.hello(token, 'audience'), room.seq);
  const last = Number(req.headers['last-event-id'] || 0);
  if (last > 0) {
    for (const item of room.replay(last, { audience: true, limit: 100 })) hub.send(client, item);
  }
  if (event) hub.broadcast(event);
}

function openHostStream(req, res) {
  const client = hub.add(req, res, { kind: 'host' });
  if (client.closed) return;
  hub.raw(client, 'hello', {
    ...room.hello(null, 'host'),
    snapshot: room.snapshot(),
    joinUrl: joinUrl(),
    joinBase,
    roomCode: config.roomCode,
    selectedIp,
    lanCandidates: selected.candidates,
    memes: MEMES,
  }, room.seq);
  const last = Number(req.headers['last-event-id'] || 0);
  if (last > 0) {
    for (const item of room.replay(last, { audience: false, limit: 200 })) hub.send(client, item);
  }
}

async function handleHostControl(req, res) {
  const body = await readJson(req);
  const action = String(body.action || '');
  const from = room.seq;
  let result = { ok: true };
  if (action === 'capacity') {
    room.setCapacity(body.capacity);
  } else if (action === 'phase') {
    if (!room.setPhase(body.phase)) result = { ok: false, error: 'invalid_phase' };
  } else if (action === 'kick') {
    if (!room.kick(body.seatId)) result = { ok: false, error: 'no_seat' };
    else hub.closeSeat(String(body.seatId));
  } else if (action === 'clear') {
    room.clearChat();
  } else if (action === 'resetScores') {
    room.resetScores();
  } else if (action === 'resetAll') {
    room.resetAll();
  } else if (action === 'comment') {
    const comment = room.hostComment(body.text);
    if (!comment.ok) result = { ok: false, error: comment.error };
  } else if (action === 'lanIp') {
    if (!privateIpv4(String(body.ip || '')) || !selected.candidates.some(item => item.address === body.ip)) {
      result = { ok: false, error: 'invalid_ip' };
    } else {
      selectedIp = body.ip;
      joinBase = resolveJoinBase({ ip: selectedIp, port: PORT });
    }
  } else {
    result = { ok: false, error: 'unknown_action' };
  }
  room.tick();
  for (const event of room.replay(from, { audience: false })) hub.broadcast(event);
  sendJson(res, result.ok ? 200 : 400, {
    ...result,
    snapshot: room.snapshot(),
    joinUrl: joinUrl(),
    joinBase,
    selectedIp,
    room: room.state(),
  });
}

function unauthorizedPage(res) {
  sendHtml(res, 401, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Host only</title>
<body style="font-family:system-ui;background:#101114;color:#f1f1f5;padding:48px;line-height:1.6">
<h1 style="font-size:22px">主播专用页面</h1>
<p>请先在笔记本上使用服务器输出的 <code>/host?key=...</code> 地址进入。</p>
<p style="color:#90929f">电视舞台不会向学生手机公开。</p>
</body></html>`);
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  let pathname = '/';
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    sendText(res, 400, 'Bad request');
    return;
  }

  try {
    if (pathname === '/api/config' && req.method === 'GET') {
      sendJson(res, 200, publicConfig());
      return;
    }

    if (pathname === '/health' && req.method === 'GET') {
      sendJson(res, 200, { ok: true, uptime: Date.now() - startedAt, clients: hub.size });
      return;
    }

    if (pathname === '/api/qr.svg' && req.method === 'GET') {
      const svg = qrSvg(joinUrl(), { cellSize: 8, margin: 4 });
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(svg);
      return;
    }

    if (pathname === '/host' && req.method === 'GET') {
      const key = url.searchParams.get('key') || '';
      if (safeEqual(key, config.hostKey) || isHost(req)) {
        res.writeHead(302, {
          'Set-Cookie': `live_host=${encodeURIComponent(config.hostKey)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`,
          Location: '/',
        });
        res.end();
      } else {
        unauthorizedPage(res);
      }
      return;
    }

    if (pathname === '/live' || pathname === '/live/') {
      if (!isHost(req)) {
        unauthorizedPage(res);
        return;
      }
      await serveStatic(req, res, '/live.html');
      return;
    }

    if (pathname === '/api/join' && req.method === 'POST') {
      if (!allowJoin(remoteIp(req))) {
        sendJson(res, 429, { error: 'rate_limited', message: '请稍后再试。' });
        return;
      }
      const body = await readJson(req);
      if (String(body.c || '').toUpperCase() !== config.roomCode) {
        sendJson(res, 403, { error: 'bad_code', message: '二维码已失效，请重新扫描。' });
        return;
      }
      const clientId = String(body.clientId || '');
      if (!/^[A-Za-z0-9_-]{8,64}$/.test(clientId)) {
        sendJson(res, 400, { error: 'invalid', message: '请刷新浏览器后重试。' });
        return;
      }
      const result = room.join(clientId, body.name);
      if (result.state === 'error') {
        sendJson(res, errorStatus(result.error), { ...result, message: errorMessage(result.error) });
        return;
      }
      sendJson(res, 200, { ...result, roomCode: config.roomCode, joinUrl: joinUrl(), gifts: GIFTS });
      return;
    }

    if (pathname === '/api/wait' && req.method === 'GET') {
      const result = room.waitStatus(url.searchParams.get('w') || '');
      sendJson(res, result.state === 'expired' ? 410 : 200, result);
      return;
    }

    if (pathname === '/api/stream' && req.method === 'GET') {
      openAudienceStream(req, res, url);
      return;
    }

    if (pathname === '/api/host/stream' && req.method === 'GET') {
      if (!isHost(req)) {
        sendJson(res, 401, { error: 'host_only' });
        return;
      }
      openHostStream(req, res);
      return;
    }

    if (pathname === '/api/host/state' && req.method === 'GET') {
      if (!isHost(req)) {
        sendJson(res, 401, { error: 'host_only' });
        return;
      }
      sendJson(res, 200, {
        ...room.snapshot(),
        joinUrl: joinUrl(),
        joinBase,
        roomCode: config.roomCode,
        selectedIp,
        lanCandidates: selected.candidates,
        memes: MEMES,
        clients: { total: hub.size, audience: hub.audienceCount, host: hub.hostCount },
        serverTime: Date.now(),
        startedAt,
      });
      return;
    }

    if (pathname === '/api/host/control' && req.method === 'POST') {
      if (!isHost(req)) {
        sendJson(res, 401, { error: 'host_only' });
        return;
      }
      await handleHostControl(req, res);
      return;
    }

    if (pathname === '/api/comment' || pathname === '/api/gift' || pathname === '/api/like' || pathname === '/api/leave') {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'method' });
        return;
      }
      const token = bearer(req);
      const seat = room.seatForToken(token);
      if (!seat) {
        sendJson(res, 401, { error: 'no_seat', message: errorMessage('no_seat') });
        return;
      }
      const body = await readJson(req);
      if (pathname === '/api/comment') {
        const result = room.comment(token, body.text, body.clientMsgId, body.attachment);
        if (!result.ok) {
          sendJson(res, errorStatus(result.error), { ...result, message: errorMessage(result.error) });
          return;
        }
        if (!result.duplicate && result.event) hub.broadcast(result.event);
        sendJson(res, 200, { ok: true, seq: result.seq, duplicate: !!result.duplicate, attachment: result.attachment });
        return;
      }
      if (pathname === '/api/gift') {
        const result = room.gift(token, body.giftId, body.clientMsgId);
        if (!result.ok) {
          sendJson(res, errorStatus(result.error), { ...result, message: errorMessage(result.error) });
          return;
        }
        if (!result.duplicate && result.event) hub.broadcast(result.event);
        if (!result.duplicate && result.effect) hub.broadcast(result.effect);
        if (!result.duplicate) {
          hub.broadcast({ seq: result.seq, type: 'coins', data: { balance: result.balance } }, { seatId: seat.id });
          hub.broadcast({ seq: result.seq, type: 'leaderboard', data: { leaderboard: result.leaderboard } });
        }
        sendJson(res, 200, { ok: true, seq: result.seq, duplicate: !!result.duplicate, balance: result.balance, gift: result.gift });
        return;
      }
      if (pathname === '/api/like') {
        const result = room.addLikes(token, body.count);
        if (!result.ok) {
          sendJson(res, errorStatus(result.error), { ...result, message: errorMessage(result.error) });
          return;
        }
        sendJson(res, 200, { ok: true, likes: result.likes });
        return;
      }
      const seatId = seat.id;
      room.leave(token);
      hub.closeSeat(seatId);
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'not_found' });
      return;
    }

    await serveStatic(req, res, pathname);
  } catch (error) {
    if (error.status === 413) {
      sendJson(res, 413, { error: 'too_large', message: '请求内容过大。' });
    } else if (error.status === 400) {
      sendJson(res, 400, { error: 'bad_json', message: '请求格式不正确。' });
    } else {
      console.error('Request failed:', error);
      if (!res.headersSent) sendJson(res, 500, { error: 'server_error' });
      else res.end();
    }
  }
});

server.requestTimeout = 15000;
server.headersTimeout = 15000;
server.keepAliveTimeout = 5000;
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use. Stop the other server or run: PORT=${PORT + 1} node server.cjs\n`);
  } else {
    console.error('\n  Server error:', error.message, '\n');
  }
  process.exit(1);
});
server.on('clientError', (error, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

const tickTimer = setInterval(() => {
  const likes = room.flushLikes();
  if (likes) hub.broadcast(likes);
  for (const event of room.tick()) hub.broadcast(event);
}, 500);
const pingTimer = setInterval(() => hub.ping(), 15000);
const joinCleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of joinLimits) if (now >= entry.reset) joinLimits.delete(ip);
}, 60000);

function shutdown() {
  clearInterval(tickTimer);
  clearInterval(pingTimer);
  clearInterval(joinCleanup);
  hub.closeAll();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, '0.0.0.0', () => {
  const hostUrl = `http://127.0.0.1:${PORT}/host?key=${config.hostKey}`;
  console.log('');
  console.log('  DOUYIN LIVE STUDIO — realtime room');
  console.log(`  Host    ${hostUrl}`);
  console.log(`  Join    ${joinUrl()}   (room ${config.roomCode})`);
  for (const item of selected.candidates) {
    if (item.address === selectedIp) continue;
    console.log(`  LAN alt http://${item.address}:${PORT}/j?c=${config.roomCode}   (${item.name})`);
  }
  console.log(`  Capacity ${room.capacity} · start coins ${START_COINS} · zero dependencies`);
  console.log('');
});
