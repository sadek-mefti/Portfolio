/**
 * Procedural SLAM telemetry maps for robot deployment cards and
 * architectural schematic previews for all 8 "Built and shipped" projects.
 */

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const bg = (w: number, h: number) => `<rect width="${w}" height="${h}" fill="url(#slam)"/>`;
const botMark = (x: number, y: number, cls = '') =>
  `<g class="${cls}"><circle class="a-bot" cx="${x}" cy="${y}" r="8"/><circle class="a-beacon" cx="${x}" cy="${y}" r="3"/></g>`;

export function artCoverage(w: number, h: number, rand: () => number): string {
  const m = 14,
    L = m + 16,
    R = w - m - 16,
    lanes = 7,
    y0 = m + 18,
    gap = (h - 2 * m - 36) / (lanes - 1);
  const y = (i: number) => +(y0 + i * gap).toFixed(1);
  const l = Array(lanes).fill(L),
    r = Array(lanes).fill(R);
  let obs = '';
  const leftStart = Math.floor(rand() * 3),
    rightStart = 3 + Math.floor(rand() * 3);
  [
    [0, leftStart],
    [1, rightStart]
  ].forEach(([side, s]) => {
    const depth = Math.round(w * (0.16 + rand() * 0.16)),
      span = 2;
    const top = y(s) - gap / 2 + 3,
      hh = gap * span - 6;
    if (side === 0) {
      for (let i = s; i < s + span; i++) l[i] = m + depth + 16;
      obs += `<rect class="a-ob" x="${m}" y="${top.toFixed(1)}" width="${depth}" height="${hh.toFixed(1)}" rx="3"/>`;
    } else {
      for (let i = s; i < s + span; i++) r[i] = w - m - depth - 16;
      obs += `<rect class="a-ob" x="${w - m - depth}" y="${top.toFixed(1)}" width="${depth}" height="${hh.toFixed(1)}" rx="3"/>`;
    }
  });
  let dir = 1,
    d = `M${l[lanes - 1]} ${y(lanes - 1)}`,
    ex = 0;
  for (let i = lanes - 1; i >= 0; i--) {
    const end = dir > 0 ? r[i] : l[i];
    d += `H${end}`;
    ex = end;
    if (i > 0) {
      const nextNear = dir > 0 ? r[i - 1] : l[i - 1];
      const turn = dir > 0 ? Math.min(end, nextNear) : Math.max(end, nextNear);
      if (turn !== end) d += `H${turn}`;
      d += `V${y(i - 1)}`;
      if (turn !== nextNear) d += `H${nextNear}`;
      dir = -dir;
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg(w, h)}
    <rect class="a-room" x="${m}" y="${m}" width="${w - 2 * m}" height="${h - 2 * m}" rx="6"/>${obs}
    <path class="a-sheen" pathLength="1" d="${d}"/><path class="a-route" pathLength="1" d="${d}"/>
    ${botMark(ex, y(0))}</svg>`;
}

export function artGreet(w: number, h: number, rand: () => number): string {
  const cx = w / 2,
    cy = h - 40;
  const arc = (r: number) => `<path class="a-zone" d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}"/>`;
  const people: [number, number, number, number][] = [];
  const n = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (1.12 + (0.76 * (i + 0.2 + rand() * 0.6)) / n),
      rr = 52 + rand() * 66;
    people.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rr, a]);
  }
  const near = people.reduce((p, q) => (q[2] < p[2] ? q : p));
  const wa = near[3],
    spread = 0.3,
    wr = 124;
  const wedge = `<path class="a-wedge" d="M${cx} ${cy}L${(cx + Math.cos(wa - spread) * wr).toFixed(1)} ${(cy + Math.sin(wa - spread) * wr).toFixed(1)}A${wr} ${wr} 0 0 1 ${(cx + Math.cos(wa + spread) * wr).toFixed(1)} ${(cy + Math.sin(wa + spread) * wr).toFixed(1)}Z"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg(w, h)}
    <path class="a-room" d="M14 ${cy + 20}H${w - 14}"/>${wedge}${arc(46)}${arc(84)}${arc(122)}
    <path class="a-route" pathLength="1" d="M${cx} ${cy}L${near[0].toFixed(1)} ${near[1].toFixed(1)}"/>
    ${people.map(p => `<circle class="a-person" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="6.5"/>`).join('')}
    ${botMark(cx, cy)}</svg>`;
}

export function artScreen(w: number, h: number, rand: () => number): string {
  const kw = 108,
    kh = 150,
    kx = (w - kw) / 2,
    ky = (h - kh) / 2;
  let bars = '';
  for (let i = 0; i < 9; i++) {
    const bh = 6 + rand() * 22;
    bars += `<rect class="a-bar" x="${(kx + 20 + i * 8).toFixed(1)}" y="${(ky + kh - 22 - bh).toFixed(1)}" width="4" height="${bh.toFixed(1)}" rx="2"/>`;
  }
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg(w, h)}
    <path class="a-room" d="M14 ${ky + kh + 8}H${w - 14}"/>
    <rect class="a-ob" x="${kx}" y="${ky}" width="${kw}" height="${kh}" rx="9"/>
    <circle class="a-thin" cx="${w / 2}" cy="${ky + 44}" r="15"/>
    <path class="a-thin" d="M${w / 2 - 30} ${ky + 92}c0-18 13-27 30-27s30 9 30 27"/>
    ${bars}
    <circle class="a-person" cx="${kx - 46}" cy="${ky + kh - 26}" r="6.5"/><circle class="a-person" cx="${kx + kw + 52}" cy="${ky + kh - 40}" r="6.5"/>
    <path class="a-zone" d="M${kx - 38} ${ky + kh - 30}L${kx - 6} ${ky + 70}"/></svg>`;
}

export function artBench(w: number, h: number): string {
  const pts = [
    [w / 2, 40],
    [w / 2, 78],
    [w / 2 - 44, 92],
    [w / 2 - 62, 132],
    [w / 2 + 44, 92],
    [w / 2 + 66, 128],
    [w / 2 - 18, 128],
    [w / 2 - 22, 168],
    [w / 2 + 18, 128],
    [w / 2 + 24, 168]
  ];
  const links = [
    [0, 1],
    [1, 2],
    [2, 3],
    [1, 4],
    [4, 5],
    [1, 6],
    [6, 7],
    [1, 8],
    [8, 9]
  ];
  const fault = 4;
  const d = links.map(([a, b]) => `M${pts[a][0]} ${pts[a][1]}L${pts[b][0]} ${pts[b][1]}`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${bg(w, h)}
    <rect class="a-room" x="14" y="14" width="${w - 28}" height="${h - 28}" rx="6"/>
    <path class="a-thin" pathLength="1" d="${d}"/>
    ${pts.map((p, i) => (i === fault ? '' : `<circle class="a-person" cx="${p[0]}" cy="${p[1]}" r="${i === 0 ? 11 : 5}"/>`)).join('')}
    <circle class="a-fault" cx="${pts[fault][0]}" cy="${pts[fault][1]}" r="6"/>
    <circle class="a-zone" cx="${pts[fault][0]}" cy="${pts[fault][1]}" r="20"/>
    <path class="a-route" d="M${pts[fault][0] + 20} ${pts[fault][1] - 14}L${w - 60} 44H${w - 26}"/></svg>`;
}

export const SLAM_ART_GENERATORS: Record<string, (w: number, h: number, rand: () => number) => string> = {
  coverage: artCoverage,
  greet: artGreet,
  screen: artScreen,
  bench: (w, h) => artBench(w, h)
};

/**
 * Rich architectural SVG schematics for all 8 "Built and shipped" engineering projects
 */
export const PROJECT_SCHEMATICS_SVG: Record<string, string> = {
  'fleet-telemetry': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <!-- Robot Fleet Nodes -->
    <g transform="translate(26, 30)">
      <rect x="0" y="0" width="124" height="44" rx="5" class="a-ob"/>
      <circle cx="22" cy="22" r="7" class="a-bot"/><circle cx="22" cy="22" r="2.5" class="a-beacon"/>
      <text x="38" y="20" font-family="Archivo, sans-serif" font-weight="700" font-size="11" fill="currentColor">Gausium Cloud</text>
      <text x="38" y="33" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">MQTT / REST</text>

      <rect x="0" y="58" width="124" height="44" rx="5" class="a-ob"/>
      <circle cx="22" cy="80" r="7" class="a-bot"/><circle cx="22" cy="80" r="2.5" class="a-beacon"/>
      <text x="38" y="78" font-family="Archivo, sans-serif" font-weight="700" font-size="11" fill="currentColor">BrainOS Whiz</text>
      <text x="38" y="91" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">150+ Active Units</text>

      <rect x="0" y="116" width="124" height="44" rx="5" class="a-ob"/>
      <circle cx="22" cy="138" r="7" class="a-bot"/><circle cx="22" cy="138" r="2.5" class="a-beacon"/>
      <text x="38" y="136" font-family="Archivo, sans-serif" font-weight="700" font-size="11" fill="currentColor">Site Map Logs</text>
      <text x="38" y="149" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">DXB · Dubai Mall</text>
    </g>
    <!-- Connectors -->
    <path d="M150 52H195V110H218M150 110H218M150 168H195V110" class="a-route"/>
    <!-- Processing Engine -->
    <g transform="translate(218, 66)">
      <rect x="0" y="0" width="130" height="88" rx="6" class="a-ob"/>
      <text x="65" y="28" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="12" fill="currentColor">TELEMETRY ETL</text>
      <text x="65" y="46" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Coverage m²/hr</text>
      <text x="65" y="62" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">SLA &amp; Uptime %</text>
      <rect x="20" y="71" width="90" height="6" rx="3" class="a-bar"/>
    </g>
    <path d="M348 110H392" class="a-route"/>
    <!-- Output Analytics Card -->
    <g transform="translate(392, 34)">
      <rect x="0" y="0" width="142" height="152" rx="6" class="a-ob"/>
      <text x="16" y="25" font-family="Archivo, sans-serif" font-weight="800" font-size="11.5" fill="currentColor">SLA DASHBOARD</text>
      <text x="16" y="48" font-family="Archivo, sans-serif" font-weight="800" font-size="24" fill="currentColor">99.2%</text>
      <text x="86" y="46" font-family="JetBrains Mono, monospace" font-size="9" fill="#595955">UPTIME</text>
      <rect x="16" y="102" width="12" height="32" rx="2" class="a-bar"/>
      <rect x="34" y="88" width="12" height="46" rx="2" class="a-bar"/>
      <rect x="52" y="76" width="12" height="58" rx="2" class="a-bar"/>
      <rect x="70" y="82" width="12" height="52" rx="2" class="a-bar"/>
      <rect x="88" y="68" width="12" height="66" rx="2" class="a-bar"/>
      <rect x="106" y="60" width="12" height="74" rx="2" class="a-bar"/>
    </g>
  </svg>`,

  'launch-playbooks': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(28, 42)">
      <!-- Phase 1 -->
      <rect x="0" y="0" width="114" height="136" rx="6" class="a-ob"/>
      <text x="14" y="26" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11" fill="#595955">01. SITE AUDIT</text>
      <text x="14" y="48" font-family="Archivo, sans-serif" font-weight="800" font-size="14" fill="currentColor">SLAM Mapping</text>
      <path d="M14 68H98M14 84H84M14 100H92" class="a-thin"/>
      <circle cx="92" cy="116" r="7" class="a-bot"/><circle cx="92" cy="116" r="2.5" class="a-beacon"/>
      <!-- Phase 2 -->
      <rect x="132" y="0" width="114" height="136" rx="6" class="a-ob"/>
      <text x="146" y="26" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11" fill="#595955">02. ENABLEMENT</text>
      <text x="146" y="48" font-family="Archivo, sans-serif" font-weight="800" font-size="14" fill="currentColor">FM Crew SOPs</text>
      <path d="M146 68H230M146 84H216M146 100H224" class="a-thin"/>
      <text x="146" y="120" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">AR · FR · EN</text>
      <!-- Phase 3 -->
      <rect x="264" y="0" width="114" height="136" rx="6" class="a-ob"/>
      <text x="278" y="26" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11" fill="#595955">03. DIAGNOSTICS</text>
      <text x="278" y="48" font-family="Archivo, sans-serif" font-weight="800" font-size="14" fill="currentColor">Field Triage</text>
      <path d="M278 68H362M278 84H348M278 100H356" class="a-thin"/>
      <text x="278" y="120" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">L1–L3 Repair</text>
      <!-- Phase 4 -->
      <rect x="396" y="0" width="108" height="136" rx="6" class="a-ob"/>
      <text x="410" y="26" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11" fill="#595955">04. HANDOVER</text>
      <text x="410" y="48" font-family="Archivo, sans-serif" font-weight="800" font-size="14" fill="currentColor">SLA Sign-Off</text>
      <rect x="410" y="68" width="80" height="48" rx="4" class="a-room"/>
      <path d="M436 92L446 102L466 80" class="a-route"/>
    </g>
    <path d="M142 110H160M274 110H292M406 110H424" class="a-route"/>
  </svg>`,

  'serverless-endpoints': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(26, 48)">
      <rect x="0" y="0" width="118" height="124" rx="6" class="a-ob"/>
      <text x="59" y="34" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="13" fill="currentColor">HIS / EMR</text>
      <text x="59" y="54" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#595955">Hospital Client</text>
      <text x="59" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">JWT · OAuth 2.0</text>
      <text x="59" y="102" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">CORS Policy</text>
    </g>
    <path d="M144 110H210" class="a-route"/>
    <g transform="translate(210, 34)">
      <rect x="0" y="0" width="144" height="152" rx="6" class="a-ob"/>
      <circle cx="72" cy="40" r="16" class="a-bot"/>
      <text x="72" y="45" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="14" fill="#FFFFFF">λ</text>
      <text x="72" y="76" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="13.5" fill="currentColor">AWS LAMBDA</text>
      <text x="72" y="95" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Serverless Validator</text>
      <text x="72" y="116" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">JSON ⇄ XML Parser</text>
      <text x="72" y="134" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Schema Check</text>
    </g>
    <path d="M354 110H416" class="a-route"/>
    <g transform="translate(416, 48)">
      <rect x="0" y="0" width="118" height="124" rx="6" class="a-ob"/>
      <text x="59" y="34" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="13" fill="currentColor">RCM CORE</text>
      <text x="59" y="54" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#595955">Claims Engine</text>
      <text x="59" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">DHA · DoH · MOHAP</text>
      <text x="59" y="102" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">200 OK Validated</text>
    </g>
  </svg>`,

  'healthcare-poc': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(36, 24)">
      <rect x="0" y="0" width="488" height="172" rx="7" class="a-ob"/>
      <line x1="0" y1="30" x2="488" y2="30" class="a-room"/>
      <circle cx="18" cy="15" r="4" class="a-bot"/>
      <circle cx="32" cy="15" r="4" class="a-thin"/>
      <circle cx="46" cy="15" r="4" class="a-thin"/>
      <text x="68" y="19" font-family="JetBrains Mono, monospace" font-size="10" fill="#595955">poc-validator-console.py — Live RCM Sandbox</text>
      <!-- Left Pane -->
      <rect x="16" y="44" width="212" height="112" rx="4" class="a-room"/>
      <text x="28" y="64" font-family="JetBrains Mono, monospace" font-weight="700" font-size="10.5" fill="currentColor">POST /v2/claims/validate</text>
      <text x="28" y="84" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">{ "provider": "UAE-HEALTH",</text>
      <text x="28" y="100" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">  "auth": "Bearer eyJhbG...",</text>
      <text x="28" y="116" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">  "format": "HL7_JSON" }</text>
      <path d="M228 100H260" class="a-route"/>
      <!-- Right Pane -->
      <rect x="260" y="44" width="212" height="112" rx="4" class="a-room"/>
      <text x="274" y="64" font-family="Archivo, sans-serif" font-weight="800" font-size="12" fill="currentColor">LIVE VALIDATION PASS</text>
      <rect x="274" y="78" width="160" height="8" rx="4" class="a-bar"/>
      <rect x="274" y="96" width="128" height="8" rx="4" class="a-bar"/>
      <text x="274" y="128" font-family="JetBrains Mono, monospace" font-size="10" fill="#595955">Partner Onboarding: -60% Time</text>
    </g>
  </svg>`,

  'samsung-knox': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(32, 34)">
      <rect x="0" y="0" width="156" height="152" rx="6" class="a-ob"/>
      <text x="78" y="34" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="14" fill="currentColor">SAMSUNG KNOX</text>
      <text x="78" y="52" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">MSP Premium Partner</text>
      <rect x="22" y="68" width="112" height="24" rx="3" class="a-room"/>
      <text x="78" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="currentColor">MDM Container</text>
      <rect x="22" y="102" width="112" height="24" rx="3" class="a-room"/>
      <text x="78" y="118" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="currentColor">Knox E-FOTA</text>
    </g>
    <path d="M188 110H244" class="a-route"/>
    <g transform="translate(244, 52)">
      <rect x="0" y="0" width="120" height="116" rx="6" class="a-ob"/>
      <text x="60" y="34" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="13" fill="currentColor">du 5G APN</text>
      <text x="60" y="56" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="20" fill="currentColor">AED 40M+</text>
      <text x="60" y="76" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">+ Grabba Biometrics</text>
      <circle cx="60" cy="96" r="6" class="a-bot"/><circle cx="60" cy="96" r="2" class="a-beacon"/>
    </g>
    <path d="M364 110H416" class="a-route"/>
    <g transform="translate(416, 38)">
      <rect x="0" y="0" width="112" height="42" rx="4" class="a-ob"/>
      <text x="56" y="25" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">Field Fleet A</text>
      <rect x="0" y="51" width="112" height="42" rx="4" class="a-ob"/>
      <text x="56" y="76" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">Field Fleet B</text>
      <rect x="0" y="102" width="112" height="42" rx="4" class="a-ob"/>
      <text x="56" y="127" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">Gov Endpoints</text>
    </g>
  </svg>`,

  'digital-avatar-poc': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(46, 26)">
      <rect x="0" y="0" width="124" height="168" rx="8" class="a-ob"/>
      <circle cx="62" cy="52" r="20" class="a-thin"/>
      <path d="M30 108C30 88 44 78 62 78C80 78 94 88 94 108" class="a-thin"/>
      <rect x="24" y="126" width="8" height="22" rx="2" class="a-bar"/>
      <rect x="38" y="118" width="8" height="30" rx="2" class="a-bar"/>
      <rect x="52" y="112" width="8" height="36" rx="2" class="a-bar"/>
      <rect x="66" y="120" width="8" height="28" rx="2" class="a-bar"/>
      <rect x="80" y="114" width="8" height="34" rx="2" class="a-bar"/>
      <rect x="94" y="124" width="8" height="24" rx="2" class="a-bar"/>
    </g>
    <path d="M170 110H234" class="a-route"/>
    <g transform="translate(234, 42)">
      <rect x="0" y="0" width="280" height="136" rx="6" class="a-ob"/>
      <text x="20" y="30" font-family="Archivo, sans-serif" font-weight="800" font-size="15" fill="currentColor">GITEX 2023 · ETIHAD WE</text>
      <text x="20" y="52" font-family="JetBrains Mono, monospace" font-size="10.5" fill="#595955">Humanizing Technologies Avatar Engine</text>
      <path d="M20 72H256" class="a-room"/>
      <text x="20" y="94" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">• Real-time Arabic &amp; English Voice NLP</text>
      <text x="20" y="114" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">• Utility Billing &amp; Service Triage POC</text>
    </g>
  </svg>`,

  'ai-agents': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(28, 44)">
      <rect x="0" y="26" width="110" height="80" rx="6" class="a-ob"/>
      <text x="55" y="60" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="13.5" fill="currentColor">Make.com</text>
      <text x="55" y="78" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Webhook Router</text>
    </g>
    <path d="M138 110H196M196 56H224M196 110H224M196 164H224M196 56V164" class="a-route"/>
    <g transform="translate(224, 28)">
      <rect x="0" y="0" width="136" height="46" rx="5" class="a-ob"/>
      <text x="68" y="27" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="10.5" fill="currentColor">Gemini · GPT · Claude</text>
      <rect x="0" y="59" width="136" height="46" rx="5" class="a-ob"/>
      <text x="68" y="86" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="10.5" fill="currentColor">Vertex AI · DeepSeek</text>
      <rect x="0" y="118" width="136" height="46" rx="5" class="a-ob"/>
      <text x="68" y="145" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="10.5" fill="currentColor">Runware · Veo · FLUX</text>
    </g>
    <path d="M360 51H388V169H360M360 110H416" class="a-route"/>
    <g transform="translate(416, 52)">
      <rect x="0" y="0" width="116" height="116" rx="6" class="a-ob"/>
      <circle cx="58" cy="36" r="10" class="a-bot"/><circle cx="58" cy="36" r="3.5" class="a-beacon"/>
      <text x="58" y="68" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="12.5" fill="currentColor">AUTO-PUBLISH</text>
      <text x="58" y="88" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">CMS · Social · SEO</text>
    </g>
  </svg>`,

  'websites-apps': `<svg viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="220" fill="url(#slam)"/>
    <g transform="translate(32, 34)">
      <rect x="0" y="0" width="210" height="152" rx="6" class="a-ob"/>
      <line x1="0" y1="26" x2="210" y2="26" class="a-room"/>
      <text x="14" y="17" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">30+ Web &amp; E-Commerce Platforms</text>
      <rect x="14" y="38" width="182" height="44" rx="4" class="a-room"/>
      <text x="105" y="64" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="14" fill="currentColor">SUPABASE REALTIME</text>
      <rect x="14" y="94" width="86" height="44" rx="4" class="a-room"/>
      <text x="57" y="120" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">PostgreSQL</text>
      <rect x="110" y="94" width="86" height="44" rx="4" class="a-room"/>
      <text x="153" y="120" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="currentColor">Auth / RLS</text>
    </g>
    <path d="M242 110H304" class="a-route"/>
    <g transform="translate(304, 34)">
      <rect x="0" y="0" width="102" height="152" rx="10" class="a-ob"/>
      <rect x="12" y="18" width="78" height="114" rx="4" class="a-room"/>
      <text x="51" y="66" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="12" fill="currentColor">ANDROID</text>
      <text x="51" y="84" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Native Client</text>
      <circle cx="51" cy="112" r="6" class="a-bot"/><circle cx="51" cy="112" r="2" class="a-beacon"/>
    </g>
    <g transform="translate(422, 54)">
      <rect x="0" y="0" width="106" height="112" rx="6" class="a-ob"/>
      <text x="53" y="46" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="28" fill="currentColor">30+</text>
      <text x="53" y="68" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Live Sites</text>
      <text x="53" y="86" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9.5" fill="#595955">Since 2012</text>
    </g>
  </svg>`
};
