import React, { useEffect, useRef, useState } from 'react';
import {
  FullPortfolioContent,
  SectionConfig,
  StyleOverrides,
  SeoConfig,
  DEFAULT_STYLE_OVERRIDES
} from '../data/portfolioData';
import {
  PortfolioCustomState,
  ExportBudgetReport,
  LINKEDIN_MAX_BYTES,
  SAFE_CEILING_BYTES,
  GitHubPublishConfig,
  GitHubPublishResult,
  generateStandaloneHtmlAndReport,
  renderOgBannerToCanvas,
  downloadOgBannerJpg,
  publishPortfolioToGitHub
} from '../utils/exportStaticHtml';
import { ActiveTextSelection } from './EditableText';

interface SelectedTextBarProps {
  selection: ActiveTextSelection;
  styleOverrides: StyleOverrides;
  onUpdateTextStyle: (tkey: string, patch: { fontSizePct?: number; color?: string } | null) => void;
  onClose: () => void;
}

export const SelectedTextInspectorBar: React.FC<SelectedTextBarProps> = ({
  selection,
  styleOverrides,
  onUpdateTextStyle,
  onClose
}) => {
  const current = styleOverrides.textStyles?.[selection.tkey] || {};
  const sizePct = current.fontSizePct ?? 100;
  const colorVal = current.color ?? '';

  const swatches = ['#101010', '#FFFFFF', '#FFD400', '#0047BB', '#059669', '#E11D48', '#595955'];

  return (
    <div className="text-inspector-bar" role="region" aria-label="Selected text formatting">
      <div className="text-inspector-row">
        <strong className="text-inspector-title">Editing: {selection.label}</strong>
        <input
          type="text"
          className="studio-input"
          style={{ flex: '1 1 200px', minWidth: '160px' }}
          value={selection.value}
          onChange={e => selection.onChange(e.target.value)}
          aria-label="Selected text content"
        />
        <div className="text-inspector-controls">
          <label className="studio-inline-label">
            <span>Size: {sizePct}%</span>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={sizePct}
              onChange={e =>
                onUpdateTextStyle(selection.tkey, { ...current, fontSizePct: Number(e.target.value) })
              }
            />
          </label>
          <button
            type="button"
            className="studio-mini-btn"
            onClick={() =>
              onUpdateTextStyle(selection.tkey, { ...current, fontSizePct: Math.max(50, sizePct - 10) })
            }
          >
            A-
          </button>
          <button
            type="button"
            className="studio-mini-btn"
            onClick={() =>
              onUpdateTextStyle(selection.tkey, { ...current, fontSizePct: Math.min(200, sizePct + 10) })
            }
          >
            A+
          </button>

          <label className="studio-inline-label" title="Text color">
            <span>Color</span>
            <input
              type="color"
              value={colorVal || '#101010'}
              onChange={e => onUpdateTextStyle(selection.tkey, { ...current, color: e.target.value })}
              style={{ width: '28px', height: '28px', padding: 0, border: 'none', cursor: 'pointer' }}
            />
          </label>

          <div className="swatch-row">
            {swatches.map(hex => (
              <button
                key={hex}
                type="button"
                className="swatch-dot"
                style={{ background: hex }}
                title={`Set text color to ${hex}`}
                onClick={() => onUpdateTextStyle(selection.tkey, { ...current, color: hex })}
              />
            ))}
          </div>

          <button
            type="button"
            className="studio-mini-btn"
            onClick={() => onUpdateTextStyle(selection.tkey, null)}
          >
            Reset style
          </button>
          <button type="button" className="studio-mini-btn" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

interface ColorsAndTypographyModalProps {
  styleOverrides: StyleOverrides;
  onUpdateStyleOverrides: (next: StyleOverrides) => void;
  onClose: () => void;
}

export const ColorsAndTypographyModal: React.FC<ColorsAndTypographyModalProps> = ({
  styleOverrides,
  onUpdateStyleOverrides,
  onClose
}) => {
  const cc = styleOverrides.customColors || {};

  const updateColor = (key: keyof StyleOverrides['customColors'], val: string) => {
    onUpdateStyleOverrides({
      ...styleOverrides,
      customColors: {
        ...cc,
        [key]: val || undefined
      }
    });
  };

  const colorFields: [keyof StyleOverrides['customColors'], string, string][] = [
    ['heroBg', 'Hero Floor Background', '#FFD400'],
    ['heroInk', 'Hero Main Text & LiDAR Rays', '#101010'],
    ['heroMuted', 'Hero Secondary Pitch Text', '#3A3405'],
    ['botColor', 'Autonomous Robot Chassis', '#101010'],
    ['beaconColor', 'Robot LiDAR Beacon Dot', '#FFFFFF'],
    ['pageBg', 'Page Canvas Background', '#FFFFFF'],
    ['panelBg', 'Card & Surface Background', '#F3F3F0'],
    ['inkColor', 'Primary Headings & Body Text', '#101010'],
    ['mutedColor', 'Muted Descriptions & Captions', '#595955'],
    ['lineColor', 'Grid Hairlines & Card Borders', '#D8D8D3'],
    ['hiBg', 'Contact Footer Band Background', '#FFD400'],
    ['hiInk', 'Contact Footer Band Text', '#101010'],
    ['markColor', 'SLAM Route & Bullet Accent Marks', '#101010']
  ];

  const scaleFields: [
    'heroTitleScale' | 'sectionHeadingScale' | 'cardTitleScale' | 'kpiNumberScale' | 'bodyTextScale',
    string
  ][] = [
    ['heroTitleScale', 'Hero Giant Name Size'],
    ['sectionHeadingScale', 'Section Headings (h2) Size'],
    ['cardTitleScale', 'Robot, Project & Role Titles Size'],
    ['kpiNumberScale', 'KPI Figures (150+, AED 15M+) Size'],
    ['bodyTextScale', 'Global Body & Description Text Size']
  ];

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-style-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lightbox-dialog" style={{ gridTemplateColumns: '1fr', maxWidth: '860px' }}>
        <div className="lightbox-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Global &amp; Granular Theme Controls
              </span>
              <h3 id="modal-style-title" className="display" style={{ fontSize: '2.2rem', marginTop: '0.25rem' }}>
                Colors &amp; Text Sizing Studio
              </h3>
            </div>
            <button
              type="button"
              className="btn"
              style={{ minHeight: '38px', padding: '0 0.85rem' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Adjust global text scales below, or pick custom colors for any area of the portfolio. Tip: When Edit Mode
            is active, you can also click any individual text on the page to resize or color just that element.
          </p>

          {/* Typography Scales */}
          <div className="studio-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Typography &amp; Text Size Scales</h4>
              <button
                type="button"
                className="studio-mini-btn"
                onClick={() =>
                  onUpdateStyleOverrides({
                    ...styleOverrides,
                    heroTitleScale: 100,
                    sectionHeadingScale: 100,
                    cardTitleScale: 100,
                    kpiNumberScale: 100,
                    bodyTextScale: 100,
                    textStyles: {}
                  })
                }
              >
                Reset all text sizes
              </button>
            </div>
            <div className="studio-grid-2">
              {scaleFields.map(([key, label]) => {
                const val = styleOverrides[key] || 100;
                return (
                  <label key={key} className="studio-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600 }}>
                      <span>{label}</span>
                      <span className="tnum">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min={55}
                      max={160}
                      step={5}
                      value={val}
                      onChange={e =>
                        onUpdateStyleOverrides({
                          ...styleOverrides,
                          [key]: Number(e.target.value)
                        })
                      }
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Granular Color Pickers */}
          <div className="studio-section-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Granular Surface &amp; Text Colors</h4>
              <button
                type="button"
                className="studio-mini-btn"
                onClick={() =>
                  onUpdateStyleOverrides({
                    ...styleOverrides,
                    customColors: {}
                  })
                }
              >
                Reset custom colors to palette
              </button>
            </div>

            <div className="studio-grid-3">
              {colorFields.map(([key, label, fallback]) => {
                const currentVal = cc[key] || '';
                return (
                  <div key={key} className="studio-color-item">
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.3rem' }}>
                      <input
                        type="color"
                        value={currentVal || fallback}
                        onChange={e => updateColor(key, e.target.value)}
                        style={{ width: '34px', height: '34px', padding: 0, border: '1px solid var(--line)', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        className="studio-input"
                        placeholder={fallback}
                        value={currentVal}
                        onChange={e => updateColor(key, e.target.value)}
                        style={{ fontSize: '0.8125rem', padding: '0.35rem 0.5rem' }}
                      />
                      {currentVal && (
                        <button
                          type="button"
                          className="studio-mini-btn"
                          onClick={() => updateColor(key, '')}
                          title="Reset this color"
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn"
              onClick={() => onUpdateStyleOverrides(DEFAULT_STYLE_OVERRIDES)}
            >
              Reset all styles
            </button>
            <button type="button" className="btn solid" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SectionManagerModalProps {
  sections: SectionConfig[];
  onUpdateSections: (next: SectionConfig[]) => void;
  onClose: () => void;
}

export const SectionManagerModal: React.FC<SectionManagerModalProps> = ({
  sections,
  onUpdateSections,
  onClose
}) => {
  const [newSecTitle, setNewSecTitle] = useState('');
  const [newSecNav, setNewSecNav] = useState('');
  const [newSecLede, setNewSecLede] = useState('');

  const moveSection = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    onUpdateSections(copy);
  };

  const updateSec = (id: string, patch: Partial<SectionConfig>) => {
    onUpdateSections(sections.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteSection = (id: string) => {
    onUpdateSections(sections.filter(s => s.id !== id));
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecTitle.trim()) return;
    const slug =
      'custom-' +
      newSecTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString().slice(-3);

    const newSection: SectionConfig = {
      id: slug,
      type: 'custom',
      title: newSecTitle.trim(),
      navLabel: (newSecNav.trim() || newSecTitle.trim()).slice(0, 22),
      showInNav: true,
      visible: true,
      lede: newSecLede.trim() || 'Key milestones, publications and highlights.',
      customLayout: 'cards',
      customItems: [
        {
          id: `item-${Date.now()}`,
          kicker: '2026 · Highlight',
          title: 'New milestone or achievement',
          subtitle: 'Dubai, UAE',
          body: 'Click this text in Edit Mode to customize the description, resize the text, or upload a photo.',
          tags: ['Robotics', 'Enterprise AI']
        }
      ]
    };

    // Insert right before Contact footer if Contact exists
    const contactIdx = sections.findIndex(s => s.type === 'contact');
    if (contactIdx >= 0) {
      const copy = [...sections];
      copy.splice(contactIdx, 0, newSection);
      onUpdateSections(copy);
    } else {
      onUpdateSections([...sections, newSection]);
    }
    setNewSecTitle('');
    setNewSecNav('');
    setNewSecLede('');
  };

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sec-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lightbox-dialog" style={{ gridTemplateColumns: '1fr', maxWidth: '860px' }}>
        <div className="lightbox-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Reorder, Add, Hide &amp; Style Sections
              </span>
              <h3 id="modal-sec-title" className="display" style={{ fontSize: '2.2rem', marginTop: '0.25rem' }}>
                Manage &amp; Reorder Sections
              </h3>
            </div>
            <button
              type="button"
              className="btn"
              style={{ minHeight: '38px', padding: '0 0.85rem' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
            Use <strong>↑</strong> and <strong>↓</strong> to change the order of sections on the page and in the top
            navigation bar. You can also change individual section background/text colors, hide sections, or add new
            custom sections.
          </p>

          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {sections.map((sec, idx) => (
              <div key={sec.id} className="studio-section-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="studio-mini-btn"
                    disabled={idx === 0}
                    onClick={() => moveSection(idx, -1)}
                    title="Move section up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="studio-mini-btn"
                    disabled={idx === sections.length - 1}
                    onClick={() => moveSection(idx, 1)}
                    title="Move section down"
                  >
                    ↓
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.35rem', flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="studio-input"
                      value={sec.title}
                      onChange={e => updateSec(sec.id, { title: e.target.value })}
                      placeholder="Section Heading"
                      style={{ fontWeight: 700, width: '190px' }}
                    />
                    <input
                      type="text"
                      className="studio-input"
                      value={sec.navLabel}
                      onChange={e => updateSec(sec.id, { navLabel: e.target.value })}
                      placeholder="Nav Link Label"
                      style={{ width: '130px', fontSize: '0.8125rem' }}
                    />
                    <label className="studio-inline-label" style={{ fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={sec.visible}
                        onChange={e => updateSec(sec.id, { visible: e.target.checked })}
                      />
                      <span>Visible</span>
                    </label>
                    <label className="studio-inline-label" style={{ fontSize: '0.8125rem' }}>
                      <input
                        type="checkbox"
                        checked={sec.showInNav}
                        onChange={e => updateSec(sec.id, { showInNav: e.target.checked })}
                      />
                      <span>In Top Nav</span>
                    </label>
                    <label className="studio-inline-label" style={{ fontSize: '0.8125rem' }} title="Custom section background color">
                      <span>Bg</span>
                      <input
                        type="color"
                        value={sec.bgColorOverride || '#FFFFFF'}
                        onChange={e => updateSec(sec.id, { bgColorOverride: e.target.value })}
                        style={{ width: '24px', height: '24px', padding: 0, border: '1px solid var(--line)' }}
                      />
                    </label>
                    <label className="studio-inline-label" style={{ fontSize: '0.8125rem' }} title="Custom section text color">
                      <span>Text</span>
                      <input
                        type="color"
                        value={sec.textColorOverride || '#101010'}
                        onChange={e => updateSec(sec.id, { textColorOverride: e.target.value })}
                        style={{ width: '24px', height: '24px', padding: 0, border: '1px solid var(--line)' }}
                      />
                    </label>
                    {(sec.bgColorOverride || sec.textColorOverride) && (
                      <button
                        type="button"
                        className="studio-mini-btn"
                        onClick={() => updateSec(sec.id, { bgColorOverride: undefined, textColorOverride: undefined })}
                      >
                        Reset colors
                      </button>
                    )}
                    <button
                      type="button"
                      className="studio-mini-btn"
                      style={{ marginLeft: 'auto', color: '#E11D48' }}
                      onClick={() => deleteSection(sec.id)}
                      title="Remove this section"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Custom Section Form */}
          <form onSubmit={handleAddCustomSection} className="studio-section-box">
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.65rem' }}>
              + Add a New Custom Section
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <input
                type="text"
                className="studio-input"
                placeholder="Section title (e.g., Awards & Speaking)"
                value={newSecTitle}
                onChange={e => setNewSecTitle(e.target.value)}
                required
                style={{ flex: '1 1 220px' }}
              />
              <input
                type="text"
                className="studio-input"
                placeholder="Top nav label (e.g., Awards)"
                value={newSecNav}
                onChange={e => setNewSecNav(e.target.value)}
                style={{ flex: '0 1 150px' }}
              />
              <input
                type="text"
                className="studio-input"
                placeholder="Optional section subtitle / lede"
                value={newSecLede}
                onChange={e => setNewSecLede(e.target.value)}
                style={{ flex: '1 1 260px' }}
              />
              <button type="submit" className="btn solid" style={{ minHeight: '40px', padding: '0 1rem' }}>
                + Create section
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface LinkedInSeoModalProps {
  state: PortfolioCustomState;
  onUpdateSeo: (next: SeoConfig) => void;
  onExportHtml: () => void;
  exporting: boolean;
  onClose: () => void;
}

export const LinkedInSeoModal: React.FC<LinkedInSeoModalProps> = ({
  state,
  onUpdateSeo,
  onExportHtml,
  exporting,
  onClose
}) => {
  const seo = state.content.seo;
  const bannerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [budget, setBudget] = useState<ExportBudgetReport | null>(null);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (bannerCanvasRef.current) {
      renderOgBannerToCanvas(bannerCanvasRef.current, state);
    }
  }, [state, seo]);

  useEffect(() => {
    let active = true;
    setComputing(true);
    generateStandaloneHtmlAndReport(state)
      .then(({ report }) => {
        if (active) {
          setBudget(report);
          setComputing(false);
        }
      })
      .catch(() => {
        if (active) setComputing(false);
      });
    return () => {
      active = false;
    };
  }, [state]);

  const formatKB = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
  const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-seo-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lightbox-dialog" style={{ gridTemplateColumns: '1fr', maxWidth: '940px' }}>
        <div className="lightbox-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                LinkedIn 3,145,728 Bytes Crawler Guardrail · OpenGraph · Twitter Cards · Schema.org JSON-LD
              </span>
              <h3 id="modal-seo-title" className="display" style={{ fontSize: '2.2rem', marginTop: '0.25rem' }}>
                LinkedIn &amp; SEO Crawler Inspector
              </h3>
            </div>
            <button
              type="button"
              className="btn"
              style={{ minHeight: '38px', padding: '0 0.85rem' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {/* Live Byte-Size Budget Meter */}
          <div className="studio-section-box">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                LinkedInBot 3.00 MB (3,145,728 Bytes) Live Budget Check
              </h4>
              {budget ? (
                <span
                  className="tnum"
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: budget.withinLinkedInLimit ? '#059669' : '#E11D48'
                  }}
                >
                  {formatKB(budget.totalBytes)} ({formatMB(budget.totalBytes)}) / 3.00 MB Limit —{' '}
                  {budget.withinLinkedInLimit ? 'PASS (LinkedIn Ready)' : 'OVER LIMIT'}
                </span>
              ) : (
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                  {computing ? 'Calculating deduplicated WebP pool...' : ''}
                </span>
              )}
            </div>

            {budget && (
              <>
                <div
                  style={{
                    height: '10px',
                    background: 'var(--line)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginTop: '0.6rem'
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, budget.percentOfLinkedInLimit)}%`,
                      height: '100%',
                      background: budget.withinSafeCeiling ? '#059669' : '#D97706'
                    }}
                  />
                </div>
                <div className="studio-grid-4" style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Top-of-&lt;head&gt; Meta + JSON-LD</span>
                    <strong className="tnum">{formatKB(budget.headMetaBytes)} (&lt; 2 KB target)</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Semantic HTML &amp; CSS</span>
                    <strong className="tnum">{formatKB(budget.htmlAndCssBytes)}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>Deduplicated WebP Media Pool</span>
                    <strong className="tnum">
                      {formatKB(budget.mediaPoolBytes)} ({budget.uniqueImages} unique / {budget.totalReferences} cards)
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block' }}>2.35 MB Guardrail Ceiling</span>
                    <strong className="tnum">{formatMB(SAFE_CEILING_BYTES)} Max</strong>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 1200x630 OG Banner Preview + Download */}
          <div className="studio-grid-2" style={{ alignItems: 'start' }}>
            <div className="studio-section-box">
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                Social Share Banner Preview (1200×630 og-card.jpg)
              </h4>
              <canvas
                ref={bannerCanvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '1200 / 630',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  display: 'block'
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn solid"
                  style={{ minHeight: '40px', padding: '0 1rem', fontSize: '0.875rem' }}
                  onClick={() => downloadOgBannerJpg(state)}
                >
                  Download og-card.jpg (1200×630)
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ minHeight: '40px', padding: '0 1rem', fontSize: '0.875rem' }}
                  onClick={onExportHtml}
                  disabled={exporting}
                >
                  {exporting ? 'Packaging...' : 'Export index.html (< 1 MB)'}
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Commit both <code>index.html</code> and <code>og-card.jpg</code> to the root of your{' '}
                <code>sadekmefti.github.io</code> repository so LinkedIn, WhatsApp, and X display your 1200×630 banner.
              </p>
            </div>

            {/* OpenGraph & JSON-LD Fields Editor */}
            <div className="studio-section-box" style={{ display: 'grid', gap: '0.65rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                Edit OpenGraph, Twitter &amp; Schema.org Metadata
              </h4>
              <label className="studio-field">
                <span>Page &amp; OpenGraph Title (og:title)</span>
                <input
                  type="text"
                  className="studio-input"
                  value={seo.siteTitle}
                  onChange={e => onUpdateSeo({ ...seo, siteTitle: e.target.value })}
                />
              </label>
              <label className="studio-field">
                <span>Meta &amp; OpenGraph Description (og:description)</span>
                <textarea
                  className="studio-input"
                  rows={2}
                  value={seo.metaDescription}
                  onChange={e => onUpdateSeo({ ...seo, metaDescription: e.target.value })}
                />
              </label>
              <div className="studio-grid-2">
                <label className="studio-field">
                  <span>Canonical Portfolio URL (og:url)</span>
                  <input
                    type="text"
                    className="studio-input"
                    value={seo.canonicalUrl}
                    onChange={e => onUpdateSeo({ ...seo, canonicalUrl: e.target.value })}
                  />
                </label>
                <label className="studio-field">
                  <span>Social Image URL / Path (og:image)</span>
                  <input
                    type="text"
                    className="studio-input"
                    value={seo.ogImageUrl}
                    onChange={e => onUpdateSeo({ ...seo, ogImageUrl: e.target.value })}
                  />
                </label>
              </div>
              <div className="studio-grid-2">
                <label className="studio-field">
                  <span>Banner Top Kicker</span>
                  <input
                    type="text"
                    className="studio-input"
                    value={seo.ogBannerKicker}
                    onChange={e => onUpdateSeo({ ...seo, ogBannerKicker: e.target.value })}
                  />
                </label>
                <label className="studio-field">
                  <span>Banner Headline</span>
                  <input
                    type="text"
                    className="studio-input"
                    value={seo.ogBannerHeadline}
                    onChange={e => onUpdateSeo({ ...seo, ogBannerHeadline: e.target.value })}
                  />
                </label>
              </div>
              <label className="studio-field">
                <span>Banner Subtitle &amp; Key Proof</span>
                <input
                  type="text"
                  className="studio-input"
                  value={seo.ogBannerSubline}
                  onChange={e => onUpdateSeo({ ...seo, ogBannerSubline: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GH_CONFIG_STORAGE_KEY = 'sadek_portfolio_gh_publish_config_v1';

interface GitHubPublishModalProps {
  state: PortfolioCustomState;
  onExportHtml: () => void;
  exporting: boolean;
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({
  state,
  onExportHtml,
  exporting,
  onClose
}) => {
  const [config, setConfig] = useState<GitHubPublishConfig>(() => {
    try {
      const saved = localStorage.getItem(GH_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          owner: parsed.owner || 'sadek-mefti',
          repo: parsed.repo || 'Portfolio',
          branch: parsed.branch || 'main',
          targetFolder: parsed.targetFolder || 'published',
          token: parsed.token || '',
          commitMessage: ''
        };
      }
    } catch {
      // ignore
    }
    return {
      owner: 'sadek-mefti',
      repo: 'Portfolio',
      branch: 'main',
      targetFolder: 'published',
      token: '',
      commitMessage: ''
    };
  });

  const [publishing, setPublishing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<GitHubPublishResult | null>(null);

  const updateConfig = (patch: Partial<GitHubPublishConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(
          GH_CONFIG_STORAGE_KEY,
          JSON.stringify({
            owner: next.owner,
            repo: next.repo,
            branch: next.branch,
            targetFolder: next.targetFolder,
            token: next.token
          })
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResult(null);
    setPublishing(true);
    try {
      const res = await publishPortfolioToGitHub(state, config, step => setProgressMsg(step));
      setResult(res);
      setProgressMsg('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setProgressMsg('');
    } finally {
      setPublishing(false);
    }
  };

  const isUserSite = config.repo.trim().toLowerCase() === `${config.owner.trim().toLowerCase()}.github.io`;
  const publicBaseUrl = isUserSite
    ? `https://${config.owner.trim() || 'sadek-mefti'}.github.io/`
    : `https://${config.owner.trim() || 'sadek-mefti'}.github.io/${config.repo.trim() || 'Portfolio'}/`;
  const studioUrl = `${publicBaseUrl}studio/`;

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-gh-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lightbox-dialog" style={{ gridTemplateColumns: '1fr', maxWidth: '880px' }}>
        <div className="lightbox-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                Dual GitHub Hosting · Public Portfolio + Online Studio Editor
              </span>
              <h3 id="modal-gh-title" className="display" style={{ fontSize: '2.2rem', marginTop: '0.25rem' }}>
                Publish to GitHub &amp; GitHub Pages
              </h3>
            </div>
            <button
              type="button"
              className="btn"
              style={{ minHeight: '38px', padding: '0 0.85rem' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {/* Dual URL Architecture Summary */}
          <div className="studio-section-box" style={{ display: 'grid', gap: '0.6rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>
              How Dual Hosting Works on Your Repository ({config.owner}/{config.repo})
            </h4>
            <div className="studio-grid-2" style={{ fontSize: '0.8438rem' }}>
              <div style={{ padding: '0.65rem 0.8rem', borderRadius: '6px', background: 'var(--page)', border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>1. Public Portfolio (LinkedIn &amp; Recruiters)</strong>
                <code style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{publicBaseUrl}</code>
                <p style={{ color: 'var(--muted)', marginTop: '0.3rem', fontSize: '0.78rem' }}>
                  Serves your pre-rendered <code>index.html</code> (&lt; 3 MB WebP pool) + <code>og-card.jpg</code> so LinkedInBot, WhatsApp, and X scrape your card immediately.
                </p>
              </div>
              <div style={{ padding: '0.65rem 0.8rem', borderRadius: '6px', background: 'var(--page)', border: '1px solid var(--line)' }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>2. Online Studio Editor (For You)</strong>
                <code style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{studioUrl}</code>
                <p style={{ color: 'var(--muted)', marginTop: '0.3rem', fontSize: '0.78rem' }}>
                  Built automatically by <code>.github/workflows/deploy.yml</code> so you can open this full editor in your browser from anywhere and publish updates.
                </p>
              </div>
            </div>
          </div>

          {/* 1-Click Direct GitHub API Publisher */}
          <form onSubmit={handlePublish} className="studio-section-box" style={{ display: 'grid', gap: '0.75rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              1-Click Direct Publish to GitHub Repository
            </h4>
            <div className="studio-grid-3">
              <label className="studio-field">
                <span>GitHub Username / Owner</span>
                <input
                  type="text"
                  className="studio-input"
                  value={config.owner}
                  onChange={e => updateConfig({ owner: e.target.value })}
                  placeholder="sadek-mefti"
                  required
                />
              </label>
              <label className="studio-field">
                <span>Repository Name</span>
                <input
                  type="text"
                  className="studio-input"
                  value={config.repo}
                  onChange={e => updateConfig({ repo: e.target.value })}
                  placeholder="Portfolio"
                  required
                />
              </label>
              <label className="studio-field">
                <span>Branch</span>
                <input
                  type="text"
                  className="studio-input"
                  value={config.branch}
                  onChange={e => updateConfig({ branch: e.target.value })}
                  placeholder="main"
                  required
                />
              </label>
            </div>

            <div className="studio-grid-2">
              <label className="studio-field">
                <span>Deployment Mode / Target Folder</span>
                <select
                  className="studio-input"
                  value={config.targetFolder}
                  onChange={e =>
                    updateConfig({ targetFolder: e.target.value as GitHubPublishConfig['targetFolder'] })
                  }
                >
                  <option value="published">
                    Dual Mode: published/index.html + /studio/ via GitHub Actions (Recommended)
                  </option>
                  <option value="root">
                    Branch Root: index.html + og-card.jpg at root (e.g., gh-pages branch)
                  </option>
                  <option value="docs">
                    /docs Folder: docs/index.html + docs/og-card.jpg (Deploy from /docs)
                  </option>
                </select>
              </label>

              <label className="studio-field">
                <span>GitHub Personal Access Token (repo contents write permission)</span>
                <input
                  type="password"
                  className="studio-input"
                  value={config.token}
                  onChange={e => updateConfig({ token: e.target.value })}
                  placeholder="ghp_... or github_pat_..."
                  required
                />
              </label>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              Your token is stored only in your own browser&apos;s localStorage and sent directly to{' '}
              <code>api.github.com</code> to commit <code>index.html</code> and <code>og-card.jpg</code>. (Create one at
              GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens with{' '}
              <strong>Contents: Read and write</strong> on <code>{config.repo || 'Portfolio'}</code>).
            </p>

            {progressMsg && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  background: 'var(--page)',
                  border: '1px solid var(--line)',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                {progressMsg}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid #E11D48',
                  color: '#E11D48',
                  fontSize: '0.8438rem'
                }}
              >
                {errorMsg}
              </div>
            )}

            {result && (
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '6px',
                  background: 'rgba(5, 150, 105, 0.12)',
                  border: '1px solid #059669',
                  fontSize: '0.875rem'
                }}
              >
                <strong style={{ color: '#059669', display: 'block' }}>
                  Published to {config.owner}/{config.repo} ({(result.totalBytes / 1024).toFixed(0)} KB — LinkedIn Ready)
                </strong>
                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                  Committed: {result.filesCommitted.join(', ')}
                </span>
                <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.8125rem' }}>
                  Live Portfolio URL:{' '}
                  <a href={result.htmlUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
                    {result.htmlUrl}
                  </a>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
              <button
                type="submit"
                className="btn solid"
                style={{ minHeight: '42px', padding: '0 1.2rem' }}
                disabled={publishing}
              >
                {publishing ? 'Publishing to GitHub...' : 'Publish Live to GitHub Pages'}
              </button>
              <button
                type="button"
                className="btn"
                style={{ minHeight: '42px', padding: '0 1rem', fontSize: '0.875rem' }}
                onClick={onExportHtml}
                disabled={exporting}
              >
                {exporting ? 'Packaging...' : 'Download index.html'}
              </button>
              <button
                type="button"
                className="btn"
                style={{ minHeight: '42px', padding: '0 1rem', fontSize: '0.875rem' }}
                onClick={() => downloadOgBannerJpg(state)}
              >
                Download og-card.jpg
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

