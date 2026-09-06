(() => {
  'use strict';
  const source='https://acretown.github.io/Map/featured-properties/data.json';
  function valid(d){
    if(d?.schemaVersion!==1||!Number.isFinite(Date.parse(d.checkedAt))||!Array.isArray(d.cards)||d.cards.length!==6) return false;
    const ids=new Set();let pending=0;
    return d.cards.every(c=>{
      try{
        const u=new URL(c.url),im=new URL(c.image);
        if(ids.has(c.id)||!c.title||!c.highlight||!Number.isFinite(c.acres)||c.acres<=0||!Number.isFinite(c.price)||c.price<=0||!['Available','Pending'].includes(c.status))return false;
        if(u.origin!=='https://www.acretown.com'||!/^\/property\/[a-z0-9+-]+\/$/.test(u.pathname)||!['https://image-cdn.carrot.com','https://cdn.carrot.com'].includes(im.origin))return false;
        ids.add(c.id);if(c.status==='Pending')pending++;return pending<=1;
      }catch{return false;}
    });
  }
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  function card(c){
    const root=el('div','wp-block-column has-background');root.dataset.propertyId=c.id;
    const figure=el('figure','wp-block-image');figure.style.position='relative';
    const a=el('a');a.href=c.url;const img=el('img');img.src=c.image;img.alt=c.title+' — '+c.acres+' acres';img.width=480;img.height=360;img.loading='lazy';a.append(img);figure.append(a);
    if(c.status==='Pending'){const badge=el('span','ac-pending-label','Pending');figure.append(badge);}
    root.append(figure,el('h3','wp-block-heading',c.title),el('p','ac-property-highlight',c.highlight));
    const price=el('p','ac-property-price',c.acres.toLocaleString('en-US',{maximumFractionDigits:2})+' acres · ');price.append(el('strong','',new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(c.price)));root.append(price);
    const certified=el('div','ac-certified-mini');const seal=el('span','ac-mini-seal','✓');seal.setAttribute('aria-hidden','true');const words=el('span');words.append(el('strong','','AcreTown Certified'),el('small','','Selected · 1 in 63'));certified.append(seal,words);root.append(certified);
    const buttons=el('div','wp-block-buttons'),button=el('div','wp-block-button'),link=el('a','wp-block-button__link wp-element-button',c.status==='Pending'?'View Pending Property':'View Property');link.href=c.url;button.append(link);buttons.append(button);root.append(buttons);return root;
  }
  function render(host,data){
    const container=host.querySelector(':scope > .wp-block-group__inner-container')||host;
    const existing=Array.from(container.children).filter(e=>e.classList.contains('wp-block-columns'));
    if(existing.length!==2)return;
    const fragment=document.createDocumentFragment();for(let i=0;i<6;i+=3){const row=el('div',existing[i/3].className);data.cards.slice(i,i+3).forEach(c=>row.append(card(c)));fragment.append(row);}
    existing[0].before(fragment);existing.forEach(n=>n.remove());host.dataset.featuredUpdated=data.checkedAt;
  }
  async function init(){
    const host=document.querySelector('body.home .ac-featured');if(!host||host.dataset.autoFeatured)return;host.dataset.autoFeatured='true';
    const style=el('style');style.textContent='body.home .ac-featured .ac-pending-label{position:absolute;top:12px;left:12px;background:#10333e;color:#fff;font-size:13px;font-weight:700;border-radius:100px;padding:6px 12px;line-height:1.4;box-shadow:0 2px 8px #0002}body.home .ac-featured .ac-property-highlight{min-height:42px}body.home .ac-featured .ac-property-price{margin-top:0}';document.head.append(style);
    try{const r=await fetch(source+'?day='+new Date().toISOString().slice(0,10),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Unavailable');const data=await r.json();if(!valid(data))throw Error('Invalid snapshot');render(host,data);try{localStorage.setItem('ac-featured-last-good',JSON.stringify(data));}catch{}}
    catch{try{const data=JSON.parse(localStorage.getItem('ac-featured-last-good'));if(valid(data))render(host,data);}catch{}}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
