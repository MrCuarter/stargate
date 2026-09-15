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
  var EMBED = q.get('embed') === '1';
  var st={per:q.get('per')||'', d:null, sem:0, i:0, f:0, slides:[], tipo:'REGULAR', nombre:'', inicio:'', aviso:'', miNombre:'', fuera:null};

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
  /**
   * ════════ 14-sep · LA SESIÓN, REHECHA PARA PROYECTAR ════════
   *
   * Norberto, viéndola: «embellécela, usa animaciones y apóyate en los personajes e imágenes que
   * tenemos… tiene mucho aire… "Nómbralos en voz alta, la ceremonia la haces tú" rompe la magia: esto
   * se proyecta». Y el orden, que eligió él:
   *   Portada → Llamada a filas (se ve entrar a cada uno) → vídeo de intro → misiones de la semana
   *   pasada y quién las hizo → han movido ficha → ranking semanal 3º, 2º, 1º → top 5 → escuadrones →
   *   ticket de salida de tu escuadrón → lo nuevo + el simulador con NEBULA → misiones de hoy con su
   *   insignia → tu ejemplo → vídeo de cierre (siempre lo último).
   * Nada de lo que se proyecta le habla al docente: lo que es para él va en la tira de arriba.
   * Cada bloque se calla solo si no tiene datos: un podio de dos personas o un «0 %» no animan.
   */
  function vivos(){ return (st.d && st.d.reclutas) || []; }
  /** Mi escuadrón (la gente sentada en ESTA clase); si no sé quién mira, el grupo entero. */
  function miGente(){
    var t=vivos(); if(!st.miNombre) return t;
    var mios=t.filter(function(p){ return String(p.profe||'')===st.miNombre; });
    return mios.length ? mios : t;
  }
  function cara(p, cls){
    var src=''; try{ src=(window.SG&&SG.avatarSrc)?SG.avatarSrc(p.avatar,p.alias,p.xp,st.tipo).src:''; }catch(e){}
    return '<span class="cara'+(cls?' '+cls:'')+'" data-quien="'+esc(p.fid||p.ficha||p.alias||'')+'" title="Ver la ficha de '+esc(p.alias||'')+'">'+(src?'<img src="'+esc(src)+'" alt="" loading="lazy">'
      :'<b>'+esc(String(p.alias||'?').charAt(0).toUpperCase())+'</b>')+'</span>';
  }
  /**
   * 15-sep · LA FICHA DE CADA RECLUTA, AL PULSAR SU CARA. Norberto: «en el embed de clase, si pulso sobre
   * un estudiante debería abrirse su ficha (sin datos personales) para mostrar las insignias, cromos,
   * etc., así como los retos conseguidos». Las mismas reglas que la ficha del tablero, que también se
   * proyecta: su alias, su personaje, nivel y xp, insignias, cartas y retos. Ni créditos, ni correo, ni
   * nombre. Se abre DENTRO del mazo: en pantalla completa lo que queda fuera no se ve.
   */
  function quienEs(k){ return vivos().filter(function(p){ return (p.fid||p.ficha||p.alias||'')===k; })[0]||null; }
  function cerrarFicha(){ var o=root.querySelector('.ses-ficha'); if(o) o.remove(); }
  function abrirFicha(p){
    var mazo=root.querySelector('#mazo'); if(!mazo||!p) return;
    cerrarFicha();
    var av={src:'',rango:''}; try{ av=SG.avatarSrc(p.avatar,p.alias,p.xp,st.tipo)||av; }catch(e){}
    var pos=vivos().slice().sort(function(a,b){ return (b.xp||0)-(a.xp||0); }).indexOf(p)+1;
    var CR=window.SG_CROMOS||[], cat=(RET[st.tipo==='PUA'?'PUA':'REGULAR']||RET.REGULAR||[]), col=p.coleccion||{};
    var ins=(p.insignias||[]).map(function(k){ var b=badge(k);
      return '<span class="fr-ins"><img src="assets/img/insignias/'+esc(k)+'.png" alt=""><em>'+esc((b&&b.nombre)||(window.SG_BADGE_NAMES||{})[k]||k)+'</em></span>'; }).join('');
    var cro=Object.keys(p.cromos||{}).map(function(k){ var c=CR.filter(function(x){ return x[0]===k; })[0], n=(p.cromos||{})[k]||1;
      return '<span class="fr-cro"><img src="assets/img/tarjetas/'+esc(k)+'_carta.png'+(window.SG_CARDV||'')+'" alt=""><em>'+esc(c?c[1]:k)+(n>1?' ×'+n:'')+'</em></span>'; }).join('');
    var retos=(p.hechos||[]).map(function(id){ var r=cat.filter(function(x){ return x[0]===id; })[0];
      return r?'<li><span class="ant-et">'+etiquetaReto(r[1])+'</span> «'+esc(tituloReto(r[1]))+'»</li>':''; }).join('');
    mazo.insertAdjacentHTML('beforeend','<div class="ses-ficha" role="dialog" aria-label="Ficha de '+esc(p.alias)+'"><div class="ses-ficha-fondo"></div>'
      +'<div class="fr-caja"><button type="button" class="ses-ficha-x" aria-label="Cerrar">×</button>'
      +'<div class="fr-cab">'+(av.src?'<img class="fr-av" src="'+esc(av.src)+'" alt="">':'')
      +'<div><div class="eyebrow amber">'+esc(av.rango||p.rango_nombre||'')+(pos>0?' · puesto '+pos:'')+'</div><h3>'+(p.corona?'👑 ':'')+esc(p.alias)+'</h3>'
      +(p.titulo?'<div class="titulo-recluta">«'+esc(p.titulo)+'»</div>':'')
      +'<div class="small muted">Nivel '+(SG.nivel?SG.nivel(p.xp,st.tipo):(p.nivel||1))+' · '+(p.xp||0)+' xp'+(p.planeta?' · planeta '+esc(p.planeta):'')+(p.racha>=3?' · 🔥 '+p.racha+' semanas seguidas':'')+'</div></div></div>'
      +(p.bio?'<p class="fr-bio">«'+esc(p.bio)+'»</p>':'')
      +'<div class="fr-kpis"><div><b>'+(p.n||0)+'</b><span>de 24 insignias</span></div>'
      +'<div><b>'+(col.cromos?col.cromos.tengo:0)+'</b><span>de '+(col.cromos?col.cromos.total:26)+' cartas</span></div>'
      +'<div><b>'+(p.hechos||[]).length+'</b><span>retos conseguidos</span></div></div>'
      +(retos?'<h4>Retos conseguidos</h4><ul class="ses-ficha-retos">'+retos+'</ul>':'')
      +(ins?'<h4>Insignias</h4><div class="fr-lista">'+ins+'</div>':'')
      +(cro?'<h4>Cartas del álbum</h4><div class="fr-lista">'+cro+'</div>':'')
      +'</div></div>');
    var o=mazo.querySelector('.ses-ficha');
    o.querySelector('.ses-ficha-fondo').onclick=cerrarFicha; o.querySelector('.ses-ficha-x').onclick=cerrarFicha;
  }
  root.addEventListener('click',function(e){
    var t=e.target; if(!t||!t.closest||t.closest('a,.ses-ficha')) return;
    var c=t.closest('.cara[data-quien]'); if(!c) return;
    var p=quienEs(c.getAttribute('data-quien')); if(p){ e.stopPropagation(); abrirFicha(p); }
  });

  /** Una rejilla de caras con su alias (y lo que se quiera debajo). Si no caben, «y N más». */
  function caras(lista, max, pie, attr){
    var vis=lista.slice(0,max), resto=lista.length-vis.length;
    return '<div class="ses-caras">'+vis.map(function(p,i){
      return '<figure style="--i:'+i+'"'+(attr?attr(p):'')+'>'+cara(p)+'<figcaption>'+esc(p.alias)+(pie?pie(p):'')+'</figcaption></figure>';
    }).join('')+(resto>0?'<figure class="mas" style="--i:'+vis.length+'"><span class="cara"><b>+'+resto+'</b></span><figcaption>y '+resto+' más</figcaption></figure>':'')+'</div>';
  }
  /** La insignia de una misión: el Reto A del tema N da la del personaje (P N), el B la del reto (R N). */
  function insigniaDe(id){
    var m=String(id||'').match(/^([AB])(\d)$/); if(!m) return '';
    var pre=(m[1]==='A'?'P':'R')+m[2]+'_', ks=Object.keys((window.SG&&SG.BADGE)||{});
    for(var i=0;i<ks.length;i++) if(ks[i].indexOf(pre)===0) return ks[i];
    return '';
  }
  function tituloReto(txt){ var m=String(txt||'').match(/«([^»]+)»/); return m?m[1]:String(txt||''); }
  function etiquetaReto(txt){ var t=String(txt||''); return /^Reto A/.test(t)?'Reto A':/^Reto B/.test(t)?'Reto B':/^Actividad/.test(t)?'Actividad':/^Reto/.test(t)?'Reto':'Misión'; }
  /**
   * LOS VÍDEOS, CADA UNO EN SU SITIO. Norberto: «no pongas el vídeo de intro y el de cierre a
   * continuación… vídeo intro al principio, vídeo final siempre lo último». Con un tema de dos
   * semanas ya salía así (la intro en la 1.ª, el cierre en la 2.ª); en los de una sola semana (el 5 y
   * el 6) iban los tres seguidos. Los de misión («Misión · Actividad 1») van con las misiones.
   */
  function tipoVideo(v){
    var t=String((v[0]&&v[0].titulo)||'');
    if(/^Fragmento/i.test(t)) return 'fragmento';
    if(/·\s*cierre/i.test(t)) return 'cierre';
    if(/^Misi[oó]n|Plan de Ataque/i.test(t)) return 'mision';
    return 'inicio';
  }
  function diaVideo(v, i, kicker){
    return {k:'video', rot:'Vídeo', html:'<div class="dia video"><div class="kicker">'+kicker+'</div>'
      +'<h2>'+esc(v[0].titulo)+'</h2>'+yt(v[0],'')+'</div>'};
  }

  // ── 1 · la portada
  function diaPortada(s, n){
    var pl=planeta(s.tema_n);
    return {k:'portada', rot:'Portada', html:
      '<div class="dia portada'+(pl?' con-planeta':'')+'">'
      +(pl?'<img class="planeta" src="assets/img/planetas/'+esc(pl[0])+'.png'+(window.SG_IMGV||'')+'" alt="">':'')
      +'<div class="txt"><div class="kicker">Semana '+s.sem+' de '+n+(st.nombre?' · '+esc(st.nombre):'')+'</div>'
      +'<h1>'+esc(s.tema)+'</h1><p class="sub">'+esc(s.sub||'')+'</p>'
      +(pl?'<p class="planeta-nom">Planeta <b>'+esc(pl[1])+'</b> · '+esc(pl[2])+'</p>':'')
      +(s.capitulo?'<p class="pill amber">Nuevo capítulo de la historia: «'+esc(s.capitulo)+'»</p>':'')
      +'</div></div>'};
  }

  // ── 2 · la llamada a filas, con la gente entrando en directo
  var MINUTOS=[10, 30, 60, 120];
  function diaLlamada(){
    return {k:'llamada', rot:'Llamada a filas', html:
      '<div class="dia llamada"><img class="ll-cap" src="assets/img/capitan/senala.png" alt="">'
      +'<div class="ll-cuerpo"><div class="kicker">🔔 Para empezar</div><h2>Llamada a filas</h2>'
      +'<p class="sub">Entra en tu Nave y pulsa <b>✋ Presente</b>.</p>'
      +'<div class="ll-mando" id="ses-ll"><p class="sub">Un momento…</p></div>'
      +'<div id="ses-ll-gente"></div></div></div>', montar: montarLlamada};
  }
  function montarLlamada(el){
    var M=window.SG&&window.SG.MOTOR, mando=el.querySelector('#ses-ll'), caja=el.querySelector('#ses-ll-gente');
    if(!M||!M.llamadaAbierta||!st.per){ mando.innerHTML='<p class="sub">Ábrela desde tu Genially o desde Mis grupos.</p>'; return null; }
    var reloj=null, vivo=true, vistos={};
    var cerrada=function(){
      var min=MINUTOS[1];
      mando.innerHTML='<div class="ll-minutos">'+MINUTOS.map(function(m){ return '<button type="button" class="ll-m'+(m===min?' on':'')+'" data-min="'+m+'">'+m+' min</button>'; }).join('')+'</div>'
        +'<label class="ll-regalo"><input type="checkbox" id="ses-ll-sobre"> Regalo: un <b>sobre de cromos</b> a quien fiche</label>'
        +'<button type="button" class="btn primary grande" id="ses-ll-tocar">🔔 Tocar llamada a filas</button><p class="ses-err" id="ses-ll-err"></p>';
      Array.prototype.forEach.call(mando.querySelectorAll('.ll-m'),function(b){ b.onclick=function(){
        min=Number(b.getAttribute('data-min')); Array.prototype.forEach.call(mando.querySelectorAll('.ll-m'),function(x){ x.classList.toggle('on', x===b); }); }; });
      mando.querySelector('#ses-ll-tocar').onclick=function(e){
        var b=e.currentTarget; b.disabled=true; b.textContent='Tocando…';
        M.abrirLlamada(st.per, min, { regalo: mando.querySelector('#ses-ll-sobre').checked ? 'sobre' : '' })
          .then(function(r){ if(vivo) abierta({ id:r.id, hasta:r.hasta }); })
          .catch(function(err){ b.disabled=false; b.textContent='🔔 Tocar llamada a filas'; mando.querySelector('#ses-ll-err').textContent=String(err&&err.message||err); });
      };
    };
    var pintaGente=function(id){
      M.fichajesDe(id).then(function(f){
        if(!vivo) return;
        var porFicha={}; vivos().forEach(function(p){ if(p.fid) porFicha[p.fid]=p; });
        // quien no está en la lista se ha alistado después de abrir la sesión: se pide otra vez
        if(f.some(function(x){ return !porFicha[x.studentProfileId]; }))
          refrescarTablero().then(function(ok){ if(ok&&vivo) pintaGente(id); });
        var gente=f.map(function(x){ return porFicha[x.studentProfileId] || { fid:x.studentProfileId, alias:'Recluta', avatar:null, xp:0 }; });
        var cuantos=el.querySelector('#ses-ll-n'); if(cuantos) cuantos.textContent=f.length;
        var pal=el.querySelector('#ses-ll-pal'); if(pal) pal.textContent=f.length===1?'presente':'presentes';
        caja.innerHTML=gente.length ? '<div class="ses-caras ll">'+gente.map(function(p,i){
            var nuevo=!vistos[p.fid]; vistos[p.fid]=true;
            return '<figure class="'+(nuevo?'nuevo':'')+'" style="--i:0">'+cara(p)+'<figcaption>'+esc(p.alias)+'</figcaption></figure>'; }).join('')+'</div>'
          : '<p class="ll-esperando">Esperando al primero…</p>';
      }).catch(function(){});
    };
    var abierta=function(s){
      var hasta=s.hasta || (s.endTime && (s.endTime.toDate ? s.endTime.toDate().getTime() : new Date(s.endTime).getTime())) || Date.now();
      mando.innerHTML='<div class="ll-viva"><span class="ll-punto"></span><b id="ses-ll-n">0</b> <span id="ses-ll-pal">presentes</span>'
        +'<span class="ll-cuenta" id="ses-ll-cuenta"></span><button type="button" class="btn small" id="ses-ll-cerrar">Cerrar la llamada</button></div>';
      mando.querySelector('#ses-ll-cerrar').onclick=function(){ M.cerrarLlamada(s.id).then(function(){ if(reloj){ clearInterval(reloj); reloj=null; } caja.innerHTML=''; cerrada(); }); };
      pintaGente(s.id);
      reloj=setInterval(function(){
        var seg=Math.round((hasta-Date.now())/1000), c=el.querySelector('#ses-ll-cuenta');
        if(seg<=0){ clearInterval(reloj); reloj=null; cerrada(); return; }
        if(c) c.textContent='quedan '+Math.floor(seg/60)+':'+(seg%60<10?'0':'')+(seg%60);
        if(seg%4===0) pintaGente(s.id);
      },1000);
    };
    // (15-sep · la SUYA: la de otro Comandante del grupo no se adopta, ni se cierra desde aquí)
    M.llamadaAbierta(st.per, 'mia').then(function(s){ if(!vivo) return; if(s) abierta(s); else cerrada(); }).catch(cerrada);
    return function(){ vivo=false; if(reloj) clearInterval(reloj); };
  }

  /**
   * ── 2b · EL MENSAJE DE LA SEMANA, COMO LA APERTURA DE UNA SAGA. Norberto, con la sesión ya dentro de su
   * Genially: «falta añadir justo antes del vídeo el mensaje del foro… con música épica detrás y un
   * efecto rollo Star Wars, como las intros de las pelis». Es el mismo mensaje que el docente copia
   * para el foro (la tira de arriba), sin enlaces —en una proyección no se pulsan— ni la marca del
   * grupo. La música es la épica de la miniserie de STARGATE (nuestra), 80 s: suena al llegar y se
   * apaga sola al pasar de diapositiva. Con «menos movimiento» en el sistema, el texto sale quieto.
   */
  function foroParrafos(t){
    return String(t||'').split('{id-del-PER}').join('')
      .replace(/:?[ \t]*https?:\/\/\S+/g,'§')
      .split(/\n\s*\n/).map(function(x){
        return x.replace(/\s*\n\s*/g,' ').replace(/\s*§\s*$/,'.').replace(/\s*§\s*/g,' ')
          .replace(/\s*·?\s*\(Clase\s*\d+\)\s*$/i,'').replace(/\s+([.,;:])/g,'$1').trim();
      }).filter(function(x){ return x && x!=='.'; });
  }
  function diaForo(s){
    var ps=foroParrafos(s.foro); if(!ps.length) return null;
    var pl=planeta(s.tema_n), titulo=(pl?pl[1]:s.tema)||'';
    return {k:'foro', rot:'El mensaje', html:
      '<div class="dia foro-crawl"><canvas class="fc-cielo" aria-hidden="true"></canvas>'
      +'<p class="fc-intro">Hace muy poco, en una galaxia que la Estática iba apagando…</p>'
      +'<div class="fc-logo" aria-hidden="true">STARGATE</div>'
      +'<div class="fc-marco"><div class="fc-texto"><p class="fc-ep">Semana '+s.sem+'</p>'
      +(titulo?'<h2 class="fc-tit">'+esc(titulo)+'</h2>':'')
      +ps.map(function(x){ return '<p'+(/^—/.test(x)?' class="fc-firma"':'')+'>'+esc(x)+'</p>'; }).join('')
      +'</div></div><button type="button" class="fc-son" title="La música">🔊</button></div>', montar: montarForo};
  }
  function cielo(cv){
    if(!cv||!cv.getContext) return;
    var r=cv.getBoundingClientRect(), dpr=Math.min(2, window.devicePixelRatio||1), c=cv.getContext('2d');
    cv.width=Math.max(1,Math.round(r.width*dpr)); cv.height=Math.max(1,Math.round(r.height*dpr)); if(!c) return;
    for(var i=0, n=Math.round(r.width*r.height/2400); i<n; i++){
      c.fillStyle='rgba(255,255,255,'+(Math.random()*.75+.2).toFixed(2)+')';
      c.beginPath(); c.arc(Math.random()*cv.width, Math.random()*cv.height, (Math.random()<.07?1.7:.85)*dpr, 0, 6.2832); c.fill();
    }
  }
  var MUSICA='assets/audio/crawl_epica.mp3';
  function montarForo(el){
    var dia=el.querySelector('.foro-crawl'); if(!dia) return null;
    var timers=[], audio=null, btn=dia.querySelector('.fc-son'), vivo=true;
    var quieto=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
    var marco=dia.querySelector('.fc-marco'), tx=dia.querySelector('.fc-texto');
    var medir=function(){
      cielo(dia.querySelector('.fc-cielo'));
      var H=marco.offsetHeight||dia.offsetHeight||600, h=tx.offsetHeight||800;
      tx.style.setProperty('--desde', H+'px'); tx.style.setProperty('--hasta', (-h-60)+'px');
      // unos 34 px por segundo: se lee sin prisa, y nunca más largo que la música
      tx.style.setProperty('--dur', Math.max(38, Math.min(72, Math.round((H+h)/34)))+'s');
    };
    medir(); window.addEventListener('resize', medir);
    var volumen=function(hasta, ms, fin){
      if(!audio) return; var desde=audio.volume, t0=Date.now();
      var iv=setInterval(function(){ var k=Math.min(1,(Date.now()-t0)/ms);
        try{ audio.volume=Math.max(0,Math.min(1,desde+(hasta-desde)*k)); }catch(e){}
        if(k>=1){ clearInterval(iv); if(fin) fin(); } }, 50);
    };
    var sonar=function(){
      if(!vivo||audio) return;
      audio=new Audio(MUSICA+(window.SG_IMGV||'')); audio.volume=0;
      var pr=audio.play();
      if(pr&&pr.then) pr.then(function(){ volumen(.85, 1200); btn.textContent='🔊'; })
        .catch(function(){ audio=null; btn.textContent='🔈 Música'; btn.classList.add('pide'); });
      else volumen(.85, 1200);
    };
    btn.onclick=function(ev){
      ev.stopPropagation();
      if(!audio){ btn.classList.remove('pide'); return sonar(); }
      audio.muted=!audio.muted; btn.textContent=audio.muted?'🔇':'🔊';
    };
    if(quieto){ dia.classList.add('quieto'); sonar(); }
    else {
      timers.push(setTimeout(function(){ dia.classList.add('f1'); }, 60));      // «Hace muy poco…»
      timers.push(setTimeout(function(){ dia.classList.add('f2'); sonar(); }, 4300));   // el logo, y la música
      timers.push(setTimeout(function(){ dia.classList.add('f3'); }, 5800));   // el mensaje, subiendo
    }
    return function(){
      vivo=false; timers.forEach(clearTimeout); window.removeEventListener('resize', medir);
      if(audio){ var a=audio; volumen(0, 700, function(){ try{ a.pause(); }catch(e){} }); }
    };
  }

  // ── 4 · las misiones de la semana pasada, y quién las ha superado
  function diaAnteriores(s){
    var lista=semanas(), prev=null;
    for(var k=s.sem-1;k>=1;k--){ var w=lista[k-1]; if(w&&(w.lanza||[]).length){ prev=w; break; } }
    var gente=miGente(); if(!prev||!gente.length) return null;
    var filas=prev.lanza.map(function(txt){
      var id=idDeReto(txt); return { txt:txt, id:id, ins:insigniaDe(id),
        hechos:gente.filter(function(p){ return (p.hechos||[]).indexOf(id)>=0; }) }; }).filter(function(f){ return f.id; });
    if(!filas.length || !filas.some(function(f){ return f.hechos.length; })) return null;
    return {k:'anteriores', rot:'Misiones de la semana '+prev.sem, html:
      '<div class="dia anteriores"><div class="kicker">🗝️ Las misiones de la semana '+prev.sem+'</div><h2>¿Quién las ha superado?</h2>'
      +'<div class="ant-lista">'+filas.map(function(f,i){
        return '<div class="ant-f" style="--i:'+i+'">'
          +(f.ins?'<img class="ant-ins" src="assets/img/insignias/'+esc(f.ins)+'.png" alt="">':'<span class="ant-ins vacia">🗝️</span>')
          +'<div class="ant-txt"><div class="ant-cab"><span class="ant-et">'+etiquetaReto(f.txt)+'</span><b>«'+esc(tituloReto(f.txt))+'»</b>'
          +'<span class="ant-n"><b>'+f.hechos.length+'</b> de '+gente.length+'</span></div>'
          +(f.hechos.length?caras(f.hechos, 12, null, function(p){ return ' data-ficha="'+esc(p.fid||p.ficha||'')+'" data-reto="'+esc(f.id)+'"'; })
                          :'<p class="sub">¿Quién será el primero?</p>')+'</div></div>';
      }).join('')+'</div></div>', montar: montarEvidencias};
  }
  /**
   * 15-sep · SUS ENTREGAS, A UN CLIC. Norberto: «en los estudiantes que han completado los retos
   * anteriores, si han añadido un enlace, coloca un icono debajo de su avatar que apunte al enlace.
   * Así podemos ver uno en directo». Los enlaces viven en `mission_deliveries` y el docente del grupo
   * los puede leer (es la misma consulta que «Mi gente»): una lectura por grupo, guardada mientras dure
   * la sesión. Solo enlaces web de verdad, y en otra pestaña.
   */
  var EVIDS=null;
  function enlaceDe(u){
    u=String(u||'').trim(); if(!u) return '';
    if(!/^https?:\/\//i.test(u)) u='https://'+u;
    return /^https?:\/\/[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(u)?u:'';
  }
  function montarEvidencias(el){
    var vivo=true, M=window.SG&&window.SG.MOTOR, per=st.per;
    var pinta=function(mapa){
      if(!vivo) return;
      Array.prototype.forEach.call(el.querySelectorAll('figure[data-ficha][data-reto]'),function(fg){
        if(fg.querySelector('.ev-ver')) return;
        var us=String(((mapa||{})[fg.getAttribute('data-ficha')]||{})[fg.getAttribute('data-reto')]||'').trim().split(/\s+/).map(enlaceDe).filter(Boolean);
        if(!us.length) return;
        fg.insertAdjacentHTML('beforeend','<span class="ev-vers">'+us.map(function(u,k){
          return '<a class="ev-ver" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer" title="Ver lo que entregó">🔗 '+(k?'Ver 2':'Ver')+'</a>'; }).join('')+'</span>');
      });
    };
    if(EVIDS&&EVIDS.per===per){ pinta(EVIDS.mapa); return function(){ vivo=false; }; }
    if(!M||!M.getDocs||!per) return null;
    M.getDocs(M.query(M.collection(M.db,'mission_deliveries'), M.where('projectId','==',per))).then(function(r){
      var mapa={};
      r.docs.forEach(function(d){ var x=d.data(), k=x.stargateReto||String(x.missionId||'').split('__').pop();
        if(x.studentProfileId&&x.enlace) (mapa[x.studentProfileId]=mapa[x.studentProfileId]||{})[k]=x.enlace; });
      EVIDS={per:per, mapa:mapa}; pinta(mapa);
    }).catch(function(){});
    return function(){ vivo=false; };
  }

  /**
   * 15-sep (noche) · «LO QUE DIJISTEIS». Norberto: «más adelante, dos semanas después, en la presentación de clase
   * podrían aparecer las respuestas, priorizando siempre las del escuadrón del profesor activo y si no, las del resto
   * de escuadrones». Los retos que se responden en el propio reto (SG_REFLEXION) y que se lanzaron hace DOS semanas: una
   * diapositiva por reto con hasta cuatro respuestas, primero las de la gente de quien da la clase. «Ocultar» quita una
   * (se recuerda en este navegador) y sale otra. Se leen al arrancar (una consulta por grupo), así la diapositiva sale
   * o no sale desde el principio; el orden cambia cada día, pero no al pasar de diapositiva.
   */
  var REFLEX=null;
  function precargarReflexiones(){
    var M=window.SG&&window.SG.MOTOR, per=st.per;
    if(!M||!M.reflexionesDe||!per) return Promise.resolve();
    return M.reflexionesDe(per).then(function(l){ REFLEX={per:per, lista:l||[]}; }, function(){ REFLEX={per:per, lista:[]}; });
  }
  function ocultasRF(){ try{ return JSON.parse(localStorage.getItem('sgRefOcultas_'+st.per)||'{}')||{}; }catch(e){ return {}; } }
  function hashRF(t){ var h=0; t=String(t||''); for(var i=0;i<t.length;i++){ h=(h*31+t.charCodeAt(i))|0; } return h; }
  function diasReflexion(s){
    var RF=window.SG_REFLEXION||{};
    if(!REFLEX||REFLEX.per!==st.per||!REFLEX.lista.length) return [];
    var w=semanas()[s.sem-3];   // la semana de hace dos (la lista empieza en la 1)
    if(!w||!(w.lanza||[]).length) return [];
    var ocultas=ocultasRF(), dia=new Date().toISOString().slice(0,10), mios={};
    miGente().forEach(function(p){ mios[p.fid||p.ficha||'']=true; });
    var orden=function(a){ return a.slice().sort(function(x,y){ return hashRF(x.id+dia)-hashRF(y.id+dia); }); };
    return w.lanza.map(function(txt){ return {txt:txt, id:idDeReto(txt)}; }).filter(function(r){ return r.id&&RF[r.id]; }).map(function(r){
      var todas=REFLEX.lista.filter(function(x){ return x.reto===r.id && !ocultas[x.id] && quienEs(x.fichaId); });
      if(!todas.length) return null;
      var elegidas=orden(todas.filter(function(x){ return mios[x.fichaId]; })).concat(orden(todas.filter(function(x){ return !mios[x.fichaId]; }))).slice(0,4);
      return {k:'reflexion', rot:'Lo que dijisteis', html:
        '<div class="dia reflex"><div class="kicker">💬 Lo que dijisteis · '+etiquetaReto(r.txt)+' «'+esc(tituloReto(r.txt))+'»</div>'
        +'<h2>'+esc(RF[r.id].titulo||'Lo que dijisteis')+'</h2>'
        +'<div class="rfx-lista n'+elegidas.length+'">'+elegidas.map(function(x,i){
          var p=quienEs(x.fichaId), t=String(x.texto||''), corto=t.length>380?t.slice(0,370).replace(/\s+\S*$/,'')+'…':t;
          var u=enlaceDe(String(x.enlace||'').split(/\s+/)[0]);
          return '<figure class="rfx" style="--i:'+i+'">'
            +'<button type="button" class="rfx-ocultar" data-rfocultar="'+esc(x.id)+'" title="No enseñar esta respuesta">Ocultar</button>'
            +'<div class="rfx-quien">'+cara(p)+'<b>'+esc(p.alias)+'</b></div>'
            +'<blockquote>'+esc(corto)+'</blockquote>'
            +(u?'<a class="ev-ver" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">🔗 Ver lo que hizo</a>':'')
            +'</figure>'; }).join('')+'</div>'
        +(todas.length>elegidas.length?'<p class="sub rfx-mas">y '+(todas.length-elegidas.length)+' más en la Nave, en el propio reto</p>':'')
        +'</div>'};
    }).filter(Boolean);
  }
  root.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('[data-rfocultar]'); if(!b) return;
    e.stopPropagation();
    var o=ocultasRF(); o[b.getAttribute('data-rfocultar')]=1;
    try{ localStorage.setItem('sgRefOcultas_'+st.per, JSON.stringify(o)); }catch(x){}
    pintar();
  });

  // ── 5 · han movido ficha (con su cara)
  function diaMovido(){
    var r=miGente().filter(function(p){ return (p.xp7||0)>0; }).sort(function(a,b){ return (b.xp7||0)-(a.xp7||0); });
    if(!r.length) return null;
    return {k:'movido', rot:'Han movido ficha', html:
      '<div class="dia movido"><div class="kicker">⭐ Esta semana</div><h2>Han movido ficha</h2>'
      +caras(r, 18, function(p){ return '<em>+'+(p.xp7||0)+' xp</em>'; })+'</div>'};
  }

  // ── 6 · el ranking semanal, de uno en uno: 3.º, 2.º… y el 1.º
  function diaSemanal(){
    var r=vivos().filter(function(p){ return (p.xp7||0)>0; }).sort(function(a,b){ return (b.xp7||0)-(a.xp7||0); }).slice(0,3);
    if(r.length<2) return null;
    var n=r.length, sitio=function(p,pos){
      var f=n-pos+1;   // se destapa primero el último del podio
      return '<div class="podio-p p'+pos+' fr" data-f="'+f+'">'+cara(p,'grande')
        +'<b class="podio-al">'+(pos===1?'👑 ':'')+esc(p.alias)+'</b><span class="podio-xp">+'+(p.xp7||0)+' xp</span>'
        +'<div class="podio-escalon"><span>'+pos+'</span></div></div>';
    };
    var orden=n===3?[[r[1],2],[r[0],1],[r[2],3]]:[[r[1],2],[r[0],1]];
    return {k:'semanal', rot:'Ranking semanal', frag:n, html:
      '<div class="dia semanal"><div class="kicker">🏅 El ranking de la semana</div><h2>Los que más han sumado</h2>'
      +'<div class="podio">'+orden.map(function(x){ return sitio(x[0],x[1]); }).join('')+'</div></div>'};
  }

  // ── 7 · el ranking total: los cinco de arriba
  function diaTop(){
    var r=vivos().slice().sort(function(a,b){ return (b.xp||0)-(a.xp||0); }).slice(0,5);
    if(r.length<3) return null;
    var max=r[0].xp||1;
    return {k:'top', rot:'Top 5', html:
      '<div class="dia top"><div class="kicker">🏆 El ranking de la tripulación</div><h2>Los cinco de arriba</h2>'
      +'<ol class="top5">'+r.map(function(p,i){
        return '<li style="--i:'+i+'"><span class="top-pos">'+(i+1)+'</span>'+cara(p)
          +'<span class="top-al"><b>'+esc(p.alias)+'</b><em>'+esc(p.rango_nombre||('Nivel '+(p.nivel||1)))+'</em></span>'
          +'<span class="top-bar"><i style="width:'+Math.round((p.xp||0)*100/max)+'%"></i></span><span class="top-xp">'+(p.xp||0)+' xp</span></li>';
      }).join('')+'</ol></div>'};
  }

  // ── 7b · los coleccionistas: reconocer a los que van más avanzados con cromos, héroes e insignias
  // (Norberto: «es importante también dar reconocimiento a los que van más avanzados con los cromos,
  // avatares…»). Cada columna se calla si nadie tiene nada; y abajo, quien tiene algo LEGENDARIO.
  /** 15-sep (noche) · ¿se han presentado ya los logros de a bordo en la semana que se proyecta? (capítulo c9) */
  function logrosPresentados(sem){
    var t=st.tipo==='PUA'?'PUA':'REGULAR', ab=(st.d&&st.d.capitulosAbiertos)||{};
    var c=(window.SG_CAPITULOS||[]).filter(function(x){ return x.clave==='c9'; })[0]; if(!c) return false;
    var suya=(c.semanas||{})[t]||99, antes=ab.c9===true?1:Number(ab.c9)||0;
    return Number(sem)>=(antes&&antes<suya?antes:suya);
  }
  function diaColeccion(s){
    var AB=window.SG_A_BORDO||{hitos:[]}, conLogros=AB.hitos.length&&s&&logrosPresentados(s.sem);
    var nLog=function(p){ var h=p.hitos||{}; return AB.hitos.filter(function(x){ return h[x.clave]; }).length; };
    var R=vivos(), col=function(tit, ico, val, tot){
      var r=R.filter(function(p){ return val(p)>0; }).sort(function(a,b){ return val(b)-val(a); }).slice(0,3);
      if(!r.length) return '';
      return '<div class="col-c"><h3>'+ico+' '+tit+'</h3><ol>'+r.map(function(p,i){
        return '<li style="--i:'+i+'"><span class="col-pos">'+(i+1)+'</span>'+cara(p)+'<b>'+esc(p.alias)+'</b><span class="col-n">'+val(p)+(tot?'<em>/'+tot(p)+'</em>':'')+'</span></li>'; }).join('')+'</ol></div>';
    };
    var c=function(p,k){ return ((p.coleccion||{})[k]||{}); };
    var cols=[col('Álbum de cromos','🃏', function(p){ return c(p,'cromos').tengo||0; }, function(p){ return c(p,'cromos').total||26; }),
              col('Héroes','🛡️', function(p){ return c(p,'heroes').tengo||0; }, function(p){ return c(p,'heroes').total||''; }),
              col('Insignias','🏅', function(p){ return p.n||0; }, function(){ return 24; }),
              // 15-sep (noche) · y los logros de a bordo, desde la semana en que NEBULA los presenta
              conLogros?col('Logros de a bordo','🎖️', nLog, function(){ return AB.hitos.length; }):''].filter(Boolean);
    var ley=R.filter(function(p){ return (p.leyendas||[]).length; });
    var cm=conLogros?R.filter(function(p){ return (p.cubiertas||{}).todo; }):[];
    if(!cols.length) return null;
    return {k:'coleccion', rot:'Coleccionistas', html:
      '<div class="dia coleccion"><div class="kicker">🃏 Los coleccionistas</div><h2>Los que más han reunido</h2>'
      +'<div class="col-grid">'+cols.join('')+'</div>'
      +(ley.length?'<div class="col-ley"><span class="col-ley-t">👑 Tienen algo legendario</span>'+ley.slice(0,8).map(function(p){
          return '<span class="col-ley-u">'+cara(p)+'<b>'+esc(p.alias)+'</b><em>'+esc(p.leyendas[0])+(p.leyendas.length>1?' y '+(p.leyendas.length-1)+' más':'')+'</em></span>'; }).join('')+'</div>':'')
      +(cm.length?'<div class="col-ley"><span class="col-ley-t">🌟 Contramaestres de la Nave</span>'+cm.slice(0,8).map(function(p){
          return '<span class="col-ley-u">'+cara(p)+'<b>'+esc(p.alias)+'</b><em>los 16 logros de a bordo</em></span>'; }).join('')+'</div>':'')
      +'</div>'};
  }

  // ── 8 · escuadrones, por MEDIA (si fuera por suma ganaría siempre el más numeroso)
  function diaEscuadrones(){
    var por={}; vivos().forEach(function(p){ var e=p.profe||''; if(e) (por[e]=por[e]||[]).push(p.xp||0); });
    var ks=Object.keys(por); if(ks.length<2) return null;
    var E=(st.d&&st.d.escuadrones)||[];
    var filas=ks.map(function(k){ var v=por[k], e=E.filter(function(x){ return x.comandante===k; })[0]||{};
      return { cmd:k, nombre:e.nombre||k, emblema:e.emblema||'', media:Math.round(v.reduce(function(a,b){return a+b;},0)/v.length), n:v.length }; })
      .sort(function(a,b){ return b.media-a.media; });
    var max=filas[0].media||1;
    return {k:'escuadrones', rot:'Escuadrones', html:
      '<div class="dia escuadrones"><div class="kicker">🛡️ Entre escuadrones · xp de media</div><h2>¿Qué escuadrón va delante?</h2>'
      +'<div class="esc-lista">'+filas.map(function(f,i){
        return '<div class="esc-f'+(f.cmd===st.miNombre?' mio':'')+'" style="--i:'+i+'">'
          +(f.emblema?'<img class="esc-emb" src="'+esc(f.emblema)+'" alt="">':'<span class="esc-emb vacia">🛡️</span>')
          +'<span class="esc-nom"><b>'+(i===0?'🏆 ':'')+esc(f.nombre)+'</b><em>Comandante '+esc(f.cmd)+' · '+f.n+' reclutas</em></span>'
          +'<span class="esc-bar"><i style="width:'+Math.round(f.media*100/max)+'%"></i></span><span class="esc-xp">'+f.media+' xp</span></div>';
      }).join('')+'</div></div>'};
  }

  // ── 9 · el ticket de salida de la semana pasada (anónimo), de SU escuadrón
  function diaTicket(){
    if(!window.SG_TICKETS_API||!st.per) return null;
    return {k:'ticket', rot:'Ticket de salida', html:
      '<div class="dia ticket"><img class="tk-neb" src="assets/img/personajes/nebula.png" alt="">'
      +'<div class="tk-cuerpo"><div class="kicker">💬 El ticket de salida</div><h2>Lo que dijisteis al salir</h2>'
      +'<div id="ses-tk"><p class="sub">Leyendo vuestras respuestas…</p></div></div></div>', montar: montarTicket};
  }
  var TK=null;
  function montarTicket(el){
    var caja=el.querySelector('#ses-tk'), vivo=true;
    var pinta=function(lista){
      if(!vivo) return;
      var campo=function(r,frag){ for(var k in r) if(k.indexOf(frag)>=0) return r[k]; return ''; };
      var mias=st.miNombre?lista.filter(function(x){ return String(campo(x.r,'profesor o profesora'))===st.miNombre; }):lista;
      if(mias.length) lista=mias;
      if(!lista.length){ caja.innerHTML='<p class="sub">Todavía no hay respuestas. El ticket se contesta al final de cada clase, desde la Nave.</p>'; return; }
      // lo de la última semana con respuestas (la clase anterior)
      var t=function(x){ return new Date(x.fecha).getTime()||0; }, ult=Math.max.apply(null, lista.map(t));
      var sem=lista.filter(function(x){ return t(x) > ult-7*864e5; });
      var sats=[], textos=[];
      sem.forEach(function(x){ Object.keys(x.r).forEach(function(c){
        var v=String(x.r[c]).trim(); if(!v||c.indexOf('Selecciona el tema')>=0||c.indexOf('profesor o profesora')>=0||c.indexOf('STARGATE ·')===0) return;
        if(/^[1-5]$/.test(v)){ if(/satisfacci/i.test(c)) sats.push(Number(v)); }
        else if(v.length>8) textos.push(v); }); });
      var media=sats.length?sats.reduce(function(a,b){return a+b;},0)/sats.length:0;
      caja.innerHTML='<div class="tk-cifras"><div class="tk-c"><b>'+sem.length+'</b><span>'+(sem.length===1?'respuesta':'respuestas')+'</span></div>'
        +(sats.length?'<div class="tk-c"><b>'+media.toFixed(1)+'</b><span>de 5, cómo os fue</span></div>':'')+'</div>'
        +(textos.length?'<div class="tk-ecos">'+textos.slice(0,4).map(function(x,i){ return '<blockquote style="--i:'+i+'">'+esc(x.length>220?x.slice(0,217)+'…':x)+'</blockquote>'; }).join('')+'</div>'
          :'<p class="sub">Sin dudas escritas: todo claro.</p>');
    };
    if(TK&&TK.per===st.per){ pinta(TK.lista); }
    else fetch(String(window.SG_TICKETS_API),{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({accion:'tickets',per:st.per})})
      .then(function(r){ return r.json(); })
      .then(function(d){ TK={per:st.per, lista:(d&&d.tickets)||[]}; pinta(TK.lista); })
      .catch(function(){ if(vivo) caja.innerHTML='<p class="sub">No he podido leer el ticket ahora mismo.</p>'; });
    return function(){ vivo=false; };
  }

  // ── 9b · la oferta de la semana, la misma que hay en su Nave: se habla de ella en clase
  function diaOferta(){
    var t=Date.now(), R=(st.d&&st.d.recompensas)||[];
    var x=R.filter(function(r){ var o=r.oferta; return r.tipo==='oferta'&&o&&!o.cancelada&&t>=(o.desde||0)&&t<(o.fin||0)&&(o.quedan==null||o.quedan>0); })[0];
    if(!x) return null;
    var o=x.oferta, q=o.que||{}, img;
    if(q.tipo==='heroe') img='assets/img/heroes/'+q.clave+'.jpg';
    else if(q.tipo==='carta') img='assets/img/tarjetas/'+q.clave+'_carta.png';
    else { var tienda=R.filter(function(r){ return r.tipo===q.cual; })[0]; img='assets/img/canje/'+(((window.SG_IMG_RECOMPENSA||{})[(tienda||{}).nombre])||'sobre.jpg'); }
    var fin=new Date(o.fin-60000), dia=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][fin.getDay()];
    return {k:'oferta', rot:'La oferta', html:
      '<div class="dia oferta-dia'+(q.tipo==='carta'?' es-carta':'')+'"><div class="of-dia-img"><img src="'+esc(img)+'" alt=""><span class="of-pct">−'+o.pct+' %</span></div>'
      +'<div class="of-dia-txt"><div class="kicker">⚡ La oferta de la semana</div><h2>'+esc(o.nombre)+'</h2>'
      +'<p class="odia-precio"><s>'+o.base+' ◈</s> <b>'+o.precio+' ◈</b></p>'
      +'<p class="odia-meta">'+(o.quedan==null?'Sin límite de unidades':'Solo quedan <b>'+o.quedan+'</b>')+' · una por persona · hasta el '+dia+'</p>'
      +'<p class="sub">En el Mercado de vuestra Nave. Cuando se acaban, se acaban.</p></div></div>'};
  }

  // ── 11 · las misiones de hoy, cada una con su insignia (el plan y el hito, dentro)
  function diasMisiones(s){
    var out=[], ls=s.lanza||[];
    ls.forEach(function(txt,i){
      var id=idDeReto(txt), pide=id?AYU[id]:'', ins=insigniaDe(id), b=ins?badge(ins):null;
      out.push({k:'reto', rot:'Misión '+(i+1), html:
        // (clase «mision», no «reto»: `.reto` es el botón de reto de otra página y la dejaba apagada)
        '<div class="dia mision'+(ins?' con-ins':'')+'">'
        +(ins?'<figure class="reto-ins"><img src="assets/img/insignias/'+esc(ins)+'.png" alt=""><figcaption>'+esc(b?b.nombre:'')+'</figcaption></figure>':'')
        +'<div class="reto-txt"><div class="kicker">🎯 Misión '+(i+1)+' de '+ls.length+' · '+etiquetaReto(txt)+'</div>'
        +'<h2>«'+esc(tituloReto(txt))+'»</h2>'
        +(pide?'<div class="pide"><div class="et">Qué hay que hacer</div><p>'+esc(pide)+'</p></div>'
              :'<p class="sub">El enunciado completo está en tu Nave, en «Mis retos».</p>')
        +(i===ls.length-1&&s.hito?'<p class="reto-hito">🎯 <b>Esta semana se entrega:</b> '+esc(s.hito)+'</p>':'')
        +'</div></div>'});
    });
    if(!ls.length&&s.hito) out.push({k:'hito', rot:'Entrega', html:
      '<div class="dia hito"><div class="kicker">🎯 Esta semana</div><h2>Lo que se entrega</h2><p class="grande">'+esc(s.hito)+'</p></div>'});
    // las insignias de la semana que no van con ninguna misión (las de capítulo e historia), juntas
    var suyas=ls.map(function(t){ return insigniaDe(idDeReto(t)); });
    var otras=(s.insignias||[]).filter(function(k){ return suyas.indexOf(k)<0; });
    if(otras.length) out.push({k:'insignias', rot:'Insignias', html:
      '<div class="dia insignias"><div class="kicker">🏅 También se entregan esta semana</div>'
      +'<h2>'+(otras.length===1?'La insignia en juego':'Las insignias en juego')+'</h2>'
      +'<div class="ins-grid">'+otras.map(function(k,i){ var b=badge(k);
        return '<figure style="--i:'+i+'"><img src="assets/img/insignias/'+esc(k)+'.png" alt=""><figcaption><b>'+esc(b?b.nombre:k)+'</b>'
          +(b&&b.como?'<em>'+esc(b.como)+'</em>':'')+(b&&b.cita?'<q>'+esc(b.cita)+'</q>':'')+'</figcaption></figure>'; }).join('')+'</div></div>'});
    return out;
  }

  /**
   * 🔴 13-sep · LO QUE SE ABRE ESTA SEMANA EN LA NAVE. Norberto: «ver en qué semana se les desbloquea
   * algo y añadir una diapositiva o dos: "esta semana en STARGATE ya puedes…"; y en la siguiente,
   * embeber la demo del estudiante con lo desbloqueado para que el docente pueda interactuar». El
   * calendario es el mismo que usa la Nave (SG_CAPITULOS): si una semana no abre nada, no sale nada.
   */
  function capitulosDe(sem){
    var t=st.tipo==='PUA'?'PUA':'REGULAR', ab=(st.d&&st.d.capitulosAbiertos)||{};
    return (window.SG_CAPITULOS||[]).filter(function(c){
      if(c.listo===false) return false;
      // (los grupos que lo abrieron antes del 14-sep guardaron `true`, sin semana: se presenta en la suya)
      var suya=(c.semanas||{})[t], antes=ab[c.clave]===true?0:Number(ab[c.clave])||0;
      // 14-sep · abierto antes de tiempo por el referente: se presenta la semana en que lo abrió
      if(antes && antes<suya) return antes===sem;
      return suya===sem;
    });
  }
  /**
   * 14-sep · EL SIMULADOR, CON SU ONBOARDING. Norberto: «un estudiante de prueba que está en la
   * misma semana que los estudiantes, aparece el onboarding y el docente lo sigue en directo… que
   * quede grabado en la clase y sepan cómo hacer las cosas. Muchos docentes no tendrán ni idea, así
   * que les sirve a ellos también». Es la Nave del Comandante (nada se guarda) con `&nebula=1`:
   * NEBULA arranca sola con el MISMO capítulo que verá el alumnado.
   */
  function diapositivasNuevas(s){
    var out=[], caps=capitulosDe(s.sem);
    caps.forEach(function(c){
      out.push({k:'nuevo', rot:'Lo nuevo', html:
        '<div class="dia nuevo-nave"><div class="nn-txt"><div class="kicker">🔓 Se abre esta semana en STARGATE</div>'
        +'<h2>'+c.icono+' '+esc(c.titulo)+'</h2><p class="sub">'+esc(c.cabecera||'')+'</p>'
        +'<ul class="nn-lista">'+(c.puedes||[]).map(function(x,i){ return '<li style="--i:'+i+'">'+esc(x)+'</li>'; }).join('')+'</ul></div>'
        +(c.imagen?'<img class="nn-img" src="'+esc(c.imagen)+'" alt="">':'')+'</div>'});
    });
    out.push(diaSimulacro(s, caps));
    return out;
  }
  /**
   * 15-sep · EL SIMULACRO, CADA SEMANA Y EN LA SEMANA QUE QUIERAS. Norberto: «lo que se desbloquea esa
   * semana (mercado, zoco…) y justo después el simulacro, donde el docente escoge la semana y puede navegar
   * por una Nave de recluta simulada». Uno solo (antes, uno por capítulo), detrás de «Lo nuevo» si esa
   * semana abre algo; y con el selector de semana arriba. NEBULA arranca sola si la semana elegida abre un
   * capítulo (enseña ese); si no, la Nave sale tal cual. Nada de lo que se toque ahí se guarda.
   */
  function diaSimulacro(s, caps){
    var n=semanas().length, url=function(sem){
      return 'recluta.html?simulacro=1&embed=1'+(capitulosDe(Number(sem)).length?'&nebula=1':'')+'&per='+encodeURIComponent(st.per||'demo-motor')+'&semana='+sem; };
    var opciones=''; for(var k=1;k<=n;k++) opciones+='<option value="'+k+'"'+(k===s.sem?' selected':'')+'>'+k+(k===s.sem?' · esta':'')+'</option>';
    return {k:'simulacro', rot:caps.length?'Enséñalo':'La Nave', html:
      '<div class="dia simulacro"><div class="sim-barra"><span class="sim-t">🛰️ '+(caps.length?'Enséñalo: ':'')+'la Nave de un recluta, en simulacro</span>'
      +'<label class="sim-sel">Semana <select class="sim-sem" aria-label="Semana de la Nave simulada">'+opciones+'</select></label>'
      +'<span class="sim-nota">Nada de lo que toques aquí cuenta</span></div>'
      +'<iframe src="'+esc(url(s.sem))+'" title="La Nave de tu Comandante, en simulacro" loading="lazy"></iframe></div>',
      montar: function(el){
        var sel=el.querySelector('.sim-sem'), fr=el.querySelector('.dia.simulacro iframe');
        if(sel&&fr) sel.onchange=function(){ fr.src=url(sel.value); };
        return null;
      }};
  }

  function construir(s, n){
    var vids=s.videos||[], deTipo=function(t){ return vids.filter(function(v){ return tipoVideo(v)===t; }); };
    var d=[diaPortada(s, n)];
    if(st.per) d.push(diaLlamada());
    var fo=diaForo(s); if(fo) d.push(fo);   // el mensaje de la semana, justo antes del vídeo
    deTipo('inicio').forEach(function(v,i){ d.push(diaVideo(v, i, '🎬 Para empezar')); });
    [diaAnteriores(s)].concat(diasReflexion(s), [diaMovido(), diaSemanal(), diaTop(), diaColeccion(s), diaEscuadrones(), diaTicket(), diaOferta()])
      .forEach(function(x){ if(x) d.push(x); });
    d=d.concat(diapositivasNuevas(s));
    deTipo('mision').forEach(function(v,i){ d.push(diaVideo(v, i, '🎬 La misión')); });
    d=d.concat(diasMisiones(s));
    // 🔴 El Genially del grupo (el panel), EMBEBIDO: es donde empieza la clase de verdad. Si el docente
    // tiene uno propio («Mis enlaces»), el suyo; si no, el oficial del grupo; si no, el Panel de
    // control maestro de STARGATE. Y NUNCA cuando la sesión ya va DENTRO del Genially: sería el
    // panel dentro de sí mismo.
    if(st.per && !EMBED){
      var P=(st.d&&st.d.paneles)||{}, panel=(st.miNombre&&P[st.miNombre])||(st.d&&st.d.panel)||window.SG_PANEL_MAESTRO||'';
      if(panel) d.push({k:'genially', rot:'El panel', html:
        '<div class="dia genially"><iframe src="'+esc(panel)+'" title="Panel de control de la clase" loading="lazy" allowfullscreen allow="fullscreen"></iframe></div>'});
    }
    d.push({k:'tuyo', rot:'Tu ejemplo', html:
      '<div class="dia tuyo"><img class="tuyo-cap" src="assets/img/capitan/pensativo.png" alt=""><div><div class="kicker">✋ Vuestro turno</div>'
      +'<h2>Un ejemplo de verdad</h2><p class="sub">Un caso real, una pregunta, algo que ya hayáis probado en un aula.</p></div></div>'});
    deTipo('cierre').forEach(function(v,i){ d.push(diaVideo(v, i, '🎬 Para cerrar el planeta')); });
    deTipo('fragmento').forEach(function(v,i){ d.push(diaVideo(v, i, '🎁 La recompensa del bloque')); });
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
      +'<div class="prep-b"><a class="btn min bz-acceso" href="buzon.html?desde=sesion&per='+encodeURIComponent(st.per||'')+'" target="_blank" rel="noopener">📡 ¿Dudas? ¿Algo falla?</a> '
      +'<button type="button" class="btn primary" id="proyectar">▶ Proyectar la sesión</button></div></div>'
      +(s.consejo?'<div class="card consejo"><b>El consejo del Capitán.</b> '+esc(s.consejo)+'</div>':'')
      +(s.clases?'<p class="small muted">'+esc(s.clases)+'</p>':'')
      +(s.foro?'<details class="foro-det"><summary>El mensaje de esta semana para el foro de la plataforma de UNIR (para copiar)</summary>'
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
    if(st.fuera){ try{ st.fuera(); }catch(e){} st.fuera=null; }

    root.innerHTML=(EMBED ? '' : st.aviso+prep(s)+tira())
      +'<div class="mazo" id="mazo" tabindex="0" aria-live="polite">'
      +'<div class="lienzo">'+st.slides[st.i].html+'</div>'
      +'<button type="button" class="nav ant" id="ant" aria-label="Anterior">‹</button>'
      +'<button type="button" class="nav sig" id="sig" aria-label="Siguiente">›</button>'
      // con varios grupos: cambiar de grupo sin salir del Genially (abajo, en la barra: arriba tapaba títulos)
      +'<div class="barra-pasos">'+(EMBED && st.yo ? '<button type="button" class="ses-salir-b" id="ses-salir-b" title="Cerrar sesión ('+esc(st.yo.correo||'')+')">⏻</button>' : '')
      +(st.grupos && st.grupos.length > 1 ? '<button type="button" class="ses-cambiar" id="ses-cambiar" title="Cambiar de grupo">⇄ '+esc(st.nombre||'Grupo')+'</button>' : '')+st.slides.map(function(d,i){
          return '<button type="button" class="p'+(i===st.i?' on':'')+(i<st.i?' past':'')+'" data-i="'+i+'" title="'+esc(d.rot)+'"><span>'+esc(d.rot)+'</span></button>';
        }).join('')+'</div>'
      +'<div class="cuenta">'+(st.i+1)+' / '+st.slides.length+'</div>'
      +'</div>';
    wire();
    montar();
  }
  /**
   * Cada diapositiva puede traer `montar(lienzo)` (la llamada a filas en directo, el ticket que se
   * lee al llegar) y devolver con qué se apaga al irse; y `frag`: cuántas cosas se destapan de una
   * en una con → antes de pasar a la siguiente (el podio: 3.º, 2.º… y el 1.º).
   */
  function montar(){
    var lienzo=root.querySelector('.lienzo'), sl=st.slides[st.i]; if(!lienzo||!sl) return;
    var dia=lienzo.firstElementChild; if(dia) dia.classList.add('entra');
    frags();
    if(sl.montar){ try{ st.fuera=sl.montar(lienzo)||null; }catch(e){ st.fuera=null; } }
  }
  function frags(){
    var lienzo=root.querySelector('.lienzo'); if(!lienzo) return;
    Array.prototype.forEach.call(lienzo.querySelectorAll('[data-f]'),function(x){ x.classList.toggle('on', Number(x.getAttribute('data-f'))<=st.f); });
  }
  function avanzar(){
    var sl=st.slides[st.i];
    if(sl&&sl.frag&&st.f<sl.frag){ st.f++; frags(); return; }
    ir(st.i+1);
  }
  function retroceder(){
    var sl=st.slides[st.i];
    if(sl&&sl.frag&&st.f>0&&st.f<sl.frag){ st.f--; frags(); return; }
    ir(st.i-1, true);
  }

  function ir(i, hacia_atras){
    var n=st.slides.length;
    if(i<0||i>=n) return;
    st.i=i;
    // al volver atrás a un podio, se ve entero; al llegar de frente, se destapa de uno en uno
    st.f=hacia_atras&&st.slides[i].frag?st.slides[i].frag:0;
    if(st.fuera){ try{ st.fuera(); }catch(e){} st.fuera=null; }
    cerrarFicha();
    var lienzo=root.querySelector('.lienzo');
    if(lienzo){
      lienzo.innerHTML=st.slides[i].html;
      wireYt(lienzo);
      montar();
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
    if(a) a.onclick=function(){ retroceder(); };
    if(g) g.onclick=function(){ avanzar(); };
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
    var cg=root.querySelector('#ses-cambiar');
    if(cg) cg.onclick=function(){ elegirGrupo(st.grupos); };
    var sb=root.querySelector('#ses-salir-b'), sbT=null;
    if(sb) sb.onclick=function(){
      if(!sb.classList.contains('seguro')){ sb.classList.add('seguro'); sb.textContent='⏻ ¿Salir?';
        clearTimeout(sbT); sbT=setTimeout(function(){ sb.classList.remove('seguro'); sb.textContent='⏻'; }, 3500); return; }
      salir();
    };
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
    // (15-sep · con el selector de grupo o la puerta en pantalla no hay diapositivas que pasar: el mando
    // redibujaba el grupo de antes y el selector desaparecía)
    if(!st.slides.length || !root.querySelector('.lienzo')) return;
    if(root.querySelector('.ses-ficha')){ if(/^(Escape|ArrowRight|ArrowLeft|PageDown|PageUp| )$/.test(e.key)){ e.preventDefault(); cerrarFicha(); } return; }
    if(/^(INPUT|SELECT|TEXTAREA)$/.test((e.target&&e.target.tagName)||'')) return;
    // la barra espaciadora sobre un botón lo pulsa (no pasa de diapositiva); las flechas y el mando, siempre
    if(e.key===' ' && e.target && e.target.closest && e.target.closest('button,a,[role=button]')) return;
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ e.preventDefault(); avanzar(); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); retroceder(); }
  });

  // ---------- arranque ----------
  function arrancar(d){
    if(d&&!d.error){
      st.tipo=(d.tipo||'REGULAR'); st.nombre=d.nombre||''; st.inicio=d.inicio||''; st.pausas=d.pausas||[];
      // 🔴 El tablero entero, no solo el tipo y la fecha. Norberto: «toda esta info es ORO y anima a
      // vencer». Y es verdad: el ranking, quién ha completado algo y qué habéis dicho en el ticket
      // son de este grupo y de nadie más — proyectarlos es lo que convierte una tabla en una clase.
      st.d = d;
    }
    var forzada=parseInt(q.get('sem')||'0',10);
    if(forzada) st.sem=forzada;
    else {
      var hoy=window.SGCAL.semanaActual(st.inicio, st.pausas);
      st.sem=hoy&&hoy>0?hoy:1;
    }
    // 15-sep (noche) · las reflexiones del grupo, antes de pintar (como mucho 2,5 s): «Lo que dijisteis» sale o no sale
    // desde el principio y no mueve de sitio la diapositiva que se está viendo
    var hecho=false, seguir=function(){ if(hecho) return; hecho=true; pintar(); };
    setTimeout(seguir, 2500);
    precargarReflexiones().then(seguir, seguir);
  }

  /**
   * ════════ EL MISMO ENLACE PARA TODOS TUS GRUPOS ════════
   *
   * Norberto lo preguntó y es la pregunta correcta: «¿estos embeds detectan al profe y muestran
   * automáticamente la info del docente que ha iniciado sesión? Sería lo mejor para que el mismo
   * embed nos sirva para todo». Sí — y ya lo hacían el aula y la llamada a filas; esta se había
   * quedado atrás pidiendo `?per=` en el enlace.
   *
   * 🔴 Y no es comodidad: un enlace con el grupo dentro obliga a montar el Genially OTRA VEZ por
   * cada grupo y por cada curso. Sin él, se pega UNA vez y no se vuelve a tocar: ni al crear un
   * grupo nuevo, ni el año que viene. Es la misma razón por la que `validar.html` tampoco lo lleva.
   *
   * Si lleva `?per=` se respeta (un referente puede querer proyectar un grupo que no es suyo).
   */
  /**
   * 14-sep · EL EMBED DE GENIALLY, PARA TODOS. Norberto: «el referente les va a dar los Geniallys
   * hechos… que en ese embed pida iniciar sesión al docente, detecte sus grupos, primero le pregunte
   * en qué grupo estamos y entonces lance la presentación que toca. El mismo embed para todos los
   * grupos y profesores». Antes, sin sesión, se quedaba en el calendario estándar SIN botón para
   * entrar (dentro de un Genially no hay otra forma de hacerlo), y con varios grupos cogía el primero.
   */
  function porLaCuenta(){
    var M = window.SG && window.SG.MOTOR;
    if (!M || !M.sesion || !M.misPERs) return sinGrupo();
    root.innerHTML=cargando('Buscando tus grupos…','');
    M.sesion().then(function(yo){
      if (!yo) return puertaSesion();
      st.yo = yo;
      return M.misPERs(yo.correo).then(function(ps){
        var vivos = (ps||[]).filter(function(x){ return x.estado === 'en marcha'; });
        var lista = vivos.length ? vivos : (ps||[]);
        if (!lista.length) return comoRecluta(yo);
        st.grupos = lista;
        if (lista.length === 1) { st.per = lista[0].id; return cargarYArrancar(); }
        elegirGrupo(lista);
      });
    }).catch(function(){ sinRed(porLaCuenta); });
  }
  /** Sin conexión (o el servidor no contesta): se dice, y un botón para volver a intentarlo. */
  function sinRed(otraVez){
    caja('<h2>No llega el tablero de tu grupo</h2>'
      +'<p class="sub">Parece que falla la conexión. Comprueba la wifi y vuelve a intentarlo.</p>'
      +'<button class="btn primary grande" id="ses-reintentar">↻ Reintentar</button>');
    document.getElementById('ses-reintentar').onclick=function(){ otraVez(); };
  }
  function caja(html){ root.innerHTML='<div class="ses-puerta"><img class="ses-cap" src="assets/img/capitan/saluda.png" alt="">'
    +'<div class="ses-puerta-txt"><div class="kicker">STARGATE · La sesión de la semana</div>'+html+'</div></div>'; }
  function puertaSesion(err){
    caja('<h2>Entra con tu cuenta de docente</h2>'
      +'<p class="sub">Te enseño la sesión de tu grupo, en la semana que toca.</p>'
      +'<button class="btn primary grande btn-google" id="ses-entrar">'+((window.SG && window.SG.LOGO_G) || '')+'<span>Iniciar sesión con Google</span></button>'
      +(err?'<p class="ses-err">'+esc(err)+'</p>':''));
    document.getElementById('ses-entrar').onclick=function(){
      window.SG.MOTOR.entrar().then(function(){ porLaCuenta(); })
        .catch(function(e){ puertaSesion('No he podido entrar: '+(e&&e.message||e)); });
    };
  }
  /**
   * 15-sep · SI QUIEN ENTRA ES UN ESTUDIANTE. Norberto: «¿qué ocurre si un estudiante intenta entrar
   * desde aquí? ¿podríamos hacer que le llevara directamente a su Nave del recluta?». Sí: la misma
   * pregunta que hace la portada. De un grupo → su Nave, aquí mismo (sin la cabecera si va dentro de
   * un Genially); de varios → elige; de ninguno → sus palabras: que esas credenciales no son de
   * ningún Comandante, y otra cuenta.
   */
  function comoRecluta(yo){
    var M=window.SG&&window.SG.MOTOR;
    if(!M||!M.misGruposDeAlumno) return sinGrupos(yo);
    root.innerHTML=cargando('Buscando tu Nave…','');
    return M.misGruposDeAlumno(yo.uid).then(function(gs){
      gs=gs||[];
      var nave=function(per){ return 'recluta.html?per='+encodeURIComponent(per)+(EMBED?'&embed=1':''); };
      if(gs.length===1){ location.replace(nave(gs[0].per)); return; }
      if(!gs.length) return sinGrupos(yo);
      caja('<h2>Tu Nave te espera</h2><p class="sub">Esta presentación es del profesorado. Estás alistado en más de un grupo: ¿a qué Nave vas?</p>'
        +'<div class="ses-grupos">'+gs.map(function(g){
          return '<a class="ses-grupo" href="'+esc(nave(g.per))+'"><b>🚀 '+esc(g.nombreGrupo||g.per)+'</b><span>Ir a mi Nave</span></a>'; }).join('')+'</div>'
        +quienSoy(yo));
      cablearSalir();
    }).catch(function(){ sinGrupos(yo); });
  }
  function sinGrupos(yo){
    caja('<h2 class="ses-h-larga">Lo siento, esas credenciales no coinciden con las de ningún comandante.</h2>'
      +'<p class="sub">Has entrado como <b>'+esc(yo.correo||'')+'</b>. ¿Quieres intentarlo con otra cuenta?</p>'
      +'<button class="btn primary grande" id="ses-otra">Entrar con otra cuenta</button>'
      +'<p class="small muted">¿Eres recluta y aún no te has alistado? Hazlo en stargate.mistercuarter.es con el código de tu clase.</p>');
    document.getElementById('ses-otra').onclick=function(){ salir(); };
  }
  /** Quién ha entrado, y el botón para salir (15-sep · Norberto: «aquí necesito también un botón para cerrar sesión de Google»). */
  function quienSoy(yo){
    return '<p class="ses-quien">Has entrado como <b>'+esc((yo&&yo.correo)||'')+'</b> '
      +'<button type="button" class="btn min" id="ses-salir">⏻ Cerrar sesión</button></p>';
  }
  function salir(){
    if(st.fuera){ try{ st.fuera(); }catch(e){} st.fuera=null; }
    var M=window.SG&&window.SG.MOTOR, fin=function(){ st.yo=null; st.grupos=null; st.slides=[]; if(!q.get('per')) st.per=''; puertaSesion(); };
    if(M&&M.salir) M.salir().then(fin, fin); else fin();
  }
  function cablearSalir(){ var b=document.getElementById('ses-salir'); if(b) b.onclick=function(){ b.disabled=true; salir(); }; }
  function elegirGrupo(lista){
    // lo que estuviera vivo en la diapositiva (la llamada pregunta cada 4 s), fuera antes de cambiar
    if(st.fuera){ try{ st.fuera(); }catch(e){} st.fuera=null; }
    caja('<h2>¿En qué grupo estamos?</h2>'
      +'<div class="ses-grupos">'+lista.map(function(g){
        return '<button type="button" class="ses-grupo" data-per="'+esc(g.id)+'"><b>'+esc(g.nombre||g.id)+'</b>'
          +'<span>'+(g.estado==='en marcha'?'Semana '+g.semana+' de '+g.total:esc(g.estado))+(g.stargate&&g.stargate.tipo==='PUA'?' · PUA':'')+'</span></button>';
      }).join('')+'</div>'+(st.yo?quienSoy(st.yo):''));
    cablearSalir();
    Array.prototype.forEach.call(root.querySelectorAll('.ses-grupo'),function(b){
      b.onclick=function(){ st.per=b.getAttribute('data-per'); st.i=0; st.sem=0; cargarYArrancar(); };
    });
  }
  function sinGrupo(msg){
    st.aviso='<div class="card aviso-per"><h3>¿De qué grupo?</h3>'
      +'<p>'+(msg||'Ábrela desde <a href="consola.html">tus grupos</a>, o entra con tu cuenta y la deduzco sola.')
      +' Mientras tanto, este es el calendario estándar.</p></div>';
    arrancar(null);
  }
  /**
   * Cómo se llama quien proyecta EN ESTE GRUPO (el nombre que llevan en «profe» las fichas de su
   * escuadrón): con él, «han movido ficha», las misiones y el ticket de salida son de SU clase.
   */
  function miNombreDe(per, listo){
    var g=(st.grupos||[]).filter(function(x){ return x.id===per; })[0];
    if(g){ st.miNombre=g.miNombre||''; return listo(); }
    var hecho=false, fin=function(){ if(!hecho){ hecho=true; listo(); } };
    setTimeout(fin, 4000);   // sin motor o sin cuenta, la sesión sale igual (con el grupo entero)
    var ir_=function(){
      var M=window.SG&&window.SG.MOTOR; if(!M||!M.sesion) return fin();
      M.sesion().then(function(yo){
        if(!yo) return fin();
        return M.misPERs(yo.correo).then(function(ps){
          var x=(ps||[]).filter(function(y){ return y.id===per; })[0];
          st.miNombre=(x&&x.miNombre)||'';
          if(!st.grupos) st.grupos=(ps||[]).filter(function(y){ return y.estado==='en marcha'; });
          fin();
        });
      }).catch(fin);
    };
    if(window.SG&&window.SG.MOTOR) ir_(); else document.addEventListener('sg:motor', ir_);
  }
  /**
   * 🔴 14-sep · LOS DATOS, FRESCOS. `perData` contesta primero con la copia del navegador (hasta 12 h)
   * y luego con la de verdad, y aquí se arrancaba con la PRIMERA: el ranking, «han movido ficha» y la
   * llamada a filas salían con los datos de la mañana (el laboratorio lo pilló: Sara fichaba, el
   * contador decía «1» y su cara no salía porque se había alistado después). Ahora se espera a la
   * de verdad; la copia solo se usa si la red tarda más de 6 s.
   */
  function cargarYArrancar(){
    root.innerHTML=cargando('Preparando la sesión…','Semana en curso de '+esc(st.per));
    var yaArranco=false, copia=null, per=st.per;
    miNombreDe(per, function(){
      var espera=setTimeout(function(){ if(!yaArranco&&copia){ yaArranco=true; arrancar(copia); } }, 6000);
      window.SGCAL.perData(API, per, function(d,esCache){
        if(per!==st.per) return;
        if(esCache){ copia=d; return; }
        if(yaArranco){ if(d&&!d.error) st.d=d; return; }   // llegó tarde: sirve para lo que queda
        yaArranco=true; clearTimeout(espera);
        // 🔴 15-sep · si falla la red, la copia del navegador; y si no hay ninguna de las dos, se dice
        // (antes arrancaba con el error: la semana 1 del calendario estándar, sin datos y sin aviso)
        var bueno=d&&!d.error?d:copia;
        if(bueno) arrancar(bueno); else sinRed(cargarYArrancar);
      });
    });
  }
  /** Volver a pedir el tablero (alguien ficha y no está en la lista: se ha alistado después). */
  var refrescado=0;
  function refrescarTablero(){
    var F=window.SG&&window.SG.FUENTE;
    if(!F||!F.tablero||Date.now()-refrescado<15000) return Promise.resolve(false);
    refrescado=Date.now();
    // (fresco: el tablero público se guarda 30 s en el servidor, y quien acaba de alistarse no estaría)
    return F.tablero(st.per, true).then(function(d){ if(d&&!d.error){ st.d=d; return true; } return false; }).catch(function(){ return false; });
  }

  if(!st.per){
    if (window.SG && window.SG.MOTOR) porLaCuenta();
    else document.addEventListener('sg:motor', porLaCuenta);
  } else cargarYArrancar();   // (el dato fresco no puede mover la diapositiva de sitio: se arranca una vez)
})();
