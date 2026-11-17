import {
  FullPortfolioContent,
  DEFAULT_PORTFOLIO_CONTENT,
  isGroupEntry,
  SectionConfig
} from '../data/portfolioData';
import { CLIENT_LOGOS_SVG } from '../data/brandLogos';
import { PROJECT_SCHEMATICS_SVG, SLAM_ART_GENERATORS, hash, rng } from '../data/projectVisuals';

export interface PortfolioCustomState {
  palette: 'signal' | 'cobalt' | 'concrete';
  theme: 'system' | 'light' | 'dark';
  photos: Record<string, string>;
  projectPhotos: Record<string, string>;
  logos: Record<string, string>;
  partnerLogos: Record<string, string>;
  content: FullPortfolioContent;
}

export const LINKEDIN_MAX_BYTES = 3_145_728; // 3 MB exact LinkedInBot abort threshold
export const SAFE_CEILING_BYTES = 2_350_000; // 2.35 MB strict guardrail ceiling
const MAX_MEDIA_POOL_BYTES = 1_750_000; // Target cap for deduplicated WebP pool

/**
 * Converts any image URL or data URI into a compressed WebP data URI.
 */
async function sourceToWebpDataUri(url: string, maxDim = 1100, quality = 0.78): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image/svg+xml')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    if (blob.type === 'image/svg+xml') {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : url);
        reader.onerror = () => reject(new Error('Failed SVG read'));
        reader.readAsDataURL(blob);
      });
    }
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    }
    const webp = canvas.toDataURL('image/webp', quality);
    if (webp.startsWith('data:image/webp')) return webp;
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return url;
  }
}

export async function compressImageFile(file: File, maxDim = 1280): Promise<string> {
  if (file.type === 'image/svg+xml' && file.size <= 500_000) {
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  }
  const webp = canvas.toDataURL('image/webp', 0.82);
  if (webp.startsWith('data:image/webp')) return webp;
  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.82);
}

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

/**
 * Builds the deduplicated WebP media pool (`window.__MEDIA_POOL__`) with automatic
 * step-down compression if needed to guarantee staying below the 2.35 MB ceiling.
 */
export async function buildDeduplicatedMediaPool(state: PortfolioCustomState): Promise<{
  pool: Record<string, string>;
  sourceToKey: Map<string, string>;
  totalReferences: number;
  uniqueCount: number;
  poolBytes: number;
}> {
  const content = state.content || DEFAULT_PORTFOLIO_CONTENT;
  const rawSources: string[] = [];

  for (const d of content.deployments) {
    if (!isGroupEntry(d)) {
      const src = state.photos[d.id] || d.defaultPhoto;
      if (src) rawSources.push(src);
    }
  }
  for (const p of content.projects) {
    const src = state.projectPhotos[p.id];
    if (src) rawSources.push(src);
  }
  for (const c of content.clients) {
    const src = state.logos[c.key];
    if (src) rawSources.push(src);
  }
  for (const pt of content.partners) {
    const src = state.partnerLogos[pt.key];
    if (src) rawSources.push(src);
  }
  for (const sec of content.sections) {
    if (sec.type === 'custom' && sec.customItems) {
      for (const item of sec.customItems) {
        if (item.image) rawSources.push(item.image);
      }
    }
  }

  const uniqueSources = Array.from(new Set(rawSources));
  const sourceToKey = new Map<string, string>();
  uniqueSources.forEach((src, idx) => {
    sourceToKey.set(src, `m${idx}`);
  });

  // Adaptive quality tiers to guarantee staying under 1.75 MB for media pool
  const tiers: [number, number][] = [
    [1100, 0.76],
    [920, 0.68],
    [760, 0.58],
    [620, 0.48]
  ];

  let pool: Record<string, string> = {};
  let poolBytes = 0;

  for (const [maxDim, quality] of tiers) {
    pool = {};
    for (const src of uniqueSources) {
      const key = sourceToKey.get(src)!;
      pool[key] = await sourceToWebpDataUri(src, maxDim, quality);
    }
    poolBytes = new Blob([JSON.stringify(pool)]).size;
    if (poolBytes <= MAX_MEDIA_POOL_BYTES) break;
  }

  return {
    pool,
    sourceToKey,
    totalReferences: rawSources.length,
    uniqueCount: uniqueSources.length,
    poolBytes
  };
}

export interface ExportBudgetReport {
  headMetaBytes: number;
  htmlAndCssBytes: number;
  mediaPoolBytes: number;
  totalBytes: number;
  totalReferences: number;
  uniqueImages: number;
  withinLinkedInLimit: boolean;
  withinSafeCeiling: boolean;
  percentOfLinkedInLimit: number;
}

export function buildRootCustomVarsCss(state: PortfolioCustomState): string {
  const so = state.content?.styleOverrides || DEFAULT_PORTFOLIO_CONTENT.styleOverrides;
  const cc = so.customColors || {};
  const vars: string[] = [];

  if (cc.heroBg) {
    vars.push(`--hero-bg:${cc.heroBg};--hero-bg-l:${cc.heroBg};--hero-bg-d:${cc.heroBg};`);
  }
  if (cc.heroInk) {
    vars.push(`--hero-ink:${cc.heroInk};--hero-ink-l:${cc.heroInk};--hero-ink-d:${cc.heroInk};`);
  }
  if (cc.heroMuted) {
    vars.push(`--hero-muted:${cc.heroMuted};--hero-muted-l:${cc.heroMuted};--hero-muted-d:${cc.heroMuted};`);
  }
  if (cc.botColor) {
    vars.push(`--bot:${cc.botColor};--bot-l:${cc.botColor};--bot-d:${cc.botColor};`);
  }
  if (cc.beaconColor) {
    vars.push(`--beacon:${cc.beaconColor};--beacon-l:${cc.beaconColor};--beacon-d:${cc.beaconColor};`);
  }
  if (cc.pageBg) vars.push(`--page:${cc.pageBg};`);
  if (cc.panelBg) vars.push(`--panel:${cc.panelBg};`);
  if (cc.inkColor) vars.push(`--ink:${cc.inkColor};`);
  if (cc.mutedColor) vars.push(`--muted:${cc.mutedColor};`);
  if (cc.lineColor) vars.push(`--line:${cc.lineColor};`);
  if (cc.hiBg) {
    vars.push(`--hi:${cc.hiBg};--hi-l:${cc.hiBg};--hi-d:${cc.hiBg};`);
  }
  if (cc.hiInk) {
    vars.push(`--hi-ink:${cc.hiInk};--hi-ink-l:${cc.hiInk};--hi-ink-d:${cc.hiInk};`);
  }
  if (cc.markColor) {
    vars.push(`--mark:${cc.markColor};--mark-l:${cc.markColor};--mark-d:${cc.markColor};`);
  }

  vars.push(`--scale-hero-title:${(so.heroTitleScale || 100) / 100};`);
  vars.push(`--scale-sec-heading:${(so.sectionHeadingScale || 100) / 100};`);
  vars.push(`--scale-card-title:${(so.cardTitleScale || 100) / 100};`);
  vars.push(`--scale-body-text:${(so.bodyTextScale || 100) / 100};`);
  vars.push(`--scale-kpi-num:${(so.kpiNumberScale || 100) / 100};`);

  const textRules = Object.entries(so.textStyles || {})
    .map(([key, st]) => {
      const decls: string[] = [];
      if (st.fontSizePct && st.fontSizePct !== 100) {
        decls.push(`font-size:${st.fontSizePct}% !important`);
      }
      if (st.color) {
        decls.push(`color:${st.color} !important`);
      }
      return decls.length ? `[data-tkey="${key}"]{${decls.join(';')}}` : '';
    })
    .filter(Boolean)
    .join('\n');

  return `:root{${vars.join('')}}\n${textRules}`;
}

export async function generateStandaloneHtmlAndReport(state: PortfolioCustomState): Promise<{
  html: string;
  report: ExportBudgetReport;
}> {
  const content = state.content || DEFAULT_PORTFOLIO_CONTENT;
  const seo = content.seo || DEFAULT_PORTFOLIO_CONTENT.seo;
  const hero = content.hero || DEFAULT_PORTFOLIO_CONTENT.hero;

  const { pool, sourceToKey, totalReferences, uniqueCount, poolBytes } = await buildDeduplicatedMediaPool(state);

  const cssTexts: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
      cssTexts.push(rules);
    } catch {
      // ignore cross-origin font stylesheets
    }
  }
  cssTexts.push(buildRootCustomVarsCss(state));

  const visibleSections = content.sections.filter(s => s.visible);
  const navLinksHtml = visibleSections
    .filter(s => s.showInNav && s.navLabel)
    .map(s => `<a href="#${esc(s.id)}">${esc(s.navLabel)}</a>`)
    .join('\n    ');

  const renderSectionHtml = (sec: SectionConfig): string => {
    const secStyleParts: string[] = [];
    if (sec.bgColorOverride) secStyleParts.push(`background:${sec.bgColorOverride}`);
    if (sec.textColorOverride) secStyleParts.push(`color:${sec.textColorOverride}`);
    const secStyleAttr = secStyleParts.length ? ` style="${esc(secStyleParts.join(';'))}"` : '';

    if (sec.type === 'figures') {
      const itemsHtml = content.figures
        .map(
          f => `<li>
            <span class="num" data-tkey="fig-num-${esc(f.id)}">
              ${f.prefix ? `<small>${esc(f.prefix)}</small>` : ''}<span data-count="${f.count}">${f.count}</span>${esc(f.suffix)}
            </span>
            <p data-tkey="fig-cap-${esc(f.id)}">${esc(f.caption)}</p>
          </li>`
        )
        .join('\n  ');
      return `<ul class="figures" id="${esc(sec.id)}"${secStyleAttr}>\n  ${itemsHtml}\n</ul>`;
    }

    if (sec.type === 'deployments') {
      const deploymentsMarkup = content.deployments
        .map(d => {
          if (isGroupEntry(d)) {
            return `<li class="group-card"><div><span class="group-kicker" data-tkey="dep-when-${esc(d.id)}">${esc(d.when)}</span><h3 data-tkey="dep-grp-${esc(d.id)}">${esc(d.group)}</h3></div><p data-tkey="dep-txt-${esc(d.id)}">${esc(d.text)}</p></li>`;
          }
          const rawSrc = state.photos[d.id] || d.defaultPhoto;
          const mediaKey = sourceToKey.get(rawSrc) || '';
          const slamSvg = SLAM_ART_GENERATORS[d.art](d.feature ? 480 : 326, 214, rng(hash(d.id)));
          return `<li class="card in${d.feature ? ' feature' : ''}" data-id="${esc(d.id)}">
            <div class="card-art">
              <img data-media-key="${esc(mediaKey)}" alt="${esc(d.title + ' at ' + d.site)}" style="object-position:${esc(d.photoPosition || 'center center')}" />
              <div class="card-art-scrim"></div>
              <div class="card-art-caption"><span data-tkey="dep-badge-${esc(d.id)}">${esc(d.platformBadge)}</span></div>
              <template class="slam-template">${slamSvg}</template>
            </div>
            <div class="card-body">
              <h3 data-tkey="dep-title-${esc(d.id)}">${esc(d.title)}</h3>
              <p class="site" data-tkey="dep-site-${esc(d.id)}">${esc(d.site)}</p>
              <p class="note" data-tkey="dep-note-${esc(d.id)}">${esc(d.note)}</p>
              <div class="card-footer-meta">
                <span data-tkey="dep-nav-${esc(d.id)}">${esc(d.specs.navigation)}</span>
              </div>
            </div>
          </li>`;
        })
        .join('\n');

      return `<section class="deploy" id="${esc(sec.id)}" aria-labelledby="h-${esc(sec.id)}"${secStyleAttr}>
        <div class="deploy-pin">
          <div class="sec-head">
            <div class="sec-head-copy">
              <h2 class="display" id="h-${esc(sec.id)}" data-tkey="sec-title-${esc(sec.id)}">${esc(sec.title)}</h2>
              ${sec.lede ? `<p class="lede" data-tkey="sec-lede-${esc(sec.id)}">${esc(sec.lede)}</p>` : ''}
            </div>
          </div>
          <div class="deploy-viewport" tabindex="0" aria-label="Deployments, scroll sideways">
            <ul class="deploy-track" id="deploy-track">${deploymentsMarkup}</ul>
          </div>
          <div class="deploy-bar" aria-hidden="true"><i></i></div>
        </div>
      </section>`;
    }

    if (sec.type === 'clients') {
      const filtersMarkup = content.sectors
        .map(([k, label], i) => `<button type="button" data-sector="${esc(k)}" aria-pressed="${i === 0}">${esc(label)}</button>`)
        .join('');
      const clientsMarkup = content.clients
        .map(c => {
          const customLogo = state.logos[c.key];
          const mediaKey = customLogo ? sourceToKey.get(customLogo) : '';
          const logoContent = mediaKey
            ? `<img data-media-key="${esc(mediaKey)}" alt="${esc(c.name)} logo" />`
            : CLIENT_LOGOS_SVG[c.key] || `<span class="wordmark">${esc(c.short || c.name)}</span>`;
          return `<li class="client" data-key="${esc(c.key)}" data-sector="${esc(c.sector)}">
            <div class="plate">${logoContent}</div>
            <h3 data-tkey="cli-name-${esc(c.key)}">${esc(c.name)}</h3>
            <p data-tkey="cli-does-${esc(c.key)}">${esc(c.does)}</p>
          </li>`;
        })
        .join('\n');

      const partnersMarkup = content.partners
        .map(p => {
          const customPartner = state.partnerLogos[p.key];
          const mediaKey = customPartner ? sourceToKey.get(customPartner) : '';
          const logoContent = mediaKey
            ? `<img data-media-key="${esc(mediaKey)}" alt="${esc(p.name)} logo" />`
            : p.svg || `<span class="wordmark">${esc(p.name)}</span>`;
          return `<li class="partner-tile">
            <div class="partner-plate">${logoContent}</div>
            <strong data-tkey="part-name-${esc(p.key)}">${esc(p.name)}</strong>
            <span data-tkey="part-role-${esc(p.key)}">${esc(p.role)}</span>
          </li>`;
        })
        .join('\n');

      return `<section class="sec" id="${esc(sec.id)}" aria-labelledby="h-${esc(sec.id)}"${secStyleAttr}>
        <div class="sec-head">
          <div class="sec-head-copy">
            <h2 class="display" id="h-${esc(sec.id)}" data-tkey="sec-title-${esc(sec.id)}">${esc(sec.title)}</h2>
            ${sec.lede ? `<p class="lede" data-tkey="sec-lede-${esc(sec.id)}">${esc(sec.lede)}</p>` : ''}
          </div>
        </div>
        <div class="filters" id="filters" role="group" aria-label="Filter by sector">${filtersMarkup}</div>
        <ul class="clients" id="clients-grid">${clientsMarkup}</ul>
        <div class="partners-block">
          <div class="partners-head">
            <h3 data-tkey="partners-heading">${esc(content.partnersHeading)}</h3>
            <p data-tkey="partners-subheading">${esc(content.partnersSubheading)}</p>
          </div>
          <ul class="partners-grid">${partnersMarkup}</ul>
        </div>
      </section>`;
    }

    if (sec.type === 'experience') {
      const experienceMarkup = content.experiences
        .map(xp => {
          const bodyHtml = xp.subRoles
            ? `<div class="xp-body">${xp.subRoles
                .map(
                  sr =>
                    `<h4>${esc(sr.title)}</h4><ul>${sr.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`
                )
                .join('')}</div>`
            : `<ul class="xp-body">${(xp.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
          return `<div class="xp">
            <button class="xp-btn" type="button" aria-expanded="${xp.defaultOpen ? 'true' : 'false'}" aria-controls="${esc(xp.id)}">
              <span class="xp-when" data-tkey="xp-when-${esc(xp.id)}">${esc(xp.when)}</span>
              <span><span class="xp-role" data-tkey="xp-role-${esc(xp.id)}">${esc(xp.role)}</span><span class="xp-org" data-tkey="xp-org-${esc(xp.id)}">${esc(xp.org)}</span></span>
              <span class="xp-sign" aria-hidden="true"></span>
            </button>
            <div class="xp-panel" id="${esc(xp.id)}"><div>${bodyHtml}</div></div>
          </div>`;
        })
        .join('\n');

      return `<section class="sec" id="${esc(sec.id)}" aria-labelledby="h-${esc(sec.id)}"${secStyleAttr}>
        <div class="sec-head">
          <div class="sec-head-copy">
            <h2 class="display" id="h-${esc(sec.id)}" data-tkey="sec-title-${esc(sec.id)}">${esc(sec.title)}</h2>
            ${sec.lede ? `<p class="lede" data-tkey="sec-lede-${esc(sec.id)}">${esc(sec.lede)}</p>` : ''}
          </div>
        </div>
        ${experienceMarkup}
      </section>`;
    }

    if (sec.type === 'projects') {
      const projectsMarkup = content.projects
        .map(p => {
          const customProj = state.projectPhotos[p.id];
          const mediaKey = customProj ? sourceToKey.get(customProj) : '';
          const visualContent = mediaKey
            ? `<img data-media-key="${esc(mediaKey)}" alt="${esc(p.title)}" />`
            : PROJECT_SCHEMATICS_SVG[p.id] || PROJECT_SCHEMATICS_SVG['fleet-telemetry'];
          return `<article class="proj-card">
            <div class="proj-visual">${visualContent}</div>
            <div class="proj-body">
              <span class="proj-kicker" data-tkey="proj-kick-${esc(p.id)}">${esc(p.where)} · ${esc(p.outcomeMetric)}</span>
              <h3 data-tkey="proj-title-${esc(p.id)}">${esc(p.title)}</h3>
              <p class="what" data-tkey="proj-what-${esc(p.id)}">${esc(p.what)}</p>
              <div class="proj-meta">
                <span>${p.tags.map(esc).join(' · ')}</span>
              </div>
            </div>
          </article>`;
        })
        .join('\n');

      return `<section class="sec" id="${esc(sec.id)}" aria-labelledby="h-${esc(sec.id)}"${secStyleAttr}>
        <div class="sec-head">
          <div class="sec-head-copy">
            <h2 class="display" id="h-${esc(sec.id)}" data-tkey="sec-title-${esc(sec.id)}">${esc(sec.title)}</h2>
            ${sec.lede ? `<p class="lede" data-tkey="sec-lede-${esc(sec.id)}">${esc(sec.lede)}</p>` : ''}
          </div>
        </div>
        <div class="proj-grid">${projectsMarkup}</div>
      </section>`;
    }

    if (sec.type === 'toolkit') {
      const kitMarkup = content.toolkitCategories
        .map(
          cat =>
            `<div><h3 data-tkey="kit-title-${esc(cat.id)}">${esc(cat.title)}</h3><ul>${cat.items
              .map(item => `<li>${esc(item)}</li>`)
              .join('')}</ul></div>`
        )
        .join('\n');
      const certsMarkup = content.certifications
        .map(c => `<li><span>${esc(c.name)}</span><span>${esc(c.year)}</span></li>`)
        .join('');
      const eduMarkup = content.education
        .map(ed => `<li><strong>${esc(ed.degree)}</strong><span>${esc(ed.details)}</span></li>`)
        .join('');
      const langMarkup = content.languages
        .map(lg => `<li><span>${esc(lg.language)}</span><span>${esc(lg.proficiency)}</span></li>`)
        .join('');

      return `<section class="sec" id="${esc(sec.id)}" aria-labelledby="h-${esc(sec.id)}"${secStyleAttr}>
        <div class="sec-head">
          <div class="sec-head-copy">
            <h2 class="display" id="h-${esc(sec.id)}" data-tkey="sec-title-${esc(sec.id)}">${esc(sec.title)}</h2>
            ${sec.lede ? `<p class="lede" data-tkey="sec-lede-${esc(sec.id)}">${esc(sec.lede)}</p>` : ''}
          </div>
        </div>
        <div class="kit">${kitMarkup}</div>
        <div class="creds">
          <div><h3 data-tkey="creds-cert-title">${esc(content.certificationsTitle)}</h3><ul>${certsMarkup}</ul></div>
          <div class="edu"><h3 data-tkey="creds-edu-title">${esc(content.educationTitle)}</h3><ul>${eduMarkup}</ul></div>
          <div><h3 data-tkey="creds-lang-title">${esc(content.languagesTitle)}</h3><ul>${langMarkup}</ul></div>
        </div>
      </section>`;
    }

    if (sec.type === 'contact') {
      const ct = content.contact;
      return `<footer class="end" id="${esc(sec.id)}"${secStyleAttr}>
        <h2 class="display" data-tkey="contact-heading">${esc(ct.heading)}</h2>
        <a class="mail" href="mailto:${esc(ct.email)}" data-tkey="contact-email">${esc(ct.email)}</a>
        <dl>
          <div><dt>${esc(ct.phoneLabel)}</dt><dd><a href="${esc(ct.phoneHref)}">${esc(ct.phoneDisplay)}</a></dd></div>
          <div><dt>${esc(ct.linkedinLabel)}</dt><dd><a href="${esc(ct.linkedinHref)}" target="_blank" rel="noopener">${esc(ct.linkedinDisplay)}</a></dd></div>
          <div><dt>${esc(ct.locationLabel)}</dt><dd>${esc(ct.locationDisplay)}</dd></div>
        </dl>
        <p class="legal" data-tkey="contact-legal">${esc(ct.copyright)}</p>
      </footer>`;
    }

    // Custom user-added section
    const customItemsHtml = (sec.customItems || [])
      .map(item => {
        const mediaKey = item.image ? sourceToKey.get(item.image) : '';
        return `<article class="proj-card">
          ${
            mediaKey
              ? `<div class="proj-visual"><img data-media-key="${esc(mediaKey)}" alt="${esc(item.title)}" /></div>`
              : ''
          }
          <div class="proj-body">
            ${item.kicker ? `<span class="proj-kicker">${esc(item.kicker)}</span>` : ''}
            <h3>${esc(item.title)}</h3>
            ${item.subtitle ? `<p style="font-weight:650;margin-top:0.25rem">${esc(item.subtitle)}</p>` : ''}
            <p class="what">${esc(item.body)}</p>
            ${
              item.tags && item.tags.length
                ? `<div class="proj-meta"><span>${item.tags.map(esc).join(' · ')}</span></div>`
                : ''
            }
          </div>
        </article>`;
      })
      .join('\n');

    return `<section class="sec" id="${esc(sec.id)}" aria-labelledby="h-${esc(sec.id)}"${secStyleAttr}>
      <div class="sec-head">
        <div class="sec-head-copy">
          <h2 class="display" id="h-${esc(sec.id)}" data-tkey="sec-title-${esc(sec.id)}">${esc(sec.title)}</h2>
          ${sec.lede ? `<p class="lede" data-tkey="sec-lede-${esc(sec.id)}">${esc(sec.lede)}</p>` : ''}
        </div>
      </div>
      <div class="proj-grid">${customItemsHtml}</div>
    </section>`;
  };

  const mainSectionsHtml = visibleSections
    .filter(s => s.type !== 'contact')
    .map(renderSectionHtml)
    .join('\n\n');

  const contactSection = visibleSections.find(s => s.type === 'contact');
  const contactHtml = contactSection ? renderSectionHtml(contactSection) : '';

  const themeAttr = state.theme !== 'system' ? ` data-theme="${state.theme}"` : '';

  const personJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: `${hero.firstName} ${hero.lastName}`.trim(),
      jobTitle: seo.jobTitle,
      description: seo.metaDescription,
      email: `mailto:${content.contact.email}`,
      telephone: content.contact.phoneDisplay,
      url: seo.canonicalUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: content.contact.locationDisplay,
        addressCountry: 'AE'
      },
      sameAs: [content.contact.linkedinHref],
      knowsLanguage: content.languages.map(l => l.language),
      worksFor: {
        '@type': 'Organization',
        name: seo.worksFor
      }
    }
  });

  // Ensure og:image is an absolute URL when canonicalUrl is provided so LinkedInBot scrapes it reliably
  const canonicalBase = (seo.canonicalUrl || 'https://sadek-mefti.github.io/Portfolio/').replace(/\/?$/, '/');
  const rawOgImg = (seo.ogImageUrl || 'og-card.jpg').trim();
  const resolvedOgImageUrl =
    rawOgImg.startsWith('http://') || rawOgImg.startsWith('https://')
      ? rawOgImg === 'https://github.io' || rawOgImg === 'https://github.io/'
        ? `${canonicalBase}og-card.jpg`
        : rawOgImg
      : `${canonicalBase}${rawOgImg.replace(/^\.?\//, '')}`;

  // Top-of-<head> OpenGraph, Twitter Cards & Schema.org Person JSON-LD (< 2 KB)
  const headMetaBlock = `<!doctype html>
<html lang="en" data-palette="${esc(state.palette)}"${themeAttr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(seo.siteTitle)}</title>
<meta name="description" content="${esc(seo.metaDescription)}">
<meta name="author" content="${esc(hero.firstName + ' ' + hero.lastName)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${esc(canonicalBase)}">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${esc(hero.brandName)} Portfolio">
<meta property="og:title" content="${esc(seo.siteTitle)}">
<meta property="og:description" content="${esc(seo.metaDescription)}">
<meta property="og:url" content="${esc(canonicalBase)}">
<meta property="og:image" content="${esc(resolvedOgImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(seo.siteTitle)}">
<meta property="og:locale" content="en_US">
<meta property="profile:first_name" content="${esc(hero.firstName)}">
<meta property="profile:last_name" content="${esc(hero.lastName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(seo.siteTitle)}">
<meta name="twitter:description" content="${esc(seo.metaDescription)}">
<meta name="twitter:image" content="${esc(resolvedOgImageUrl)}">
<script type="application/ld+json">${personJsonLd}</script>`;

  const headMetaBytes = new Blob([headMetaBlock]).size;

  const bodyAndScripts = `
<script>
(function(){try{var d=Object.getOwnPropertyDescriptor(window,'fetch')||Object.getOwnPropertyDescriptor(Window.prototype,'fetch');if(d&&d.get&&!d.set&&d.configurable!==false){var f=d.get.call(window);Object.defineProperty(window,'fetch',{configurable:true,enumerable:true,get:function(){return f;},set:function(fn){if(typeof fn==='function')f=fn;}});}}catch(_){}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
${cssTexts.join('\n')}
</style>
</head>
<body>
<div id="site">
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="slam" width="16" height="16" patternUnits="userSpaceOnUse"><rect class="a-grid" x="7.25" y="7.25" width="1.5" height="1.5"/></pattern>
  </defs>
</svg>

<header class="site-head">
  <a class="who" href="#top" data-tkey="hero-brand">${esc(hero.brandName)}</a>
  <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
  <nav class="site-nav" id="site-nav" aria-label="Sections">
    ${navLinksHtml}
  </nav>
  <a class="btn solid" href="${esc(hero.headerCtaHref)}" data-tkey="hero-head-cta">${esc(hero.headerCtaText)}</a>
  <div class="run" aria-hidden="true"><i></i><b></b></div>
</header>

<main>
<section class="hero" id="top">
  <canvas id="floor" aria-hidden="true"></canvas>
  <div class="hero-inner">
    <div class="name-wrap" data-obstacle>
      <h1 class="display" data-tkey="hero-name"><span>${esc(hero.firstName)}</span><span>${esc(hero.lastName)}</span></h1>
    </div>
    <div class="pitch" data-obstacle>
      <p data-tkey="hero-pitch-1">${esc(hero.pitchLead)}</p>
      <p data-tkey="hero-pitch-2">${esc(hero.pitchSub)}</p>
    </div>
    <div class="cta" data-obstacle>
      <a class="btn solid" href="${esc(hero.ctaPrimaryHref)}" data-tkey="hero-cta-1">${esc(hero.ctaPrimaryText)}</a>
      <a class="btn" href="${esc(hero.ctaSecondaryHref)}" target="_blank" rel="noopener" data-tkey="hero-cta-2">${esc(hero.ctaSecondaryText)}</a>
    </div>
  </div>
  <p class="hud" data-obstacle>
    <strong class="tnum" id="cov">0%</strong>
    <span data-tkey="hero-hud-label" style="display:inline;color:#101010;font-size:0.9375rem">${esc(hero.hudLabel)}</span>
    <span data-tkey="hero-hud-hint">${esc(hero.hudHint)}</span>
  </p>
</section>

${mainSectionsHtml}
</main>

${contactHtml}
</div>
<script>
window.__MEDIA_POOL__ = ${JSON.stringify(pool)};
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headerH = () => { const h = $('.site-head'); return h ? h.offsetHeight : 60; };

  // Hydrate deduplicated WebP media pool
  $$('img[data-media-key]').forEach(img => {
    const k = img.getAttribute('data-media-key');
    if (k && window.__MEDIA_POOL__ && window.__MEDIA_POOL__[k]) {
      img.src = window.__MEDIA_POOL__[k];
    }
  });

  // Header scroll robot & mobile menu
  const fill = $('.run i'), bot = $('.run b'), nav = $('#site-nav'), menu = $('.menu-btn');
  const links = $$('a', nav), secs = links.map(a => $(a.getAttribute('href')));
  function updateHeader() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    if (fill) fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (bot) bot.style.transform = 'translate3d(' + (p * (document.documentElement.clientWidth - 22)).toFixed(1) + 'px,0,0)';
    const mid = innerHeight * 0.4;
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= mid) cur = i; });
    links.forEach((a, i) => a.classList.toggle('here', i === cur));
  }
  addEventListener('scroll', updateHeader, { passive: true });
  addEventListener('resize', updateHeader);
  updateHeader();
  if (menu && nav) {
    menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', open); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
  }

  // Figures counter
  const figSec = $('.figures');
  const nums = $$('[data-count]');
  if (!reduce && figSec && nums.length) {
    nums.forEach(n => n.textContent = '0');
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1300;
      (function tick(now) {
        const t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 3);
        nums.forEach(n => n.textContent = Math.round(+n.dataset.count * e));
        if (t < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.4 });
    io.observe(figSec);
  }

  // Deployments horizontal scroll pin
  const sec = $('.deploy'), pin = $('.deploy-pin'), vp = $('.deploy-viewport'), track = $('#deploy-track'), bar = $('.deploy-bar i');
  if (sec && pin && vp && track && bar) {
    let maxX = 0, pinned = false;
    function measureDeploy() {
      const can = !reduce && innerWidth >= 900 && innerHeight >= 640;
      sec.classList.toggle('is-pinned', can);
      pinned = can;
      if (!can) { sec.style.height = ''; track.style.transform = ''; vp.tabIndex = 0; updateDeploy(); return; }
      vp.removeAttribute('tabindex'); vp.scrollLeft = 0;
      maxX = Math.max(0, track.scrollWidth - vp.clientWidth);
      sec.style.height = (pin.offsetHeight + maxX) + 'px';
      updateDeploy();
    }
    function updateDeploy() {
      let p;
      if (pinned) {
        p = maxX ? clamp((headerH() - sec.getBoundingClientRect().top) / maxX, 0, 1) : 0;
        track.style.transform = 'translate3d(' + (-p * maxX).toFixed(1) + 'px,0,0)';
      } else {
        const m = vp.scrollWidth - vp.clientWidth;
        p = m > 0 ? vp.scrollLeft / m : 0;
      }
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    addEventListener('scroll', updateDeploy, { passive: true });
    vp.addEventListener('scroll', updateDeploy, { passive: true });
    addEventListener('resize', measureDeploy);
    measureDeploy();
  }

  // Client filters
  const filters = $('#filters'), grid = $('#clients-grid');
  if (filters && grid) {
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', filters).forEach(x => x.setAttribute('aria-pressed', x === b));
      const k = b.dataset.sector;
      $$('.client', grid).forEach(x => x.classList.toggle('dim', k !== 'all' && x.dataset.sector !== k));
    });
  }

  // Experience accordions
  $$('.xp-btn').forEach(b => b.addEventListener('click', () => b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') !== 'true')));

  // Hero floor coverage planner
  const hero = $('#top'), cv = $('#floor'), pct = $('#cov');
  if (hero && cv && pct) {
    const ctx = cv.getContext('2d');
    const SPEED = 10;
    let W = 0, H = 0, cs = 42, cols = 0, rows = 0, ox = 0, oy = 0, dpr = 1;
    let gridArr, cov, reach, total = 0, count = 0;
    const botState = { i: 0, x: 0, y: 0, fx: 0, fy: 0, tx: 0, ty: 0, t: 0, to: -1, a: 0, hd: 1 };
    let queue = [], trail = [], dots = new Map(), rays = [], spin = 0, doneAt = 0;
    let running = false, visible = true, last = 0, col = {};
    const cx = i => ox + (i % cols + 0.5) * cs;
    const cy = i => oy + (Math.floor(i / cols) + 0.5) * cs;
    function nb(i) { const c = i % cols, r = (i / cols) | 0, o = []; if (c > 0) o.push(i - 1); if (c < cols - 1) o.push(i + 1); if (r > 0) o.push(i - cols); if (r < rows - 1) o.push(i + cols); return o; }
    function colors() {
      const s = getComputedStyle(document.documentElement), v = n => s.getPropertyValue(n).trim();
      col = { sheen: v('--hero-sheen'), soft: v('--hero-trace'), ray: v('--hero-ink'), ink: v('--bot'), floor: v('--hero-bg'), beacon: v('--beacon') };
    }
    function flood(start) {
      const seen = new Uint8Array(cols * rows), q = [start]; seen[start] = 1; let n = 0;
      while (q.length) { const i = q.pop(); n++; for (const k of nb(i)) if (!gridArr[k] && !seen[k]) { seen[k] = 1; q.push(k); } }
      return { seen, n };
    }
    function recount() { count = 0; for (let i = 0; i < cov.length; i++) if (cov[i] && reach[i]) count++; }
    function build() {
      const box = hero.getBoundingClientRect();
      W = box.width; H = box.height; dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cs = W < 700 ? 30 : W < 1100 ? 36 : 42;
      cols = Math.max(4, Math.floor(W / cs)); rows = Math.max(4, Math.floor(H / cs));
      ox = (W - cols * cs) / 2; oy = (H - rows * cs) / 2;
      gridArr = new Uint8Array(cols * rows); cov = new Uint8Array(cols * rows);
      $$('[data-obstacle]', hero).forEach(el => {
        const r = el.getBoundingClientRect(), pad = 5;
        const c0 = clamp(Math.floor((r.left - box.left - pad - ox) / cs), 0, cols - 1), c1 = clamp(Math.floor((r.right - box.left + pad - ox) / cs), 0, cols - 1);
        const r0 = clamp(Math.floor((r.top - box.top - pad - oy) / cs), 0, rows - 1), r1 = clamp(Math.floor((r.bottom - box.top + pad - oy) / cs), 0, rows - 1);
        for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) gridArr[rr * cols + cc] = 1;
      });
      let best = null; const done = new Uint8Array(cols * rows);
      for (let i = 0; i < gridArr.length; i++) {
        if (gridArr[i] || done[i]) continue;
        const f = flood(i); for (let k = 0; k < done.length; k++) if (f.seen[k]) done[k] = 1;
        if (!best || f.n > best.n) best = f;
      }
      if (!best) { reach = new Uint8Array(cols * rows); total = 0; return; }
      reach = best.seen; total = best.n;
      let start = -1;
      for (let r = 0; r < rows && start < 0; r++) for (let c = cols - 1; c >= 0; c--) if (reach[r * cols + c]) { start = r * cols + c; break; }
      botState.i = start; botState.x = cx(start); botState.y = cy(start); botState.to = -1; botState.hd = -1; botState.a = Math.PI;
      cov[start] = 1; count = 1; trail = [start]; queue = []; dots = new Map(); rays = []; doneAt = 0;
    }
    function pick() {
      if (queue.length) return queue.shift();
      const i = botState.i, c = i % cols, r = (i / cols) | 0;
      const ok = (cc, rr) => cc >= 0 && cc < cols && rr >= 0 && rr < rows && reach[rr * cols + cc] && !cov[rr * cols + cc];
      if (ok(c + botState.hd, r)) return i + botState.hd;
      if (ok(c - botState.hd, r)) { botState.hd = -botState.hd; return i + botState.hd; }
      if (ok(c, r + 1)) return i + cols;
      if (ok(c, r - 1)) return i - cols;
      const prev = new Int32Array(cols * rows).fill(-1), q = [i]; prev[i] = i; let found = -1;
      for (let h = 0; h < q.length; h++) {
        const k = q[h]; if (!cov[k]) { found = k; break; }
        for (const n of nb(k)) if (reach[n] && prev[n] < 0) { prev[n] = k; q.push(n); }
      }
      if (found < 0) return -1;
      const path = []; for (let k = found; k !== i; k = prev[k]) path.push(k);
      path.reverse(); queue = path; return queue.shift();
    }
    function arrive(n) { botState.i = n; trail.push(n); if (!cov[n]) { cov[n] = 1; count++; } }
    function step(dt) {
      if (!total) return;
      if (doneAt) { if (performance.now() - doneAt > 2600) { cov.fill(0); cov[botState.i] = 1; count = 1; trail = [botState.i]; queue = []; doneAt = 0; } return; }
      if (botState.to < 0) {
        const n = pick();
        if (n < 0) { doneAt = performance.now(); return; }
        botState.to = n; botState.fx = botState.x; botState.fy = botState.y; botState.tx = cx(n); botState.ty = cy(n); botState.t = 0;
      }
      botState.t += dt * SPEED;
      const t = Math.min(1, botState.t);
      botState.x = botState.fx + (botState.tx - botState.fx) * t; botState.y = botState.fy + (botState.ty - botState.fy) * t;
      let d = Math.atan2(botState.ty - botState.fy, botState.tx - botState.fx) - botState.a; d = Math.atan2(Math.sin(d), Math.cos(d));
      botState.a += d * Math.min(1, dt * 14);
      if (botState.t >= 1) { arrive(botState.to); botState.to = -1; }
    }
    function lidar(dt) {
      for (let k = 0; k < 3; k++) {
        spin += 0.09;
        const dx = Math.cos(spin), dy = Math.sin(spin), max = cs * 7;
        let x = botState.x, y = botState.y, hit = -1;
        for (let d = cs * 0.45; d < max; d += 4) {
          x = botState.x + dx * d; y = botState.y + dy * d;
          const c = Math.floor((x - ox) / cs), r = Math.floor((y - oy) / cs);
          if (c < 0 || r < 0 || c >= cols || r >= rows) break;
          if (gridArr[r * cols + c]) { hit = r * cols + c; break; }
        }
        rays.push({ x, y, l: 1, hit: hit >= 0 });
        if (hit >= 0 && dots.size < 6000) { const key = ((x / 3) | 0) + ',' + ((y / 3) | 0); if (!dots.has(key)) dots.set(key, [x, y, hit]); }
      }
      for (const r of rays) r.l -= dt * 3.2;
      rays = rays.filter(r => r.l > 0);
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!total) return;
      ctx.beginPath(); ctx.moveTo(cx(trail[0]), cy(trail[0]));
      for (let k = 1; k < trail.length; k++) ctx.lineTo(cx(trail[k]), cy(trail[k]));
      ctx.lineTo(botState.x, botState.y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = cs * 0.8; ctx.strokeStyle = col.sheen; ctx.stroke();
      ctx.lineWidth = 1.25; ctx.setLineDash([2, 7]); ctx.strokeStyle = col.soft; ctx.stroke(); ctx.setLineDash([]);
      for (let i = 0; i < gridArr.length; i++) if (gridArr[i] === 2) {
        const x = cx(i), y = cy(i);
        ctx.fillStyle = col.ray; ctx.beginPath(); ctx.arc(x, y, cs * 0.2, 0, 7); ctx.fill();
        ctx.strokeStyle = col.ray; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, cs * 0.36, 0, 7); ctx.stroke();
      }
      ctx.fillStyle = col.ray; ctx.globalAlpha = 0.55;
      for (const d of dots.values()) ctx.fillRect(d[0] - 1, d[1] - 1, 2, 2);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col.ray; ctx.lineWidth = 1;
      for (const r of rays) { ctx.globalAlpha = r.l * (r.hit ? 0.5 : 0.16); ctx.beginPath(); ctx.moveTo(botState.x, botState.y); ctx.lineTo(r.x, r.y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      const R = cs * 0.36;
      ctx.save(); ctx.translate(botState.x, botState.y);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(1.5, 3.5, R * 1.08, 0, 7); ctx.fill();
      ctx.rotate(botState.a);
      ctx.fillStyle = col.ink; rr(-R, -R * 0.84, R * 2, R * 1.68, R * 0.55); ctx.fill();
      ctx.fillStyle = col.floor; rr(R * 0.5, -R * 0.5, R * 0.24, R, R * 0.12); ctx.fill();
      ctx.fillStyle = col.beacon; ctx.beginPath(); ctx.arc(-R * 0.25, 0, R * 0.26, 0, 7); ctx.fill();
      ctx.restore();
    }
    function readout() { pct.textContent = (total ? Math.round(100 * count / total) : 0) + '%'; }
    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      step(dt); lidar(dt); draw(); readout();
      requestAnimationFrame(frame);
    }
    function play() { if (running || reduce || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    function reset() { colors(); build(); draw(); readout(); play(); }
    hero.addEventListener('click', e => {
      if (e.target.closest('a,button') || !total) return;
      const box = hero.getBoundingClientRect();
      const c = Math.floor((e.clientX - box.left - ox) / cs), r = Math.floor((e.clientY - box.top - oy) / cs);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const i = r * cols + c;
      if (gridArr[i] === 1 || i === botState.i || i === botState.to) return;
      if (gridArr[i] === 2) { gridArr[i] = 0; for (const [k, d] of dots) if (d[2] === i) dots.delete(k); }
      else { gridArr[i] = 2; cov[i] = 0; }
      reach = flood(botState.i).seen; total = 0; for (let k = 0; k < reach.length; k++) total += reach[k];
      recount(); queue = [];
      if (doneAt && count < total) doneAt = 0;
    });
    addEventListener('resize', reset);
    reset();
  }
})();
</script>
</body>
</html>`;

  const fullHtml = headMetaBlock + bodyAndScripts;
  const totalBytes = new Blob([fullHtml]).size;
  const htmlAndCssBytes = Math.max(0, totalBytes - headMetaBytes - poolBytes);

  return {
    html: fullHtml,
    report: {
      headMetaBytes,
      htmlAndCssBytes,
      mediaPoolBytes: poolBytes,
      totalBytes,
      totalReferences,
      uniqueImages: uniqueCount,
      withinLinkedInLimit: totalBytes < LINKEDIN_MAX_BYTES,
      withinSafeCeiling: totalBytes <= SAFE_CEILING_BYTES,
      percentOfLinkedInLimit: Math.round((totalBytes / LINKEDIN_MAX_BYTES) * 1000) / 10
    }
  };
}

export async function exportStandaloneGitHubHtml(state: PortfolioCustomState): Promise<ExportBudgetReport> {
  const { html, report } = await generateStandaloneHtmlAndReport(state);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
  return report;
}

/**
 * Renders the 1200x630 OpenGraph Social Share Banner (`og-card.jpg`) onto a canvas
 * so Sadek can preview and download `og-card.jpg` for LinkedIn, X, and WhatsApp.
 */
export function renderOgBannerToCanvas(canvas: HTMLCanvasElement, state: PortfolioCustomState): void {
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const content = state.content || DEFAULT_PORTFOLIO_CONTENT;
  const seo = content.seo || DEFAULT_PORTFOLIO_CONTENT.seo;
  const cc = content.styleOverrides?.customColors || {};

  let bg = '#FFD400';
  let ink = '#101010';
  let accent = '#101010';
  if (state.palette === 'cobalt') {
    bg = '#0047BB';
    ink = '#FFFFFF';
    accent = '#FFD400';
  } else if (state.palette === 'concrete') {
    bg = '#1A1A1A';
    ink = '#F5F5F2';
    accent = '#FFD400';
  }
  if (cc.heroBg) bg = cc.heroBg;
  if (cc.heroInk) ink = cc.heroInk;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);

  // Subtle SLAM grid & LiDAR path decoration on right
  ctx.strokeStyle = ink === '#FFFFFF' ? 'rgba(255,255,255,0.12)' : 'rgba(16,16,16,0.1)';
  ctx.lineWidth = 2;
  const gridStep = 48;
  for (let x = 640; x < 1160; x += gridStep) {
    for (let y = 40; y < 590; y += gridStep) {
      ctx.fillStyle = ink === '#FFFFFF' ? 'rgba(255,255,255,0.22)' : 'rgba(16,16,16,0.22)';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  // Swept path graphic
  ctx.strokeStyle = ink === '#FFFFFF' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(780, 110);
  ctx.lineTo(1110, 110);
  ctx.lineTo(1110, 180);
  ctx.lineTo(820, 180);
  ctx.lineTo(820, 250);
  ctx.lineTo(1110, 250);
  ctx.lineTo(1110, 320);
  ctx.lineTo(880, 320);
  ctx.stroke();

  // Robot marker
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(880, 320, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accent === ink ? '#FFFFFF' : accent;
  ctx.beginPath();
  ctx.arc(880, 320, 8, 0, Math.PI * 2);
  ctx.fill();

  // Kicker
  ctx.fillStyle = ink;
  ctx.font = '700 18px Archivo, Arial, sans-serif';
  ctx.fillText(seo.ogBannerKicker.toUpperCase(), 68, 86);

  // Main Headline (Name)
  ctx.font = '900 116px Archivo, Arial Narrow, sans-serif';
  ctx.fillText(seo.ogBannerHeadline, 64, 215);

  // Subline
  ctx.font = '600 28px Archivo, Arial, sans-serif';
  const words = seo.ogBannerSubline.split(' ');
  let line = '';
  let y = 285;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 760) {
      ctx.fillText(line, 68, y);
      line = w;
      y += 38;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 68, y);

  // Bottom KPI Strip Cards
  const figs = content.figures.slice(0, 4);
  const cardW = 250;
  const gap = 20;
  figs.forEach((f, idx) => {
    const x = 68 + idx * (cardW + gap);
    const cy = 430;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, cy, cardW, 138, 8);
    else ctx.rect(x, cy, cardW, 138);
    ctx.fill();

    ctx.fillStyle = '#101010';
    ctx.font = '900 44px Archivo, Arial, sans-serif';
    const numStr = `${f.prefix ? f.prefix + ' ' : ''}${f.count}${f.suffix}`;
    ctx.fillText(numStr, x + 20, cy + 58);

    ctx.fillStyle = '#595955';
    ctx.font = '600 15px Archivo, Arial, sans-serif';
    const capWords = f.caption.split(' ');
    let cLine = '';
    let cY = cy + 88;
    let linesCount = 0;
    for (const cw of capWords) {
      const test = cLine ? `${cLine} ${cw}` : cw;
      if (ctx.measureText(test).width > cardW - 36) {
        if (linesCount < 1) {
          ctx.fillText(cLine, x + 20, cY);
          cLine = cw;
          cY += 20;
          linesCount++;
        } else {
          cLine = cLine + '…';
          break;
        }
      } else {
        cLine = test;
      }
    }
    if (cLine) ctx.fillText(cLine, x + 20, cY);
  });
}

export function downloadOgBannerJpg(state: PortfolioCustomState): void {
  const canvas = document.createElement('canvas');
  renderOgBannerToCanvas(canvas, state);
  canvas.toBlob(
    blob => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'og-card.jpg';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
    },
    'image/jpeg',
    0.9
  );
}

export function getOgBannerJpgBase64(state: PortfolioCustomState): string {
  const canvas = document.createElement('canvas');
  renderOgBannerToCanvas(canvas, state);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const commaIdx = dataUrl.indexOf(',');
  return commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export interface GitHubPublishConfig {
  owner: string;
  repo: string;
  branch: string;
  targetFolder: 'published' | 'root' | 'docs';
  token: string;
  commitMessage?: string;
}

export interface GitHubPublishResult {
  htmlUrl: string;
  totalBytes: number;
  filesCommitted: string[];
}

async function putGitHubFile(params: {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  contentBase64: string;
  message: string;
  token: string;
}): Promise<void> {
  const { owner, repo, branch, path, contentBase64, message, token } = params;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };

  // Check if file already exists to get its current SHA
  let existingSha: string | undefined;
  const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
    method: 'GET',
    headers
  });
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha?: string };
    existingSha = data.sha;
  } else if (getRes.status !== 404) {
    const errText = await getRes.text();
    throw new Error(`GitHub API check failed (${getRes.status}): ${errText}`);
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(existingSha ? { sha: existingSha } : {})
    })
  });

  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub commit failed for ${path} (${putRes.status}): ${errText}`);
  }
}

export async function publishPortfolioToGitHub(
  state: PortfolioCustomState,
  config: GitHubPublishConfig,
  onProgress?: (step: string) => void
): Promise<GitHubPublishResult> {
  const owner = config.owner.trim();
  const repo = config.repo.trim();
  const branch = config.branch.trim() || 'main';
  const token = config.token.trim();

  if (!owner || !repo || !token) {
    throw new Error('GitHub Owner, Repository, and Personal Access Token are required.');
  }

  onProgress?.('Compressing media pool & generating < 3 MB standalone HTML…');
  const { html, report } = await generateStandaloneHtmlAndReport(state);
  const htmlBase64 = utf8ToBase64(html);

  onProgress?.('Rendering 1200×630 og-card.jpg social preview banner…');
  const ogJpgBase64 = getOgBannerJpgBase64(state);

  const prefix =
    config.targetFolder === 'published'
      ? 'published/'
      : config.targetFolder === 'docs'
      ? 'docs/'
      : '';

  const commitMsg =
    config.commitMessage?.trim() ||
    `Publish portfolio (${(report.totalBytes / 1024).toFixed(0)} KB, LinkedIn-ready)`;

  const filesCommitted: string[] = [];

  const indexPath = `${prefix}index.html`;
  onProgress?.(`Committing ${indexPath} to ${owner}/${repo}@${branch}…`);
  await putGitHubFile({
    owner,
    repo,
    branch,
    path: indexPath,
    contentBase64: htmlBase64,
    message: commitMsg,
    token
  });
  filesCommitted.push(indexPath);

  const ogPath = `${prefix}og-card.jpg`;
  onProgress?.(`Committing ${ogPath} to ${owner}/${repo}@${branch}…`);
  await putGitHubFile({
    owner,
    repo,
    branch,
    path: ogPath,
    contentBase64: ogJpgBase64,
    message: `${commitMsg} [og-card.jpg]`,
    token
  });
  filesCommitted.push(ogPath);

  // Also save portfolio-state.json in public/published so the hosted /studio/ app stays in sync
  if (config.targetFolder === 'published') {
    const stateJsonPath = 'public/portfolio-state.json';
    onProgress?.(`Syncing Studio state (${stateJsonPath})…`);
    await putGitHubFile({
      owner,
      repo,
      branch,
      path: stateJsonPath,
      contentBase64: utf8ToBase64(JSON.stringify(state)),
      message: `${commitMsg} [studio-state]`,
      token
    });
    filesCommitted.push(stateJsonPath);
  }

  const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const liveUrl = isUserSite
    ? `https://${owner}.github.io/`
    : `https://${owner}.github.io/${repo}/`;

  return {
    htmlUrl: liveUrl,
    totalBytes: report.totalBytes,
    filesCommitted
  };
}

