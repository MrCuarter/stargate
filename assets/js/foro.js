// STARGATE — foro dinámico semanal. foro.html?per=<id> | ?inicio=YYYY-MM-DD[&tipo=PUA][&embed=1][&semana=N] | ?todos=1[&tipo=PUA]
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), SEM=window.SG_SEMANAS||[], root=document.getElementById('foro-app'); if(!root) return;
  var q=new URLSearchParams(location.search); if(q.get('embed')==='1') document.body.classList.add('embed');
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  // resuelve el placeholder del tablero: con PER conocido pone su id; sin PER deja el enlace genérico
  function resolverTablero(txt,perId){txt=String(txt==null?'':txt);
    return perId?txt.split('{id-del-PER}').join(perId):txt.split('?per={id-del-PER}').join('');}
  // mensaje del foro: escapado + URLs clicables
  function msgHtml(txt,perId){var t=esc(resolverTablero(txt,perId));
    return t.replace(/https?:\/\/[^\s<»)]+/g,function(u){return '<a href="'+u+'" target="_blank" rel="noopener">'+u+'</a>';});}
  function yt(v,c){return '<div class="yt" data-id="'+v.id+'" role="button" tabindex="0"><img src="https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg" alt=""><span class="play">▶</span><div class="cap"><b>'+esc(v.titulo)+'</b><em>'+esc(c)+'</em></div></div>';}
  function wire(){Array.prototype.forEach.call(root.querySelectorAll('.yt'),function(el){el.onclick=function(){if(el.classList.contains('on'))return;var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+el.getAttribute('data-id')+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;el.insertBefore(f,el.firstChild);el.classList.add('on');};});}
  // PUA: un tema por semana -> fusiona las semanas regulares de cada tema
  function semanasPua(){var porTema={};SEM.forEach(function(s){var t=s.tema_n;if(!t)return;(porTema[t]=porTema[t]||[]).push(s);});
    return Object.keys(porTema).sort(function(a,b){return a-b;}).map(function(t,i){var l=porTema[t];return {sem:i+1,tema:l[0].tema.replace(' (cont.)',''),sub:l.map(function(s){return s.sub;}).join(' · '),capitulo:l[0].capitulo,videos:[].concat.apply([],l.map(function(s){return s.videos;})),lanza:[].concat.apply([],l.map(function(s){return s.lanza;})),insignias:[].concat.apply([],l.map(function(s){return s.insignias;})),foro:l.map(function(s){return s.foro;}).join('\n\n— · —\n\n'),hito:l.map(function(s){return s.hito;}).join(' · ')};});}
  function pintar(inicio,tipo,nombre){var sem=tipo==='PUA'?semanasPua():SEM;var n=sem.length;var hoy=new Date();hoy.setHours(0,0,0,0);
    var ini=inicio?new Date(inicio+'T00:00:00'):null;var actual=ini?Math.floor((hoy-ini)/(7*864e5))+1:1;var forzada=parseInt(q.get('semana')||'0',10);if(forzada)actual=forzada;
    var estado=actual<1?'antes':actual>n?'fin':'curso';var idx=Math.min(Math.max(actual,1),n)-1;var s=sem[idx];
    var cab='<div class="tab-head"><div><div class="eyebrow amber">Foro dinámico'+(nombre?' · '+esc(nombre):'')+(tipo==='PUA'?' · PUA':'')+'</div><h3>'+(estado==='antes'?'La misión aún no ha empezado':estado==='fin'?'Misión completada':'Semana '+s.sem+' de '+n)+'</h3></div>'
      +'<div class="small muted">'+(ini?'semana 1: '+esc(inicio):'sin fecha de inicio')+'</div></div>';
    var nav='<div class="foro-nav">'+sem.map(function(x){return '<a href="?'+(q.get('per')?'per='+encodeURIComponent(q.get('per')):'inicio='+esc(inicio||'')+'&tipo='+tipo)+'&semana='+x.sem+(document.body.classList.contains('embed')?'&embed=1':'')+'" class="'+(x.sem===s.sem?'on':x.sem<actual?'past':'')+'">'+x.sem+'</a>';}).join('')+'</div>';
    var cuerpo='<div class="foro-card">'+(s.capitulo?'<span class="pill amber">Nuevo capítulo: '+esc(s.capitulo)+'</span>':'')+'<h2>'+esc(s.tema)+'</h2><div class="muted">'+esc(s.sub)+'</div>'
      +'<pre class="foro-msg">'+msgHtml(s.foro,q.get('per'))+'</pre>'
      +(s.lanza.length?'<h4>🗝️ Retos de la semana</h4><ul>'+s.lanza.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')
      +(s.insignias.length?'<h4>🏅 Insignias en juego</h4><div class="dots">'+s.insignias.map(function(k){return '<img class="dot" src="assets/img/insignias/'+k+'.png" title="'+k+'">';}).join('')+'</div>':'')
      +'<h4>🎬 Vídeos de la semana</h4><div class="yt-list three">'+s.videos.map(function(v){return yt(v[0],v[1]);}).join('')+'</div>'
      +'<p class="small muted">Hito: '+esc(s.hito)+'</p></div>';
    root.innerHTML=cab+nav+cuerpo;wire();}
  // ?todos=1 — TODOS los mensajes, semana a semana, listos para copiar (para el profe que los publica a mano en el foro)
  function pintarTodos(tipo,perId,nombre){var semT=tipo==='PUA'?semanasPua():SEM;
    root.innerHTML='<div class="tab-head"><div><div class="eyebrow amber">Todos los mensajes'+(nombre?' · '+esc(nombre):'')+(tipo==='PUA'?' · PUA':'')+'</div><h3>'+semT.length+' mensajes del foro, listos para copiar</h3></div>'
      +'<div class="small muted"><a href="foro.html'+(perId?'?per='+encodeURIComponent(perId):'')+'">← volver a la semana en curso</a></div></div>'
      +'<p class="small muted">La firma es siempre «Capitán», a secas. Revisa las herramientas citadas (son ejemplos)'+(perId?'':' y, donde aparezca el enlace del tablero, añade el de tu PER')+'.</p>'
      +semT.map(function(s){
        return '<div class="foro-card" style="margin-bottom:22px">'+(s.capitulo?'<span class="pill amber">Nuevo capítulo: '+esc(s.capitulo)+'</span>':'')
          +'<h2>Semana '+s.sem+' · '+esc(s.tema)+'</h2><div class="muted">'+esc(s.sub)+'</div>'
          +'<button class="copy" type="button" data-sem="'+s.sem+'" style="margin:10px 0 6px">Copiar texto</button>'
          +'<pre class="foro-msg" id="msg'+s.sem+'">'+msgHtml(s.foro,perId)+'</pre></div>';
      }).join('');
    Array.prototype.forEach.call(root.querySelectorAll('button.copy[data-sem]'),function(b){
      b.addEventListener('click',function(){var t=document.getElementById('msg'+b.getAttribute('data-sem')); if(!t)return;
        var txt=t.innerText; function ok(){b.textContent='¡Copiado!';setTimeout(function(){b.textContent='Copiar texto';},1800);}
        if(navigator.clipboard){navigator.clipboard.writeText(txt).then(ok);}else{var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();ok();}});});}
  var per=q.get('per'), todos=q.get('todos')==='1';
  if(per&&API){fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){var p=(d.pers||[]).filter(function(x){return x.id===per;})[0];if(!p){root.innerHTML='<p class="lead">PER no encontrado.</p>';return;}todos?pintarTodos(p.tipo,per,p.nombre):pintar(p.inicio,p.tipo,p.nombre);}).catch(function(){todos?pintarTodos((q.get('tipo')||'REGULAR').toUpperCase(),per,''):pintar(q.get('inicio'),q.get('tipo')||'REGULAR','');});}
  else if(todos) pintarTodos((q.get('tipo')||'REGULAR').toUpperCase(),null,'');
  else pintar(q.get('inicio'),(q.get('tipo')||'REGULAR').toUpperCase(),'');
})();
