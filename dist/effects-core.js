'use strict';

(() => {
  const COLORS = ['#ff5af0', '#50edff', '#ffe47a', '#8b7dff', '#ff6585', '#72ffbe'];
  const INFO = {
    fireworks: ['🎆', '烟花盛典'],
    hearts: ['💕', '爱心雨'],
    meteor: ['🌠', '流星雨'],
    lantern: ['🏮', '孔明灯'],
    party: ['🎉', '派对时间'],
    rainbow: ['🌈', '彩虹桥'],
    rocket: ['🚀', '火箭'],
  };

  function create({ stage, canvas, banner, emoji, title }) {
    if (!stage || !canvas) throw new Error('LiveEffectsCore needs stage and canvas');
    const ctx = canvas.getContext('2d');
    let width = 1;
    let height = 1;
    let particles = [];
    let queue = [];
    let frame = 0;
    let start = 0;
    let kind = '';
    let lastFrame = 0;

    const random = (min, max) => min + Math.random() * (max - min);

    function resize() {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function particle(x, y, vx, vy, color, life, type = 'spark', size = 2) {
      if (particles.length >= 650) return;
      particles.push({
        x, y, px: x, py: y, vx, vy, color, life, total: life, type, size,
        rotation: random(0, Math.PI * 2), spin: random(-5, 5), phase: random(0, Math.PI * 2),
      });
    }

    function explode(x, y, color, count = 70) {
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        const speed = random(width * 0.13, width * 0.55);
        particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, random(0.8, 1.7), 'spark', random(1.1, 2.8));
      }
      for (let i = 0; i < 12; i += 1) particle(x, y, random(-70, 70), random(-60, 60), '#fff5c3', 0.65, 'star', random(2, 5));
    }

    function rocket(x, y, color) {
      particle(x, height, 0, -(height - y) / 0.62, color, 0.65, 'rocket', 3);
      queue.push({ at: (performance.now() - start) / 1000 + 0.62, action: () => explode(x, y, color, 85) });
    }

    function setup(nextKind) {
      if (nextKind === 'fireworks') {
        for (let i = 0; i < 8; i += 1) {
          queue.push({ at: i * 0.42, action: () => rocket(width * random(0.13, 0.87), height * random(0.16, 0.48), COLORS[i % COLORS.length]) });
        }
      }
      if (nextKind === 'hearts') {
        const palette = ['#ff5b8a', '#ff8fb1', '#ffb3c7', '#ff6f9c', '#ffd1dc'];
        for (let i = 0; i < 42; i += 1) {
          queue.push({
            at: i * 0.045,
            action: () => particle(width * random(0.08, 0.92), height + 24, random(-10, 10), -height * random(0.16, 0.34), palette[i % palette.length], random(2.2, 4.2), 'heart', width * random(0.01, 0.02)),
          });
        }
      }
      if (nextKind === 'meteor') {
        const palette = ['#6de6ff', '#b388ff', '#ffe47a', '#ff8fb1', '#72ffbe'];
        for (let i = 0; i < 22; i += 1) {
          queue.push({
            at: i * 0.07,
            action: () => {
              const x = width * random(0.12, 0.98);
              const y = height * random(0.02, 0.34);
              particle(x, y, -width * random(0.22, 0.42), height * random(0.16, 0.3), palette[i % palette.length], random(0.8, 1.35), 'meteor', random(2, 4));
            },
          });
        }
      }
      if (nextKind === 'lantern') {
        for (let i = 0; i < 26; i += 1) {
          queue.push({
            at: i * 0.07,
            action: () => particle(width * random(0.06, 0.94), height * random(0.82, 1.08), random(-6, 6), -height * random(0.07, 0.15), ['#ffb75e', '#ffd18a', '#ff9f55'][i % 3], random(3.5, 6), 'lantern', width * random(0.009, 0.016)),
          });
        }
      }
      if (nextKind === 'party') {
        for (let wave = 0; wave < 4; wave += 1) {
          queue.push({
            at: wave * 0.85,
            action: () => {
              for (let i = 0; i < 80; i += 1) {
                const side = i % 2;
                particle(side ? width : 0, height * 0.67, (side ? -1 : 1) * random(width * 0.13, width * 0.8), -height * random(0.22, 0.72), COLORS[i % 6], random(2, 3.5), 'confetti', random(3, 7));
              }
              for (let i = 0; i < 16; i += 1) particle(width * 0.5, height * 0.4, random(-110, 110), random(-210, -40), COLORS[i % 6], 2, 'star', random(3, 7));
            },
          });
        }
      }
      if (nextKind === 'rainbow') {
        for (let i = 0; i < 90; i += 1) {
          queue.push({
            at: i * 0.012,
            action: () => {
              const angle = Math.PI + (i / 90) * Math.PI;
              const radius = width * 0.34;
              const x = width * 0.5 + Math.cos(angle) * radius;
              const y = height * 0.92 + Math.sin(angle) * radius;
              particle(x, y, random(-18, 18), random(-30, -8), COLORS[i % 6], random(1.4, 2.8), 'star', random(2, 4));
            },
          });
        }
      }
      if (nextKind === 'rocket') {
        queue.push({ at: 0, action: () => particle(width * 0.5, height + 20, 0, -height * 0.86, '#ffffff', 0.78, 'rocket', 5) });
        queue.push({
          at: 0.72,
          action: () => {
            explode(width * 0.5, height * 0.2, '#ffe47a', 120);
            for (let i = 0; i < 6; i += 1) {
              queue.push({ at: 0.78 + i * 0.1, action: () => explode(width * random(0.28, 0.72), height * random(0.16, 0.38), COLORS[i % 6], 55) });
            }
          },
        });
      }
    }

    function draw(now) {
      const time = (now - start) / 1000;
      const dt = Math.min((now - lastFrame) / 1000, 0.04);
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      const due = queue.filter(item => item.at <= time);
      queue = queue.filter(item => item.at > time);
      for (const item of due) item.action();

      if (kind === 'rainbow') {
        const fade = Math.min(1, time * 2.4) * Math.max(0, Math.min(1, (4.4 - time) * 1.2));
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        const arcColors = ['#ff5a7a', '#ffb15a', '#ffe76a', '#6dffb0', '#6de6ff', '#9b8bff'];
        for (let i = 0; i < arcColors.length; i += 1) {
          const radius = width * (0.38 - i * 0.025);
          ctx.beginPath();
          ctx.strokeStyle = arcColors[i];
          ctx.lineWidth = Math.max(4, width * 0.009);
          ctx.shadowColor = arcColors[i];
          ctx.shadowBlur = 18;
          ctx.arc(width * 0.5, height * 0.92, radius, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const p of particles) {
        p.life -= dt;
        p.px = p.x;
        p.py = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.type === 'flame' ? -15 : p.type === 'rocket' ? 0 : p.type === 'meteor' ? 0 : p.type === 'lantern' ? -2.2 : p.type === 'heart' ? -2 : height * 0.18) * dt;
        p.rotation += p.spin * dt;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 0.3) * Math.min(1, (p.total - p.life) * 8);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        if (p.type === 'spark' || p.type === 'rocket') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineWidth = p.size;
          ctx.shadowBlur = p.type === 'rocket' ? 10 : 5;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
          ctx.stroke();
        } else if (p.type === 'meteor') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.lineWidth = p.size;
          ctx.shadowBlur = 14;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.12, p.y - p.vy * 0.12);
          ctx.stroke();
        } else if (p.type === 'heart') {
          ctx.translate(p.x + Math.sin(time * 4 + p.phase) * p.size * 1.6, p.y);
          ctx.rotate(Math.sin(time * 3 + p.phase) * 0.18);
          ctx.scale(p.size, p.size);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(0, 0.35);
          ctx.bezierCurveTo(-1.1, -0.35, -1.4, 0.6, 0, 1.4);
          ctx.bezierCurveTo(1.4, 0.6, 1.1, -0.35, 0, 0.35);
          ctx.fill();
        } else if (p.type === 'lantern') {
          ctx.translate(p.x + Math.sin(time * 2 + p.phase) * p.size * 0.7, p.y);
          ctx.rotate(Math.sin(time * 2 + p.phase) * 0.06);
          ctx.globalCompositeOperation = 'lighter';
          ctx.shadowColor = '#ffb75e';
          ctx.shadowBlur = 22;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.85, p.size * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha *= 0.8;
          ctx.fillStyle = '#fff3c4';
          ctx.beginPath();
          ctx.ellipse(0, p.size * 0.9, p.size * 0.5, p.size * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'flame') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.translate(p.x + Math.sin(time * 8 + p.phase) * p.size, p.y);
          const size = p.size * (p.life / p.total);
          ctx.shadowColor = '#ff9b19';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(0, -size * 2.4);
          ctx.bezierCurveTo(size * 1.8, -size * 0.1, size, size, 0, size);
          ctx.bezierCurveTo(-size, size, -size * 1.8, -size * 0.1, 0, -size * 2.4);
          ctx.fill();
        } else if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.scale(Math.cos(p.phase + time * 8), 1);
          ctx.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
        } else {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          for (let i = 0; i < 10; i += 1) {
            const r = i % 2 ? p.size * 0.45 : p.size;
            const angle = (i * Math.PI) / 5;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      particles = particles.filter(p => p.life > 0 && p.y < height + 90);
      if (time > 5.2 && banner) banner.hidden = true;
      if (particles.length || queue.length) frame = requestAnimationFrame(draw);
      else stop();
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      particles = [];
      queue = [];
      ctx.clearRect(0, 0, width, height);
      if (banner) banner.hidden = true;
      delete stage.dataset.reaction;
    }

    function reaction(nextKind) {
      if (!INFO[nextKind]) return;
      stop();
      resize();
      kind = nextKind;
      start = performance.now();
      lastFrame = start;
      stage.dataset.reaction = nextKind;
      if (banner && emoji && title) {
        emoji.textContent = INFO[nextKind][0];
        title.textContent = INFO[nextKind][1];
        banner.dataset.kind = nextKind;
        banner.hidden = false;
        banner.style.animation = 'none';
        void banner.offsetWidth;
        banner.style.animation = '';
      }
      setup(nextKind);
      frame = requestAnimationFrame(draw);
      window.dispatchEvent(new CustomEvent('live:scene', { detail: { topic: nextKind } }));
    }

    new ResizeObserver(resize).observe(stage);
    resize();
    return { reaction, stop, resize };
  }

  window.LiveEffectsCore = { create };
})();
