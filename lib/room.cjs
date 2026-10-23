'use strict';

const crypto = require('node:crypto');
const { MEME_BY_ID, publicMeme } = require('./memes.cjs');

const GIFTS = Object.freeze([
  { id: 'heart', label: '小心心', labelKo: '하트', emoji: '💗', cost: 1, effect: 'heart' },
  { id: 'rose', label: '玫瑰', labelKo: '장미', emoji: '🌹', cost: 5, effect: 'rose' },
  { id: 'hearts', label: '爱心雨', labelKo: '하트비', emoji: '💕', cost: 10, effect: 'hearts' },
  { id: 'fireworks', label: '烟花盛典', labelKo: '폭죽', emoji: '🎆', cost: 30, effect: 'fireworks' },
  { id: 'meteor', label: '流星雨', labelKo: '유성우', emoji: '🌠', cost: 40, effect: 'meteor' },
  { id: 'lantern', label: '孔明灯', labelKo: '등불', emoji: '🏮', cost: 60, effect: 'lantern' },
  { id: 'party', label: '派对时间', labelKo: '파티', emoji: '🎉', cost: 120, effect: 'party' },
  { id: 'rainbow', label: '彩虹桥', labelKo: '무지개', emoji: '🌈', cost: 180, effect: 'rainbow' },
  { id: 'rocket', label: '火箭', labelKo: '로켓', emoji: '🚀', cost: 300, effect: 'rocket' },
]);
const GIFT_BY_ID = new Map(GIFTS.map(gift => [gift.id, gift]));
const CANVAS_EFFECTS = new Set(['fireworks', 'hearts', 'meteor', 'lantern', 'party', 'rainbow', 'rocket']);
const EFFECT_GAP_MS = 4000;
const MAX_EFFECT_QUEUE = 3;

const LIMITS = Object.freeze({
  comment: { burst: 3, refillMs: 2000 },
  gift: { burst: 2, refillMs: 1500 },
  like: { burst: 60, refillMs: 250 },
});

const EVENT_RING = 300;
const MAX_WAITERS = 100;
const MAX_MSG_IDS = 100;
const MAX_NAME = 12;
const MAX_COMMENT = 60;

function cleanText(value, max) {
  const text = String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(text).slice(0, max).join('');
}

function hashLevel(clientId) {
  let hash = 0;
  for (let i = 0; i < clientId.length; i += 1) hash = (hash * 31 + clientId.charCodeAt(i)) >>> 0;
  return 8 + (hash % 21);
}

function bucket() {
  return { comment: LIMITS.comment.burst, gift: LIMITS.gift.burst, like: LIMITS.like.burst, at: {} };
}

function take(seat, kind, now) {
  const limit = LIMITS[kind];
  const state = seat.limits;
  if (state.at[kind] === undefined) state.at[kind] = now;
  const last = state.at[kind];
  const refill = Math.floor((now - last) / limit.refillMs);
  if (refill > 0) {
    state[kind] = Math.min(limit.burst, state[kind] + refill);
    state.at[kind] = last + refill * limit.refillMs;
  }
  if (state[kind] <= 0) {
    return { ok: false, retryAfterMs: Math.max(0, limit.refillMs - (now - state.at[kind])) };
  }
  state[kind] -= 1;
  return { ok: true };
}

function createRoom(options = {}) {
  const now = options.now ?? Date.now;
  const startCoins = options.startCoins ?? 1000;
  const graceMs = options.graceMs ?? 30000;
  const maxCapacity = options.maxCapacity ?? 50;
  let capacity = Math.max(1, Math.min(maxCapacity, options.capacity ?? 10));

  const seats = new Map();
  const seatByToken = new Map();
  const seatByClient = new Map();
  const waiters = [];
  const admittedWaiters = new Map();
  const wallets = new Map();
  const events = [];
  const startedAt = now();

  let seq = 0;
  let likes = 0;
  let likeBuffer = 0;
  let totalGifts = 0;
  let phase = 'live';
  let clearedSeq = 0;
  let lastEffectAt = 0;
  const effectQueue = [];

  function walletFor(clientId, name) {
    let wallet = wallets.get(clientId);
    if (!wallet) {
      wallet = { clientId, name, coins: startCoins, spent: 0 };
      wallets.set(clientId, wallet);
    }
    if (name) wallet.name = name;
    return wallet;
  }

  function record(type, data, audience = true) {
    seq += 1;
    const event = { seq, type, data: { ...data, at: now() } };
    events.push({ ...event, audience });
    while (events.length > EVENT_RING) events.shift();
    return event;
  }

  function effectPayload(item, seat) {
    return {
      kind: item.effect,
      giftId: item.id,
      label: item.label,
      emoji: item.emoji,
      name: seat.name,
      level: seat.level,
      cost: item.cost,
    };
  }

  function scheduleEffect(item, seat) {
    if (!CANVAS_EFFECTS.has(item.effect)) return null;
    const payload = effectPayload(item, seat);
    if (effectQueue.length === 0 && now() - lastEffectAt >= EFFECT_GAP_MS) {
      lastEffectAt = now();
      return record('effect', payload);
    }
    if (effectQueue.length >= MAX_EFFECT_QUEUE) return null;
    effectQueue.push(payload);
    return null;
  }

  function flushEffect() {
    if (!effectQueue.length || now() - lastEffectAt < EFFECT_GAP_MS) return null;
    const payload = effectQueue.shift();
    lastEffectAt = now();
    return record('effect', payload);
  }

  function publicGift(gift) {
    return { id: gift.id, label: gift.label, labelKo: gift.labelKo, emoji: gift.emoji, cost: gift.cost, effect: gift.effect };
  }

  function publicSeat(seat) {
    return {
      id: seat.id,
      name: seat.name,
      level: seat.level,
      connected: seat.connected,
      coins: seat.wallet.coins,
      spent: seat.wallet.spent,
      joinedAt: seat.joinedAt,
    };
  }

  function state() {
    return {
      capacity,
      occupied: seats.size,
      online: [...seats.values()].filter(seat => seat.connected).length,
      waiting: waiters.length,
      likes,
      totalGifts,
      phase,
      startCoins,
    };
  }

  function leaderboard() {
    return [...wallets.values()]
      .filter(wallet => wallet.spent > 0)
      .sort((a, b) => b.spent - a.spent || a.name.localeCompare(b.name))
      .slice(0, 5)
      .map((wallet, index) => ({ rank: index + 1, name: wallet.name, spent: wallet.spent }));
  }

  function uniqueName(name, clientId) {
    let candidate = name;
    let suffix = 2;
    while ([...seats.values()].some(seat => seat.name === candidate && seat.clientId !== clientId)) {
      candidate = `${name} ${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  function createSeat(clientId, name) {
    name = uniqueName(name, clientId);
    const wallet = walletFor(clientId, name);
    const token = crypto.randomBytes(24).toString('hex');
    const seat = {
      id: `s_${crypto.randomBytes(4).toString('hex')}`,
      token,
      clientId,
      name,
      level: hashLevel(clientId),
      wallet,
      joinedAt: now(),
      connected: false,
      streams: 0,
      expiresAt: now() + 30000,
      seen: new Map(),
      recentTexts: new Map(),
      limits: bucket(),
    };
    seats.set(seat.id, seat);
    seatByToken.set(token, seat);
    seatByClient.set(clientId, seat);
    return seat;
  }

  function presenceCounts() {
    let online = 0;
    for (const seat of seats.values()) if (seat.connected) online += 1;
    return { online, occupied: seats.size };
  }

  function forgetSeat(seat, action) {
    seats.delete(seat.id);
    seatByToken.delete(seat.token);
    if (seatByClient.get(seat.clientId) === seat) seatByClient.delete(seat.clientId);
    record('seat', { action, name: seat.name, level: seat.level, ...presenceCounts() });
    return seat;
  }

  function promote() {
    while (seats.size < capacity && waiters.length > 0) {
      const waiter = waiters.shift();
      const seat = createSeat(waiter.clientId, waiter.name);
      admittedWaiters.set(waiter.waitToken, { token: seat.token, seatId: seat.id, at: now() });
      record('seat', { action: 'promote', name: seat.name, level: seat.level, ...presenceCounts() });
    }
  }

  function publicEvent(event) {
    const { audience: _audience, ...rest } = event;
    return rest;
  }

  function tick() {
    const from = seq;
    for (const seat of [...seats.values()]) {
      if (!seat.connected && seat.expiresAt > 0 && seat.expiresAt <= now()) {
        forgetSeat(seat, 'leave');
      }
    }
    for (let i = waiters.length - 1; i >= 0; i -= 1) {
      if (now() - waiters[i].lastPoll > 60000) waiters.splice(i, 1);
    }
    if (seq > from) promote();
    flushEffect();
    return events.filter(event => event.seq > from).map(publicEvent);
  }

  function join(clientId, name) {
    clientId = cleanText(clientId, 64);
    name = cleanText(name, MAX_NAME);
    if (!clientId || !name) return { state: 'error', error: 'invalid' };

    const existing = seatByClient.get(clientId);
    if (existing) {
      existing.expiresAt = 0;
      existing.name = uniqueName(name, clientId);
      existing.wallet.name = existing.name;
      return { state: 'admitted', token: existing.token, seat: publicSeat(existing), room: state(), gifts: GIFTS.map(publicGift) };
    }
    const waiting = waiters.find(waiter => waiter.clientId === clientId);
    if (waiting) {
      waiting.lastPoll = now();
      return { state: 'waiting', waitToken: waiting.waitToken, position: waiters.indexOf(waiting) + 1, room: state() };
    }
    if (seats.size < capacity) {
      const seat = createSeat(clientId, name);
      return { state: 'admitted', token: seat.token, seat: publicSeat(seat), room: state(), gifts: GIFTS.map(publicGift) };
    }
    if (waiters.length >= MAX_WAITERS) return { state: 'error', error: 'queue_full' };
    const waiter = { waitToken: crypto.randomBytes(16).toString('hex'), clientId, name, joinedAt: now(), lastPoll: now() };
    waiters.push(waiter);
    return { state: 'waiting', waitToken: waiter.waitToken, position: waiters.length, room: state() };
  }

  function waitStatus(waitToken) {
    const admitted = admittedWaiters.get(waitToken);
    if (admitted) {
      const seat = seats.get(admitted.seatId);
      if (seat) return { state: 'admitted', token: admitted.token, seat: publicSeat(seat), room: state() };
      admittedWaiters.delete(waitToken);
    }
    const index = waiters.findIndex(waiter => waiter.waitToken === waitToken);
    if (index >= 0) {
      waiters[index].lastPoll = now();
      return { state: 'waiting', position: index + 1, room: state() };
    }
    return { state: 'expired', room: state() };
  }

  function seatForToken(token) {
    return seatByToken.get(String(token ?? ''));
  }

  function connectStream(token) {
    const seat = seatForToken(token);
    if (!seat) return null;
    const wasConnected = seat.connected;
    seat.streams += 1;
    seat.connected = true;
    seat.expiresAt = 0;
    let event = null;
    if (!wasConnected) event = record('seat', { action: 'join', name: seat.name, level: seat.level, ...presenceCounts() });
    return { seat, event };
  }

  function disconnectStream(token) {
    const seat = seatForToken(token);
    if (!seat) return;
    seat.streams = Math.max(0, seat.streams - 1);
    if (seat.streams === 0) {
      seat.connected = false;
      seat.expiresAt = now() + graceMs;
    }
  }

  function leave(token) {
    const seat = seatForToken(token);
    if (!seat) return false;
    forgetSeat(seat, 'leave');
    promote();
    return true;
  }

  function kick(seatId) {
    const seat = seats.get(String(seatId ?? ''));
    if (!seat) return false;
    forgetSeat(seat, 'kick');
    promote();
    return true;
  }

  function comment(token, text, clientMsgId, attachmentId) {
    const seat = seatForToken(token);
    if (!seat) return { ok: false, error: 'no_seat' };
    if (phase !== 'live') return { ok: false, error: 'paused' };
    let attachment = null;
    if (attachmentId) {
      attachment = MEME_BY_ID.get(String(attachmentId));
      if (!attachment) return { ok: false, error: 'invalid_attachment' };
    }
    text = cleanText(text, MAX_COMMENT);
    if (!text && attachment) text = attachment.title;
    if (!text) return { ok: false, error: 'invalid' };

    const msgId = cleanText(clientMsgId, 64);
    if (msgId) {
      const seen = seat.seen.get(msgId);
      if (seen) return { ok: true, duplicate: true, seq: seen.seq };
    }
    const recent = seat.recentTexts.get(text);
    if (recent && now() - recent < 10000) return { ok: false, error: 'duplicate' };
    const allowed = take(seat, 'comment', now());
    if (!allowed.ok) return { ok: false, error: 'rate_limited', retryAfterMs: allowed.retryAfterMs };

    const event = record('comment', {
      clientMsgId: msgId, seatId: seat.id, name: seat.name, level: seat.level, text,
      attachment: publicMeme(attachment),
    });
    seat.recentTexts.set(text, now());
    while (seat.recentTexts.size > 20) seat.recentTexts.delete(seat.recentTexts.keys().next().value);
    if (msgId) remember(seat, msgId, event.seq);
    return { ok: true, seq: event.seq, event, attachment: publicMeme(attachment) };
  }

  function remember(seat, msgId, seqValue) {
    seat.seen.set(msgId, { seq: seqValue, at: now() });
    while (seat.seen.size > MAX_MSG_IDS) seat.seen.delete(seat.seen.keys().next().value);
  }

  function gift(token, giftId, clientMsgId) {
    const seat = seatForToken(token);
    if (!seat) return { ok: false, error: 'no_seat' };
    if (phase !== 'live') return { ok: false, error: 'paused' };
    const item = GIFT_BY_ID.get(String(giftId ?? ''));
    if (!item) return { ok: false, error: 'invalid_gift' };

    const msgId = cleanText(clientMsgId, 64);
    if (msgId) {
      const seen = seat.seen.get(msgId);
      if (seen) return { ok: true, duplicate: true, seq: seen.seq, balance: seat.wallet.coins, gift: publicGift(item) };
    }
    const allowed = take(seat, 'gift', now());
    if (!allowed.ok) return { ok: false, error: 'rate_limited', retryAfterMs: allowed.retryAfterMs };
    if (seat.wallet.coins < item.cost) return { ok: false, error: 'insufficient_coins', balance: seat.wallet.coins };

    seat.wallet.coins -= item.cost;
    seat.wallet.spent += item.cost;
    seat.wallet.name = seat.name;
    totalGifts += 1;
    const event = record('gift', {
      clientMsgId: msgId, seatId: seat.id, name: seat.name, level: seat.level,
      giftId: item.id, label: item.label, labelKo: item.labelKo, emoji: item.emoji,
      cost: item.cost, effect: item.effect,
    });
    const effectEvent = scheduleEffect(item, seat);
    if (msgId) remember(seat, msgId, event.seq);
    return { ok: true, seq: event.seq, balance: seat.wallet.coins, gift: publicGift(item), event, effect: effectEvent, leaderboard: leaderboard() };
  }

  function addLikes(token, count) {
    const seat = seatForToken(token);
    if (!seat) return { ok: false, error: 'no_seat' };
    if (phase !== 'live') return { ok: false, error: 'paused' };
    const n = Math.max(1, Math.min(50, Math.round(Number(count) || 1)));
    const allowed = take(seat, 'like', now());
    if (!allowed.ok) return { ok: false, error: 'rate_limited', retryAfterMs: allowed.retryAfterMs };
    likes += n;
    likeBuffer += n;
    return { ok: true, likes };
  }

  function flushLikes() {
    if (likeBuffer <= 0) return null;
    const delta = likeBuffer;
    likeBuffer = 0;
    return record('like', { total: likes, delta });
  }

  function hostComment(text) {
    text = cleanText(text, MAX_COMMENT);
    if (!text) return { ok: false, error: 'invalid' };
    return { ok: true, event: record('comment', { clientMsgId: '', seatId: 'host', name: '主播', level: 99, text }) };
  }

  function setPhase(next) {
    if (!['live', 'paused', 'ended'].includes(next)) return false;
    phase = next;
    if (next !== 'live') effectQueue.length = 0;
    record('phase', { phase });
    return true;
  }

  function setCapacity(next) {
    const value = Math.max(1, Math.min(maxCapacity, Math.round(Number(next) || capacity)));
    capacity = value;
    promote();
    record('state', state());
    return capacity;
  }

  function clearChat() {
    clearedSeq = seq;
    record('clear', { scope: 'chat' });
    return true;
  }

  function resetScores() {
    for (const wallet of wallets.values()) {
      wallet.coins = startCoins;
      wallet.spent = 0;
    }
    likes = 0;
    likeBuffer = 0;
    totalGifts = 0;
    effectQueue.length = 0;
    lastEffectAt = 0;
    record('reset', { scope: 'scores' });
    record('state', state());
    return true;
  }

  function resetAll() {
    for (const seat of [...seats.values()]) forgetSeat(seat, 'reset');
    waiters.length = 0;
    admittedWaiters.clear();
    wallets.clear();
    likes = 0;
    likeBuffer = 0;
    totalGifts = 0;
    clearedSeq = seq;
    effectQueue.length = 0;
    lastEffectAt = 0;
    record('reset', { scope: 'all' });
    record('state', state());
    return true;
  }

  function recentComments(limit = 20) {
    return events
      .filter(event => event.audience && event.type === 'comment' && event.seq > clearedSeq)
      .slice(-limit)
      .map(publicEvent);
  }

  function replay(lastEventId, { audience = true, limit = 100 } = {}) {
    const last = Number(lastEventId) || 0;
    return events
      .filter(event => event.seq > last && (!audience || event.audience))
      .slice(-limit)
      .map(({ audience: _audience, ...event }) => event);
  }

  function hello(token, kind) {
    const seat = kind === 'audience' ? seatForToken(token) : null;
    return {
      seq,
      room: state(),
      gifts: GIFTS.map(publicGift),
      leaderboard: leaderboard(),
      recent: recentComments(20),
      me: seat ? { seat: publicSeat(seat), balance: seat.wallet.coins } : null,
    };
  }

  function snapshot() {
    return {
      room: state(),
      seats: [...seats.values()].sort((a, b) => a.joinedAt - b.joinedAt).map(publicSeat),
      waiters: waiters.map((waiter, index) => ({ position: index + 1, name: waiter.name, joinedAt: waiter.joinedAt })),
      leaderboard: leaderboard(),
      gifts: GIFTS.map(publicGift),
      startedAt,
    };
  }

  return {
    join, waitStatus, seatForToken, connectStream, disconnectStream, leave, kick,
    comment, gift, addLikes, flushLikes, hostComment, tick,
    setPhase, setCapacity, clearChat, resetScores, resetAll,
    state, snapshot, leaderboard, recentComments, replay, hello,
    get capacity() { return capacity; },
    get phase() { return phase; },
    get seq() { return seq; },
  };
}

module.exports = { createRoom, GIFTS, GIFT_BY_ID, cleanText };
