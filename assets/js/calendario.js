// STARGATE — calendario compartido (foro dinámico + Nave del Recluta)
// Semana en curso desde la fecha de la semana 1 del PER, vista PUA (fusión por tema)
// y semanas de desbloqueo (los umbrales se definen sobre las 15 semanas REGULAR).
window.SGCAL = (function(){
  function semanasPua(SEM){var porTema={};SEM.forEach(function(s){var t=s.tema_n;if(!t)return;(porTema[t]=porTema[t]||[]).push(s);});
    return Object.keys(porTema).sort(function(a,b){return a-b;}).map(function(t,i){var l=porTema[t];return {sem:i+1,tema:l[0].tema.replace(' (cont.)',''),sub:l.map(function(s){return s.sub;}).join(' · '),capitulo:l[0].capitulo,tema_n:Number(t),videos:[].concat.apply([],l.map(function(s){return s.videos;})),lanza:[].concat.apply([],l.map(function(s){return s.lanza;})),insignias:[].concat.apply([],l.map(function(s){return s.insignias;})),foro:l.map(function(s){return s.foro;}).join('\n\n— · —\n\n'),hito:l.map(function(s){return s.hito;}).join(' · '),consejo:l.map(function(s){return s.consejo;}).filter(Boolean).join(' '),clases:l.map(function(s){return s.clases;}).filter(Boolean).join(' · ')};});}
  function vista(tipo,SEM){return tipo==='PUA'?semanasPua(SEM):SEM;}
  function semanaActual(inicio){if(!inicio)return null;var hoy=new Date();hoy.setHours(0,0,0,0);var ini=new Date(inicio+'T00:00:00');return Math.floor((hoy-ini)/(7*864e5))+1;}
  function desdeEfectiva(desde,tipo,total){desde=Number(desde)||0;if(!desde)return 0;return tipo==='PUA'?Math.max(1,Math.round(desde*total/15)):desde;}
  // datos del PER con caché local (la lentitud es el arranque en frío de Apps Script):
  // pinta al instante con lo cacheado y corrige después con lo fresco. cb(data, esCache) puede llegar 2 veces.
  /**
   * 🔴 12-sep · ESTO NO PASABA POR EL INTERRUPTOR DE MOTOR. Iba SIEMPRE al Apps Script, así que en un
   * grupo del motor nuevo la respuesta era «no existe» — y la sesión proyectable y el foro dinámico
   * no daban error: se quedaban con sus valores por defecto y enseñaban la SEMANA 1 estando en la
   * 14. Un docente habría proyectado la clase equivocada sin enterarse, que es el peor tipo de fallo.
   *
   * La caché se guarda con el motor en la clave: si no, al cambiar de motor se leería la foto del
   * otro y volvería el mismo error por otra puerta.
   */
  function perData(API,per,cb){
    var F = window.SG && window.SG.FUENTE;
    var nuevo = F && F.nombre === 'firestore';
    var K='sgPerCache_'+(nuevo?'fs_':'')+per, hit=false;
    try{var c=JSON.parse(localStorage.getItem(K)||'null');
        if(c&&c.d&&(Date.now()-c.t)<43200e3){hit=true;cb(c.d,true);}}catch(e){}
    var pedir = nuevo
      ? F.tablero(per)
      : fetch(API+'?per='+encodeURIComponent(per),{redirect:'follow'}).then(function(r){return r.json();});
    pedir.then(function(d){
      if(d&&!d.error){try{localStorage.setItem(K,JSON.stringify({t:Date.now(),d:d}));}catch(e){}}
      cb(d,false);
    }).catch(function(){if(!hit)cb(null,false);});}
  return {semanasPua:semanasPua,vista:vista,semanaActual:semanaActual,desdeEfectiva:desdeEfectiva,perData:perData};
})();
