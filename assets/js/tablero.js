// STARGATE — tablero del alumnado. registro.html?per=<id>[&embed=1]
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
  get(API+'?per='+encodeURIComponent(per),function(d){
    if(d.error){msg('<b>'+esc(d.error)+'</b>');return;}
    var r=d.reclutas||[]; var top=r.slice(0,3);
    var forms='<div class="cta-row" style="justify-content:flex-start">'+(d.formBitacora?'<a class="btn primary" href="'+esc(d.formBitacora)+'" target="_blank" rel="noopener">📓 Mi Bitácora de mando (registrar insignias)</a>':'')
      +(d.formTicket?'<a class="btn" href="'+esc(d.formTicket)+'" target="_blank" rel="noopener">🎟️ Ticket de salida</a>':'')+(d.formCanje?'<a class="btn" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Canjear xp</a>':'')+'</div>';
    var podio=top.length?'<div class="podium">'+[1,0,2].map(function(i){var p=top[i];if(!p)return '';var cls=['gold','silver','bronze'][i],med=['🥇','🥈','🥉'][i];return '<div class="pod '+cls+'"><div class="medal">'+med+'</div><div><b>'+esc(p.alias)+'</b></div><div class="pts">'+p.xp+' xp</div><div class="h"></div></div>';}).join('')+'</div>':'';
    var filas=r.map(function(p){return '<tr data-alias="'+esc(p.alias.toLowerCase())+'"><td><b>'+p.pos+'</b></td><td><b>'+esc(p.alias)+'</b></td><td>'+esc(p.planeta)+'</td><td>'+p.n+'/24</td><td class="pts">'+p.xp+'</td><td class="small muted">'+p.xp_disponibles+'</td></tr><tr class="insrow" data-alias="'+esc(p.alias.toLowerCase())+'"><td colspan="6"><div class="dots">'+dots(p)+'</div></td></tr>';}).join('');
    root.innerHTML='<div class="tab-head"><div><div class="eyebrow amber">'+esc(d.nombre)+' · '+esc(d.tipo)+' · '+esc(d.estado)+'</div><h3>Ranking de reclutas</h3></div><div class="small muted">'+r.length+' reclutas · '+new Date(d.actualizado).toLocaleString('es-ES')+'</div></div>'
      +forms+podio
      +'<div class="buscar"><input id="buscaAlias" type="search" placeholder="Busca tu alias…" autocomplete="off"><span class="small muted">xp = ganados · disponibles = tras canjes</span></div>'
      +(r.length?'<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Recluta</th><th>Planeta</th><th>Insignias</th><th>xp</th><th>disp.</th></tr></thead><tbody id="rankBody">'+filas+'</tbody></table></div>':'<p class="lead">Todavía nadie se ha alistado. Sé el primero: rellena tu Bitácora de mando.</p>');
    var inp=document.getElementById('buscaAlias'); if(inp){inp.addEventListener('input',function(){var t=inp.value.trim().toLowerCase();Array.prototype.forEach.call(document.querySelectorAll('#rankBody tr'),function(tr){tr.style.display=(!t||tr.getAttribute('data-alias').indexOf(t)>=0)?'':'none';});});}
  });
})();
