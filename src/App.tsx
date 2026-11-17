/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { HeroFloorSection } from './components/HeroFloorSection';
import { ActiveTextSelection, EditableText } from './components/EditableText';
import {
  SelectedTextInspectorBar,
  ColorsAndTypographyModal,
  SectionManagerModal,
  LinkedInSeoModal,
  GitHubPublishModal
} from './components/StudioModals';
import {
  DEFAULT_PORTFOLIO_CONTENT,
  FullPortfolioContent,
  DeploymentCardItem,
  DeploymentEntry,
  ProjectItem,
  SectionConfig,
  isGroupEntry
} from './data/portfolioData';
import { CLIENT_LOGOS_SVG } from './data/brandLogos';
import { PROJECT_SCHEMATICS_SVG, SLAM_ART_GENERATORS, hash, rng } from './data/projectVisuals';
import {
  PortfolioCustomState,
  compressImageFile,
  exportStandaloneGitHubHtml
} from './utils/exportStaticHtml';

const STORAGE_KEY = 'sadek_mefti_portfolio_v3';

const PALETTES: [PortfolioCustomState['palette'], string, string][] = [
  ['signal', 'Yellow', '#FFD400'],
  ['cobalt', 'Cobalt', '#0047BB'],
  ['concrete', 'Concrete', '#E4E4E0']
];

const DEFAULT_STATE: PortfolioCustomState = {
  palette: 'signal',
  theme: 'system',
  photos: {},
  projectPhotos: {},
  logos: {},
  partnerLogos: {},
  content: DEFAULT_PORTFOLIO_CONTENT
};

function loadInitialState(): PortfolioCustomState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sadek_mefti_portfolio_v2');
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const mergedContent: FullPortfolioContent = {
      ...DEFAULT_PORTFOLIO_CONTENT,
      ...(parsed.content || {}),
      hero: { ...DEFAULT_PORTFOLIO_CONTENT.hero, ...(parsed.content?.hero || {}) },
      contact: { ...DEFAULT_PORTFOLIO_CONTENT.contact, ...(parsed.content?.contact || {}) },
      styleOverrides: {
        ...DEFAULT_PORTFOLIO_CONTENT.styleOverrides,
        ...(parsed.content?.styleOverrides || {}),
        customColors: {
          ...DEFAULT_PORTFOLIO_CONTENT.styleOverrides.customColors,
          ...(parsed.content?.styleOverrides?.customColors || {})
        },
        textStyles: {
          ...DEFAULT_PORTFOLIO_CONTENT.styleOverrides.textStyles,
          ...(parsed.content?.styleOverrides?.textStyles || {})
        }
      },
      seo: { ...DEFAULT_PORTFOLIO_CONTENT.seo, ...(parsed.content?.seo || {}) }
    };
    return {
      palette: ['signal', 'cobalt', 'concrete'].includes(parsed.palette) ? parsed.palette : 'signal',
      theme: ['system', 'light', 'dark'].includes(parsed.theme) ? parsed.theme : 'system',
      photos: parsed.photos || {},
      projectPhotos: parsed.projectPhotos || {},
      logos: parsed.logos || {},
      partnerLogos: parsed.partnerLogos || {},
      content: mergedContent
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export default function App() {
  const [state, setState] = useState<PortfolioCustomState>(loadInitialState);
  const [editing, setEditing] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [exporting, setExporting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavIndex, setActiveNavIndex] = useState(-1);
  const [activeSector, setActiveSector] = useState('all');
  const [cardViewMode, setCardViewMode] = useState<Record<string, 'photo' | 'slam'>>({});
  const [openXpIds, setOpenXpIds] = useState<Record<string, boolean>>({ xp1: true });
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentCardItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTextSelection, setActiveTextSelection] = useState<ActiveTextSelection | null>(null);

  // Studio Modals
  const [showColorsModal, setShowColorsModal] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  // If opened on hosted GitHub Pages (/studio/) with empty localStorage, hydrate from published portfolio-state.json
  useEffect(() => {
    try {
      const hasLocal = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sadek_mefti_portfolio_v2');
      if (hasLocal) return;
      fetch('./portfolio-state.json')
        .then(r => (r.ok ? r.json() : null))
        .then(remote => {
          if (remote && remote.content) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            setState(loadInitialState());
          }
        })
        .catch(() => {
          // ignore if no remote state file exists yet
        });
    } catch {
      // ignore
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<{
    kind: 'photos' | 'projectPhotos' | 'logos' | 'partnerLogos' | 'customSectionItem';
    key: string;
    sectionId?: string;
  } | null>(null);

  const headerFillRef = useRef<HTMLElement | null>(null);
  const headerBotRef = useRef<HTMLElement | null>(null);
  const figuresRef = useRef<HTMLUListElement | null>(null);
  const deploySecRef = useRef<HTMLElement | null>(null);
  const deployPinRef = useRef<HTMLDivElement | null>(null);
  const deployVpRef = useRef<HTMLDivElement | null>(null);
  const deployTrackRef = useRef<HTMLUListElement | null>(null);
  const deployBarRef = useRef<HTMLElement | null>(null);

  const content = state.content;
  const ts = content.styleOverrides.textStyles || {};

  const updateContent = (patch: Partial<FullPortfolioContent>) => {
    setState(prev => ({
      ...prev,
      content: {
        ...prev.content,
        ...patch
      }
    }));
  };

  // Sync palette, theme, custom colors, typography scales, and SEO meta tags on <html> & <head>
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = state.palette;
    if (state.theme === 'system') {
      delete root.dataset.theme;
      root.classList.remove('dark');
    } else {
      root.dataset.theme = state.theme;
      root.classList.toggle('dark', state.theme === 'dark');
    }

    const so = state.content.styleOverrides;
    const cc = so.customColors || {};

    const setOrRemove = (prop: string, val?: string) => {
      if (val) root.style.setProperty(prop, val);
      else root.style.removeProperty(prop);
    };

    setOrRemove('--hero-bg', cc.heroBg);
    setOrRemove('--hero-ink', cc.heroInk);
    setOrRemove('--hero-muted', cc.heroMuted);
    setOrRemove('--bot', cc.botColor);
    setOrRemove('--beacon', cc.beaconColor);
    setOrRemove('--page', cc.pageBg);
    setOrRemove('--panel', cc.panelBg);
    setOrRemove('--ink', cc.inkColor);
    setOrRemove('--muted', cc.mutedColor);
    setOrRemove('--line', cc.lineColor);
    setOrRemove('--hi', cc.hiBg);
    setOrRemove('--hi-ink', cc.hiInk);
    setOrRemove('--mark', cc.markColor);

    root.style.setProperty('--scale-hero-title', String((so.heroTitleScale || 100) / 100));
    root.style.setProperty('--scale-sec-heading', String((so.sectionHeadingScale || 100) / 100));
    root.style.setProperty('--scale-card-title', String((so.cardTitleScale || 100) / 100));
    root.style.setProperty('--scale-body-text', String((so.bodyTextScale || 100) / 100));
    root.style.setProperty('--scale-kpi-num', String((so.kpiNumberScale || 100) / 100));

    // Sync live DOM <head> OpenGraph & Schema.org tags
    const seo = state.content.seo;
    document.title = seo.siteTitle;
    const setMeta = (selector: string, contentVal: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', contentVal);
    };
    setMeta('meta[name="description"]', seo.metaDescription);
    setMeta('meta[property="og:title"]', seo.siteTitle);
    setMeta('meta[property="og:description"]', seo.metaDescription);
    setMeta('meta[property="og:image"]', seo.ogImageUrl);
    setMeta('meta[name="twitter:title"]', seo.siteTitle);
    setMeta('meta[name="twitter:description"]', seo.metaDescription);
    setMeta('meta[name="twitter:image"]', seo.ogImageUrl);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('editing', editing);
    if (!editing) {
      setActiveTextSelection(null);
    }
  }, [editing]);

  const visibleSections = content.sections.filter(s => s.visible);
  const navSections = visibleSections.filter(s => s.showInNav && s.navLabel);

  // Header scroll progress mini-robot & active section tracking
  useEffect(() => {
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const secIds = navSections.map(s => `#${s.id}`);

    function updateHeader() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (headerFillRef.current) {
        headerFillRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      }
      if (headerBotRef.current) {
        const x = p * (document.documentElement.clientWidth - 22);
        headerBotRef.current.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      }
      const mid = window.innerHeight * 0.4;
      let cur = -1;
      secIds.forEach((id, i) => {
        const el = document.querySelector(id);
        if (el && el.getBoundingClientRect().top <= mid) cur = i;
      });
      setActiveNavIndex(cur);
    }

    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
    updateHeader();
    return () => {
      window.removeEventListener('scroll', updateHeader);
      window.removeEventListener('resize', updateHeader);
    };
  }, [navSections.length]);

  // Deployments horizontal scroll pinning (disabled when editing so cards can be edited freely)
  useEffect(() => {
    const sec = deploySecRef.current;
    const pin = deployPinRef.current;
    const vp = deployVpRef.current;
    const track = deployTrackRef.current;
    const bar = deployBarRef.current;
    if (!sec || !pin || !vp || !track || !bar) return;

    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let maxX = 0,
      pinned = false;

    const headerH = () => {
      const h = document.querySelector('.site-head') as HTMLElement | null;
      return h ? h.offsetHeight : 60;
    };

    function update() {
      if (!sec || !track || !vp || !bar) return;
      let p = 0;
      if (pinned) {
        p = maxX ? clamp((headerH() - sec.getBoundingClientRect().top) / maxX, 0, 1) : 0;
        track.style.transform = `translate3d(${(-p * maxX).toFixed(1)}px,0,0)`;
      } else {
        const m = vp.scrollWidth - vp.clientWidth;
        p = m > 0 ? vp.scrollLeft / m : 0;
      }
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    }

    function measure() {
      if (!sec || !pin || !vp || !track) return;
      const can = !editing && !reduce && window.innerWidth >= 900 && window.innerHeight >= 640;
      sec.classList.toggle('is-pinned', can);
      pinned = can;
      if (!can) {
        sec.style.height = '';
        track.style.transform = '';
        vp.tabIndex = 0;
        update();
        return;
      }
      vp.removeAttribute('tabindex');
      vp.scrollLeft = 0;
      maxX = Math.max(0, track.scrollWidth - vp.clientWidth);
      sec.style.height = pin.offsetHeight + maxX + 'px';
      update();
    }

    window.addEventListener('scroll', update, { passive: true });
    vp.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
    measure();

    return () => {
      window.removeEventListener('scroll', update);
      vp.removeEventListener('scroll', update);
      window.removeEventListener('resize', measure);
    };
  }, [editing, content.deployments.length, content.sections]);

  // Close modals on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDeployment(null);
        setSelectedProject(null);
        setShowColorsModal(false);
        setShowSectionsModal(false);
        setShowSeoModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const triggerFilePick = (
    kind: 'photos' | 'projectPhotos' | 'logos' | 'partnerLogos' | 'customSectionItem',
    key: string,
    sectionId?: string
  ) => {
    uploadTargetRef.current = { kind, key, sectionId };
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const clearCustomMedia = (
    kind: 'photos' | 'projectPhotos' | 'logos' | 'partnerLogos',
    key: string
  ) => {
    setState(prev => {
      const nextMap = { ...prev[kind] };
      delete nextMap[key];
      return { ...prev, [kind]: nextMap };
    });
    setStatusNote('Restored default asset.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = uploadTargetRef.current;
    if (!file || !target) return;
    setStatusNote('Compressing image to WebP...');
    try {
      const maxDim = target.kind === 'logos' || target.kind === 'partnerLogos' ? 800 : 1280;
      const dataUrl = await compressImageFile(file, maxDim);

      if (target.kind === 'customSectionItem' && target.sectionId) {
        updateContent({
          sections: content.sections.map(sec =>
            sec.id === target.sectionId
              ? {
                  ...sec,
                  customItems: (sec.customItems || []).map(it =>
                    it.id === target.key ? { ...it, image: dataUrl } : it
                  )
                }
              : sec
          )
        });
      } else if (target.kind !== 'customSectionItem') {
        const k = target.kind;
        setState(prev => ({
          ...prev,
          [k]: {
            ...prev[k],
            [target.key]: dataUrl
          }
        }));
      }
      setStatusNote('Updated! Click "Export index.html" anytime to download.');
    } catch {
      setStatusNote('Could not read that image. Please choose a PNG, JPG, WebP, or SVG.');
    }
  };

  const handleExportHtml = async () => {
    setExporting(true);
    setStatusNote('Deduplicating WebP media pool & building LinkedIn-ready index.html...');
    try {
      const report = await exportStandaloneGitHubHtml(state);
      const kb = (report.totalBytes / 1024).toFixed(0);
      setStatusNote(`Downloaded index.html (${kb} KB — ${report.uniqueImages} unique WebP assets, < 3MB LinkedIn Ready)!`);
    } catch {
      setStatusNote('Export encountered an issue. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleUpdateTextStyle = (
    tkey: string,
    patch: { fontSizePct?: number; color?: string } | null
  ) => {
    const nextTextStyles = { ...(content.styleOverrides.textStyles || {}) };
    if (!patch) {
      delete nextTextStyles[tkey];
    } else {
      nextTextStyles[tkey] = patch;
    }
    updateContent({
      styleOverrides: {
        ...content.styleOverrides,
        textStyles: nextTextStyles
      }
    });
  };

  // Section Reordering Helper
  const moveSectionOrder = (secId: string, dir: -1 | 1) => {
    const idx = content.sections.findIndex(s => s.id === secId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= content.sections.length) return;
    const copy = [...content.sections];
    const [removed] = copy.splice(idx, 1);
    copy.splice(target, 0, removed);
    updateContent({ sections: copy });
  };

  const updateSectionMeta = (secId: string, patch: Partial<SectionConfig>) => {
    updateContent({
      sections: content.sections.map(s => (s.id === secId ? { ...s, ...patch } : s))
    });
  };

  const renderSectionToolbar = (sec: SectionConfig, addAction?: { label: string; onClick: () => void }) => {
    if (!editing) return null;
    const idx = content.sections.findIndex(s => s.id === sec.id);
    return (
      <div className="sec-edit-toolbar" aria-label={`Manage ${sec.title} section`}>
        <button
          type="button"
          className="studio-mini-btn"
          disabled={idx <= 0}
          onClick={() => moveSectionOrder(sec.id, -1)}
          title="Move section up"
        >
          ↑ Move Up
        </button>
        <button
          type="button"
          className="studio-mini-btn"
          disabled={idx >= content.sections.length - 1}
          onClick={() => moveSectionOrder(sec.id, 1)}
          title="Move section down"
        >
          ↓ Move Down
        </button>
        {addAction && (
          <button type="button" className="studio-mini-btn" onClick={addAction.onClick}>
            {addAction.label}
          </button>
        )}
        <label className="studio-inline-label" title="Section background color">
          <span>Bg</span>
          <input
            type="color"
            value={sec.bgColorOverride || '#FFFFFF'}
            onChange={e => updateSectionMeta(sec.id, { bgColorOverride: e.target.value })}
            style={{ width: '22px', height: '22px', padding: 0, border: 'none' }}
          />
        </label>
        <label className="studio-inline-label" title="Section text color">
          <span>Text</span>
          <input
            type="color"
            value={sec.textColorOverride || '#101010'}
            onChange={e => updateSectionMeta(sec.id, { textColorOverride: e.target.value })}
            style={{ width: '22px', height: '22px', padding: 0, border: 'none' }}
          />
        </label>
        {(sec.bgColorOverride || sec.textColorOverride) && (
          <button
            type="button"
            className="studio-mini-btn"
            onClick={() => updateSectionMeta(sec.id, { bgColorOverride: undefined, textColorOverride: undefined })}
          >
            Reset colors
          </button>
        )}
        <button
          type="button"
          className="studio-mini-btn"
          style={{ color: '#E11D48' }}
          onClick={() => updateSectionMeta(sec.id, { visible: false })}
          title="Hide this section (restore anytime in Sections modal)"
        >
          Hide section
        </button>
      </div>
    );
  };

  // Render individual section by type
  const renderSection = (sec: SectionConfig) => {
    const secStyle: React.CSSProperties = {
      ...(sec.bgColorOverride ? { background: sec.bgColorOverride } : {}),
      ...(sec.textColorOverride ? { color: sec.textColorOverride } : {})
    };

    if (sec.type === 'figures') {
      return (
        <div key={sec.id} id={sec.id} style={secStyle}>
          {editing && (
            <div style={{ padding: '0.75rem var(--gut)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.8125rem' }}>KPI Figures Bar</strong>
              {renderSectionToolbar(sec, {
                label: '+ Add KPI Figure',
                onClick: () =>
                  updateContent({
                    figures: [
                      ...content.figures,
                      {
                        id: `fig-${Date.now()}`,
                        prefix: '',
                        count: 10,
                        suffix: '+',
                        caption: 'New key milestone metric description'
                      }
                    ]
                  })
              })}
            </div>
          )}
          <ul className="figures" ref={figuresRef} style={secStyle}>
            {content.figures.map((f, idx) => (
              <li key={f.id}>
                <span className="num">
                  {f.prefix ? (
                    <EditableText
                      as="small"
                      tkey={`fig-pre-${f.id}`}
                      label="Figure Prefix"
                      value={f.prefix}
                      onChange={v =>
                        updateContent({
                          figures: content.figures.map(item => (item.id === f.id ? { ...item, prefix: v } : item))
                        })
                      }
                      editing={editing}
                      customStyle={ts[`fig-pre-${f.id}`]}
                      isSelected={activeTextSelection?.tkey === `fig-pre-${f.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                  ) : null}
                  <EditableText
                    as="span"
                    tkey={`fig-num-${f.id}`}
                    label="Figure Number"
                    value={String(f.count)}
                    onChange={v =>
                      updateContent({
                        figures: content.figures.map(item =>
                          item.id === f.id ? { ...item, count: Number(v.replace(/[^0-9.]/g, '')) || 0 } : item
                        )
                      })
                    }
                    editing={editing}
                    customStyle={ts[`fig-num-${f.id}`]}
                    isSelected={activeTextSelection?.tkey === `fig-num-${f.id}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  <EditableText
                    as="span"
                    tkey={`fig-suf-${f.id}`}
                    label="Figure Suffix"
                    value={f.suffix}
                    onChange={v =>
                      updateContent({
                        figures: content.figures.map(item => (item.id === f.id ? { ...item, suffix: v } : item))
                      })
                    }
                    editing={editing}
                    customStyle={ts[`fig-suf-${f.id}`]}
                    isSelected={activeTextSelection?.tkey === `fig-suf-${f.id}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                </span>
                <EditableText
                  as="p"
                  tkey={`fig-cap-${f.id}`}
                  label="Figure Description"
                  value={f.caption}
                  onChange={v =>
                    updateContent({
                      figures: content.figures.map(item => (item.id === f.id ? { ...item, caption: v } : item))
                    })
                  }
                  editing={editing}
                  customStyle={ts[`fig-cap-${f.id}`]}
                  isSelected={activeTextSelection?.tkey === `fig-cap-${f.id}`}
                  onSelectForStyle={setActiveTextSelection}
                />
                {editing && (
                  <div className="item-edit-bar">
                    <button
                      type="button"
                      className="studio-mini-btn"
                      onClick={() => {
                        const nextPrefix = f.prefix ? '' : 'AED';
                        updateContent({
                          figures: content.figures.map(item =>
                            item.id === f.id ? { ...item, prefix: nextPrefix } : item
                          )
                        });
                      }}
                    >
                      {f.prefix ? 'Remove prefix' : '+ Prefix (AED)'}
                    </button>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="studio-mini-btn"
                        onClick={() => {
                          const copy = [...content.figures];
                          const [rem] = copy.splice(idx, 1);
                          copy.splice(idx - 1, 0, rem);
                          updateContent({ figures: copy });
                        }}
                      >
                        ←
                      </button>
                    )}
                    <button
                      type="button"
                      className="studio-mini-btn"
                      style={{ color: '#E11D48', marginLeft: 'auto' }}
                      onClick={() =>
                        updateContent({ figures: content.figures.filter(item => item.id !== f.id) })
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (sec.type === 'deployments') {
      const moveDeployItem = (index: number, dir: -1 | 1) => {
        const target = index + dir;
        if (target < 0 || target >= content.deployments.length) return;
        const copy = [...content.deployments];
        const [rem] = copy.splice(index, 1);
        copy.splice(target, 0, rem);
        updateContent({ deployments: copy });
      };

      const addNewRobotCard = () => {
        const newCard: DeploymentCardItem = {
          id: `robot-${Date.now()}`,
          art: 'coverage',
          title: 'New Robot Deployment',
          site: 'Dubai, UAE',
          note: 'Autonomous deployment, site SLAM mapping and partner operations.',
          defaultPhoto: '/src/assets/images/robot_gausium_phantas_1794743262350.jpg',
          photoPosition: 'center center',
          platformBadge: 'Autonomous Fleet · UAE',
          specs: {
            platform: 'Autonomous Commercial Robot',
            navigation: '3D/2D LiDAR SLAM & Vision',
            capacityOrMode: 'Multi-mode autonomous operation',
            efficiencyOrRuntime: 'Up to 2,000 m²/h coverage',
            partnerScope: 'Full deployment & SLA maintenance',
            region: 'Dubai, UAE'
          }
        };
        updateContent({ deployments: [...content.deployments, newCard] });
      };

      const addNewGroupCard = () => {
        const newGroup: DeploymentEntry = {
          id: `group-${Date.now()}`,
          group: 'New Organization',
          when: '2026 to now',
          text: 'Summary of fleet deployments and field engineering scope.'
        };
        updateContent({ deployments: [...content.deployments, newGroup] });
      };

      return (
        <section
          key={sec.id}
          className="deploy"
          id={sec.id}
          aria-labelledby={`h-${sec.id}`}
          ref={deploySecRef}
          style={secStyle}
        >
          <div className="deploy-pin" ref={deployPinRef}>
            <div className="sec-head">
              <div className="sec-head-copy">
                <EditableText
                  as="h2"
                  id={`h-${sec.id}`}
                  className="display"
                  tkey={`sec-title-${sec.id}`}
                  label="Deployments Heading"
                  value={sec.title}
                  onChange={v => updateSectionMeta(sec.id, { title: v })}
                  editing={editing}
                  customStyle={ts[`sec-title-${sec.id}`]}
                  isSelected={activeTextSelection?.tkey === `sec-title-${sec.id}`}
                  onSelectForStyle={setActiveTextSelection}
                />
                <EditableText
                  as="p"
                  className="lede"
                  tkey={`sec-lede-${sec.id}`}
                  label="Deployments Subtitle"
                  value={sec.lede}
                  onChange={v => updateSectionMeta(sec.id, { lede: v })}
                  editing={editing}
                  customStyle={ts[`sec-lede-${sec.id}`]}
                  isSelected={activeTextSelection?.tkey === `sec-lede-${sec.id}`}
                  onSelectForStyle={setActiveTextSelection}
                />
              </div>
              {editing && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <button type="button" className="studio-mini-btn" onClick={addNewGroupCard}>
                    + Add Tenure Group
                  </button>
                  {renderSectionToolbar(sec, {
                    label: '+ Add Robot Card',
                    onClick: addNewRobotCard
                  })}
                </div>
              )}
            </div>

            <div
              className="deploy-viewport"
              tabIndex={0}
              aria-label="Deployments, scroll sideways"
              ref={deployVpRef}
            >
              <ul className="deploy-track" id="deploy-track" ref={deployTrackRef}>
                {content.deployments.map((d, idx) => {
                  if (isGroupEntry(d)) {
                    return (
                      <li key={d.id} className="group-card">
                        <div>
                          <EditableText
                            as="span"
                            className="group-kicker"
                            tkey={`dep-when-${d.id}`}
                            label="Group Tenure Dates"
                            value={d.when}
                            onChange={v =>
                              updateContent({
                                deployments: content.deployments.map((it, i) =>
                                  i === idx && isGroupEntry(it) ? { ...it, when: v } : it
                                )
                              })
                            }
                            editing={editing}
                            customStyle={ts[`dep-when-${d.id}`]}
                            isSelected={activeTextSelection?.tkey === `dep-when-${d.id}`}
                            onSelectForStyle={setActiveTextSelection}
                          />
                          <EditableText
                            as="h3"
                            tkey={`dep-grp-${d.id}`}
                            label="Group Organization Name"
                            value={d.group}
                            onChange={v =>
                              updateContent({
                                deployments: content.deployments.map((it, i) =>
                                  i === idx && isGroupEntry(it) ? { ...it, group: v } : it
                                )
                              })
                            }
                            editing={editing}
                            customStyle={ts[`dep-grp-${d.id}`]}
                            isSelected={activeTextSelection?.tkey === `dep-grp-${d.id}`}
                            onSelectForStyle={setActiveTextSelection}
                          />
                        </div>
                        <EditableText
                          as="p"
                          tkey={`dep-txt-${d.id}`}
                          label="Group Summary"
                          value={d.text}
                          onChange={v =>
                            updateContent({
                              deployments: content.deployments.map((it, i) =>
                                i === idx && isGroupEntry(it) ? { ...it, text: v } : it
                              )
                            })
                          }
                          editing={editing}
                          customStyle={ts[`dep-txt-${d.id}`]}
                          isSelected={activeTextSelection?.tkey === `dep-txt-${d.id}`}
                          onSelectForStyle={setActiveTextSelection}
                        />
                        {editing && (
                          <div className="item-edit-bar">
                            <button
                              type="button"
                              className="studio-mini-btn"
                              disabled={idx === 0}
                              onClick={() => moveDeployItem(idx, -1)}
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              className="studio-mini-btn"
                              disabled={idx === content.deployments.length - 1}
                              onClick={() => moveDeployItem(idx, 1)}
                            >
                              →
                            </button>
                            <button
                              type="button"
                              className="studio-mini-btn"
                              style={{ color: '#E11D48', marginLeft: 'auto' }}
                              onClick={() =>
                                updateContent({
                                  deployments: content.deployments.filter((_, i) => i !== idx)
                                })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  }

                  const mode = cardViewMode[d.id] || 'photo';
                  const customPhoto = state.photos[d.id];
                  const activePhoto = customPhoto || d.defaultPhoto;
                  const slamSvg = SLAM_ART_GENERATORS[d.art](d.feature ? 480 : 326, 214, rng(hash(d.id)));

                  const updateThisCard = (patch: Partial<DeploymentCardItem>) => {
                    updateContent({
                      deployments: content.deployments.map((it, i) =>
                        i === idx && !isGroupEntry(it) ? { ...it, ...patch } : it
                      )
                    });
                  };

                  return (
                    <li
                      key={d.id}
                      className={`card in${d.feature ? ' feature' : ''}`}
                      data-id={d.id}
                    >
                      <div
                        className="card-art"
                        onClick={e => {
                          if ((e.target as HTMLElement).closest('button,[contenteditable="true"]')) return;
                          setSelectedDeployment(d);
                        }}
                      >
                        {mode === 'photo' ? (
                          <>
                            <img
                              src={activePhoto}
                              alt={`${d.title} at ${d.site}`}
                              referrerPolicy="no-referrer"
                              style={{ objectPosition: d.photoPosition || 'center center' }}
                            />
                            <div className="card-art-scrim" />
                            <div className="card-art-caption" style={{ pointerEvents: editing ? 'auto' : 'none' }}>
                              <EditableText
                                as="span"
                                tkey={`dep-badge-${d.id}`}
                                label="Robot Card Badge"
                                value={d.platformBadge}
                                onChange={v => updateThisCard({ platformBadge: v })}
                                editing={editing}
                                customStyle={ts[`dep-badge-${d.id}`]}
                                isSelected={activeTextSelection?.tkey === `dep-badge-${d.id}`}
                                onSelectForStyle={setActiveTextSelection}
                              />
                            </div>
                          </>
                        ) : (
                          <div
                            style={{ width: '100%', height: '100%' }}
                            dangerouslySetInnerHTML={{ __html: slamSvg }}
                          />
                        )}

                        <div className="card-mode-switch" role="group" aria-label="Card visual view">
                          <button
                            type="button"
                            aria-pressed={mode === 'photo'}
                            onClick={() => setCardViewMode(prev => ({ ...prev, [d.id]: 'photo' }))}
                          >
                            Photo
                          </button>
                          <button
                            type="button"
                            aria-pressed={mode === 'slam'}
                            onClick={() => setCardViewMode(prev => ({ ...prev, [d.id]: 'slam' }))}
                          >
                            SLAM Map
                          </button>
                        </div>

                        <div className="slot-tools">
                          <button type="button" onClick={() => triggerFilePick('photos', d.id)}>
                            {customPhoto ? 'Replace photo' : 'Upload photo'}
                          </button>
                          {customPhoto && (
                            <button type="button" onClick={() => clearCustomMedia('photos', d.id)}>
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="card-body">
                        <EditableText
                          as="h3"
                          tkey={`dep-title-${d.id}`}
                          label="Robot Title"
                          value={d.title}
                          onChange={v => updateThisCard({ title: v })}
                          editing={editing}
                          customStyle={ts[`dep-title-${d.id}`]}
                          isSelected={activeTextSelection?.tkey === `dep-title-${d.id}`}
                          onSelectForStyle={setActiveTextSelection}
                        />
                        <EditableText
                          as="p"
                          className="site"
                          tkey={`dep-site-${d.id}`}
                          label="Deployment Venue"
                          value={d.site}
                          onChange={v => updateThisCard({ site: v })}
                          editing={editing}
                          customStyle={ts[`dep-site-${d.id}`]}
                          isSelected={activeTextSelection?.tkey === `dep-site-${d.id}`}
                          onSelectForStyle={setActiveTextSelection}
                        />
                        <EditableText
                          as="p"
                          className="note"
                          tkey={`dep-note-${d.id}`}
                          label="Deployment Note"
                          value={d.note}
                          onChange={v => updateThisCard({ note: v })}
                          editing={editing}
                          customStyle={ts[`dep-note-${d.id}`]}
                          isSelected={activeTextSelection?.tkey === `dep-note-${d.id}`}
                          onSelectForStyle={setActiveTextSelection}
                        />
                        <div className="card-footer-meta">
                          <EditableText
                            as="span"
                            tkey={`dep-nav-${d.id}`}
                            label="Navigation Spec"
                            value={d.specs.navigation}
                            onChange={v => updateThisCard({ specs: { ...d.specs, navigation: v } })}
                            editing={editing}
                            customStyle={ts[`dep-nav-${d.id}`]}
                            isSelected={activeTextSelection?.tkey === `dep-nav-${d.id}`}
                            onSelectForStyle={setActiveTextSelection}
                          />
                          <button
                            type="button"
                            className="card-spec-btn"
                            onClick={() => setSelectedDeployment(d)}
                          >
                            Specs &amp; details
                          </button>
                        </div>

                        {editing && (
                          <div className="item-edit-bar">
                            <button
                              type="button"
                              className="studio-mini-btn"
                              disabled={idx === 0}
                              onClick={() => moveDeployItem(idx, -1)}
                              title="Move left"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              className="studio-mini-btn"
                              disabled={idx === content.deployments.length - 1}
                              onClick={() => moveDeployItem(idx, 1)}
                              title="Move right"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              className="studio-mini-btn"
                              onClick={() => updateThisCard({ feature: !d.feature })}
                            >
                              {d.feature ? 'Standard width' : 'Wide feature'}
                            </button>
                            <button
                              type="button"
                              className="studio-mini-btn"
                              style={{ color: '#E11D48', marginLeft: 'auto' }}
                              onClick={() =>
                                updateContent({
                                  deployments: content.deployments.filter((_, i) => i !== idx)
                                })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="deploy-bar" aria-hidden="true">
              <i ref={deployBarRef} />
            </div>
          </div>
        </section>
      );
    }

    if (sec.type === 'clients') {
      const addNewClient = () => {
        const key = `client-${Date.now()}`;
        updateContent({
          clients: [
            ...content.clients,
            {
              key,
              name: 'New Enterprise Client',
              short: 'CLIENT',
              sector: activeSector === 'all' ? 'fm' : activeSector,
              does: 'Autonomous robotics & digital transformation'
            }
          ]
        });
      };

      const addNewPartner = () => {
        const key = `partner-${Date.now()}`;
        updateContent({
          partners: [
            ...content.partners,
            {
              key,
              name: 'New Partner',
              role: 'Robotics & AI ecosystem partner',
              svg: `<svg viewBox="0 0 200 56" xmlns="http://www.w3.org/2000/svg"><text x="100" y="34" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="20" fill="#101010">PARTNER</text></svg>`
            }
          ]
        });
      };

      return (
        <section key={sec.id} className="sec" id={sec.id} aria-labelledby={`h-${sec.id}`} style={secStyle}>
          <div className="sec-head">
            <div className="sec-head-copy">
              <EditableText
                as="h2"
                id={`h-${sec.id}`}
                className="display"
                tkey={`sec-title-${sec.id}`}
                label="Clients Heading"
                value={sec.title}
                onChange={v => updateSectionMeta(sec.id, { title: v })}
                editing={editing}
                customStyle={ts[`sec-title-${sec.id}`]}
                isSelected={activeTextSelection?.tkey === `sec-title-${sec.id}`}
                onSelectForStyle={setActiveTextSelection}
              />
              <EditableText
                as="p"
                className="lede"
                tkey={`sec-lede-${sec.id}`}
                label="Clients Subtitle"
                value={sec.lede}
                onChange={v => updateSectionMeta(sec.id, { lede: v })}
                editing={editing}
                customStyle={ts[`sec-lede-${sec.id}`]}
                isSelected={activeTextSelection?.tkey === `sec-lede-${sec.id}`}
                onSelectForStyle={setActiveTextSelection}
              />
            </div>
            {editing && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <button type="button" className="studio-mini-btn" onClick={addNewPartner}>
                  + Add Partner
                </button>
                {renderSectionToolbar(sec, {
                  label: '+ Add Client',
                  onClick: addNewClient
                })}
              </div>
            )}
          </div>

          <div className="filters" id="filters" role="group" aria-label="Filter by sector">
            {content.sectors.map(([k, label]) => (
              <button
                key={k}
                type="button"
                data-sector={k}
                aria-pressed={activeSector === k}
                onClick={() => setActiveSector(k)}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="clients" id="clients-grid">
            {content.clients.map((c, idx) => {
              const dimmed = activeSector !== 'all' && c.sector !== activeSector;
              const customLogo = state.logos[c.key];
              const defaultSvg = CLIENT_LOGOS_SVG[c.key];

              return (
                <li
                  key={c.key}
                  className={`client${dimmed ? ' dim' : ''}`}
                  data-key={c.key}
                  data-sector={c.sector}
                >
                  <div className="plate">
                    {customLogo ? (
                      <img src={customLogo} alt={`${c.name} logo`} referrerPolicy="no-referrer" />
                    ) : defaultSvg ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        dangerouslySetInnerHTML={{ __html: defaultSvg }}
                      />
                    ) : (
                      <span className="wordmark">{c.short || c.name}</span>
                    )}

                    <div className="slot-tools">
                      <button type="button" onClick={() => triggerFilePick('logos', c.key)}>
                        {customLogo ? 'Replace logo' : 'Custom logo'}
                      </button>
                      {customLogo && (
                        <button type="button" onClick={() => clearCustomMedia('logos', c.key)}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <EditableText
                    as="h3"
                    tkey={`cli-name-${c.key}`}
                    label="Client Name"
                    value={c.name}
                    onChange={v =>
                      updateContent({
                        clients: content.clients.map((it, i) => (i === idx ? { ...it, name: v } : it))
                      })
                    }
                    editing={editing}
                    customStyle={ts[`cli-name-${c.key}`]}
                    isSelected={activeTextSelection?.tkey === `cli-name-${c.key}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  <EditableText
                    as="p"
                    tkey={`cli-does-${c.key}`}
                    label="Client Scope"
                    value={c.does}
                    onChange={v =>
                      updateContent({
                        clients: content.clients.map((it, i) => (i === idx ? { ...it, does: v } : it))
                      })
                    }
                    editing={editing}
                    customStyle={ts[`cli-does-${c.key}`]}
                    isSelected={activeTextSelection?.tkey === `cli-does-${c.key}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  {editing && (
                    <div className="item-edit-bar">
                      <select
                        className="studio-mini-btn"
                        value={c.sector}
                        onChange={e =>
                          updateContent({
                            clients: content.clients.map((it, i) =>
                              i === idx ? { ...it, sector: e.target.value } : it
                            )
                          })
                        }
                      >
                        {content.sectors
                          .filter(([sk]) => sk !== 'all')
                          .map(([sk, sl]) => (
                            <option key={sk} value={sk}>
                              {sl}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        className="studio-mini-btn"
                        style={{ color: '#E11D48', marginLeft: 'auto' }}
                        onClick={() =>
                          updateContent({ clients: content.clients.filter((_, i) => i !== idx) })
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Partners Block */}
          <div className="partners-block">
            <div className="partners-head">
              <EditableText
                as="h3"
                tkey="partners-heading"
                label="Partners Heading"
                value={content.partnersHeading}
                onChange={v => updateContent({ partnersHeading: v })}
                editing={editing}
                customStyle={ts['partners-heading']}
                isSelected={activeTextSelection?.tkey === 'partners-heading'}
                onSelectForStyle={setActiveTextSelection}
              />
              <EditableText
                as="p"
                tkey="partners-subheading"
                label="Partners Subtitle"
                value={content.partnersSubheading}
                onChange={v => updateContent({ partnersSubheading: v })}
                editing={editing}
                customStyle={ts['partners-subheading']}
                isSelected={activeTextSelection?.tkey === 'partners-subheading'}
                onSelectForStyle={setActiveTextSelection}
              />
            </div>
            <ul className="partners-grid">
              {content.partners.map((p, idx) => {
                const customPartnerLogo = state.partnerLogos[p.key];
                return (
                  <li key={p.key} className="partner-tile">
                    <div className="partner-plate">
                      {customPartnerLogo ? (
                        <img src={customPartnerLogo} alt={`${p.name} logo`} referrerPolicy="no-referrer" />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          dangerouslySetInnerHTML={{ __html: p.svg }}
                        />
                      )}
                      <div className="slot-tools">
                        <button type="button" onClick={() => triggerFilePick('partnerLogos', p.key)}>
                          {customPartnerLogo ? 'Replace' : 'Upload logo'}
                        </button>
                        {customPartnerLogo && (
                          <button type="button" onClick={() => clearCustomMedia('partnerLogos', p.key)}>
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <EditableText
                      as="strong"
                      tkey={`part-name-${p.key}`}
                      label="Partner Name"
                      value={p.name}
                      onChange={v =>
                        updateContent({
                          partners: content.partners.map((it, i) => (i === idx ? { ...it, name: v } : it))
                        })
                      }
                      editing={editing}
                      customStyle={ts[`part-name-${p.key}`]}
                      isSelected={activeTextSelection?.tkey === `part-name-${p.key}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <EditableText
                      as="span"
                      tkey={`part-role-${p.key}`}
                      label="Partner Role"
                      value={p.role}
                      onChange={v =>
                        updateContent({
                          partners: content.partners.map((it, i) => (i === idx ? { ...it, role: v } : it))
                        })
                      }
                      editing={editing}
                      customStyle={ts[`part-role-${p.key}`]}
                      isSelected={activeTextSelection?.tkey === `part-role-${p.key}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    {editing && (
                      <div className="item-edit-bar">
                        <button
                          type="button"
                          className="studio-mini-btn"
                          style={{ color: '#E11D48', marginLeft: 'auto' }}
                          onClick={() =>
                            updateContent({ partners: content.partners.filter((_, i) => i !== idx) })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      );
    }

    if (sec.type === 'experience') {
      const addExperienceRole = () => {
        const id = `xp-${Date.now()}`;
        updateContent({
          experiences: [
            {
              id,
              when: '2026 to now',
              role: 'New Engineering / Leadership Role',
              org: 'Company Name, Dubai',
              defaultOpen: true,
              bullets: [
                'Key achievement, autonomous fleet deployment, or enterprise revenue milestone.',
                'Technical architecture, team leadership, and stakeholder enablement.'
              ]
            },
            ...content.experiences
          ]
        });
        setOpenXpIds(prev => ({ ...prev, [id]: true }));
      };

      return (
        <section key={sec.id} className="sec" id={sec.id} aria-labelledby={`h-${sec.id}`} style={secStyle}>
          <div className="sec-head">
            <div className="sec-head-copy">
              <EditableText
                as="h2"
                id={`h-${sec.id}`}
                className="display"
                tkey={`sec-title-${sec.id}`}
                label="Experience Heading"
                value={sec.title}
                onChange={v => updateSectionMeta(sec.id, { title: v })}
                editing={editing}
                customStyle={ts[`sec-title-${sec.id}`]}
                isSelected={activeTextSelection?.tkey === `sec-title-${sec.id}`}
                onSelectForStyle={setActiveTextSelection}
              />
            </div>
            {renderSectionToolbar(sec, {
              label: '+ Add Experience Role',
              onClick: addExperienceRole
            })}
          </div>

          {content.experiences.map((xp, idx) => {
            const isOpen = editing ? true : !!openXpIds[xp.id];
            const updateThisXp = (patch: Partial<typeof xp>) => {
              updateContent({
                experiences: content.experiences.map((it, i) => (i === idx ? { ...it, ...patch } : it))
              });
            };

            return (
              <div key={xp.id} className="xp">
                <div
                  className="xp-btn"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-controls={xp.id}
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('button,[contenteditable="true"]')) return;
                    setOpenXpIds(prev => ({ ...prev, [xp.id]: !prev[xp.id] }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if ((e.target as HTMLElement).closest('[contenteditable="true"]')) return;
                      e.preventDefault();
                      setOpenXpIds(prev => ({ ...prev, [xp.id]: !prev[xp.id] }));
                    }
                  }}
                >
                  <EditableText
                    as="span"
                    className="xp-when"
                    tkey={`xp-when-${xp.id}`}
                    label="Experience Dates"
                    value={xp.when}
                    onChange={v => updateThisXp({ when: v })}
                    editing={editing}
                    customStyle={ts[`xp-when-${xp.id}`]}
                    isSelected={activeTextSelection?.tkey === `xp-when-${xp.id}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  <span>
                    <EditableText
                      as="span"
                      className="xp-role"
                      tkey={`xp-role-${xp.id}`}
                      label="Role Title"
                      value={xp.role}
                      onChange={v => updateThisXp({ role: v })}
                      editing={editing}
                      customStyle={ts[`xp-role-${xp.id}`]}
                      isSelected={activeTextSelection?.tkey === `xp-role-${xp.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <EditableText
                      as="span"
                      className="xp-org"
                      tkey={`xp-org-${xp.id}`}
                      label="Organization & Location"
                      value={xp.org}
                      onChange={v => updateThisXp({ org: v })}
                      editing={editing}
                      customStyle={ts[`xp-org-${xp.id}`]}
                      isSelected={activeTextSelection?.tkey === `xp-org-${xp.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                  </span>
                  <span className="xp-sign" aria-hidden="true" />
                </div>

                <div className="xp-panel" id={xp.id}>
                  <div>
                    {xp.subRoles ? (
                      <div className="xp-body">
                        {xp.subRoles.map((sr, srIdx) => (
                          <React.Fragment key={srIdx}>
                            <EditableText
                              as="h4"
                              tkey={`xp-sr-${xp.id}-${srIdx}`}
                              label="Sub-role Title"
                              value={sr.title}
                              onChange={v => {
                                const nextSr = [...(xp.subRoles || [])];
                                nextSr[srIdx] = { ...nextSr[srIdx], title: v };
                                updateThisXp({ subRoles: nextSr });
                              }}
                              editing={editing}
                              customStyle={ts[`xp-sr-${xp.id}-${srIdx}`]}
                              isSelected={activeTextSelection?.tkey === `xp-sr-${xp.id}-${srIdx}`}
                              onSelectForStyle={setActiveTextSelection}
                            />
                            <ul>
                              {sr.bullets.map((b, bIdx) => (
                                <li key={bIdx}>
                                  <EditableText
                                    as="span"
                                    tkey={`xp-srb-${xp.id}-${srIdx}-${bIdx}`}
                                    label="Experience Bullet"
                                    value={b}
                                    onChange={v => {
                                      const nextSr = [...(xp.subRoles || [])];
                                      const nextBullets = [...nextSr[srIdx].bullets];
                                      nextBullets[bIdx] = v;
                                      nextSr[srIdx] = { ...nextSr[srIdx], bullets: nextBullets };
                                      updateThisXp({ subRoles: nextSr });
                                    }}
                                    editing={editing}
                                    customStyle={ts[`xp-srb-${xp.id}-${srIdx}-${bIdx}`]}
                                    isSelected={
                                      activeTextSelection?.tkey === `xp-srb-${xp.id}-${srIdx}-${bIdx}`
                                    }
                                    onSelectForStyle={setActiveTextSelection}
                                  />
                                </li>
                              ))}
                            </ul>
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <ul className="xp-body">
                        {(xp.bullets || []).map((b, bIdx) => (
                          <li key={bIdx} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <EditableText
                              as="span"
                              tkey={`xp-b-${xp.id}-${bIdx}`}
                              label="Experience Bullet"
                              value={b}
                              onChange={v => {
                                const nextB = [...(xp.bullets || [])];
                                nextB[bIdx] = v;
                                updateThisXp({ bullets: nextB });
                              }}
                              editing={editing}
                              customStyle={ts[`xp-b-${xp.id}-${bIdx}`]}
                              isSelected={activeTextSelection?.tkey === `xp-b-${xp.id}-${bIdx}`}
                              onSelectForStyle={setActiveTextSelection}
                            />
                            {editing && (
                              <button
                                type="button"
                                className="studio-mini-btn"
                                style={{ color: '#E11D48' }}
                                onClick={() =>
                                  updateThisXp({
                                    bullets: (xp.bullets || []).filter((_, i) => i !== bIdx)
                                  })
                                }
                              >
                                ✕
                              </button>
                            )}
                          </li>
                        ))}
                        {editing && (
                          <li style={{ listStyle: 'none', paddingLeft: 0, marginTop: '0.75rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                              <button
                                type="button"
                                className="studio-mini-btn"
                                onClick={() =>
                                  updateThisXp({
                                    bullets: [...(xp.bullets || []), 'New achievement or responsibility bullet point.']
                                  })
                                }
                              >
                                + Add bullet point
                              </button>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  className="studio-mini-btn"
                                  onClick={() => {
                                    const copy = [...content.experiences];
                                    const [rem] = copy.splice(idx, 1);
                                    copy.splice(idx - 1, 0, rem);
                                    updateContent({ experiences: copy });
                                  }}
                                >
                                  ↑ Move Role Up
                                </button>
                              )}
                              <button
                                type="button"
                                className="studio-mini-btn"
                                style={{ color: '#E11D48' }}
                                onClick={() =>
                                  updateContent({
                                    experiences: content.experiences.filter((_, i) => i !== idx)
                                  })
                                }
                              >
                                Delete Role
                              </button>
                            </div>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      );
    }

    if (sec.type === 'projects') {
      const addNewProject = () => {
        const id = `proj-${Date.now()}`;
        updateContent({
          projects: [
            ...content.projects,
            {
              id,
              title: 'New Engineering Project',
              where: 'SoftBank Robotics',
              what: 'High-impact technical integration, automation workflow, or autonomous fleet solution.',
              tags: ['Robotics', 'Cloud IoT', 'Automation'],
              architectureNotes: [
                'End-to-end architecture and integration workflow.',
                'Quantifiable business impact and deployment outcome.'
              ],
              outcomeMetric: 'Production deployment'
            }
          ]
        });
      };

      return (
        <section key={sec.id} className="sec" id={sec.id} aria-labelledby={`h-${sec.id}`} style={secStyle}>
          <div className="sec-head">
            <div className="sec-head-copy">
              <EditableText
                as="h2"
                id={`h-${sec.id}`}
                className="display"
                tkey={`sec-title-${sec.id}`}
                label="Projects Heading"
                value={sec.title}
                onChange={v => updateSectionMeta(sec.id, { title: v })}
                editing={editing}
                customStyle={ts[`sec-title-${sec.id}`]}
                isSelected={activeTextSelection?.tkey === `sec-title-${sec.id}`}
                onSelectForStyle={setActiveTextSelection}
              />
              <EditableText
                as="p"
                className="lede"
                tkey={`sec-lede-${sec.id}`}
                label="Projects Subtitle"
                value={sec.lede}
                onChange={v => updateSectionMeta(sec.id, { lede: v })}
                editing={editing}
                customStyle={ts[`sec-lede-${sec.id}`]}
                isSelected={activeTextSelection?.tkey === `sec-lede-${sec.id}`}
                onSelectForStyle={setActiveTextSelection}
              />
            </div>
            {renderSectionToolbar(sec, {
              label: '+ Add Project',
              onClick: addNewProject
            })}
          </div>

          <div className="proj-grid">
            {content.projects.map((p, idx) => {
              const customVisual = state.projectPhotos[p.id];
              const schematicSvg = PROJECT_SCHEMATICS_SVG[p.id] || PROJECT_SCHEMATICS_SVG['fleet-telemetry'];
              const updateThisProj = (patch: Partial<ProjectItem>) => {
                updateContent({
                  projects: content.projects.map((it, i) => (i === idx ? { ...it, ...patch } : it))
                });
              };

              return (
                <article key={p.id} className="proj-card">
                  <div
                    className="proj-visual"
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('button,[contenteditable="true"]')) return;
                      setSelectedProject(p);
                    }}
                  >
                    {customVisual ? (
                      <img src={customVisual} alt={p.title} referrerPolicy="no-referrer" />
                    ) : (
                      <div
                        style={{ width: '100%', height: '100%' }}
                        dangerouslySetInnerHTML={{ __html: schematicSvg }}
                      />
                    )}
                    <div className="slot-tools">
                      <button type="button" onClick={() => triggerFilePick('projectPhotos', p.id)}>
                        {customVisual ? 'Replace image' : 'Upload project image'}
                      </button>
                      {customVisual && (
                        <button type="button" onClick={() => clearCustomMedia('projectPhotos', p.id)}>
                          Reset schematic
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="proj-body">
                    <span className="proj-kicker">
                      <EditableText
                        as="span"
                        tkey={`proj-where-${p.id}`}
                        label="Project Organization"
                        value={p.where}
                        onChange={v => updateThisProj({ where: v })}
                        editing={editing}
                        customStyle={ts[`proj-where-${p.id}`]}
                        isSelected={activeTextSelection?.tkey === `proj-where-${p.id}`}
                        onSelectForStyle={setActiveTextSelection}
                      />
                      {' · '}
                      <EditableText
                        as="span"
                        tkey={`proj-out-${p.id}`}
                        label="Project Outcome Metric"
                        value={p.outcomeMetric}
                        onChange={v => updateThisProj({ outcomeMetric: v })}
                        editing={editing}
                        customStyle={ts[`proj-out-${p.id}`]}
                        isSelected={activeTextSelection?.tkey === `proj-out-${p.id}`}
                        onSelectForStyle={setActiveTextSelection}
                      />
                    </span>
                    <EditableText
                      as="h3"
                      tkey={`proj-title-${p.id}`}
                      label="Project Title"
                      value={p.title}
                      onChange={v => updateThisProj({ title: v })}
                      editing={editing}
                      customStyle={ts[`proj-title-${p.id}`]}
                      isSelected={activeTextSelection?.tkey === `proj-title-${p.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <EditableText
                      as="p"
                      className="what"
                      tkey={`proj-what-${p.id}`}
                      label="Project Description"
                      value={p.what}
                      onChange={v => updateThisProj({ what: v })}
                      editing={editing}
                      customStyle={ts[`proj-what-${p.id}`]}
                      isSelected={activeTextSelection?.tkey === `proj-what-${p.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <div className="proj-meta">
                      <EditableText
                        as="span"
                        tkey={`proj-tags-${p.id}`}
                        label="Project Tags (separated by ·)"
                        value={p.tags.join(' · ')}
                        onChange={v =>
                          updateThisProj({
                            tags: v
                              .split(/[·,]/)
                              .map(s => s.trim())
                              .filter(Boolean)
                          })
                        }
                        editing={editing}
                        customStyle={ts[`proj-tags-${p.id}`]}
                        isSelected={activeTextSelection?.tkey === `proj-tags-${p.id}`}
                        onSelectForStyle={setActiveTextSelection}
                      />
                      <button
                        type="button"
                        className="card-spec-btn"
                        onClick={() => setSelectedProject(p)}
                      >
                        Architecture notes
                      </button>
                    </div>
                    {editing && (
                      <div className="item-edit-bar">
                        {idx > 0 && (
                          <button
                            type="button"
                            className="studio-mini-btn"
                            onClick={() => {
                              const copy = [...content.projects];
                              const [rem] = copy.splice(idx, 1);
                              copy.splice(idx - 1, 0, rem);
                              updateContent({ projects: copy });
                            }}
                          >
                            ← Move Up
                          </button>
                        )}
                        <button
                          type="button"
                          className="studio-mini-btn"
                          style={{ color: '#E11D48', marginLeft: 'auto' }}
                          onClick={() =>
                            updateContent({ projects: content.projects.filter((_, i) => i !== idx) })
                          }
                        >
                          Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    if (sec.type === 'toolkit') {
      const addToolkitCategory = () => {
        updateContent({
          toolkitCategories: [
            ...content.toolkitCategories,
            {
              id: `kit-${Date.now()}`,
              title: 'New Skill Domain',
              items: ['Skill or platform 1', 'Skill or platform 2']
            }
          ]
        });
      };

      return (
        <section key={sec.id} className="sec" id={sec.id} aria-labelledby={`h-${sec.id}`} style={secStyle}>
          <div className="sec-head">
            <div className="sec-head-copy">
              <EditableText
                as="h2"
                id={`h-${sec.id}`}
                className="display"
                tkey={`sec-title-${sec.id}`}
                label="Toolkit Heading"
                value={sec.title}
                onChange={v => updateSectionMeta(sec.id, { title: v })}
                editing={editing}
                customStyle={ts[`sec-title-${sec.id}`]}
                isSelected={activeTextSelection?.tkey === `sec-title-${sec.id}`}
                onSelectForStyle={setActiveTextSelection}
              />
            </div>
            {renderSectionToolbar(sec, {
              label: '+ Add Skill Column',
              onClick: addToolkitCategory
            })}
          </div>

          <div className="kit">
            {content.toolkitCategories.map((cat, catIdx) => (
              <div key={cat.id}>
                <EditableText
                  as="h3"
                  tkey={`kit-title-${cat.id}`}
                  label="Toolkit Category Title"
                  value={cat.title}
                  onChange={v =>
                    updateContent({
                      toolkitCategories: content.toolkitCategories.map((c, i) =>
                        i === catIdx ? { ...c, title: v } : c
                      )
                    })
                  }
                  editing={editing}
                  customStyle={ts[`kit-title-${cat.id}`]}
                  isSelected={activeTextSelection?.tkey === `kit-title-${cat.id}`}
                  onSelectForStyle={setActiveTextSelection}
                />
                <ul>
                  {cat.items.map((item, itemIdx) => (
                    <li key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.35rem' }}>
                      <EditableText
                        as="span"
                        tkey={`kit-item-${cat.id}-${itemIdx}`}
                        label="Toolkit Skill"
                        value={item}
                        onChange={v => {
                          const nextItems = [...cat.items];
                          nextItems[itemIdx] = v;
                          updateContent({
                            toolkitCategories: content.toolkitCategories.map((c, i) =>
                              i === catIdx ? { ...c, items: nextItems } : c
                            )
                          });
                        }}
                        editing={editing}
                        customStyle={ts[`kit-item-${cat.id}-${itemIdx}`]}
                        isSelected={activeTextSelection?.tkey === `kit-item-${cat.id}-${itemIdx}`}
                        onSelectForStyle={setActiveTextSelection}
                      />
                      {editing && (
                        <button
                          type="button"
                          className="studio-mini-btn"
                          style={{ color: '#E11D48', padding: '0 0.35rem', minHeight: '22px' }}
                          onClick={() => {
                            const nextItems = cat.items.filter((_, i) => i !== itemIdx);
                            updateContent({
                              toolkitCategories: content.toolkitCategories.map((c, i) =>
                                i === catIdx ? { ...c, items: nextItems } : c
                              )
                            });
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {editing && (
                  <div className="item-edit-bar">
                    <button
                      type="button"
                      className="studio-mini-btn"
                      onClick={() => {
                        const nextItems = [...cat.items, 'New tool or technology'];
                        updateContent({
                          toolkitCategories: content.toolkitCategories.map((c, i) =>
                            i === catIdx ? { ...c, items: nextItems } : c
                          )
                        });
                      }}
                    >
                      + Add skill
                    </button>
                    <button
                      type="button"
                      className="studio-mini-btn"
                      style={{ color: '#E11D48', marginLeft: 'auto' }}
                      onClick={() =>
                        updateContent({
                          toolkitCategories: content.toolkitCategories.filter((_, i) => i !== catIdx)
                        })
                      }
                    >
                      Remove col
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="creds">
            {/* Certifications */}
            <div>
              <EditableText
                as="h3"
                tkey="creds-cert-title"
                label="Certifications Heading"
                value={content.certificationsTitle}
                onChange={v => updateContent({ certificationsTitle: v })}
                editing={editing}
                customStyle={ts['creds-cert-title']}
                isSelected={activeTextSelection?.tkey === 'creds-cert-title'}
                onSelectForStyle={setActiveTextSelection}
              />
              <ul>
                {content.certifications.map((cert, idx) => (
                  <li key={cert.id}>
                    <EditableText
                      as="span"
                      tkey={`cert-name-${cert.id}`}
                      label="Certification Name"
                      value={cert.name}
                      onChange={v =>
                        updateContent({
                          certifications: content.certifications.map((c, i) =>
                            i === idx ? { ...c, name: v } : c
                          )
                        })
                      }
                      editing={editing}
                      customStyle={ts[`cert-name-${cert.id}`]}
                      isSelected={activeTextSelection?.tkey === `cert-name-${cert.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <EditableText
                      as="span"
                      tkey={`cert-yr-${cert.id}`}
                      label="Certification Year"
                      value={cert.year}
                      onChange={v =>
                        updateContent({
                          certifications: content.certifications.map((c, i) =>
                            i === idx ? { ...c, year: v } : c
                          )
                        })
                      }
                      editing={editing}
                      customStyle={ts[`cert-yr-${cert.id}`]}
                      isSelected={activeTextSelection?.tkey === `cert-yr-${cert.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                  </li>
                ))}
              </ul>
              {editing && (
                <div className="item-edit-bar">
                  <button
                    type="button"
                    className="studio-mini-btn"
                    onClick={() =>
                      updateContent({
                        certifications: [
                          ...content.certifications,
                          { id: `cert-${Date.now()}`, name: 'New Certification', year: '2026' }
                        ]
                      })
                    }
                  >
                    + Add certification
                  </button>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="edu">
              <EditableText
                as="h3"
                tkey="creds-edu-title"
                label="Education Heading"
                value={content.educationTitle}
                onChange={v => updateContent({ educationTitle: v })}
                editing={editing}
                customStyle={ts['creds-edu-title']}
                isSelected={activeTextSelection?.tkey === 'creds-edu-title'}
                onSelectForStyle={setActiveTextSelection}
              />
              <ul>
                {content.education.map((ed, idx) => (
                  <li key={ed.id}>
                    <EditableText
                      as="strong"
                      tkey={`edu-deg-${ed.id}`}
                      label="Degree Name"
                      value={ed.degree}
                      onChange={v =>
                        updateContent({
                          education: content.education.map((e, i) => (i === idx ? { ...e, degree: v } : e))
                        })
                      }
                      editing={editing}
                      customStyle={ts[`edu-deg-${ed.id}`]}
                      isSelected={activeTextSelection?.tkey === `edu-deg-${ed.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <EditableText
                      as="span"
                      tkey={`edu-det-${ed.id}`}
                      label="Education Details"
                      value={ed.details}
                      onChange={v =>
                        updateContent({
                          education: content.education.map((e, i) => (i === idx ? { ...e, details: v } : e))
                        })
                      }
                      editing={editing}
                      customStyle={ts[`edu-det-${ed.id}`]}
                      isSelected={activeTextSelection?.tkey === `edu-det-${ed.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                  </li>
                ))}
              </ul>
              {editing && (
                <div className="item-edit-bar">
                  <button
                    type="button"
                    className="studio-mini-btn"
                    onClick={() =>
                      updateContent({
                        education: [
                          ...content.education,
                          {
                            id: `edu-${Date.now()}`,
                            degree: 'New Degree / Diploma',
                            details: 'University Name, Year.'
                          }
                        ]
                      })
                    }
                  >
                    + Add education
                  </button>
                </div>
              )}
            </div>

            {/* Languages */}
            <div>
              <EditableText
                as="h3"
                tkey="creds-lang-title"
                label="Languages Heading"
                value={content.languagesTitle}
                onChange={v => updateContent({ languagesTitle: v })}
                editing={editing}
                customStyle={ts['creds-lang-title']}
                isSelected={activeTextSelection?.tkey === 'creds-lang-title'}
                onSelectForStyle={setActiveTextSelection}
              />
              <ul>
                {content.languages.map((lg, idx) => (
                  <li key={lg.id}>
                    <EditableText
                      as="span"
                      tkey={`lang-name-${lg.id}`}
                      label="Language"
                      value={lg.language}
                      onChange={v =>
                        updateContent({
                          languages: content.languages.map((l, i) => (i === idx ? { ...l, language: v } : l))
                        })
                      }
                      editing={editing}
                      customStyle={ts[`lang-name-${lg.id}`]}
                      isSelected={activeTextSelection?.tkey === `lang-name-${lg.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                    <EditableText
                      as="span"
                      tkey={`lang-prof-${lg.id}`}
                      label="Language Proficiency"
                      value={lg.proficiency}
                      onChange={v =>
                        updateContent({
                          languages: content.languages.map((l, i) =>
                            i === idx ? { ...l, proficiency: v } : l
                          )
                        })
                      }
                      editing={editing}
                      customStyle={ts[`lang-prof-${lg.id}`]}
                      isSelected={activeTextSelection?.tkey === `lang-prof-${lg.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                  </li>
                ))}
              </ul>
              {editing && (
                <div className="item-edit-bar">
                  <button
                    type="button"
                    className="studio-mini-btn"
                    onClick={() =>
                      updateContent({
                        languages: [
                          ...content.languages,
                          { id: `lang-${Date.now()}`, language: 'Language', proficiency: 'Fluent' }
                        ]
                      })
                    }
                  >
                    + Add language
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (sec.type === 'contact') {
      const ct = content.contact;
      const updateCt = (patch: Partial<typeof ct>) => updateContent({ contact: { ...ct, ...patch } });

      return (
        <footer key={sec.id} className="end" id={sec.id} style={secStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <EditableText
              as="h2"
              className="display"
              tkey="contact-heading"
              label="Contact Heading"
              value={ct.heading}
              onChange={v => updateCt({ heading: v })}
              editing={editing}
              customStyle={ts['contact-heading']}
              isSelected={activeTextSelection?.tkey === 'contact-heading'}
              onSelectForStyle={setActiveTextSelection}
            />
            {renderSectionToolbar(sec)}
          </div>
          {editing ? (
            <EditableText
              as="span"
              className="mail"
              tkey="contact-email"
              label="Contact Email Address"
              value={ct.email}
              onChange={v => updateCt({ email: v })}
              editing={editing}
              customStyle={ts['contact-email']}
              isSelected={activeTextSelection?.tkey === 'contact-email'}
              onSelectForStyle={setActiveTextSelection}
            />
          ) : (
            <a
              className="mail"
              href={`mailto:${ct.email}`}
              data-tkey="contact-email"
              style={{
                ...(ts['contact-email']?.fontSizePct ? { fontSize: `${ts['contact-email'].fontSizePct}%` } : {}),
                ...(ts['contact-email']?.color ? { color: ts['contact-email'].color } : {})
              }}
            >
              {ct.email}
            </a>
          )}
          <dl>
            <div>
              <EditableText
                as="dt"
                tkey="contact-phone-lbl"
                label="Phone Label"
                value={ct.phoneLabel}
                onChange={v => updateCt({ phoneLabel: v })}
                editing={editing}
                customStyle={ts['contact-phone-lbl']}
                isSelected={activeTextSelection?.tkey === 'contact-phone-lbl'}
                onSelectForStyle={setActiveTextSelection}
              />
              <dd>
                <EditableText
                  as="a"
                  tkey="contact-phone-val"
                  label="Phone Number"
                  value={ct.phoneDisplay}
                  onChange={v => updateCt({ phoneDisplay: v, phoneHref: `tel:${v.replace(/\s+/g, '')}` })}
                  editing={editing}
                  customStyle={ts['contact-phone-val']}
                  isSelected={activeTextSelection?.tkey === 'contact-phone-val'}
                  onSelectForStyle={setActiveTextSelection}
                />
              </dd>
            </div>
            <div>
              <EditableText
                as="dt"
                tkey="contact-li-lbl"
                label="LinkedIn Label"
                value={ct.linkedinLabel}
                onChange={v => updateCt({ linkedinLabel: v })}
                editing={editing}
                customStyle={ts['contact-li-lbl']}
                isSelected={activeTextSelection?.tkey === 'contact-li-lbl'}
                onSelectForStyle={setActiveTextSelection}
              />
              <dd>
                <EditableText
                  as="a"
                  tkey="contact-li-val"
                  label="LinkedIn Display Text"
                  value={ct.linkedinDisplay}
                  onChange={v => updateCt({ linkedinDisplay: v })}
                  editing={editing}
                  customStyle={ts['contact-li-val']}
                  isSelected={activeTextSelection?.tkey === 'contact-li-val'}
                  onSelectForStyle={setActiveTextSelection}
                />
              </dd>
            </div>
            <div>
              <EditableText
                as="dt"
                tkey="contact-loc-lbl"
                label="Location Label"
                value={ct.locationLabel}
                onChange={v => updateCt({ locationLabel: v })}
                editing={editing}
                customStyle={ts['contact-loc-lbl']}
                isSelected={activeTextSelection?.tkey === 'contact-loc-lbl'}
                onSelectForStyle={setActiveTextSelection}
              />
              <EditableText
                as="dd"
                tkey="contact-loc-val"
                label="Location Value"
                value={ct.locationDisplay}
                onChange={v => updateCt({ locationDisplay: v })}
                editing={editing}
                customStyle={ts['contact-loc-val']}
                isSelected={activeTextSelection?.tkey === 'contact-loc-val'}
                onSelectForStyle={setActiveTextSelection}
              />
            </div>
          </dl>
          <EditableText
            as="p"
            className="legal"
            tkey="contact-legal"
            label="Footer Copyright"
            value={ct.copyright}
            onChange={v => updateCt({ copyright: v })}
            editing={editing}
            customStyle={ts['contact-legal']}
            isSelected={activeTextSelection?.tkey === 'contact-legal'}
            onSelectForStyle={setActiveTextSelection}
          />
        </footer>
      );
    }

    // Custom User-Created Section
    const customItems = sec.customItems || [];
    const addCustomCard = () => {
      updateSectionMeta(sec.id, {
        customItems: [
          ...customItems,
          {
            id: `citem-${Date.now()}`,
            kicker: '2026 · Highlight',
            title: 'New Custom Item',
            subtitle: 'Dubai, UAE',
            body: 'Click to edit this description, resize the text, or add an image.',
            tags: ['Robotics', 'AI']
          }
        ]
      });
    };

    return (
      <section key={sec.id} className="sec" id={sec.id} aria-labelledby={`h-${sec.id}`} style={secStyle}>
        <div className="sec-head">
          <div className="sec-head-copy">
            <EditableText
              as="h2"
              id={`h-${sec.id}`}
              className="display"
              tkey={`sec-title-${sec.id}`}
              label="Custom Section Heading"
              value={sec.title}
              onChange={v => updateSectionMeta(sec.id, { title: v })}
              editing={editing}
              customStyle={ts[`sec-title-${sec.id}`]}
              isSelected={activeTextSelection?.tkey === `sec-title-${sec.id}`}
              onSelectForStyle={setActiveTextSelection}
            />
            <EditableText
              as="p"
              className="lede"
              tkey={`sec-lede-${sec.id}`}
              label="Custom Section Subtitle"
              value={sec.lede}
              onChange={v => updateSectionMeta(sec.id, { lede: v })}
              editing={editing}
              customStyle={ts[`sec-lede-${sec.id}`]}
              isSelected={activeTextSelection?.tkey === `sec-lede-${sec.id}`}
              onSelectForStyle={setActiveTextSelection}
            />
          </div>
          {renderSectionToolbar(sec, {
            label: '+ Add Card',
            onClick: addCustomCard
          })}
        </div>

        <div className="proj-grid">
          {customItems.map((item, idx) => {
            const updateItem = (patch: Partial<typeof item>) => {
              updateSectionMeta(sec.id, {
                customItems: customItems.map((it, i) => (i === idx ? { ...it, ...patch } : it))
              });
            };
            return (
              <article key={item.id} className="proj-card">
                {(item.image || editing) && (
                  <div className="proj-visual" style={{ height: item.image ? '200px' : '84px' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.title} referrerPolicy="no-referrer" />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--muted)',
                          fontSize: '0.8125rem'
                        }}
                      >
                        Optional card image slot
                      </div>
                    )}
                    <div className="slot-tools">
                      <button
                        type="button"
                        onClick={() => triggerFilePick('customSectionItem', item.id, sec.id)}
                      >
                        {item.image ? 'Replace image' : 'Upload image'}
                      </button>
                      {item.image && (
                        <button type="button" onClick={() => updateItem({ image: undefined })}>
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <div className="proj-body">
                  <EditableText
                    as="span"
                    className="proj-kicker"
                    tkey={`citem-kick-${item.id}`}
                    label="Card Kicker"
                    value={item.kicker}
                    onChange={v => updateItem({ kicker: v })}
                    editing={editing}
                    customStyle={ts[`citem-kick-${item.id}`]}
                    isSelected={activeTextSelection?.tkey === `citem-kick-${item.id}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  <EditableText
                    as="h3"
                    tkey={`citem-title-${item.id}`}
                    label="Card Title"
                    value={item.title}
                    onChange={v => updateItem({ title: v })}
                    editing={editing}
                    customStyle={ts[`citem-title-${item.id}`]}
                    isSelected={activeTextSelection?.tkey === `citem-title-${item.id}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  <EditableText
                    as="p"
                    className="what"
                    tkey={`citem-body-${item.id}`}
                    label="Card Description"
                    value={item.body}
                    onChange={v => updateItem({ body: v })}
                    editing={editing}
                    customStyle={ts[`citem-body-${item.id}`]}
                    isSelected={activeTextSelection?.tkey === `citem-body-${item.id}`}
                    onSelectForStyle={setActiveTextSelection}
                  />
                  <div className="proj-meta">
                    <EditableText
                      as="span"
                      tkey={`citem-tags-${item.id}`}
                      label="Card Tags"
                      value={(item.tags || []).join(' · ')}
                      onChange={v =>
                        updateItem({
                          tags: v
                            .split(/[·,]/)
                            .map(s => s.trim())
                            .filter(Boolean)
                        })
                      }
                      editing={editing}
                      customStyle={ts[`citem-tags-${item.id}`]}
                      isSelected={activeTextSelection?.tkey === `citem-tags-${item.id}`}
                      onSelectForStyle={setActiveTextSelection}
                    />
                  </div>
                  {editing && (
                    <div className="item-edit-bar">
                      <button
                        type="button"
                        className="studio-mini-btn"
                        style={{ color: '#E11D48', marginLeft: 'auto' }}
                        onClick={() =>
                          updateSectionMeta(sec.id, {
                            customItems: customItems.filter((_, i) => i !== idx)
                          })
                        }
                      >
                        Delete card
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  const mainSections = visibleSections.filter(s => s.type !== 'contact');
  const contactSections = visibleSections.filter(s => s.type === 'contact');

  return (
    <div id="site">
      {/* Hidden SVG pattern used by SLAM telemetry maps and project schematics */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <pattern id="slam" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect className="a-grid" x="7.25" y="7.25" width="1.5" height="1.5" />
          </pattern>
        </defs>
      </svg>

      {/* Floating Selected Text Inspector Bar when a text element is clicked in Edit Mode */}
      {editing && activeTextSelection && (
        <SelectedTextInspectorBar
          selection={activeTextSelection}
          styleOverrides={content.styleOverrides}
          onUpdateTextStyle={handleUpdateTextStyle}
          onClose={() => setActiveTextSelection(null)}
        />
      )}

      {/* ============ HEADER (Strict 3-Zone Top Bar Contract) ============ */}
      <header className="site-head">
        {editing ? (
          <EditableText
            as="span"
            className="who"
            tkey="hero-brand"
            label="Top Bar Brand Name"
            value={content.hero.brandName}
            onChange={v => updateContent({ hero: { ...content.hero, brandName: v } })}
            editing={editing}
            customStyle={ts['hero-brand']}
            isSelected={activeTextSelection?.tkey === 'hero-brand'}
            onSelectForStyle={setActiveTextSelection}
          />
        ) : (
          <a
            className="who"
            href="#top"
            data-tkey="hero-brand"
            style={{
              ...(ts['hero-brand']?.fontSizePct ? { fontSize: `${ts['hero-brand'].fontSizePct}%` } : {}),
              ...(ts['hero-brand']?.color ? { color: ts['hero-brand'].color } : {})
            }}
          >
            {content.hero.brandName}
          </a>
        )}

        <button
          className="menu-btn"
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="site-nav"
          onClick={() => setMobileMenuOpen(o => !o)}
        >
          Menu
        </button>

        <nav
          className={`site-nav${mobileMenuOpen ? ' open' : ''}`}
          id="site-nav"
          aria-label="Sections"
          onClick={e => {
            if ((e.target as HTMLElement).closest('a')) setMobileMenuOpen(false);
          }}
        >
          {navSections.map((sec, idx) => (
            <a key={sec.id} href={`#${sec.id}`} className={activeNavIndex === idx ? 'here' : ''}>
              {sec.navLabel}
            </a>
          ))}
        </nav>

        {editing ? (
          <EditableText
            as="span"
            className="btn solid"
            tkey="hero-head-cta"
            label="Header CTA Button"
            value={content.hero.headerCtaText}
            onChange={v => updateContent({ hero: { ...content.hero, headerCtaText: v } })}
            editing={editing}
            customStyle={ts['hero-head-cta']}
            isSelected={activeTextSelection?.tkey === 'hero-head-cta'}
            onSelectForStyle={setActiveTextSelection}
          />
        ) : (
          <a
            className="btn solid"
            href={content.hero.headerCtaHref}
            data-tkey="hero-head-cta"
            style={{
              ...(ts['hero-head-cta']?.fontSizePct ? { fontSize: `${ts['hero-head-cta'].fontSizePct}%` } : {}),
              ...(ts['hero-head-cta']?.color ? { color: ts['hero-head-cta'].color } : {})
            }}
          >
            {content.hero.headerCtaText}
          </a>
        )}

        <div className="run" aria-hidden="true">
          <i ref={headerFillRef} />
          <b ref={headerBotRef} />
        </div>
      </header>

      <main>
        {/* ============ HERO ============ */}
        <HeroFloorSection
          palette={state.palette}
          theme={state.theme}
          hero={content.hero}
          onUpdateHero={patch => updateContent({ hero: { ...content.hero, ...patch } })}
          editing={editing}
          styleOverrides={content.styleOverrides}
          activeTextSelection={activeTextSelection}
          onSelectText={setActiveTextSelection}
        />

        {/* ============ DYNAMICALLY ORDERED MAIN SECTIONS ============ */}
        {mainSections.map(renderSection)}
      </main>

      {/* ============ CONTACT / FOOTER SECTION ============ */}
      {contactSections.map(renderSection)}

      {/* ============ ROBOT DEPLOYMENT LIGHTBOX & HARDWARE SPEC MODAL ============ */}
      {selectedDeployment && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-deploy-title"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedDeployment(null);
          }}
        >
          <div className="lightbox-dialog">
            <div className="lightbox-media">
              <img
                src={state.photos[selectedDeployment.id] || selectedDeployment.defaultPhoto}
                alt={`${selectedDeployment.title} at ${selectedDeployment.site}`}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="lightbox-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    {selectedDeployment.platformBadge}
                  </span>
                  <h3
                    id="modal-deploy-title"
                    className="display"
                    style={{ fontSize: '2.25rem', marginTop: '0.25rem' }}
                  >
                    {selectedDeployment.title}
                  </h3>
                  <p style={{ fontWeight: 650, marginTop: '0.25rem' }}>{selectedDeployment.site}</p>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ minHeight: '38px', padding: '0 0.85rem' }}
                  onClick={() => setSelectedDeployment(null)}
                >
                  Close
                </button>
              </div>

              <p style={{ color: 'var(--muted)' }}>{selectedDeployment.note}</p>

              <dl className="lightbox-specs">
                {(
                  [
                    ['platform', 'Hardware Platform'],
                    ['navigation', 'Navigation & Sensors'],
                    ['capacityOrMode', 'Capacity & Modes'],
                    ['efficiencyOrRuntime', 'Efficiency & Runtime'],
                    ['partnerScope', 'Engineering Scope'],
                    ['region', 'Deployment Site']
                  ] as const
                ).map(([specKey, specLabel]) => (
                  <div key={specKey}>
                    <dt>{specLabel}</dt>
                    {editing ? (
                      <input
                        type="text"
                        className="studio-input"
                        value={selectedDeployment.specs[specKey]}
                        onChange={e => {
                          const nextVal = e.target.value;
                          const nextDeploy: DeploymentCardItem = {
                            ...selectedDeployment,
                            specs: { ...selectedDeployment.specs, [specKey]: nextVal }
                          };
                          setSelectedDeployment(nextDeploy);
                          updateContent({
                            deployments: content.deployments.map(it =>
                              !isGroupEntry(it) && it.id === selectedDeployment.id ? nextDeploy : it
                            )
                          });
                        }}
                      />
                    ) : (
                      <dd>{selectedDeployment.specs[specKey]}</dd>
                    )}
                  </div>
                ))}
              </dl>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ minHeight: '40px', padding: '0 1rem', fontSize: '0.875rem' }}
                  onClick={() => triggerFilePick('photos', selectedDeployment.id)}
                >
                  Upload your own field photo
                </button>
                {state.photos[selectedDeployment.id] && (
                  <button
                    type="button"
                    className="btn"
                    style={{ minHeight: '40px', padding: '0 1rem', fontSize: '0.875rem' }}
                    onClick={() => clearCustomMedia('photos', selectedDeployment.id)}
                  >
                    Restore default photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ PROJECT ARCHITECTURE MODAL ============ */}
      {selectedProject && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-proj-title"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedProject(null);
          }}
        >
          <div className="lightbox-dialog">
            <div className="lightbox-media" style={{ padding: '16px' }}>
              {state.projectPhotos[selectedProject.id] ? (
                <img
                  src={state.projectPhotos[selectedProject.id]}
                  alt={selectedProject.title}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}
                  dangerouslySetInnerHTML={{
                    __html: PROJECT_SCHEMATICS_SVG[selectedProject.id] || PROJECT_SCHEMATICS_SVG['fleet-telemetry']
                  }}
                />
              )}
            </div>
            <div className="lightbox-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                    {selectedProject.where} · {selectedProject.outcomeMetric}
                  </span>
                  <h3
                    id="modal-proj-title"
                    className="display"
                    style={{ fontSize: '2.15rem', marginTop: '0.25rem' }}
                  >
                    {selectedProject.title}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ minHeight: '38px', padding: '0 0.85rem' }}
                  onClick={() => setSelectedProject(null)}
                >
                  Close
                </button>
              </div>

              <p>{selectedProject.what}</p>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Architecture &amp; Delivery Highlights
                </h4>
                <ul className="xp-body" style={{ marginLeft: 0, paddingBottom: '0.5rem' }}>
                  {selectedProject.architectureNotes.map((note, idx) => (
                    <li key={idx}>
                      {editing ? (
                        <input
                          type="text"
                          className="studio-input"
                          value={note}
                          onChange={e => {
                            const nextNotes = [...selectedProject.architectureNotes];
                            nextNotes[idx] = e.target.value;
                            const nextProj = { ...selectedProject, architectureNotes: nextNotes };
                            setSelectedProject(nextProj);
                            updateContent({
                              projects: content.projects.map(p => (p.id === nextProj.id ? nextProj : p))
                            });
                          }}
                        />
                      ) : (
                        note
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ fontSize: '0.8438rem', color: 'var(--muted)' }}>
                Stack: {selectedProject.tags.join(' · ')}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: 'auto' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ minHeight: '40px', padding: '0 1rem', fontSize: '0.875rem' }}
                  onClick={() => triggerFilePick('projectPhotos', selectedProject.id)}
                >
                  Upload custom project screenshot
                </button>
                {state.projectPhotos[selectedProject.id] && (
                  <button
                    type="button"
                    className="btn"
                    style={{ minHeight: '40px', padding: '0 1rem', fontSize: '0.875rem' }}
                    onClick={() => clearCustomMedia('projectPhotos', selectedProject.id)}
                  >
                    Restore architecture diagram
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ STUDIO MODALS (Colors/Sizes, Section Manager, LinkedIn & SEO) ============ */}
      {showColorsModal && (
        <ColorsAndTypographyModal
          styleOverrides={content.styleOverrides}
          onUpdateStyleOverrides={next => updateContent({ styleOverrides: next })}
          onClose={() => setShowColorsModal(false)}
        />
      )}

      {showSectionsModal && (
        <SectionManagerModal
          sections={content.sections}
          onUpdateSections={next => updateContent({ sections: next })}
          onClose={() => setShowSectionsModal(false)}
        />
      )}

      {showSeoModal && (
        <LinkedInSeoModal
          state={state}
          onUpdateSeo={next => updateContent({ seo: next })}
          onExportHtml={handleExportHtml}
          exporting={exporting}
          onClose={() => setShowSeoModal(false)}
        />
      )}

      {showGitHubModal && (
        <GitHubPublishModal
          state={state}
          onExportHtml={handleExportHtml}
          exporting={exporting}
          onClose={() => setShowGitHubModal(false)}
        />
      )}

      {/* ============ OWNER STUDIO & GITHUB EXPORT DOCK ============ */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
      />
      <div className="edit-bar" role="region" aria-label="Portfolio customization and GitHub export">
        <button
          type="button"
          aria-pressed={editing}
          onClick={() => {
            setEditing(prev => !prev);
            setStatusNote(
              !editing
                ? 'Edit Mode ON: Click any text to edit/resize/color, or use section toolbars to add/reorder.'
                : ''
            );
          }}
        >
          {editing ? '✓ Finish editing' : 'Edit texts, items & photos'}
        </button>

        <button type="button" onClick={() => setShowSectionsModal(true)}>
          Sections &amp; order
        </button>

        <button type="button" onClick={() => setShowColorsModal(true)}>
          Colors &amp; sizes
        </button>

        {editing &&
          PALETTES.map(([k, label, color]) => (
            <button
              key={k}
              type="button"
              aria-pressed={state.palette === k}
              onClick={() => {
                setState(prev => ({ ...prev, palette: k }));
                setStatusNote(`Palette set to ${label}.`);
              }}
            >
              <i style={{ background: color }} />
              {label}
            </button>
          ))}

        {editing && (
          <button
            type="button"
            onClick={() =>
              setState(prev => ({
                ...prev,
                theme: prev.theme === 'dark' ? 'light' : 'dark'
              }))
            }
          >
            {state.theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        )}

        <button type="button" onClick={() => setShowSeoModal(true)}>
          LinkedIn &amp; SEO
        </button>

        <button type="button" onClick={() => setShowGitHubModal(true)}>
          Publish to GitHub
        </button>

        <button type="button" className="primary" onClick={handleExportHtml} disabled={exporting}>
          {exporting ? 'Packaging WebP...' : 'Export index.html'}
        </button>

        {statusNote && (
          <span className="msg" role="status">
            {statusNote}
          </span>
        )}
      </div>
    </div>
  );
}
