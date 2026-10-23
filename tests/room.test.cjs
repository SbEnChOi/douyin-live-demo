'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createRoom } = require('../lib/room.cjs');

function harness(options = {}) {
  let clock = 1_000_000;
  const room = createRoom({ capacity: 2, startCoins: 1000, graceMs: 5000, now: () => clock, ...options });
  return {
    room,
    advance(ms) { clock += ms; },
    now() { return clock; },
  };
}

test('capacity is first-come-first-served and a freed seat promotes the waiter', () => {
  const { room } = harness();
  const first = room.join('client-0001', '小雨');
  const second = room.join('client-0002', '晚风');
  assert.equal(first.state, 'admitted');
  assert.equal(second.state, 'admitted');
  const third = room.join('client-0003', '阿晨');
  assert.equal(third.state, 'waiting');
  assert.equal(third.position, 1);

  assert.equal(room.leave(first.token), true);
  const promoted = room.waitStatus(third.waitToken);
  assert.equal(promoted.state, 'admitted');
  assert.ok(promoted.token);

  const connected = room.connectStream(promoted.token);
  assert.equal(connected.seat.name, '阿晨');
  assert.deepEqual(room.state().occupied, 2);
});

test('a disconnected seat keeps its slot for the grace period and survives reconnect', () => {
  const { room, advance } = harness();
  const joined = room.join('client-0001', '小雨');
  const connected = room.connectStream(joined.token);
  assert.ok(connected.seat);

  room.disconnectStream(joined.token);
  advance(4000);
  assert.equal(room.tick().length, 0);
  assert.equal(room.state().occupied, 1);

  const again = room.connectStream(joined.token);
  assert.equal(again.seat.connected, true);
  advance(10000);
  assert.equal(room.tick().length, 0);
  assert.equal(room.state().occupied, 1);
});

test('an expired seat is freed and the next waiter is promoted', () => {
  const { room, advance } = harness();
  const first = room.join('client-0001', '小雨');
  room.connectStream(first.token);
  room.join('client-0002', '晚风');
  const third = room.join('client-0003', '阿晨');
  assert.equal(third.state, 'waiting');

  room.disconnectStream(first.token);
  advance(5001);
  const events = room.tick();
  assert.ok(events.some(event => event.type === 'seat' && event.data.action === 'leave'));
  const promoted = room.waitStatus(third.waitToken);
  assert.equal(promoted.state, 'admitted');
  assert.equal(room.state().occupied, 2);
});

test('comment rate limit, duplicate text, and idempotent retry', () => {
  const { room, advance } = harness({ capacity: 1 });
  const joined = room.join('client-0001', '小雨');
  room.connectStream(joined.token);

  assert.equal(room.comment(joined.token, 'first', 'm1').ok, true);
  assert.equal(room.comment(joined.token, 'second', 'm2').ok, true);
  assert.equal(room.comment(joined.token, 'third', 'm3').ok, true);
  const limited = room.comment(joined.token, 'fourth', 'm4');
  assert.equal(limited.ok, false);
  assert.equal(limited.error, 'rate_limited');
  assert.ok(limited.retryAfterMs > 0);

  const retry = room.comment(joined.token, 'first', 'm1');
  assert.equal(retry.ok, true);
  assert.equal(retry.duplicate, true);

  advance(2001);
  assert.equal(room.comment(joined.token, 'first', 'm5').ok, false);
  assert.equal(room.comment(joined.token, 'first', 'm5').error, 'duplicate');
  assert.equal(room.comment(joined.token, 'fourth', 'm6').ok, true);
});

test('gifts validate price, balance, and client message id', () => {
  const { room, advance } = harness({ capacity: 1, startCoins: 100 });
  const joined = room.join('client-0001', '小雨');
  room.connectStream(joined.token);

  const rose = room.gift(joined.token, 'rose', 'g1');
  assert.equal(rose.ok, true);
  assert.equal(rose.balance, 95);
  const retry = room.gift(joined.token, 'rose', 'g1');
  assert.equal(retry.ok, true);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.balance, 95);

  assert.equal(room.gift(joined.token, 'nope', 'g2').error, 'invalid_gift');
  assert.equal(room.gift(joined.token, 'fire', 'g2b').error, 'invalid_gift');
  advance(1500);
  const fireworks = room.gift(joined.token, 'fireworks', 'g3');
  assert.equal(fireworks.balance, 65);
  advance(1500);
  const lantern = room.gift(joined.token, 'lantern', 'g4');
  assert.equal(lantern.balance, 5);
  advance(2000);
  const tooMuch = room.gift(joined.token, 'lantern', 'g5');
  assert.equal(tooMuch.error, 'insufficient_coins');
  assert.equal(tooMuch.balance, 5);
  assert.deepEqual(room.leaderboard()[0], { rank: 1, name: '小雨', spent: 95 });
});

test('names and comments are sanitized and length-limited', () => {
  const { room } = harness({ capacity: 1 });
  const joined = room.join('client-0001', '\u0000 小雨\u200b  ');
  assert.equal(joined.seat.name, '小雨');
  room.connectStream(joined.token);
  const text = 'ㅋ'.repeat(80);
  const result = room.comment(joined.token, text, 'm1');
  assert.equal(result.ok, true);
  assert.equal(Array.from(result.event.data.text).length, 60);
});

test('paused room rejects comments and gifts, and capacity changes promote waiters', () => {
  const { room } = harness({ capacity: 1 });
  const first = room.join('client-0001', '小雨');
  room.connectStream(first.token);
  const second = room.join('client-0002', '晚风');
  assert.equal(second.state, 'waiting');

  assert.equal(room.setPhase('paused'), true);
  assert.equal(room.comment(first.token, 'hi', 'm1').error, 'paused');
  assert.equal(room.gift(first.token, 'rose', 'g1').error, 'paused');
  assert.equal(room.setPhase('live'), true);

  assert.equal(room.setCapacity(2), 2);
  const promoted = room.waitStatus(second.waitToken);
  assert.equal(promoted.state, 'admitted');
});

test('likes are aggregated into a single event', () => {
  const { room } = harness({ capacity: 1 });
  const joined = room.join('client-0001', '小雨');
  room.connectStream(joined.token);
  assert.equal(room.addLikes(joined.token, 7).ok, true);
  assert.equal(room.addLikes(joined.token, 5).ok, true);
  const event = room.flushLikes();
  assert.equal(event.type, 'like');
  assert.equal(event.data.delta, 12);
  assert.equal(event.data.total, 12);
  assert.equal(room.flushLikes(), null);
});

test('resetAll clears seats, queue, wallets, and likes', () => {
  const { room } = harness({ capacity: 1 });
  const first = room.join('client-0001', '小雨');
  room.connectStream(first.token);
  room.join('client-0002', '晚风');
  room.addLikes(first.token, 3);
  room.flushLikes();
  room.resetAll();
  assert.equal(room.state().occupied, 0);
  assert.equal(room.state().waiting, 0);
  assert.equal(room.state().likes, 0);
  assert.equal(room.seatForToken(first.token), undefined);
});

test('duplicate active nicknames get a stable suffix', () => {
  const { room } = harness({ capacity: 3 });
  const first = room.join('client-0001', '小雨');
  const second = room.join('client-0002', '小雨');
  assert.equal(first.seat.name, '小雨');
  assert.equal(second.seat.name, '小雨 2');
  assert.equal(room.seatForToken(second.token).name, '小雨 2');
});

test('canvas gift effects are globally serialized and queued', () => {
  const { room, advance } = harness({ capacity: 2 });
  const first = room.join('client-0001', '小雨');
  const second = room.join('client-0002', '晚风');
  room.connectStream(first.token);
  room.connectStream(second.token);

  const a = room.gift(first.token, 'fireworks', 'e1');
  assert.equal(a.ok, true);
  assert.equal(a.effect.type, 'effect');
  assert.equal(a.effect.data.kind, 'fireworks');

  const b = room.gift(second.token, 'party', 'e2');
  assert.equal(b.ok, true);
  assert.equal(b.effect, null);

  advance(3999);
  assert.equal(room.tick().some(event => event.type === 'effect'), false);
  advance(1);
  const flushed = room.tick();
  const effect = flushed.find(event => event.type === 'effect');
  assert.equal(effect.data.kind, 'party');
  assert.equal(effect.data.name, '晚风');
});

test('comments accept only curated meme ids and keep the attachment metadata', () => {
  const { room } = harness({ capacity: 1 });
  const joined = room.join('client-0001', '小雨');
  room.connectStream(joined.token);
  const result = room.comment(joined.token, '', 'meme-1', 'son');
  assert.equal(result.ok, true);
  assert.equal(result.attachment.id, 'son');
  assert.match(result.attachment.src, /^\/memes\//);
  assert.equal(result.event.data.attachment.id, 'son');
  assert.equal(result.event.data.text, 'SON 😭');
  const bad = room.comment(joined.token, '', 'meme-2', 'not-allowed');
  assert.equal(bad.error, 'invalid_attachment');
});
