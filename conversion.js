/* No visitor identifiers, emails, brief answers or order tokens in analytics. */
(() => {
  const sectors = ['cleaning','accounting','beauty','landscaping','it','recruitment','other'];
  const params = new URLSearchParams(location.search);
  const sector = sectors.includes(params.get('utm_campaign')) ? params.get('utm_campaign') : 'unattributed';
  const variant = ['pricing-scope-v1','control'].includes(params.get('utm_content')) ? params.get('utm_content') : 'unattributed';
  const source = params.get('utm_source') === 'outreach' && params.get('utm_medium') === 'email' ? 'outreach' : 'unattributed';
  const attribution = source === 'outreach' ? {source,sector,variant} : {source:'unattributed',sector:'unattributed',variant:'unattributed'};
  window.paAttribution = () => ({...attribution});
  let allowed = false, loaded = false;
  try { allowed = localStorage.getItem('pa-analytics-choice') === 'yes'; } catch {}
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ if (allowed) window.dataLayer.push(arguments); };
  const safeLocation = () => location.origin + location.pathname;
  function loadAnalytics() {
    if (loaded || !allowed) return;
    loaded = true;
    gtag('js',new Date());
    gtag('config','G-X681KVY1SX',{send_page_view:false,page_location:safeLocation(),page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false,...(source==='outreach'?{campaign_source:'outreach',campaign_medium:'email',campaign_name:attribution.sector,campaign_content:attribution.variant}:{})});
    const script=document.createElement('script'); script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id=G-X681KVY1SX'; document.head.append(script);
    window.paTrack('journey_visit');
  }
  window.paTrack = (event,extra={}) => {
    if (!allowed) return;
    gtag('event',event,{...attribution,...extra,page_location:safeLocation(),page_referrer:'',page_title:document.title});
  };
  function choose(value) {
    allowed=value;
    try { localStorage.setItem('pa-analytics-choice',value?'yes':'no'); } catch {}
    document.getElementById('paCookieChoice')?.remove();
    if(value) loadAnalytics();
    else { window['ga-disable-G-X681KVY1SX']=true; location.reload(); }
  }
  function showChoice() {
    if(document.getElementById('paCookieChoice')) return;
    const panel=document.createElement('section'); panel.id='paCookieChoice'; panel.setAttribute('aria-label','Optional analytics');
    panel.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:620px;z-index:10000;background:#fff;color:#0b1929;border:1px solid #0b1929;border-radius:14px;padding:18px;box-shadow:0 4px 24px #0002;font:15px/1.5 system-ui';
    panel.innerHTML='<p style="margin:0 0 12px">May we use optional analytics to understand which pages and campaigns help visitors? Your choice does not affect the sample or buying a report. <a href="/privacy.html">Privacy details</a></p><div style="display:flex;gap:12px;flex-wrap:wrap"><button type="button" data-choice="yes">Allow analytics</button><button type="button" data-choice="no">Continue without analytics</button></div>';
    panel.querySelectorAll('button').forEach(button=>{button.style.cssText='padding:10px 14px;border:1px solid #0b1929;border-radius:8px;background:#fff;color:#0b1929;font:inherit;cursor:pointer';button.onclick=()=>choose(button.dataset.choice==='yes');});
    document.body.append(panel);
  }
  function init() {
    let choice=null;try{choice=localStorage.getItem('pa-analytics-choice');}catch{}
    if(choice===null) showChoice();
    loadAnalytics();
    const settings=document.createElement('button');settings.type='button';settings.textContent='Analytics preferences';settings.style.cssText='margin:12px;padding:8px 12px;font:inherit;cursor:pointer';settings.onclick=showChoice;
    (document.querySelector('footer')||document.body).append(settings);
    // Carry only approved aggregate labels between our pages; never decorate checkout URLs.
    document.addEventListener('click',event=>{
      const link=event.target.closest('a');if(!link)return;
      const url=new URL(link.href,location.href);
      if(url.hostname==='payhip.com') window.paTrack('campaign_checkout_click',{package:({'/b/N47tJ':'snapshot','/b/YvjeX':'deep-dive','/b/FIXaT':'monthly-monitor'})[url.pathname]||'report'});
      if(url.origin===location.origin&&attribution.source==='outreach'&&url.pathname!==location.pathname){
        url.searchParams.set('utm_source','outreach');url.searchParams.set('utm_medium','email');url.searchParams.set('utm_campaign',sector);url.searchParams.set('utm_content',variant);link.href=url.href;
      }
      if(link.hasAttribute('download')||url.protocol==='data:')window.paTrack('campaign_sample_download');
    });
    const form=document.getElementById('researchUpdates');
    if(form)form.addEventListener('submit',async event=>{
      event.preventDefault();if(!form.reportValidity())return;
      const status=document.getElementById('updatesStatus'),button=form.querySelector('button');
      const email=form.elements.email.value.trim();
      const consent=form.elements.updatesConsent.checked;
      if(!consent)return;
      button.disabled=true;status.textContent='Sending your request…';
      try{
        const response=await fetch('https://formspree.io/f/mrpegvon',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({email,subject:'Research updates — subscription request',message:'Please confirm this request with the email owner before adding them to any marketing list. Do not override existing suppressions.',consent:true,consent_text:form.elements.updatesConsent.value,consent_version:'research-updates-2026-10-19',requested_at:new Date().toISOString(),...attribution})});
        if(!response.ok)throw new Error('Request not accepted');
        status.textContent='Request received. We will ask you to confirm by email before adding you to the updates list. The sample remains available below.';
        window.paTrack('updates_request');form.reset();
      }catch{status.textContent='Your request could not be confirmed. Your details are kept here. Please try later or email hello@pocketanalysis.com; you have not been added to a list.';}
      finally{button.disabled=false;}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
