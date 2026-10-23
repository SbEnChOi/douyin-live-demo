'use strict';

function createHub(options = {}) {
  const maxBuffer = options.maxBuffer ?? 128 * 1024;
  const closeBuffer = options.closeBuffer ?? 512 * 1024;
  const clients = new Map();
  let nextId = 0;

  function format(event) {
    return `id: ${event.seq}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  }

  function close(client, reason = '') {
    if (client.closed) return;
    client.closed = true;
    clients.delete(client.id);
    try { client.res.end(); } catch {}
    try { client.onClose?.(client, reason); } catch (error) { console.error('SSE close handler:', error); }
  }

  function add(req, res, meta) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 1500\n\n');
    const client = { id: ++nextId, req, res, kind: meta.kind, seatId: meta.seatId ?? null, token: meta.token ?? null, onClose: meta.onClose, closed: false };
    clients.set(client.id, client);
    const closed = () => close(client, 'socket');
    req.on('close', closed);
    res.on('close', closed);
    res.on('error', closed);
    return client;
  }

  function raw(client, type, data, seq) {
    if (client.closed) return false;
    if (client.res.writableLength > closeBuffer) {
      close(client, 'backpressure');
      return false;
    }
    try {
      client.res.write(`id: ${seq}\nevent: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch {
      close(client, 'write');
      return false;
    }
  }

  function send(client, event) {
    if (client.closed) return false;
    if (client.res.writableLength > closeBuffer) {
      close(client, 'backpressure');
      return false;
    }
    const lowPriority = event.type === 'like' || event.type === 'presence' || event.type === 'state';
    if (lowPriority && client.res.writableLength > maxBuffer) return false;
    try {
      client.res.write(format(event));
      return true;
    } catch {
      close(client, 'write');
      return false;
    }
  }

  function broadcast(event, filter = {}) {
    let sent = 0;
    for (const client of clients.values()) {
      if (filter.kind && client.kind !== filter.kind) continue;
      if (filter.seatId && client.seatId !== filter.seatId) continue;
      if (send(client, event)) sent += 1;
    }
    return sent;
  }

  function closeSeat(seatId) {
    for (const client of [...clients.values()]) {
      if (client.seatId === seatId) close(client, 'seat');
    }
  }

  function ping() {
    for (const client of [...clients.values()]) {
      if (client.res.writableLength > maxBuffer) {
        close(client, 'backpressure');
        continue;
      }
      try { client.res.write(': ping\n\n'); } catch { close(client, 'ping'); }
    }
  }

  function closeAll() {
    for (const client of [...clients.values()]) close(client, 'shutdown');
  }

  return {
    add, send, raw, broadcast, closeSeat, ping, closeAll,
    get size() { return clients.size; },
    get audienceCount() { return [...clients.values()].filter(client => client.kind === 'audience').length; },
    get hostCount() { return [...clients.values()].filter(client => client.kind === 'host').length; },
  };
}

module.exports = { createHub };
