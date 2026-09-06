(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || window.AcreTownProofPlacement) return;
  window.AcreTownProofPlacement = true;
  const loaderURL = new URL('./carrot-embed.js?v=20260906-spacing', script.src).href;
  function place() {
    if (document.querySelector('[data-acretown-proof-frame]')) return;
    let anchor, variant, before = false;
    if (document.body.classList.contains('home')) {
      anchor = document.querySelector('main.main');
      if (!anchor) return;
      const host = document.createElement('div');
      host.dataset.acretownProofFrame = 'full';
      host.style.cssText = 'width:100%;margin:24px 0;clear:both';
      anchor.prepend(host);
    } else {
      if (location.pathname.replace(/\/$/, '') === '/how-to-buy-land') {
        anchor = [...document.querySelectorAll('.at-section h2')].find(e => e.textContent.trim() === 'Why Buyers Trust AcreTown');
        variant = 'full';
      } else if (document.body.classList.contains('single-property')) {
        const checkout = document.querySelector('main a[href^="https://acretownpayments.company.site"]');
        anchor = checkout ? checkout.closest('p,figure,h2,h3,div') : document.querySelector('.property-cta-bottom');
        variant = 'compact';
        before = !checkout;
      }
      if (!anchor) return;
      const host = document.createElement('div');
      host.dataset.acretownProofFrame = variant;
      host.style.cssText = 'width:100%;margin:24px 0;clear:both';
      anchor.insertAdjacentElement(before ? 'beforebegin' : 'afterend', host);
    }
    // Activity is separate from lifetime proof and never added to listings.
    const full = document.querySelector('[data-acretown-proof-frame="full"]');
    if (full) {
      const activity = document.createElement('div');
      activity.dataset.acretownProofFrame = 'process';
      full.insertAdjacentElement('afterend', activity);
    }
    const loader = document.createElement('script');
    loader.src = loaderURL;
    loader.async = true;
    document.body.append(loader);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place, {once:true});
  else place();
})();
