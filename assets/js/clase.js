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

  // 🔴 12-sep · LA SALA YA HABLA CON EL MOTOR NUEVO. Hasta hoy enseñaba un cartel y mandaba a la
  // consola: sus trece peticiones no estaban traducidas. No eran trece problemas, era uno — todas
  // pasaban por el buzón del alumnado, que empieza buscando la ficha de recluta de quien pregunta,
  // y un docente no tiene ficha en su propio grupo. Traducido en `fuente.js` (el bloque DOCENTE).
  //
  // Quedan DOS sin traducir, y se apagan a la vista en vez de fallar al pulsarlas: el pase de lista
  // (el motor nuevo no tiene dónde guardar una palabra que el alumnado pueda comprobar sin poder
  // leerla antes) y el panel de tickets (las respuestas viven ahora en una hoja de Google
  // compartida por todos los grupos, que es otra fuente y se lee aparte).
  var NUEVO = !!(window.SG && SG.FUENTE && SG.FUENTE.nombre==='firestore');
  var st={pin:sessionStorage.getItem('sgPin')||'', profe:q.get('profe')||localStorage.getItem('sgProfe')||'',
          correo:(q.get('correo')||localStorage.getItem('sgClaseCorreo')||'').trim().toLowerCase(),
          yo:null, demoIds:[],
          per:q.get('per')||localStorage.getItem('sgClasePer')||'', pers:[], d:null, tickets:[],
          tema:'', dias:'14', soloMios:true, vista:'hoy', demo:q.get('demo')==='1',
  // 🔴 9-sep · EL CORREO Y EL NOMBRE REAL NACEN TAPADOS. No es la proteccion principal —para
  // proyectar esta el ranking publico, que directamente NO recibe esos datos del servidor— sino
  // una cortesia para cuando el docente comparte pantalla mientras trabaja. Y nace tapado en cada
  // visita a proposito: si se recordara, dejaria de proteger justo el dia que importa.
          verPrivado:false};
  // en la demo se entra ya como docente: el selector de «¿quien eres?» no es lo que se quiere enseñar
  if(st.demo&&!q.get('profe')) st.profe='Mr Cuarter';
  // tapa un dato privado mientras `verPrivado` esté apagado. Devuelve YA escapado.
  function priv(t){ t=String(t||''); if(!t) return '';
    return st.verPrivado ? esc(t) : '<span class="tapado" title="Oculto: pulsa «ver datos» arriba">'+esc(t.replace(/./g,'\u2022')).slice(0,60)+'</span>'; }
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function f(v){try{var d=new Date(v);return isNaN(d)?String(v):d.toLocaleDateString('es-ES',{day:'2-digit',month:'short'});}catch(e){return String(v);}}
  function cargando(t,p){return '<div class="cargando"><div class="txt">'+t+'</div><div class="barra"><i></i></div>'+(p?'<div class="pista">'+p+'</div>':'')+'</div>';}
  function post(b,cb,err){
    // 🔴 MODO DEMO (?demo=1), como el de los tickets. Dos motivos: enseñarle la sala a un docente
    // nuevo sin darle el PIN, y que las capturas de «Como se hace» se puedan REGENERAR con un
    // comando (detras del PIN no entra ningun script). Los datos son inventados y se arman con los
    // catalogos de verdad, asi que el dia que cambien las insignias, la demo cambia sola.
    if(st.demo){ try{ return cb(demo(b)); }catch(e){ if(err) err(e.message); return; } }
    b.pin=st.pin;
    (window.SG&&SG.FUENTE?SG.FUENTE.accion(b)
      :fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)}).then(function(r){return r.json();}))
      .then(function(d){
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
  // v3.61 · con correo, el filtro lo hizo el SERVIDOR y st.pers ya viene recortado. Sin correo
  // (la demo sin PIN, clase.html?demo=1) se sigue filtrando por nombre, como antes.
  function misPers(){ return st.correo ? st.pers
    : st.pers.filter(function(p){return (p.docentes||[]).some(function(d){return d.nombre===st.profe;});}); }
  function esDemoPer(id){ return st.demoIds.indexOf(id)>=0; }
  // en un grupo de practicas el docente no figura en su equipo: filtrar «solo mis alumnos» lo
  // dejaria a cero y pareceria vacio. Ahi se enseñan todos.
  function soloMiosReal(){ return st.soloMios && !esDemoPer(st.per); }
  function estadoPer(p){
    var n=(p.tipo==='PUA'?10:15);
    if(p.archivado) return 'pasado';
    if(p.semana==null) return 'sin fecha';
    if(p.semana<1) return 'por empezar';
    return p.semana>n ? 'pasado' : 'en marcha';
  }
  // v3.61 · ANTES: un desplegable con los NOMBRES de todo el profesorado y cada uno elegia el suyo.
  // Eso enseñaba la plantilla entera a cualquiera con el PIN, y dejaba entrar como un companero con
  // dos clics. AHORA: escribes tu correo y el servidor te devuelve SOLO tus grupos.
  // 🔴 No es seguridad: quien tenga el PIN y sepa el correo de otro puede escribirlo. Es orden —y
  // que nadie vea la lista del equipo. La puerta sigue siendo el PIN.
  function pedirCorreo(msg){
    root.innerHTML='<div class="card" style="max-width:520px"><h3>¿Quién eres?</h3>'
      +'<p class="small muted">'+(msg||'Escribe tu correo <b>(preferiblemente el de UNIR)</b>. '
        +'Se guarda en este navegador y solo verás <b>tus grupos</b> y tus alumnos.')+'</p>'
      +'<input id="mailD" type="email" autocomplete="email" placeholder="tu.correo@unir.net" '
      +'style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<button class="btn primary" id="okD" style="margin-top:10px">Entrar</button>'
      +'<p class="small muted" style="margin-top:12px">¿Todavía sin grupo asignado? Entra igual: '
      +'te dejo la <b>clase de prácticas</b> para que lo explores sin miedo a romper nada.</p></div>';
    var i=document.getElementById('mailD'), b=document.getElementById('okD');
    function entrar(){
      var v=(i.value||'').trim().toLowerCase();
      if(!v||v.indexOf('@')<0){ i.focus(); return; }
      st.correo=v; localStorage.setItem('sgClaseCorreo',v);
      st.per=''; localStorage.removeItem('sgClasePer');   // el grupo guardado puede no ser suyo
      root.innerHTML=cargando('Buscando tus grupos…',v);
      cargarPers();
    }
    b.onclick=entrar;
    i.addEventListener('keydown',function(e){ if(e.key==='Enter') entrar(); });
    i.focus();
  }
  function olvidarCorreo(){
    localStorage.removeItem('sgClaseCorreo'); localStorage.removeItem('sgProfe');
    localStorage.removeItem('sgClasePer');
    st.correo=''; st.profe=''; st.yo=null; st.per=''; st.pers=[];
    pedirCorreo();
  }

  // ---------- carga ----------
  function inicio(){ root.innerHTML=cargando('Abriendo tu sala…','Buscando tus grupos'); cargarPers(); }
  function cargarPers(){
    // la demo sin PIN (clase.html?demo=1) entra sin correo: ahi se sigue por nombre
    if(!st.correo && !st.demo){ pedirCorreo(); return; }
    post({accion:'pers', correo:st.correo},function(d){
      st.pers=(d.pers||[]).filter(function(p){return p.id;});
      st.demoIds=d.demo||[];
      st.yo=d.yo||null;
      if(st.yo){
        // el nombre lo dice el servidor a partir del correo: ya no se teclea ni se elige
        st.profe=st.yo.nombre||'Invitado';
        localStorage.setItem('sgProfe',st.profe);
      }
      if(!st.correo && (!st.profe||todosLosDocentes().indexOf(st.profe)<0)){pedirCorreo();return;}
      var mios=misPers();
      if(!mios.length){render();return;}
      /**
       * 🔴 DEVOLVER A QUIEN VENÍA DE OTRA PÁGINA. La puerta del material de profesorado
       * (`puerta.js`) vive en páginas que no cargan el motor —la guía, la cronología, los
       * recursos—, así que no puede comprobar por sí misma si quien llama es docente. Manda aquí,
       * que sí lo carga, y al confirmarse hay que devolver a la persona a donde iba. Sin esto se
       * quedaba en la sala, mirando otra cosa, preguntándose qué había pasado con el enlace.
       */
      var volver=new URLSearchParams(location.search).get('volver');
      if(volver && /^[a-z0-9_-]+\.html$/i.test(volver)){ location.replace(volver); return; }
      // 🔴 EL GRUPO RECORDADO NO PUEDE SER UNO MUERTO SI HAY OTRO VIVO. Antes solo se elegía de
      // nuevo cuando el guardado no era suyo; si era suyo pero había TERMINADO, la sala se quedaba
      // pegada a él. Efecto real: en febrero abres tu sala y estás mirando el grupo de septiembre
      // —con su semana 15, sus tickets viejos y su gente— mientras el de febrero, que es al que das
      // clase hoy, está a un desplegable de distancia que nadie mira. Se puede volver a él a mano
      // cuando quieras; lo que no vale es que sea lo primero que veas.
      var suyo=mios.filter(function(p){return p.id===st.per;})[0];
      var vivos=mios.filter(function(p){return estadoPer(p)==='en marcha';});
      if(!suyo || (estadoPer(suyo)!=='en marcha' && vivos.length)){
        st.per=(vivos[0]||mios[0]).id;
      }
      localStorage.setItem('sgClasePer',st.per);
      cargarPer();
    });}
  function cargarPer(){
    root.innerHTML=cargando('Cargando '+esc(st.per)+'…','Alumnos, canjes y tickets');
    post({accion:'alumnos',per:st.per},function(d){ st.d=d;
      post({accion:'tickets',per:st.per},function(t){ st.tickets=t.tickets||[];
        // si hay un pase abierto de hace un rato, que siga a la vista al recargar la sala
        post({accion:'pase_estado',per:st.per},function(pp){ st.pase=pp.pase||null;
          // la cola va detrás: si falla, la sala se abre igual — no puede tumbarla
          post({accion:'pendientes',per:st.per},function(pc){ st.pendientes=(pc&&pc.pendientes)||[]; render(); },
               function(){ st.pendientes=[]; render(); });
        }, function(){ st.pase=null; render(); });
      }, function(){ st.tickets=[]; render(); });
    });}

  // ---------- piezas ----------
  function mios(){var r=(st.d&&st.d.reclutas)||[];return soloMiosReal()?r.filter(function(x){return x.profe===st.profe;}):r;}
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
      if(soloMiosReal()&&prof&&prof!==st.profe) return false;
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
      +'<button class="btn small" id="cambiarD" title="'+esc(st.correo||'')+'">No soy '+esc(st.profe)+'</button></div></div>';}

  // v3.27 · EL PASE DE LISTA. El docente abre una ventana de unos minutos y su pantalla enseña una
  // consigna de cuatro letras; quien esté en la clase la teclea en su Nave. La consigna se muestra
  // AQUI y en ningun otro sitio: si viajara a la Nave del alumno, no haria falta estar en clase.
  function bloquePase(){
    // 🔴 El pase de lista NO se ha migrado, y se dice en vez de enseñar un botón que falla. El
    // motivo es de diseño, no de tiempo: la gracia del pase es que la palabra solo la ve quien está
    // mirando la pantalla. Con la hoja, el servidor la guardaba y la comparaba. En Firestore, un
    // sitio donde el alumnado pueda comprobarla es un sitio donde puede leerla antes — y entonces
    // no hay pase que valga. Necesita su propia puerta en el servidor, y eso es otro trabajo.
    if(NUEVO) return '<div class="card apagado" id="sala-pase"><h3>🎓 Pase de lista en directo</h3>'
      +'<p class="small muted">Todavía no funciona en los grupos del motor nuevo. La palabra tiene '
      +'que poder comprobarse sin que se pueda leer antes, y eso pide una puerta propia en el '
      +'servidor.</p></div>';
    var p=st.pase;
    if(!p||!p.hasta||new Date(p.hasta)<=new Date())
      return '<div class="card" id="sala-pase"><h3>🎓 Pase de lista en directo</h3>'
        +'<p class="small muted">Abre una ventana y enseña la consigna en pantalla. Quien esté en clase la teclea en su Nave y se lleva unos créditos. Una vez por sesión.</p>'
        +'<p><button class="btn primary" id="abrirPase">Abrir el pase de lista</button></p>'
        +'<p class="small muted">Ojo: premia <b>estar</b> en la sesión en directo, pero no es un control de asistencia fiable: quien está en clase puede escribirle la consigna por el chat a quien no está. Si te importa que no se filtre, ábrelo con la clase ya empezada y déjalo pocos minutos.</p></div>';
    // 🔴 v3.43 · El interruptor de ocultar lo pidio Norberto: la consigna ocupa media pantalla y el
    // docente comparte esa misma pantalla para dar clase. Tapada sigue VALIENDO —la ventana no se
    // cierra—, solo deja de verse; asi puede enseñar otra cosa sin cerrar el pase.
    var tapada = !!st.paseOculto;
    return '<div class="card pase-abierto" id="sala-pase"><h3>🎓 Pase de lista ABIERTO</h3>'
      +'<p class="small muted">Enséñales esta pantalla. Se cierra sola.</p>'
      +(tapada
        ? '<div class="consigna consigna-tapada" title="La ventana sigue abierta">\u2022 \u2022 \u2022 \u2022</div>'
        : '<div class="consigna">'+esc(p.palabra)+'</div>')
      +'<p class="small muted">Cierra a las <b>'+hora(p.hasta)+'</b> · <span id="cuenta"></span>'
      +(tapada?' · <b>tapada</b>, pero sigue abierta':'')+'</p>'
      +'<p><button class="btn small" id="taparPase">'+(tapada?'\ud83d\udc41 Ver la consigna':'\ud83d\ude48 Ocultar la consigna')+'</button> '
      +'<button class="btn small" id="abrirPase">Abrir otra ventana</button></p></div>';}

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
      return '<tr><td>'+esc(f(x.c.fecha))+'</td><td><b>'+esc(x.p.alias)+'</b><br><span class="small muted">'+priv(x.p.nombre||x.p.email)+'</span></td>'
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
        +'<p class="small muted">'+sinDoc.slice(0,8).map(function(x){return (x.alias?esc(x.alias):priv(x.email));}).join(' · ')
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
        +'<p><a class="btn primary" href="sesion.html?per='+encodeURIComponent(st.per)+'&sem='+sem+'" target="_blank" rel="noopener">📽️ Proyectar la sesión de la semana ↗</a></p>'
        +'<p class="small muted">Se abre la semana entera montada como presentación: el planeta, los vídeos con su momento, las misiones con lo que piden, las insignias y el hito. No hace falta montar ningún Genially.</p>'
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

  // 🔴 v3.43 · El boton decia «Corregir» y por eso Norberto no encontro la ficha (9-sep): abre la
  // radiografia entera —inventario, canjes y los campos de correccion— pero su nombre solo prometia
  // lo ultimo. Una sola puerta, y que se llame por lo que hay detras.
  function bloqueGrupo(){
    var r=mios();
    var filas=r.map(function(p,i){
      var ult=(p.eventos||[]).length?f((p.eventos||[]).map(function(e){return e.fecha;}).sort().pop()):'—';
      return '<tr class="clicable" data-al-fila="'+i+'" title="Ver la ficha de '+esc(p.alias)+'"><td>'+p.pos+'</td><td><b>'+esc(p.alias)+'</b><br><span class="small muted">'+priv(p.nombre)+'</span></td>'
        +'<td class="small">'+priv(p.email)+'</td>'
        +'<td>'+(String(p.profe||'').trim()?esc(p.profe):'<span class="chip" style="background:#f5b04333;color:#8a5b00">⚠ sin docente</span>')+'</td>'
        +'<td>N'+p.nivel+' <span class="small muted">'+esc(p.rango_nombre||'')+'</span></td>'
        +'<td class="pts">'+p.xp+'</td><td>'+p.creditos+' ◈</td><td>'+p.n+'/24</td><td class="small muted">'+ult+'</td>'
        +'<td><button class="btn small primary" data-al="'+i+'">Ver ficha</button></td></tr>';}).join('');
    return '<section id="sala-grupo"><div class="eyebrow teal">Tu gente</div><h2>Mi grupo</h2>'
      +'<div class="cta-row" style="justify-content:flex-start;margin:0 0 12px">'+'<a class="btn primary" href="registro.html?per='+encodeURIComponent(st.per)+'&solo=1" target="_blank" rel="noopener">📽️ Proyectar el ranking</a>'+'<button class="btn small" id="verPriv">'+(st.verPrivado?'🙈 Tapar correos y nombres':'👁 Ver correos y nombres')+'</button></div>'+'<p class="lead small">📽️ abre <b>otra página, sin PIN</b>: el servidor no le manda correos ni nombres, así que se puede compartir pantalla con ella sin miedo. Aquí, en cambio, están tapados solo por fuera.</p>'+'<p class="lead">Pulsa <b>Ver ficha</b> (o la fila) y tienes la radiografía completa de esa persona: su inventario, sus canjes y los mismos campos para corregirla. No hace falta abrir ninguna hoja de cálculo. '
      +'<label class="small" style="margin-left:8px"><input type="checkbox" id="chkMios"'+(st.soloMios?' checked':'')+'> solo mis alumnos</label></p>'
      +(r.length?'<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Recluta</th><th>Correo</th><th>Docente</th><th>Nivel</th><th>xp</th><th>◈</th><th>Insignias</th><th>Últ. registro</th><th></th></tr></thead><tbody>'+filas+'</tbody></table></div><div id="ficha"></div>'
        :'<p class="lead">Ningún recluta te ha elegido todavía como docente. Si ya tienes clase, revisa que hayan respondido «¿Quién imparte tu clase?» en su Bitácora — o desmarca «solo mis alumnos» y corrígeselo tú.</p>')
      +'</section>';}

  // 🔴 v3.43 · LA RADIOGRAFIA COMPLETA. Antes solo se pintaba lo que el alumno TENIA, asi que la
  // ficha de quien no habia canjeado nada salia sin cartas y sin personajes — parecia rota. Lo pidio
  // Norberto el 9-sep: enseñar TODO lo que se puede ganar, iluminado lo conseguido y apagado lo que
  // falta. Asi la ficha dice de un vistazo por donde va y cuanto le queda.
  // Se reutiliza el lenguaje visual de la Nave (clase `.no` = gris al 30 %) para que el docente y el
  // alumno vean lo mismo, y para no mantener dos estilos que dicen lo mismo.
  function bloqueColeccion(p){
    var N=window.SG_BADGE_NAMES||{}, ORD=window.SG_BADGES||Object.keys(N),
        CR=window.SG_CROMOS||[], HE=window.SG_HEROES||[], CV=window.SG_CARDV||'';
    var col=p.coleccion||{}, tengoIns={}, tengoCro=p.cromos||{}, tengoHer={};
    (p.insignias||[]).forEach(function(k){tengoIns[k]=true;});
    (p.heroes||[]).forEach(function(k){tengoHer[k]=true;});

    function cabecera(tit, tengo, total){
      var pct=total?Math.round(tengo*1000/total)/10:0;
      return '<h4>'+tit+' <span class="fr-cnt'+(tengo===total&&total?' full':'')+'">'+tengo+' / '+total+'</span>'
        +'<span class="fr-pc">'+pct+' %</span></h4>';}

    // insignias: las 24, en el orden del catalogo
    var ins=ORD.map(function(k){var t=!!tengoIns[k];
      return '<span class="fr-ins'+(t?'':' no')+'" title="'+esc(N[k]||k)+(t?'':' \u00b7 todav\u00eda no')+'">'
        +'<img src="assets/img/insignias/'+k+'.png" alt="" loading="lazy"><em>'+esc(N[k]||k)+'</em></span>';}).join('');

    // cartas: las 20, con su rareza (el borde lo pone la clase, como en la Nave)
    function rar(r){r=String(r||'').toLowerCase();
      return r.indexOf('legend')>=0?' leg':r.indexOf('épica')>=0||r.indexOf('epica')>=0?' epi':r.indexOf('rara')>=0?' rar':'';}
    var cro=CR.map(function(c){var n=tengoCro[c[0]]||0;
      return '<span class="fr-cro'+(n?'':' no')+rar(c[3])+'" title="'+esc(c[1])+' \u00b7 '+esc(c[3]||'')
        +(n?(n>1?' \u00b7 x'+n:''):' \u00b7 a\u00fan no le ha salido')+'">'
        +'<img src="assets/img/tarjetas/'+c[0]+'_carta.png'+CV+'" alt="" loading="lazy">'
        +'<em>'+esc(c[1])+(n>1?' \u00d7'+n:'')+'</em></span>';}).join('');

    // personajes: los 30. Los que no tiene usan la imagen _bloqueado, que ya existe para la Nave.
    var her=HE.map(function(h){var t=!!tengoHer[h[0]];
      return '<span class="fr-cro'+(t?'':' no')+'" title="'+esc(h[1])+' \u00b7 '+esc(h[2]||'')
        +(t?'':' \u00b7 sin descubrir')+'">'
        +'<img src="assets/img/heroes/'+h[0]+(t?'':'_bloqueado')+'.jpg" alt="" loading="lazy">'
        // 🔴 El nombre SI, aunque no lo tenga. En la Nave el heroe sin descubrir es una silueta muda
        // a proposito —es la sorpresa del alumno—, pero aqui son 30 siluetas identicas que no dicen
        // nada: el docente necesita leer el catalogo, no adivinarlo. Y esta pantalla va tras el PIN.
        +'<em>'+esc(h[1])+'</em></span>';}).join('');

    var pct=Math.round((Number(col.pct)||0)*100)/100;
    var nCro=col.cromos?col.cromos.tengo:0, tCro=col.cromos?col.cromos.total:CR.length;
    var nHer=col.heroes?col.heroes.tengo:0, tHer=col.heroes?col.heroes.total:HE.length;
    return '<div style="margin-top:16px">'
      +(p.bio?'<p class="fr-bio">\u00ab'+esc(p.bio)+'\u00bb</p>':'<p class="fr-bio muted">Sin biograf\u00eda todav\u00eda.</p>')
      +'<div class="fr-kpis">'
        +'<div><b>'+p.n+'</b><span>de '+ORD.length+' insignias</span></div>'
        +'<div><b>'+nCro+'</b><span>de '+tCro+' cartas</span></div>'
        +'<div><b>'+nHer+'</b><span>de '+tHer+' personajes</span></div>'
        +'<div><b>'+p.creditos+' \u25c8</b><span>cr\u00e9ditos \u00b7 '+pct+' % del juego</span></div></div>'
      +cabecera('Insignias', p.n||0, ORD.length)+'<div class="fr-lista">'+ins+'</div>'
      +cabecera('Cartas del \u00e1lbum', nCro, tCro)+'<div class="fr-lista">'+cro+'</div>'
      +cabecera('Personajes de la Rebeli\u00f3n', nHer, tHer)+'<div class="fr-lista">'+her+'</div>'
      + bloqueCanjes(p)
      +'</div>';}

  // 🔴 v3.43 · EL HISTORIAL DE CANJES, que pidio Norberto para tener «una radiografia completa».
  // El dato ya viajaba (canjes[m].lista, solo con PIN): fecha, recompensa, actividad y la FILA de
  // la pestaña C, que es la que permite revertir. Revertir = marcar esa fila como no concedida; el
  // dinero vuelve solo, porque «gastado» solo suma las filas que empiezan por «Concedido».
  function bloqueCanjes(p){
    var l=(p.canjes||[]).slice().sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);});
    if(!l.length) return '<h4>Canjes</h4><p class="small muted">Todavía no ha canjeado nada. '
      +'Lleva <b>'+(p.creditos||0)+' \u25c8</b> sin gastar.</p>';
    var filas=l.map(function(c){
      var ent=String(c.entregado||'').trim();
      return '<tr><td class="small muted">'+esc(f(c.fecha))+'</td>'
        +'<td><b>'+esc(c.recompensa||'')+'</b>'+(c.actividad?'<br><span class="small muted">'+esc(c.actividad)+'</span>':'')+'</td>'
        +'<td class="small">'+(ent?'<span class="chip ok">entregado</span>':'<span class="small muted">pendiente</span>')+'</td>'
        +'<td><button class="btn small" data-revertir="'+c.fila+'" data-nom="'+esc(c.recompensa||'')+'">Revertir</button></td></tr>';}).join('');
    return '<h4>Canjes <span class="small muted">('+l.length+' \u00b7 '+(p.creditos_gastados||0)+' \u25c8 gastados, '
      +(p.creditos||0)+' \u25c8 en el bolsillo)</span></h4>'
      +'<p class="small muted">Revertir le quita la recompensa y le <b>devuelve los créditos</b>. '
      +'Úsalo si se equivocó de opción o si algo se cobró dos veces.</p>'
      +'<div class="tablewrap"><table class="rank"><tbody>'+filas+'</tbody></table></div>';}

  function fichaAlumno(p){
    var box=document.getElementById('ficha'); if(!box) return;
    var tipo=(st.d&&st.d.tipo)||'REGULAR', cat=RET[tipo]||[];
    var docs=((st.d&&st.d.docentes)||[]).map(function(d){return d.nombre;});
    if(docs.indexOf(p.profe)<0&&p.profe) docs.push(p.profe);
    box.innerHTML='<div class="card" style="margin-top:14px"><div class="tab-head"><div><h3>'+esc(p.alias)+' <span class="small muted">'+priv(p.nombre)+' · '+priv(p.email)+'</span></h3></div><button class="btn small" id="fToggle">\u270e Corregir</button> <button class="btn small" id="cerrarF">\u2715</button></div>'
      // 🔴 v3.43 · La radiografia PRIMERO y la correccion detras de un boton. Antes se abria por los
      // campos de edicion, que es lo que menos se usa: se entra a mirar, no a arreglar.
      + bloqueColeccion(p)
      +'<div id="fEditar" hidden><div class="grid cols-2"><div><h4>Corregir su ficha</h4><p class="small muted">Se escribe en su respuesta de la Bitácora, que es de donde sale la identidad del tablero.</p>'
      +'<label class="small muted">Alias</label><input id="fAlias" value="'+esc(p.alias)+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      // 🔴 11-sep · DOS CAMPOS, como el formulario. Antes era uno y no se podia ordenar la clase por
      // apellido; y partirlo a maquina en español es imposible («José Luis García de la Torre»).
      // Si el grupo es viejo y solo tiene la columna de siempre, el servidor mete ahí lo del nombre.
      +'<label class="small muted" style="margin-top:8px;display:block">Nombre</label><input id="fNombre" value="'+esc(p.nombre_pila||p.nombre||'')+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
      +'<label class="small muted" style="margin-top:8px;display:block">Apellidos</label><input id="fApellidos" value="'+esc(p.apellidos||'')+'" style="width:100%;padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff">'
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
      +'</tbody></table></div></div></div></div>'
      +'</div>';
    document.getElementById('cerrarF').onclick=function(){box.innerHTML='';};
    var bEd=document.getElementById('fToggle'), cEd=document.getElementById('fEditar');
    bEd.onclick=function(){ cEd.hidden=!cEd.hidden;
      bEd.textContent=cEd.hidden?'\u270e Corregir':'\u2715 Dejar de corregir';
      if(!cEd.hidden) cEd.scrollIntoView({block:'nearest'}); };
    document.getElementById('fGuardar').onclick=function(){
      var m=document.getElementById('fMsg'); m.textContent='Guardando…';
      post({accion:'ficha',per:st.per,email:p.email,alias:document.getElementById('fAlias').value.trim(),
            nombre:document.getElementById('fNombre').value.trim(),
            apellidos:(document.getElementById('fApellidos')||{value:''}).value.trim(),
            profe:document.getElementById('fProfe').value,
            bitacora:document.getElementById('fBit').value.trim(),profe_edita:st.profe},
        function(){ m.textContent='Guardado.'; cargarPer(); },
        function(e){ m.textContent=e; });};
    Array.prototype.forEach.call(box.querySelectorAll('button[data-revertir]'),function(b){
      b.onclick=function(){
        if(!confirm('¿Revertir «'+b.getAttribute('data-nom')+'»?\n\nSe le quita la recompensa y se le devuelven los créditos.')) return;
        b.disabled=true; b.textContent='Revirtiendo…';
        post({accion:'canje_revertir',per:st.per,fila:Number(b.getAttribute('data-revertir')),profe:st.profe},
          function(){ cargarPer(); },
          function(e){ b.disabled=false; b.textContent='Revertir';
            alert(/desconocida|accion/i.test(String(e))
              ? 'Esta versión de Apps Script todavía no sabe revertir canjes. Hay que desplegar la actualización (Bonus.gs + una línea de Code.gs).'
              : e); });};});
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
    // 🔴 12-sep · LO PRIMERO, LAS TRES HERRAMIENTAS DE CLASE. Un docente entra aquí con la clase
    // empezando, no a leer una lista de enlaces. Proyectar, mover el aula y tocar llamada son lo
    // que se usa EN DIRECTO: van arriba, grandes, y el resto sigue debajo como estaba.
    var mot = NUEVO ? '&motor=firestore' : '';
    var herramientas = '<section id="sala-herramientas"><div class="eyebrow amber">Para dar la clase</div>'
      + '<h2>Tus tres botones</h2>'
      + '<div class="herramientas">'
      + '<a class="herr" href="sesion.html?per=' + encodeURIComponent(st.per) + mot + '" target="_blank" rel="noopener">'
        + '<span class="ic">📽️</span><b>Proyectar la semana</b>'
        + '<em>el planeta, los vídeos, los retos y el hito — ya montado para la pantalla</em></a>'
      + (NUEVO ? '<a class="herr" href="aula.html?per=' + encodeURIComponent(st.per) + mot + '" target="_blank" rel="noopener">'
        + '<span class="ic">🛰️</span><b>El aula</b>'
        + '<em>llamada a filas, quién ficha, a quién felicitar y premios a mano</em></a>' : '')
      + (NUEVO ? '<a class="herr" href="llamada.html?per=' + encodeURIComponent(st.per) + mot + '" target="_blank" rel="noopener">'
        + '<span class="ic">🔔</span><b>Llamada a filas</b>'
        + '<em>solo el pase de lista, con el botón grande para proyectar</em></a>' : '')
      + '</div>'
      + (NUEVO ? '<p class="acc-nota">🧩 Los dos últimos se pueden <b>incrustar en tu Genially</b> con '
        + '<code>?embed=1</code>: el mismo enlace vale para todos tus grupos y todos los cursos, '
        + 'porque el grupo se deduce de tu cuenta.</p>' : '')
      + '</section>';
    return herramientas
      +'<section id="sala-enlaces"><div class="eyebrow">Sin buscar en Drive</div><h2>Los enlaces de este grupo</h2>'
      +'<h3 class="acc-tit acc-alu">✅ Esto sí se comparte con el alumnado</h3>'
      // 🔴 12-sep · EN EL MOTOR NUEVO FALTABA EL ENLACE MÁS IMPORTANTE: el de alistarse. Es el único
      // que el docente TIENE que repartir —sin él no hay clase— y no estaba por ninguna parte de su
      // propia sala. Va primero, con el código dentro, para que no haya que juntar dos cosas a mano.
      +(NUEVO
        ? '<p class="acc-nota">Dos cosas: el enlace para <b>alistarse</b> (el primer día) y su '
          + '<b>Nave</b> (el resto del curso). Lo demás ya lo tienen dentro de la Nave.</p>'
          + '<div class="acc-alta"><b>🧭 Para alistarse — dáselo el primer día</b>'
          + '<code>' + esc(location.origin + '/alistarse.html?per=' + encodeURIComponent(st.per) + mot
              + ((st.d && st.d.codigo) ? '&codigo=' + st.d.codigo : '')) + '</code>'
          + ((st.d && st.d.codigo)
              ? '<span class="small muted">Lleva el <b>código de la clase (' + esc(st.d.codigo)
                + ')</b> dentro. Quien llegue sin el enlace tendrá que escribirlo.</span>'
              : '<span class="small muted">Este grupo no tiene código: puede alistarse cualquiera que '
                + 'tenga el enlace. Tu referente puede ponerle uno desde la consola.</span>')
          + '</div>'
        : '<p class="acc-nota">Cinco cosas, y no hay una sexta: los tres formularios, su Nave y el Genially.</p>')
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

  // ---------- LA COLA DE SOLICITUDES DE NOTA (11-sep) ----------
  // 🔴 Norberto: «el docente no puede subir manualmente la nota a 70 alumnos que quieren maquillar,
  // es trabajar el doble y es tiempo no reflejado». Antes se concedían solas y llegaba un correo por
  // cada una: trabajo a goteo y sin decidir nada. Aquí se ven todas juntas y se resuelven de una
  // sentada, con derecho a veto.
  // Va ARRIBA DEL TODO cuando hay algo pendiente: es lo único de esta sala que tiene a alguien
  // esperando una respuesta.
  function bloqueCola(){
    var ps=(st.pendientes||[]);
    if(!ps.length) return '';
    var filas=ps.map(function(x,i){
      var quien=st.verPrivado?(esc(x.nombre||x.alias)):esc(x.alias||'—');
      return '<tr><td><b>'+quien+'</b><br><span class="small muted">'+priv(x.email)+'</span></td>'
        +'<td>'+esc(x.recompensa)+'</td>'
        +'<td class="small">'+esc(x.actividad||'—')+'</td>'
        +'<td class="pts">'+x.coste+' ◈</td>'
        +'<td>'+(x.puede
            ? '<span class="small muted">le quedan '+x.saldo+'</span>'
            : '<span class="chip" style="background:#a3342b33;color:#ff8f80">ya no le llegan ('+(x.saldo==null?'?':x.saldo)+')</span>')+'</td>'
        +'<td><button class="btn small primary" data-ap="'+i+'"'+(x.puede?'':' disabled')+'>Aprobar</button> '
        +'<button class="btn small" data-rc="'+i+'">Rechazar</button></td></tr>';
    }).join('');
    return '<section id="cola"><div class="eyebrow amber">Te esperan</div>'
      +'<h2>⚔️ Solicitudes de nota · '+ps.length+'</h2>'
      +'<p class="lead">Nadie ha pagado nada todavía: <b>los créditos se cobran al aprobar</b>. Si '
      +'rechazas, esa persona se queda con su dinero entero y recibe el motivo.</p>'
      +'<p class="small muted">Aprobar significa que <b>tú</b> aplicarás la nota en la plataforma de la '
      +'asignatura: el sistema no toca ninguna nota, solo lleva la cuenta.</p>'
      +'<div class="tablewrap"><table class="rank"><thead><tr><th>Quién</th><th>Qué pide</th>'
      +'<th>Actividad</th><th>Cuesta</th><th>Saldo</th><th></th></tr></thead><tbody>'+filas
      +'</tbody></table></div></section>';
  }
  function cargarCola(){
    post({accion:'pendientes',per:st.per},function(d){ st.pendientes=(d&&d.pendientes)||[]; render(); },
         function(){ st.pendientes=[]; render(); });
  }
  function resolverCola(i, aprueba){
    var x=(st.pendientes||[])[i]; if(!x) return;
    var motivo='';
    if(!aprueba){ motivo=prompt('¿Por qué la rechazas? (lo verá quien la pidió)','Ya tenías la nota máxima')||''; }
    else if(!confirm('Aprobar «'+x.recompensa+'» de '+(x.alias||x.email)+'.\n\nSe le cobrarán '+x.coste
        +' créditos y TÚ tendrás que aplicar la nota en la plataforma. ¿Seguro?')) return;
    post({accion:'pendiente_resolver',per:st.per,fila:x.fila,profe:st.profe,
          aprueba:aprueba,motivo:motivo},
         function(d){ if(d&&d.error){ alert(d.error); return; } cargarCola(); },
         function(e){ alert('No se pudo resolver: '+e); });
  }

  // ---------- render ----------
  // v3.61 · quien entra con un correo que no figura en ningun equipo NO se encuentra una sala
  // vacia: se encuentra la clase de practicas y una explicacion de por que. Es el momento en que
  // un companero decidiria que «esto no funciona» y escribiria pidiendo ayuda.
  function avisoSinGrupo(){
    if(!st.yo || st.yo.encontrado || !st.correo) return '';
    return '<div class="card" style="border-color:var(--amber)"><h3>Todavía no tienes grupo asignado</h3>'
      +'<p>No encuentro <b>'+esc(st.correo)+'</b> en el equipo docente de ningún grupo. '
      +'Pídele a tu <b>profesor/a referente</b> que te añada con ese mismo correo desde '
      +'<b>Puesto de mando → Equipo docente → Añadir a alguien al equipo</b>.</p>'
      +'<p class="small muted">Mientras tanto te dejo abajo la <b>clase de prácticas</b>: es un grupo '
      +'de mentira con alumnado inventado. Tócalo todo, no se rompe nada.</p>'
      +'<p><button class="btn small" id="cambiarD2">Probar con otro correo</button></p></div>';
  }
  function render(){
    if(!misPers().length){
      // 🔴 ESTA PANTALLA ERA UN CALLEJÓN SIN SALIDA, y se lo comió Norberto en su propia web:
      // decía «pídele al profe referente que te añada» — incluso SIENDO ÉL el referente— y
      // apuntaba al panel viejo y a una hoja de cálculo que ya no existe. Quien llega aquí es una
      // de dos cosas, y las dos necesitan un botón, no un recado:
      //   · alguien del equipo al que aún no han apuntado → que sepa qué pedir y a quién;
      //   · el referente estrenando el sistema, que lo que necesita es CREAR su primer grupo.
      root.innerHTML='<div class="card"><h3>No encuentro tus grupos</h3>'
        +'<p>'+(st.correo
          ? 'El correo <b>'+esc(st.correo)+'</b> no aparece en el equipo docente de ningún grupo.'
          : 'No apareces en el equipo docente de ningún grupo.')+'</p>'
        +'<p class="small muted">Dos motivos posibles: o <b>aún no has creado ninguno</b>, o alguien '
        +'tiene que añadirte con <b>ese mismo correo</b> desde <b>Puesto de mando → Equipo docente</b>. '
        +'Ojo también a <b>con qué cuenta de Google has entrado</b>: es el despiste más común.</p>'
        +'<p><a class="btn primary" href="crear.html">✨ Crear mi primer grupo</a> '
        +'<a class="btn" href="consola.html">🎛️ Puesto de mando</a></p>'
        +'<p><button class="btn small" id="cambiarD">Entrar con otra cuenta</button></p></div>';
      document.getElementById('cambiarD').onclick=olvidarCorreo;
      return;
    }
    root.innerHTML=avisoSinGrupo()+cabecera()+bloqueCola()+bloquePase()+bloquePanel()+bloqueIntervencion()+bloqueClase()+bloqueGrupo()+bloqueEnlaces()+bloqueMisPers();
    Array.prototype.forEach.call(root.querySelectorAll('[data-ap]'),function(b){
      b.onclick=function(){ resolverCola(Number(b.getAttribute('data-ap')), true); };});
    Array.prototype.forEach.call(root.querySelectorAll('[data-rc]'),function(b){
      b.onclick=function(){ resolverCola(Number(b.getAttribute('data-rc')), false); };});
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
    if(ap)ap.onclick=function(){ap.disabled=true; st.paseOculto=false;
      post({accion:'pase_abrir',per:st.per,profe:st.profe},function(d){st.pase=d;render();},
           function(e){ap.disabled=false;alert(e);});};
    // tapar la consigna NO cierra la ventana: solo deja de enseñarla
    var vp=document.getElementById('verPriv');
    if(vp)vp.onclick=function(){ st.verPrivado=!st.verPrivado; render(); };
    var tp=document.getElementById('taparPase');
    if(tp)tp.onclick=function(){ st.paseOculto=!st.paseOculto; render(); };
    cuentaAtras();
    var sp=document.getElementById('selPer'); if(sp)sp.onchange=function(){st.per=sp.value;localStorage.setItem('sgClasePer',st.per);cargarPer();};
    var cd=document.getElementById('cambiarD'); if(cd) cd.onclick=olvidarCorreo;
    var cd2=document.getElementById('cambiarD2'); if(cd2) cd2.onclick=olvidarCorreo;
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

  // ---------------------------------------------------------------- los datos de mentira
  function demo(b){
    var ORD=window.SG_BADGES||Object.keys(N), CR=window.SG_CROMOS||[], HE=window.SG_HEROES||[];
    if(!st._demo){
      var hoy=new Date(), hace=function(d){var x=new Date(hoy);x.setDate(x.getDate()-d);return x.toISOString();};
      var cat=(RET.REGULAR||[]);
      var quien=function(alias,nombre,mail,profe,nRetos,nCro,nHer,bio,canjes){
        var retos={}, i;
        for(i=0;i<Math.min(nRetos,cat.length);i++) retos[cat[i][0]]={fecha:hace(60-i*3),origen:'alumnado'};
        // 🔴 El catalogo que recibe la sala es solo [id, titulo]: no dice que insignia da cada reto
        // (eso vive en el servidor). Para la demo se reparten las primeras del catalogo de insignias,
        // que es lo que hay que enseñar: unas puestas y otras no.
        var ins={}, cro={}, her=[];
        for(i=0;i<Math.min(nRetos,ORD.length);i++) ins[ORD[i]]=true;
        for(i=0;i<nCro&&i<CR.length;i++) cro[CR[i][0]]=(i===1?2:1);
        for(i=0;i<nHer&&i<HE.length;i++) her.push(HE[i][0]);
        var gastado=(canjes||[]).reduce(function(a,c){return a+c.coste;},0);
        var ganados=nRetos*40+120;
        return {alias:alias, nombre:nombre, email:mail, profe:profe, bio:bio,
          pos:0, nivel:Math.min(10,1+Math.floor(nRetos/2)), rango_nombre:['Recluta','Cadete','Oficial','Veterano','Leyenda'][Math.min(4,Math.floor(nRetos/5))],
          xp:nRetos*250, xp7:nRetos?250:0, n:Object.keys(ins).length, insignias:Object.keys(ins),
          creditos:ganados-gastado, creditos_ganados:ganados, creditos_gastados:gastado,
          cromos:cro, heroes:her, skins:[], retos:retos,
          eventos:Object.keys(retos).map(function(id){return {fecha:retos[id].fecha};}),
          canjes:(canjes||[]).map(function(c,k){return {fecha:hace(c.dias), recompensa:c.nombre+' — '+c.coste+' créditos',
                    actividad:c.act||'', entregado:c.ent?'Sí · Mr Cuarter':'', fila:k+2};}),
          coleccion:{cromos:{tengo:Object.keys(cro).length,total:CR.length},
                     heroes:{tengo:her.length,total:HE.length},
                     skins:{tengo:0,total:5},
                     pct:(Object.keys(cro).length+her.length)*100/((CR.length+HE.length+5)||1)}};};
      var rec=[
        quien('Nova','Ana Ruiz (ficticia)','nova@ejemplo.demo','Mr Cuarter',14,7,3,
          'Piloto de reconocimiento. Colecciono todo lo que brilla.',
          [{nombre:'Héroe de la Rebelión',coste:60,dias:5,ent:true},
           {nombre:'Sobre de cromos',coste:15,dias:12,ent:true},
           {nombre:'Título de recluta',coste:40,dias:20,ent:false}]),
        quien('Orion','Luis Gómez (ficticio)','orion@ejemplo.demo','Mr Cuarter',9,3,1,
          'Vine por los puntos y me quedé por la historia.',
          [{nombre:'Sobre de cromos',coste:15,dias:8,ent:true}]),
        quien('Lyra','Marta Sol (ficticia)','lyra@ejemplo.demo','Mr Cuarter',5,1,0,
          'Todavía me estoy orientando.',[]),
        quien('Vega','Iván Paz (ficticio)','vega@ejemplo.demo','Mr Cuarter',2,0,0,'',[]),
        quien('Kepler','Sara Lem (ficticia)','kepler@ejemplo.demo','Norberto Cuartero',11,4,2,
          'La Bitácora me ha cambiado la forma de estudiar.',[]) ];
      rec.sort(function(a,b){return b.xp-a.xp;}); rec.forEach(function(r,i){r.pos=i+1;});
      st._demo={ pers:[{id:'demo',nombre:'CLASE DE DEMOSTRACIÓN',tipo:'REGULAR',estado:'Abierto',semana:11,semanas:15,
                  // la lista de docentes vive DENTRO de cada PER: sin ella la sala pide «¿quien eres?»
                  docentes:[{nombre:'Mr Cuarter'},{nombre:'Norberto Cuartero'}]}],
        d:{ nombre:'CLASE DE DEMOSTRACIÓN', tipo:'REGULAR', estado:'Abierto', semana:11, semanas:15,
            cierre_misiones:'11/10/2026', cierre_canje:'18/10/2026',
            docentes:[{nombre:'Mr Cuarter',panel:''},{nombre:'Norberto Cuartero',panel:''}],
            reclutas:rec, panel:'https://view.genially.com/6a8bfc4f5068ad5903fc39e3',
            formBitacora:'#demo', formTicket:'#demo', formCanje:'#demo', doc:'#demo', padlet:'#demo' },
        tickets:[] };
    }
    var D=st._demo;
    if(b.accion==='pers')   return {pers:D.pers};
    if(b.accion==='alumnos')return JSON.parse(JSON.stringify(D.d));
    if(b.accion==='tickets')return {tickets:D.tickets};
    if(b.accion==='pase_estado') return {pase:st.pase||null};
    if(b.accion==='pase_abrir')  return {palabra:'RUTA', hasta:new Date(Date.now()+3*60000).toISOString(), id:'demo'};
    if(b.accion==='canje_revertir'){
      D.d.reclutas.forEach(function(r){ (r.canjes||[]).forEach(function(c){
        if(c.fila===b.fila){ var co=parseInt((c.recompensa.match(/(\d+)/)||[0,0])[1],10)||0;
          r.canjes=r.canjes.filter(function(x){return x!==c;});
          r.creditos+=co; r.creditos_gastados-=co;
          if(/Héroe/.test(c.recompensa)&&r.heroes.length){ r.heroes.pop();
            r.coleccion.heroes.tengo=r.heroes.length; } } }); });
      return {ok:true};}
    return {ok:true};
  }

  /**
   * LA PUERTA. Con el motor viejo era un PIN compartido; con el nuevo es tu cuenta de Google, y la
   * diferencia no es de comodidad.
   *
   * 🔴 Un PIN compartido identifica al GRUPO, no a la persona: quien lo tuviera podía escribir el
   * correo de un compañero y entrar en su sala. Se dejó dicho en su día que eso era orden y no
   * seguridad. Con la cuenta ya no hay nada que escribir — quien pregunta ES quien ha entrado, y de
   * eso responde el servidor, no el navegador.
   */
  function puertaNueva(){
    var M=window.SG&&window.SG.MOTOR; if(!M){document.addEventListener('sg:motor',puertaNueva,{once:true});return;}
    root.innerHTML=cargando('Abriendo tu sala…','Comprobando tu cuenta');
    M.sesion().then(function(u){
      if(!u){
        /**
         * 🔴 12-sep · AQUÍ DIBUJÁBAMOS LA PUERTA, Y ERA EL PEOR SITIO POSIBLE. `root` es
         * `#clase-app`, que va DESPUÉS del hero: el botón de Google caía a 734 px de scroll en una
         * página de 1.013. Norberto llegó aquí desde la guía, vio una pared de texto sin un solo
         * botón y concluyó —con toda la razón— que «no hay manera de iniciar sesión».
         *
         * Ya no se dibuja ninguna puerta: se manda a la única que hay, que es una página entera
         * dedicada a eso y no puede esconder nada. Al volver, la sala ya tiene sesión y esta rama
         * ni se pisa.
         */
        location.replace('entrar.html?volver=clase.html');
        return;
      }
      st.correo=u.correo; localStorage.setItem('sgClaseCorreo',u.correo);
      inicio();
    });
  }
  if(NUEVO){ document.addEventListener('sg:sesion',function(){ puertaNueva(); }); puertaNueva(); return; }

  if(!API&&!st.demo){root.innerHTML='<p class="lead">El tablero aún no está conectado.</p>';return;}
  if(st.pin||st.demo)inicio(); else pedirPin();
})();
