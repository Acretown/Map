(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || window.AcreTownProofFrames) return;
  const base = new URL('./embed.html', script.src);
  const frames = new Map();
  window.addEventListener('message', event => {
    if (event.origin !== base.origin || !event.data || event.data.type !== 'acretown-proof-height') return;
    for (const [frame] of frames) {
      if (event.source !== frame.contentWindow) continue;
      const height = event.data.height;
      if (typeof height !== 'number' || !Number.isFinite(height) || height < 0 || height > 2000) return;
      frame.style.height = `${Math.ceil(height)}px`;
      frame.setAttribute('aria-hidden', height === 0 ? 'true' : 'false');
      if (frame.parentElement.dataset.acretownProofFrame === 'process') {
        frame.parentElement.style.marginBottom = height > 0 ? '32px' : '0';
      }
    }
  });
  const init = () => {
    document.querySelectorAll('[data-acretown-proof-frame]').forEach(host => {
      if (host.dataset.proofMounted === 'true') return;
      const variant = host.dataset.acretownProofFrame;
      const placement = host.dataset.placement || '';
      if (!['full','compact','shopping','process'].includes(variant)) return;
      if (variant === 'shopping' && !['trust','how-it-works-hero'].includes(placement)) return;
      host.dataset.proofMounted = 'true';
      const src = new URL(base);src.searchParams.set('variant',variant);src.searchParams.set('placement',placement);
      const frame = document.createElement('iframe');
      frame.title = variant === 'shopping' ? 'AcreTown property shopping activity' : variant === 'process' ? 'AcreTown properties in process' : 'AcreTown buyer proof';
      frame.style.cssText = 'display:block;width:100%;height:0;border:0;margin:0;padding:0;';
      frame.setAttribute('aria-hidden','true');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = src.href;frames.set(frame,true);host.append(frame);
    });
  };
  window.AcreTownProofFrames = {init};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
