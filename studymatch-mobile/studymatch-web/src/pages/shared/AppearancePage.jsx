import { useState } from 'react'
import {
  Sun, Moon, Monitor, ChevronDown, ChevronRight,
  HelpCircle, Palette, Clock,
} from 'lucide-react'

/* ─── data ──────────────────────────────────────────────────── */

const THEMES = [
  {
    id: 'light',
    label: 'Light',
    desc: 'Clean and bright',
    icon: Sun,
    preview: (
      <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', borderRadius: 8 }}>
        {/* bg */}
        <rect width="160" height="100" fill="#F3F4F6" />
        {/* sidebar */}
        <rect x="0" y="0" width="36" height="100" fill="#FFFFFF" />
        <rect x="6" y="10" width="24" height="4" rx="2" fill="#DDD6FE" />
        <rect x="6" y="20" width="18" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="6" y="27" width="18" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="6" y="34" width="18" height="3" rx="1.5" fill="#7C3AED" opacity="0.4" />
        <rect x="6" y="41" width="18" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="6" y="48" width="18" height="3" rx="1.5" fill="#E5E7EB" />
        {/* topbar */}
        <rect x="36" y="0" width="124" height="16" fill="#FFFFFF" />
        <rect x="42" y="5" width="40" height="6" rx="3" fill="#E5E7EB" />
        <rect x="140" y="5" width="14" height="6" rx="3" fill="#E5E7EB" />
        {/* content cards */}
        <rect x="42" y="22" width="52" height="30" rx="6" fill="#FFFFFF" />
        <rect x="48" y="28" width="20" height="4" rx="2" fill="#DDD6FE" />
        <rect x="48" y="35" width="34" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="48" y="41" width="28" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="100" y="22" width="52" height="30" rx="6" fill="#FFFFFF" />
        <rect x="106" y="28" width="16" height="4" rx="2" fill="#DDD6FE" />
        <rect x="106" y="35" width="34" height="3" rx="1.5" fill="#E5E7EB" />
        <rect x="106" y="41" width="24" height="3" rx="1.5" fill="#E5E7EB" />
        {/* purple btn */}
        <rect x="48" y="58" width="34" height="8" rx="4" fill="#7C3AED" />
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    desc: 'Easy on the eyes',
    icon: Moon,
    preview: (
      <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', borderRadius: 8 }}>
        <rect width="160" height="100" fill="#1F1B2E" />
        <rect x="0" y="0" width="36" height="100" fill="#13101F" />
        <rect x="6" y="10" width="24" height="4" rx="2" fill="#7C3AED" opacity="0.5" />
        <rect x="6" y="20" width="18" height="3" rx="1.5" fill="#2D2A3E" />
        <rect x="6" y="27" width="18" height="3" rx="1.5" fill="#2D2A3E" />
        <rect x="6" y="34" width="18" height="3" rx="1.5" fill="#7C3AED" opacity="0.3" />
        <rect x="6" y="41" width="18" height="3" rx="1.5" fill="#2D2A3E" />
        <rect x="36" y="0" width="124" height="16" fill="#13101F" />
        <rect x="42" y="5" width="40" height="6" rx="3" fill="#2D2A3E" />
        <rect x="140" y="5" width="14" height="6" rx="3" fill="#2D2A3E" />
        <rect x="42" y="22" width="52" height="30" rx="6" fill="#2D2A3E" />
        <rect x="48" y="28" width="20" height="4" rx="2" fill="#7C3AED" opacity="0.4" />
        <rect x="48" y="35" width="34" height="3" rx="1.5" fill="#3D3A52" />
        <rect x="48" y="41" width="28" height="3" rx="1.5" fill="#3D3A52" />
        <rect x="100" y="22" width="52" height="30" rx="6" fill="#2D2A3E" />
        <rect x="106" y="28" width="16" height="4" rx="2" fill="#7C3AED" opacity="0.4" />
        <rect x="106" y="35" width="34" height="3" rx="1.5" fill="#3D3A52" />
        <rect x="48" y="58" width="34" height="8" rx="4" fill="#7C3AED" />
      </svg>
    ),
  },
  {
    id: 'system',
    label: 'System',
    desc: 'Use device setting',
    icon: Monitor,
    preview: (
      <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', borderRadius: 8 }}>
        {/* left half light, right half dark */}
        <rect width="80" height="100" fill="#F3F4F6" />
        <rect x="80" width="80" height="100" fill="#1F1B2E" />
        {/* sidebar split */}
        <rect x="0" y="0" width="36" height="100" fill="none" />
        <rect x="0" y="0" width="18" height="100" fill="#FFFFFF" />
        <rect x="18" y="0" width="18" height="100" fill="#13101F" />
        {/* topbar */}
        <rect x="36" y="0" width="124" height="14" fill="none" />
        <rect x="36" y="0" width="44" height="14" fill="#FFFFFF" />
        <rect x="80" y="0" width="80" height="14" fill="#13101F" />
        {/* divider line */}
        <rect x="79" y="0" width="2" height="100" fill="#7C3AED" opacity="0.5" />
        {/* cards left */}
        <rect x="42" y="20" width="32" height="22" rx="5" fill="#FFFFFF" />
        <rect x="46" y="24" width="12" height="3" rx="1.5" fill="#DDD6FE" />
        <rect x="46" y="30" width="20" height="2.5" rx="1.25" fill="#E5E7EB" />
        {/* cards right */}
        <rect x="84" y="20" width="32" height="22" rx="5" fill="#2D2A3E" />
        <rect x="88" y="24" width="12" height="3" rx="1.5" fill="#7C3AED" opacity="0.4" />
        <rect x="88" y="30" width="20" height="2.5" rx="1.25" fill="#3D3A52" />
        <rect x="46" y="48" width="24" height="6" rx="3" fill="#7C3AED" />
        <rect x="84" y="48" width="24" height="6" rx="3" fill="#7C3AED" opacity="0.6" />
      </svg>
    ),
  },
]

const ACCENT_COLORS = [
  { id: 'purple', color: '#7C3AED' },
  { id: 'blue',   color: '#3B82F6' },
  { id: 'teal',   color: '#14B8A6' },
  { id: 'green',  color: '#22C55E' },
  { id: 'orange', color: '#F59E0B' },
  { id: 'pink',   color: '#EC4899' },
  { id: 'red',    color: '#EF4444' },
]

const FONT_SIZE_OPTIONS = ['Small', 'Medium (Default)', 'Large', 'Extra Large']

/* ─── helpers ───────────────────────────────────────────────── */

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? '#7C3AED' : '#D1D5DB',
      position: 'relative', cursor: 'pointer',
      transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: 'white',
        transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', background: 'white',
        border: '1px solid #E5E7EB', borderRadius: 10,
        cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
        color: '#374151', userSelect: 'none', minWidth: 180,
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={13} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0,
            background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
            zIndex: 50, minWidth: '100%', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }} style={{
                padding: '9px 14px', fontSize: 13.5,
                color: opt === value ? '#7C3AED' : '#374151',
                fontWeight: opt === value ? 600 : 400,
                cursor: 'pointer',
                background: opt === value ? '#F3F0FF' : 'white',
              }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#F8F9FB' }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'white' }}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── live preview mini-UI ──────────────────────────────────── */

function LivePreview({ theme, accent }) {
  const isDark = theme === 'dark'
  const bg      = isDark ? '#1F1B2E' : '#F3F4F6'
  const card    = isDark ? '#2D2A3E' : '#FFFFFF'
  const sidebar = isDark ? '#13101F' : '#FFFFFF'
  const txt1    = isDark ? '#EAE6FF' : '#1E1B4B'
  const txt2    = isDark ? '#6B6B8A' : '#9CA3AF'
  const line    = isDark ? '#3D3A52' : '#E5E7EB'

  return (
    <div style={{
      background: bg, borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${isDark ? '#3D3A52' : '#E5E7EB'}`,
      height: 220,
    }}>
      {/* mock topbar */}
      <div style={{
        background: sidebar, borderBottom: `1px solid ${line}`,
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: accent, opacity: 0.9 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: txt1 }}>
          Study<span style={{ color: accent }}>Match</span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: txt1 }}>Find Tutors</span>
      </div>

      <div style={{ display: 'flex', height: 'calc(100% - 33px)' }}>
        {/* mock sidebar */}
        <div style={{
          width: 56, background: sidebar,
          borderRight: `1px solid ${line}`, padding: '8px 6px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              height: 8, borderRadius: 4,
              background: i === 2 ? accent + '33' : line,
              width: i === 2 ? '100%' : '70%',
            }} />
          ))}
        </div>

        {/* mock content */}
        <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* search bar */}
          <div style={{
            background: card, borderRadius: 8, padding: '6px 10px',
            border: `1px solid ${line}`, fontSize: 10, color: txt2,
          }}>
            Search tutors...
          </div>

          {/* tutor cards */}
          {[
            { name: 'Tutor A', sub: 'Calculus • 5.0 ★', hasBtn: true },
            { name: 'Tutor B', sub: 'Physics • 4.9 ★',  hasBtn: false },
          ].map((t, i) => (
            <div key={i} style={{
              background: card, borderRadius: 8, padding: '8px 10px',
              border: `1px solid ${line}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: accent + '22', border: `2px solid ${accent}44`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: txt1 }}>{t.name}</div>
                <div style={{ fontSize: 9, color: txt2, marginTop: 1 }}>{t.sub}</div>
              </div>
              {t.hasBtn && (
                <div style={{
                  padding: '3px 8px', background: accent,
                  borderRadius: 5, fontSize: 9, fontWeight: 700, color: 'white',
                }}>
                  View
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────── */

export default function AppearancePage() {
  const [theme, setTheme]         = useState('light')
  const [accent, setAccent]       = useState('#7C3AED')
  const [fontSize, setFontSize]   = useState('Medium (Default)')
  const [fontSlider, setFontSlider] = useState(50)
  const [compactMode, setCompactMode] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [useSystem, setUseSystem] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .app-wrap * { box-sizing: border-box; }
        .app-wrap {
          font-family: 'DM Sans', sans-serif;
          color: #1E1B4B;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .app-main { flex: 1; display: flex; flex-direction: column; gap: 24px; min-width: 0; }
        .app-right { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }

        /* theme card */
        .theme-card {
          flex: 1; border-radius: 14px; padding: 4px;
          border: 2px solid #E5E7EB; cursor: pointer;
          transition: border-color .18s, box-shadow .18s;
          background: white;
        }
        .theme-card:hover { border-color: #C4B5FD; }
        .theme-card.selected { border-color: #7C3AED; box-shadow: 0 0 0 3px #DDD6FE; }

        /* accent dot */
        .accent-dot {
          width: 40px; height: 40px; border-radius: '50%';
          cursor: pointer; transition: transform .15s, box-shadow .15s;
          border: 3px solid transparent;
        }
        .accent-dot:hover { transform: scale(1.1); }
        .accent-dot.selected { border-color: white; box-shadow: 0 0 0 3px currentColor; }

        /* slider */
        .font-slider {
          -webkit-appearance: none; appearance: none;
          height: 4px; border-radius: 4px;
          background: linear-gradient(to right, #7C3AED var(--val), #E5E7EB var(--val));
          outline: none; cursor: pointer; width: 100%;
        }
        .font-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #7C3AED; cursor: pointer;
          border: 3px solid white; box-shadow: 0 1px 4px rgba(124,58,237,.4);
        }

        /* quick option row */
        .quick-row {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 0; border-bottom: 1px solid #F8F9FB;
          cursor: pointer; transition: background .12s;
        }
        .quick-row:last-child { border-bottom: none; }
        .quick-row:hover { background: #FAFAFA; }
      `}</style>

      <div className="app-wrap">
        <div className="app-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Appearance</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Customize how StudyMatch looks and feels for you.</p>
          </div>

          {/* ── Theme ── */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 4 }}>Theme</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Choose your preferred color theme.</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {THEMES.map(t => (
                <div
                  key={t.id}
                  className={`theme-card${theme === t.id ? ' selected' : ''}`}
                  onClick={() => setTheme(t.id)}
                  style={{ flex: 1 }}
                >
                  {/* radio */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 10px 0' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${theme === t.id ? '#7C3AED' : '#D1D5DB'}`,
                      background: theme === t.id ? '#7C3AED' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {theme === t.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </div>

                  {/* preview */}
                  <div style={{ padding: '0 10px 10px' }}>
                    {t.preview}
                  </div>

                  <div style={{ padding: '4px 12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B', marginBottom: 2 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Accent Color ── */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 4 }}>Accent Color</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Choose your favorite color for highlights and buttons.</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map(({ id, color }) => (
                <div
                  key={id}
                  onClick={() => setAccent(color)}
                  style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: color, cursor: 'pointer',
                    transition: 'transform .15s, box-shadow .15s',
                    border: accent === color ? '3px solid white' : '3px solid transparent',
                    boxShadow: accent === color ? `0 0 0 3px ${color}` : 'none',
                    transform: accent === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Font & Text Size ── */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 4 }}>Font & Text Size</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>Adjust the size of text across StudyMatch.</div>
              </div>
              <Dropdown value={fontSize} options={FONT_SIZE_OPTIONS} onChange={setFontSize} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700, flexShrink: 0 }}>A</span>
              <input
                type="range" min="0" max="100" value={fontSlider}
                onChange={e => setFontSlider(Number(e.target.value))}
                className="font-slider"
                style={{ '--val': `${fontSlider}%` }}
              />
              <span style={{ fontSize: 18, color: '#374151', fontWeight: 700, flexShrink: 0 }}>A</span>
            </div>
          </div>

          {/* ── Compact Mode ── */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 3 }}>Compact Mode</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>Show more content on screen with a tighter layout.</div>
              </div>
              <Toggle on={compactMode} onClick={() => setCompactMode(p => !p)} />
            </div>

            <div style={{ borderTop: '1px solid #F8F9FB', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 3 }}>Reduce Motion</div>
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>Minimize animations and transitions for a calmer experience.</div>
              </div>
              <Toggle on={reduceMotion} onClick={() => setReduceMotion(p => !p)} />
            </div>
          </div>

          {/* Save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={{
              padding: '11px 28px', background: accent,
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'opacity .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Save Appearance
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="app-right">

          {/* Live Preview */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 4 }}>Preview</div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 14 }}>See how your settings look.</div>
            <LivePreview theme={theme} accent={accent} />
          </div>

          {/* Quick Options */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Quick Options</div>

            {/* Use System Setting — toggle */}
            <div className="quick-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F8F9FB' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 17 }}>☀️</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>Use System Setting</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Automatically switch theme based on your device.</div>
              </div>
              <Toggle on={useSystem} onClick={() => setUseSystem(p => !p)} />
            </div>

            {/* Schedule Dark Mode */}
            <div className="quick-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F8F9FB', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={17} color="#6366F1" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>Schedule Dark Mode</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Set times for dark mode.</div>
              </div>
              <ChevronRight size={15} color="#D1D5DB" />
            </div>

            {/* More Themes */}
            <div className="quick-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Palette size={17} color="#7C3AED" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>More Themes</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Additional color themes coming soon!</div>
              </div>
              <ChevronRight size={15} color="#D1D5DB" />
            </div>
          </div>

          {/* Need Help */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HelpCircle size={20} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Need Help?</div>
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 14 }}>
              Questions about appearance settings? We're here to help.
            </div>
            <button style={{
              background: 'none', border: 'none', color: '#7C3AED',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Visit Help Center <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}