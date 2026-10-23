'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const state = {
    host: false,
    data: null,
    joinUrl: '',
    stream: null,
    liveMode: false,
    pollTimer: 0,
    previousAuto: true,
    previousSmart: true,
    seenComments: new Set(),
  };

  function toast(message, ms = 2600) {
    if (typeof window.toast === 'function') window.toast(message);
    else {
      const element = $('globalToast');
      if (!element) return;
      element.textContent = message;
      element.classList.add('visible');
      clearTimeout(toast.timer);
      toast.timer = setTimeout(() => element.classList.remove('visible'), ms);
    }
  }

  function setStatus(text, mode = 'online') {
    const element = $('realtimeStatus');
    element.textContent = text;
    element.dataset.state = mode;
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

  function apply(data) {
    if (!data) return;
    state.data = data;
    const room = data.room || data.snapshot?.room || {};
    if (data.joinUrl) {
      if (state.joinUrl !== data.joinUrl) {
        state.joinUrl = data.joinUrl;
        $('realtimeJoinUrl').textContent = data.joinUrl;
        $('realtimeQr').src = `/api/qr.svg?v=${Date.now()}`;
      }
      $('realtimeJoinUrl').textContent = data.joinUrl;
    }
    if (data.roomCode) $('realtimeCode').textContent = data.roomCode;
    $('realtimeSeats').textContent = `${room.occupied ?? 0} / ${room.capacity ?? 10}`;
    if (document.activeElement !== $('realtimeCapacity')) $('realtimeCapacity').value = String(room.capacity ?? 10);
    const pause = $('realtimePause');
    pause.textContent = room.phase === 'paused' ? '重新开始' : '暂停';
    pause.classList.toggle('active', room.phase === 'paused');
    setStatus(`实时 · ${room.online ?? 0} 人在线${room.waiting ? ` · ${room.waiting} 排队` : ''}`, 'online');
    if (window.LiveStage) {
      window.LiveStage.setViewers(Math.max(1, Number(room.online) || 1));
      if (Number.isFinite(room.likes)) window.LiveStage.setLikes(room.likes);
    }
  }

  function previewComment(data, seq) {
    if (!data) return;
    const key = seq ? `s${seq}` : '';
    if (key && state.seenComments.has(key)) return;
    if (key) {
      state.seenComments.add(key);
      while (state.seenComments.size > 300) state.seenComments.delete(state.seenComments.values().next().value);
    }
    const attachment = data.attachment;
    const text = attachment && data.text === attachment.title ? '' : data.text;
    window.LiveStage?.addComment(text, data.name, data.level ?? 12, attachment?.id || null);
  }

  function enableLiveMode() {
    if (!state.host) return;
    if (state.liveMode) return;
    state.liveMode = true;
    state.previousAuto = $('autoChat').checked;
    state.previousSmart = $('smartComments').checked;
    if ($('smartComments').checked) {
      $('smartComments').checked = false;
      $('smartComments').dispatchEvent(new Event('change'));
    }
    if ($('autoChat').checked) {
      $('autoChat').checked = false;
      $('autoChat').dispatchEvent(new Event('change'));
    }
    window.resetChatFeed?.();
    window.LiveStage?.addComment('实时评论模式 · 已连接电视画面。', 'LIVE STUDIO', 99);
    openPreviewStream();
    setStatus('实时已连接', 'online');
  }

  function disableLiveMode() {
    state.liveMode = false;
    closePreviewStream();
    $('smartComments').checked = true;
    $('smartComments').dispatchEvent(new Event('change'));
    $('autoChat').checked = state.previousAuto;
    $('autoChat').dispatchEvent(new Event('change'));
    window.resetChatFeed?.();
    window.LiveStage?.addComment('已返回演示模式，评论机器人重新运行。', 'LIVE STUDIO', 99);
    setStatus('演示模式', 'host');
  }

  function openPreviewStream() {
    closePreviewStream();
    if (!state.host) return;
    const source = new EventSource('/api/host/stream');
    state.stream = source;
    source.addEventListener('open', () => setStatus('实时已连接', 'online'));
    source.addEventListener('hello', event => {
      const data = JSON.parse(event.data);
      if (data.snapshot) apply(data.snapshot);
      if (data.room) apply({ ...(state.data || {}), room: data.room });
      if (Array.isArray(data.recent)) {
        window.LiveStage?.resetChatFeed();
        state.seenComments.clear();
        for (const item of data.recent) previewComment(item.data, item.seq);
        if (!data.recent.length) window.LiveStage?.addComment('等待实时评论…', 'LIVE STUDIO', 99);
      }
      if (data.joinUrl && !state.joinUrl) {
        state.joinUrl = data.joinUrl;
        $('realtimeJoinUrl').textContent = data.joinUrl;
        $('realtimeQr').src = `/api/qr.svg?v=${Date.now()}`;
      }
    });
    source.addEventListener('comment', event => {
      const data = JSON.parse(event.data);
      previewComment(data, Number(event.lastEventId));
    });
    source.addEventListener('gift', event => {
      const data = JSON.parse(event.data);
      if (data.effect === 'heart') {
        for (let i = 0; i < 3; i += 1) setTimeout(() => window.LiveStage?.heart(), i * 70);
      } else if (data.effect === 'rose') {
        window.LiveStage?.rose();
      }
      toast(`${data.emoji} ${data.name} · ${data.label}`, 1800);
    });
    source.addEventListener('effect', event => {
      const data = JSON.parse(event.data);
      if (['fireworks', 'party'].includes(data.kind)) window.liveEffects?.reaction(data.kind);
    });
    source.addEventListener('like', event => {
      const data = JSON.parse(event.data);
      window.LiveStage?.setLikes(data.total);
      for (let i = 0; i < Math.min(4, Math.max(1, Math.round((data.delta || 1) / 3))); i += 1) {
        setTimeout(() => window.LiveStage?.heart(), i * 60);
      }
    });
    source.addEventListener('seat', event => {
      const data = JSON.parse(event.data);
      if (typeof data.occupied === 'number') {
        const room = state.data?.room || {};
        $('realtimeSeats').textContent = `${data.occupied} / ${room.capacity ?? 10}`;
      }
      if (typeof data.online === 'number') window.LiveStage?.setViewers(Math.max(1, data.online));
    });
    source.addEventListener('state', event => apply({ ...(state.data || {}), room: JSON.parse(event.data) }));
    source.addEventListener('phase', event => {
      const data = JSON.parse(event.data);
      if (state.data?.room) state.data.room.phase = data.phase;
      const pause = $('realtimePause');
      pause.textContent = data.phase === 'paused' ? '重新开始' : '暂停';
      pause.classList.toggle('active', data.phase === 'paused');
    });
    source.addEventListener('clear', () => {
      state.seenComments.clear();
      window.LiveStage?.resetChatFeed();
      window.LiveStage?.addComment('评论已清空。', 'LIVE STUDIO', 99);
    });
    source.addEventListener('reset', event => {
      const data = JSON.parse(event.data);
      state.seenComments.clear();
      if (data.scope === 'all') {
        window.LiveStage?.resetChatFeed();
        toast('直播已重置，观众需要重新入场。', 3200);
      }
    });
    source.addEventListener('error', () => setStatus('重新连接中…', 'offline'));
  }

  function closePreviewStream() {
    if (state.stream) {
      state.stream.close();
      state.stream = null;
    }
  }

  async function refresh() {
    try {
      const data = await api('/api/host/state');
      state.host = true;
      $('realtimeSection').hidden = false;
      apply(data);
      if ($('realtimeLive').checked) enableLiveMode();
      return data;
    } catch (error) {
      if (error.status === 401) {
        state.host = false;
        $('realtimeSection').hidden = true;
        closePreviewStream();
      } else {
        setStatus('服务器连接失败', 'offline');
      }
      return null;
    }
  }

  async function control(body) {
    const result = await api('/api/host/control', { method: 'POST', body: JSON.stringify(body) });
    apply(result);
    return result;
  }

  async function copyJoin() {
    if (!state.joinUrl) return;
    try {
      await navigator.clipboard.writeText(state.joinUrl);
      toast('入场链接已复制。');
    } catch {
      window.prompt('复制入场链接', state.joinUrl);
    }
  }

  function openStage() {
    const popup = window.open('/live', 'douyin-live-stage', 'popup=yes,width=1280,height=720');
    if (!popup) {
      toast('弹窗被拦截，请允许浏览器弹窗。', 3200);
      return;
    }
    popup.focus();
    toast('已打开电视画面，请移到 HDMI 扩展显示器。', 3000);
  }

  function bind() {
    $('openStage').addEventListener('click', openStage);
    $('copyJoin').addEventListener('click', copyJoin);
    $('realtimeApply').addEventListener('click', async () => {
      try {
        await control({ action: 'capacity', capacity: Number($('realtimeCapacity').value) });
        toast('同时入场人数已应用。');
      } catch (error) { toast(error.message || '应用失败。'); }
    });
    $('realtimePause').addEventListener('click', async () => {
      const phase = state.data?.room?.phase === 'paused' ? 'live' : 'paused';
      try {
        await control({ action: 'phase', phase });
        toast(phase === 'paused' ? '直播已暂停。' : '直播已重新开始。');
      } catch (error) { toast(error.message || '切换失败。'); }
    });
    $('realtimeClear').addEventListener('click', async () => {
      try {
        await control({ action: 'clear' });
        window.LiveStage?.resetChatFeed();
        toast('评论已清空。');
      } catch (error) { toast(error.message || '清空失败。'); }
    });
    $('realtimeReset').addEventListener('click', async () => {
      if (!window.confirm('要重置所有观众的直播币和打赏分数吗？')) return;
      try {
        await control({ action: 'resetScores' });
        toast('分数和直播币已重置。');
      } catch (error) { toast(error.message || '重置失败。'); }
    });
    $('realtimeLive').addEventListener('change', event => {
      if (event.target.checked) enableLiveMode();
      else disableLiveMode();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      refresh();
    });
    window.addEventListener('pagehide', closePreviewStream);
  }

  async function boot() {
    bind();
    const data = await refresh();
    if (!data) return;
    state.pollTimer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 3000);
  }

  boot();
})();
