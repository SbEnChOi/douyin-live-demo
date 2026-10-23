'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const state = {
    snapshot: null,
    room: null,
    joinUrl: '',
    roomCode: '',
    stream: null,
    cameraStream: null,
    effects: null,
    giftTimer: 0,
    arrivalTimer: 0,
    toastTimer: 0,
    opTimer: 0,
    opPinned: false,
    reconnecting: false,
    seenChat: new Set(),
  };

  const compact = value => {
    const number = Number(value) || 0;
    if (number >= 10000) return `${(number / 10000).toFixed(1)}万`;
    return String(number);
  };

  function toast(message, ms = 2400) {
    const element = $('stageToast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => element.classList.remove('visible'), ms);
  }

  function setOpStatus(text, offline = false) {
    const element = $('opStatus');
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
      throw error;
    }
    return body;
  }

  function refreshQr(url) {
    if (url) state.joinUrl = url;
    const stamp = Date.now();
    const src = `/api/qr.svg?v=${stamp}`;
    $('qrImage').src = src;
    $('setupQr').src = src;
  }

  function applyRoom(room) {
    if (!room) return;
    state.room = room;
    $('likesDisplay').textContent = compact(room.likes);
    $('viewerDisplay').textContent = compact(room.online);
    $('qrSeats').textContent = `${room.occupied}/${room.capacity}${room.waiting ? ` +${room.waiting}` : ''}`;
    $('setupSeats').textContent = String(room.occupied);
    $('setupCapacity').textContent = String(room.capacity);
    $('setupWaiting').textContent = room.waiting ? `· ${room.waiting} 排队` : '';
    if (room.phase === 'paused') setOpStatus('已暂停');
    else if (room.phase === 'ended') setOpStatus('已结束');
    else setOpStatus(state.reconnecting ? '重连中' : '实时连接', state.reconnecting);
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    state.snapshot = snapshot;
    if (snapshot.room) applyRoom(snapshot.room);
    if (snapshot.leaderboard) renderRank(snapshot.leaderboard);
    if (snapshot.joinUrl) refreshQr(snapshot.joinUrl);
    if (snapshot.roomCode) {
      state.roomCode = snapshot.roomCode;
      $('qrCode').textContent = snapshot.roomCode;
      $('setupCode').textContent = snapshot.roomCode;
    }
  }

  function ensureChatPlaceholder() {
    if ($('chatFeed').children.length) return;
    const placeholder = document.createElement('div');
    placeholder.className = 'chat-row chat-placeholder';
    placeholder.textContent = '还没有评论，扫码邀请朋友。';
    $('chatFeed').append(placeholder);
  }

  function addComment(data, seq) {
    if (!data) return;
    const key = seq ? `s${seq}` : '';
    if (key && state.seenChat.has(key)) return;
    if (key) {
      state.seenChat.add(key);
      while (state.seenChat.size > 300) state.seenChat.delete(state.seenChat.values().next().value);
    }
    const placeholder = $('chatFeed').querySelector('.chat-placeholder');
    if (placeholder) placeholder.remove();
    const row = document.createElement('div');
    row.className = `chat-row${data.seatId === 'host' ? ' is-host' : ''}`;
    const level = document.createElement('span');
    level.className = 'level';
    level.textContent = `♬ ${data.level ?? 0}`;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = `${data.name}：`;
    const content = document.createElement('span');
    content.textContent = data.text;
    row.append(level, name);
    if (data.attachment) {
      const image = document.createElement('img');
      image.className = 'chat-gif';
      image.src = data.attachment.src;
      image.alt = data.attachment.title || 'meme';
      image.loading = 'lazy';
      image.addEventListener('load', () => {
        const area = $('chatArea');
        area.scrollTop = area.scrollHeight;
      });
      row.append(image);
      if (data.text && data.text !== data.attachment.title) {
        const caption = document.createElement('small');
        caption.className = 'chat-gif-caption';
        caption.textContent = data.text;
        row.append(caption);
      }
    } else {
      row.append(content);
    }
    $('chatFeed').append(row);
    while ($('chatFeed').children.length > 120) $('chatFeed').firstElementChild.remove();
    const area = $('chatArea');
    area.scrollTop = area.scrollHeight;
  }

  function renderRecent(recent) {
    $('chatFeed').replaceChildren();
    state.seenChat.clear();
    if (Array.isArray(recent)) for (const item of recent) addComment(item.data, item.seq);
    ensureChatPlaceholder();
  }

  function renderRank(leaderboard) {
    const list = $('rankList');
    list.replaceChildren();
    if (!Array.isArray(leaderboard) || !leaderboard.length) {
      const empty = document.createElement('p');
      empty.textContent = '还没有打赏，等你来支持 ❤️';
      list.append(empty);
      return;
    }
    for (const item of leaderboard) {
      const row = document.createElement('div');
      row.className = 'rank-row';
      const number = document.createElement('span');
      number.className = 'rank-no';
      number.textContent = String(item.rank);
      const name = document.createElement('span');
      name.className = 'rank-name';
      name.textContent = item.name;
      const spent = document.createElement('span');
      spent.className = 'rank-spent';
      spent.textContent = `${item.spent} 币`;
      row.append(number, name, spent);
      list.append(row);
    }
  }

  function showArrival(name) {
    const arrival = $('arrival');
    arrival.textContent = `✨ ${name} 进入了直播间`;
    arrival.hidden = false;
    clearTimeout(state.arrivalTimer);
    state.arrivalTimer = setTimeout(() => { arrival.hidden = true; }, 4000);
  }

  function heart() {
    const field = $('heartField');
    if (field.children.length > 60) return;
    const element = document.createElement('span');
    element.className = 'floating-heart';
    element.textContent = '♥';
    element.style.color = ['#ff436d', '#ff86ad', '#ffb7cc', '#ff6589', '#d898ff'][Math.floor(Math.random() * 5)];
    element.style.left = `${Math.random() * 42}%`;
    element.style.setProperty('--drift', `${Math.random() * 30 - 15}px`);
    element.style.setProperty('--tilt', `${Math.random() * 45 - 22}deg`);
    field.append(element);
    element.addEventListener('animationend', () => element.remove());
  }

  function showGift(data) {
    $('giftPerson').textContent = data.name;
    $('giftName').textContent = data.label;
    $('giftEmoji').textContent = data.emoji;
    $('giftCount').textContent = '× 1';
    const overlay = $('giftOverlay');
    overlay.hidden = false;
    clearTimeout(state.giftTimer);
    state.giftTimer = setTimeout(() => { overlay.hidden = true; }, 4000);
  }

  function handleGift(data) {
    showGift(data);
    if (data.effect === 'heart') {
      for (let i = 0; i < 4; i += 1) setTimeout(heart, i * 80);
    } else if (data.effect === 'rose') {
      for (let i = 0; i < 3; i += 1) setTimeout(heart, i * 100);
    }
  }

  function handleEffect(data) {
    if (!data || !state.effects) return;
    if (data.at && Date.now() - data.at > 8000) return;
    state.effects.reaction(data.kind);
  }

  function openStream() {
    closeStream();
    setOpStatus('连接中');
    const source = new EventSource('/api/host/stream');
    state.stream = source;
    source.addEventListener('open', () => {
      state.reconnecting = false;
      setOpStatus('实时连接');
    });
    source.addEventListener('hello', event => {
      const data = JSON.parse(event.data);
      state.reconnecting = false;
      applySnapshot({ ...data.snapshot, joinUrl: data.joinUrl, roomCode: data.roomCode });
      applyRoom(data.room);
      renderRecent(data.recent);
      renderRank(data.leaderboard);
      if (data.roomCode) {
        state.roomCode = data.roomCode;
        $('qrCode').textContent = data.roomCode;
        $('setupCode').textContent = data.roomCode;
      }
      refreshQr(data.joinUrl);
      setOpStatus('实时连接');
      ensureChatPlaceholder();
    });
    source.addEventListener('comment', event => addComment(JSON.parse(event.data), Number(event.lastEventId)));
    source.addEventListener('gift', event => handleGift(JSON.parse(event.data)));
    source.addEventListener('effect', event => handleEffect(JSON.parse(event.data)));
    source.addEventListener('like', event => {
      const data = JSON.parse(event.data);
      if (state.room) state.room.likes = Number(data.total) || state.room.likes;
      $('likesDisplay').textContent = compact(data.total);
      const count = Math.min(6, Math.max(1, Math.round((Number(data.delta) || 1) / 2)));
      for (let i = 0; i < count; i += 1) setTimeout(heart, i * 70);
    });
    source.addEventListener('seat', event => {
      const data = JSON.parse(event.data);
      if (typeof data.online === 'number' && state.room) {
        state.room.online = data.online;
        state.room.occupied = data.occupied ?? state.room.occupied;
        applyRoom(state.room);
      }
      if (data.action === 'join') showArrival(data.name);
    });
    source.addEventListener('state', event => applyRoom(JSON.parse(event.data)));
    source.addEventListener('phase', event => {
      const data = JSON.parse(event.data);
      if (state.room) state.room.phase = data.phase;
      applyRoom(state.room);
    });
    source.addEventListener('leaderboard', event => {
      const data = JSON.parse(event.data);
      renderRank(data.leaderboard);
    });
    source.addEventListener('clear', () => {
      $('chatFeed').replaceChildren();
      ensureChatPlaceholder();
    });
    source.addEventListener('reset', event => {
      const data = JSON.parse(event.data);
      $('chatFeed').replaceChildren();
      ensureChatPlaceholder();
      renderRank([]);
      if (data.scope === 'all') {
        state.snapshot = null;
        refreshState();
      }
    });
    source.addEventListener('error', () => {
      state.reconnecting = true;
      setOpStatus('重连中', true);
      clearTimeout(state.opTimer);
      state.opTimer = setTimeout(async () => {
        try { await refreshState(); } catch {}
      }, 8000);
    });
  }

  function closeStream() {
    if (state.stream) {
      state.stream.close();
      state.stream = null;
    }
  }

  async function refreshState() {
    const data = await api('/api/host/state');
    applySnapshot(data);
    return data;
  }

  function showSetup(open = true) {
    document.body.classList.toggle('live', !open);
    document.body.classList.toggle('setup-open', open);
    if (open) refreshQr();
    state.effects?.resize();
  }

  async function listCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const select = $('cameraSelect');
      const current = select.value;
      select.replaceChildren();
      if (!cameras.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '请先开启摄像头';
        select.append(option);
        return;
      }
      for (const camera of cameras) {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `摄像头 ${select.children.length + 1}`;
        select.append(option);
      }
      if (current && cameras.some(camera => camera.deviceId === current)) select.value = current;
    } catch {}
  }

  async function startCamera(deviceId = '') {
    if (!navigator.mediaDevices?.getUserMedia) {
      $('cameraStatus').textContent = '此浏览器无法使用摄像头。';
      return;
    }
    stopCamera();
    $('cameraStatus').textContent = '正在检查摄像头权限…';
    const video = deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 } }
      : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 }, facingMode: 'user' };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video });
      state.cameraStream = stream;
      const camera = $('camera');
      camera.srcObject = stream;
      camera.hidden = false;
      camera.classList.toggle('mirrored', $('mirrorToggle').checked);
      await camera.play();
      document.body.classList.add('has-camera');
      $('cameraStatus').textContent = '摄像头已连接 · 画面不会离开这台电脑。';
      await listCameras();
      const track = stream.getVideoTracks()[0];
      if (track?.getSettings?.().deviceId) $('cameraSelect').value = track.getSettings().deviceId;
      state.effects?.resize();
      toast('摄像头已连接');
    } catch (error) {
      document.body.classList.remove('has-camera');
      $('cameraStatus').textContent = '无法打开摄像头。请允许权限或选择其他摄像头。';
      toast('请检查摄像头权限。', 3000);
    }
  }

  function stopCamera() {
    if (state.cameraStream) {
      for (const track of state.cameraStream.getTracks()) track.stop();
      state.cameraStream = null;
    }
    const camera = $('camera');
    camera.pause();
    camera.srcObject = null;
    camera.hidden = true;
    document.body.classList.remove('has-camera');
  }

  function showOperatorBar(pin = false) {
    if (pin) state.opPinned = !state.opPinned;
    document.body.classList.add('show-op');
    clearTimeout(state.opTimer);
    if (!state.opPinned) state.opTimer = setTimeout(() => document.body.classList.remove('show-op'), 2600);
  }

  async function hostComment(event) {
    event.preventDefault();
    const input = $('hostCommentInput');
    const text = String(input.value || '').trim().slice(0, 60);
    if (!text) return;
    input.value = '';
    try {
      await api('/api/host/control', { method: 'POST', body: JSON.stringify({ action: 'comment', text }) });
    } catch (error) {
      toast(error.message || '评论发送失败。');
      if (!input.value) input.value = text;
    }
  }

  async function clearChat() {
    try {
      await api('/api/host/control', { method: 'POST', body: JSON.stringify({ action: 'clear' }) });
      $('chatFeed').replaceChildren();
      ensureChatPlaceholder();
      toast('评论已清空。');
    } catch (error) {
      toast(error.message || '清空失败。');
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast('无法切换全屏，请使用 F11。', 3000);
    }
  }

  function toggleQr() {
    document.body.classList.toggle('hide-qr');
  }

  function bind() {
    $('startButton').addEventListener('click', async () => {
      if (!state.cameraStream) await startCamera($('cameraSelect').value);
      showSetup(false);
      toast('直播画面已开始。', 2000);
    });
    $('cameraButton').addEventListener('click', () => startCamera($('cameraSelect').value));
    $('cameraSelect').addEventListener('change', () => {
      if ($('cameraSelect').value) startCamera($('cameraSelect').value);
    });
    $('mirrorToggle').addEventListener('change', event => {
      $('camera').classList.toggle('mirrored', event.target.checked);
    });
    $('hostCommentForm').addEventListener('submit', hostComment);
    $('follow').addEventListener('click', () => {
      const followed = $('follow').textContent === '已关注';
      $('follow').textContent = followed ? '关注' : '已关注';
      $('follow').style.background = followed ? '' : '#ffffff33';
      toast(followed ? '已取消关注' : '已关注 ❤️');
    });
    $('likeButton').addEventListener('click', () => {
      for (let i = 0; i < 4; i += 1) setTimeout(heart, i * 80);
      toast('观众点赞请用手机！', 1400);
    });
    $('giftButton').addEventListener('click', () => toast('观众可以在手机上送礼物。', 1800));
    $('shareButton').addEventListener('click', () => toast(`观众入口：${state.joinUrl || `${location.origin}/j?c=${state.roomCode}`}`, 3000));
    $('shoppingBag').addEventListener('click', () => toast('1号链接 · 中文演讲', 2200));
    document.querySelectorAll('[data-op]').forEach(button => {
      button.addEventListener('click', () => {
        const op = button.dataset.op;
        if (op === 'setup') showSetup(true);
        if (op === 'qr') toggleQr();
        if (op === 'clear') clearChat();
        if (op === 'fullscreen') toggleFullscreen();
      });
    });
    document.addEventListener('mousemove', () => showOperatorBar());
    document.addEventListener('touchstart', () => showOperatorBar(), { passive: true });
    document.addEventListener('keydown', event => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (event.key === 'Escape') {
        if (!document.body.classList.contains('live')) showSetup(false);
        return;
      }
      if (event.key.toLowerCase() === 'q') { event.preventDefault(); toggleQr(); }
      else if (event.key.toLowerCase() === 'h') { event.preventDefault(); showOperatorBar(true); }
      else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
      else if (event.key.toLowerCase() === 's') { event.preventDefault(); showSetup(!document.body.classList.contains('live') ? false : true); }
      else if (event.key.toLowerCase() === 'c') { event.preventDefault(); clearChat(); }
      else if (['1', '2', '3', '4', '5', '6', '7'].includes(event.key)) {
        const kind = { 1: 'fireworks', 2: 'meteor', 3: 'party', 4: 'hearts', 5: 'lantern', 6: 'rainbow', 7: 'rocket' }[event.key];
        state.effects.reaction(kind);
      }
    });
    window.addEventListener('resize', () => state.effects?.resize());
    window.addEventListener('pagehide', stopCamera);
  }

  async function boot() {
    state.effects = window.LiveEffectsCore.create({
      stage: $('stage'),
      canvas: $('reactionCanvas'),
      banner: $('reactionBanner'),
      emoji: $('reactionEmoji'),
      title: $('reactionTitle'),
    });
    bind();
    showSetup(true);
    refreshQr();
    ensureChatPlaceholder();
    try {
      await refreshState();
    } catch (error) {
      if (error.status === 401) toast('需要主播认证，请用 /host?key=... 地址进入。', 5000);
      else toast('无法读取服务器状态。', 3000);
    }
    await listCameras();
    openStream();
  }

  boot();
})();
