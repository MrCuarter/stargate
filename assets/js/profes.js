// STARGATE — panel del profesorado (PIN). profes.html[?per=id][&embed=1]
(function(){
  var API=(window.SG_TABLERO_API||"").trim(); var root=document.getElementById('profes-app'); if(!root) return;
  var q=new URLSearchParams(location.search); if(q.get('embed')==='1') document.body.classList.add('embed');
  var N=window.SG_BADGE_NAMES||{}, RET=window.SG_RETOS||{};
  var st={pin:sessionStorage.getItem('sgPin')||'',per:q.get('per')||'',pers:[],datos:null,vista:'alumnos'};
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function post(b,cb){b.pin=st.pin;fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)}).then(function(r){return r.json();}).then(function(d){if(d.error){if(/PIN/.test(d.error)){sessionStorage.removeItem('sgPin');st.pin='';pedirPin(d.error);return;}alert(d.error);return;}cb(d);}).catch(function(e){alert('Error: '+e.message);});}
  function f(d){try{return new Date(d).toLocaleDateString('es-ES');}catch(e){return d;}}
  function cargando(txt,pista){return '<div class="cargando"><div class="txt">'+txt+'</div><div class="barra"><i></i></div>'+(pista?'<div class="pista">'+pista+'</div>':'')+'</div>';}
  if(!API){root.innerHTML='<div class="wip"><span class="ic">🛰️</span><div><b>Panel pendiente de conectar</b> (falta la URL del web app).</div></div>';return;}
  function pedirPin(m){root.innerHTML='<div class="card" style="max-width:420px"><h3>Acceso del profesorado</h3><p class="small muted">'+esc(m||'Introduce el PIN compartido del profesorado.')+'</p><input id="pin" type="password" placeholder="PIN" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff"><button class="btn primary" id="okpin" style="margin-top:10px">Entrar</button></div>';
    document.getElementById('okpin').onclick=function(){st.pin=document.getElementById('pin').value.trim();sessionStorage.setItem('sgPin',st.pin);cargarPers();};
    document.getElementById('pin').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('okpin').click();});}
  function cargarPers(){root.innerHTML=cargando('Conectando con la hoja maestra…','Leyendo los PER');post({accion:'pers'},function(d){st.pers=d.pers||[];if(!st.per&&st.pers.length)st.per=st.pers[st.pers.length-1].id;cargarPer();});}
  function cargarPer(){root.innerHTML=cargando('Cargando el PER…','Reclutas, insignias, tickets y canjes');post({accion:'alumnos',per:st.per},function(d){st.datos=d;render();});}
  function sel(){return '<select id="selPer">'+st.pers.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===st.per?' selected':'')+'>'+(p.archivado?'\u{1F4E6} ':'')+esc(p.nombre)+' · '+esc(p.tipo)+' · '+(p.archivado?'archivado':esc(p.estado))+'</option>';}).join('')+'</select>';}
  function render(){var d=st.datos,p=st.pers.filter(function(x){return x.id===st.per;})[0]||{};
    root.innerHTML='<div class="tab-head"><div><div class="eyebrow amber">Panel del profesorado</div><h3>'+esc(d.nombre)+'</h3><div class="small muted">'+esc(d.tipo)+' · '+esc(d.estado)+' · referente: '+esc(d.referente||'—')+' · profesorado: '+esc(d.profesorado||'—')+' · semana 1: '+esc(d.inicio||'sin fecha')+(d.archivado?' · <b>\u{1F4E6} ARCHIVADO</b> ('+esc(d.archivado)+')':'')+'</div></div><div>'+sel()+'</div></div>'
      +'<div class="tabs"><button data-v="alumnos">👥 Alumnos ('+(d.reclutas||[]).length+')</button><button data-v="tickets">🎟️ Tickets de salida</button><button data-v="canjes">🎁 Canjes</button><button data-v="per">⚙️ Ajustes del PER</button><button class="salir">Salir</button></div><div id="vista"></div>';
    document.getElementById('selPer').onchange=function(){st.per=this.value;history.replaceState(null,'','?per='+st.per+(document.body.classList.contains('embed')?'&embed=1':''));cargarPer();};
    Array.prototype.forEach.call(root.querySelectorAll('.tabs button[data-v]'),function(b){b.onclick=function(){st.vista=b.getAttribute('data-v');vista();};if(b.getAttribute('data-v')===st.vista)b.classList.add('on');});
    root.querySelector('.salir').onclick=function(){sessionStorage.removeItem('sgPin');st.pin='';pedirPin();};
    vista();}
  function vista(){Array.prototype.forEach.call(root.querySelectorAll('.tabs button[data-v]'),function(b){b.classList.toggle('on',b.getAttribute('data-v')===st.vista);});var v=document.getElementById('vista');
    if(st.vista==='alumnos')vAlumnos(v);else if(st.vista==='tickets')vTickets(v);else if(st.vista==='canjes')vCanjes(v);else vPer(v);}
  function vAlumnos(v){var r=st.datos.reclutas||[];var retos=RET[st.datos.tipo]||[];
    v.innerHTML='<div class="buscar"><input id="bq" type="search" placeholder="Buscar por alias, nombre o correo…"></div><div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Alias</th><th>Nombre · correo</th><th>Planeta</th><th>Insignias</th><th>Nivel · xp · ◈</th><th></th></tr></thead><tbody>'
      +r.map(function(p,i){return '<tr class="al" data-k="'+esc((p.alias+' '+p.nombre+' '+p.email).toLowerCase())+'"><td>'+p.pos+'</td><td><b>'+esc(p.alias)+'</b></td><td>'+esc(p.nombre)+'<br><span class="small muted">'+esc(p.email)+'</span></td><td>'+esc(p.planeta)+'</td><td>'+p.n+'/24</td><td class="pts">N'+(SG.nivel?SG.nivel(p.xp,st.datos.tipo):1)+' · '+p.xp+' xp · '+(p.creditos!=null?p.creditos:(p.xp_disponibles||0))+' ◈</td><td><button class="btn small" data-i="'+i+'">Detalle</button></td></tr>';}).join('')+'</tbody></table></div><div id="detalle"></div>';
    document.getElementById('bq').addEventListener('input',function(){var t=this.value.trim().toLowerCase();Array.prototype.forEach.call(v.querySelectorAll('tr.al'),function(tr){tr.style.display=(!t||tr.getAttribute('data-k').indexOf(t)>=0)?'':'none';});});
    Array.prototype.forEach.call(v.querySelectorAll('button[data-i]'),function(b){b.onclick=function(){detalle(r[parseInt(b.getAttribute('data-i'),10)],retos);};});}
  function detalle(p,retos){var box=document.getElementById('detalle');var tiene={};Object.keys(p.retos||{}).forEach(function(k){tiene[k]=p.retos[k];});
    var filas=[['H1','Reclutamiento']].concat(retos.map(function(x){return [x[0],x[1]];})).map(function(x){var t=tiene[x[0]];
      return '<tr><td>'+esc(x[1])+'</td><td>'+(t?'<span class="chip ok">✓ '+esc(f(t.fecha))+' · '+esc(t.origen)+'</span>':'<span class="chip wip">pendiente</span>')+'</td><td>'+(t?'<button class="btn small" data-a="anular" data-r="'+x[0]+'">Anular</button>':'<button class="btn small" data-a="otorgar" data-r="'+x[0]+'">Otorgar</button>')+'</td></tr>';}).join('');
    box.innerHTML='<div class="card" style="margin-top:14px"><div class="tab-head"><div><h3>'+SG.avatarImg(p.avatar,p.alias,'',p.xp,st.datos.tipo)+esc(p.alias)+' <span class="small muted">'+esc(p.nombre)+' · '+esc(p.email)+'</span></h3>'+(p.bitacora?'<a href="'+esc(p.bitacora)+'" target="_blank" rel="noopener">📓 Abrir su Bitácora ↗</a>':'<span class="muted small">sin enlace de Bitácora</span>')+'</div><button class="btn small" id="cerrarDet">✕</button></div>'
      +'<div class="dots" style="margin:10px 0">'+Object.keys(N).filter(function(k){return p.insignias.indexOf(k)>=0;}).map(function(k){return '<img class="dot" src="assets/img/insignias/'+k+'.png" title="'+esc(N[k])+'">';}).join('')+'</div>'
      +'<div class="tablewrap"><table><thead><tr><th>Reto</th><th>Estado</th><th>Acción</th></tr></thead><tbody>'+filas+'</tbody></table></div>'
      +(p.canjes&&p.canjes.length?'<h4 class="small" style="margin-top:12px">Canjes</h4><ul class="small">'+p.canjes.map(function(c){return '<li>'+esc(f(c.fecha))+' · '+esc(c.recompensa)+' · '+esc(c.actividad)+(c.entregado?' · <b>entregado</b>':'')+'</li>';}).join('')+'</ul>':'')+'</div>';
    document.getElementById('cerrarDet').onclick=function(){box.innerHTML='';};
    Array.prototype.forEach.call(box.querySelectorAll('button[data-a]'),function(b){b.onclick=function(){var a=b.getAttribute('data-a'),r=b.getAttribute('data-r');var motivo=prompt((a==='anular'?'Anular':'Otorgar')+' «'+r+'» a '+p.alias+'. Motivo (opcional):');if(motivo===null)return;var profe=localStorage.getItem('sgProfe')||prompt('Tu nombre (para el registro):')||'';localStorage.setItem('sgProfe',profe);
      post({accion:'ajuste',per:st.per,email:p.email,reto_id:r,tipo:a,motivo:motivo,profe:profe},function(){cargarPer();});};});
    box.scrollIntoView({behavior:'smooth',block:'start'});}
  function vTickets(v){v.innerHTML='<p class="small muted">Panel visual de tickets (<a href="tickets.html?per='+encodeURIComponent(st.per)+'" target="_blank">abrir en grande ↗</a>)</p><iframe src="tickets.html?per='+encodeURIComponent(st.per)+'&embed=1" style="width:100%;height:900px;border:0;border-radius:16px"></iframe>';}
  function vCanjes(v){var r=st.datos.reclutas||[];var rows=[];r.forEach(function(p){(p.canjes||[]).forEach(function(c){rows.push({p:p,c:c});});});
    if(!rows.length){v.innerHTML='<p class="lead">Sin canjes concedidos todavía.</p>';return;}
    v.innerHTML='<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Alias</th><th>Nombre</th><th>Recompensa</th><th>Actividad</th><th>Entregado</th></tr></thead><tbody>'+rows.map(function(x){return '<tr><td>'+esc(f(x.c.fecha))+'</td><td><b>'+esc(x.p.alias)+'</b></td><td>'+esc(x.p.nombre)+'</td><td>'+esc(x.c.recompensa)+'</td><td>'+esc(x.c.actividad)+'</td><td>'+(x.c.entregado?'<span class="chip ok">'+esc(x.c.entregado)+'</span> <button class="btn small" data-f="'+x.c.fila+'" data-v="0">deshacer</button>':'<button class="btn small primary" data-f="'+x.c.fila+'" data-v="1">Marcar entregado</button>')+'</td></tr>';}).join('')+'</tbody></table></div>';
    Array.prototype.forEach.call(v.querySelectorAll('button[data-f]'),function(b){b.onclick=function(){var profe=localStorage.getItem('sgProfe')||prompt('Tu nombre:')||'';localStorage.setItem('sgProfe',profe);post({accion:'entregado',per:st.per,fila:parseInt(b.getAttribute('data-f'),10),valor:b.getAttribute('data-v')==='1',profe:profe},function(){cargarPer();});};});}
  function filaDoc(x,i){var e=function(t){return esc(t||'');};
    return '<tr data-d="'+i+'"><td><input class="dn" value="'+e(x.nombre)+'" placeholder="Nombre Apellido" style="width:100%;padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:#fff"></td>'
      +'<td><input class="dc" type="email" value="'+e(x.correo)+'" placeholder="correo@unir.net" style="width:100%;padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:#fff"></td>'
      +'<td style="text-align:center"><input class="dr" type="radio" name="refD"'+(/referente/.test(x.rol||'')?' checked':'')+'></td>'
      +'<td style="text-align:center"><input class="di" type="checkbox"'+(/imparte/.test(x.rol||'')?' checked':'')+'></td>'
      +'<td><button class="btn small" data-quitar="'+i+'">✕</button></td></tr>';}
  function vPer(v){var d=st.datos;var docs=(d.docentes_full||[]).slice();if(!docs.length)docs=[{nombre:d.referente||'',correo:'',rol:'referente+imparte'}];
    v.innerHTML='<div class="grid cols-2"><div class="card"><h3>Equipo docente</h3>'
      +'<p class="small muted">El <b>referente</b> gestiona el PER (solo uno). <b>Imparte</b> marca a quien da clase: son los nombres que ve el alumnado en su Bitácora y en el ticket. El referente puede ser las dos cosas. El <b>correo</b> es a quien se avisa cuando un canje necesita que alguien suba una nota.</p>'
      +'<div class="tablewrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Ref.</th><th>Imparte</th><th></th></tr></thead><tbody id="tbDoc">'+docs.map(filaDoc).join('')+'</tbody></table></div>'
      +'<button class="btn small" id="masDoc" style="margin-top:8px">+ Añadir docente</button> <button class="btn small primary" id="gprof" style="margin-top:8px">Guardar equipo</button>'
      +'<div class="small muted" style="margin-top:6px">Actualiza también el desplegable del ticket de salida y el de la Bitácora.</div></div>'
      +'<div class="card"><h3>Semana 1 (foro dinámico)</h3><input id="ini" type="date" value="'+esc(d.inicio||'')+'" style="padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff"><button class="btn small" id="gini" style="margin-top:8px">Guardar</button></div>'
      +'<div class="card"><h3>Formularios</h3><p class="small">Estado: <b>'+esc(d.estado)+'</b></p><button class="btn small" id="abrir">Abrir ahora</button> <button class="btn small" id="cerrar">Cerrar ahora</button>'
      +'<h3 style="margin-top:16px">\u{1F4E6} Archivar el PER</h3><p class="small muted">'+(d.archivado?'Este PER está <b>archivado</b>: no aparece en los listados del alumnado y sus pestañas están ocultas en la hoja. Los datos siguen intactos.':'Al terminar el curso, archívalo: se cierran los formularios, se ocultan sus pestañas en la hoja y desaparece de los listados del alumnado (Nave, foro, embeds). <b>No se borra nada</b> y su tablero sigue disponible por enlace directo.')+'</p>'
      +'<button class="btn small'+(d.archivado?' primary':'')+'" id="arch">'+(d.archivado?'Desarchivar':'Archivar este PER')+'</button>'
      +'<p class="small muted" style="margin-top:10px">¿Es un PER de prueba y quieres <b>borrarlo</b> del todo? Desde la hoja maestra: selecciona su fila en la pestaña <b>PERs</b> y menú <b>STARGATE \u2192 Ciclo de vida del PER \u2192 Borrar PER</b>.</p></div>'
      +'<div class="card doc-card" style="grid-column:1/-1"><h3>📄 Todo el PER en un documento</h3>'
      +'<p class="small muted">El mismo documento que se genera al crear el PER: <b>todos los enlaces, los códigos para incrustar en Genially y los QR</b>. Es lo que hay que pasarle al profesorado que imparte.</p>'
      +(d.doc?'<a class="btn primary grande" href="'+esc(d.doc)+'" target="_blank" rel="noopener">ABRIR EL DOCUMENTO DE ENLACES DEL PER ↗</a>'
             :'<p class="small">Este PER todavía no tiene documento. <button class="btn primary" id="gendoc">Generarlo ahora</button></p>')
      +' <a class="btn" href="embed.html?per='+esc(st.per)+'" target="_blank">Generador de enlaces, embeds y QR ↗</a>'
      +'<p class="small muted" style="margin-top:10px">Accesos rápidos: <a href="'+esc(d.formBitacora)+'" target="_blank">Bitácora de mando</a> · <a href="'+esc(d.formTicket)+'" target="_blank">Ticket de salida</a> · <a href="'+esc(d.formCanje)+'" target="_blank">Canje</a> · <a href="registro.html?per='+esc(st.per)+'" target="_blank">Tablero</a> · <a href="foro.html?per='+esc(st.per)+'" target="_blank">Foro dinámico</a> · <a href="recluta.html?per='+esc(st.per)+'" target="_blank">Nave del Recluta</a>'+(d.hoja?' · <a href="'+esc(d.hoja)+'" target="_blank">Hoja maestra</a>':'')+'</p></div>'
      +'<div class="card" style="grid-column:1/-1"><h3>🪐 Panel de control (Genially de los planetas)</h3><p class="small muted">'+(d.panelPropio?'Este PER usa un panel <b>propio</b>.':'Este PER usa el panel <b>estándar</b> compartido. Si quieres usar una copia tuya, pega aquí sus enlaces (vacía los dos campos para volver al estándar).')+'</p>'
      +'<label class="small muted">Enlace de VISUALIZACIÓN (lo ve el alumnado; view.genially.com/…)</label><input id="pver" value="'+esc(d.panelPropio&&d.panel?d.panel:'')+'" placeholder="'+esc(d.panelPropio?'':(d.panel||'sin panel estándar definido'))+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<label class="small muted" style="margin-top:8px;display:block">Enlace de EDICIÓN (solo profesorado; app.genially.com/editor/…)</label><input id="pedit" value="'+esc(d.panelPropio&&d.panelEdit?d.panelEdit:'')+'" placeholder="'+esc(d.panelPropio?'':(d.panelEdit||''))+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<button class="btn small" id="gpanel" style="margin-top:8px">Guardar panel</button>'+(d.panel?' <a class="btn small" href="'+esc(d.panel)+'" target="_blank" rel="noopener">Ver el panel actual ↗</a>':'')+(d.panelEdit?' <a class="btn small" href="'+esc(d.panelEdit)+'" target="_blank" rel="noopener">Editarlo ↗</a>':'')+'</div></div>';
    var gd=document.getElementById('gendoc'); if(gd)gd.onclick=function(){gd.textContent='Generando…';gd.disabled=true;post({accion:'documento',per:st.per},function(r){cargarPer();});};
    document.getElementById('arch').onclick=function(){var a=!d.archivado;if(a&&!confirm('¿Archivar «'+d.nombre+'»? Se cerrarán sus formularios y dejará de aparecer en los listados del alumnado. No se borra nada.'))return;post({accion:'archivar',per:st.per,valor:a},function(){cargarPers();});};
    document.getElementById('gpanel').onclick=function(){post({accion:'panel',per:st.per,ver:document.getElementById('pver').value.trim(),editar:document.getElementById('pedit').value.trim()},function(){cargarPer();});};
    document.getElementById('masDoc').onclick=function(){var tb=document.getElementById('tbDoc');var i=tb.children.length;tb.insertAdjacentHTML('beforeend',filaDoc({nombre:'',correo:'',rol:'imparte'},i));wireDoc();};
    function wireDoc(){Array.prototype.forEach.call(document.querySelectorAll('button[data-quitar]'),function(b){b.onclick=function(){b.closest('tr').remove();};});}
    wireDoc();
    document.getElementById('gprof').onclick=function(){
      var docentes=[],ref='';
      Array.prototype.forEach.call(document.querySelectorAll('#tbDoc tr'),function(tr){
        var n=tr.querySelector('.dn').value.trim(),c=tr.querySelector('.dc').value.trim();if(!n)return;
        var esRef=tr.querySelector('.dr').checked,da=tr.querySelector('.di').checked;
        if(esRef&&!ref)ref=n; if(!esRef&&!da)da=true;
        docentes.push({nombre:n,correo:c,rol:(esRef?'referente':'')+(esRef&&da?'+':'')+(da?'imparte':'')});});
      if(!docentes.length){alert('Añade al menos un docente');return;}
      var malos=docentes.filter(function(x){return x.correo&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.correo);});
      if(malos.length){alert('Revisa el correo de '+malos[0].nombre);return;}
      post({accion:'profesorado',per:st.per,referente:ref,
            profesorado:docentes.filter(function(x){return /imparte/.test(x.rol)&&x.nombre!==ref;}).map(function(x){return x.nombre;}).join(', '),
            docentes:docentes},function(){cargarPer();});};
    document.getElementById('gini').onclick=function(){post({accion:'inicio',per:st.per,inicio:document.getElementById('ini').value},function(){cargarPer();});};
    document.getElementById('abrir').onclick=function(){post({accion:'abrir',per:st.per},function(){cargarPer();});};
    document.getElementById('cerrar').onclick=function(){if(confirm('¿Cerrar los formularios de este PER?'))post({accion:'cerrar',per:st.per},function(){cargarPer();});};}
  if(st.pin)cargarPers();else pedirPin();
})();
