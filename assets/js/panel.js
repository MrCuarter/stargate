// STARGATE — panel de control: los planetas se abren según el calendario del PER.
// panel.html            -> todos abiertos (versión estática, para el Genially estándar)
// panel.html?per=<id>   -> se desbloquean solos con la fecha de la semana 1 de ese PER
// panel.html?semana=N   -> fuerza una semana (para probar)
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), SEM=window.SG_SEMANAS||[];
  var q=new URLSearchParams(location.search), per=q.get('per'), forzada=parseInt(q.get('semana')||'0',10);
  var aviso=document.getElementById('aviso');
  if(!per && !forzada) return;                       // sin PER: todo visible

  function aplicar(actual, nombre, tipo){
    var n = (window.SGCAL? window.SGCAL.vista(tipo,SEM):SEM).length || 15;
    var abiertos=0, prox=null;
    Array.prototype.forEach.call(document.querySelectorAll('.pl'),function(el){
      var abre=parseInt(el.getAttribute('data-abre'),10);
      // en PUA el curso se comprime: los umbrales se escalan igual que en la Nave
      if(tipo==='PUA'&&window.SGCAL) abre=window.SGCAL.desdeEfectiva(abre,'PUA',n);
      if(actual>=abre){abiertos++;}
      else {el.classList.add('bloq'); if(!prox||abre<prox.abre) prox={abre:abre,nom:el.querySelector('b').textContent};}
    });
    if(aviso){
      aviso.innerHTML = actual<1 ? 'La misión aún no ha empezado'+(nombre?' · '+nombre:'')
        : abiertos>=8 ? 'Galaxia completa'+(nombre?' · '+nombre:'')+' · los ocho mundos están abiertos'
        : 'Semana '+actual+(nombre?' · '+nombre:'')+' · '+abiertos+' de 8 mundos abiertos'
          +(prox?' — el siguiente llega en la semana '+prox.abre:'');
    }
  }
  if(per&&API){
    fetch(API+'?per='+encodeURIComponent(per),{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){
      if(d.error) return;
      var a = forzada || (window.SGCAL? window.SGCAL.semanaActual(d.inicio):null);
      if(a===null||a===undefined) return;
      aplicar(a, d.nombre, d.tipo);
    }).catch(function(){});
  } else if(forzada) aplicar(forzada,'','REGULAR');
})();
