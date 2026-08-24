// STARGATE — calendario compartido (foro dinámico + Nave del Recluta)
// Semana en curso desde la fecha de la semana 1 del PER, vista PUA (fusión por tema)
// y semanas de desbloqueo (los umbrales se definen sobre las 15 semanas REGULAR).
window.SGCAL = (function(){
  function semanasPua(SEM){var porTema={};SEM.forEach(function(s){var t=s.tema_n;if(!t)return;(porTema[t]=porTema[t]||[]).push(s);});
    return Object.keys(porTema).sort(function(a,b){return a-b;}).map(function(t,i){var l=porTema[t];return {sem:i+1,tema:l[0].tema.replace(' (cont.)',''),sub:l.map(function(s){return s.sub;}).join(' · '),capitulo:l[0].capitulo,tema_n:Number(t),videos:[].concat.apply([],l.map(function(s){return s.videos;})),lanza:[].concat.apply([],l.map(function(s){return s.lanza;})),insignias:[].concat.apply([],l.map(function(s){return s.insignias;})),foro:l.map(function(s){return s.foro;}).join('\n\n— · —\n\n'),hito:l.map(function(s){return s.hito;}).join(' · ')};});}
  function vista(tipo,SEM){return tipo==='PUA'?semanasPua(SEM):SEM;}
  function semanaActual(inicio){if(!inicio)return null;var hoy=new Date();hoy.setHours(0,0,0,0);var ini=new Date(inicio+'T00:00:00');return Math.floor((hoy-ini)/(7*864e5))+1;}
  function desdeEfectiva(desde,tipo,total){desde=Number(desde)||0;if(!desde)return 0;return tipo==='PUA'?Math.max(1,Math.round(desde*total/15)):desde;}
  return {semanasPua:semanasPua,vista:vista,semanaActual:semanaActual,desdeEfectiva:desdeEfectiva};
})();
