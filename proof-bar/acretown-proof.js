(function (root) {
  'use strict';
  const DAY = 86400000;
  const limits = {propertiesSold: Infinity, states: Infinity, acres: Infinity, closed90: 8, shoppers30: 8, pending: 2};
  const labels = {buyersHelped: 'Buyers Helped', states: 'States', acres: 'Acres Sold', closed90: 'Closed in the Last 90 Days'};
  const formats = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2});
  function value(data, key, now = Date.now()) {
    const m = data && data.metrics && data.metrics[key];
    if (!m || m.verified !== true || typeof m.source !== 'string' || !m.source.trim()) return null;
    if (typeof m.value !== 'number' || !Number.isFinite(m.value) || m.value < 0) return null;
    if (key !== 'acres' && !Number.isSafeInteger(m.value)) return null;
    if (key === 'states' && m.value > 50) return null;
    const checked = Date.parse(m.checkedAt);
    if (!Number.isFinite(checked) || checked > now || now - checked > limits[key] * DAY) return null;
    if (key === 'shoppers30' && m.definition !== 'unique-property-page-users') return null;
    if (key === 'pending' && m.definition !== 'website-pending-confirmed-locked') return null;
    if (key === 'closed90' || key === 'shoppers30') {
      const start = Date.parse(m.periodStart), end = Date.parse(m.periodEnd);
      const days = key === 'closed90' ? 90 : 30;
      if (!Number.isFinite(start) || !Number.isFinite(end) || end > now || end > checked ||
          Math.abs((end - start) / DAY - days) > 0.05 || now - end > limits[key] * DAY) return null;
    }
    return m.value;
  }
  function model(data, options = {}, now = Date.now()) {
    const variant = options.variant || 'full';
    // Bob-approved static figures, September 6, 2026. Independent of automated sales metrics.
    const fixed = {buyersHelped: 331, states: 49};
    const keys = variant === 'compact' ? ['buyersHelped', 'states', 'acres'] : ['buyersHelped', 'states', 'acres', 'closed90'];
    const stats = ['full', 'compact'].includes(variant) ? keys.flatMap(key => {
      const n = Object.prototype.hasOwnProperty.call(fixed, key) ? fixed[key] : value(data, key, now);
      return n === null ? [] : [{key, label: labels[key], number: formats.format(n) + (key === 'acres' && data.metrics[key].lowerBound === true ? '+' : '')}];
    }) : [];
    const buyersHelped = stats.find(s => s.key === 'buyersHelped'), states = stats.find(s => s.key === 'states');
    const headline = buyersHelped && states ? `${buyersHelped.number} buyers helped across ${states.number} states.` : 'AcreTown, by the numbers.';
    const shoppingAllowed = ['trust', 'how-it-works-hero'].includes(options.placement);
    const shoppers = variant === 'shopping' && shoppingAllowed ? value(data, 'shoppers30', now) : null;
    const pending = variant === 'process' ? value(data, 'pending', now) : null;
    return {variant, stats, headline, shoppers, pending: pending !== null && pending > 3 ? pending : null};
  }
  const css = `
    :host{display:block;font-family:var(--font-primary,'Source Sans Pro',Arial,sans-serif);color:#173842;font-size:16px;line-height:1.5}
    *{box-sizing:border-box}.panel{border:1px solid #dbe5e4;border-radius:12px;padding:30px;background:#f3f6f5}
    h2{font-size:clamp(23px,3vw,30px);line-height:1.2;letter-spacing:-.025em;color:#10333e;margin:0 0 26px;font-weight:750}
    .eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#42646b;margin:0 0 12px}
    .stats{display:flex;flex-wrap:wrap;gap:24px 0;margin:0}.stat{display:flex;flex-direction:column;flex:1 1 150px;padding:0 22px;border-left:2px solid #eba93d}.stat dd{order:-1}
    dt{font-size:14px;margin-top:5px}dd{font-size:38px;line-height:1.1;font-weight:750;color:#10333e;margin:0;font-variant-numeric:tabular-nums}
    .compact{display:flex;flex-wrap:wrap;gap:8px 22px;justify-content:center;border-block:1px solid #dbe5e4;padding:16px 8px;background:white;font-size:14px}
    .compact span{display:inline-block}.compact strong{color:#10333e;font-size:17px;margin-right:4px}
    .activity{padding:20px 24px;border:1px solid #dbe5e4;border-radius:10px;background:#fff}.activity p{margin:0}.activity p+p{margin-top:8px}
    .activity .lead{font-size:18px;font-weight:650;color:#10333e}.activity small{display:block;font-size:12px;color:#49656c;margin-top:8px}
    .shopping{background:#f7f9f8;border:0;border-left:3px solid #eba93d;border-radius:0 10px 10px 0}.shopping .lead{font-weight:400;font-size:17px;line-height:1.5}.shopping .lead strong{font-weight:750}.shopping small{margin-top:6px;color:#526c72}
    .process{background:#10333e;color:#edf4f3;border-color:#10333e}.process .lead{color:#fff}.process strong{color:#f6c576}.process .eyebrow{color:#f6c576}
    @media(max-width:520px){.panel{padding:24px 20px}.stat{flex-basis:50%;padding:0 12px}dd{font-size:30px}.compact{justify-content:flex-start;padding:14px}.activity{padding:20px}.activity .lead{font-size:17px}}
  `;
  function node(tag, text, cls) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }
  const mounted = new Map();
  const requests = new Map();
  function paint(host, data, options) {
    const m = model(data, options);
    const shadow = host.shadowRoot || host.attachShadow({mode: 'open'});
    shadow.replaceChildren();
    host.hidden = true;
    host.style.display = 'none';
    if (!m.stats.length && m.shoppers === null && m.pending === null) return;
    shadow.append(node('style', css));
    const panel = node('section', undefined, m.variant === 'compact' ? 'compact' : m.variant === 'full' ? 'panel' : 'activity' + (m.variant === 'process' ? ' process' : ' shopping'));
    panel.setAttribute('aria-label', m.variant === 'process' ? 'AcreTown buying activity' : 'AcreTown buyer experience');
    if (m.variant === 'full') {
      panel.append(node('p', 'Experience you can see', 'eyebrow'), node('h2', m.headline));
      const list = node('dl', undefined, 'stats');
      m.stats.forEach(s => {const item = node('div', undefined, 'stat'); item.append(node('dt', s.label), node('dd', s.number)); list.append(item);});
      panel.append(list);
    } else if (m.variant === 'compact') {
      m.stats.forEach(s => {const item = node('span'); item.append(node('strong', s.number), document.createTextNode(' ' + s.label)); panel.append(item);});
    } else if (m.variant === 'shopping') {
      const count = formats.format(m.shoppers);
      const lead = node('p', undefined, 'lead');
      if (options.placement === 'how-it-works-hero') lead.append(document.createTextNode('You’re not alone. '));
      lead.append(node('strong', `${count} unique ${m.shoppers === 1 ? 'visitor' : 'visitors'}`), document.createTextNode(' viewed AcreTown property pages in the last 30 days.'));
      panel.append(lead, node('small', 'Measured by Google Analytics.'));
    } else {
      panel.append(node('p', 'From screen to soil', 'eyebrow'));
      const p = node('p', undefined, 'lead');
      p.append(document.createTextNode('Right now, '), node('strong', `${m.pending} properties`), document.createTextNode(' are Locked and moving through the AcreTown Deed-In-Hand Program.'));
      panel.append(p, node('p', 'These buyers have reserved their property and are in the process of becoming landowners.'));
    }
    shadow.append(panel);
    host.hidden = false;
    host.style.display = 'block';
  }
  function mount(host, data, options = {}) {
    mounted.set(host, {data, options});
    paint(host, data, options);
  }
  async function load(url) {
    if (!requests.has(url)) requests.set(url, (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, {credentials: 'omit', signal: controller.signal, cache: 'no-cache'});
        if (!response.ok) throw new Error('Proof data unavailable');
        return await response.json();
      } finally {clearTimeout(timeout);}
    })());
    return requests.get(url);
  }
  async function init(scope = document) {
    await Promise.all([...scope.querySelectorAll('[data-acretown-proof]')].map(async host => {
      if (mounted.has(host)) return;
      const options = {variant: host.dataset.acretownProof, placement: host.dataset.placement};
      mount(host, {}, options);
      const src = host.dataset.source;
      if (!src) return;
      try {mount(host, await load(src), options);} catch (_) { /* Unavailable data remains hidden. */ }
    }));
  }
  const api = {value, model, mount, init};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    if (root.AcreTownProof) return;
    root.AcreTownProof = api;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), {once: true});
    else init();
    // Recheck freshness for visitors who leave a tab open. No animated counters.
    setInterval(() => {for (const [host, m] of mounted) {if (host.isConnected) paint(host, m.data, m.options); else mounted.delete(host);}}, 60000);
  }
})(typeof window === 'undefined' ? {} : window);
