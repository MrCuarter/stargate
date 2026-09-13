(function(){
  var out = { recortadas: [], solapes: [], tapados: [] };
  function desc(e){ var c = (typeof e.className === 'string' && e.className.trim()) ? '.' + e.className.trim().split(/\s+/)[0] : '';
    var t = (e.getAttribute && (e.getAttribute('alt') || e.getAttribute('aria-label') || e.getAttribute('title'))) || (e.textContent || '').trim();
    return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + c + (t ? ' «' + String(t).replace(/\s+/g, ' ').slice(0, 22) + '»' : ''); }
  // `checkVisibility` sabe lo que no se ve aunque tenga medidas: el contenido de un <details> cerrado
  function visible(e){ if (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    var s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    var r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; }
  // lo que va pegado arriba (la barra de la web, la de la Nave…): lo que pasa por debajo no está «tapado»
  // y se APILAN: la barra de la Nave se pega debajo de la de la web, no arriba del todo
  function techo(){ var bs = [];
    [].slice.call(document.querySelectorAll('body *')).forEach(function(x){
      var s = getComputedStyle(x); if (s.position !== 'sticky' && s.position !== 'fixed') return;
      if (capa(x) || !visible(x)) return; var r = x.getBoundingClientRect();
      if (r.bottom < innerHeight * 0.4 && r.width > innerWidth * 0.5) bs.push(r); });
    bs.sort(function(a, b){ return a.top - b.top; });
    var m = 0; bs.forEach(function(r){ if (r.top <= m + 2) m = Math.max(m, r.bottom); });
    return m; }
  function capa(e){ return e.closest && e.closest('.tour,.tour-invite,#nave-onboard,.modal,.lupa,dialog,[role=dialog],.sb-velo,.sobre-velo,.nebula-dialogo'); }
  // 1 · imágenes RECORTADAS por su caja (overflow hidden/clip), no por un carril que se desliza
  [].slice.call(document.images).forEach(function(im){
    if (!visible(im)) return; var r = im.getBoundingClientRect(); if (r.width < 28 || r.height < 28) return;
    var v = { l: r.left, t: r.top, r: r.right, b: r.bottom }, p = im.parentElement, desliza = false;
    while (p && p !== document.documentElement) { var ps = getComputedStyle(p);
      var ox = ps.overflowX, oy = ps.overflowY;
      if (/auto|scroll/.test(ox + oy)) { desliza = true; break; }
      if (ox !== 'visible' || oy !== 'visible') { var q = p.getBoundingClientRect();
        v = { l: Math.max(v.l, q.left), t: Math.max(v.t, q.top), r: Math.min(v.r, q.right), b: Math.min(v.b, q.bottom) }; }
      p = p.parentElement; }
    if (desliza) return;
    var a = r.width * r.height, va = Math.max(0, v.r - v.l) * Math.max(0, v.b - v.t);
    if (va > 0 && va / a < 0.6) out.recortadas.push(desc(im) + ' se ve el ' + Math.round(va / a * 100) + '% (' + Math.round(r.width) + '×' + Math.round(r.height) + ' en ' + Math.round(v.r - v.l) + '×' + Math.round(v.b - v.t) + ')');
  });
  // 2 · SOLAPES entre hermanas que van en el flujo (no las que se colocan encima a propósito)
  var SEL = '.card,.btn,button,input,select,textarea,.chip,.gp,.tile,img,h1,h2,h3,h4,p,label,li,figure,.gp-b,.nc,.pest';
  var vistos = new Set();
  [].slice.call(document.querySelectorAll(SEL)).forEach(function(e){
    var padre = e.parentElement; if (!padre || vistos.has(padre)) return; vistos.add(padre);
    var hs = [].slice.call(padre.children).filter(function(x){ if (!x.matches(SEL) || !visible(x) || capa(x)) return false;
      var s = getComputedStyle(x); return s.position === 'static' || s.position === 'relative'; });
    for (var i = 0; i < hs.length; i++) for (var j = i + 1; j < hs.length; j++) {
      var A = hs[i].getBoundingClientRect(), B = hs[j].getBoundingClientRect();
      var ix = Math.min(A.right, B.right) - Math.max(A.left, B.left), iy = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
      if (ix > 6 && iy > 6) out.solapes.push(desc(hs[i]) + ' ⟂ ' + desc(hs[j]) + ' (' + Math.round(ix) + '×' + Math.round(iy) + ' px)');
    }
  });
  // 3 · CAPAS: lo que se puede pulsar y está TAPADO por otra cosa (se recorre la página entera)
  var raiz = document.documentElement, antes = raiz.style.scrollBehavior; raiz.style.scrollBehavior = 'auto';
  var alto = Math.max(document.body.scrollHeight, raiz.scrollHeight), paso = Math.round(innerHeight * 0.8), vistosT = new Set();
  for (var y = 0; y < alto; y += paso) {
    scrollTo(0, y);
    var barra = techo();
    [].slice.call(document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button]')).forEach(function(e){
      if (vistosT.has(e) || !visible(e) || capa(e) || e.closest('.nav')) return;
      // un enlace que ocupa dos líneas no tiene «centro»: se mide su primer trozo
      var r = (getComputedStyle(e).display === 'inline' && e.getClientRects().length) ? e.getClientRects()[0] : e.getBoundingClientRect();
      if (r.top < barra + 6 || r.bottom > innerHeight - 4 || r.left < 0 || r.right > innerWidth) return;
      if (getComputedStyle(e).pointerEvents === 'none') return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, h = document.elementFromPoint(cx, cy);
      if (!h || h === e || e.contains(h) || h.contains(e) && h.tagName === 'LABEL') { vistosT.add(e); return; }
      if (capa(h)) return;   // lo tapa una visita guiada o un diálogo abierto: es a propósito
      if (h.closest('label') && h.closest('label').contains(e)) { vistosT.add(e); return; }
      vistosT.add(e); out.tapados.push(desc(e) + ' tapado por ' + desc(h));
    });
  }
  scrollTo(0, 0); raiz.style.scrollBehavior = antes;
  out.recortadas = out.recortadas.slice(0, 8); out.solapes = out.solapes.slice(0, 8); out.tapados = out.tapados.slice(0, 8);
  return out;
})()
