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
  /**
   * 🔴 12-sep · ESTO PEDÍA LOS DATOS AL APPS SCRIPT A PELO. Con un grupo del motor nuevo la respuesta
   * era «no existe», el `return` se lo tragaba y el panel se quedaba como nace: CON LOS OCHO
   * PLANETAS ABIERTOS. Es decir, en la semana 1 el alumnado veía el curso entero desbloqueado, sin
   * que nada fallara a la vista.
   *
   * `SGCAL.perData` ya sabe con qué motor hablar —y cachea—, así que se usa eso. Puede llamar dos
   * veces (primero la caché, luego lo fresco): aplicar dos veces no molesta, es idempotente.
   */
  if(per && window.SGCAL && window.SGCAL.perData){
    window.SGCAL.perData(API, per, function(d){
      if(!d || d.error) return;
      var a = forzada || window.SGCAL.semanaActual(d.inicio);
      if(a===null||a===undefined) return;
      aplicar(a, d.nombre, d.tipo);
    });
  } else if(forzada) aplicar(forzada,'','REGULAR');
})();
