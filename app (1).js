// Radar Neon PWA - app.js
// Ajuste parâmetros aqui se desejar
(() => {
  const canvas = document.getElementById('radar');
  const ctx = canvas.getContext('2d', { alpha: true });
  const speedControl = document.getElementById('speed');
  const glowControl = document.getElementById('glow');
  const blipsToggle = document.getElementById('blips');

  let DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || (window.innerHeight - 120);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Radar state
  const center = () => ({ x: canvas.width / (2 * DPR), y: canvas.height / (2 * DPR) });
  let maxRadius = () => Math.min(canvas.width / (2 * DPR), canvas.height / (2 * DPR)) * 0.95;

  const TAU = Math.PI * 2;
  let angle = 0;
  let lastTime = performance.now();

  // Blips
  const blips = [];
  function addBlip(x, y, lifetime = 2800) {
    blips.push({ x, y, t: performance.now(), lifetime, alpha: 1 });
  }

  // Random blip generator
  function spawnRandomBlip() {
    if (!blipsToggle.checked) return;
    if (Math.random() < 0.015) {
      const c = center();
      const r = Math.random() * maxRadius();
      const a = Math.random() * TAU;
      addBlip(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 1800 + Math.random() * 2400);
    }
  }

  // Mouse/touch to add blip
  function pointerHandler(ev) {
    const rect = canvas.getBoundingClientRect();
    const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);
    addBlip(x, y, 3000);
  }
  canvas.addEventListener('click', pointerHandler);
  canvas.addEventListener('touchstart', pointerHandler);

  // Draw helpers
  function drawGrid() {
    const c = center();
    const R = maxRadius();
    ctx.save();
    ctx.translate(c.x, c.y);

    // Background wash (keeps slight persistence)
    ctx.fillStyle = 'rgba(2,10,4,0.18)';
    ctx.fillRect(-c.x, -c.y, canvas.width / DPR, canvas.height / DPR);

    // Concentric circles
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,255,120,0.06)';
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, (R * i) / 5, 0, TAU);
      ctx.stroke();
    }

    // Cross lines
    ctx.strokeStyle = 'rgba(0,255,120,0.06)';
    ctx.beginPath();
    ctx.moveTo(-R, 0); ctx.lineTo(R, 0);
    ctx.moveTo(0, -R); ctx.lineTo(0, R);
    ctx.stroke();

    // Military markers (ticks)
    ctx.fillStyle = 'rgba(0,255,120,0.06)';
    for (let a = 0; a < 360; a += 30) {
      const rad = (a * Math.PI) / 180;
      const x1 = Math.cos(rad) * (R - 6);
      const y1 = Math.sin(rad) * (R - 6);
      const x2 = Math.cos(rad) * R;
      const y2 = Math.sin(rad) * R;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawBlips(now) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = blips.length - 1; i >= 0; i--) {
      const b = blips[i];
      const age = now - b.t;
      if (age > b.lifetime) { blips.splice(i, 1); continue; }
      const p = 1 - age / b.lifetime;
      const size = 3 + 4 * p;
      const alpha = Math.pow(p, 0.9);
      ctx.beginPath();
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, size * 5);
      g.addColorStop(0, `rgba(160,255,150,${0.9 * alpha})`);
      g.addColorStop(0.2, `rgba(80,220,120,${0.5 * alpha})`);
      g.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = g;
      ctx.arc(b.x, b.y, size * 3, 0, TAU);
      ctx.fill();

      // bright core
      ctx.fillStyle = `rgba(200,255,200,${0.9 * alpha})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(1, size * 0.6), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCenterPulse(now) {
    const c = center();
    const pulse = (Math.sin(now / 350) + 1) / 2; // 0..1
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, maxRadius() * 0.25);
    rg.addColorStop(0, `rgba(0,255,140,${0.18 + 0.12 * pulse})`);
    rg.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(c.x, c.y, maxRadius() * 0.28, 0, TAU);
    ctx.fill();

    // small bright center
    ctx.fillStyle = `rgba(160,255,180,${0.8 + 0.2 * pulse})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawScanner(now, dt) {
    const c = center();
    const R = maxRadius();
    const baseSpeed = 0.6; // radians per second baseline
    const speed = baseSpeed * parseFloat(speedControl.value); 
    angle += speed * dt * 0.001;

    // beam width and pulsing alpha
    const beamWidth = Math.PI * 0.18; // adjust for cone
    const pulse = (Math.sin(now / 220) + 1) / 2;
    const innerAlpha = 0.65 + 0.25 * pulse;
    const outerAlpha = 0.14 + 0.08 * pulse;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle);

    // beam (wedge)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, -beamWidth/2, beamWidth/2);
    ctx.closePath();

    // gradient for beam
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, `rgba(0,255,140,${innerAlpha})`);
    g.addColorStop(0.5, `rgba(0,255,120,${outerAlpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;

    // glow effect via shadow
    const glow = parseFloat(glowControl.value);
    ctx.shadowColor = 'rgba(0,255,140,0.8)';
    ctx.shadowBlur = glow;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fill();

    // bright rim line
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(160,255,180,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, -beamWidth/2, beamWidth/2);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  // Main loop
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;

    drawGrid();
    spawnRandomBlip();
    drawBlips(now);
    drawCenterPulse(now);
    drawScanner(now, dt);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Service worker registration for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  }

  // accessibility: reduced motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) speedControl.value = 0.25;

  // expose addBlip for console tweaks
  window.radarAddBlip = addBlip;
})();