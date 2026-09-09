// STARGATE — generador de enlaces, embeds y QR por PER y profesor/a
(function(){
  // 🔴 9-sep · CON DOS REFERENTES, EL CAMPO DE TEXTO SE QUEDA CORTO. `d.referente` es una cadena y
  // solo guarda al primero, asi que la cabecera decia «referente: Norberto» cuando el grupo tenia
  // titular Y ayudante (lo pidio Norberto: «habitualmente hay un profe referente y un ayudante»).
  // La verdad esta en el equipo docente, que lleva la marca por persona; el campo viejo queda de
  // reserva para los grupos creados antes del cambio.
  function referentes(d){
    var l=((d&&(d.docentes_full||d.docentes))||[])
      .filter(function(x){ return x.referente || /referente/.test(String(x.rol||'')); })
      .map(function(x){ return x.nombre; })
      .filter(function(x,i,a){ return x && a.indexOf(x)===i; });
    return l.length ? l.join(' · ') : ((d&&d.referente)||'—');
  }
  var API=(window.SG_TABLERO_API||"").trim(), root=document.getElementById('embed-app'), WEB=location.origin+location.pathname.replace(/[^/]*$/,'');
  if(location.protocol==='file:') WEB='https://stargate.mistercuarter.es/';
  var q=new URLSearchParams(location.search), st={per:q.get('per')||'',prof:q.get('profe')||'',pers:[],d:null};
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function ifr(u,h){return '<iframe src="'+u+'" width="100%" height="'+h+'" style="border:0;border-radius:16px" allowfullscreen loading="lazy"></iframe>';}
  function qr(u){return 'https://quickchart.io/qr?size=260&margin=2&dark=0e5f6c&text='+encodeURIComponent(u);}
  // 🔴 9-sep · REESCRITO POR SECCIONES. Antes eran ONCE bloques en una lista plana, mezclando lo del
  // profesorado con lo del alumnado y con DOS bloques que decian ser el tablero: uno («Tablero de
  // reclutas») traia el ranking MAS los tres formularios MAS la explicacion de las monedas, y el otro
  // era el limpio. Por eso el embed «no era lo que prometia»: el del nombre bonito era el sucio.
  // Ahora: primero lo del profesorado, despues lo del alumnado (con la Nave arriba del todo, que es
  // la puerta a todo lo demas) y los codigos de embed al final, en su seccion opcional.
  function enlace(t,desc,url,extra){return '<div class="card emb"><h3>'+t+'</h3><p class="small muted">'+desc+'</p>'
    +(url?'<div class="embrow"><input readonly value="'+esc(url)+'"><button class="btn small" data-c="'+esc(url)+'">Copiar enlace</button></div>':'')
    +(extra||'')+'</div>';}
  function conQR(u,n,per){return '<div class="qrbox"><img src="'+qr(u)+'" alt="QR"><a class="btn small" href="'+qr(u)+'" download="qr_'+n+'_'+esc(per)+'.png" target="_blank">Descargar QR</a></div>';}
  function emb(t,desc,code){return '<div class="card emb"><h3>'+t+'</h3><p class="small muted">'+desc+'</p>'
    +'<div class="embrow"><textarea readonly rows="2">'+esc(code)+'</textarea><button class="btn small primary" data-c="'+esc(code)+'">Copiar embed</button></div></div>';}

  function render(){var d=st.d;var per=st.per;var pe=st.prof?'&profe='+encodeURIComponent(st.prof):'';
    var profes=[d.referente].concat(String(d.profesorado||'').split(',')).map(function(x){return x.trim();}).filter(function(x,i,a){return x&&a.indexOf(x)===i;});
    var sel='<div class="selrow"><select id="selPer">'+st.pers.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===per?' selected':'')+'>'+esc(p.nombre)+' · '+esc(p.tipo)+'</option>';}).join('')+'</select>'
      +'<select id="selProf"><option value="">Soy… (elige tu nombre)</option>'+profes.map(function(p){return '<option value="'+esc(p)+'"'+(p===st.prof?' selected':'')+'>'+esc(p)+'</option>';}).join('')+'</select></div>';
    var uNave=WEB+'recluta.html?per='+per,
        uProy=WEB+'registro.html?per='+per+'&solo=1',
        uPlan=WEB+'panel.html?per='+per,
        uForo=WEB+'foro.html?per='+per+(d.inicio?'&inicio='+d.inicio+'&tipo='+(d.tipo||'REGULAR'):''),
        uTick=WEB+'tickets.html?per='+per+pe,
        uProf=WEB+'profes.html?per='+per;

    root.innerHTML='<div class="tab-head"><div><div class="eyebrow amber">Enlaces del grupo</div><h3>'+esc(d.nombre)+(st.prof?' · '+esc(st.prof):'')+'</h3><div class="small muted">'+esc(d.tipo)+' · '+esc(d.estado)+' · referente: '+esc(referentes(d))+'</div></div>'+sel+'</div>'

      // ───────────────────────── 1 · profesorado
      +'<h2 style="font-size:1.2rem;margin-top:6px">1 · Para el profesorado</h2>'
      +'<p class="lead small">Esto <b>no se reparte al alumnado</b>. Los dos paneles piden el PIN.</p>'
      +'<div class="grid cols-2">'
      +enlace('🧑\u200d🏫 La web del profesorado','El puesto de mando: la guía, la cronología semana a semana, las actividades y los recursos. Es el enlace que se pasa a un compañero que empieza.',WEB)
      +enlace('🔐 Panel del PER (con PIN)','Alumnos con nombre y correo, insignias, canjes, equipo docente, abrir y cerrar. Y ahí dentro está el <b>documento del PER</b>, que incluye el enlace de <b>edición</b> del Genially — por eso no puede estar en esta página, que es abierta.',uProf)
      +enlace('🎟️ Tickets de mi clase (con PIN)','Valoraciones y dudas'+(st.prof?' filtradas para <b>'+esc(st.prof)+'</b>':' (elige tu nombre arriba para filtrar por tu clase)')+'.',uTick)
      // 9-sep · Para enseñar la plataforma sin ser nadie (una charla, un compañero, SIMO). Solo sale
      // en grupos de prueba: en una clase real enseñaria la ficha de un alumno DE VERDAD, asi que
      // el modo demo ni existe alli. Misma regla que usa el Apps Script para sembrar alumnado falso.
      +(/DEMO|PRUEBA/.test(String(d.nombre||'').toUpperCase())
        ? enlace('🎬 Enseñar la plataforma (modo demostración)',
            'Abre la Nave <b>sin pedir correo</b>, con la ficha de un recluta de mentira, para enseñar cómo lo ve el alumnado. '
            +'Los formularios se pueden abrir y probar. <b>Solo funciona en grupos de prueba</b> como éste: en una clase real '
            +'enseñaría la ficha de un alumno auténtico, así que allí no existe.',
            WEB+'recluta.html?per='+encodeURIComponent(d.per)+'&demo=1')
        : '')
      +'</div>'

      // ───────────────────────── 2 · alumnado
      +'<h2 style="font-size:1.2rem;margin-top:30px">2 · Para el alumnado</h2>'
      +'<p class="lead small">Lo primero es la Nave: desde ahí se llega a todo lo demás. Los otros enlaces '
      +'sirven para poner un botón o un QR sueltos, pero no hace falta repartirlos todos.</p>'
      +'<div class="grid cols-2">'
      +enlace('🚀 La Nave del Recluta <span class="chip ok">empieza por aquí</span>','El hub del alumnado: se identifican con su correo una vez, y ahí tienen su ficha, la orden de la semana, los planetas que se van desbloqueando, las recompensas y el tablero. <b>Desde la Nave se llega a los tres formularios</b>, así que con este enlace basta.',uNave,conQR(uNave,'nave',per))
      +enlace('📽️ Ranking para proyectar en clase','El ranking del grupo y un botón a la Nave, sin nada más. <b>Ábrelo con tranquilidad cuando compartas pantalla:</b> esta página no pide PIN, así que el servidor NO le manda el correo ni el nombre real de nadie — no es que estén ocultos, es que no llegan.',uProy)
      +enlace('🪐 Panel de control (mapa de planetas)','Los 8 planetas sobre el universo en bucle; cada uno lleva al Genially de su tema, y se van <b>desbloqueando solos</b> con el calendario del grupo.',uPlan,conQR(uPlan,'panel',per))
      +'</div>'
      +'<h3 style="margin-top:22px">Los tres formularios</h3>'
      +'<p class="lead small">Están dentro de la Nave. Estos enlaces son para poner un QR en clase o un botón suelto.</p>'
      +'<div class="grid cols-3">'
      +enlace('📓 Bitácora de mando','Se alista y registra sus retos. El MISMO enlace para las dos cosas, todo el curso.',d.formBitacora,conQR(d.formBitacora,'bitacora',per))
      +enlace('🎟️ Ticket de salida','Anónimo. Al final de cada tema.',d.formTicket,conQR(d.formTicket,'ticket',per))
      +enlace('🎁 Canje de recompensas','Valida los créditos y responde por correo.',d.formCanje,conQR(d.formCanje,'canje',per))
      +'</div>'

      // ───────────────────────── 3 · embeds
      +'<h2 style="font-size:1.2rem;margin-top:34px">3 · Embeds para Genially <span class="chip">opcional</span></h2>'
      +'<p class="lead small">Solo si montas tu propio Genially. En Genially: <i>Insertar → Código embed</i>, '
      +'pega y ajusta al lienzo. Para los formularios es mejor un <b>botón con el enlace</b> que un embed: '
      +'se abren en pestaña nueva y el alumno inicia sesión en Google sin problemas.</p>'
      +'<div class="grid cols-2">'
      +emb('🚀 La Nave del Recluta','Lo más útil de esta sección: el alumno gestiona todo sin salir del Genially.',ifr(uNave+'&embed=1',900))
      +emb('📽️ Ranking del grupo','El ranking y el botón a la Nave. Sin datos de nadie.',ifr(WEB+'registro.html?per='+per+'&embed=1&solo=1',720))
      +emb('🪐 Mapa de planetas','Los ocho planetas, desbloqueándose con el calendario.',ifr(uPlan,620))
      +emb('💬 Foro de la semana','La orden de la semana en curso; cambia sola. Semana 1: '+esc(d.inicio||'sin fecha')+'.',ifr(uForo+'&embed=1',640))
      +emb('📊 Resultados del ticket (apaisado)','Para proyectar al final de la sesión, dentro de un Genially horizontal. Pide PIN.',ifr(uTick+'&embed=1&panorama=1',640))
      +'</div>'

      +'<div class="card doc-card" style="margin:26px 0 0"><h3>📄 ¿Buscas el documento con TODO el PER?</h3><p class="small muted">El que se genera al crear el grupo (enlaces, embeds, QR y los accesos de edición) vive en el <b>panel del profesorado</b>, que pide PIN.</p><a class="btn primary" href="profes.html?per='+esc(per)+'" target="_blank" rel="noopener">IR AL PANEL DEL PROFESORADO ↗</a></div>';

    document.getElementById('selPer').onchange=function(){st.per=this.value;st.prof='';cargar();};document.getElementById('selProf').onchange=function(){st.prof=this.value;render();};
    Array.prototype.forEach.call(root.querySelectorAll('button[data-c]'),function(b){b.onclick=function(){var t=b.getAttribute('data-c');function ok(){var o=b.textContent;b.textContent='¡Copiado!';setTimeout(function(){b.textContent=o;},1500);}
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok);else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();ok();}};});}
  function cargar(){root.innerHTML='<div class="cargando"><div class="txt">Cargando el PER…</div><div class="barra"><i></i></div></div>';fetch(API+'?per='+encodeURIComponent(st.per),{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){st.d=d;render();});}
  if(!API){root.innerHTML='<div class="wip"><span class="ic">🛰️</span><div>Pendiente de conectar.</div></div>';return;}
  fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){st.pers=d.pers||[];if(!st.pers.length){root.innerHTML='<p class="lead">Aún no hay PER.</p>';return;}if(!st.per)st.per=st.pers[st.pers.length-1].id;cargar();});
})();
