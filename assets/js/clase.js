// STARGATE — La sala del docente. clase.html[?per=<id>][&profe=<nombre>]
// Un único sitio: sus grupos (en marcha y pasados), lo que requiere SU intervención, las dudas del
// ticket filtrables por tema y fecha, su grupo con corrección de errores, y los enlaces del PER.
// Escribe de verdad: otorgar/anular retos, marcar canjes aplicados, resolver tickets y corregir fichas.
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), root=document.getElementById('clase-app');
  if(!root) return;
  var N=window.SG_BADGE_NAMES||{}, RET=window.SG_RETOS||{}, SEM=window.SG_SEMANAS||[];
  var q=new URLSearchParams(location.search);
  if(q.get('embed')==='1') document.body.classList.add('embed');
  var st={pin:sessionStorage.getItem('sgPin')||'', profe:q.get('profe')||localStorage.getItem('sgProfe')||'',
          per:q.get('per')||localStorage.getItem('sgClasePer')||'', pers:[], d:null, tickets:[],
          tema:'', dias:'14', soloMios:true, vista:'hoy'};
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function f(v){try{var d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('es-ES',{day:'2-digit',month:'short'});}catch(e){return String(v);}}
  function cargando(t,p){return '<div class="cargando"><div class="txt">'+t+'</div><div class="barra"><i></i></div>'+(p?'<div class="pista">'+p+'</div>':'')+'</div>';}
  function post(b,cb,err){b.pin=st.pin;
    fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)})
      .then(function(r){return r.json();}).then(function(d){
        if(d.error){ if(/PIN/.test(d.error)){sessionStorage.removeItem('sgPin');st.pin='';pedirPin(d.error);return;}
          if(err)err(d.error); else alert(d.error); return; }
        cb(d);
      }).catch(function(e){alert('Error de red: '+e.message);});}
  function pedirPin(m){
    root.innerHTML='<div class="card" style="max-width:440px"><h3>Sala del docente</h3>'
      +'<p class="small muted">'+esc(m||'Entra con el PIN compartido del profesorado.')+'</p>'
      +'<input id="pin" type="password" placeholder="PIN" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<button class="btn primary" id="okpin" style="margin-top:10px">Entrar</button></div>';
    document.getElementById('okpin').onclick=function(){st.pin=document.getElementById('pin').value.trim();sessionStorage.setItem('sgPin',st.pin);inicio();};
    document.getElementById('pin').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('okpin').click();});}

  // ---------- quién eres ----------
  function todosLosDocentes(){var m={};st.pers.forEach(function(p){(p.docentes||[]).forEach(function(d){if(d.nombre)m[d.nombre]=1;});});return Object.keys(m).sort();}
  function misPers(){return st.pers.filter(function(p){return (p.docentes||[]).some(function(d){return d.nombre===st.profe;});});}
  function estadoPer(p){
    var n=(p.tipo==='PUA'?10:15);
    if(p.archivado) return 'pasado';
    if(p.semana==null) return 'sin fecha';
    if(p.semana<1) return 'por empezar';
    return p.semana>n ? 'pasado' : 'en marcha';
  }
  function elegirDocente(){
    var ds=todosLosDocentes();
    root.innerHTML='<div class="card" style="max-width:520px"><h3>¿Quién eres?</h3>'
      +'<p class="small muted">Se guarda en este navegador. Toda la sala se filtra por ti: solo verás tus grupos y tus alumnos.</p>'
      +(ds.length?'<div class="selrow"><select id="selD"><option value="">— elige tu nombre —</option>'
        +ds.map(function(x){return '<option value="'+esc(x)+'">'+esc(x)+'</option>';}).join('')
        +'</select><button class="btn primary" id="okD">Entrar</button></div>'
        :'<p class="small">Todavía no hay docentes dados de alta. El profe referente los añade al crear el PER, o en el <a href="profes.html">panel</a> → Ajustes del PER.</p>')
      +'</div>';
    var b=document.getElementById('okD');
    if(b)b.onclick=function(){var v=document.getElementById('selD').value;if(!v)return;st.profe=v;localStorage.setItem('sgProfe',v);cargarPers();};}

  // ---------- carga ----------
  function inicio(){ root.innerHTML=cargando('Abriendo tu sala…','Buscando tus grupos'); cargarPers(); }
  function cargarPers(){
    post({accion:'pers'},function(d){
      st.pers=(d.pers||[]).filter(function(p){return p.id;});
      if(!st.profe||todosLosDocentes().indexOf(st.profe)<0){elegirDocente();return;}
      var mios=misPers();
      if(!mios.length){render();return;}
      if(!st.per||!mios.some(function(p){return p.id===st.per;})){
        var vivo=mios.filter(function(p){return estadoPer(p)==='en marcha';})[0]||mios[0];
        st.per=vivo.id;
      }
      localStorage.setItem('sgClasePer',st.per);
      cargarPer();
    });}
  function cargarPer(){
    root.innerHTML=cargando('Cargando '+esc(st.per)+'…','Alumnos, canjes y tickets');
    post({accion:'alumnos',per:st.per},function(d){ st.d=d;
      post({accion:'tickets',per:st.per},function(t){ st.tickets=t.tickets||[];
        // si hay un pase abierto de hace un rato, que siga a la vista al recargar la sala
        post({accion:'pase_estado',per:st.per},function(pp){ st.pase=pp.pase||null; render(); },
             function(){ st.pase=null; render(); });
      }, function(){ st.tickets=[]; render(); });
    });}

  // ---------- piezas ----------
  function mios(){var r=(st.d&&st.d.reclutas)||[];return st.soloMios?r.filter(function(x){return x.profe===st.profe;}):r;}
  function pendientes(){   // canjes concedidos que TIENE que aplicar una persona
    var out=[];
    mios().forEach(function(p){ (p.canjes||[]).forEach(function(c){
      if(c.entregado) return;
      if(!/nota|recalificar|Subir/i.test(c.recompensa)) return;
      out.push({p:p,c:c}); }); });
    return out.sort(function(a,b){return new Date(a.c.fecha)-new Date(b.c.fecha);});}
  function ticketsMios(){
    var KP='profesor o profesora', KS='Selecciona el tema';
    var lim=st.dias==='todo'?0:Date.now()-Number(st.dias)*864e5;
    return st.tickets.filter(function(t){
      var campos=t.r||{}, prof='', tema='';
      Object.keys(campos).forEach(function(k){ if(k.indexOf(KP)>=0)prof=String(campos[k]||''); if(k.indexOf(KS)>=0)tema=String(campos[k]||''); });
      t._prof=prof; t._tema=tema;
      if(st.soloMios&&prof&&prof!==st.profe) return false;
      if(st.tema&&tema!==st.tema) return false;
      if(lim){ try{ if(new Date(t.fecha).getTime()<lim) return false; }catch(e){} }
      return true;
    }).sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);});}

  // v3.14 · 2026-12-27 -> 27/12/2026
  function fecha(iso){ if(!iso) return '—'; var p=String(iso).split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:esc(String(iso)); }
  function cabecera(){
    var mp=misPers(), act=st.pers.filter(function(p){return p.id===st.per;})[0]||{};
    var opc=mp.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===st.per?' selected':'')+'>'+esc(p.nombre)+' · '+estadoPer(p)+'</option>';}).join('');
    return '<div class="tab-head" id="sala-cabecera"><div><div class="eyebrow teal">Sala del docente · '+esc(st.profe)+'</div>'
      +'<h3>'+esc(act.nombre||'—')+'</h3>'
      +'<p class="small muted">'+esc(act.tipo||'')+' · '+estadoPer(act)
      +(act.semana!=null&&act.semana>0?' · semana '+act.semana:'')+' · '+((st.d&&st.d.reclutas)||[]).length+' reclutas en el PER'
      +' · <b>'+mios().length+'</b> tuyos</p>'
      // v3.14 · hasta cuándo se registra y hasta cuándo se canjea: el docente lo necesita para
      // avisar en clase, y son fechas distintas a propósito
      +((st.d&&st.d.cierre_misiones)
        ? '<p class="small muted">🗓️ Misiones hasta el <b>'+fecha(st.d.cierre_misiones)+'</b>'
          +(st.d.cierre_canje&&st.d.cierre_canje!==st.d.cierre_misiones
            ? ' · canje hasta el <b>'+fecha(st.d.cierre_canje)+'</b> <span class="muted">(una semana más: la de reclamar lo ganado)</span>'
            : '')+'</p>'
        : '')
      +'</div>'
      +'<div class="selrow">'+(mp.length>1?'<select id="selPer">'+opc+'</select>':'')
      +'<button class="btn small" id="cambiarD">No soy '+esc(st.profe)+'</button></div></div>';}

  // v3.27 · EL PASE DE LISTA. El docente abre una ventana de unos minutos y su pantalla enseña una
  // consigna de cuatro letras; quien esté en la clase la teclea en su Nave. La consigna se muestra
  // AQUI y en ningun otro sitio: si viajara a la Nave del alumno, no haria falta estar en clase.
  function bloquePase(){
    var p=st.pase;
    if(!p||!p.hasta||new Date(p.hasta)<=new Date())
      return '<div class="card" id="sala-pase"><h3>🎓 Pase de lista en directo</h3>'
        +'<p class="small muted">Abre una ventana y enseña la consigna en pantalla. Quien esté en clase la teclea en su Nave y se lleva unos créditos. Una vez por sesión.</p>'
        +'<p><button class="btn primary" id="abrirPase">Abrir el pase de lista</button></p>'
        +'<p class="small muted">Ojo: esto premia estar en la clase en directo, no es un control de asistencia — la consigna se puede pasar por chat.</p></div>';
    return '<div class="card pase-abierto" id="sala-pase"><h3>🎓 Pase de lista ABIERTO</h3>'
      +'<p class="small muted">Enséñales esta pantalla. Se cierra sola.</p>'
      +'<div class="consigna">'+esc(p.palabra)+'</div>'
      +'<p class="small muted">Cierra a las <b>'+hora(p.hasta)+'</b> · <span id="cuenta"></span></p>'
      +'<p><button class="btn small" id="abrirPase">Abrir otra ventana</button></p></div>';}

  function hora(d){var x=new Date(d);return ('0'+x.getHours()).slice(-2)+':'+('0'+x.getMinutes()).slice(-2)+':'+('0'+x.getSeconds()).slice(-2);}
  function cuentaAtras(){
    var e=document.getElementById('cuenta'); if(!e||!st.pase)return;
    var s=Math.round((new Date(st.pase.hasta)-new Date())/1000);
    if(s<=0){st.pase=null;render();return;}
    e.textContent='quedan '+Math.floor(s/60)+' min '+('0'+(s%60)).slice(-2)+' s';
    setTimeout(cuentaAtras,1000);}

  // v3.28 · CADA DOCENTE, SU GENIALLY. Algunos retocan el panel para sus alumnos; los suyos deben
  // ver el suyo. Si lo deja vacio, sus alumnos ven el del grupo (y ese, el estandar).
  function bloquePanel(){
    var yo=((st.d&&st.d.docentes)||[]).filter(function(d){return d.nombre===st.profe;})[0]||{};
    var delPer=(st.d&&st.d.panel)||'';
    return '<div class="card" id="sala-panel"><h3>🪐 Tu panel de Genially</h3>'
      +'<p class="small muted">Es lo que abren TUS alumnos desde la Nave. Dejalo vacio y veran el del grupo.</p>'
      +'<div class="pase-fila" style="max-width:640px">'
      +'<input id="miPanel" style="flex:1;min-width:260px" placeholder="https://view.genially.com/..." value="'+esc(yo.panel||'')+'">'
      +'<button class="btn primary" id="guardarPanel">Guardar</button></div>'
      +'<p class="small muted">'+(yo.panel?'Ahora mismo tus alumnos ven <b>el tuyo</b>.'
         :('Ahora mismo tus alumnos ven el del grupo: '+(delPer?'<a href="'+esc(delPer)+'" target="_blank" rel="noopener">'+esc(delPer)+'</a>':'<b>ninguno, no hay panel definido</b>')))
      +'</p><p class="small muted" id="msgPanel"></p></div>';}

  function bloqueIntervencion(){
    var pd=pendientes(), tk=ticketsMios().filter(function(t){return !t.resuelto;});
    var filas=pd.map(function(x,i){
      return '<tr><td>'+esc(f(x.c.fecha))+'</td><td><b>'+esc(x.p.alias)+'</b><br><span class="small muted">'+esc(x.p.nombre||x.p.email)+'</span></td>'
        +'<td>'+esc(x.c.recompensa)+'</td><td>'+esc(x.c.actividad||'—')+'</td>'
        +'<td><button class="btn small primary" data-apl="'+x.c.fila+'">Ya lo he aplicado</button></td></tr>';}).join('');
    // v3.13 · los reclutas que no han dicho quién les da clase: sin eso el aviso de sus canjes no
    // le llega a ninguna persona concreta. Es lo primero que hay que arreglar, así que va arriba.
    var sinDoc=((st.d&&st.d.reclutas)||[]).filter(function(x){return !String(x.profe||'').trim();});
    var avisoSinDoc = sinDoc.length
      ? '<div class="card" style="border-color:#f5b043"><h3>⚠ '+sinDoc.length+' recluta(s) sin docente asignado</h3>'
        +'<p class="small">No han contestado «¿Quién imparte tu clase?». Cuando canjeen algo que haya que aplicar '
        +'a mano, el aviso <b>no le llegará a ninguna persona concreta</b>: solo al profe referente. '
        +'Asígnaselos tú desde <b>Mi grupo</b> → «Corregir».</p>'
        +'<p class="small muted">'+sinDoc.slice(0,8).map(function(x){return esc(x.alias||x.email||'');}).join(' · ')
        +(sinDoc.length>8?' …':'')+'</p>'
        +'<p><button class="btn small" id="verSinDoc">Ver a todo el grupo y corregirlo →</button></p></div>'
      : '';
    return '<section id="sala-intervencion"><div class="eyebrow amber">Lo primero</div><h2>Requiere tu intervención</h2>'
      +avisoSinDoc
      +(pd.length
        ? '<p class="lead">Estos canjes ya están cobrados y el alumno lo sabe: falta que tú los apliques.</p>'
          +'<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Recluta</th><th>Recompensa</th><th>Actividad</th><th></th></tr></thead><tbody>'+filas+'</tbody></table></div>'
        : '<p class="lead">Nada pendiente. '+(tk.length?'Tienes <b>'+tk.length+'</b> duda(s) del ticket de salida sin resolver, ahí abajo.':'Ni dudas sin resolver. Puedes entrar a clase tranquilo.')+'</p>')
      +'</section>';}

  function bloqueClase(){
    var t=ticketsMios(), temas={};
    st.tickets.forEach(function(x){ var k=''; Object.keys(x.r||{}).forEach(function(c){ if(c.indexOf('Selecciona el tema')>=0)k=String(x.r[c]||''); }); if(k)temas[k]=(temas[k]||0)+1; });
    var sem=(st.d&&st.d.semana)||0;
    var s=SEM.filter(function(x){return x.sem===sem;})[0];
    var filas=t.map(function(x){
      var txt=[];
      Object.keys(x.r||{}).forEach(function(c){ if(c.indexOf('profesor o profesora')<0&&c.indexOf('Selecciona el tema')<0&&String(x.r[c]||'').trim()) txt.push('<b>'+esc(c)+':</b> '+esc(x.r[c])); });
      return '<tr><td>'+esc(f(x.fecha))+'</td><td>'+esc(x._tema||'—')+'</td><td>'+(txt.join('<br>')||'<span class="muted">—</span>')+'</td>'
        +'<td>'+(x.resuelto?'<span class="chip ok">resuelto</span> <button class="btn small" data-tk="'+x.fila+'" data-v="0">deshacer</button>'
                          :'<button class="btn small primary" data-tk="'+x.fila+'" data-v="1">Resuelto</button>')+'</td></tr>';}).join('');
    return '<section id="sala-clase"><div class="eyebrow violet">Antes de entrar</div><h2>Con qué empezar la clase</h2>'
      +(s?'<div class="card"><h3>La orden de la semana '+sem+' · '+esc(s.tema)+'</h3><p class="small">'+esc(s.sub||'')+'</p>'
        +'<p class="small"><b>Se lanza:</b> '+esc((s.lanza||[]).join(' · ')||'—')+'</p>'
        +'<p><a class="btn small" href="foro.html?per='+encodeURIComponent(st.per)+'" target="_blank" rel="noopener">Ver el mensaje del foro para copiar ↗</a> '
        +'<a class="btn small" href="cronologia.html#sem'+sem+'" target="_blank" rel="noopener">La semana entera ↗</a></p></div>':'')
      +'<h3 style="margin-top:1.2em">Dudas del ticket de salida</h3>'
      +'<div class="selrow" style="margin-bottom:10px">'
      +'<select id="selTema"><option value="">Todos los temas</option>'
      +Object.keys(temas).sort().map(function(k){return '<option value="'+esc(k)+'"'+(k===st.tema?' selected':'')+'>'+esc(k)+' ('+temas[k]+')</option>';}).join('')+'</select>'
      +'<select id="selDias">'+[['7','última semana'],['14','últimos 15 días'],['30','último mes'],['todo','todo el curso']]
        .map(function(o){return '<option value="'+o[0]+'"'+(o[0]===st.dias?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>'
      +(t.length?'<div class="tablewrap"><table><thead><tr><th>Fecha</th><th>Tema</th><th>Lo que dicen</th><th></th></tr></thead><tbody>'+filas+'</tbody></table></div>'
                :'<p class="lead">Ningún ticket con ese filtro.</p>')
      +'</section>';}

  function bloqueGrupo(){
    var r=mios();
    var filas=r.map(function(p,i){
      var ult=(p.eventos||[]).length?f((p.eventos||[]).map(function(e){return e.fecha;}).sort().pop()):'—';
      return '<tr class="clicable" data-al-fila="'+i+'" title="Ver la ficha de '+esc(p.alias)+'"><td>'+p.pos+'</td><td><b>'+esc(p.alias)+'</b><br><span class="small muted">'+esc(p.nombre||'')+'</span></td>'
        +'<td class="small">'+esc(p.email||'')+'</td>'
        +'<td>'+(String(p.profe||'').trim()?esc(p.profe):'<span class="chip" style="background:#f5b04333;color:#8a5b00">⚠ sin docente</span>')+'</td>'
        +'<td>N'+p.nivel+' <span class="small muted">'+esc(p.rango_nombre||'')+'</span></td>'
        +'<td class="pts">'+p.xp+'</td><td>'+p.creditos+' ◈</td><td>'+p.n+'/24</td><td class="small muted">'+ult+'</td>'
        +'<td><button class="btn small" data-al="'+i+'">Corregir</button></td></tr>';}).join('');
    return '<section id="sala-grupo"><div class="eyebrow teal">Tu gente</div><h2>Mi grupo</h2>'
      +'<p class="lead">Todo se corrige desde aquí: no hace falta abrir ninguna hoja de cálculo. '
      +'<label class="small" style="margin-left:8px"><input type="checkbox" id="chkMios"'+(st.soloMios?' checked':'')+'> solo mis alumnos</label></p>'
      +(r.length?'<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Recluta</th><th>Correo</th><th>Docente</th><th>Nivel</th><th>xp</th><th>◈</th><th>Insignias</th><th>Últ. registro</th><th></th></tr></thead><tbody>'+filas+'</tbody></table></div><div id="ficha"></div>'
        :'<p class="lead">Ningún recluta te ha elegido todavía como docente. Si ya tienes clase, revisa que hayan respondido «¿Quién imparte tu clase?» en su Bitácora — o desmarca «solo mis alumnos» y corrígeselo tú.</p>')
      +'</section>';}

  function bloqueColeccion(p){
    var N=window.SG_BADGE_NAMES||{}, CR=window.SG_CROMOS||[], HE=window.SG_HEROES||[];
    var col=p.coleccion||{};
    var ins=(p.insignias||[]).map(function(k){
      return '<span class="fr-ins"><img src="assets/img/insignias/'+k+'.png" alt=""><em>'+esc(N[k]||k)+'</em></span>';}).join('');
    var cro=Object.keys(p.cromos||{}).map(function(k){var c=CR.filter(function(x){return x[0]===k;})[0];
      var n=(p.cromos||{})[k]||1;
      return '<span class="fr-cro"><img src="assets/img/tarjetas/'+k+'_carta.png'+(window.SG_CARDV||'')+'" alt="">'
        +'<em>'+esc(c?c[1]:k)+(n>1?' \u00d7'+n:'')+'</em></span>';}).join('');
    var her=(p.heroes||[]).map(function(k){var h=HE.filter(function(x){return x[0]===k;})[0];
      return '<span class="fr-cro"><img src="assets/img/heroes/'+k+'.jpg" alt=""><em>'+esc(h?h[1]:k)+'</em></span>';}).join('');
    var pct=Math.round((Number(col.pct)||0)*100)/100;
    return '<div style="margin-top:16px">'
      +(p.bio?'<p class="fr-bio">\u00ab'+esc(p.bio)+'\u00bb</p>':'')
      +'<div class="fr-kpis">'
        +'<div><b>'+p.n+'</b><span>de 24 insignias</span></div>'
        +'<div><b>'+(col.cromos?col.cromos.tengo:0)+'</b><span>de '+(col.cromos?col.cromos.total:20)+' cartas</span></div>'
        +'<div><b>'+(col.heroes?col.heroes.tengo:0)+'</b><span>de '+(col.heroes?col.heroes.total:30)+' h\u00e9roes</span></div>'
        +'<div><b>'+p.creditos+' \u25c8</b><span>cr\u00e9ditos · '+pct+' % del juego</span></div></div>'
      +(ins?'<h4>Insignias</h4><div class="fr-lista">'+ins+'</div>':'')
      +(cro?'<h4>Cartas del \u00e1lbum</h4><div class="fr-lista">'+cro+'</div>':'')
      +(her?'<h4>Personajes ganados</h4><div class="fr-lista">'+her+'</div>':'')
      +'</div>';}

  function fichaAlumno(p){
    var box=document.getElementById('ficha'); if(!box) return;
    var tipo=(st.d&&st.d.tipo)||'REGULAR', cat=RET[tipo]||[];
    var docs=((st.d&&st.d.docentes)||[]).map(function(d){return d.nombre;});
    if(docs.indexOf(p.profe)<0&&p.profe) docs.push(p.profe);
    box.innerHTML='<div class="card" style="margin-top:14px"><div class="tab-head"><div><h3>'+esc(p.alias)+' <span class="small muted">'+esc(p.nombre||'')+' · '+esc(p.email||'')+'</span></h3></div><button class="btn small" id="cerrarF">✕</button></div>'
      +'<div class="grid cols-2"><div><h4>Corregir su ficha</h4><p class="small muted">Se escribe en su respuesta de la Bitácora, que es de donde sale la identidad del tablero.</p>'
      +'<label class="small muted">Alias</label><input id="fAlias" value="'+esc(p.alias)+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<label class="small muted" style="margin-top:8px;display:block">Nombre y apellidos</label><input id="fNombre" value="'+esc(p.nombre||'')+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<label class="small muted" style="margin-top:8px;display:block">Docente</label><select id="fProfe" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<option value="">— sin indicar —</option>'+docs.map(function(x){return '<option value="'+esc(x)+'"'+(x===p.profe?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>'
      +'<label class="small muted" style="margin-top:8px;display:block">Enlace a su Bitácora (ePortfolio)</label><input id="fBit" value="'+esc(p.bitacora||'')+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<button class="btn primary small" id="fGuardar" style="margin-top:10px">Guardar</button> <span id="fMsg" class="small muted"></span></div>'
      +'<div><h4>Sus retos</h4><p class="small muted">Marca lo que de verdad ha hecho: los xp y las insignias se recalculan solos.</p>'
      +'<div class="tablewrap" style="max-height:340px;overflow:auto"><table><tbody>'
      +cat.map(function(x){var tiene=!!(p.retos||{})[x[0]];
        return '<tr><td class="small">'+esc(x[1])+'</td><td>'+(tiene
          ?'<span class="chip ok">hecho</span> <button class="btn small" data-aj="anular" data-r="'+x[0]+'">quitar</button>'
          :'<button class="btn small" data-aj="otorgar" data-r="'+x[0]+'">dárselo</button>')+'</td></tr>';}).join('')
      +'</tbody></table></div></div></div>'
      // v3.29 · Aqui SI se enseña todo lo que el tablero publico esconde: el correo (arriba), los
      // creditos, los personajes ganados y las versiones desbloqueadas. Esta pantalla vive detras
      // del PIN y es la de quien tiene que poder ayudar a un alumno concreto.
      + bloqueColeccion(p)
      +'</div>';
    document.getElementById('cerrarF').onclick=function(){box.innerHTML='';};
    document.getElementById('fGuardar').onclick=function(){
      var m=document.getElementById('fMsg'); m.textContent='Guardando…';
      post({accion:'ficha',per:st.per,email:p.email,alias:document.getElementById('fAlias').value.trim(),
            nombre:document.getElementById('fNombre').value.trim(),profe:document.getElementById('fProfe').value,
            bitacora:document.getElementById('fBit').value.trim(),profe_edita:st.profe},
        function(){ m.textContent='Guardado.'; cargarPer(); },
        function(e){ m.textContent=e; });};
    Array.prototype.forEach.call(box.querySelectorAll('button[data-aj]'),function(b){
      b.onclick=function(){ b.disabled=true;
        post({accion:'ajuste',per:st.per,email:p.email,reto_id:b.getAttribute('data-r'),
              tipo:b.getAttribute('data-aj'),motivo:'corregido en la sala del docente',profe:st.profe},
          function(){ cargarPer(); });};});}

  function bloqueEnlaces(){
    var d=st.d||{};
    // La clave (data-acc) la usa la visita guiada para señalar el enlace CONCRETO del que habla.
    function a(t,u,n,k){return u?'<a class="acceso" data-acc="'+k+'" href="'+esc(u)+'" target="_blank" rel="noopener"><span class="ic">'+t+'</span><b>'+n+'</b></a>':'';}
    // v3.36 · EN DOS BLOQUES. Antes iban los diez en la misma rejilla y con la misma pinta, así que
    // el «Tablero del grupo» —que es registro.html, o sea la web del método con la guía de
    // instalación y el acceso con PIN— parecía tan repartible como la Bitácora. Arriba, lo que se
    // comparte; abajo, lo que no sale de aquí.
    return '<section id="sala-enlaces"><div class="eyebrow">Sin buscar en Drive</div><h2>Los enlaces de este grupo</h2>'
      +'<h3 class="acc-tit acc-alu">✅ Esto sí se comparte con el alumnado</h3>'
      +'<p class="acc-nota">Cinco cosas, y no hay una sexta: los tres formularios, su Nave y el Genially.</p>'
      +'<div class="accesos">'
      +a('📓',d.formBitacora,'Bitácora: se alistan y registran retos','bitacora')
      +a('🚀','recluta.html?per='+encodeURIComponent(st.per),'La Nave del recluta','nave')
      +a('🎟️',d.formTicket,'Ticket de salida','ticket')
      +a('🎁',d.formCanje,'Canje de recompensas','canje')
      +a('🪐',d.panel,'Panel de control (Genially)','panel')
      +'</div>'
      +'<h3 class="acc-tit acc-profe">🔒 Solo para el profesorado — no lo repartas</h3>'
      +'<p class="acc-nota">El tablero y el foro sí se enseñan en clase, pero <b>embebidos dentro del Genially</b>'
      +' (el código está en «Enlaces, embeds y QR»). Sus enlaces sueltos llevan a la web del profesorado.</p>'
      +'<div class="accesos">'
      +a('🏆','registro.html?per='+encodeURIComponent(st.per),'Tablero del grupo','tablero')
      +a('💬','foro.html?per='+encodeURIComponent(st.per),'Foro dinámico','foro')
      +a('🔗','embed.html?per='+encodeURIComponent(st.per)+'&profe='+encodeURIComponent(st.profe),'Enlaces, embeds y QR','embed')
      +a('📄',d.doc,'Documento de enlaces del PER','doc')
      +a('🧑‍🏫','profes.html?per='+encodeURIComponent(st.per),'Panel completo (referente)','profes')
      +'</div></section>';}

  function bloqueMisPers(){
    var mp=misPers();
    if(mp.length<2) return '';
    var fila=function(p){return '<tr><td><b>'+esc(p.nombre)+'</b></td><td>'+esc(p.tipo)+'</td><td>'+estadoPer(p)+'</td>'
      +'<td>'+(p.inicio?esc(f(p.inicio)):'—')+'</td>'
      +'<td><button class="btn small" data-ir="'+esc(p.id)+'">Abrir</button></td></tr>';};
    var vivos=mp.filter(function(p){return estadoPer(p)!=='pasado';}), pasados=mp.filter(function(p){return estadoPer(p)==='pasado';});
    return '<section id="sala-pers"><div class="eyebrow">Tu historial</div><h2>Todos tus grupos</h2>'
      +'<div class="tablewrap"><table><thead><tr><th>Grupo</th><th>Tipo</th><th>Estado</th><th>Empezó</th><th></th></tr></thead><tbody>'
      +vivos.map(fila).join('')+pasados.map(fila).join('')+'</tbody></table></div></section>';}

  // ---------- render ----------
  function render(){
    if(!misPers().length){
      root.innerHTML='<div class="card"><h3>Hola, '+esc(st.profe)+'</h3>'
        +'<p class="small muted">No apareces en el equipo docente de ningún grupo. Pídele al profe referente que te añada al crear el PER o desde el <a href="profes.html">panel</a> → Ajustes del PER.</p>'
        +'<p><button class="btn small" id="cambiarD">No soy '+esc(st.profe)+'</button></p></div>';
      document.getElementById('cambiarD').onclick=function(){localStorage.removeItem('sgProfe');st.profe='';elegirDocente();};
      return;
    }
    root.innerHTML=cabecera()+bloquePase()+bloquePanel()+bloqueIntervencion()+bloqueClase()+bloqueGrupo()+bloqueEnlaces()+bloqueMisPers();
    Array.prototype.forEach.call(root.querySelectorAll('tr[data-al-fila]'),function(tr){
      tr.onclick=function(e){ if(e.target.closest('button')) return;   // el boton «Corregir» ya lo hace
        fichaAlumno(mios()[Number(tr.getAttribute('data-al-fila'))]); };});
    var gp=document.getElementById('guardarPanel');
    if(gp)gp.onclick=function(){var i=document.getElementById('miPanel'),m=document.getElementById('msgPanel');
      gp.disabled=true;m.textContent='Guardando…';
      post({accion:'mi_panel',per:st.per,profe:st.profe,url:i.value.trim()},function(r){
        if(r&&r.ok){m.textContent='Guardado.';cargarPer();}else{gp.disabled=false;m.textContent=(r&&r.error)||'No se ha podido.';}
      },function(e){gp.disabled=false;m.textContent=e;});};
    var ap=document.getElementById('abrirPase');
    if(ap)ap.onclick=function(){ap.disabled=true;
      post({accion:'pase_abrir',per:st.per,profe:st.profe},function(d){st.pase=d;render();},
           function(e){ap.disabled=false;alert(e);});};
    cuentaAtras();
    var sp=document.getElementById('selPer'); if(sp)sp.onchange=function(){st.per=sp.value;localStorage.setItem('sgClasePer',st.per);cargarPer();};
    document.getElementById('cambiarD').onclick=function(){localStorage.removeItem('sgProfe');st.profe='';elegirDocente();};
    var stm=document.getElementById('selTema'); if(stm)stm.onchange=function(){st.tema=stm.value;render();};
    var sd=document.getElementById('selDias'); if(sd)sd.onchange=function(){st.dias=sd.value;render();};
    var ch=document.getElementById('chkMios'); if(ch)ch.onchange=function(){st.soloMios=ch.checked;render();};
    // v3.13 · «Ver solo a estos»: quita el filtro de «solo mis alumnos» y baja a la tabla del grupo
    var bSin=document.getElementById('verSinDoc');
    if(bSin)bSin.onclick=function(){st.soloMios=false;render();
      var t=document.querySelector('#clase-app table.rank'); if(t)t.scrollIntoView({behavior:'smooth',block:'center'});};
    var r=mios();
    Array.prototype.forEach.call(root.querySelectorAll('button[data-al]'),function(b){
      b.onclick=function(){fichaAlumno(r[parseInt(b.getAttribute('data-al'),10)]);};});
    Array.prototype.forEach.call(root.querySelectorAll('button[data-apl]'),function(b){
      b.onclick=function(){b.disabled=true;post({accion:'entregado',per:st.per,fila:parseInt(b.getAttribute('data-apl'),10),valor:true,profe:st.profe},function(){cargarPer();});};});
    Array.prototype.forEach.call(root.querySelectorAll('button[data-tk]'),function(b){
      b.onclick=function(){b.disabled=true;post({accion:'ticket_resuelto',per:st.per,fila:parseInt(b.getAttribute('data-tk'),10),valor:b.getAttribute('data-v')==='1',profe:st.profe},function(){cargarPer();});};});
    Array.prototype.forEach.call(root.querySelectorAll('button[data-ir]'),function(b){
      b.onclick=function(){st.per=b.getAttribute('data-ir');localStorage.setItem('sgClasePer',st.per);cargarPer();};});
    // La visita guiada de la sala no se puede ofrecer antes: hasta aquí no hay ni un objetivo que
    // señalar (primero el PIN, luego «¿quién eres?»).
    if(window.sgTour&&window.sgTour.ofrecerLocal) window.sgTour.ofrecerLocal();
  }

  if(!API){root.innerHTML='<p class="lead">El tablero aún no está conectado.</p>';return;}
  if(st.pin)inicio(); else pedirPin();
})();
