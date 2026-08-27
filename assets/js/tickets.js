// STARGATE — panel visual de tickets de salida (PIN). tickets.html[?per=id][&embed=1][&demo=1]
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), root=document.getElementById('tickets-app'); if(!root) return;
  var q=new URLSearchParams(location.search); if(q.get('embed')==='1') document.body.classList.add('embed');
  // v3.20 · &panorama=1 · para PROYECTAR en clase dentro de un Genially horizontal: las cifras
  // grandes, el ultimo tema y sus comentarios a dos columnas. Sin listas largas ni acordeones.
  if(q.get('panorama')==='1') document.body.classList.add('panorama');
  // Los items de puesta en escena («¿se ha mostrado el ranking?») son un espejo PARA EL DOCENTE, y
  // se le enseñan en su panel. En el panorama NO: ese se proyecta delante de la clase, y un
  // «se ha reconocido a alguien: 2,1» en pantalla gigante no ayuda a nadie.
  var PANO=q.get('panorama')==='1', KESC='STARGATE \u00b7';
  var st={pin:sessionStorage.getItem('sgPin')||'',per:q.get('per')||'',pers:[],tickets:[],prof:q.get('profe')||'',demo:q.get('demo')==='1'};
  var KSEL='Selecciona el tema',KPROF='profesor o profesora';
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function f(d){try{return new Date(d).toLocaleDateString('es-ES');}catch(e){return d;}}
  function campo(r,frag){for(var k in r)if(k.indexOf(frag)>=0)return r[k];return '';}
  function post(b,cb){if(st.demo){return cb(demo(b));}b.pin=st.pin;fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(b)}).then(function(r){return r.json();}).then(function(d){if(d.error){if(/PIN/.test(d.error)){sessionStorage.removeItem('sgPin');st.pin='';pedirPin(d.error);return;}alert(d.error);return;}cb(d);}).catch(function(e){alert('Error: '+e.message);});}
  function pedirPin(m){root.innerHTML='<div class="card" style="max-width:420px"><h3>Acceso del profesorado</h3><p class="small muted">'+esc(m||'PIN compartido del profesorado.')+'</p><input id="pin" type="password" placeholder="PIN" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:#fff"><button class="btn primary" id="okpin" style="margin-top:10px">Entrar</button></div>';
    document.getElementById('okpin').onclick=function(){st.pin=document.getElementById('pin').value.trim();sessionStorage.setItem('sgPin',st.pin);inicio();};document.getElementById('pin').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('okpin').click();});}
  function inicio(){root.innerHTML='<p class="muted">Cargando…</p>';post({accion:'pers'},function(d){st.pers=d.pers||[];if(!st.per&&st.pers.length)st.per=st.pers[st.pers.length-1].id;cargar();});}
  function cargar(){post({accion:'tickets',per:st.per},function(d){st.tickets=d.tickets||[];render();});}
  function barra(vals){var c=[0,0,0,0,0];vals.forEach(function(v){if(v>=1&&v<=5)c[v-1]++;});var mx=Math.max.apply(null,c)||1;return '<div class="hist">'+c.map(function(n,i){return '<div class="hb" title="'+(i+1)+': '+n+'"><div class="hf" style="height:'+Math.round(100*n/mx)+'%"></div><span>'+(i+1)+'</span></div>';}).join('')+'</div>';}
  function gauge(m){var pct=Math.round((m-1)/4*100);var col=m>=4?'#37e0ec':m>=3?'#f5b043':'#ff6b6b';return '<div class="gauge" style="--p:'+pct+'%;--c:'+col+'"><b>'+m.toFixed(1)+'</b></div>';}
  var QDATOS={}, QN=0;
  // ---------- v3.29 · LA VALORACIÓN, EN GRANDE ----------
  // La misma pregunta con la media enorme, el reparto de respuestas leyéndose desde lejos y cuánta
  // gente contestó. Pensado para proyectarlo: «mirad lo que habéis contestado hoy».
  function cerrarZoom(){var o=document.getElementById('zoom-q'); if(o) o.style.display='none';}
  function abrirZoom(id){
    var q=QDATOS[id]; if(!q) return;
    var total=q.a.length, c=[0,0,0,0,0];
    q.a.forEach(function(v){ if(v>=1&&v<=5) c[v-1]++; });
    var mx=Math.max.apply(null,c)||1;
    var barras=c.map(function(n,i){
      var pct=total?Math.round(100*n/total):0;
      return '<div class="zb"><div class="zb-col"><div class="zb-fill" style="height:'+Math.round(100*n/mx)+'%"></div></div>'
        +'<div class="zb-n">'+(i+1)+'</div>'
        +'<div class="zb-d">'+n+' <span>('+pct+'%)</span></div></div>';}).join('');
    var o=document.getElementById('zoom-q');
    if(!o){o=document.createElement('div');o.id='zoom-q';o.className='lupa';document.body.appendChild(o);}
    o.innerHTML='<div class="lupa-fondo"></div><div class="zq-caja" role="dialog">'
      +'<button class="lupa-x" aria-label="Cerrar">×</button>'
      +'<div class="eyebrow amber">'+esc(q.sec||'')+'</div>'
      +'<h3 class="zq-preg">'+esc(q.c)+'</h3>'
      +'<div class="zq-media"><b>'+q.m.toFixed(1)+'</b><span>media sobre 5 · '+total+' respuestas</span></div>'
      +'<div class="zq-barras">'+barras+'</div></div>';
    o.style.display='flex';
    o.querySelector('.lupa-fondo').onclick=cerrarZoom;
    o.querySelector('.lupa-x').onclick=cerrarZoom;
  }
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') cerrarZoom(); });

  function render(){QDATOS={};QN=0;var per=st.pers.filter(function(x){return x.id===st.per;})[0]||{};var t=st.tickets;
    var profes={};t.forEach(function(x){var p=String(campo(x.r,KPROF)||'');if(p)profes[p]=(profes[p]||0)+1;});
    var tf=st.prof?t.filter(function(x){return campo(x.r,KPROF)===st.prof;}):t;
    var sel='<select id="selPer">'+st.pers.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===st.per?' selected':'')+'>'+esc(p.nombre)+'</option>';}).join('')+'</select>'
      +'<select id="selProf"><option value="">Todo el profesorado</option>'+Object.keys(profes).concat(st.prof&&!profes[st.prof]?[st.prof]:[]).sort().map(function(p){return '<option value="'+esc(p)+'"'+(p===st.prof?' selected':'')+'>'+esc(p)+' ('+(profes[p]||0)+')</option>';}).join('')+'</select>';
    var pend=tf.filter(function(x){return !x.resuelto&&Object.keys(x.r).some(function(c){return c.indexOf(KSEL)<0&&c.indexOf(KPROF)<0&&!/^[1-5]$/.test(String(x.r[c]))&&String(x.r[c]).trim();});}).length;
    var sats=[];tf.forEach(function(x){Object.keys(x.r).forEach(function(c){if(/satisfacci/i.test(c)&&/^[1-5]$/.test(String(x.r[c])))sats.push(Number(x.r[c]));});});
    var satm=sats.length?sats.reduce(function(a,b){return a+b;},0)/sats.length:0;
    var head='<div class="tab-head"><div><div class="eyebrow amber">Contacta con NEBULA · tickets de salida</div><h3>'+esc(per.nombre||'')+'</h3></div><div class="selrow">'+sel+'</div></div>'
      +'<div class="kpis"><div class="kpi"><b>'+tf.length+'</b><span>tickets</span></div><div class="kpi"><b>'+pend+'</b><span>dudas sin resolver</span></div><div class="kpi"><b>'+(sats.length?satm.toFixed(1):'—')+'</b><span>satisfacción media</span></div><div class="kpi"><b>'+(tf.length?esc(f(tf[tf.length-1].fecha)):'—')+'</b><span>último ticket</span></div></div>';
    if(!tf.length){root.innerHTML=head+'<p class="lead">Sin tickets todavía'+(st.prof?' para este profesor/a':'')+'.</p>';wire();return;}
    var por={};tf.forEach(function(x){var k=String(campo(x.r,KSEL)||'(sin sección)');(por[k]=por[k]||[]).push(x);});
    var orden=Object.keys(por).sort(function(a,b){function w(s){if(/^Presentaci/.test(s))return 0;var m=s.match(/^Tema (\d)/);if(m)return 10+Number(m[1]);var a2=s.match(/^Actividad (\d)/);if(a2)return 5+Number(a2[1])*4;return 90;}return w(a)-w(b);});
    var html=orden.map(function(k){var l=por[k];var num={},txt=[];
      l.forEach(function(x){Object.keys(x.r).forEach(function(c){if(c.indexOf(KSEL)>=0||c.indexOf(KPROF)>=0)return;if(PANO&&c.indexOf(KESC)===0)return;var v=x.r[c];if(/^[1-5]$/.test(String(v))){(num[c]=num[c]||[]).push(Number(v));}else if(String(v).trim()){txt.push({p:c,v:String(v),x:x});}});});
      var cards=Object.keys(num).map(function(c){var a=num[c];var m=a.reduce(function(p,q2){return p+q2;},0)/a.length;
        // v3.29 · pulsable: en el panel las tarjetas son pequeñas y el histograma no se lee. Los datos
        // se guardan aquí y no se vuelven a pedir: la ampliación es instantánea.
        var id='q'+(QN++); QDATOS[id]={c:c,a:a,m:m,sec:k};
        return '<div class="qcard clicable" data-zoom="'+id+'" tabindex="0" title="Ver en grande">'+gauge(m)+'<div class="qtxt"><b>'+esc(c)+'</b><span class="small muted">'+a.length+' respuestas</span>'+barra(a)+'</div></div>';}).join('');
      var dudas=txt.map(function(d){var res=!!d.x.resuelto;return '<div class="duda'+(res?' ok':'')+'"><div class="dq small muted">'+esc(d.p)+' · '+esc(f(d.x.fecha))+(campo(d.x.r,KPROF)?' · '+esc(campo(d.x.r,KPROF)):'')+'</div><div class="dv">'+esc(d.v)+'</div><button class="btn small'+(res?'':' primary')+'" data-f="'+d.x.fila+'" data-v="'+(res?'0':'1')+'">'+(res?'✓ Resuelta ('+esc(d.x.resuelto)+') · deshacer':'Marcar resuelta')+'</button></div>';}).join('');
      return '<details class="semana" open><summary><span class="num">'+l.length+'</span><span class="ttl"><b>'+esc(k)+'</b><em>'+Object.keys(num).length+' valoraciones · '+txt.length+' comentarios</em></span></summary><div class="sem-body">'+(cards?'<div class="qgrid">'+cards+'</div>':'')+(dudas?'<h4>💬 Dudas y comentarios</h4><div class="dudas">'+dudas+'</div>':'')+'</div></details>';}).join('');
    root.innerHTML=head+html;wire();}
  function wire(){
    Array.prototype.forEach.call(root.querySelectorAll('[data-zoom]'),function(el){
      el.onclick=function(){abrirZoom(el.getAttribute('data-zoom'));};
      el.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirZoom(el.getAttribute('data-zoom'));}};});
var sp=document.getElementById('selPer');if(sp)sp.onchange=function(){st.per=this.value;st.prof='';cargar();};var sf=document.getElementById('selProf');if(sf)sf.onchange=function(){st.prof=this.value;render();};
    Array.prototype.forEach.call(root.querySelectorAll('button[data-f]'),function(b){b.onclick=function(){var profe=localStorage.getItem('sgProfe')||prompt('Tu nombre (para el registro):')||'';localStorage.setItem('sgProfe',profe);post({accion:'ticket_resuelto',per:st.per,fila:parseInt(b.getAttribute('data-f'),10),valor:b.getAttribute('data-v')==='1',profe:profe},function(){cargar();});};});}
  function demo(b){if(b.accion==='pers')return {pers:[{id:'demo',nombre:'PER de demostración',tipo:'REGULAR',estado:'Abierto'}]};if(b.accion==='ticket_resuelto'){var t=st.tickets.filter(function(x){return x.fila===b.fila;})[0];if(t)t.resuelto=b.valor?'Sí · demo':'';return {ok:true};}
    var P=['Ana Pérez','Luis Gómez'],S='Selecciona el tema o actividad',PR='El profesor o profesora que imparte tu clase...',out=[],i;
    function r(a,b2){return a+Math.floor(Math.random()*(b2-a+1));}
    for(i=0;i<18;i++){var o={};o[PR]=P[i%2];o[S]='Tema 1: Creación de contenido multimedia (Fôrge)';o['Valora la utilidad de las herramientas o estrategias vistas en clase']=r(3,5);o['Valora la satisfacción general del desarrollo de la clase']=r(3,5);o['Valora la satisfacción con los contenidos teóricos vistos en clase sobre este tema']=r(2,5);o['Valora tu grado de participación en clase']=r(1,5);if(i%4===0)o['¿Alguna duda? ¿Te ha quedado alguna duda o quieres hacernos llegar algún comentario?']=['¿La imagen con IA puede ser un collage de varias?','No entendí la diferencia entre prompt y contexto','¿Cuántas iteraciones hay que documentar?','¿Sirve Canva para la Act. 1?'][i/4%4];out.push({fecha:new Date(Date.now()-i*864e5).toISOString(),fila:i+2,resuelto:i===4?'Sí · Ana · 20/08':'',r:o});}
    for(i=0;i<7;i++){var o2={};o2[PR]=P[i%2];o2[S]='Presentación de la asignatura';o2['¿Qué vibraciones te ha transmitido la presentación?']=r(4,5);o2['Valora la utilidad que percibes del temario de la asignatura']=r(3,5);o2['¿Cómo valorarías tus conocimientos iniciales sobre herramientas TIC?']=r(1,4);if(i<2)o2['¿Qué esperas de la asignatura? ¿Qué te gustaría aprender?']=['Herramientas que pueda usar el lunes en clase','Aprender a gamificar sin volverme loca'][i];out.push({fecha:new Date(Date.now()-(20+i)*864e5).toISOString(),fila:30+i,resuelto:'',r:o2});}
    return {tickets:out};}
  if(st.demo||st.pin)inicio();else pedirPin();
})();
