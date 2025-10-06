(function(){
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // Nav toggle for small screens
  const navToggle = qs('#navToggle');
  const primaryNav = qs('#primaryNav');
  if(navToggle && primaryNav){
    navToggle.addEventListener('click', ()=>{
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      if(primaryNav.hasAttribute('hidden')) primaryNav.removeAttribute('hidden'); else primaryNav.setAttribute('hidden','');
    });
  }

  // Smooth scroll for in-page links and active link highlighting
  qsa('a.nav-link, a.brand').forEach(a=>{
    a.addEventListener('click', e=>{
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        e.preventDefault();
        const el = document.querySelector(href);
        if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
        qsa('.nav-link').forEach(n=>n.classList.remove('active'));
        a.classList.add('active');
        if(window.innerWidth < 992 && primaryNav && !primaryNav.hasAttribute('hidden')){
          primaryNav.setAttribute('hidden','');
          navToggle.setAttribute('aria-expanded','false');
        }
      }
    })
  });

  // Theme toggle (persist in localStorage) with explicit .dark class support
  const themeToggle = qs('#themeToggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('site:theme');
  function applyTheme(name){
    if(name === 'dark'){
      root.classList.add('dark');
      if(themeToggle) { themeToggle.textContent = '☀️'; themeToggle.setAttribute('aria-pressed','true'); }
    } else {
      root.classList.remove('dark');
      if(themeToggle) { themeToggle.textContent = '🌙'; themeToggle.setAttribute('aria-pressed','false'); }
    }
  }
  if(saved === 'dark') applyTheme('dark'); else applyTheme('light');
  themeToggle && themeToggle.addEventListener('click', ()=>{
    const isDark = root.classList.toggle('dark');
    applyTheme(isDark ? 'dark' : 'light');
    localStorage.setItem('site:theme', isDark ? 'dark' : 'light');
  });

  // Ensure profile image isn't squished
  const img = qs('#profileImg');
  if(img){
    img.addEventListener('load', ()=>{
      if(img.naturalWidth < 220) img.style.maxWidth = '180px';
    });
  }

  // Publications-related elements guard (we removed the publications section)
  const bibInput = qs('#bibUpload');
  const pasteBtn = qs('#pasteBibBtn');
  const pubList = qs('#pubList');
  const tagCloud = qs('#tagCloud');
  const sortSelect = qs('#sortSelect');

  function refreshTagCloud(){
    if(!tagCloud) return;
    const items = qsa('.pub-item');
    const tagCounts = {};
    items.forEach(it=>{
      const tags = (it.dataset.tags || '').split(',').map(s=>s.trim()).filter(Boolean);
      tags.forEach(t=> tagCounts[t] = (tagCounts[t]||0)+1);
    });
    tagCloud.innerHTML = '';
    Object.keys(tagCounts).sort().forEach(t=>{
      const btn = document.createElement('button');
      btn.className = 'tag-chip';
      btn.type = 'button';
      btn.textContent = `${t} (${tagCounts[t]})`;
      btn.dataset.tag = t;
      btn.addEventListener('click', ()=>{
        btn.classList.toggle('active');
        applyTagFilter();
      });
      tagCloud.appendChild(btn);
    });
  }
  function applyTagFilter(){ if(!tagCloud) return; const active = qsa('.tag-chip.active').map(b=>b.dataset.tag); qsa('.pub-item').forEach(it=>{ const tags = (it.dataset.tags||'').split(',').map(s=>s.trim()).filter(Boolean); if(active.length===0) { it.style.display=''; return; } const ok = active.every(a=> tags.includes(a)); it.style.display = ok ? '' : 'none'; }); }
  function sortPubs(mode){ if(!pubList) return; const items = Array.from(qsa('.pub-item')); const container = pubList; const cmp = { 'year_desc': (a,b)=> parseInt(b.dataset.year||0) - parseInt(a.dataset.year||0), 'year_asc': (a,b)=> parseInt(a.dataset.year||0) - parseInt(b.dataset.year||0), 'title_asc': (a,b)=> a.querySelector('.pub-title').textContent.localeCompare(b.querySelector('.pub-title').textContent) }[mode] || (()=>0); items.sort(cmp).forEach(i=>container.appendChild(i)); }

  if(bibInput){ bibInput.addEventListener('change', async (e)=>{ const file = e.target.files[0]; if(!file) return; const text = await file.text(); console.log('Imported bibtex, but publications section is currently removed.'); }); }
  if(pasteBtn){ pasteBtn.addEventListener('click', ()=>{ alert('Publications section is currently removed. Paste feature disabled.'); }); }
  if(sortSelect){ sortSelect.addEventListener('change', ()=> sortPubs(sortSelect.value)); }

  // no-op if pub elements absent
  refreshTagCloud();

})();
