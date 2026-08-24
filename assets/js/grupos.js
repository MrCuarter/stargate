// STARGATE — Grupos: un panel por PER con todos los accesos del docente.
// grupos.html[?per=<id>] · sin PIN: la lista sale de doGet ?per=all (id/nombre/tipo/estado/inicio)
// y los enlaces de formularios de cada grupo, de doGet ?per=<id> (lo mismo que ve la Nave).
(function(){
  var root=document.getElementById('grupos-app'); if(!root) return;
  var API=(window.SG_TABLERO_API||"").trim();
  var q=new URLSearchParams(location.search), foco=q.get('per')||'';
  var detalles={};   // id -> datos del PER (se piden al desplegar)
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function cargando(txt){return '<div class="cargando"><div class="txt">'+txt+'</div><div class="barra"><i></i></div></div>';}

  function semanaDe(p){
    if(!p.inicio||!window.SGCAL) return '';
    var n=window.SGCAL.vista(p.tipo,window.SG_SEMANAS||[]).length;
    var a=window.SGCAL.semanaActual(p.inicio);
    if(a==null) return '';
    if(a<1) return 'aún no ha empezado';
    if(a>n) return 'viaje terminado';
    return 'semana '+a+' de '+n;
  }
  function fecha(v){ if(!v) return ''; var d=new Date(v); return isNaN(d)?String(v):d.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}); }

  var ACCESOS=[
    ['registro.html','🏆','Tablero del grupo','El ranking en vivo, las insignias y los xp de esta clase. Es el enlace que se comparte con el alumnado.'],
    ['recluta.html','🚀','La Nave del recluta','La web del alumnado: orden de la semana, planetas, ficha personal, álbum de cromos y recompensas.'],
    ['profes.html','🧑‍🏫','Panel del profesorado','Alumnos, ajustes, canjes y ciclo de vida del PER. Pide el <b>PIN</b>.'],
    ['tickets.html','🎟️','Tickets de salida','Las valoraciones y dudas anónimas de «Contacta con NEBULA», por sección.'],
    ['foro.html','💬','Foro de la semana','El mensaje que toca publicar esta semana, listo para copiar.'],
    ['embed.html','🔗','Enlaces, embeds y QR','Todo lo que hay que pegar en los Geniallys de este grupo.']
  ];

  function tarjeta(p){
    var sem=semanaDe(p), d=detalles[p.id];
    var accesos=ACCESOS.map(function(a){
      return '<a class="acceso" href="'+a[0]+'?per='+encodeURIComponent(p.id)+'" target="_blank" rel="noopener">'
        +'<span class="ic">'+a[1]+'</span><b>'+a[2]+'</b><em>'+a[3]+'</em></a>';}).join('');
    var forms='';
    if(d===undefined) forms='<p class="small muted">Cargando los formularios del grupo…</p>';
    else if(d===null)  forms='<p class="small muted">No se han podido leer los formularios de este grupo.</p>';
    else {
      var b=[];
      if(d.formBitacora) b.push(['📓','Bitácora de mando',d.formBitacora]);
      if(d.formCanje)    b.push(['🎁','Canje de recompensas',d.formCanje]);
      if(d.formTicket)   b.push(['🎟️','Ticket «Contacta con NEBULA»',d.formTicket]);
      if(d.panel)        b.push(['🪐','Panel de control (Genially)',d.panel]);
      forms=b.length?('<div class="forms">'+b.map(function(x){
          return '<a class="chip-link" href="'+esc(x[2])+'" target="_blank" rel="noopener">'+x[0]+' '+esc(x[1])+'</a>';}).join('')
        +'</div>'):'<p class="small muted">Este grupo aún no tiene formularios publicados.</p>';
    }
    return '<div class="card grupo'+(p.id===foco?' foco':'')+'" id="g-'+esc(p.id)+'">'
      +'<div class="grupo-head"><div><h3>'+esc(p.nombre)+'</h3>'
      +'<p class="small muted">'+esc(p.tipo||'')+(p.estado?' · '+esc(p.estado):'')
      +(p.inicio?' · empezó el '+esc(fecha(p.inicio)):'')+(sem?' · <b>'+esc(sem)+'</b>':'')+'</p></div>'
      +'<button class="btn small copiar" type="button" data-url="'+location.origin+location.pathname.replace(/grupos\.html$/,'')
      +'recluta.html?per='+encodeURIComponent(p.id)+'">📋 Copiar enlace del alumnado</button></div>'
      +'<div class="accesos">'+accesos+'</div>'+forms+'</div>';
  }

  function pinta(pers){
    if(!pers.length){ root.innerHTML='<div class="card"><h3>Todavía no hay grupos</h3>'
      +'<p class="small muted">Los grupos (PER) se crean desde la hoja maestra: menú <b>STARGATE → Crear nuevo PER</b>. '
      +'En cuanto exista uno aparecerá aquí y en el menú de arriba.</p>'
      +'<p><a class="btn" href="registro.html#instalacion">Cómo se instala el sistema</a></p></div>'; return; }
    root.innerHTML=pers.map(tarjeta).join('');
    Array.prototype.forEach.call(root.querySelectorAll('.copiar'),function(b){
      b.onclick=function(){ var t=b.getAttribute('data-url');
        (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){
          var v=b.textContent; b.textContent='✓ Copiado'; setTimeout(function(){b.textContent=v;},1600);
        }).catch(function(){ window.prompt('Copia el enlace:', t); }); };
    });
    var f=foco&&document.getElementById('g-'+foco); if(f) f.scrollIntoView({block:'center'});
  }

  root.innerHTML=cargando('Contactando con NEBULA…');
  if(!API){ pinta([]); return; }
  window.SG.pers(function(pers,origen){
    if(origen==='error'){ root.innerHTML='<p class="lead">No se ha podido leer la lista de grupos. Prueba a recargar.</p>'; return; }
    pinta(pers);
    pers.forEach(function(p){                      // los formularios de cada grupo, en paralelo
      if(p.id in detalles) return;
      fetch(API+'?per='+encodeURIComponent(p.id),{redirect:'follow'}).then(function(r){return r.json();})
        .then(function(d){ detalles[p.id]=d&&!d.error?d:null; pinta(pers); })
        .catch(function(){ detalles[p.id]=null; pinta(pers); });
    });
  });
})();
