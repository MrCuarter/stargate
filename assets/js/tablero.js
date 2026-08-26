// STARGATE — tablero del alumnado. registro.html?per=<id>[&embed=1][&ranking=xp|semana|coleccion]
// v3.18 · TRES RANKINGS. Con uno solo siempre gana el mismo perfil. Ahora hay tres formas de
// destacar: el que más ha trabajado en total, el que más ha apretado ESTA semana (así quien llega
// tarde sigue teniendo algo que ganar) y el coleccionista, que va de gastar créditos y de suerte.
// El orden lo decide el modo; los datos son siempre los mismos y las tres columnas se ven a la vez.
(function(){
  var API=(window.SG_TABLERO_API||"").trim(); var root=document.getElementById('tablero-app'); if(!root) return;
  var q=new URLSearchParams(location.search), per=q.get('per'), embed=q.get('embed')==='1'; if(embed) document.body.classList.add('embed');
  var N=window.SG_BADGE_NAMES||{};
  var ORDEN=["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa","R1_la-chispa","R2_el-eco-que-ensena","R3_la-matriz","R4_entorno-de-aula","R5_bitacora-medida","R6_el-juego","R7_microgamificacion","R8_ultimo-umbral","E1_nebula","E2_capitan","E3_vaeon","H1_reclutamiento","H2_primera-forja","H3_cartografo","H4_tripulacion-cero","H5_la-liberacion"];
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function msg(h){root.innerHTML='<div class="wip"><span class="ic">🛰️</span><div>'+h+'</div></div>';}
  if(!API){msg('<b>Tablero pendiente de conectar.</b> Falta la URL del web app (guía de instalación, abajo).');return;}
  function get(u,cb){fetch(u,{redirect:'follow'}).then(function(r){return r.json();}).then(cb).catch(function(e){msg('<b>No se pudo cargar el tablero.</b> '+esc(e.message));});}
  if(!per){get(API+'?per=all',function(d){if(!d.pers||!d.pers.length){msg('<b>Aún no hay ningún PER.</b>');return;}
    root.innerHTML='<h3>Elige tu PER</h3><div class="pers">'+d.pers.map(function(p){return '<a class="btn" href="?per='+encodeURIComponent(p.id)+(embed?'&embed=1':'')+'">'+esc(p.nombre)+' <small>· '+esc(p.tipo)+' · '+esc(p.estado)+'</small></a>';}).join('')+'</div>';});return;}
  msg('Cargando el tablero…');
  function dots(p){return ORDEN.map(function(k){var on=p.insignias.indexOf(k)>=0;return '<img class="dot'+(on?'':' off')+'" src="assets/img/insignias/'+k+'.png" title="'+esc(N[k]||k)+(on?'':' (pendiente)')+'" alt="">';}).join('');}

  // ---------- la colección ----------
  // El servidor manda el desglose y un pct SIN redondear: con 35 piezas, redondear antes de ordenar
  // metería empates falsos. Aquí se redondea solo para pintarlo.
  function pctCol(p){return p.coleccion?p.coleccion.pct:0;}
  function colTxt(p){
    if(!p.coleccion) return '—';
    var c=p.coleccion;
    var det='Cartas '+c.cromos.tengo+'/'+c.cromos.total+' · héroes '+c.heroes.tengo+'/'+c.heroes.total+' · skins '+c.skins.tengo+'/'+c.skins.total;
    return '<span class="'+(c.tengo===c.total?'muted full':'muted')+'" title="'+esc(det)+'">'+Math.round(c.pct)+'%</span>'
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
     vacio:'Nadie ha empezado a coleccionar todavía. Los sobres se abren desde la semana 2.'}
  ];
  function modoDe(k){for(var i=0;i<MODOS.length;i++) if(MODOS[i].k===k) return MODOS[i]; return MODOS[0];}
  var modo=modoDe(q.get('ranking')||'xp');

  get(API+'?per='+encodeURIComponent(per),function(d){
    if(d.error){msg('<b>'+esc(d.error)+'</b>');return;}
    var todos=d.reclutas||[];
    var forms='<div class="cta-row" style="justify-content:flex-start">'+(d.formBitacora?'<a class="btn primary" href="'+esc(d.formBitacora)+'" target="_blank" rel="noopener">📓 Mi Bitácora de mando (registrar insignias)</a>':'')
      +(d.formTicket?'<a class="btn" href="'+esc(d.formTicket)+'" target="_blank" rel="noopener">🎟️ Ticket de salida</a>':'')
      +(d.formCanje?'<a class="btn" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Canjear créditos</a>':'')+'</div>';

    function clasificar(m){
      var r=todos.slice();
      if(m.soloConValor) r=r.filter(function(p){return m.val(p)>0;});
      // desempate SIEMPRE igual y estable: la métrica, luego xp, luego insignias, luego el alias
      r.sort(function(a,b){return m.val(b)-m.val(a) || b.xp-a.xp || b.n-a.n || a.alias.localeCompare(b.alias);});
      var pos=0,ant=null;
      r.forEach(function(p,i){var v=m.val(p); if(ant===null||v!==ant){pos=i+1;ant=v;} p._pos=pos;});  // empatados, mismo puesto
      return r;
    }
    function cifra(p,m){return (m.pct?Math.round(m.val(p)):m.val(p))+m.unidad;}

    function pinta(){
      var r=clasificar(modo), top=r.slice(0,3);
      var pestanas='<div class="rank-tabs" role="tablist">'+MODOS.map(function(m){
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
      var filas=r.map(function(p){
        return '<tr data-alias="'+esc(p.alias.toLowerCase())+'"><td><b>'+p._pos+'</b></td>'
          +'<td class="who">'+SG.avatarImg(p.avatar,p.alias,p.marco==='oro'?'marco-oro':'')+'<span><b>'+(p.corona?'👑 ':'')+esc(p.alias)+'</b>'
          +(p.racha>=3?'<span class="chip-racha" title="'+p.racha+' semanas seguidas registrando algo">🔥 '+p.racha+'</span>':'')
          +(p.titulo?'<em class="titulo-recluta">«'+esc(p.titulo)+'»</em>':'')+'</span></td>'
          +'<td>'+esc(p.planeta)+'</td><td>'+p.n+'/24</td>'
          +'<td'+td('col','small')+'>'+colTxt(p)+'</td>'
          +'<td class="small"><b>'+(SG.nivel?SG.nivel(p.xp,d.tipo):1)+'</b> <span class="muted">'+esc(SG.avatarSrc(p.avatar,p.alias,p.xp,d.tipo).rango)+'</span></td>'
          +'<td'+td('xp','pts')+'>'+p.xp+'</td>'
          +'<td'+td('sem','small')+'>'+(p.xp7||0)+'</td>'
          +'<td class="small muted">'+(p.creditos!=null?p.creditos:(p.xp_disponibles||0))+'</td></tr>'
          +'<tr class="insrow" data-alias="'+esc(p.alias.toLowerCase())+'"><td colspan="9"><div class="dots">'+dots(p)+'</div></td></tr>';}).join('');
      root.innerHTML='<div class="tab-head"><div><div class="eyebrow amber">'+esc(d.nombre)+' · '+esc(d.tipo)+' · '+esc(d.estado)+'</div><h3>Ranking de reclutas</h3></div>'
        +'<div class="small muted">'+todos.length+' reclutas · '+new Date(d.actualizado).toLocaleString('es-ES')+'</div></div>'
        +forms+pestanas+podio
        +'<div class="buscar"><input id="buscaAlias" type="search" placeholder="Busca tu alias…" autocomplete="off"><span class="small muted">xp = ganados · ◈ = lo que te queda tras canjear</span></div>'
        +(r.length?'<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Recluta</th><th>Planeta</th><th>Insignias</th>'
            +'<th'+th('col')+' title="Cartas, héroes y versiones de tu personaje">Colección</th><th>Nivel</th>'
            +'<th'+th('xp')+'>xp</th><th'+th('sem')+' title="xp de los últimos 7 días">Semana</th><th>◈</th></tr></thead>'
            +'<tbody id="rankBody">'+filas+'</tbody></table></div>'
          :'<p class="lead">'+(todos.length?modo.vacio:'Todavía nadie se ha alistado. Sé el primero: rellena tu Bitácora de mando.')+'</p>');
      var inp=document.getElementById('buscaAlias');
      if(inp){inp.addEventListener('input',function(){var t=inp.value.trim().toLowerCase();
        Array.prototype.forEach.call(document.querySelectorAll('#rankBody tr'),function(tr){
          tr.style.display=(!t||tr.getAttribute('data-alias').indexOf(t)>=0)?'':'none';});});}
      Array.prototype.forEach.call(root.querySelectorAll('.rank-tab'),function(b){
        b.onclick=function(){
          modo=modoDe(b.getAttribute('data-modo'));
          // el modo va en la URL: así se puede enlazar «el ranking de la semana» y sobrevive a un F5
          try{var u=new URL(location.href); u.searchParams.set('ranking',modo.k); history.replaceState(null,'',u);}catch(e){}
          pinta();
        };});
    }
    pinta();
  });
})();
