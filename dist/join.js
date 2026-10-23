'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const NAMES = ['小雨', '晚风', '阿晨', '星星', '小鹿', '可可', '月亮', '奶茶', '橙子', '小满'];
  const state = {
    config: null,
    roomCode: '',
    clientId: '',
    name: '',
    token: '',
    waitToken: '',
    stream: null,
    seatId: '',
    capacity: 10,
    online: 0,
    likes: 0,
    balance: 0,
    startCoins: 1000,
    phase: 'live',
    gifts: [],
    memes: [],
    seenSeq: new Set(),
    seenMsg: new Set(),
    pending: new Map(),
    likeQueue: 0,
    likeTimer: 0,
    waitTimer: 0,
    reconnectTimer: 0,
    failedAttempts: 0,
    joining: false,
  };

  function safeStorage(storage, key, value) {
    try {
      if (value === undefined) return storage.getItem(key);
      storage.setItem(key, value);
      return value;
    } catch { return null; }
  }

  function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function toast(message, ms = 2200) {
    const element = $('toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove('visible'), ms);
  }

  function show(view) {
    for (const id of ['loadingView', 'entryView', 'waitView', 'roomView', 'endedView']) {
      $(id).hidden = id !== view;
    }
    document.body.classList.toggle('in-room', view === 'roomView');
    if (view !== 'roomView') closeMemeSheet();
  }

  function setStatus(text, offline = false) {
    const element = $('connectionStatus');
    element.classList.toggle('offline', offline);
    element.innerHTML = `<i></i> ${text}`;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    let body = null;
    try { body = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(body?.message || body?.error || `请求失败 (${response.status})`);
      error.status = response.status;
      error.code = body?.error;
      error.body = body;
      throw error;
    }
    return body;
  }

  function setCode(code) {
    state.roomCode = String(code || '').toUpperCase();
    $('roomCode').textContent = state.roomCode || '----';
  }

  function applyRoom(room) {
    if (!room) return;
    state.capacity = Number(room.capacity) || state.capacity;
    state.online = Number(room.online) || 0;
    state.likes = Number(room.likes) || 0;
    state.phase = room.phase || state.phase;
    if (Number(room.startCoins)) state.startCoins = Number(room.startCoins);
    $('seatCapacity').textContent = String(state.capacity);
    $('onlineCount').textContent = String(state.online || room.occupied || 1);
    $('likeCount').textContent = compact(state.likes);
    $('likeButtonCount').textContent = compact(state.likes);
    $('waitCapacity').textContent = String(state.capacity);
    $('entryCapacity').textContent = String(state.capacity);
    applyPhase();
  }

  function compact(value) {
    const number = Number(value) || 0;
    if (number >= 10000) return `${(number / 10000).toFixed(1)}万`;
    return String(number);
  }

  function applyBalance() {
    $('coinBalance').textContent = compact(state.balance);
    for (const button of document.querySelectorAll('.gift-button')) {
      const cost = Number(button.dataset.cost) || 0;
      button.disabled = state.phase !== 'live' || state.balance < cost;
    }
  }

  function applyPhase() {
    const paused = state.phase !== 'live';
    $('commentInput').disabled = paused;
    $('sendButton').disabled = paused;
    $('likeButton').disabled = paused;
    $('gifButton').disabled = paused;
    for (const button of document.querySelectorAll('.gift-button')) {
      button.disabled = paused || state.balance < (Number(button.dataset.cost) || 0);
    }
    if (state.phase === 'paused') { closeMemeSheet(); setStatus('直播已暂停'); }
    if (state.phase === 'ended') {
      closeStream();
      show('endedView');
    }
  }

  function buildGifts(gifts) {
    state.gifts = Array.isArray(gifts) ? gifts : [];
    const grid = $('giftGrid');
    grid.replaceChildren();
    for (const gift of state.gifts) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `gift-button${gift.id === 'party' || gift.id === 'rocket' ? ' hot' : ''}`;
      button.dataset.gift = gift.id;
      button.dataset.cost = String(gift.cost);
      const emoji = document.createElement('span');
      emoji.className = 'gift-emoji';
      emoji.textContent = gift.emoji;
      const name = document.createElement('span');
      name.className = 'gift-name';
      name.textContent = gift.label;
      const cost = document.createElement('span');
      cost.className = 'gift-cost';
      cost.textContent = `${gift.cost} 币`;
      button.append(emoji, name, cost);
      button.addEventListener('click', () => sendGift(gift));
      grid.append(button);
    }
    applyBalance();
  }

  function buildMemes(memes) {
    state.memes = Array.isArray(memes) ? memes : [];
    $('gifButton').hidden = state.memes.length === 0;
    const grid = $('memeGrid');
    grid.replaceChildren();
    for (const meme of state.memes) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'meme-choice';
      const image = document.createElement('img');
      image.src = meme.src;
      image.alt = meme.title;
      image.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = meme.title;
      const badge = document.createElement('span');
      badge.className = 'meme-badge';
      badge.textContent = meme.kind === 'gif' ? 'GIF' : 'IMG';
      button.append(image, badge, label);
      button.addEventListener('click', () => sendMeme(meme));
      grid.append(button);
    }
  }

  function openMemeSheet() {
    if (!state.memes.length) return;
    $('memeBackdrop').hidden = false;
    $('memeSheet').hidden = false;
  }

  function closeMemeSheet() {
    $('memeBackdrop').hidden = true;
    $('memeSheet').hidden = true;
  }

  function feedRow(text, name, options = {}) {
    const row = document.createElement('div');
    row.className = `feed-row${options.self ? ' self' : ''}${options.gift ? ' gift' : ''}${options.system ? ' system' : ''}${options.pending ? ' pending' : ''}${options.failed ? ' failed' : ''}`;
    if (options.system) {
      row.textContent = text;
    } else {
      const nameElement = document.createElement('span');
      nameElement.className = 'feed-name';
      nameElement.textContent = `${name}：`;
      row.append(nameElement);
      if (options.attachment) {
        const image = document.createElement('img');
        image.className = 'feed-gif';
        image.src = options.attachment.src;
        image.alt = options.attachment.title || 'meme';
        image.loading = 'lazy';
        image.addEventListener('load', () => scrollFeed(true));
        row.append(image);
        if (text && text !== options.attachment.title) {
          const caption = document.createElement('span');
          caption.className = 'feed-caption';
          caption.textContent = text;
          row.append(caption);
        }
      } else {
        const textElement = document.createElement('span');
        textElement.textContent = text;
        row.append(textElement);
      }
      if (options.gift) row.prepend(document.createTextNode('🎁 '));
    }
    return row;
  }

  function scrollFeed(force = false) {
    const feed = $('feed');
    const pinned = feed.scrollHeight - feed.clientHeight - feed.scrollTop < 48;
    if (force || pinned) feed.scrollTop = feed.scrollHeight;
  }

  function appendFeed(row, force = false) {
    const feed = $('feed');
    feed.append(row);
    while (feed.children.length > 80) feed.firstElementChild.remove();
    scrollFeed(force);
  }

  function appendComment(data) {
    if (!data) return;
    const key = data._seq ? `s${data._seq}` : `${data.seatId}:${data.at}:${data.text}`;
    if (state.seenSeq.has(key)) return;
    state.seenSeq.add(key);
    while (state.seenSeq.size > 300) state.seenSeq.delete(state.seenSeq.values().next().value);
    $('feed').querySelector('.empty-hint')?.remove();
    if (data.clientMsgId && state.pending.has(data.clientMsgId)) {
      state.pending.get(data.clientMsgId).remove();
      state.pending.delete(data.clientMsgId);
    }
    const self = data.seatId === state.seatId;
    appendFeed(feedRow(data.text, data.name, { self, attachment: data.attachment }), self);
  }

  function appendSystem(text, extraClass = '') {
    const row = feedRow(text, '', { system: true });
    if (extraClass) row.classList.add(extraClass);
    appendFeed(row);
  }

  function applyLeaderboard(leaderboard) {
    if (!Array.isArray(leaderboard) || !leaderboard.length) return;
    const top = leaderboard[0];
    const row = $('feed').querySelector('.leaderboard-row');
    const text = `打赏榜 1位 · ${top.name} · ${top.spent} 币`;
    if (row) { row.textContent = text; return; }
    const element = feedRow(text, '', { system: true });
    element.classList.add('leaderboard-row');
    $('feed').prepend(element);
  }

  function openStream() {
    closeStream();
    if (!state.token) return;
    setStatus('连接中…');
    const source = new EventSource(`/api/stream?t=${encodeURIComponent(state.token)}`);
    state.stream = source;
    source.addEventListener('open', () => {
      state.failedAttempts = 0;
      setStatus('已连接');
    });
    source.addEventListener('hello', event => {
      const data = JSON.parse(event.data);
      state.seatId = data.me?.seat?.id || state.seatId;
      state.balance = Number(data.me?.balance ?? state.balance);
      state.startCoins = Number(data.room?.startCoins ?? state.startCoins);
      applyRoom(data.room);
      applyBalance();
      buildGifts(data.gifts);
      applyLeaderboard(data.leaderboard);
      if (Array.isArray(data.recent)) {
        $('feed').replaceChildren();
        for (const item of data.recent) appendComment({ ...item.data, _seq: item.seq });
        if (!data.recent.length) appendSystem('还没有评论，来发第一条吧 ✨', 'empty-hint');
      }
      setStatus('已连接');
    });
    source.addEventListener('comment', event => appendComment({ ...JSON.parse(event.data), _seq: Number(event.lastEventId) }));
    source.addEventListener('gift', event => {
      const data = JSON.parse(event.data);
      appendFeed(feedRow(`${data.emoji} ${data.label} ×1`, data.name, { gift: true }), true);
      if (data.effect === 'heart' || data.effect === 'rose') floatHeart();
    });
    source.addEventListener('like', event => {
      const data = JSON.parse(event.data);
      state.likes = Number(data.total) || state.likes;
      $('likeCount').textContent = compact(state.likes);
      $('likeButtonCount').textContent = compact(state.likes);
    });
    source.addEventListener('seat', event => {
      const data = JSON.parse(event.data);
      if (typeof data.online === 'number') {
        state.online = data.online;
        $('onlineCount').textContent = String(state.online);
      }
      if (data.action === 'join') appendSystem(`${data.name} 进入了直播间 ✨`);
      else if (data.action === 'leave' || data.action === 'kick') appendSystem(data.action === 'kick' ? `${data.name} 被请出了直播间` : `${data.name} 离开了直播间`);
    });
    source.addEventListener('coins', event => {
      const data = JSON.parse(event.data);
      state.balance = Number(data.balance) || 0;
      applyBalance();
    });
    source.addEventListener('leaderboard', event => {
      const data = JSON.parse(event.data);
      applyLeaderboard(data.leaderboard);
    });
    source.addEventListener('state', event => {
      const data = JSON.parse(event.data);
      applyRoom(data);
    });
    source.addEventListener('phase', event => {
      const data = JSON.parse(event.data);
      state.phase = data.phase || state.phase;
      applyPhase();
    });
    source.addEventListener('clear', () => {
      $('feed').replaceChildren();
      appendSystem('聊天已清空');
    });
    source.addEventListener('reset', event => {
      const data = JSON.parse(event.data);
      if (data.scope === 'scores') {
        state.balance = state.startCoins;
        applyBalance();
        $('feed').querySelector('.leaderboard-row')?.remove();
        appendSystem('分数和直播币已重置');
      } else {
        closeStream();
        state.token = '';
        safeStorage(sessionStorage, 'douyin_token', '');
        show('endedView');
      }
    });
    source.addEventListener('error', () => {
      if (source.readyState === EventSource.CLOSED) {
        setStatus('连接已断开 · 点击重连', true);
        return;
      }
      state.failedAttempts += 1;
      setStatus('重新连接中…', true);
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = setTimeout(() => {
        if (state.failedAttempts >= 2) recover();
      }, 9000);
    });
  }

  function closeStream() {
    clearTimeout(state.reconnectTimer);
    if (state.stream) {
      state.stream.close();
      state.stream = null;
    }
  }

  async function join() {
    if (state.joining) return;
    const nameInput = $('nameInput');
    const name = String(nameInput.value || '').trim().slice(0, 12);
    if (!name) { toast('请输入昵称。'); nameInput.focus(); return; }
    state.joining = true;
    $('joinButton').disabled = true;
    $('nameInput').disabled = true;
    try {
      const result = await api('/api/join', {
        method: 'POST',
        body: JSON.stringify({ c: state.roomCode, clientId: state.clientId, name }),
      });
      state.name = name;
      safeStorage(localStorage, 'douyin_name', name);
      if (result.state === 'waiting') {
        state.waitToken = result.waitToken;
        safeStorage(sessionStorage, 'douyin_wait', state.waitToken);
        state.capacity = result.room?.capacity || state.capacity;
        applyRoom(result.room);
        $('waitPosition').textContent = String(result.position || 1);
        show('waitView');
        scheduleWait(1000);
        return;
      }
      state.token = result.token;
      state.seatId = result.seat?.id || '';
      state.balance = Number(result.seat?.coins ?? state.balance);
      safeStorage(sessionStorage, 'douyin_token', state.token);
      safeStorage(sessionStorage, 'douyin_wait', '');
      state.phase = result.room?.phase || 'live';
      applyRoom(result.room);
      show('roomView');
      $('feed').replaceChildren();
      appendSystem(`已进入直播间 · ${name}`);
      openStream();
      applyBalance();
    } catch (error) {
      if (error.code === 'bad_code') {
        toast('二维码已失效，请重新扫描。', 3500);
      } else if (error.status === 429) {
        toast('请稍后再试。');
      } else {
        toast(error.message || '入场失败。');
      }
      show('entryView');
    } finally {
      state.joining = false;
      $('joinButton').disabled = false;
      $('nameInput').disabled = false;
    }
  }

  function scheduleWait(delay = 2200) {
    clearTimeout(state.waitTimer);
    state.waitTimer = setTimeout(checkWait, delay);
  }

  async function checkWait() {
    if (!state.waitToken) return;
    try {
      const result = await api(`/api/wait?w=${encodeURIComponent(state.waitToken)}`);
      applyRoom(result.room);
      if (result.state === 'admitted') {
        state.token = result.token;
        state.seatId = result.seat?.id || '';
        state.balance = Number(result.seat?.coins ?? state.balance);
        safeStorage(sessionStorage, 'douyin_token', state.token);
        safeStorage(sessionStorage, 'douyin_wait', '');
        state.waitToken = '';
        show('roomView');
        $('feed').replaceChildren();
        appendSystem('有空位了，正在入场 ✨');
        openStream();
        applyBalance();
        return;
      }
      if (result.state === 'expired') {
        state.waitToken = '';
        safeStorage(sessionStorage, 'douyin_wait', '');
        show('entryView');
        toast('排队已过期，请重新入场。', 3000);
        return;
      }
      $('waitPosition').textContent = String(result.position || 1);
      scheduleWait(2200);
    } catch (error) {
      if (error.status === 410) {
        state.waitToken = '';
        show('entryView');
        toast('排队已过期，请重新入场。', 3000);
        return;
      }
      scheduleWait(3500);
    }
  }

  async function recover() {
    if (state.joining || !state.name) return;
    closeStream();
    setStatus('正在重新连接…', true);
    try {
      const result = await api('/api/join', {
        method: 'POST',
        body: JSON.stringify({ c: state.roomCode, clientId: state.clientId, name: state.name }),
      });
      if (result.state === 'waiting') {
        state.waitToken = result.waitToken;
        safeStorage(sessionStorage, 'douyin_wait', state.waitToken);
        $('waitPosition').textContent = String(result.position || 1);
        show('waitView');
        scheduleWait(1200);
        return;
      }
      state.token = result.token;
      state.seatId = result.seat?.id || '';
      state.balance = Number(result.seat?.coins ?? state.balance);
      state.failedAttempts = 0;
      safeStorage(sessionStorage, 'douyin_token', state.token);
      applyRoom(result.room);
      show('roomView');
      openStream();
    } catch {
      state.failedAttempts += 1;
      setStatus('连接已断开 · 点击重连', true);
    }
  }

  function postComment({ text = '', attachment = null, restoreText = false }) {
    if (state.phase !== 'live') { toast('直播暂时停止了。'); return; }
    const clientMsgId = uuid();
    const pending = feedRow(text || attachment?.title || '', '我', { self: true, pending: true, attachment });
    state.pending.set(clientMsgId, pending);
    $('feed').querySelector('.empty-hint')?.remove();
    appendFeed(pending, true);
    api('/api/comment', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ text, clientMsgId, attachment: attachment?.id || null }),
    }).then(() => {
      pending.classList.remove('pending');
    }).catch(error => {
      pending.classList.remove('pending');
      pending.classList.add('failed');
      state.pending.delete(clientMsgId);
      toast(error.message || '评论发送失败。');
      if (restoreText) {
        const input = $('commentInput');
        if (!input.value) input.value = text;
      }
    });
  }

  function sendComment(event) {
    event.preventDefault();
    if (state.phase !== 'live') { toast('直播暂时停止了。'); return; }
    const input = $('commentInput');
    const text = String(input.value || '').trim().slice(0, 60);
    if (!text) return;
    input.value = '';
    postComment({ text, restoreText: true });
  }

  function sendMeme(meme) {
    if (state.phase !== 'live') { toast('直播暂时停止了。'); return; }
    closeMemeSheet();
    postComment({ attachment: meme });
  }

  function sendGift(gift) {
    if (state.phase !== 'live') { toast('直播暂时停止了。'); return; }
    if (state.balance < gift.cost) { toast('直播币不足。'); return; }
    const buttons = [...document.querySelectorAll('.gift-button')];
    for (const button of buttons) button.disabled = true;
    const clientMsgId = uuid();
    api('/api/gift', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ giftId: gift.id, clientMsgId }),
    }).then(result => {
      state.balance = Number(result.balance ?? state.balance);
      applyBalance();
      floatHeart(gift.emoji);
      toast(`${gift.emoji} ${gift.label} 已送出！`);
    }).catch(error => {
      toast(error.message || '送礼失败。');
      applyBalance();
    }).finally(() => {
      setTimeout(applyBalance, 1600);
    });
  }

  function floatHeart(emoji = '♥') {
    const heart = document.createElement('span');
    heart.className = 'join-heart';
    heart.textContent = emoji;
    heart.style.left = `${10 + Math.random() * 22}px`;
    heart.style.setProperty('--drift', `${Math.random() * 26 - 13}px`);
    heart.style.setProperty('--tilt', `${Math.random() * 30 - 15}deg`);
    $('heartLayer').append(heart);
    heart.addEventListener('animationend', () => heart.remove());
  }

  function queueLike() {
    if (state.phase !== 'live') return;
    state.likes += 1;
    $('likeCount').textContent = compact(state.likes);
    $('likeButtonCount').textContent = compact(state.likes);
    floatHeart();
    state.likeQueue += 1;
    clearTimeout(state.likeTimer);
    state.likeTimer = setTimeout(flushLikes, 900);
  }

  async function flushLikes() {
    const count = state.likeQueue;
    state.likeQueue = 0;
    if (!count) return;
    try {
      await api('/api/like', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({ count }),
      });
    } catch {}
  }

  async function boot() {
    const params = new URLSearchParams(location.search);
    const urlCode = String(params.get('c') || '').toUpperCase();
    state.clientId = safeStorage(localStorage, 'douyin_client') || uuid();
    safeStorage(localStorage, 'douyin_client', state.clientId);
    state.name = safeStorage(localStorage, 'douyin_name') || '';
    $('nameInput').value = state.name || NAMES[Math.floor(Math.random() * NAMES.length)];

    try {
      state.config = await api('/api/config');
      setCode(urlCode || state.config.roomCode);
      state.capacity = state.config.capacity;
      state.startCoins = Number(state.config.room?.startCoins) || 1000;
      state.phase = state.config.room?.phase || 'live';
      state.gifts = state.config.gifts || [];
      state.memes = state.config.memes || [];
      buildGifts(state.gifts);
      buildMemes(state.memes);
      applyRoom(state.config.room);
      $('entryCapacity').textContent = String(state.config.capacity);
    } catch {
      show('entryView');
      toast('无法连接服务器，请确认笔记本上的服务已启动。', 4000);
      return;
    }

    const savedToken = safeStorage(sessionStorage, 'douyin_token');
    const savedWait = safeStorage(sessionStorage, 'douyin_wait');
    if (savedWait) {
      state.waitToken = savedWait;
      show('waitView');
      scheduleWait(600);
      return;
    }
    if (savedToken && state.name) {
      state.token = savedToken;
      try {
        await recover();
        return;
      } catch {}
    }
    show('entryView');
    if (!state.name) $('nameInput').select();
  }

  $('joinButton').addEventListener('click', join);
  $('nameInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); join(); }
  });
  $('commentForm').addEventListener('submit', sendComment);
  $('likeButton').addEventListener('click', queueLike);
  $('gifButton').addEventListener('click', openMemeSheet);
  $('memeClose').addEventListener('click', closeMemeSheet);
  $('memeBackdrop').addEventListener('click', closeMemeSheet);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMemeSheet();
  });
  $('waitRetry').addEventListener('click', () => { clearTimeout(state.waitTimer); checkWait(); });
  $('restartButton').addEventListener('click', () => {
    state.token = '';
    state.waitToken = '';
    safeStorage(sessionStorage, 'douyin_token', '');
    safeStorage(sessionStorage, 'douyin_wait', '');
    show('entryView');
  });
  $('connectionStatus').addEventListener('click', recover);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.token && !state.stream) recover();
  });

  boot();
})();
