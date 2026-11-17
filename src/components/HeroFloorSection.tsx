import React, { useEffect, useRef, useState } from 'react';
import { HeroContent, StyleOverrides } from '../data/portfolioData';
import { ActiveTextSelection, EditableText } from './EditableText';

interface HeroFloorSectionProps {
  palette: string;
  theme: string;
  hero: HeroContent;
  onUpdateHero: (patch: Partial<HeroContent>) => void;
  editing: boolean;
  styleOverrides: StyleOverrides;
  activeTextSelection: ActiveTextSelection | null;
  onSelectText: (sel: ActiveTextSelection) => void;
}

export const HeroFloorSection: React.FC<HeroFloorSectionProps> = ({
  palette,
  theme,
  hero,
  onUpdateHero,
  editing,
  styleOverrides,
  activeTextSelection,
  onSelectText
}) => {
  const heroRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const covRef = useRef<HTMLElement | null>(null);
  const [obstacleCount, setObstacleCount] = useState(0);
  const resetFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const heroEl = heroRef.current;
    const cv = canvasRef.current;
    const pct = covRef.current;
    if (!heroEl || !cv || !pct) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const SPEED = 10;
    let W = 0,
      H = 0,
      cs = 42,
      cols = 0,
      rows = 0,
      ox = 0,
      oy = 0,
      dpr = 1;
    let grid: Uint8Array = new Uint8Array(0);
    let cov: Uint8Array = new Uint8Array(0);
    let reach: Uint8Array = new Uint8Array(0);
    let total = 0,
      count = 0;

    const bot = { i: 0, x: 0, y: 0, fx: 0, fy: 0, tx: 0, ty: 0, t: 0, to: -1, a: 0, hd: 1 };
    let queue: number[] = [];
    let trail: number[] = [];
    let dots = new Map<string, [number, number, number]>();
    let rays: { x: number; y: number; l: number; hit: boolean }[] = [];
    let spin = 0,
      doneAt = 0;
    let running = false,
      visible = true,
      last = 0,
      rafId = 0;
    let col: Record<string, string> = {};

    const cx = (i: number) => ox + ((i % cols) + 0.5) * cs;
    const cy = (i: number) => oy + (Math.floor(i / cols) + 0.5) * cs;

    function nb(i: number) {
      const c = i % cols,
        r = (i / cols) | 0,
        o: number[] = [];
      if (c > 0) o.push(i - 1);
      if (c < cols - 1) o.push(i + 1);
      if (r > 0) o.push(i - cols);
      if (r < rows - 1) o.push(i + cols);
      return o;
    }

    function colors() {
      const s = getComputedStyle(document.documentElement);
      const v = (n: string) => s.getPropertyValue(n).trim();
      col = {
        sheen: v('--hero-sheen') || 'rgba(255,255,255,0.5)',
        soft: v('--hero-trace') || 'rgba(16,16,16,0.5)',
        ray: v('--hero-ink') || '#101010',
        ink: v('--bot') || '#101010',
        floor: v('--hero-bg') || '#FFD400',
        beacon: v('--beacon') || '#FFFFFF'
      };
    }

    function flood(start: number) {
      const seen = new Uint8Array(cols * rows),
        q = [start];
      seen[start] = 1;
      let n = 0;
      while (q.length) {
        const i = q.pop()!;
        n++;
        for (const k of nb(i)) {
          if (!grid[k] && !seen[k]) {
            seen[k] = 1;
            q.push(k);
          }
        }
      }
      return { seen, n };
    }

    function recount() {
      count = 0;
      let userObs = 0;
      for (let i = 0; i < cov.length; i++) {
        if (cov[i] && reach[i]) count++;
        if (grid[i] === 2) userObs++;
      }
      setObstacleCount(userObs);
    }

    function build() {
      if (!heroEl || !cv) return;
      const box = heroEl.getBoundingClientRect();
      W = box.width;
      H = box.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cs = W < 700 ? 30 : W < 1100 ? 36 : 42;
      cols = Math.max(4, Math.floor(W / cs));
      rows = Math.max(4, Math.floor(H / cs));
      ox = (W - cols * cs) / 2;
      oy = (H - rows * cs) / 2;
      grid = new Uint8Array(cols * rows);
      cov = new Uint8Array(cols * rows);

      const obsEls = heroEl.querySelectorAll('[data-obstacle]');
      obsEls.forEach(el => {
        const r = el.getBoundingClientRect(),
          pad = 5;
        const c0 = clamp(Math.floor((r.left - box.left - pad - ox) / cs), 0, cols - 1);
        const c1 = clamp(Math.floor((r.right - box.left + pad - ox) / cs), 0, cols - 1);
        const r0 = clamp(Math.floor((r.top - box.top - pad - oy) / cs), 0, rows - 1);
        const r1 = clamp(Math.floor((r.bottom - box.top + pad - oy) / cs), 0, rows - 1);
        for (let rr = r0; rr <= r1; rr++) {
          for (let cc = c0; cc <= c1; cc++) {
            grid[rr * cols + cc] = 1;
          }
        }
      });

      let best: { seen: Uint8Array; n: number } | null = null;
      const done = new Uint8Array(cols * rows);
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] || done[i]) continue;
        const f = flood(i);
        for (let k = 0; k < done.length; k++) if (f.seen[k]) done[k] = 1;
        if (!best || f.n > best.n) best = f;
      }
      if (!best) {
        reach = new Uint8Array(cols * rows);
        total = 0;
        return;
      }
      reach = best.seen;
      total = best.n;
      let start = -1;
      for (let r = 0; r < rows && start < 0; r++) {
        for (let c = cols - 1; c >= 0; c--) {
          if (reach[r * cols + c]) {
            start = r * cols + c;
            break;
          }
        }
      }
      bot.i = start;
      bot.x = cx(start);
      bot.y = cy(start);
      bot.to = -1;
      bot.hd = -1;
      bot.a = Math.PI;
      cov[start] = 1;
      count = 1;
      trail = [start];
      queue = [];
      dots = new Map();
      rays = [];
      doneAt = 0;
      setObstacleCount(0);
    }

    function pick(): number {
      if (queue.length) return queue.shift()!;
      const i = bot.i,
        c = i % cols,
        r = (i / cols) | 0;
      const ok = (cc: number, rr: number) =>
        cc >= 0 && cc < cols && rr >= 0 && rr < rows && reach[rr * cols + cc] && !cov[rr * cols + cc];
      if (ok(c + bot.hd, r)) return i + bot.hd;
      if (ok(c - bot.hd, r)) {
        bot.hd = -bot.hd;
        return i + bot.hd;
      }
      if (ok(c, r + 1)) return i + cols;
      if (ok(c, r - 1)) return i - cols;

      const prev = new Int32Array(cols * rows).fill(-1),
        q = [i];
      prev[i] = i;
      let found = -1;
      for (let h = 0; h < q.length; h++) {
        const k = q[h];
        if (!cov[k]) {
          found = k;
          break;
        }
        for (const n of nb(k)) {
          if (reach[n] && prev[n] < 0) {
            prev[n] = k;
            q.push(n);
          }
        }
      }
      if (found < 0) return -1;
      const path: number[] = [];
      for (let k = found; k !== i; k = prev[k]) path.push(k);
      path.reverse();
      queue = path;
      return queue.shift()!;
    }

    function arrive(n: number) {
      bot.i = n;
      trail.push(n);
      if (!cov[n]) {
        cov[n] = 1;
        count++;
      }
    }

    function step(dt: number) {
      if (!total) return;
      if (doneAt) {
        if (performance.now() - doneAt > 2600) {
          cov.fill(0);
          cov[bot.i] = 1;
          count = 1;
          trail = [bot.i];
          queue = [];
          doneAt = 0;
        }
        return;
      }
      if (bot.to < 0) {
        const n = pick();
        if (n < 0) {
          doneAt = performance.now();
          return;
        }
        bot.to = n;
        bot.fx = bot.x;
        bot.fy = bot.y;
        bot.tx = cx(n);
        bot.ty = cy(n);
        bot.t = 0;
      }
      bot.t += dt * SPEED;
      const t = Math.min(1, bot.t);
      bot.x = bot.fx + (bot.tx - bot.fx) * t;
      bot.y = bot.fy + (bot.ty - bot.fy) * t;
      let d = Math.atan2(bot.ty - bot.fy, bot.tx - bot.fx) - bot.a;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      bot.a += d * Math.min(1, dt * 14);
      if (bot.t >= 1) {
        arrive(bot.to);
        bot.to = -1;
      }
    }

    function lidar(dt: number) {
      for (let k = 0; k < 3; k++) {
        spin += 0.09;
        const dx = Math.cos(spin),
          dy = Math.sin(spin),
          max = cs * 7;
        let x = bot.x,
          y = bot.y,
          hit = -1;
        for (let d = cs * 0.45; d < max; d += 4) {
          x = bot.x + dx * d;
          y = bot.y + dy * d;
          const c = Math.floor((x - ox) / cs),
            r = Math.floor((y - oy) / cs);
          if (c < 0 || r < 0 || c >= cols || r >= rows) break;
          if (grid[r * cols + c]) {
            hit = r * cols + c;
            break;
          }
        }
        rays.push({ x, y, l: 1, hit: hit >= 0 });
        if (hit >= 0 && dots.size < 6000) {
          const key = ((x / 3) | 0) + ',' + ((y / 3) | 0);
          if (!dots.has(key)) dots.set(key, [x, y, hit]);
        }
      }
      for (const r of rays) r.l -= dt * 3.2;
      rays = rays.filter(r => r.l > 0);
    }

    function rr(x: number, y: number, w: number, h: number, r: number) {
      if (!ctx) return;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    }

    function draw() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!total) return;

      ctx.beginPath();
      ctx.moveTo(cx(trail[0]), cy(trail[0]));
      for (let k = 1; k < trail.length; k++) ctx.lineTo(cx(trail[k]), cy(trail[k]));
      ctx.lineTo(bot.x, bot.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = cs * 0.8;
      ctx.strokeStyle = col.sheen;
      ctx.stroke();
      ctx.lineWidth = 1.25;
      ctx.setLineDash([2, 7]);
      ctx.strokeStyle = col.soft;
      ctx.stroke();
      ctx.setLineDash([]);

      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 2) {
          const x = cx(i),
            y = cy(i);
          ctx.fillStyle = col.ray;
          ctx.beginPath();
          ctx.arc(x, y, cs * 0.2, 0, 7);
          ctx.fill();
          ctx.strokeStyle = col.ray;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, cs * 0.36, 0, 7);
          ctx.stroke();
        }
      }

      ctx.fillStyle = col.ray;
      ctx.globalAlpha = 0.55;
      for (const d of dots.values()) ctx.fillRect(d[0] - 1, d[1] - 1, 2, 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col.ray;
      ctx.lineWidth = 1;
      for (const r of rays) {
        ctx.globalAlpha = r.l * (r.hit ? 0.5 : 0.16);
        ctx.beginPath();
        ctx.moveTo(bot.x, bot.y);
        ctx.lineTo(r.x, r.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const R = cs * 0.36;
      ctx.save();
      ctx.translate(bot.x, bot.y);
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath();
      ctx.arc(1.5, 3.5, R * 1.08, 0, 7);
      ctx.fill();
      ctx.rotate(bot.a);
      ctx.fillStyle = col.ink;
      rr(-R, -R * 0.84, R * 2, R * 1.68, R * 0.55);
      ctx.fill();
      ctx.fillStyle = col.floor;
      rr(R * 0.5, -R * 0.5, R * 0.24, R, R * 0.12);
      ctx.fill();
      ctx.fillStyle = col.beacon;
      ctx.beginPath();
      ctx.arc(-R * 0.25, 0, R * 0.26, 0, 7);
      ctx.fill();
      ctx.restore();
    }

    function readout() {
      if (pct) {
        pct.textContent = (total ? Math.round((100 * count) / total) : 0) + '%';
      }
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      lidar(dt);
      draw();
      readout();
      rafId = requestAnimationFrame(frame);
    }

    function play() {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    function settle() {
      let guard = 0,
        n = -1;
      while (guard++ < 60000 && (n = pick()) >= 0) arrive(n);
      bot.x = cx(bot.i);
      bot.y = cy(bot.i);
      draw();
      readout();
    }

    function reset() {
      colors();
      build();
      if (reduce) settle();
      else {
        draw();
        readout();
        play();
      }
    }

    resetFnRef.current = reset;

    const handleHeroClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a,button,[contenteditable="true"]') || !total) return;
      const box = heroEl.getBoundingClientRect();
      const c = Math.floor((e.clientX - box.left - ox) / cs);
      const r = Math.floor((e.clientY - box.top - oy) / cs);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const i = r * cols + c;
      if (grid[i] === 1 || i === bot.i || i === bot.to) return;
      if (grid[i] === 2) {
        grid[i] = 0;
        for (const [k, d] of dots) if (d[2] === i) dots.delete(k);
      } else {
        grid[i] = 2;
        cov[i] = 0;
      }
      reach = flood(bot.i).seen;
      total = 0;
      for (let k = 0; k < reach.length; k++) total += reach[k];
      recount();
      queue = [];
      if (doneAt && count < total) doneAt = 0;
      if (reduce) {
        cov.fill(0);
        cov[bot.i] = 1;
        trail = [bot.i];
        recount();
        settle();
      }
    };

    heroEl.addEventListener('click', handleHeroClick);

    let timer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const b = heroEl.getBoundingClientRect();
        if (Math.abs(b.width - W) > 1 || Math.abs(b.height - H) > 1) reset();
      }, 180);
    });
    ro.observe(heroEl);

    const io = new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible) play();
      else pause();
    });
    io.observe(heroEl);

    const onVisChange = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVisChange);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reset);
    }
    reset();

    return () => {
      pause();
      clearTimeout(timer);
      heroEl.removeEventListener('click', handleHeroClick);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  useEffect(() => {
    if (resetFnRef.current) {
      const t = setTimeout(() => {
        if (resetFnRef.current) resetFnRef.current();
      }, 40);
      return () => clearTimeout(t);
    }
  }, [palette, theme, styleOverrides.customColors]);

  const ts = styleOverrides.textStyles || {};

  return (
    <section className="hero" id="top" ref={heroRef}>
      <canvas id="floor" ref={canvasRef} aria-hidden="true" />
      <div className="hero-inner">
        <div className="name-wrap" data-obstacle>
          <h1 className="display" data-tkey="hero-name">
            <EditableText
              as="span"
              tkey="hero-first-name"
              label="Hero First Name"
              value={hero.firstName}
              onChange={v => onUpdateHero({ firstName: v })}
              editing={editing}
              customStyle={ts['hero-first-name']}
              isSelected={activeTextSelection?.tkey === 'hero-first-name'}
              onSelectForStyle={onSelectText}
            />
            <EditableText
              as="span"
              tkey="hero-last-name"
              label="Hero Last Name"
              value={hero.lastName}
              onChange={v => onUpdateHero({ lastName: v })}
              editing={editing}
              customStyle={ts['hero-last-name']}
              isSelected={activeTextSelection?.tkey === 'hero-last-name'}
              onSelectForStyle={onSelectText}
            />
          </h1>
        </div>
        <div className="pitch" data-obstacle>
          <EditableText
            as="p"
            tkey="hero-pitch-1"
            label="Hero Lead Pitch"
            value={hero.pitchLead}
            onChange={v => onUpdateHero({ pitchLead: v })}
            editing={editing}
            customStyle={ts['hero-pitch-1']}
            isSelected={activeTextSelection?.tkey === 'hero-pitch-1'}
            onSelectForStyle={onSelectText}
          />
          <EditableText
            as="p"
            tkey="hero-pitch-2"
            label="Hero Secondary Pitch"
            value={hero.pitchSub}
            onChange={v => onUpdateHero({ pitchSub: v })}
            editing={editing}
            customStyle={ts['hero-pitch-2']}
            isSelected={activeTextSelection?.tkey === 'hero-pitch-2'}
            onSelectForStyle={onSelectText}
          />
        </div>
        <div className="cta" data-obstacle>
          {editing ? (
            <>
              <EditableText
                as="span"
                className="btn solid"
                tkey="hero-cta-1"
                label="Primary CTA Button"
                value={hero.ctaPrimaryText}
                onChange={v => onUpdateHero({ ctaPrimaryText: v })}
                editing={editing}
                customStyle={ts['hero-cta-1']}
                isSelected={activeTextSelection?.tkey === 'hero-cta-1'}
                onSelectForStyle={onSelectText}
              />
              <EditableText
                as="span"
                className="btn"
                tkey="hero-cta-2"
                label="Secondary CTA Button"
                value={hero.ctaSecondaryText}
                onChange={v => onUpdateHero({ ctaSecondaryText: v })}
                editing={editing}
                customStyle={ts['hero-cta-2']}
                isSelected={activeTextSelection?.tkey === 'hero-cta-2'}
                onSelectForStyle={onSelectText}
              />
            </>
          ) : (
            <>
              <a
                className="btn solid"
                href={hero.ctaPrimaryHref}
                data-tkey="hero-cta-1"
                style={{
                  ...(ts['hero-cta-1']?.fontSizePct ? { fontSize: `${ts['hero-cta-1'].fontSizePct}%` } : {}),
                  ...(ts['hero-cta-1']?.color ? { color: ts['hero-cta-1'].color } : {})
                }}
              >
                {hero.ctaPrimaryText}
              </a>
              <a
                className="btn"
                href={hero.ctaSecondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                data-tkey="hero-cta-2"
                style={{
                  ...(ts['hero-cta-2']?.fontSizePct ? { fontSize: `${ts['hero-cta-2'].fontSizePct}%` } : {}),
                  ...(ts['hero-cta-2']?.color ? { color: ts['hero-cta-2'].color } : {})
                }}
              >
                {hero.ctaSecondaryText}
              </a>
            </>
          )}
        </div>
      </div>
      <div className="hud" data-obstacle>
        <strong className="tnum" id="cov" ref={covRef}>
          0%
        </strong>
        <EditableText
          as="span"
          tkey="hero-hud-label"
          label="HUD Coverage Label"
          value={hero.hudLabel}
          onChange={v => onUpdateHero({ hudLabel: v })}
          editing={editing}
          customStyle={ts['hero-hud-label']}
          isSelected={activeTextSelection?.tkey === 'hero-hud-label'}
          onSelectForStyle={onSelectText}
          style={{ display: 'inline', color: '#101010', fontSize: '0.9375rem' }}
        />
        <EditableText
          as="span"
          tkey="hero-hud-hint"
          label="HUD Obstacle Hint"
          value={hero.hudHint + (obstacleCount > 0 ? ` (${obstacleCount} placed)` : '')}
          onChange={v => onUpdateHero({ hudHint: v })}
          editing={editing}
          customStyle={ts['hero-hud-hint']}
          isSelected={activeTextSelection?.tkey === 'hero-hud-hint'}
          onSelectForStyle={onSelectText}
        />
      </div>
    </section>
  );
};
