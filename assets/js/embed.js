// STARGATE — generador de enlaces, embeds y QR por PER y profesor/a
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), root=document.getElementById('embed-app'), WEB=location.origin+location.pathname.replace(/[^/]*$/,'');
  if(location.protocol==='file:') WEB='https://stargate.mistercuarter.es/';
  var q=new URLSearchParams(location.search), st={per:q.get('per')||'',prof:q.get('profe')||'',pers:[],d:null};
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function ifr(u,h){return '<iframe src="'+u+'" width="100%" height="'+h+'" style="border:0;border-radius:16px" allowfullscreen loading="lazy"></iframe>';}
  function qr(u){return 'https://quickchart.io/qr?size=260&margin=2&dark=0e5f6c&text='+encodeURIComponent(u);}
  function bloque(t,desc,url,code,extra){return '<div class="card emb"><h3>'+t+'</h3><p class="small muted">'+desc+'</p>'
    +(url?'<div class="embrow"><input readonly value="'+esc(url)+'"><button class="btn small" data-c="'+esc(url)+'">Copiar enlace</button></div>':'')
    +(code?'<div class="embrow"><textarea readonly rows="2">'+esc(code)+'</textarea><button class="btn small primary" data-c="'+esc(code)+'">Copiar embed</button></div>':'')+(extra||'')+'</div>';}
  function render(){var d=st.d;var per=st.per;var pe=st.prof?'&profe='+encodeURIComponent(st.prof):'';
    var profes=[d.referente].concat(String(d.profesorado||'').split(',')).map(function(x){return x.trim();}).filter(function(x,i,a){return x&&a.indexOf(x)===i;});
    var sel='<div class="selrow"><select id="selPer">'+st.pers.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===per?' selected':'')+'>'+esc(p.nombre)+' · '+esc(p.tipo)+'</option>';}).join('')+'</select>'
      +'<select id="selProf"><option value="">Soy… (elige tu nombre)</option>'+profes.map(function(p){return '<option value="'+esc(p)+'"'+(p===st.prof?' selected':'')+'>'+esc(p)+'</option>';}).join('')+'</select></div>';
    var uReg=WEB+'registro.html?per='+per, uForo=WEB+'foro.html?per='+per, uTick=WEB+'tickets.html?per='+per+pe, uProf=WEB+'profes.html?per='+per, uNave=WEB+'recluta.html?per='+per;
    root.innerHTML='<div class="tab-head"><div><div class="eyebrow amber">Generador de enlaces y embeds</div><h3>'+esc(d.nombre)+(st.prof?' · '+esc(st.prof):'')+'</h3><div class="small muted">'+esc(d.tipo)+' · '+esc(d.estado)+' · referente: '+esc(d.referente||'—')+'</div></div>'+sel+'</div>'
      +'<div class="card doc-card" style="margin:10px 0 18px"><h3>📄 ¿Buscas el documento con TODO el PER?</h3><p class="small muted">El documento que se genera al crear el PER (enlaces, embeds y QR, incluidos los del profesorado) está en el <b>panel del profesorado</b>, que pide PIN: contiene accesos de edición y no puede estar abierto aquí.</p><a class="btn primary grande" href="profes.html?per='+esc(per)+'" target="_blank" rel="noopener">IR AL PANEL DEL PROFESORADO ↗</a></div>'
      +'<div class="official" style="margin:8px 0 18px;display:block">🧩 <b>Cómo se incrusta en Genially:</b> en tu Genially, <i>Insertar → Código embed (o «Insertar» → «Código»)</i>, pega el código y ajusta el tamaño al lienzo. Para los formularios, mejor un <b>botón con el enlace</b> (se abre en pestaña nueva y el alumno inicia sesión en Google sin problemas) o el <b>QR</b> para proyectar en clase.</div>'
      +'<h2 style="font-size:1.2rem">Para el Genially del alumnado</h2><div class="grid cols-2">'
      +bloque('🚀 La Nave del Recluta','El hub del alumnado: onboarding con NEBULA, la orden de cada semana, los planetas que se desbloquean, su ficha y las recompensas. Embed para el Genially del PER, o enlace/QR directo.',uNave,ifr(uNave+'&embed=1',900),'<div class="qrbox"><img src="'+qr(uNave)+'" alt="QR"><a class="btn small" href="'+qr(uNave)+'" download="qr_nave_'+esc(per)+'.png" target="_blank">Descargar QR</a></div>')
      +bloque('📓 Bitácora de mando (registro de insignias)','Enlace para un botón. Es personal por alumno: inicia sesión con Google y edita su respuesta cuando gana una insignia.',d.formBitacora,null,'<div class="qrbox"><img src="'+qr(d.formBitacora)+'" alt="QR"><a class="btn small" href="'+qr(d.formBitacora)+'" download="qr_bitacora_'+esc(per)+'.png" target="_blank">Descargar QR</a></div>')
      +bloque('🏆 Tablero de reclutas','Ranking, insignias y botones de los 3 formularios. Embébelo en la página principal del Genially del PER.',uReg,ifr(uReg+'&embed=1',760))
      +bloque('💬 Foro dinámico (la orden de la semana)','Muestra solo la semana en curso y cambia solo. Semana 1: '+esc(d.inicio||'sin fecha (ponla en el panel)')+'.',uForo,ifr(uForo+'&embed=1',640))
      +bloque('🎟️ Ticket de salida «Contacta con NEBULA»','Anónimo. Botón o QR al final de cada tema.',d.formTicket,null,'<div class="qrbox"><img src="'+qr(d.formTicket)+'" alt="QR"><a class="btn small" href="'+qr(d.formTicket)+'" download="qr_ticket_'+esc(per)+'.png" target="_blank">Descargar QR</a></div>')
      +bloque('🎁 Canje de xp','Botón. Valida los xp y responde por correo.',d.formCanje,null,'<div class="qrbox"><img src="'+qr(d.formCanje)+'" alt="QR"><a class="btn small" href="'+qr(d.formCanje)+'" download="qr_canje_'+esc(per)+'.png" target="_blank">Descargar QR</a></div>')
      +'</div><h2 style="font-size:1.2rem;margin-top:26px">Para el Genially del profesorado (con PIN)</h2><div class="grid cols-2">'
      +bloque('🎟️ Tickets de mi clase','Valoraciones y dudas'+(st.prof?' filtradas para <b>'+esc(st.prof)+'</b>':' (elige tu nombre arriba para filtrar por tu clase)')+'.',uTick,ifr(uTick+'&embed=1',900))
      +bloque('🔐 Panel del PER','Alumnos, insignias, canjes, equipo docente, abrir/cerrar.',uProf,ifr(uProf+'&embed=1',900))
      +'</div>';
    document.getElementById('selPer').onchange=function(){st.per=this.value;st.prof='';cargar();};document.getElementById('selProf').onchange=function(){st.prof=this.value;render();};
    Array.prototype.forEach.call(root.querySelectorAll('button[data-c]'),function(b){b.onclick=function(){var t=b.getAttribute('data-c');function ok(){var o=b.textContent;b.textContent='¡Copiado!';setTimeout(function(){b.textContent=o;},1500);}
      if(navigator.clipboard)navigator.clipboard.writeText(t).then(ok);else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();ok();}};});}
  function cargar(){root.innerHTML='<p class="muted">Cargando…</p>';fetch(API+'?per='+encodeURIComponent(st.per),{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){st.d=d;render();});}
  if(!API){root.innerHTML='<div class="wip"><span class="ic">🛰️</span><div>Pendiente de conectar.</div></div>';return;}
  fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){st.pers=d.pers||[];if(!st.pers.length){root.innerHTML='<p class="lead">Aún no hay PER.</p>';return;}if(!st.per)st.per=st.pers[st.pers.length-1].id;cargar();});
})();
