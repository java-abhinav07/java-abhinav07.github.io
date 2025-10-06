// scripts.js - interactivity for Abhinav Java's site
(function(){
  // Utilities
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
        if(window.innerWidth < 992 && !primaryNav.hasAttribute('hidden')){
          primaryNav.setAttribute('hidden','');
          navToggle.setAttribute('aria-expanded','false');
        }
      }
    })
  });

  // Theme toggle (persist in localStorage)
  const themeToggle = qs('#themeToggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('site:theme');
  if(saved === 'dark') root.classList.add('dark');
  themeToggle && themeToggle.addEventListener('click', ()=>{
    const isDark = root.classList.toggle('dark');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem('site:theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  });

  // Ensure profile image isn't squished
  const img = qs('#profileImg');
  if(img){
    img.addEventListener('load', ()=>{
      if(img.naturalWidth < 220) img.style.maxWidth = '180px';
    });
  }

  /******* Publications: simple BibTeX import + tag filtering + sorting ********/
  const bibInput = qs('#bibUpload');
  const pasteBtn = qs('#pasteBibBtn');
  const pubList = qs('#pubList');
  const tagCloud = qs('#tagCloud');
  const sortSelect = qs('#sortSelect');

  // Simple BibTeX parser for common fields (title, author, year, journal/booktitle, keywords)
  function parseBibtex(text){
    const entries = [];
    // naive split by @type{
    const parts = text.split(/@(?=\w+)/).map(s=>s.trim()).filter(Boolean);
    for(const p of parts){
      const m = p.match(/^(\w+)\s*\{\s*([^,]+),([\s\S]*)\}$/m);
      if(!m) continue;
      const type = m[1];
      const citekey = m[2].trim();
      const fieldsRaw = m[3];
      const fields = {};
      const fieldRegex = /([a-zA-Z0-9_\-]+)\s*=\s*\{([\s\S]*?)\}\s*,?/g;
      let fm;
      while((fm = fieldRegex.exec(fieldsRaw)) !== null){
        fields[fm[1].toLowerCase()] = fm[2].trim();
      }
      const title = fields.title || '';
      const author = fields.author || '';
      const year = fields.year || '';
      const venue = fields.journal || fields.booktitle || '';
      const keywords = fields.keywords ? fields.keywords.split(/[,;]+/).map(s=>s.trim().toLowerCase()).filter(Boolean) : [];
      entries.push({type,citekey,title,author,year:year || '0',venue,keywords});
    }
    return entries;
  }

  function renderPubs(list){
    pubList.innerHTML = '';
    list.forEach(pub=>{
      const art = document.createElement('article');
      art.className = 'pub-item';
      art.dataset.tags = (pub.keywords || []).join(',');
      art.dataset.year = pub.year || '0';
      art.innerHTML = `
        <h4 class="pub-title">${pub.title || pub.citekey}</h4>
        <p class="pub-meta">${pub.venue || ''} ${pub.year ? '— '+pub.year : ''}</p>
        <p class="pub-abs muted">${pub.author || ''}</p>
      `;
      pubList.appendChild(art);
    });
    refreshTagCloud();
  }

  function refreshTagCloud(){
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

  function applyTagFilter(){
    const active = qsa('.tag-chip.active').map(b=>b.dataset.tag);
    qsa('.pub-item').forEach(it=>{
      const tags = (it.dataset.tags||'').split(',').map(s=>s.trim()).filter(Boolean);
      if(active.length===0) { it.style.display=''; return; }
      // visible if pub contains all active tags
      const ok = active.every(a=> tags.includes(a));
      it.style.display = ok ? '' : 'none';
    });
  }

  function sortPubs(mode){
    const items = Array.from(qsa('.pub-item'));
    const container = pubList;
    const cmp = {
      'year_desc': (a,b)=> parseInt(b.dataset.year||0) - parseInt(a.dataset.year||0),
      'year_asc': (a,b)=> parseInt(a.dataset.year||0) - parseInt(b.dataset.year||0),
      'title_asc': (a,b)=> a.querySelector('.pub-title').textContent.localeCompare(b.querySelector('.pub-title').textContent)
    }[mode] || (()=>0);
    items.sort(cmp).forEach(i=>container.appendChild(i));
  }

  // File import
  if(bibInput){
    bibInput.addEventListener('change', async (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const text = await file.text();
      const entries = parseBibtex(text);
      // convert entries to internal format
      const pubs = entries.map(en=>({citekey:en.citekey, title:en.title, author:en.author, year:en.year, venue:en.venue, keywords:en.keywords}));
      renderPubs(pubs);
    });
  }

  // Paste bib
  if(pasteBtn){
    pasteBtn.addEventListener('click', ()=>{
      const t = prompt('Paste BibTeX entries here (or Cancel)');
      if(!t) return;
      const entries = parseBibtex(t);
      const pubs = entries.map(en=>({citekey:en.citekey, title:en.title, author:en.author, year:en.year, venue:en.venue, keywords:en.keywords}));
      renderPubs(pubs);
    });
  }

  // Sorting
  sortSelect && sortSelect.addEventListener('change', ()=> sortPubs(sortSelect.value));

  // Initialize tag cloud for placeholder pubs
  refreshTagCloud();

})();
