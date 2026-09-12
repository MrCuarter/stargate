// STARGATE — tablero del alumnado. registro.html?per=<id>[&embed=1][&ranking=xp|semana|coleccion]
// v3.18 · TRES RANKINGS. Con uno solo siempre gana el mismo perfil. Ahora hay tres formas de
// destacar: el que más ha trabajado en total, el que más ha apretado ESTA semana (así quien llega
// tarde sigue teniendo algo que ganar) y el coleccionista, que va de gastar créditos y de suerte.
// El orden lo decide el modo; los datos son siempre los mismos y las tres columnas se ven a la vez.
(function(){
  var API=(window.SG_TABLERO_API||"").trim(); var root=document.getElementById('tablero-app'); if(!root) return;
  var q=new URLSearchParams(location.search), per=q.get('per');
  // v3.37 · ALOJADO: este mismo ranking vive ahora DENTRO de la Nave del Recluta. Es la única página
  // web que se le da al alumnado, así que el tablero tenía que estar ahí — hasta hoy la Nave
  // enlazaba a registro.html, que es la web del profesorado con la guía de instalación.
  // 🔴 Cuando va alojado NO se tocan las clases del <body>: «solo-ranking» esconde todas las
  // secciones que no llevan el tablero dentro, o sea que dejaría la Nave en blanco.
  var alojado=!!window.SG_TABLERO_ALOJADO;
  var embed=q.get('embed')==='1'; if(embed&&!alojado) document.body.classList.add('embed');
  // v3.20 · &solo=1 · SOLO EL RANKING, para incrustarlo en un Genially sin nada alrededor: fuera los
  // botones de los formularios y fuera la cabecera. Lo que queda es la competición y nada más.
  var solo=alojado||q.get('solo')==='1'; if(solo&&!alojado) document.body.classList.add('solo-ranking');
  var N=window.SG_BADGE_NAMES||{};
  var ORDEN=["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa","R1_la-chispa","R2_el-eco-que-ensena","R3_la-matriz","R4_entorno-de-aula","R5_bitacora-medida","R6_el-juego","R7_microgamificacion","R8_ultimo-umbral","E1_nebula","E2_capitan","E3_vaeon","H1_reclutamiento","H2_primera-forja","H3_cartografo","H4_tripulacion-cero","H5_la-liberacion"];
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function msg(h){root.innerHTML='<div class="wip"><span class="ic">🛰️</span><div>'+h+'</div></div>';}
  var FUENTE=(window.SG&&SG.FUENTE)||null;
  if(!API&&(!FUENTE||FUENTE.nombre!=='firestore')){msg('<b>Tablero pendiente de conectar.</b> Falta la URL del web app (guía de instalación, abajo).');return;}
  // 🔴 Este tablero es el que vive DENTRO de los Geniallys del profesorado, donde no hay sesión de
  // nadie. Por eso pide los datos a la fuente y no a Firestore: con el motor nuevo hay una puerta
  // pública de solo lectura montada justo para esto.
  function fallo(e){msg('<b>No se pudo cargar el tablero.</b> '+esc(e&&e.message||e));}
  function lista(cb){ (FUENTE?FUENTE.lista():fetch(API+'?per=all').then(function(r){return r.json();})).then(cb).catch(fallo); }
  function uno(id,cb){ (FUENTE?FUENTE.tablero(id):fetch(API+'?per='+encodeURIComponent(id)).then(function(r){return r.json();})).then(cb).catch(fallo); }
  if(!per){lista(function(d){if(!d.pers||!d.pers.length){msg('<b>Aún no hay ningún PER.</b>');return;}
    root.innerHTML='<h3>Elige tu PER</h3><div class="pers">'+d.pers.map(function(p){return '<a class="btn" href="?per='+encodeURIComponent(p.id)+(embed?'&embed=1':'')+'">'+esc(p.nombre)+' <small>· '+esc(p.tipo)+' · '+esc(p.estado)+'</small></a>';}).join('')+'</div>';});return;}
  msg('Cargando el tablero…');
  function dots(p){return ORDEN.map(function(k){var on=p.insignias.indexOf(k)>=0;return '<img class="dot'+(on?'':' off')+'" src="assets/img/insignias/'+k+'.png" title="'+esc(N[k]||k)+(on?'':' (pendiente)')+'" alt="">';}).join('');}

  // ---------- la colección ----------
  // El servidor manda el desglose y un pct SIN redondear: con 35 piezas, redondear antes de ordenar
  // metería empates falsos. Aquí se redondea solo para pintarlo.
  function pctCol(p){return p.coleccion?p.coleccion.pct:0;}
  // 🔴 DOS DECIMALES, ni uno más. Con 35 piezas de colección salen numeros como 27.272727272727273,
  // y eso en pantalla no es precisión: es ruido. Se redondea SOLO al pintar; el valor crudo sigue
  // ordenando el ranking, que es para lo que hace falta entero.
  function pct2(v){ return String(Math.round((Number(v) || 0) * 100) / 100); }
  function colTxt(p){
    if(!p.coleccion) return '—';
    var c=p.coleccion;
    var det='Cartas '+c.cromos.tengo+'/'+c.cromos.total+' · héroes '+c.heroes.tengo+'/'+c.heroes.total+' · skins '+c.skins.tengo+'/'+c.skins.total;
    return '<span class="'+(c.tengo===c.total?'muted full':'muted')+'" title="'+esc(det)+'">'+pct2(c.pct)+'%</span>'
      +(p.n_album?' <span class="sello-serie mini" title="Series completas">✦'+p.n_album+'</span>':'');}

  // ---------- los tres modos ----------
  var MODOS=[
    {k:'xp', et:'⚡ Más xp', col:'xp',
     ayuda:'Los xp que has ganado desde que empezaste. <b>Nunca bajan</b>: canjear recompensas no te quita puestos.',
     val:function(p){return p.xp;}, unidad:' xp', vacio:'Todavía nadie ha registrado nada.'},
    {k:'semana', et:'🔥 Esta semana', col:'sem',
     ayuda:'xp ganados en los <b>últimos 7 días</b>. Se renueva solo, así que da igual cómo empezaste: esta semana salís todos de cero.',
     val:function(p){return p.xp7||0;}, unidad:' xp', soloConValor:true,
     vacio:'Esta semana todavía no ha registrado nada nadie. La carrera está abierta.'},
    {k:'coleccion', et:'🃏 Colección', col:'col',
     ayuda:'Lo que <b>tienes</b>, no lo que has trabajado: cartas del álbum, héroes de la Rebelión y versiones de tu personaje. Al 100 % lo tienes TODO.',
     val:pctCol, unidad:' %', pct:true, soloConValor:true,
     vacio:'Nadie ha empezado a coleccionar todavía. Los sobres se abren desde la semana 2.'},
    /**
     * 🔴 12-sep · CINCO RANKINGS MÁS, y no son cinco veces el mismo dato. Norberto lo dijo bien:
     * «quiero dar la oportunidad a todos de brillar en algún momento». Eso no se consigue con más
     * tablas de xp — se consigue midiendo COSAS DISTINTAS, para que quien no destaca trabajando
     * destaque siendo constante, o coleccionando, o terminando lo que empieza.
     */
    {k:'escuadron', et:'🛡️ Mi escuadrón', col:'xp', soloSiSeQuienSoy:true,
     ayuda:'Solo tu gente. En una clase de doscientos, ser el 40.º no dice nada; ser el 3.º de los tuyos, sí.',
     val:function(p){return p.xp;}, unidad:' xp', filtro:function(p){ return mismoEscuadron(p); },
     vacio:'Todavía no hay nadie más en tu escuadrón.'},
    {k:'racha', et:'📆 Constancia', col:'racha',
     ayuda:'Semanas <b>seguidas</b> registrando algo. Premia a quien no falla, que es justo lo que el ranking de xp no ve.',
     val:function(p){return p.racha||0;}, unidad:function(v){return v===1?' semana':' semanas';}, soloConValor:true,
     vacio:'Nadie lleva todavía una racha. Con registrar algo dos semanas seguidas ya sales aquí.'},
    {k:'insignias', et:'🏅 Insignias', col:'n',
     ayuda:'Cuántas llevas de las 24. No es lo mismo que los xp: se puede tener mucha experiencia con pocas insignias.',
     val:function(p){return p.n||0;}, unidad:'', soloConValor:true,
     vacio:'Todavía no se ha entregado ninguna insignia.'},
    {k:'planetas', et:'🪐 Explorador', col:'pl',
     ayuda:'Planetas <b>completos</b>: temas con todos sus retos cerrados. Premia terminar lo que se empieza en vez de picotear.',
     // 🔴 `planetas_completos` es un ARRAY con los números de los temas cerrados, no un contador.
     // Restando dos arrays sale NaN y el orden se rompe SIN error: la tabla salía en el orden en que
     // llegaron los datos y parecía un ranking.
     val:function(p){var v=p.planetas_completos; return Array.isArray(v)?v.length:(v||0);},
     unidad:function(v){return v===1?' planeta':' planetas';}, soloConValor:true,
     vacio:'Nadie ha cerrado un planeta entero todavía. El primero que lo haga sale aquí solo.'},
    {k:'escuadrones', et:'⚔️ Escuadrones', col:'xp', porEquipos:true,
     ayuda:'Los escuadrones entre sí, por <b>media de xp por recluta</b>. 🔴 Por media y no por total: sumando ganaría siempre el más numeroso, y eso no mediría nada.',
     val:function(p){return p.xp;}, unidad:' xp de media',
     vacio:'Todavía no hay escuadrones con gente dentro.'}
  ];
  /** Quién soy, si la página lo sabe (la Nave lo dice; el tablero proyectado, no). */
  function yoSoy(){ return (window.SG_YO_ALIAS||'').trim(); }
  function mismoEscuadron(p){
    var d=window.SG_TABLERO_DATA||{}, mio=(d.reclutas||[]).filter(function(x){return x.alias===yoSoy();})[0];
    return !!mio && String(p.profe||'')===String(mio.profe||'');
  }
  // ---------- v3.29 · LA FICHA DEL RECLUTA ----------
  // Se abre al pulsar su fila en el ranking. Este tablero se INCRUSTA en un Genially que ve toda la
  // clase, así que enseña lo justo: el personaje que lleva puesto, su bio, nivel, xp, insignias y
  // cartas. Y a propósito NO enseña:
  //   · los personajes ganados —héroes y versiones del avatar—: son la sorpresa de ir avanzando, y
  //     verlos de antemano en la ficha de otro le quita la gracia a la tuya;
  //   · los créditos: cuánto dinero tiene cada uno no es asunto de la clase;
  //   · el correo ni el nombre real: ninguno de los dos sale siquiera del Apps Script (batería 33).
  // Todo eso SÍ lo ve el profesorado en su sala, que está detrás del PIN.
  function cerrarFicha(){var o=document.getElementById('ficha-recluta'); if(o) o.style.display='none';}
  function abrirFicha(clave){
    var p=(window.__fichas||{})[clave]; if(!p) return;
    var d=window.__d||{};
    var av=SG.avatarSrc(p.avatar,p.alias,p.xp,d.tipo);
    var ins=(p.insignias||[]).map(function(k){
      return '<span class="fr-ins"><img src="assets/img/insignias/'+k+'.png" alt=""><em>'+esc(N[k]||k)+'</em></span>';}).join('');
    var CR=window.SG_CROMOS||[];
    var mios=Object.keys(p.cromos||{});
    var cro=mios.map(function(k){var c=CR.filter(function(x){return x[0]===k;})[0];
      var n=(p.cromos||{})[k]||1;
      return '<span class="fr-cro"><img src="assets/img/tarjetas/'+k+'_carta.png'+(window.SG_CARDV||'')+'" alt="">'
        +'<em>'+esc(c?c[1]:k)+(n>1?' ×'+n:'')+'</em></span>';}).join('');
    var col=p.coleccion||{};
    var o=document.getElementById('ficha-recluta');
    if(!o){o=document.createElement('div');o.id='ficha-recluta';o.className='lupa';document.body.appendChild(o);}
    o.innerHTML='<div class="lupa-fondo"></div><div class="fr-caja" role="dialog" aria-label="Ficha de '+esc(p.alias)+'">'
      +'<button class="lupa-x" aria-label="Cerrar">×</button>'
      +'<div class="fr-cab"><img class="fr-av'+(p.marco==='oro'?' marco-oro':'')+'" src="'+esc(av.src)+'" alt="">'
        +'<div><div class="eyebrow amber">'+esc(av.rango)+' · puesto '+p._pos+'</div>'
        +'<h3>'+(p.corona?'👑 ':'')+esc(p.alias)+'</h3>'
        +(p.titulo?'<div class="titulo-recluta">«'+esc(p.titulo)+'»</div>':'')
        +'<div class="small muted">Nivel '+(SG.nivel?SG.nivel(p.xp,d.tipo):1)+' · '+p.xp+' xp · planeta '+esc(p.planeta)
        +(p.racha>=3?' · 🔥 '+p.racha+' semanas seguidas':'')+'</div></div></div>'
      +(p.bio?'<p class="fr-bio">«'+esc(p.bio)+'»</p>':'')
      +'<div class="fr-kpis">'
        +'<div><b>'+p.n+'</b><span>de 24 insignias</span></div>'
        +'<div><b>'+(col.cromos?col.cromos.tengo:0)+'</b><span>de '+(col.cromos?col.cromos.total:20)+' cartas</span></div>'
        +'<div><b>'+pct2(p.coleccion?p.coleccion.pct:0)+'%</b><span>del juego</span></div></div>'
      +(ins?'<h4>Insignias</h4><div class="fr-lista">'+ins+'</div>':'')
      +(cro?'<h4>Cartas del álbum</h4><div class="fr-lista">'+cro+'</div>':'')
      +'</div>';
    o.style.display='flex';
    o.querySelector('.lupa-fondo').onclick=cerrarFicha;
    o.querySelector('.lupa-x').onclick=cerrarFicha;
  }
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') cerrarFicha(); });

  function modoDe(k){for(var i=0;i<MODOS.length;i++) if(MODOS[i].k===k) return MODOS[i]; return MODOS[0];}
  var modo=modoDe(q.get('ranking')||'xp');

  uno(per,function(d){
    if(d.error){msg('<b>'+esc(d.error)+'</b>');return;}
    // v3.38 · los datos se comparten con quien viva en la misma página: el «duelo» de la Nave
    // calcula con ellos quién va justo delante y quién pisa los talones, sin pedirlos otra vez.
    try{window.SG_TABLERO_DATA=d;document.dispatchEvent(new CustomEvent('sg:tablero'));}catch(e){}
    var todos=d.reclutas||[];
    var forms='<div class="cta-row" style="justify-content:flex-start">'+(d.formBitacora?'<a class="btn primary" href="'+esc(d.formBitacora)+'" target="_blank" rel="noopener">📓 Mi Bitácora de mando (registrar lo que he hecho)</a>':'')
      +(d.formTicket?'<a class="btn" href="'+esc(d.formTicket)+'" target="_blank" rel="noopener">🎟️ Ticket de salida</a>':'')
      +(d.formCanje?'<a class="btn" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🛸 Mercado Estelar</a>':'')+'</div>';

    /**
     * EL RANKING DE EQUIPOS. Cada escuadrón se convierte en una fila con la MEDIA de sus reclutas.
     *
     * 🔴 Media y no suma. Con la suma gana siempre el escuadrón más numeroso, y entonces la tabla no
     * mide cómo va cada equipo: mide cuánta gente tiene. Sería un ranking que no se puede remontar.
     */
    function porEquipos(m){
      var esc=d.escuadrones||[], porComandante={};
      esc.forEach(function(e){ porComandante[e.comandante]=e; });
      var grupos={};
      todos.forEach(function(p){
        var k=String(p.profe||'').trim(); if(!k) return;
        (grupos[k]=grupos[k]||[]).push(p);
      });
      return Object.keys(grupos).map(function(k){
        var g=grupos[k], e=porComandante[k]||{};
        var suma=g.reduce(function(a,p){return a+m.val(p);},0);
        return { alias: e.nombre||k, avatar:null, _equipo:true, _n:g.length,
                 _emblema: e.emblema||'', _lema: e.lema||'', _comandante:k,
                 xp: Math.round(suma/g.length), n:0, insignias:[],
                 _val: Math.round(suma/g.length) };
      });
    }
    function clasificar(m){
      var r;
      if(m.porEquipos){ r=porEquipos(m); }
      else {
        r=todos.slice();
        if(m.filtro) r=r.filter(m.filtro);
        if(m.soloConValor) r=r.filter(function(p){return m.val(p)>0;});
      }
      var valor=m.porEquipos?function(p){return p._val;}:m.val;
      // desempate SIEMPRE igual y estable: la métrica, luego xp, luego insignias, luego el alias
      r.sort(function(a,b){return valor(b)-valor(a) || b.xp-a.xp || b.n-a.n || a.alias.localeCompare(b.alias);});
      var pos=0,ant=null;
      r.forEach(function(p,i){var v=valor(p); if(ant===null||v!==ant){pos=i+1;ant=v;} p._pos=pos;});  // empatados, mismo puesto
      return r;
    }
    function unidadDe(m,v){ return typeof m.unidad==='function'?m.unidad(v):(m.unidad||''); }
    function cifra(p,m){
      var v=m.porEquipos?p._val:m.val(p);
      return (m.pct?pct2(v):v)+unidadDe(m,v);
    }

    /**
     * EL RANKING DE ESCUADRONES SE PINTA APARTE, y no por pereza: una fila de equipo no tiene
     * planeta, ni insignias, ni avatar, ni nivel. Meterla en la tabla de personas obligaría a poner
     * guiones en media docena de columnas — que es la forma más rápida de que una tabla deje de
     * leerse. Lo que sí tiene un escuadrón: su emblema, su lema, cuánta gente y su media.
     */
    function pintaEquipos(){
      var r=clasificar(modo);
      var visibles=MODOS.filter(function(m){ return !m.soloSiSeQuienSoy || yoSoy(); });
      var pestanas='<div class="rank-tabs" role="tablist">'+visibles.map(function(m){
          return '<button type="button" class="rank-tab'+(m.k===modo.k?' on':'')+'" data-modo="'+m.k+'" role="tab" aria-selected="'+(m.k===modo.k)+'">'+m.et+'</button>';}).join('')
        +'</div><p class="small muted rank-ayuda">'+modo.ayuda+'</p>';
      var cuerpo = r.length
        ? '<div class="esc-grid">'+r.map(function(e,i){
            return '<div class="esc-card'+(i===0?' lider':'')+'">'
              +'<div class="esc-pos">'+e._pos+'</div>'
              +(e._emblema?'<img class="esc-emb" loading="lazy" src="'+esc(e._emblema)+'" alt="">':'')
              +'<div class="esc-txt"><b>'+esc(e.alias)+'</b>'
              +(e._lema?'<em>«'+esc(e._lema)+'»</em>':'')
              +'<span class="small muted">'+esc(e._comandante)+' · '+e._n+' recluta'+(e._n===1?'':'s')+'</span></div>'
              +'<div class="esc-val">'+cifra(e,modo)+'</div></div>';
          }).join('')+'</div>'
        : '<div class="wip"><span class="ic">🛰️</span><div>'+modo.vacio+'</div></div>';
      root.innerHTML=(solo?'':'<div class="tab-head"><div><div class="eyebrow amber">'+esc(d.nombre)+' · '+esc(d.tipo)+' · '+esc(d.estado)+'</div><h3>Ranking de escuadrones</h3></div>'
        +'<div class="small muted">'+r.length+' escuadrones · '+todos.length+' reclutas</div></div>')
        +pestanas+cuerpo;
      cablearPestanas();
    }
    function cablearPestanas(){
      Array.prototype.forEach.call(root.querySelectorAll('[data-modo]'),function(b){
        b.onclick=function(){ modo=modoDe(b.getAttribute('data-modo'));
          try{ var u=new URL(location.href); u.searchParams.set('ranking',modo.k); history.replaceState(null,'',u); }catch(e){}
          pintaTodo(); };
      });
    }
    function pintaTodo(){ if(modo.porEquipos) pintaEquipos(); else pinta(); }

    function pinta(){
      var r=clasificar(modo), top=r.slice(0,3);
      var visibles=MODOS.filter(function(m){ return !m.soloSiSeQuienSoy || yoSoy(); });
      var pestanas='<div class="rank-tabs" role="tablist">'+visibles.map(function(m){
          return '<button type="button" class="rank-tab'+(m.k===modo.k?' on':'')+'" data-modo="'+m.k+'" role="tab" aria-selected="'+(m.k===modo.k)+'">'+m.et+'</button>';}).join('')
        +'</div><p class="small muted rank-ayuda">'+modo.ayuda+'</p>';
      var podio=top.length?'<div class="podium">'+[1,0,2].map(function(i){var p=top[i];if(!p)return '';
        var cls=['gold','silver','bronze'][i],med=['🥇','🥈','🥉'][i];
        return '<div class="pod '+cls+'"><div class="medal">'+med+'</div>'+SG.avatarImg(p.avatar,p.alias,'big'+(p.marco==='oro'?' marco-oro':''),p.xp,d.tipo)
          +'<div><b>'+(p.corona?'👑 ':'')+esc(p.alias)+'</b></div>'+(p.titulo?'<div class="titulo-recluta">«'+esc(p.titulo)+'»</div>':'')
          +'<div class="rango">Nivel '+(SG.nivel?SG.nivel(p.xp,d.tipo):1)+' · '+SG.avatarSrc(p.avatar,p.alias,p.xp,d.tipo).rango+'</div>'
          +'<div class="pts">'+cifra(p,modo)+'</div><div class="h"></div></div>';}).join('')+'</div>':'';
      var th=function(c){return modo.col===c?' class="on"':'';};
      var td=function(c,extra){return ' class="'+(extra||'')+(modo.col===c?' on':'')+'"';};
      window.__d=d; window.__fichas={};   // para abrirla al pulsar, sin volver a pedir nada
      var filas=r.map(function(p){
        window.__fichas[p.alias.toLowerCase()]=p;
        return '<tr class="clicable" data-ficha="'+esc(p.alias.toLowerCase())+'" data-alias="'+esc(p.alias.toLowerCase())+'" tabindex="0" title="Ver la ficha de '+esc(p.alias)+'"><td><b>'+p._pos+'</b></td>'
          +'<td class="who">'+SG.avatarImg(p.avatar,p.alias,p.marco==='oro'?'marco-oro':'')+'<span><b>'+(p.corona?'👑 ':'')+esc(p.alias)+'</b>'
          +(p.racha>=3?'<span class="chip-racha" title="'+p.racha+' semanas seguidas registrando algo">🔥 '+p.racha+'</span>':'')
          +(p.titulo?'<em class="titulo-recluta">«'+esc(p.titulo)+'»</em>':'')+'</span></td>'
          +'<td>'+esc(p.planeta)+'</td><td>'+p.n+'/24</td>'
          +'<td'+td('col','small')+'>'+colTxt(p)+'</td>'
          +'<td class="small"><b>'+(SG.nivel?SG.nivel(p.xp,d.tipo):1)+'</b> <span class="muted">'+esc(SG.avatarSrc(p.avatar,p.alias,p.xp,d.tipo).rango)+'</span></td>'
          +'<td'+td('xp','pts')+'>'+p.xp+'</td>'
          +'<td'+td('sem','small')+'>'+(p.xp7||0)+'</td>'
          +'</tr>'
          +'<tr class="insrow" data-alias="'+esc(p.alias.toLowerCase())+'"><td colspan="8"><div class="dots">'+dots(p)+'</div></td></tr>';}).join('');
      root.innerHTML=(solo?'':'<div class="tab-head"><div><div class="eyebrow amber">'+esc(d.nombre)+' · '+esc(d.tipo)+' · '+esc(d.estado)+'</div><h3>Ranking de reclutas</h3></div>'
        +'<div class="small muted">'+todos.length+' reclutas · '+new Date(d.actualizado).toLocaleString('es-ES')+'</div></div>')
        // 🔴 9-sep · EN «SOLO EL RANKING» va un boton a la Nave, y nada mas. Lo pidio Norberto: el
        // embed del Genially tiene que ser el ranking de SU grupo y una puerta para que el alumno
        // entre a su panel a registrar y canjear. Ni los tres formularios sueltos ni la cabecera:
        // desde la Nave se llega a todo, y asi el Genially no se convierte en una lista de enlaces.
        +(solo
            ? '<div class="cta-row" style="justify-content:center;margin:0 0 14px">'
              +'<a class="btn primary grande" href="recluta.html?per='+encodeURIComponent(per)
              +'" target="_blank" rel="noopener">🚀 Entrar en mi Nave — registrar y canjear</a></div>'
            : forms)+pestanas+podio
        +'<div class="buscar"><input id="buscaAlias" type="search" placeholder="Busca tu alias…" autocomplete="off"><span class="small muted">pulsa en cualquier recluta para ver su ficha · «Semana» son los xp de los últimos 7 días</span></div>'
        +(r.length?'<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Recluta</th><th>Planeta</th><th>Insignias</th>'
            +'<th'+th('col')+' title="Cartas, héroes y versiones de tu personaje">Colección</th><th>Nivel</th>'
            +'<th'+th('xp')+'>xp</th><th'+th('sem')+' title="xp de los últimos 7 días">Semana</th></tr></thead>'
            +'<tbody id="rankBody">'+filas+'</tbody></table></div>'
          :'<p class="lead">'+(todos.length?modo.vacio:'Todavía nadie se ha alistado. Sé el primero: rellena tu Bitácora de mando.')+'</p>');
      var inp=document.getElementById('buscaAlias');
      if(inp){inp.addEventListener('input',function(){var t=inp.value.trim().toLowerCase();
        Array.prototype.forEach.call(document.querySelectorAll('#rankBody tr'),function(tr){
          tr.style.display=(!t||tr.getAttribute('data-alias').indexOf(t)>=0)?'':'none';});});}
      Array.prototype.forEach.call(root.querySelectorAll('tr[data-ficha]'),function(tr){
        tr.onclick=function(){abrirFicha(tr.getAttribute('data-ficha'));};
        tr.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirFicha(tr.getAttribute('data-ficha'));}};});
      Array.prototype.forEach.call(root.querySelectorAll('.rank-tab'),function(b){
        b.onclick=function(){
          modo=modoDe(b.getAttribute('data-modo'));
          // el modo va en la URL: así se puede enlazar «el ranking de la semana» y sobrevive a un F5
          try{var u=new URL(location.href); u.searchParams.set('ranking',modo.k); history.replaceState(null,'',u);}catch(e){}
          pintaTodo();
        };});
    }
    // 🔴 El ranking se pinta al cargar, y en ese momento la Nave todavía no ha dicho quién eres —
    // por eso «Mi escuadrón» no aparecía. Se deja un tirador para que lo repinte cuando lo sepa.
    window.SG_RANKING_REPINTA = pintaTodo;
    pintaTodo();
  });
})();
