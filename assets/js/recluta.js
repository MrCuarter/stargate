// STARGATE — La Nave del Recluta (web del alumnado por PER)
// recluta.html?per=<id>[&embed=1][&semana=N]  ·  sin ?per: selector de PER
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), SEM=window.SG_SEMANAS||[], NOMBRES=window.SG_BADGE_NAMES||{},
      BADGES=window.SG_BADGES||[], PLAN=window.SG_PLANETAS||[], root=document.getElementById('nave-app');
  if(!root) return;
  var q=new URLSearchParams(location.search); if(q.get('embed')==='1') document.body.classList.add('embed');
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function msgHtml(txt,perId){txt=String(txt==null?'':txt);
    txt=perId?txt.split('{id-del-PER}').join(perId):txt.split('?per={id-del-PER}').join('');
    return esc(txt).replace(/https?:\/\/[^\s<»)]+/g,function(u){return '<a href="'+u+'" target="_blank" rel="noopener">'+u+'</a>';});}
  function ytb(v,c){return '<div class="yt" data-id="'+v.id+'" role="button" tabindex="0"><img loading="lazy" src="https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg" alt=""><span class="play">▶</span><div class="cap"><b>'+esc(v.titulo)+'</b><em>'+esc(c)+'</em></div></div>';}
  function wireYt(el){Array.prototype.forEach.call(el.querySelectorAll('.yt'),function(y){y.onclick=function(){if(y.classList.contains('on'))return;var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+y.getAttribute('data-id')+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;y.insertBefore(f,y.firstChild);y.classList.add('on');};});}
  function minis(keys){return keys.map(function(k){return '<figure class="mini badge"><img loading="lazy" src="assets/img/insignias/'+k+'.png" alt="'+esc(NOMBRES[k]||k)+'"><figcaption>'+esc(NOMBRES[k]||k)+'</figcaption></figure>';}).join('');}

  // ---------- sin PER: selector ----------
  var per=q.get('per');
  if(!per){
    if(!API){root.innerHTML='<p class="lead">La nave aún no está conectada.</p>';return;}
    root.innerHTML='<p class="lead">Cargando la lista de PERs…</p>';
    fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){
      var pers=d.pers||[];
      root.innerHTML='<div class="card"><h3>¿De qué PER eres recluta?</h3><p class="small muted">Elige tu grupo para entrar en tu nave. Si no lo sabes, pregunta a tu Capitán.</p>'
        +pers.map(function(p){return '<p><a class="btn" href="recluta.html?per='+encodeURIComponent(p.id)+'">🚀 '+esc(p.nombre)+' · '+esc(p.tipo)+'</a></p>';}).join('')+'</div>';
    }).catch(function(){root.innerHTML='<p class="lead">No se pudo cargar la lista de PERs.</p>';});
    return;
  }

  // ---------- estado ----------
  var st={d:null,semanas:[],actual:1,estado:'curso',alias:localStorage.getItem('sgNaveAlias_'+per)||''};

  function recluta(){if(!st.alias||!st.d)return null;return (st.d.reclutas||[]).filter(function(x){return x.alias===st.alias;})[0]||null;}

  // ---------- secciones ----------
  function cabecera(){
    var d=st.d,n=st.semanas.length;
    var pos=st.estado==='antes'?'La misión aún no ha empezado':st.estado==='fin'?'Misión completada — la puerta está abierta':'Semana '+st.actual+' de '+n;
    return '<div class="tab-head"><div><div class="eyebrow teal">La Nave del Recluta · '+esc(d.nombre)+(d.tipo==='PUA'?' · PUA':'')+'</div><h3>'+pos+'</h3></div>'
      +'<div class="small muted"><button class="btn small" id="btn-onboard" type="button">▶ Repetir bienvenida</button></div></div>';
  }
  function accesos(){
    var d=st.d;
    return '<div class="cta-row nave-accesos">'
      +(d.formBitacora?'<a class="btn primary" href="'+esc(d.formBitacora)+'" target="_blank" rel="noopener">📓 Registrar una insignia</a>':'')
      +(d.formTicket?'<a class="btn" href="'+esc(d.formTicket)+'" target="_blank" rel="noopener">🎟️ Contacta con NEBULA</a>':'')
      +'<a class="btn" href="registro.html?per='+encodeURIComponent(per)+'" target="_blank" rel="noopener">🏆 Tablero completo</a></div>';
  }
  function mapa(){
    var idxSel=parseInt(q.get('semana')||'0',10);
    var tiles=PLAN.map(function(p,i){
      var t=i+1; var sems=st.semanas.filter(function(s){return s.tema_n===t;});
      var abre=sems.length?sems[0].sem:99; var abierto=st.actual>=abre&&st.estado!=='antes';
      var actual=sems.some(function(s){return s.sem===st.actual;});
      if(!abierto) return '<div class="nave-pl lock"><img src="assets/img/planetas/'+p[0]+'.png" alt=""><b>???</b><em>🔇 Señal bloqueada · semana '+abre+'</em></div>';
      return '<div class="nave-pl on'+(actual?' actual':'')+'" data-tema="'+t+'" role="button" tabindex="0"><img src="assets/img/planetas/'+p[0]+'.png" alt="'+esc(p[1])+'"><b>'+esc(p[1])+'</b><em>'+esc(p[2])+'</em></div>';
    }).join('');
    return '<section><div class="eyebrow">El viaje</div><h2>Los ocho planetas</h2>'
      +'<p class="lead">Cada semana la nave avanza sola: los planetas se van desbloqueando con el calendario. Pulsa uno visitado para volver a ver sus órdenes, vídeos y retos.</p>'
      +'<div class="nave-mapa">'+tiles+'</div><div id="nave-detalle"></div></section>';
  }
  function fichaSemana(s,titulo){
    return '<div class="foro-card">'+(s.capitulo?'<span class="pill amber">Nuevo capítulo: '+esc(s.capitulo)+'</span>':'')
      +'<h2>'+esc(titulo||('Semana '+s.sem+' · '+s.tema))+'</h2><div class="muted">'+esc(s.sub)+'</div>'
      +'<pre class="foro-msg">'+msgHtml(s.foro,per)+'</pre>'
      +(s.lanza.length?'<h4>🗝️ Retos</h4><ul>'+s.lanza.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')
      +(s.insignias.length?'<h4>🏅 Insignias en juego</h4><div class="minis">'+minis(s.insignias)+'</div>':'')
      +(s.videos.length?'<h4>🎬 Vídeos</h4><div class="yt-list three">'+s.videos.map(function(v){return ytb(v[0],v[1]);}).join('')+'</div>':'')
      +'</div>';
  }
  function estaSemana(){
    if(st.estado==='antes') return '<section><div class="eyebrow amber">Esta semana</div><h2>En la rampa de lanzamiento</h2><p class="lead">La misión empieza el '+esc(st.d.inicio)+'. Mientras tanto: preséntate ante el mando y registra tu alias en la <a href="'+esc(st.d.formBitacora||'#')+'" target="_blank" rel="noopener">Bitácora de mando</a>.</p></section>';
    var idx=Math.min(Math.max(st.actual,1),st.semanas.length)-1; var s=st.semanas[idx];
    var tit=st.estado==='fin'?'Última orden — Semana '+s.sem+' · '+s.tema:'Semana '+s.sem+' · '+s.tema;
    return '<section><div class="eyebrow amber">La orden de la semana</div><h2>Esta semana en la nave</h2>'+fichaSemana(s,tit)+'</section>';
  }
  function miEstado(){
    var lista=(st.d.reclutas||[]).slice().sort(function(a,b){return a.alias.localeCompare(b.alias);});
    var sel='<div class="selrow"><select id="sel-alias"><option value="">Soy… (elige tu alias)</option>'
      +lista.map(function(x){return '<option value="'+esc(x.alias)+'"'+(x.alias===st.alias?' selected':'')+'>'+esc(x.alias)+'</option>';}).join('')+'</select></div>';
    var r=recluta(); var panel='';
    if(st.alias&&!r) panel='<p class="small muted">No encuentro el alias «'+esc(st.alias)+'». ¿Ya te registraste en la Bitácora de mando?</p>';
    if(r){
      var SG=window.SG||{}; var av=SG.avatarImg?SG.avatarImg(r.avatar,r.alias,'grande',r.xp,st.d.tipo):'';
      var k=st.d.tipo==='PUA'?3500/4500:1; var u=[1000*k,2500*k,4000*k]; var rg=SG.rango?SG.rango(r.xp,st.d.tipo):1;
      var sig=rg<4?u[rg-1]:null; var base=rg>1?u[rg-2]:0;
      var pct=sig?Math.min(100,Math.round((r.xp-base)/(sig-base)*100)):100;
      var barra=sig?'<div class="progress" title="'+r.xp+' / '+Math.round(sig)+' xp"><i style="width:'+pct+'%"></i></div><p class="small muted">'+(Math.round(sig)-r.xp)+' xp para el rango '+(SG.RANGOS?SG.RANGOS[rg]:'siguiente')+'</p>'
                   :'<p class="small muted">Rango máximo alcanzado. 🫡</p>';
      var col=BADGES.map(function(kk){var tiene=(r.insignias||[]).indexOf(kk)>=0;
        return '<div class="b'+(tiene?'':' no')+'" title="'+esc(NOMBRES[kk]||kk)+(tiene?'':' · pendiente')+'"><img loading="lazy" src="assets/img/insignias/'+kk+'.png" alt=""><span>'+esc(NOMBRES[kk]||kk)+'</span></div>';}).join('');
      panel='<div class="grid cols-2 nave-estado"><div class="card"><div class="nave-perfil">'+av
        +'<div><h3>'+esc(r.alias)+'</h3><p class="small">'+(SG.RANGOS?'<b>'+SG.RANGOS[rg-1]+'</b> · ':'')+'puesto '+r.pos+' de '+lista.length+' · planeta '+esc(r.planeta)+'</p>'
        +'<p><b>'+r.xp+'</b> xp ganados · <b>'+r.xp_disponibles+'</b> xp disponibles</p></div></div>'+barra+'</div>'
        +'<div class="card"><h3>Tu colección · '+ (r.insignias||[]).length+' / '+BADGES.length+'</h3><div class="badge-col">'+col+'</div></div></div>';
    }
    return '<section><div class="eyebrow teal">Mi estado</div><h2>Tu ficha de recluta</h2>'
      +'<p class="lead">Elige tu alias (el que pusiste en la Bitácora de mando); la nave lo recordará en este dispositivo.</p>'+sel+'<div id="estado-panel">'+panel+'</div></section>';
  }
  function recompensas(){
    var d=st.d; var cat=d.recompensas||[]; var n=st.semanas.length; var r=recluta();
    if(!cat.length) return '<section><div class="eyebrow violet">Recompensas</div><h2>El canje de xp</h2><p class="lead">Tus xp se pueden canjear por recompensas. El catálogo se abrirá pronto en la nave; mientras tanto, tu Capitán tiene la lista.</p>'
      +(d.formCanje?'<a class="btn" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Ir al formulario de canje</a>':'')+'</section>';
    var abiertas=0;
    var cards=cat.map(function(x){
      var desde=window.SGCAL.desdeEfectiva(x.desde||14,d.tipo,n); var abierta=st.estado!=='antes'&&st.actual>=desde;
      if(!abierta) return '<div class="card rec-card lock"><h3>🔒 Recompensa clasificada</h3><p class="small muted">Se desbloquea en la semana '+desde+'.</p></div>';
      abiertas++;
      var afford=r?(r.xp_disponibles>=x.coste?'<span class="chip ok">Te lo puedes permitir</span>':'<span class="chip wip">Te faltan '+(x.coste-r.xp_disponibles)+' xp</span>'):'';
      var aviso=x.tipo==='nota'?'<p class="small muted">⏳ Se hace efectiva al terminar las clases en directo.</p>':x.tipo==='avatar'||x.tipo==='avatar_url'?'<p class="small muted">⚡ Automática: si se concede, tu avatar cambia solo en el tablero.</p>':'';
      return '<div class="card rec-card"><h3>'+esc(x.nombre)+'</h3><p class="pts">'+x.coste+' xp</p><p class="small">'+esc(x.desc||'')+'</p>'+aviso+afford+'</div>';
    }).join('');
    return '<section><div class="eyebrow violet">Recompensas</div><h2>El canje de xp</h2>'
      +'<p class="lead">Tus xp son del juego (no son nota)… pero se pueden gastar. Las recompensas se desbloquean con el viaje.</p>'
      +'<div class="grid cols-3 nave-rec">'+cards+'</div>'
      +(abiertas&&d.formCanje?'<p style="margin-top:14px"><a class="btn primary" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Canjear una recompensa</a></p>':'<p class="small muted" style="margin-top:14px">Aún no hay recompensas canjeables: sigue sumando xp.</p>')
      +'</section>';
  }

  // ---------- onboarding NEBULA ----------
  var PASOS=[
    {t:'Canal abierto, recluta',x:'Soy <b>NEBULA</b>, la inteligencia de esta nave. La galaxia se apaga por <b>la Estática</b> — un silencio que hace que nadie cree, registre ni comparta. Cruzarás <b>ocho planetas</b> (los ocho temas del curso) para reencenderla. Esta es tu nave.'},
    {t:'Tu arma: la Bitácora',x:'Contra la Estática no sirven las armas: sirve <b>dejar constancia</b>. Tu <b>Bitácora Estelar</b> es tu ePortfolio: cada evidencia que registres la hace más fuerte. Cuando esté completa, la puerta a la Tierra se abrirá.'},
    {t:'Alístate',x:'Tu primer acto: la <b>Bitácora de mando</b>. Elige tu <b>alias</b> y tu <b>avatar</b> (¡evoluciona con tus xp!) y gana la insignia de <b>Reclutamiento</b>. Cada vez que superes un reto, vuelve, marca la casilla y envía.'},
    {t:'La nave avanza sola',x:'Cada semana se desbloquea una nueva orden: el planeta, sus vídeos, sus <b>dos retos</b> y sus insignias. Los planetas futuros están en silencio… de momento. Vuelve cada semana.'},
    {t:'Tu ficha de recluta',x:'Abajo, en <b>Mi estado</b>, elige tu alias: verás tu avatar con su <b>rango</b>, tus xp, tu puesto y tu colección de insignias — las que tienes a color, las que faltan en sombra.'},
    {t:'Los xp se gastan',x:'Tus xp no son nota, pero valen: la sección de <b>recompensas</b> se irá desbloqueando durante el viaje. Y si te pierdes, usa el ticket <b>«Contacta con NEBULA»</b>: te leo, aunque sea anónimo. Corto y cierro.'}
  ];
  function onboarding(i){
    var ov=document.getElementById('nave-onboard');
    if(!ov){ov=document.createElement('div');ov.id='nave-onboard';ov.className='tour open';document.body.appendChild(ov);}
    if(i>=PASOS.length){ov.classList.remove('open');ov.innerHTML='';localStorage.setItem('sgNaveOnboard_'+per,'1');return;}
    var s=PASOS[i];
    ov.innerHTML='<div class="tour-box"><img class="tour-cap nebula" src="assets/img/personajes/nebula.png" alt="NEBULA">'
      +'<div class="tour-panel"><div class="tour-step">NEBULA · '+(i+1)+' / '+PASOS.length+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p>'
      +'<div class="tour-btns"><button type="button" class="tour-prev"'+(i===0?' disabled':'')+'>← Anterior</button>'
      +'<button type="button" class="tour-next primary">'+(i===PASOS.length-1?'A la nave ✓':'Siguiente →')+'</button>'
      +'<button type="button" class="tour-exit">Salir</button></div></div></div>';
    ov.querySelector('.tour-prev').onclick=function(){onboarding(i-1);};
    ov.querySelector('.tour-next').onclick=function(){onboarding(i+1);};
    ov.querySelector('.tour-exit').onclick=function(){onboarding(PASOS.length);};
  }

  // ---------- render ----------
  function render(){
    root.innerHTML=cabecera()+accesos()+estaSemana()+mapa()+miEstado()+recompensas();
    wireYt(root);
    var det=root.querySelector('#nave-detalle');
    Array.prototype.forEach.call(root.querySelectorAll('.nave-pl.on'),function(el){
      function abrir(){var t=Number(el.getAttribute('data-tema'));
        var sems=st.semanas.filter(function(s){return s.tema_n===t&&(st.estado==='fin'||s.sem<=st.actual);});
        det.innerHTML=sems.map(function(s){return fichaSemana(s);}).join('');wireYt(det);det.scrollIntoView({behavior:'smooth',block:'start'});}
      el.addEventListener('click',abrir);
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();abrir();}});
    });
    var sa=root.querySelector('#sel-alias');
    if(sa)sa.onchange=function(){st.alias=this.value;if(st.alias)localStorage.setItem('sgNaveAlias_'+per,st.alias);else localStorage.removeItem('sgNaveAlias_'+per);render();};
    var ob=root.querySelector('#btn-onboard'); if(ob)ob.onclick=function(){onboarding(0);};
  }

  // ---------- carga ----------
  if(!API){root.innerHTML='<p class="lead">La nave aún no está conectada.</p>';return;}
  root.innerHTML='<p class="lead">Estableciendo conexión con NEBULA…</p>';
  fetch(API+'?per='+encodeURIComponent(per),{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){
    if(d.error){root.innerHTML='<p class="lead">PER no encontrado. Pregunta a tu Capitán por el enlace bueno.</p>';return;}
    st.d=d; st.semanas=window.SGCAL.vista(d.tipo,SEM);
    var a=window.SGCAL.semanaActual(d.inicio); var forzada=parseInt(q.get('semana')||'0',10); if(forzada)a=forzada;
    st.actual=a==null?1:a;
    st.estado=a==null?'curso':a<1?'antes':a>st.semanas.length?'fin':'curso';
    if(st.estado==='fin')st.actual=st.semanas.length;
    if(st.estado==='antes')st.actual=0;
    render();
    if(!localStorage.getItem('sgNaveOnboard_'+per))onboarding(0);
  }).catch(function(){root.innerHTML='<p class="lead">No se pudo contactar con NEBULA. Prueba a recargar.</p>';});
})();
