(function(){
  var doc=document, root=doc.documentElement;
  var views=[].slice.call(doc.querySelectorAll('[data-view]'));
  var names={}; views.forEach(function(v){names[v.id]=v;});
  var alias={'':'home',work:'home',resume:'about'};
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current='home', baseTitle=doc.title;
  var sheetLabel=doc.getElementById('sheet-label');

  function top(el){return el.getBoundingClientRect().top+window.pageYOffset;}
  function jump(y){window.scrollTo(0,Math.max(0,y));}

  function route(){
    var h='';
    try{h=decodeURIComponent(location.hash.replace(/^#/,''));}catch(e){}
    var special=h==='contact'||h==='main';
    var name=special?current:(alias.hasOwnProperty(h)?alias[h]:h);
    if(!names[name]){name='home';}
    current=name;
    views.forEach(function(v){v.hidden=v.id!==name;});
    [].forEach.call(doc.querySelectorAll('.nav a'),function(a){
      var key=a.getAttribute('data-nav');
      var on=(key==='work'&&name!=='about')||(key==='about'&&name==='about'&&h!=='resume')||(key==='resume'&&h==='resume');
      if(on){a.setAttribute('aria-current','page');}else{a.removeAttribute('aria-current');}
    });
    pauseAll();
    var view=names[name], label=view.getAttribute('data-title')||'';
    doc.title=name==='home'?baseTitle:label+' | '+baseTitle;
    if(sheetLabel){sheetLabel.textContent=label;}
    var spot=h==='work'?doc.getElementById('projects'):h==='resume'?doc.getElementById('resume-block'):special?doc.getElementById(h):null;
    if(spot){jump(top(spot)-(special?70:58));}
    else{jump(0);}
    requestAnimationFrame(rulerY);
  }

  /* videos */
  function pauseAll(){[].forEach.call(doc.querySelectorAll('video'),function(v){try{v.pause();}catch(e){}});}
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var v=en.target;
        if(en.isIntersecting){var p=v.play(); if(p&&p.catch){p.catch(function(){v.setAttribute('controls','');});}}
        else{v.pause();}
      });
    },{threshold:0.5});
    [].forEach.call(doc.querySelectorAll('video[data-loop]'),function(v){io.observe(v);});
  }else{
    [].forEach.call(doc.querySelectorAll('video[data-loop]'),function(v){v.setAttribute('controls','');});
  }

  /* project filter */
  var grid=doc.querySelector('.grid'), chips=[].slice.call(doc.querySelectorAll('.chip'));
  var items=[].slice.call(doc.querySelectorAll('[data-pillars]'));
  var countEl=doc.getElementById('filter-count'), more=doc.getElementById('more');
  var labels={cad:'CAD',electronics:'electronics',test:'testing'};
  function setFilter(f){
    var n=0;
    items.forEach(function(el){
      var ok=f==='all'||(' '+el.getAttribute('data-pillars')+' ').indexOf(' '+f+' ')>-1;
      el.hidden=!ok; if(ok){n++;}
    });
    chips.forEach(function(c){c.setAttribute('aria-pressed',String(c.getAttribute('data-filter')===f));});
    if(grid){grid.classList.toggle('is-filtered',f!=='all');}
    if(more){
      var rows=more.querySelectorAll('.row:not([hidden])').length;
      more.hidden=rows===0;
    }
    if(countEl){countEl.textContent=f==='all'?'':n+' of '+items.length+' projects involve '+labels[f]+'.';}
    requestAnimationFrame(rulerY);
  }
  chips.forEach(function(c){c.addEventListener('click',function(){setFilter(c.getAttribute('data-filter'));});});
  [].forEach.call(doc.querySelectorAll('[data-filter-go]'),function(b){
    b.addEventListener('click',function(){
      setFilter(b.getAttribute('data-filter-go'));
      var p=doc.getElementById('projects'); if(!p){return;}
      window.scrollTo({top:top(p)-58,behavior:reduce?'auto':'smooth'});
    });
  });

  /* in-page jumps */
  doc.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('[data-jump]');
    if(b){
      var t=doc.getElementById(b.getAttribute('data-jump'));
      if(t){window.scrollTo({top:top(t)-64,behavior:reduce?'auto':'smooth'});}
    }
  });

  /* lightbox */
  var lb=doc.querySelector('.lightbox');
  if(lb&&lb.showModal){
    var lbImg=lb.querySelector('img'), lbCap=lb.querySelector('p');
    doc.addEventListener('click',function(e){
      var f=e.target.closest&&e.target.closest('.fig__frame');
      if(!f){return;}
      var im=f.querySelector('img');
      lbImg.src=im.currentSrc||im.src; lbImg.alt=im.alt;
      var cap=f.parentNode.querySelector('figcaption');
      lbCap.textContent=cap?cap.textContent:'';
      lb.showModal();
    });
    lb.addEventListener('click',function(e){if(e.target===lb||e.target.closest('.lightbox__close')){lb.close();}});
  }

  /* copy email */
  [].forEach.call(doc.querySelectorAll('[data-copy]'),function(b){
    b.addEventListener('click',function(){
      var text=b.getAttribute('data-copy'), old=b.textContent;
      function done(msg){b.textContent=msg; setTimeout(function(){b.textContent=old;},1600);}
      try{navigator.clipboard.writeText(text).then(function(){done('Copied');},function(){done('Select and copy');});}
      catch(err){done('Select and copy');}
    });
  });

  /* mat rulers */
  var ry=doc.querySelector('.ruler--y'), rx=doc.querySelector('.ruler--x'), lastN=-1;
  function rulerY(){
    if(!ry||getComputedStyle(ry).display==='none'){return;}
    var n=Math.floor((doc.body.scrollHeight-22)/40);
    if(n===lastN){return;}
    lastN=n;
    var old=ry.querySelectorAll('span'); for(var i=0;i<old.length;i++){ry.removeChild(old[i]);}
    var frag=doc.createDocumentFragment();
    for(var k=1;k<=n;k++){var s=doc.createElement('span'); s.textContent=k; s.style.top=(22+k*40+3)+'px'; frag.appendChild(s);}
    ry.appendChild(frag);
  }
  var t; window.addEventListener('resize',function(){clearTimeout(t); t=setTimeout(function(){lastN=-1; rulerY();},150);});
  if(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches&&rx&&ry){
    var cx=rx.querySelector('.ruler__cursor'), cy=ry.querySelector('.ruler__cursor'), mx=0, my=0, raf=0;
    function paint(){raf=0; cx.style.transform='translateX('+mx+'px)'; cy.style.transform='translateY('+(my+window.pageYOffset)+'px)';}
    function ask(){if(!raf){raf=requestAnimationFrame(paint);}}
    window.addEventListener('pointermove',function(e){mx=e.clientX; my=e.clientY; root.classList.add('has-cursor'); ask();},{passive:true});
    window.addEventListener('scroll',ask,{passive:true});
  }

  /* dark and light mode */
  var modeBtn=doc.querySelector('.mode');
  function showMode(){
    var dark=root.getAttribute('data-mode')!=='light';
    if(modeBtn){
      var label='Switch to '+(dark?'light':'dark')+' mode';
      modeBtn.setAttribute('aria-label',label); modeBtn.setAttribute('title',label);
    }
  }
  if(modeBtn){
    modeBtn.addEventListener('click',function(){
      var next=root.getAttribute('data-mode')==='light'?'dark':'light';
      root.setAttribute('data-mode',next);
      try{localStorage.setItem('ms-mode',next);}catch(e){}
      showMode();
    });
    showMode();
  }

  window.addEventListener('hashchange',route);
  route();
})();
