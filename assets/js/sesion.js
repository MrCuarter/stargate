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
  /**
   * 🔴 ?embed=1 · LA PROYECCIÓN, DENTRO DEL GENIALLY. Norberto: «¿tenemos embed de la proyección de
   * clase para ponerla en Genially a pantalla completa?». No lo tenía — y era el MISMO fallo que ya
   * tuvieron el aula y la llamada a filas: la hoja de estilos sabe esconder cabecera, hero y pie
   * (`body.embed .nav{display:none}`) y nadie ponía la clase. Sin esto, al incrustarla salía el menú
   * entero de la web encima de la diapositiva.
   */
  if (q.get('embed') === '1') document.body.classList.add('embed');
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
  /**
   * ════════ EL OPENING DE LA CLASE ════════
   *
   * Brief de Norberto: «debe servir de opening… sitúa al estudiante: antes, misiones hechas,
   * ranking, tip semanal o invitación, vídeo de inicio, retos que vamos a ver, y acaba con el
   * Genially embebido del grupo para iniciar la clase». Y sobre los datos del grupo: «TODA ESTA
   * INFO ES ORO Y ANIMA A VENCER».
   *
   * 🔴 Y tiene razón en el porqué, que es lo que hace que esto no sea decoración: un ranking
   * genérico no le importa a nadie, pero «esta semana Tritón, Nova y Orion han sacado la insignia
   * de Amara» es gente que está SENTADA EN ESA CLASE. Proyectar eso treinta segundos antes de
   * empezar hace más por la participación que cualquier discurso.
   *
   * Todo sale del tablero que ya se pide para saber la semana: cero peticiones nuevas.
   */
  function vivos(){ return (st.d && st.d.reclutas) || []; }

  /** Top 5, ni uno más: una tabla de treinta nombres proyectada no la lee nadie. */
  function podio(){
    var r = vivos().slice().sort(function(a,b){ return (b.xp||0)-(a.xp||0); }).slice(0,5);
    if(r.length < 3) return '';
    return '<div class="dia datos"><div class="kicker">Cómo va la tripulación</div><h2>Los cinco de arriba</h2>'
      +'<ol class="ses-podio">'+r.map(function(p,i){
        return '<li class="p'+(i+1)+'"><span class="pos">'+(i+1)+'</span>'
          +'<span class="al">'+(p.corona?'👑 ':'')+esc(p.alias)+'</span>'
          +'<span class="xp">'+(p.xp||0)+' xp</span></li>';
      }).join('')+'</ol>'
      +'<p class="ses-pie">Los xp no bajan nunca: esto es trabajo acumulado, no suerte.</p></div>';
  }

  /** Escuadrones POR MEDIA, nunca por suma: si no, gana siempre el más numeroso. */
  function escuadrones(){
    var por={};
    vivos().forEach(function(p){
      var e=p.profe||'—'; (por[e]=por[e]||[]).push(p.xp||0);
    });
    var ks=Object.keys(por).filter(function(k){return k!=='—';});
    if(ks.length<2) return '';
    var filas=ks.map(function(k){
      var v=por[k]; return {n:k, media:Math.round(v.reduce(function(a,b){return a+b;},0)/v.length), cuantos:v.length};
    }).sort(function(a,b){return b.media-a.media;});
    var max=filas[0].media||1;
    return '<div class="dia datos"><div class="kicker">Entre escuadrones</div><h2>¿Quién tira del grupo?</h2>'
      +'<div class="ses-esc">'+filas.map(function(f,i){
        return '<div class="ses-esc-f"><b>'+(i===0?'🏆 ':'')+esc(f.n)+'</b>'
          +'<div class="ses-bar"><i style="width:'+Math.round(f.media*100/max)+'%"></i></div>'
          +'<span>'+f.media+' xp de media · '+f.cuantos+'</span></div>';
      }).join('')+'</div>'
      +'<p class="ses-pie">Por MEDIA, no por suma: así no gana el escuadrón más numeroso, gana el que se mueve.</p></div>';
  }

  /** A quién felicitar hoy, con nombre. Es la diapositiva que más cambia una clase. */
  function logros(){
    var r = vivos().filter(function(p){ return (p.xp7||0) > 0; })
                   .sort(function(a,b){ return (b.xp7||0)-(a.xp7||0); }).slice(0,8);
    if(!r.length) return '';
    return '<div class="dia datos celebra"><div class="kicker">Esta semana</div>'
      +'<h2>Han movido ficha</h2>'
      +'<div class="ses-gente">'+r.map(function(p){
        return '<span class="ses-uno">'+(p.corona?'👑 ':'')+esc(p.alias)+'<em>+'+(p.xp7||0)+' xp</em></span>';
      }).join('')+'</div>'
      +'<p class="ses-pie">Nómbralos en voz alta. Los puntos los da el sistema; la ceremonia la haces tú.</p></div>';
  }

  /** La misión que más gente ha hecho: dice por dónde va el grupo y a qué se puede apuntar quien falta. */
  function masHecha(){
    var cuenta=(st.d&&st.d.retos_n)||{}, act=(st.d&&st.d.activos)||0;
    var ks=Object.keys(cuenta); if(!ks.length||act<3) return '';
    var RET=(window.SG_RETOS||{})[st.tipo||'REGULAR']||[];
    ks.sort(function(a,b){ return cuenta[b]-cuenta[a]; });
    var k=ks[0], t=RET.filter(function(x){return x[0]===k;})[0];
    if(!t) return '';
    return '<div class="dia datos"><div class="kicker">La más hecha</div>'
      +'<h2>'+esc(t[1])+'</h2>'
      +'<p class="ses-grande">'+Math.round(cuenta[k]*100/act)+'%</p>'
      +'<p class="ses-pie">de la gente activa ya la tiene. Si aún no es tu caso, es la más fácil por la que empezar.</p></div>';
  }

  /**
   * UNA INVITACIÓN por semana. 🔴 Ojo al nombre: NO es «el consejo» del calendario — ese es material
   * privado del docente y no se proyecta nunca (lo vigila la batería 48). Esto es lo contrario: algo
   * que el ALUMNADO puede hacer hoy mismo, además de las misiones.
   * Rota con el número de semana para que no sea siempre la misma, y todas son accionables: nada de
   * «esfuérzate».
   */
  var INVITACIONES = [
    ['🃏','Abre un sobre de cromos','15 créditos. Cada carta cuenta un trozo de la historia que no sale en ningún vídeo.'],
    ['🎭','Cámbiate el personaje','Los que ya tienes desbloqueados se ponen y se quitan gratis, las veces que quieras.'],
    ['🔁','Cambia tus repetidas','Tres repetidas valen un sobre nuevo, y no cuesta créditos.'],
    ['🖼️','Ponte un adorno','Título, marco o el planeta de fondo: se ven en tu ficha y en el tablero de clase.'],
    ['🏅','Mira qué insignia tienes más cerca','En Mi botín, las apagadas dicen exactamente qué piden.'],
    ['💬','Contesta el ticket de salida','Treinta segundos, anónimo, y es lo que hace que la clase siguiente vaya mejor.']
  ];
  function invitacion(sem){
    var c = INVITACIONES[(Number(sem)||1) % CONSEJOS.length];
    return '<div class="dia invita"><div class="kicker">Además de las misiones</div>'
      +'<div class="ses-tip"><span class="ico">'+c[0]+'</span><div><h2>'+esc(c[1])+'</h2>'
      +'<p>'+esc(c[2])+'</p></div></div></div>';
  }

  /** Lo que dijeron al salir de la última clase. Sin nombres: el ticket es anónimo y lo seguirá siendo. */
  function ecos(){
    var t=(st.d&&st.d.tickets)||[];
    var frases=t.map(function(x){ return String(x.duda||x.texto||'').trim(); })
                .filter(function(x){ return x.length>8; }).slice(0,3);
    if(!frases.length) return '';
    return '<div class="dia datos"><div class="kicker">Lo que dijisteis al salir</div>'
      +'<h2>Vuestras dudas de la última sesión</h2>'
      +'<div class="ses-ecos">'+frases.map(function(f){
        return '<blockquote>'+esc(f)+'</blockquote>'; }).join('')+'</div>'
      +'<p class="ses-pie">Anónimo, siempre. Empezar la clase contestando esto vale más que cualquier repaso.</p></div>';
  }

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

    /**
     * ════════ EL OPENING, EN ORDEN ════════
     *
     * Se insertan DESPUÉS del plan y ANTES del contenido de la semana, en el orden que pidió
     * Norberto: sitúa al estudiante → lo que ya habéis hecho → cómo va la cosa → un consejo → y a
     * clase. Cada bloque se calla solo si no tiene datos: un ranking de dos personas o un «0 %» no
     * animan a nadie, desaniman.
     *
     * 🔴 Va DESPUÉS del plan a propósito. Lo primero que hay que saber es qué toca hoy; celebrar
     * antes de decir a qué venimos es empezar por el postre.
     */
    var opening = [
      ['logros',   'Esta semana',   logros()],
      ['podio',    'El ranking',    podio()],
      ['escuadr',  'Escuadrones',   escuadrones()],
      ['mashecha', 'La más hecha',  masHecha()],
      ['ecos',     'Vuestras dudas', ecos()],
      ['invita',   'Una invitación', invitacion(s.sem)]
    ].filter(function(x){ return x[2]; });
    // se meten justo detrás de «El plan» (índice 1)
    var cabeza = d.slice(0,2), cola = d.slice(2);
    d = cabeza.concat(opening.map(function(x){ return {k:x[0], rot:x[1], html:x[2]}; })).concat(cola);

    /**
     * ════════ Y PARA EMPEZAR DE VERDAD ════════
     * Las dos cosas que se hacen con la clase ya delante: abrir el fichaje y lanzar el Genially.
     * Son el final del opening porque son el momento en que la sesión deja de ser una proyección y
     * pasa a ser una clase.
     */
    if (st.per) {
      d.push({k:'pase', rot:'Pase de lista', html:
        '<div class="dia accion"><div class="kicker">Con la clase ya sentada</div>'
        +'<h2>Llamada a filas</h2>'
        +'<p class="sub">Abre el fichaje y en la Nave de tu gente aparece solo el botón de <b>✋ Presente</b>. '
        +'Unos créditos por estar, y tú ves quién va llegando en directo.</p>'
        +'<div class="cta-row">'
        +'<a class="btn primary grande" href="llamada.html?per='+encodeURIComponent(st.per)+'" target="_blank" rel="noopener">🔔 Tocar llamada a filas ↗</a>'
        +'<a class="btn" href="aula.html?per='+encodeURIComponent(st.per)+'" target="_blank" rel="noopener">🎛️ Abrir el aula ↗</a>'
        +'</div></div>'});

      // 🔴 El Genially del grupo, EMBEBIDO y al final: es la señal de «se acabó la introducción,
      // empieza la clase». Si no hay panel propio se dice, en vez de dejar un hueco negro.
      var panel = (st.d && (st.d.panel || st.d.panelVer)) || '';
      d.push({k:'genially', rot:'Empezar', html:
        '<div class="dia genially">'
        +(panel
          ? '<iframe src="'+esc(panel)+'" title="Panel de control del grupo" loading="lazy" '
            +'allowfullscreen allow="fullscreen"></iframe>'
          : '<div class="txt"><div class="kicker">Para empezar</div><h2>Tu panel de Genially</h2>'
            +'<p class="sub">Este grupo todavía no tiene panel propio. Pégalo en '
            +'<b>Puesto de mando → Ajustes</b> y aparecerá aquí, listo para lanzar la clase.</p></div>')
        +'</div>'});
    }

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
      // 🔴 El tablero entero, no solo el tipo y la fecha. Norberto: «toda esta info es ORO y anima a
      // vencer». Y es verdad: el ranking, quién ha completado algo y qué habéis dicho en el ticket
      // son de este grupo y de nadie más — proyectarlos es lo que convierte una tabla en una clase.
      st.d = d;
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
