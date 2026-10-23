'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 4) {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function privateIpv4(value) {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 169 && parts[1] === 254);
}

function lanCandidates() {
  const found = [];
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family !== 'IPv4' || address.internal) continue;
      if (!privateIpv4(address.address)) continue;
      found.push({ name, address: address.address });
    }
  }
  const score = item => {
    const first = Number(item.address.split('.')[0]);
    const second = Number(item.address.split('.')[1]);
    let rank = 4;
    if (first === 192 && second === 168) rank = 0;
    else if (first === 10) rank = 1;
    else if (first === 172 && second >= 16 && second <= 31) rank = 2;
    else if (first === 169 && second === 254) rank = 9;
    if (/vEthernet|WSL|VirtualBox|VMware|Hyper-V|Loopback/i.test(item.name)) rank += 3;
    return rank;
  };
  return found.sort((a, b) => score(a) - score(b));
}

function loadConfig(root) {
  const file = path.join(root, '.live-config.json');
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  let changed = false;
  if (typeof data.hostKey !== 'string' || !/^[a-f0-9]{32,}$/i.test(data.hostKey)) {
    data.hostKey = crypto.randomBytes(16).toString('hex');
    changed = true;
  }
  if (typeof data.roomCode !== 'string' || !/^[A-Z2-9]{4,8}$/.test(data.roomCode)) {
    data.roomCode = randomCode(4);
    changed = true;
  }
  if (changed) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), { mode: 0o600 });
    } catch (error) {
      console.warn('Could not save .live-config.json:', error.message);
    }
  }
  return { ...data, file };
}

function argValue(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  const prefixed = process.argv.find(arg => arg.startsWith(`--${name}=`));
  return prefixed ? prefixed.slice(name.length + 3) : null;
}

function chooseLanIp(config, port) {
  const candidates = lanCandidates();
  const requested = argValue('lan-ip') || process.env.LAN_IP;
  if (requested && privateIpv4(requested)) return { ip: requested, candidates };
  return { ip: candidates[0]?.address ?? '127.0.0.1', candidates };
}

function resolveJoinBase({ ip, port, publicUrl }) {
  const override = publicUrl || argValue('public-url') || process.env.PUBLIC_URL;
  if (override) return String(override).replace(/\/+$/, '');
  return `http://${ip}:${port}`;
}

module.exports = { loadConfig, lanCandidates, chooseLanIp, resolveJoinBase, privateIpv4, argValue };
