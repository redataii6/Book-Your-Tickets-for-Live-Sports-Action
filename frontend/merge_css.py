import re
import os

with open('../templates/base.html', 'r', encoding='utf-8') as f:
    base_html = f.read()

match = re.search(r'<style>\n(.*?)\s*</style>', base_html, re.DOTALL)
if not match:
    print("Failed to match base.html style")
    exit(1)

base_css = match.group(1).strip()

new_css = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

""" + base_css + """

/* ── Utility ───────────────────────────────────────── */
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
.fw-800 { font-weight: 800; }

/* ── QR Widget ─────────────────────────────────────── */
.qr-frame {
  background: #fff;
  border-radius: 1rem;
  padding: 14px;
  box-shadow: 0 4px 20px rgba(0,0,0,.25);
  display: inline-flex;
  position: relative;
}
.qr-img {
  width: 160px;
  height: 160px;
  image-rendering: pixelated;
  display: block;
  border-radius: 4px;
  transition: opacity .4s ease;
}
.qr-img.fading { opacity: 0; }
.qr-spinner-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,.7);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-spinner {
  width: 36px; height: 36px;
  border: 4px solid #e0e7ff;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
.qr-ring-bg      { fill: none; stroke: rgba(129,140,248,.2); stroke-width: 4; }
.qr-ring-progress { fill: none; stroke: #818cf8; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
.qr-live-badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #10b981;
  padding: .15rem .5rem;
  border-radius: 50px;
  border: 1px solid rgba(16,185,129,.4);
  background: rgba(16,185,129,.1);
}
.qr-live-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.7); }
}

/* ── Additional Ticket Detail Styles ── */
.ticket-wrapper { max-width: 820px; margin: 0 auto; padding: 2.5rem 1rem; }
.ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: .75rem; }
.banner-sport { font-size: .8rem; text-transform: uppercase; letter-spacing: .12em; color: rgba(255,255,255,.7); margin-bottom: .4rem; }
.banner-title { font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: .3rem; line-height: 1.2; }
.banner-ref { font-size: .78rem; color: rgba(255,255,255,.6); font-family: monospace; }
.banner-status { display: inline-block; padding: .3rem .8rem; border-radius: 50px; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; background: rgba(16,185,129,.25); color: #6ee7b7; border: 1px solid rgba(16,185,129,.4); }
.banner-status.cancelled { background: rgba(239,68,68,.2); color: #fca5a5; border-color: rgba(239,68,68,.3); }

/* ── Ticket card ───────────────────────────────────── */
.ticket-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}
.ticket-banner {
  background: linear-gradient(135deg, #4f46e5 0%, #818cf8 50%, #06b6d4 100%);
  padding: 2rem 2.5rem;
  position: relative;
  overflow: hidden;
}
.ticket-banner::before {
  content: '';
  position: absolute;
  top: -60px; right: -60px;
  width: 220px; height: 220px;
  border-radius: 50%;
  background: rgba(255,255,255,.08);
}
.torn-edge {
  display: flex;
  align-items: center;
  background: var(--card);
  border-top: 2px dashed var(--card-border);
  border-bottom: 2px dashed var(--card-border);
}
.torn-circle {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--card-border);
  flex-shrink: 0;
}
.torn-circle.left  { margin-left: -14px; }
.torn-circle.right { margin-right: -14px; }
.torn-line { flex: 1; border-top: 2px dashed var(--card-border); margin: 0 4px; }

.ticket-body { padding: 2rem 2.5rem; display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap; }
.ticket-info { flex: 1; min-width: 220px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem 1rem; margin-top: 1rem; }
.info-item .label { font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: .2rem; }
.info-item .value { font-size: .95rem; font-weight: 700; color: var(--text); }
.info-item .value.accent { color: #818cf8; }
.ticket-qr { display: flex; flex-direction: column; align-items: center; gap: .6rem; min-width: 200px; }
#qr-widget { display: flex; flex-direction: column; align-items: center; gap: .6rem; }
.qr-countdown-wrap { display: flex; flex-direction: column; align-items: center; gap: .3rem; }
.qr-countdown-svg { transform: rotate(-90deg); }
.qr-countdown-text { font-size: .72rem; color: var(--muted); text-align: center; max-width: 180px; }
.qr-label { font-size: .72rem; color: var(--muted); text-align: center; max-width: 180px; }
.map-section { padding: 0 2.5rem 2.5rem; }
.map-section h3 { font-size: .88rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: 1rem; display: flex; align-items: center; gap: .4rem; }
#stadium-map { width: 100%; height: 340px; border-radius: 1rem; border: 1px solid var(--card-border); overflow: hidden; display: block; }
#stadium-map iframe { width: 100%; height: 100%; border: none; display: block; }
.map-no-coords { height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--card-border); border-radius: 1rem; color: var(--muted); font-size: .85rem; gap: .5rem; }
.ticket-actions { padding: 0 2.5rem 2.5rem; display: flex; gap: 1rem; flex-wrap: wrap; }

@media (max-width: 560px) {
  .ticket-banner, .ticket-body, .map-section, .ticket-actions { padding-left: 1.25rem; padding-right: 1.25rem; }
  .ticket-body { flex-direction: column; }
  .ticket-qr { width: 100%; }
}
"""

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(new_css)
print("Merged css successfully")
