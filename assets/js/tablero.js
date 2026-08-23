// STARGATE — tablero de reclutas (lee el JSON del web app de Apps Script). registro.html?per=<id>[&embed=1]
(function(){
  var API = (window.SG_TABLERO_API || "").trim();
  var root = document.getElementById('tablero-app'); if(!root) return;
  var q = new URLSearchParams(location.search); var per = q.get('per'); var embed = q.get('embed')==='1';
  if(embed){ document.body.classList.add('embed'); }
  var NOMBRES = window.SG_BADGE_NAMES || {};
  var ORDEN = ["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa",
               "R1_la-chispa","R2_el-eco-que-ensena","R3_la-matriz","R4_entorno-de-aula","R5_bitacora-medida","R6_el-juego","R7_microgamificacion","R8_ultimo-umbral",
               "E1_nebula","E2_capitan","E3_vaeon","H1_reclutamiento","H2_primera-forja","H3_cartografo","H4_tripulacion-cero","H5_la-liberacion"];
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function msg(h){ root.innerHTML = '<div class="wip"><span class="ic">🛰️</span><div>'+h+'</div></div>'; }
  if(!API){ msg('<b>Tablero pendiente de conectar.</b> Falta la URL del web app de Apps Script (ver la guía de instalación de abajo).'); return; }
  function get(url, cb){ fetch(url, {redirect:'follow'}).then(function(r){return r.json();}).then(cb).catch(function(e){ msg('<b>No se pudo cargar el tablero.</b> '+esc(e.message)); }); }
  if(!per){
    get(API+'?per=all', function(d){
      if(!d.pers || !d.pers.length){ msg('<b>Aún no hay ningún PER creado.</b> Crea el primero desde la hoja maestra (menú STARGATE).'); return; }
      root.innerHTML = '<h3>Elige el PER</h3><div class="pers">'+d.pers.map(function(p){ return '<a class="btn" href="?per='+encodeURIComponent(p.id)+'">'+esc(p.nombre)+' <small>· '+esc(p.estado)+'</small></a>'; }).join('')+'</div>';
    });
    return;
  }
  msg('Cargando el tablero…');
  get(API+'?per='+encodeURIComponent(per), function(d){
    if(d.error){ msg('<b>'+esc(d.error)+'</b>'); return; }
    var r = d.reclutas || [];
    var top = r.slice(0,3);
    var podio = top.length ? '<div class="podium">'+[1,0,2].map(function(i){ var p=top[i]; if(!p) return ''; var cls=['gold','silver','bronze'][i]; var med=['🥇','🥈','🥉'][i];
        return '<div class="pod '+cls+'"><div class="medal">'+med+'</div><div><b>'+esc(p.alias)+'</b></div><div class="pts">'+p.puntos+' pts</div><div class="h"></div></div>'; }).join('')+'</div>' : '';
    var filas = r.map(function(p){
      var ins = ORDEN.map(function(k){ var on = p.insignias.indexOf(k)>=0; return '<img class="dot'+(on?'':' off')+'" src="assets/img/insignias/'+k+'.png" title="'+esc(NOMBRES[k]||k)+(on?'':' (pendiente)')+'" alt="">'; }).join('');
      return '<tr><td><b>'+p.pos+'</b></td><td><b>'+esc(p.alias)+'</b></td><td>'+esc(p.planeta)+'</td><td>'+p.n+'/24</td><td class="pts">'+p.puntos+'</td></tr>'
           + '<tr class="insrow"><td colspan="5"><div class="dots">'+ins+'</div></td></tr>';
    }).join('');
    root.innerHTML = '<div class="tab-head"><div><div class="eyebrow amber">'+esc(d.nombre)+' · '+esc(d.estado)+'</div><h3>Ranking de reclutas</h3></div>'
      + '<div class="small muted">'+r.length+' reclutas · actualizado '+new Date(d.actualizado).toLocaleString('es-ES')+'</div></div>'
      + podio
      + (r.length ? '<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>Recluta</th><th>Planeta actual</th><th>Insignias</th><th>Puntos</th></tr></thead><tbody>'+filas+'</tbody></table></div>'
                  : '<p class="lead">Todavía no hay registros. El primero que se aliste abrirá la Bitácora.</p>');
  });
})();
