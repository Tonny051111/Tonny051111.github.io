/* v4.0 — no dependencies, no storage, no network requests. */
(() => {
  'use strict';
  const avatar = document.getElementById('avatarButton');
  const tag = document.getElementById('isfpTag');
  const birthdayTrigger = document.getElementById('birthdayTrigger');
  const main = document.querySelector('.main');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let clicks = 0;
  let takeoverActive = false;
  let confettiSystem = null;

  tag.addEventListener('click', event => {
    event.stopPropagation();
    const flipped = tag.getAttribute('aria-pressed') !== 'true';
    tag.setAttribute('aria-pressed', String(flipped));
    tag.setAttribute('aria-label', flipped ? '再躺会，点击翻回ISFP' : 'ISFP，点击翻面');
  });

  avatar.addEventListener('click', event => {
    event.stopPropagation();
    if (takeoverActive) return;
    avatar.classList.remove('avatar-shake');
    void avatar.offsetWidth;
    avatar.classList.add('avatar-shake');
    clicks += 1;
    if (clicks === 11) {
      clicks = 0;
      takeoverActive = true;
      showTakeover();
    }
  });
  avatar.addEventListener('animationend', () => avatar.classList.remove('avatar-shake'));

  // Canvas coordinates are CSS pixels; keep sharp on high-density screens.
  function fitCanvas(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context, width, height };
  }

  function showTakeover() {
    const overlay = document.createElement('div');
    overlay.className = 'takeover';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '隐藏彩蛋');
    overlay.tabIndex = -1;
    overlay.innerHTML = `
      <canvas aria-hidden="true"></canvas>
      <div class="takeover-corner" aria-hidden="true">TONNY / UNKNOWN SIGNAL</div>
      <div class="takeover-terminal" aria-hidden="true">
        <div class="terminal-bar"><i class="terminal-dot"></i><i class="terminal-dot"></i><i class="terminal-dot"></i><span>CHANNEL_11 // CONNECTED</span></div>
        <div class="terminal-body"><div class="takeover-title">SIGNAL LOST_</div><pre class="terminal-lines"></pre><div class="terminal-progress"><span></span></div></div>
      </div>
      <div class="takeover-bottom" aria-hidden="true"><span>0x0B / PRIVATE CHANNEL</span><span>DECODING UNEXPECTED MESSAGE…</span></div>
      <div class="takeover-message" role="status"><p>哈哈，吓到了吧 : )</p><p>愿你生活中的意外，最后都变成惊喜～</p></div>`;
    const previousFocus = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    const oldInert = main.inert;
    main.inert = true;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    overlay.focus({ preventScroll: true });

    const canvas = overlay.querySelector('canvas');
    let screen = fitCanvas(canvas);
    let drops = Array.from({ length: Math.ceil(screen.width / 19) }, () => -Math.random() * 45);
    let frame = 0;
    let lastFrame = 0;
    let closed = false;
    const timers = [];
    const glyphs = '01<>/{}[]:;ABCDEF';
    function render(time) {
      if (closed) return;
      if (screen.context && time - lastFrame > 65) {
        const ctx = screen.context;
        ctx.fillStyle = 'rgba(3,9,7,.13)';
        ctx.fillRect(0, 0, screen.width, screen.height);
        ctx.font = '13px monospace';
        drops.forEach((drop, index) => {
          ctx.fillStyle = Math.random() > .975 ? '#d5ffe2' : '#28ba6b';
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], index * 19, drop * 19);
          drops[index] = drop * 19 > screen.height && Math.random() > .975 ? -5 : drop + .65;
        });
        lastFrame = time;
      }
      if (!reducedMotion.matches) frame = requestAnimationFrame(render);
    }
    function resize() {
      screen = fitCanvas(canvas);
      drops = Array.from({ length: Math.ceil(screen.width / 19) }, () => -Math.random() * 45);
    }
    function finish() {
      if (closed) return;
      closed = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pagehide', finish);
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      document.body.style.overflow = oldOverflow;
      main.inert = oldInert;
      takeoverActive = false;
      if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    }
    function onKey(event) {
      if (event.key === 'Escape') finish();
      if (event.key === 'Tab') { event.preventDefault(); overlay.focus(); }
    }
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(render);
    const lines = [
      '> unexpected input detected: 11 / 11',
      '> opening a hidden channel…',
      '> rerouting pixels [0x0B]   OK',
      '> decoding a message for you…',
      '> surprise.payload ready_',
    ];
    const terminal = overlay.querySelector('.terminal-lines');
    lines.forEach((line, index) => timers.push(setTimeout(() => {
      terminal.textContent += line + '\n';
    }, 180 + index * 760)));
    timers.push(setTimeout(() => overlay.classList.add('is-reveal'), 4600));
    timers.push(setTimeout(() => overlay.classList.add('is-leaving'), 8500));
    timers.push(setTimeout(finish, 9150));
    // Also clean up when navigating away, including pages kept in back/forward cache.
    window.addEventListener('pagehide', finish, { once: true });
  }

  function celebrateBirthday() {
    if (!avatar.querySelector('.birthday-hat')) {
      const hat = document.createElement('img');
      hat.className = 'birthday-hat';
      hat.src = './static/img/birthday-hat.png?v=4.0.2';
      hat.alt = '';
      hat.draggable = false;
      hat.setAttribute('aria-hidden', 'true');
      avatar.appendChild(hat);
    }
    if (!confettiSystem) confettiSystem = createConfettiSystem();
    confettiSystem.addBurst();
  }

  // One canvas renders independently timed bursts; new clicks never cancel old ones.
  function createConfettiSystem() {
    const canvas = document.createElement('canvas');
    canvas.className = 'birthday-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    let screen = fitCanvas(canvas);
    let frame = 0;
    const colors = ['#7561d4', '#168ecb', '#f1ad28'];
    const bursts = [];
    let running = false;
    function addBurst() {
      if (stopped) return;
      const reduced = reducedMotion.matches;
      const start = performance.now();
      const narrow = screen.width < 600;
      const count = reduced ? 36 : (narrow ? 130 : 190);
      const particles = Array.from({ length: count }, (_, i) => {
        const fromLeft = i % 2 === 0;
        return {
          x: reduced ? Math.random() * screen.width : screen.width * (fromLeft ? .08 : .92),
          y: reduced ? Math.random() * screen.height * .65 : screen.height * .7,
          vx: (fromLeft ? 1 : -1) * (narrow ? .8 + Math.random() * 3.3 : 1.5 + Math.random() * 5.5),
          vy: -7 - Math.random() * Math.min(10, screen.height / 85),
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - .5) * .12,
          phase: Math.random() * Math.PI * 2,
          size: (narrow ? 3.5 : 4.5) + Math.random() * 4,
          delay: reduced ? 0 : Math.floor(i / 46) * 95,
          type: i % 9 === 0 ? 'ribbon' : i % 5 === 0 ? 'star' : 'paper',
          color: colors[i % colors.length],
        };
      });
      bursts.push({ start, duration: reduced ? 1400 : 4600, reduced, particles });
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    }
    // The same purple, blue and amber palette is used in the flat hat artwork.
    function starPath(ctx, radius, points = 5) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / points;
        const r = i % 2 ? radius * .4 : radius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
    let stopped = false;
    const resize = () => { screen = fitCanvas(canvas); };
    const cleanup = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      canvas.remove();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pagehide', cleanup);
      bursts.length = 0;
      confettiSystem = null;
    };
    function draw(now) {
      if (stopped) return;
      for (let i = bursts.length - 1; i >= 0; i--) {
        if (now - bursts[i].start > bursts[i].duration) bursts.splice(i, 1);
      }
      if (!bursts.length) { cleanup(); return; }
      const ctx = screen.context;
      if (ctx) {
        ctx.clearRect(0, 0, screen.width, screen.height);
        bursts.forEach(burst => {
          const elapsed = now - burst.start;
          const duration = burst.duration;
          const particles = burst.particles;
          particles.forEach(p => {
            if (elapsed < p.delay) return;
            let x = p.x, y = p.y, rotation = p.rotation;
            if (!burst.reduced) {
              // Derive position from age, so lower frame rates do not slow the burst.
              const age = (elapsed - p.delay) / 16.67;
              const fallingAt = (4.2 - p.vy) / .15;
              const rising = Math.min(age, fallingAt);
              x += p.vx * (1 - Math.pow(.992, age)) / .008;
              x += (Math.cos(p.phase) - Math.cos(age * .03334 + p.phase)) * 10.5;
              y += p.vy * rising + .075 * rising * rising + Math.max(0, age - fallingAt) * 4.2;
              rotation += p.spin * age;
            }
            ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
            ctx.globalAlpha = Math.max(0, Math.min(1, (duration - elapsed) / 1000));
            ctx.fillStyle = p.color;
            if (p.type === 'ribbon') {
              ctx.strokeStyle = p.color;
              ctx.lineWidth = p.size * .32;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(0, -p.size * 2);
              ctx.bezierCurveTo(p.size * 1.5, -p.size, -p.size * 1.5, p.size, 0, p.size * 2);
              ctx.stroke();
              ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = .6; ctx.stroke();
            } else if (p.type === 'star') {
              starPath(ctx, p.size); ctx.fill();
              ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = .6; ctx.stroke();
            } else {
              const flip = burst.reduced ? .8 : Math.cos(elapsed * .005 + p.phase);
              ctx.scale(1, Math.abs(flip) * .8 + .2);
              ctx.fillRect(-p.size * .5, -p.size * .35, p.size, p.size * .7);
              ctx.fillStyle = 'rgba(255,255,255,.2)';
              ctx.fillRect(-p.size * .5, -p.size * .35, p.size, 1);
            }
            ctx.restore();
          });
          // Amber glints accompany each burst on its own timeline.
          if (elapsed < 1900 && !burst.reduced) {
            for (let i = 0; i < 18; i++) {
              const age = elapsed - (i % 4) * 90;
              if (age < 0) continue;
              const alpha = Math.sin(Math.min(1, age / 1400) * Math.PI) * .75;
              if (alpha <= 0) continue;
              ctx.save();
              ctx.translate(screen.width * (.12 + (i * .173 % .76)), screen.height * (.16 + (i * .137 % .34)));
              ctx.globalAlpha = alpha; ctx.fillStyle = '#f1ad28';
              starPath(ctx, 2 + alpha * 3, 4); ctx.fill(); ctx.restore();
            }
          }
        });
      }
      frame = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('pagehide', cleanup, { once: true });
    return { addBurst };
  }
  birthdayTrigger.addEventListener('click', event => { event.stopPropagation(); celebrateBirthday(); });
  // Match the visitor's calendar date, just like the original time-based theme.
  function isBirthday(date) { return date.getMonth() === 10 && date.getDate() === 11; }
  const currentDate = new Date();
  if (isBirthday(currentDate)) setTimeout(celebrateBirthday, 800);
})();
