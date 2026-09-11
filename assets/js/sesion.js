// STARGATE — LA SESIÓN DE LA SEMANA. sesion.html?per=<id>[&sem=N]
//
// 🔴 POR QUÉ EXISTE (pedido por Norberto el 11-sep): el temario, los vídeos, los retos, las insignias
// y el hito de cada semana son LOS MISMOS para todo el profesorado. Hasta hoy cada docente se montaba
// su Genially para explicarlo en clase. Esta página proyecta esa semana ya montada: el docente
// comparte pantalla y va pasando. Lo que cada uno añade de su cosecha son SUS ejemplos, y para eso
// está la diapositiva en blanco del final.
//
// Dos zonas, y la diferencia importa:
//   · la TIRA DE PREPARACIÓN (arriba) es para el docente: el consejo del Capitán y el mensaje del
//     foro. No se proyecta — al entrar en pantalla completa desaparece.
//   · el MAZO es lo que se ve en clase.
// Si el consejo saliera proyectado, el docente estaría enseñando a sus alumnos cómo les va a dar
// la clase. Por eso son dos zonas y no una.
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), SEM=window.SG_SEMANAS||[],
      PLAN=window.SG_PLANETAS||[], AYU=window.SG_AYUDA_RETOS||{}, RET=window.SG_RETOS||{},
      root=document.getElementById('sesion-app');
  if(!root) return;
  var q=new URLSearchParams(location.search);
  var st={per:q.get('per')||'', d:null, sem:0, i:0, slides:[], tipo:'REGULAR', nombre:'', inicio:'', aviso:''};

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function cargando(t,p){return '<div class="cargando"><div class="txt">'+t+'</div><div class="barra"><i></i></div>'+(p?'<div class="pista">'+p+'</div>':'')+'</div>';}

  // ---------- datos ----------
  // La vista PUA fusiona las semanas de cada tema: el mismo motor que el foro y la Nave, para que
  // nadie tenga que mantener dos calendarios.
  function semanas(){ return window.SGCAL.vista(st.tipo, SEM); }
  function planeta(n){ return PLAN[(Number(n)||1)-1] || null; }
  // `lanza` (el calendario) y el catálogo de retos nombran la misma misión con textos PARECIDOS pero
  // no idénticos: el calendario añade la coletilla de turno — «Reto B «La chispa» (imagen con IA)»
  // frente a «Reto B «La chispa»». Cruzarlos por igualdad exacta dejaba 9 de 19 misiones sin su
  // «qué hay que hacer», y sin ruido: la diapositiva salía, solo que muda. Lo cazó la batería 48.
  // Se cruza por el TÍTULO ENTRECOMILLADO, que es lo estable, y las Actividades —que no lo llevan—
  // por su número. Siempre contra el catálogo REGULAR: los PUA reutilizan los mismos ids.
  function nucleo(txt){
    var t=String(txt||'');
    var m=t.match(/«([^»]+)»/);
    if(m) return m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    var a=t.match(/actividad\s+(\d)/i);
    return a?('actividad '+a[1]):'';
  }
  var _idx=null;
  function idDeReto(txt){
    if(!_idx){
      _idx={};
      (RET.REGULAR||[]).forEach(function(r){
        var k=nucleo(r[1]); if(k&&!_idx[k]) _idx[k]=r[0];
      });
    }
    return _idx[nucleo(txt)]||'';
  }
  function badge(k){ return (window.SG&&window.SG.BADGE&&window.SG.BADGE[k])||null; }

  // ---------- piezas visuales ----------
  function yt(v,cuando){
    return '<div class="yt grande" data-id="'+esc(v.id)+'" role="button" tabindex="0">'
      +'<img src="https://i.ytimg.com/vi/'+esc(v.id)+'/maxresdefault.jpg" alt="" '
      +'onerror="this.src=\'https://i.ytimg.com/vi/'+esc(v.id)+'/hqdefault.jpg\'">'
      +'<span class="play">▶</span>'
      +(cuando?'<div class="cap"><b>'+esc(v.titulo)+'</b><em>'+esc(cuando)+'</em></div>':'')+'</div>';
  }
  function wireYt(scope){
    Array.prototype.forEach.call(scope.querySelectorAll('.yt'),function(el){
      el.onclick=function(){
        if(el.classList.contains('on')) return;
        var f=document.createElement('iframe');
        f.src='https://www.youtube-nocookie.com/embed/'+el.getAttribute('data-id')+'?autoplay=1&rel=0';
        f.allow='autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen=true;
        el.insertBefore(f,el.firstChild); el.classList.add('on');
      };
    });
  }

  // ---------- el mazo ----------
  // Cada diapositiva es {k:clave, rot:rótulo de la tira de pasos, html}. El rótulo se usa en el
  // índice y en la barra inferior: así el docente sabe siempre cuánto queda.
  function construir(s, n){
    var d=[], pl=planeta(s.tema_n);

    // 1 · portada
    d.push({k:'portada', rot:'Portada', html:
      '<div class="dia portada'+(pl?' con-planeta':'')+'">'
      +(pl?'<img class="planeta" src="assets/img/planetas/'+esc(pl[0])+'.png'+(window.SG_IMGV||'')+'" alt="">':'')
      +'<div class="txt">'
      +'<div class="kicker">Semana '+s.sem+' de '+n+(st.nombre?' · '+esc(st.nombre):'')+'</div>'
      +'<h1>'+esc(s.tema)+'</h1>'
      +'<p class="sub">'+esc(s.sub||'')+'</p>'
      +(pl?'<p class="planeta-nom">Planeta <b>'+esc(pl[1])+'</b> · '+esc(pl[2])+'</p>':'')
      +(s.capitulo?'<p class="pill amber">Nuevo capítulo de la historia: «'+esc(s.capitulo)+'»</p>':'')
      +'</div></div>'});

    // 2 · el plan de la sesión (el índice que se proyecta)
    var pasos=[];
    if((s.videos||[]).length) pasos.push(['🎬','Ver '+(s.videos.length===1?'el vídeo':'los '+s.videos.length+' vídeos')+' de la semana']);
    if((s.lanza||[]).length) pasos.push(['🗝️','Lanzar '+(s.lanza.length===1?'la misión':'las '+s.lanza.length+' misiones')]);
    if((s.insignias||[]).length) pasos.push(['🏅','Entregar '+(s.insignias.length===1?'la insignia':'las '+s.insignias.length+' insignias')]);
    if(s.hito) pasos.push(['🎯','Lo que hay que entregar']);
    pasos.push(['📓','Dónde se registra todo']);
    d.push({k:'plan', rot:'El plan', html:
      '<div class="dia plan"><div class="kicker">Semana '+s.sem+'</div><h2>El plan de hoy</h2>'
      +'<ol class="pasos-sesion">'+pasos.map(function(p,i){
        return '<li><span class="n">'+(i+1)+'</span><span class="ico">'+p[0]+'</span><span class="t">'+esc(p[1])+'</span></li>';
      }).join('')+'</ol></div>'});

    // 3 · un vídeo por diapositiva, con su «cuándo» como instrucción
    (s.videos||[]).forEach(function(v,i){
      d.push({k:'video', rot:'Vídeo '+(i+1), html:
        '<div class="dia video"><div class="kicker">🎬 Vídeo '+(i+1)+' de '+s.videos.length+'</div>'
        +'<h2>'+esc(v[0].titulo)+'</h2>'
        +'<p class="cuando">'+esc(v[1]||'')+'</p>'
        +yt(v[0],'')+'</div>'});
    });

    // 4 · las misiones, una por diapositiva, con lo que pide cada una
    (s.lanza||[]).forEach(function(txt,i){
      var id=idDeReto(txt), pide=id?AYU[id]:'';
      d.push({k:'reto', rot:'Misión '+(i+1), html:
        '<div class="dia reto"><div class="kicker">🗝️ Misión '+(i+1)+' de '+s.lanza.length+'</div>'
        +'<h2>'+esc(txt)+'</h2>'
        +(pide?'<div class="pide"><div class="et">Qué hay que hacer</div><p>'+esc(pide)+'</p></div>'
              :'<p class="sub">Se lanza esta semana. El enunciado completo está en la Bitácora del alumnado.</p>')
        +'</div>'});
    });

    // 5 · insignias en juego (con su historia: es la ceremonia, no un cromo)
    if((s.insignias||[]).length){
      d.push({k:'insignias', rot:'Insignias', html:
        '<div class="dia insignias"><div class="kicker">🏅 Se entregan esta semana</div>'
        +'<h2>'+(s.insignias.length===1?'La insignia en juego':'Las insignias en juego')+'</h2>'
        +'<div class="ins-grid">'+s.insignias.map(function(k){
          var b=badge(k);
          return '<figure><img src="assets/img/insignias/'+esc(k)+'.png" alt="">'
            +'<figcaption><b>'+esc(b?b.nombre:k)+'</b>'
            +(b&&b.como?'<em>'+esc(b.como)+'</em>':'')
            +(b&&b.cita?'<q>'+esc(b.cita)+'</q>':'')+'</figcaption></figure>';
        }).join('')+'</div></div>'});
    }

    // 6 · el hito
    if(s.hito){
      d.push({k:'hito', rot:'Entrega', html:
        '<div class="dia hito"><div class="kicker">🎯 El hito de la semana</div>'
        +'<h2>Lo que hay que entregar</h2><p class="grande">'+esc(s.hito)+'</p>'
        +(s.clases?'<p class="sub">'+esc(s.clases)+'</p>':'')+'</div>'});
    }

    // 7 · dónde se registra (el cierre, siempre igual: es la rutina que hay que repetir)
    var qs=st.per?'?per='+encodeURIComponent(st.per):'';
    d.push({k:'cierre', rot:'Registro', html:
      '<div class="dia cierre"><div class="kicker">📓 Antes de irse</div>'
      +'<h2>Dónde se registra todo</h2>'
      +'<div class="cierre-grid">'
      +'<div class="c"><b>1 · Tu Bitácora de mando</b><p>Cada misión superada se marca ahí. Es lo único obligatorio.</p></div>'
      +'<div class="c"><b>2 · Tu Nave del Recluta</b><p>Ahí ves tus xp, tu nivel, tus créditos ◈ y tu personaje.</p><a class="btn small" href="recluta.html'+qs+'" target="_blank" rel="noopener">Abrir la Nave ↗</a></div>'
      +'<div class="c"><b>3 · El tablero de la clase</b><p>El ranking en vivo. Se proyecta sin nombres ni correos.</p><a class="btn small" href="registro.html'+qs+(st.per?'&':'?')+'solo=1" target="_blank" rel="noopener">Proyectar el tablero ↗</a></div>'
      +'</div></div>'});

    // 8 · la diapositiva en blanco: el hueco de cada docente
    d.push({k:'tuyo', rot:'Tu ejemplo', html:
      '<div class="dia tuyo"><div class="kicker">✋ Tu turno</div>'
      +'<h2>Tu ejemplo</h2>'
      +'<p class="sub">Aquí es donde entras tú: el caso que conoces, el recurso que usaste el año pasado, '
      +'la pregunta que siempre hacen. Esta diapositiva está en blanco a propósito.</p></div>'});

    return d;
  }

  // ---------- pintado ----------
  function tira(){
    var n=semanas().length;
    var celdas=[]; for(var k=1;k<=n;k++){ celdas.push(k); }
    return '<div class="sem-tira">'+celdas.map(function(k){
      return '<button type="button" class="s'+(k===st.sem?' on':'')+'" data-sem="'+k+'">'+k+'</button>';
    }).join('')+'</div>';
  }

  function prep(s){
    return '<div class="prep">'
      +'<div class="prep-cab"><div><div class="eyebrow violet">Solo para ti · no se proyecta</div>'
      +'<h3>Antes de empezar</h3></div>'
      +'<button type="button" class="btn primary" id="proyectar">▶ Proyectar la sesión</button></div>'
      +(s.consejo?'<div class="card consejo"><b>El consejo del Capitán.</b> '+esc(s.consejo)+'</div>':'')
      +(s.clases?'<p class="small muted">'+esc(s.clases)+'</p>':'')
      +(s.foro?'<details class="foro-det"><summary>El mensaje del foro de esta semana (para copiar)</summary>'
        +'<pre class="foro-msg">'+esc(String(s.foro).split('{id-del-PER}').join(st.per||'{id-del-PER}'))+'</pre>'
        +'<button type="button" class="btn small" id="copiarForo">Copiar el mensaje</button></details>':'')
      +'</div>';
  }

  function pintar(){
    var lista=semanas(), n=lista.length;
    if(st.sem<1) st.sem=1; if(st.sem>n) st.sem=n;
    var s=lista[st.sem-1];
    if(!s){ root.innerHTML='<div class="card"><h3>Sin semanas que enseñar</h3></div>'; return; }
    st.slides=construir(s,n);
    if(st.i>=st.slides.length) st.i=st.slides.length-1;
    if(st.i<0) st.i=0;

    root.innerHTML=st.aviso
      +prep(s)
      +tira()
      +'<div class="mazo" id="mazo" tabindex="0" aria-live="polite">'
      +'<div class="lienzo">'+st.slides[st.i].html+'</div>'
      +'<button type="button" class="nav ant" id="ant" aria-label="Anterior">‹</button>'
      +'<button type="button" class="nav sig" id="sig" aria-label="Siguiente">›</button>'
      +'<div class="barra-pasos">'+st.slides.map(function(d,i){
          return '<button type="button" class="p'+(i===st.i?' on':'')+(i<st.i?' past':'')+'" data-i="'+i+'" title="'+esc(d.rot)+'"><span>'+esc(d.rot)+'</span></button>';
        }).join('')+'</div>'
      +'<div class="cuenta">'+(st.i+1)+' / '+st.slides.length+'</div>'
      +'</div>';
    wire();
  }

  function ir(i){
    var n=st.slides.length;
    if(i<0||i>=n) return;
    st.i=i;
    var lienzo=root.querySelector('.lienzo');
    if(lienzo){
      lienzo.innerHTML=st.slides[i].html;
      wireYt(lienzo);
      // la barra y el contador se refrescan solos: son lo único que cambia fuera del lienzo
      Array.prototype.forEach.call(root.querySelectorAll('.barra-pasos .p'),function(b,k){
        b.className='p'+(k===i?' on':k<i?' past':'');
      });
      var c=root.querySelector('.cuenta'); if(c) c.textContent=(i+1)+' / '+n;
    } else pintar();
  }

  function wire(){
    var mazo=root.querySelector('#mazo');
    wireYt(root);
    var a=root.querySelector('#ant'), g=root.querySelector('#sig');
    if(a) a.onclick=function(){ ir(st.i-1); };
    if(g) g.onclick=function(){ ir(st.i+1); };
    Array.prototype.forEach.call(root.querySelectorAll('.barra-pasos .p'),function(b){
      b.onclick=function(){ ir(Number(b.getAttribute('data-i'))); };
    });
    Array.prototype.forEach.call(root.querySelectorAll('.sem-tira .s'),function(b){
      b.onclick=function(){
        st.sem=Number(b.getAttribute('data-sem')); st.i=0;
        try{ var u=new URL(location.href); u.searchParams.set('sem',st.sem); history.replaceState(null,'',u); }catch(e){}
        pintar();
      };
    });
    var pr=root.querySelector('#proyectar');
    if(pr) pr.onclick=function(){
      // pantalla completa sobre el MAZO: así la tira de preparación (el consejo) queda fuera.
      if(mazo&&mazo.requestFullscreen) mazo.requestFullscreen();
      else document.body.classList.toggle('proyectando');
      if(mazo) mazo.focus();
    };
    var cp=root.querySelector('#copiarForo');
    if(cp) cp.onclick=function(){
      var pre=root.querySelector('.foro-det .foro-msg'); if(!pre) return;
      try{ navigator.clipboard.writeText(pre.textContent); cp.textContent='Copiado ✓';
           setTimeout(function(){ cp.textContent='Copiar el mensaje'; },1800); }
      catch(e){ cp.textContent='Selecciónalo y copia'; }
    };
    if(mazo) mazo.focus();
  }

  // teclado: ← → y espacio. Se escucha en el documento porque en pantalla completa el foco puede
  // estar en el iframe de YouTube y entonces el mazo ya no recibe las teclas.
  document.addEventListener('keydown',function(e){
    if(!st.slides.length) return;
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ e.preventDefault(); ir(st.i+1); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); ir(st.i-1); }
  });

  // ---------- arranque ----------
  function arrancar(d){
    if(d&&!d.error){
      st.tipo=(d.tipo||'REGULAR'); st.nombre=d.nombre||''; st.inicio=d.inicio||'';
    }
    var forzada=parseInt(q.get('sem')||'0',10);
    if(forzada) st.sem=forzada;
    else {
      var hoy=window.SGCAL.semanaActual(st.inicio);
      st.sem=hoy&&hoy>0?hoy:1;
    }
    pintar();
  }

  if(!st.per){
    // sin PER no se puede saber ni el tipo ni la semana en curso: se pide, y mientras tanto se
    // enseña el curso REGULAR desde la semana 1, que es mejor que una página vacía.
    st.aviso='<div class="card aviso-per"><h3>¿De qué grupo?</h3>'
      +'<p>Abre esta página desde <a href="clase.html">Mi clase</a> o elige el grupo en el menú <b>Grupos</b>: '
      +'así sé en qué semana vais y si el grupo es PUA. Mientras tanto, este es el calendario estándar.</p></div>';
    arrancar(null);
  } else {
    root.innerHTML=cargando('Preparando la sesión…','Semana en curso de '+esc(st.per));
    var yaArranco=false;
    window.SGCAL.perData(API, st.per, function(d,esCache){
      if(yaArranco) return;            // el dato fresco no puede mover la diapositiva de sitio
      yaArranco=true; arrancar(d);
    });
  }
})();
