// STARGATE — La Nave del Recluta (web del alumnado por PER)
// recluta.html?per=<id>[&embed=1][&semana=N]  ·  sin ?per: selector de PER
// Identificación: el recluta escribe su correo UNA vez por dispositivo (localStorage); la nave pide al
// servidor SOLO su ficha (doPost accion=quien, sin PIN). El correo nunca va en la URL ni se lista en el API.
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), SEM=window.SG_SEMANAS||[], NOMBRES=window.SG_BADGE_NAMES||{},
      BADGES=window.SG_BADGES||[], PLAN=window.SG_PLANETAS||[], root=document.getElementById('nave-app'),
      CROMOS=window.SG_CROMOS||[], SERIES=window.SG_CROMO_SERIES||[], CARDV=window.SG_CARDV||'',
      SELLOS=window.SG_SERIES_ALBUM||[];
  if(!root) return;
  var q=new URLSearchParams(location.search); if(q.get('embed')==='1') document.body.classList.add('embed');
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  // NEBULA en vídeo (holograma vivo); si el navegador no puede, se queda su imagen
  function nebulaVideo(cls){return '<video class="nebula-v '+(cls||'')+'" autoplay muted loop playsinline preload="auto" poster="assets/img/personajes/nebula_poster.jpg"><source src="media/video/nebula_loop.mp4" type="video/mp4"></video>';}
  function cargando(txt,pista){return '<div class="cargando"><div class="txt">'+txt+'</div><div class="barra"><i></i></div>'+(pista?'<div class="pista">'+pista+'</div>':'')+'</div>';}
  function msgHtml(txt,perId){txt=String(txt==null?'':txt);
    txt=perId?txt.split('{id-del-PER}').join(perId):txt.split('?per={id-del-PER}').join('');
    return esc(txt).replace(/https?:\/\/[^\s<»)]+/g,function(u){return '<a href="'+u+'" target="_blank" rel="noopener">'+u+'</a>';});}
  function ytb(v,c){return '<div class="yt" data-id="'+v.id+'" role="button" tabindex="0"><img loading="lazy" src="https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg" alt=""><span class="play">▶</span><div class="cap"><b>'+esc(v.titulo)+'</b><em>'+esc(c)+'</em></div></div>';}
  function wireYt(el){Array.prototype.forEach.call(el.querySelectorAll('.yt'),function(y){y.onclick=function(){if(y.classList.contains('on'))return;var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+y.getAttribute('data-id')+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;y.insertBefore(f,y.firstChild);y.classList.add('on');};});}
  function minis(keys){return keys.map(function(k){return '<figure class="mini badge"><img loading="lazy" src="assets/img/insignias/'+k+'.png" alt="'+esc(NOMBRES[k]||k)+'"><figcaption>'+esc(NOMBRES[k]||k)+'</figcaption></figure>';}).join('');}

  // ---------- sin PER: selector ----------
  var per=q.get('per');
  if(!per){
    if(!API){root.innerHTML='<p class="lead">La nave aún no está conectada.</p>';return;}
    root.innerHTML=cargando('Contactando con NEBULA…','Localizando los PER activos');
    fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){
      var pers=d.pers||[];
      root.innerHTML='<div class="card"><h3>¿De qué PER eres recluta?</h3><p class="small muted">Elige tu grupo para entrar en tu nave. Si no lo sabes, pregunta a tu Capitán.</p>'
        +pers.map(function(p){return '<p><a class="btn" href="recluta.html?per='+encodeURIComponent(p.id)+'">🚀 '+esc(p.nombre)+' · '+esc(p.tipo)+'</a></p>';}).join('')+'</div>';
    }).catch(function(){root.innerHTML='<p class="lead">No se pudo cargar la lista de PERs.</p>';});
    return;
  }

  // ---------- estado ----------
  var KEY_MAIL='sgNaveEmail_'+per;
  var st={d:null,semanas:[],actual:1,estado:'curso',email:localStorage.getItem(KEY_MAIL)||'',yo:null,cargandoYo:false,msgYo:'',
          // la pestaña abierta sale del #hash: así un enlace a #retos abre esa, y F5 no te devuelve al principio
          tab:(location.hash||'').replace('#','')||'ficha'};

  function quien(email,cb){
    fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({accion:'quien',per:per,email:email})})
      .then(function(r){return r.json();}).then(cb)
      .catch(function(){cb({error:'red'});});
  }
  // Vestirse escribe, pero SIN PIN a propósito: el alumnado no va a recordar otra clave. El servidor
  // solo deja ponerse algo que ya se tiene desbloqueado, así que lo peor que puede pasar es que
  // alguien le cambie el disfraz a un compañero — cosmético y se deshace en un clic.
  function post(cuerpo,cb,err){
    fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(cuerpo)})
      .then(function(r){return r.json();})
      .then(function(d){ if(d&&d.error){ if(err)err(d.error); else alert(d.error); return; } cb(d); })
      .catch(function(e){ if(err)err('Error de red'); });
  }
  // Un cartel breve abajo del todo. No usa alert() a propósito: alert() BLOQUEA la página y hay que
  // pulsar «Aceptar» para seguir vistiéndose, que es peor que no avisar.
  function aviso(html, malo){
    var el=document.getElementById('nave-aviso');
    if(!el){el=document.createElement('div');el.id='nave-aviso';el.className='nave-aviso';document.body.appendChild(el);}
    el.className='nave-aviso'+(malo?' malo':'')+' ver';
    el.innerHTML=html;
    el.setAttribute('role','status');
    clearTimeout(aviso._t);
    aviso._t=setTimeout(function(){ el.classList.remove('ver'); }, malo?6000:3200);
  }
  // Vuelve a pedir la ficha SIN la pantalla de «Contactando con NEBULA…»: se usa cuando el alumno ya
  // ha visto el cambio y solo hay que poner al día lo que el servidor calcula (xp, créditos, rango).
  function refrescarYo(){
    if(!st.email) return;
    quien(st.email,function(d){
      if(!d||!d.yo) return;                     // si algo va mal, se queda lo que ya se veía: no se rompe nada
      st.yo=d.yo; st.pase=(d&&d.pase)||null; render();
    });
  }
  function identificar(email){
    email=String(email||'').toLowerCase().trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){st.msgYo='Eso no parece un correo. Prueba otra vez.';render();return;}
    st.cargandoYo=true;st.msgYo='';render();
    quien(email,function(d){
      st.cargandoYo=false;
      // 🔴 Esta línea va ANTES del if, y se queda aquí. Metida entre el if y el else if partía la
      // cadena, el fichero entero dejaba de compilar («Unexpected token 'else'») y la Nave se
      // quedaba EN BLANCO para todos los grupos. Visto en producción el 27-ago.
      st.pase=(d&&d.pase)||null;   // v3.27 · ¿hay pase de lista abierto ahora mismo?
      if(d&&d.yo){st.yo=d.yo;st.email=email;localStorage.setItem(KEY_MAIL,email);st.msgYo='';}
      else if(d&&d.yo===null){st.yo=null;st.msgYo='No encuentro a nadie con ese correo en este grupo. Tiene que ser el <b>mismo correo de Google</b> con el que rellenaste la Bitácora de mando. ¿Todavía no te has alistado? Ese es el primer paso — el botón de abajo.';}
      else{st.yo=null;st.msgYo='La identificación aún no está activa (el mando tiene que actualizar el sistema). El resto de la nave funciona; vuelve a intentarlo más adelante.';}
      render();
      if(st.yo) celebrar(st.yo);      // después de pintar: el cartel cae encima de su propia ficha
    });
  }
  function olvidar(){st.yo=null;st.email='';st.msgYo='';localStorage.removeItem(KEY_MAIL);render();}

  // ---------- secciones ----------
  // v3.14 · fecha bonita a partir de un ISO (2026-12-27 -> 27/12/2026)
  function fecha(iso){ if(!iso) return ''; var p=String(iso).split('-'); return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(iso); }
  // v3.14 · Hasta cuándo. El registro de misiones cierra al acabar la última semana y el canje
  // aguanta una semana más: el alumnado tiene que verlo sin preguntar.
  function plazos(){
    var d=st.d; if(!d||(!d.cierre_misiones&&!d.cierre_canje)) return '';
    return '<p class="small muted" style="margin-top:6px">🗓️ Registras misiones hasta el <b>'+fecha(d.cierre_misiones)+'</b>'
      +(d.cierre_canje&&d.cierre_canje!==d.cierre_misiones
        ? ' y te queda <b>una semana más</b> (hasta el <b>'+fecha(d.cierre_canje)+'</b>) para <b>canjear</b> lo que hayas ganado.'
        : '.')+'</p>';
  }
  function cabecera(){
    var d=st.d,n=st.semanas.length;
    var pos=st.estado==='antes'?'La misión aún no ha empezado':st.estado==='fin'?'Misión completada — la puerta está abierta':'Semana '+st.actual+' de '+n;
    return '<div class="tab-head"><div><div class="eyebrow teal">La Nave del Recluta · '+esc(d.nombre)+(d.tipo==='PUA'?' · PUA':'')+'</div><h3>'+pos+'</h3>'+plazos()+'</div>'
      +'<div class="small muted"><button class="btn small" id="btn-onboard" type="button">▶ Repetir bienvenida</button></div></div>';
  }
  function personaje(){
    if(st.cargandoYo) return '<div class="card">'+cargando('Contactando con NEBULA…','Buscándote en el registro de la tripulación')+'</div>';
    if(!st.yo){
      // 28-ago · Aqui faltaba la puerta de entrada: quien todavia NO se ha alistado escribia su
      // correo, no le encontraba, y se quedaba sin saber que hacer. El alistamiento es el paso 1 de
      // todo el sistema, asi que ahora esta a la vista y separado, no escondido en un parrafo.
      var alta = st.d && st.d.formBitacora;
      return '<div class="card nave-login"><div class="nave-perfil">'+nebulaVideo('nebula-mini')+''
        +'<div><h3>Identifícate, recluta</h3><p class="small muted">Escribe el correo con el que te alistaste en la Bitácora de mando. Solo lo pediré una vez en este dispositivo, y solo te enseño <b>tu</b> ficha.</p></div></div>'
        +'<div class="selrow"><input id="in-mail" type="email" placeholder="tu.correo@ejemplo.com" autocomplete="email"><button class="btn primary" id="btn-mail" type="button">Entrar en la nave</button></div>'
        +(st.msgYo?'<p class="small" style="margin-top:8px;color:var(--amber)">'+st.msgYo+'</p>':'')
        +(alta?'<div class="nave-alta"><span class="o">¿aún no te has alistado?</span>'
          +'<a class="btn primary" href="'+esc(st.d.formBitacora)+'" target="_blank" rel="noopener">📓 Alistarme en la Bitácora de mando →</a>'
          +'<p class="small muted">Es el <b>primer paso</b> y solo se hace una vez: eliges alias y personaje. '
          +'Hasta que no lo envíes no existes a bordo. Después vuelve aquí con <b>ese mismo correo</b>.</p></div>':'')
        +'</div>';
    }
    var r=st.yo, d=st.d, SG=window.SG||{};
    var av=SG.avatarImg?SG.avatarImg(r.avatar,r.alias,'grande'+(r.marco==='oro'?' marco-oro':''),r.xp,d.tipo):'';
    // NIVEL (xp, solo suben) y CRÉDITOS (lo único que se gasta)
    var ni=SG.nivelInfo?SG.nivelInfo(r.xp,d.tipo):{nivel:1,rango:1,rangoNombre:'Recluta',titulo:'',pct:0,faltan:0,siguiente:null,evo:null};
    var rg=ni.rango;
    var cred=(r.creditos!=null?r.creditos:(r.xp_disponibles!=null?r.xp_disponibles:0));
    var barra=ni.siguiente
      ?'<div class="progress" title="'+r.xp+' / '+ni.siguiente+' xp"><i style="width:'+ni.pct+'%"></i></div>'
        +'<p class="small muted">Te faltan <b>'+ni.faltan+'</b> xp para el <b>nivel '+(ni.nivel+1)+'</b>'
        +(ni.evo?' · tu personaje evoluciona a <b>'+esc(ni.evo.rango)+'</b> al llegar al nivel '+ni.evo.nivel:'')+'</p>'
      :'<p class="small muted">Nivel máximo: <b>'+esc(ni.titulo)+'</b>. Has hecho el viaje entero. 🫡</p>';
    var col=BADGES.map(function(kk){var tiene=(r.insignias||[]).indexOf(kk)>=0;
      return '<div class="b'+(tiene?'':' no')+'" title="'+esc(NOMBRES[kk]||kk)+(tiene?'':' · pendiente')+'"><img loading="lazy" src="assets/img/insignias/'+kk+'.png" alt=""><span>'+esc(NOMBRES[kk]||kk)+'</span></div>';}).join('');
    // fondo de ficha: su planeta elegido
    var PLK={}; PLAN.forEach(function(p){PLK[p[1]]=p[0];});
    var estiloFicha=r.fondo&&PLK[r.fondo]?' style="background-image:linear-gradient(rgba(10,16,26,.82),rgba(10,16,26,.9)),url(assets/img/planetas/'+PLK[r.fondo]+'.png);background-size:cover;background-position:center"':'';
    // álbum de cromos (catálogo inyectado por _build_site.py desde _site_data.CROMOS)
    var tengo=r.cromos||{}; var nCromos=CROMOS.filter(function(c){return tengo[c[0]];}).length;
    var repes=0; CROMOS.forEach(function(c){var n=tengo[c[0]]||0; if(n>1) repes+=n-1;});
    // los que quedan SIN cambiar los cuenta el servidor (descuenta los ya gastados): es el dato bueno
    var libres=r.repes_disponibles!=null?r.repes_disponibles:repes;
    function rarCls(rz){return rz==='LEGENDARIA'?' leg':rz==='épica'?' epi':rz==='rara'?' rar':'';}
    function celda(c){var nn=tengo[c[0]]||0;
      // la que ya tienes se abre en grande (la carta lleva texto: hay que poder LEERLA)
      return '<div class="c'+(nn?'':' no')+rarCls(c[3])+'"'+(nn?' data-c="'+c[0]+'" role="button" tabindex="0"':'')
        +' title="'+esc(c[1])+' · '+c[3]+(nn?' · x'+nn+' — pulsa para verla en grande':' · aún no ha salido')+'">'
        +'<img loading="lazy" src="assets/img/tarjetas/'+c[0]+'_carta.png'+CARDV+'" alt="'+(nn?esc(c[1]):'')+'">'
        +(nn>1?'<span class="nx">x'+nn+'</span>':'')+'</div>';}
    var NOMSELLO={}; SELLOS.forEach(function(x){NOMSELLO[x[1]]=x[2];});
    var series=SERIES.map(function(sr){
      var cs=CROMOS.filter(function(c){return c[2]===sr[0];});
      var ten=cs.filter(function(c){return tengo[c[0]];}).length;
      var llena=ten===cs.length&&cs.length>0;
      return '<div class="serie'+(llena?' completa':'')+'"><h4>'+esc(sr[1])+' <span class="cnt'+(llena?' full':'')+'">'+ten+'/'+cs.length+'</span>'
        +(llena?'<span class="sello-serie" title="'+esc(NOMSELLO[sr[1]]||'Serie completa')+'">✦ serie completa</span>':'')+'</h4>'
        +'<p class="small muted">'+esc(sr[2])+'</p>'
        +'<div class="album">'+cs.map(celda).join('')+'</div></div>';}).join('');
    var album=CROMOS.length?('<div class="card album-cromos"><h3>🃏 Tu álbum de cromos · '+nCromos+' / '+CROMOS.length+'</h3>'
      +'<p class="small muted">Cada «Sobre de cromos» (15 ◈) trae una carta al azar. Los ocho tripulantes son <b>comunes</b>; '
      +'los Ecos, NEBULA y el Capitán, <b>raros</b>; el Recluta y la Estática, <b>épicos</b>; y hay dos '
      +'<b>LEGENDARIOS</b>: el General Vaeon (2 de cada 100 sobres) y <b>Ander Vaeon</b>, la carta que revela '
      +'quién era antes de ser Vaeon — <b>1 de cada 100</b>, la más difícil de toda la galaxia.'
      +'</p>'
      +(repes?'<p class="repes'+(libres>=3?' listo':'')+'">🔁 Llevas <b>'+repes+'</b> repetido'+(repes===1?'':'s')
        +(libres>=3?' — y con 3 te llevas un sobre <b>gratis</b>. Puedes cambiar '+Math.floor(libres/3)+' vez'+(Math.floor(libres/3)===1?'':'es')+'.'
                   :(libres?' ('+libres+' sin cambiar): con 3 te llevas un sobre gratis.':' — ya los has cambiado todos por sobres.'))
        +(libres>=3&&d.formCanje?' <a class="btn small" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">Cambiar 3 repetidos →</a>':'')+'</p>':'')
      +series+'</div>'):'';
    // 29-ago · el personaje se abre en grande al pulsarlo. Es la imagen que el recluta ha elegido y
    // la que evoluciona con su nivel: verla del tamaño de un pulgar era desaprovecharla. Reusa la
    // misma lupa que las cartas, así que ya trae fondo, Escape, foco y botón de cerrar.
    return '<div class="grid cols-2 nave-estado"><div class="card"'+estiloFicha+'><div class="nave-perfil">'
      +'<button type="button" class="av-lupa" id="btn-av" title="Pulsa para verte en grande" aria-label="Ampliar tu personaje">'+av+'</button>'
      +'<div><h3>'+(r.corona?'👑 ':'')+esc(r.alias)+(r.racha>=3?' <span class="chip-racha" title="Semanas seguidas registrando algo">🔥 '+r.racha+'</span>':'')+'</h3>'
      +(r.titulo?'<div class="titulo-recluta">«'+esc(r.titulo)+'»</div>':'')
      +'<p class="small"><b>Nivel '+ni.nivel+' · '+esc(ni.rangoNombre)+'</b>'+(ni.titulo&&ni.titulo!==ni.rangoNombre?' <span class="muted">('+esc(ni.titulo)+')</span>':'')+' · puesto '+r.pos+' · planeta '+esc(r.planeta)+(r.corona?' · <b>corona semanal</b>':'')+'</p>'
      +'<p class="monedas"><span class="m xp" title="Los xp no se gastan nunca: marcan tu nivel y hacen evolucionar a tu personaje."><b>'+r.xp+'</b> xp</span>'
      +'<span class="m cred" title="Los créditos son la moneda de misión: es lo único que se descuenta al canjear recompensas."><b>'+cred+'</b> ◈ créditos</span></p>'
      +'<p class="small muted">Los <b>xp</b> solo suben: son tu nivel. Los <b>créditos ◈</b> son lo que gastas.</p></div></div>'+barra
      +(r.bio?'<blockquote class="nave-bio">'+esc(r.bio)+'</blockquote>':'<p class="small muted">Sin biografía todavía: añádela editando tu <a href="'+esc(d.formBitacora||'#')+'" target="_blank" rel="noopener">Bitácora de mando</a>.</p>')
      +'<p class="small" style="margin-top:10px"><button class="btn small" id="btn-olvidar" type="button">No soy yo / salir</button></p></div>'
      +'<div class="card"><h3>Tu colección · '+(r.insignias||[]).length+' / '+BADGES.length+'</h3><div class="badge-col">'+col+'</div></div></div>'+album;
  }
  // v3.16 · EL VESTUARIO. Las cinco versiones de arte del personaje ya no se imponen al subir de
  // nivel: se desbloquean y se ELIGEN. Y encima están los héroes, que salen al azar y se acumulan.
  // Los que no tienes salen en SOMBRA: querer algo que no sabes cómo es tira más que verlo.
  function vestuario(){
    var d=st.d, yo=st.yo; if(!yo) return '';
    var HER=window.SG_HEROES||[], RANGOS=(window.SG&&window.SG.RANGOS)||[];
    var mios={}; (yo.heroes||[]).forEach(function(k){mios[k]=true;});
    var skins=yo.skins||[1], puesto=yo.viste||'';
    var av=yo.avatar||{};
    function celda(clave,img,tit,sub,on,libre){
      return '<button type="button" class="vest'+(on?' on':'')+(libre?'':' no')+'" data-viste="'+esc(clave)+'"'
        +(libre?'':' disabled')+' title="'+esc(libre?tit:'Todavía no lo tienes')+'">'
        +'<img loading="lazy" src="'+esc(img)+'" alt="">'
        +'<b>'+esc(libre?tit:'???')+'</b><em>'+esc(sub)+'</em></button>';
    }
    var sk=[1,2,3,4,5].map(function(r){
      var libre=skins.indexOf(r)>=0;
      var img='assets/img/avatares/evo/p'+(av.n||1)+(av.v||'f')+'_r'+r+'.jpg';
      var nivel=[1,1,3,5,8,10][r];
      return celda('skin:'+r, img, RANGOS[r-1]||('Skin '+r),
        libre?'desbloqueada':'nivel '+nivel, puesto==='skin:'+r||(!puesto&&av.skin===r), libre);
    }).join('');
    var he=HER.map(function(h){
      var tengo=!!mios[h[0]];
      return celda('heroe:'+h[0], 'assets/img/heroes/'+h[0]+(tengo?'':'_bloqueado')+'.jpg',
        h[1], tengo?h[3]:'sin descubrir', puesto==='heroe:'+h[0], tengo);
    }).join('');
    var n=(yo.heroes||[]).length;
    return '<section id="vestuario"><div class="eyebrow amber">Tu vestuario</div>'
      +'<h2>Ponte lo que quieras</h2>'
      +'<p class="lead">Las <b>skins</b> de tu personaje se desbloquean al subir de nivel, y los '
      +'<b>héroes</b> salen al azar al canjear «Héroe de la Rebelión». Todo lo que tengas te lo pones '
      +'y te lo quitas cuando quieras, <b>gratis</b>.</p>'
      +'<h3 style="margin-top:1em">Tus skins <span class="small muted">'+skins.length+' de 5</span></h3>'
      +'<div class="vest-grid">'+sk+'</div>'
      +'<h3 style="margin-top:1.4em">Héroes de la Rebelión <span class="small muted">'+n+' de '+HER.length+'</span></h3>'
      +'<div class="vest-grid">'+he+'</div>'
      +(d.formCanje?'<p style="margin-top:12px"><a class="btn small primary" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎭 Conseguir un héroe →</a></p>':'')
      +'</section>';
  }

  // v3.27 · EL PASE DE LISTA. Solo se ve mientras el docente tiene la ventana abierta. La consigna
  // NO llega hasta aqui: la tiene en su pantalla, y por eso hay que estar en la clase.
  function avisoPase(){
    var p=st.pase;
    if(!p||!p.abierto||!st.yo) return '';
    if(p.cobrado) return '<div class="pase-nave hecho">✅ <b>Pase de lista registrado.</b> Nos vemos en la próxima.</div>';
    return '<div class="pase-nave"><b>🎓 Pase de lista abierto</b>'
      +'<span class="small">Escribe la consigna de cuatro letras que hay en la pantalla de tu profe y te llevas '+(p.creditos||0)+' ◈.</span>'
      +'<div class="pase-fila"><input id="pase-in" maxlength="4" autocomplete="off" spellcheck="false" placeholder="ABCD">'
      +'<button class="btn primary" id="pase-ok" type="button">Estoy en clase</button></div>'
      +'<div class="small muted" id="pase-msg"></div></div>';
  }
  // v3.28 · El Genially del alumno es el de SU docente si lo tiene; si no, el del grupo. Algunos
  // docentes retocan el panel para sus alumnos y ese es el que tienen que ver.
  function miPanel(){
    var d=st.d||{}, p=(st.yo&&st.yo.profe)||'';
    return (p && d.paneles && d.paneles[p]) || d.panel || '';
  }
  // ================= LA VENTANA EMBEBIDA (29-ago) =================
  // «Si evitamos abrir pestañas en el navegador, se agradecerá». Los formularios de Google y los
  // Genially se embeben bien, así que la Nave los abre en una ventana encima de sí misma: el alumno
  // registra su reto y sigue donde estaba, sin perder la página ni multiplicar pestañas.
  //
  // 🔴 El «abrir aparte ↗» de la esquina NO es decoración: con las cookies de terceros bloqueadas
  // (Safari, o Chrome en incógnito) Google puede negarse a identificar al alumno DENTRO del iframe,
  // y la Bitácora necesita su cuenta. Si el formulario se queja dentro de la ventana, esa es la salida.
  function formEmbed(u){
    u=String(u||'');
    // los formularios publicados de Google aceptan ?embedded=true: quita su propia cabecera
    if(/docs\.google\.com\/forms|forms\.gle/.test(u) && u.indexOf('embedded=')<0)
      u+=(u.indexOf('?')<0?'?':'&')+'embedded=true';
    return u;
  }
  function ventana(titulo, url){
    var ov=document.getElementById('nave-ventana');
    if(!ov){ov=document.createElement('div');ov.id='nave-ventana';ov.className='vent';document.body.appendChild(ov);}
    ov.innerHTML='<div class="vent-fondo"></div><div class="vent-caja" role="dialog" aria-modal="true" aria-label="'+esc(titulo)+'">'
      +'<header><b>'+esc(titulo)+'</b>'
      +'<a class="vent-aparte" href="'+esc(url)+'" target="_blank" rel="noopener" title="Si aquí dentro no te deja entrar con tu cuenta, ábrelo aparte">abrir aparte ↗</a>'
      +'<button type="button" class="vent-x" aria-label="Cerrar">×</button></header>'
      +'<div class="vent-cuerpo"><div class="vent-carga">Cargando…</div>'
      +'<iframe src="'+esc(formEmbed(url))+'" loading="eager" allow="fullscreen" referrerpolicy="no-referrer-when-downgrade"></iframe></div></div>';
    ov.classList.add('open');
    document.body.classList.add('vent-abierta');
    var f=ov.querySelector('iframe'); f.addEventListener('load',function(){var c=ov.querySelector('.vent-carga'); if(c)c.remove();});
    function cerrar(){ov.classList.remove('open');ov.innerHTML='';document.body.classList.remove('vent-abierta');
      document.removeEventListener('keydown',esc27);}
    function esc27(e){if(e.key==='Escape'){e.preventDefault();cerrar();}}
    ov.querySelector('.vent-fondo').onclick=cerrar;
    ov.querySelector('.vent-x').onclick=cerrar;
    document.addEventListener('keydown',esc27);
    ov.querySelector('.vent-x').focus();
    return false;
  }
  // Cablea como ventana todo enlace marcado con data-vent (los formularios y el Genially).
  function wireVentanas(caja){
    Array.prototype.forEach.call(caja.querySelectorAll('[data-vent]'),function(a){
      a.onclick=function(e){ e.preventDefault(); ventana(a.getAttribute('data-vent'), a.getAttribute('href')); };
    });
  }
  // ================= PESTAÑAS (29-ago) =================
  // «La página del recluta crece mucho hacia abajo». Y crecía: ficha + vestuario + semana + mapa +
  // recompensas + retos + tablero, todo del tirón. Se valoró partirla en varias páginas y se
  // descartó: la Nave es la ÚNICA dirección que se le da al alumnado, y multiplicarla es multiplicar
  // los sitios donde perderse (y los enlaces que se pueden colar). Pestañas: una sola URL, los datos
  // se piden UNA vez y cambiar de pestaña es instantáneo. El #hash las hace enlazables y compartibles.
  var TABS=[['ficha','🧑‍🚀','Mi ficha'],['retos','🎯','Mis retos'],['semana','🛰️','Esta semana'],
            ['planetas','🪐','Los planetas'],['premios','🎁','Recompensas'],['tablero','🏆','El tablero']];
  function tabValida(k){ return TABS.some(function(x){return x[0]===k;}) ? k : 'ficha'; }
  st.tab=tabValida(st.tab);
  // el botón «atrás» del navegador también cambia de pestaña: es lo que espera cualquiera
  window.addEventListener('hashchange',function(){ irA((location.hash||'').replace('#',''), false); });
  function pestanas(){
    return '<nav class="nave-tabs" role="tablist">'+TABS.map(function(x){
      return '<button type="button" class="nave-tab'+(st.tab===x[0]?' on':'')+'" role="tab"'
        +' aria-selected="'+(st.tab===x[0])+'" data-tab="'+x[0]+'">'
        +'<span class="ic" aria-hidden="true">'+x[1]+'</span><b>'+x[2]+'</b></button>';
    }).join('')+'</nav>';
  }
  function contenido(){
    if(st.tab==='ficha')    return personaje()+vestuario();
    if(st.tab==='retos')    return retos();
    if(st.tab==='semana')   return estaSemana();
    if(st.tab==='planetas') return mapa();
    if(st.tab==='premios')  return recompensas();
    return '';                                  // «tablero»: vive en su propia sección del HTML
  }
  // El tablero es una <section> aparte del HTML (la pinta tablero.js), así que se enseña y se esconde
  // en vez de repintarse: repintarlo obligaría a pedir los datos otra vez cada vez que se cambia de pestaña.
  function verTablero(si){
    var sec=document.getElementById('nave-ranking');
    if(sec) sec.style.display = si ? '' : 'none';
  }
  function irA(k, empujarHash){
    st.tab=tabValida(k);
    if(empujarHash!==false){ try{ history.replaceState(null,'','#'+st.tab); }catch(e){} }
    render();
    var barra=root.querySelector('.nave-tabs');
    if(barra) barra.scrollIntoView({block:'start', behavior:'smooth'});
  }
  function accesos(){
    var d=st.d;
    // v3.37 · los formularios y el Genially se abren EMBEBIDOS en una ventana encima de la Nave
    // (data-vent), no en otra pestaña. Y el tablero es una pestaña de la propia página: registro.html
    // era la web del profesorado y aquí no pinta nada.
    return avisoPase()+'<div class="nave-barra"><div class="nave-accesos">'
      +(d.formBitacora?'<a class="acc primary" href="'+esc(d.formBitacora)+'" data-vent="📓 Bitácora de mando"><b>📓 Mi Bitácora de mando</b><em>marca lo que has completado</em></a>':'')
      +(d.formCanje?'<a class="acc" href="'+esc(d.formCanje)+'" data-vent="🎁 Canje de recompensas"><b>🎁 Canjear</b><em>gasta tus ◈ créditos</em></a>':'')
      +'<a class="acc" href="#tablero" data-ir="tablero"><b>🏆 Tablero</b><em>cómo va tu grupo</em></a>'
      +(d.formTicket?'<a class="acc" href="'+esc(d.formTicket)+'" data-vent="🎟️ Contacta con NEBULA"><b>🎟️ Dudas</b><em>anónimo, a NEBULA</em></a>':'')
      +(miPanel()?'<a class="acc" href="'+esc(miPanel())+'" data-vent="🪐 Panel de control"><b>🪐 Panel</b><em>los ocho planetas</em></a>':'')
      +'</div></div>';
  }
  // ================= LOS RETOS, EXPLICADOS (29-ago) =================
  // 🔴 El formulario llevaba semanas prometiendo «está todo explicado en tu Nave» y era MENTIRA: la
  // Nave solo listaba los nombres de los retos dentro del detalle de cada planeta. Quien no entendía
  // un reto no tenía dónde mirar, y eso acaba en un correo al profesorado o en un mensaje al foro.
  //
  // Se desbloquean con el CALENDARIO, igual que los planetas: enseñar de golpe los 19 retos del curso
  // en la semana 1 es justo lo que agobia. Se ve lo de hoy y lo de antes, no lo de dentro de un mes.
  function retos(){
    var RET=(window.SG_RETOS||{})[(st.d&&st.d.tipo)||'REGULAR']||[];
    var AY=window.SG_AYUDA_RETOS||{};
    if(!RET.length) return '<section><div class="eyebrow">Tus retos</div><h2>Qué hay que hacer</h2>'
      +'<p class="lead">El catálogo de retos todavía no ha llegado a esta página.</p></section>';
    var mios={}; ((st.yo&&st.yo.retos)||[]).forEach(function(k){mios[k]=true;});
    var abiertos=0, hechos=0, bloques='';
    PLAN.forEach(function(p,i){
      var t=i+1;
      var sems=st.semanas.filter(function(s){return s.tema_n===t;});
      var abre=sems.length?sems[0].sem:99;
      var abierto=st.actual>=abre&&st.estado!=='antes';
      var suyos=RET.filter(function(r){return r[4]===t;});
      if(!suyos.length) return;
      if(!abierto){
        bloques+='<details class="reto-pl lock"><summary><span class="pl-n">Planeta '+t+'</span>'
          +'<b>???</b><em>🔇 Se abre en la semana '+abre+'</em></summary>'
          +'<p class="small muted">Todavía no. La nave llega a este planeta en la semana '+abre+'.</p></details>';
        return;
      }
      abiertos+=suyos.length;
      var hechosAqui=suyos.filter(function(r){return mios[r[0]];}).length;
      hechos+=hechosAqui;
      var fichas=suyos.map(function(r){
        var ya=!!mios[r[0]];
        var texto=AY[r[0]]||'';
        return '<article class="reto'+(ya?' ok':'')+'">'
          +'<header><span class="reto-id">'+esc(r[0])+'</span><h4>'+esc(r[1])+'</h4>'
          +'<span class="reto-xp">'+r[3]+' xp</span>'
          +(ya?'<span class="reto-ya">✅ ya lo tienes</span>':'')+'</header>'
          +(texto?'<p>'+esc(texto)+'</p>':'<p class="small muted">Sin descripción todavía: pregunta a tu docente.</p>')
          +(ya?'':'<p class="small muted">Cuando lo termines, márcalo en tu Bitácora de mando y pega ahí el enlace de lo que has hecho.</p>')
          +'</article>';
      }).join('');
      var actual=sems.some(function(s){return s.sem===st.actual;});
      bloques+='<details class="reto-pl'+(actual?' actual':'')+'"'+(actual?' open':'')+'>'
        +'<summary><span class="pl-n">Planeta '+t+'</span><b>'+esc(p[1])+'</b>'
        +'<em>'+esc(p[2])+'</em><span class="reto-cuenta">'+hechosAqui+'/'+suyos.length+'</span></summary>'
        +fichas+'</details>';
    });
    var finales=RET.filter(function(r){return r[4]>8;});
    if(finales.length){
      var abiertoFin=st.estado==='fin'||st.actual>=(st.semanas.length?st.semanas[st.semanas.length-1].sem:99);
      bloques+='<details class="reto-pl'+(abiertoFin?'':' lock')+'"><summary><span class="pl-n">Final</span>'
        +'<b>'+(abiertoFin?'La batalla final':'???')+'</b><em>'+(abiertoFin?'el examen':'🔇 al terminar el viaje')+'</em></summary>'
        +(abiertoFin?finales.map(function(r){
            return '<article class="reto'+(mios[r[0]]?' ok':'')+'"><header><span class="reto-id">'+esc(r[0])+'</span>'
              +'<h4>'+esc(r[1])+'</h4><span class="reto-xp">'+r[3]+' xp</span>'
              +(mios[r[0]]?'<span class="reto-ya">✅ ya lo tienes</span>':'')+'</header>'
              +'<p>'+esc(AY[r[0]]||'Se abre al final del viaje.')+'</p></article>';
          }).join('')
        :'<p class="small muted">Se desbloquea al final del viaje.</p>')+'</details>';
    }
    return '<section><div class="eyebrow">Tus retos</div><h2>Qué hay que hacer, explicado</h2>'
      +'<p class="lead">Llevas <b>'+hechos+' de '+abiertos+'</b> retos de los que ya están abiertos. '
      +'Los planetas se desbloquean con el calendario: aquí solo ves lo que ya puedes hacer, para no agobiarte con lo que aún no toca. '
      +'Pulsa un planeta para desplegar sus retos.'
      +(st.d.formBitacora?' Cuando termines uno, márcalo en tu <a href="'+esc(st.d.formBitacora)+'" data-vent="📓 Bitácora de mando"><b>Bitácora de mando</b></a>.':'')
      +'</p>'+bloques+'</section>';
  }
  function mapa(){
    var tiles=PLAN.map(function(p,i){
      var t=i+1; var sems=st.semanas.filter(function(s){return s.tema_n===t;});
      var abre=sems.length?sems[0].sem:99; var abierto=st.actual>=abre&&st.estado!=='antes';
      var actual=sems.some(function(s){return s.sem===st.actual;});
      var V=window.SG_IMGV||'';
      if(!abierto) return '<div class="nave-pl lock"><img src="assets/img/planetas/'+p[0]+'.png'+V+'" alt=""><b>???</b><em>🔇 Señal bloqueada · semana '+abre+'</em></div>';
      return '<div class="nave-pl on'+(actual?' actual':'')+'" data-tema="'+t+'" role="button" tabindex="0"><img src="assets/img/planetas/'+p[0]+'.png'+V+'" alt="'+esc(p[1])+'"><b>'+esc(p[1])+'</b><em>'+esc(p[2])+'</em></div>';
    }).join('');
    return '<section><div class="eyebrow">El viaje</div><h2>Los ocho planetas</h2>'
      +'<p class="lead">Cada semana la nave avanza sola: los planetas se van desbloqueando con el calendario. Pulsa uno visitado para volver a ver sus órdenes, vídeos y retos.'+(st.d.panel?' Las presentaciones de cada planeta están en el <a href="'+esc(st.d.panel)+'" target="_blank" rel="noopener"><b>panel de control</b></a>.':'')+'</p>'
      +'<div class="nave-mapa">'+tiles+'</div><div id="nave-detalle"></div></section>';
  }
  function fichaSemana(s,titulo){
    return '<div class="foro-card">'+(s.capitulo?'<span class="pill amber">Nuevo capítulo: '+esc(s.capitulo)+'</span>':'')
      +'<h2>'+esc(titulo||('Semana '+s.sem+' · '+s.tema))+'</h2><div class="muted">'+esc(s.sub)+'</div>'
      +'<pre class="foro-msg">'+msgHtml(s.foro,per)+'</pre>'
      +(s.lanza.length?'<h4>🗝️ Retos</h4><ul>'+s.lanza.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')
      +(s.insignias.length?'<h4>🏅 Insignias en juego</h4><div class="minis">'+minis(s.insignias)+'</div>':'')
      +(s.videos.length?'<h4>🎬 Vídeos</h4><div class="yt-list three">'+s.videos.map(function(v){return ytb(v[0],v[1]);}).join('')+'</div>':'')
      +'</div>';
  }
  function estaSemana(){
    if(st.estado==='antes') return '<section><div class="eyebrow amber">Esta semana</div><h2>En la rampa de lanzamiento</h2><p class="lead">La misión empieza el '+esc(st.d.inicio)+'. Mientras tanto: preséntate ante el mando y registra tu alias en la <a href="'+esc(st.d.formBitacora||'#')+'" target="_blank" rel="noopener">Bitácora de mando</a>.</p></section>';
    var idx=Math.min(Math.max(st.actual,1),st.semanas.length)-1; var s=st.semanas[idx];
    var tit=st.estado==='fin'?'Última orden — Semana '+s.sem+' · '+s.tema:'Semana '+s.sem+' · '+s.tema;
    return '<section><div class="eyebrow amber">La orden de la semana</div><h2>Esta semana en la nave</h2>'+fichaSemana(s,tit)+'</section>';
  }
  function recompensas(){
    var d=st.d; var cat=d.recompensas||[]; var n=st.semanas.length; var r=st.yo;
    if(!cat.length) return '<section><div class="eyebrow violet">Recompensas</div><h2>El canje de xp</h2><p class="lead">Tus xp se pueden canjear por recompensas. El catálogo se abrirá pronto en la nave; mientras tanto, tu Capitán tiene la lista.</p>'
      +(d.formCanje?'<a class="btn" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Ir al formulario de canje</a>':'')+'</section>';
    var abiertas=0;
    var cards=cat.map(function(x){
      var desde=window.SGCAL.desdeEfectiva(x.desde||14,d.tipo,n); var abierta=st.estado!=='antes'&&st.actual>=desde;
      if(!abierta) return '<div class="card rec-card lock"><h3>🔒 Recompensa clasificada</h3><p class="small muted">Se desbloquea en la semana '+desde+'.</p></div>';
      abiertas++;
      var mis=r?(r.creditos!=null?r.creditos:(r.xp_disponibles||0)):0;
      // el catálogo limita cuántas veces puede concederse cada recompensa: si ya llegó al tope,
      // se avisa aquí para que ni lo intente (el script también lo deniega sin cobrar).
      var veces=(r&&r.canjeados?r.canjeados[x.nombre]:0)||0;
      var repetible=!x.max||x.max>=99, tope=!repetible&&veces>=x.max;
      var afford=!r?'':tope?'<span class="chip done">Ya la tienes'+(x.max>1?' ('+veces+'/'+x.max+')':'')+'</span>'
        :(mis>=x.coste?'<span class="chip ok">Te lo puedes permitir</span>':'<span class="chip wip">Te faltan '+(x.coste-mis)+' ◈</span>')
        +(veces?' <span class="chip">canjeada '+veces+(repetible?' vece'+(veces===1?'z':'s'):' de '+x.max)+'</span>':'');
      var aviso=x.tipo==='nota'?'<p class="small muted">⏳ Se hace efectiva al terminar las clases en directo.</p>':x.tipo==='avatar'||x.tipo==='avatar_url'?'<p class="small muted">⚡ Automática: si se concede, tu avatar cambia solo.</p>':'';
      return '<div class="card rec-card'+(tope?' agotada':'')+'"><h3>'+esc(x.nombre)+'</h3><p class="pts">'+x.coste+' ◈</p><p class="small">'+esc(x.desc||'')+'</p>'+aviso+afford+'</div>';
    }).join('');
    return '<section><div class="eyebrow violet">Recompensas</div><h2>El canje de xp</h2>'
      +'<p class="lead">Tus <b>xp</b> no se gastan nunca: marcan tu nivel y hacen evolucionar a tu personaje. Lo que se canjea son los <b>créditos ◈</b>, que ganas con el mismo trabajo. Las recompensas se van desbloqueando con el viaje.</p>'
      +(d.cierre_canje&&d.cierre_canje!==d.cierre_misiones
        ? '<p class="small" style="color:var(--amber)"><b>Ojo al calendario:</b> las misiones se registran hasta el <b>'+fecha(d.cierre_misiones)+'</b>, pero el canje sigue abierto <b>una semana más</b>, hasta el <b>'+fecha(d.cierre_canje)+'</b>. Esa última semana ya no se gana nada: solo se gasta lo ganado.</p>'
        : (d.cierre_canje?'<p class="small muted">El canje cierra el <b>'+fecha(d.cierre_canje)+'</b>.</p>':''))
      +'<div class="grid cols-3 nave-rec">'+cards+'</div>'
      +(abiertas&&d.formCanje?'<p style="margin-top:14px"><a class="btn primary" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Canjear una recompensa</a></p>':'<p class="small muted" style="margin-top:14px">Aún no hay recompensas canjeables: sigue sumando xp.</p>')
      +'</section>';
  }

  // ---------- onboarding NEBULA ----------
  var PASOS=[
    {t:'Canal abierto, recluta',x:'Soy <b>NEBULA</b>, la inteligencia de esta nave. La galaxia se apaga por <b>la Estática</b> — un silencio que hace que nadie cree, registre ni comparta. Cruzarás <b>ocho planetas</b> (los ocho temas del curso) para reencenderla. Esta es tu nave.'},
    {t:'Tu arma: la Bitácora',x:'Contra la Estática no sirven las armas: sirve <b>dejar constancia</b>. Tu <b>Bitácora Estelar</b> es tu ePortfolio: cada evidencia que registres la hace más fuerte. Cuando esté completa, la puerta a la Tierra se abrirá.'},
    {t:'Alístate',x:'Tu primer acto: la <b>Bitácora de mando</b>. Elige tu <b>alias</b>, tu <b>avatar</b> (¡evoluciona con tus xp!) y escribe la <b>biografía</b> de tu personaje. Ganarás la insignia de <b>Reclutamiento</b>. Cada vez que superes un reto, vuelve, marca la casilla y envía.'},
    {t:'Tu personaje, al mando',x:'Escribe tu <b>correo</b> una sola vez en este dispositivo y la nave te reconocerá: verás tu personaje con su <b>rango</b>, tu biografía, tus xp y tu colección de insignias nada más entrar.'},
    {t:'La nave avanza sola',x:'Cada semana se desbloquea una nueva orden: el planeta, sus vídeos, sus <b>dos retos</b> y sus insignias. Los planetas futuros están en silencio… de momento. Vuelve cada semana.'},
    {t:'Dos marcadores, no uno',x:'Ojo a esto: los <b>xp</b> miden tu viaje y <b>nunca bajan</b> — suben tu <b>nivel</b> (del 1 al 10) y hacen <b>evolucionar a tu personaje</b>. Los <b>créditos ◈</b> los ganas con el mismo trabajo y son lo <b>único que se gasta</b> en la sección de <b>recompensas</b>. Comprar cromos no te baja de nivel. Y si te pierdes, usa el ticket <b>«Contacta con NEBULA»</b>: te leo, aunque sea anónimo. Corto y cierro.'}
  ];
  function onboarding(i){
    var ov=document.getElementById('nave-onboard');
    if(!ov){ov=document.createElement('div');ov.id='nave-onboard';ov.className='tour open';document.body.appendChild(ov);}
    if(i>=PASOS.length){ov.classList.remove('open');ov.innerHTML='';localStorage.setItem('sgNaveOnboard_'+per,'1');return;}
    var s=PASOS[i];
    ov.innerHTML='<div class="tour-box">'+nebulaVideo('tour-cap nebula')
      +'<div class="tour-panel"><div class="tour-step">NEBULA · '+(i+1)+' / '+PASOS.length+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p>'
      +'<div class="tour-btns"><button type="button" class="tour-prev"'+(i===0?' disabled':'')+'>← Anterior</button>'
      +'<button type="button" class="tour-next primary">'+(i===PASOS.length-1?'A la nave ✓':'Siguiente →')+'</button>'
      +'<button type="button" class="tour-exit">Salir</button></div></div></div>';
    ov.querySelector('.tour-prev').onclick=function(){onboarding(i-1);};
    ov.querySelector('.tour-next').onclick=function(){onboarding(i+1);};
    ov.querySelector('.tour-exit').onclick=function(){onboarding(PASOS.length);};
  }

  // ---------- ¡ENHORABUENA! ----------
  // v3.19 · El premio se ganaba en un formulario y se contaba por correo, minutos despues. El momento
  // de ganar y el momento de enterarte estaban en sitios distintos, y por eso «gano algo y no me
  // entero». Ahora lo cuenta la Nave, que es donde esta el arte: al entrar compara lo que tienes con
  // lo que tenias la ultima vez que miraste.
  //
  // 🔴 La PRIMERA vez no se celebra nada: si no, un recluta que entra por primera vez recibiria una
  // fanfarria por todo lo que ya tiene. Se guarda la foto en silencio y a partir de ahi se compara.
  var KEY_VISTO='sgNaveVisto_'+per;
  var MAX_CARTELES=4;                      // mas que esto es un muro de clics, no una celebracion
  function foto(r){
    return { email:st.email, cromos:Object.assign({},r.cromos||{}), heroes:(r.heroes||[]).slice(),
             skins:(r.skins||[]).slice(), insignias:(r.insignias||[]).slice(), bonus:(r.bonus||[]).slice(),
             nivel:r.nivel||1, n_album:r.n_album||0, titulo:r.titulo||'', marco:r.marco||'', fondo:r.fondo||'' };
  }
  function guardarFoto(r){ try{localStorage.setItem(KEY_VISTO,JSON.stringify(foto(r)));}catch(e){} }
  function fotoAnterior(){
    try{ var f=JSON.parse(localStorage.getItem(KEY_VISTO)||'null');
         return (f && f.email===st.email) ? f : null; }catch(e){ return null; }
  }
  // peso = orden de aparicion. Se ordena de MENOS a MAS: lo ultimo que ves es lo mejor que te ha pasado.
  var PESO={racha:10,tutorial:12,planeta:20,skin:30,insignia:40,serie:45,titulo:48,marco:49,fondo:47,
            comun:50,rara:55,heroe:60,epica:70,nivel:80,legendaria:99};
  function logrosNuevos(r,ant){
    var L=[], NOM=window.SG_BADGE_NAMES||{};
    var CR={}; (window.SG_CROMOS||[]).forEach(function(c){CR[c[0]]=c;});
    var HE={}; (window.SG_HEROES||[]).forEach(function(h){HE[h[0]]=h;});
    // cartas nuevas (o repetidas: tambien es abrir un sobre)
    Object.keys(r.cromos||{}).forEach(function(k){
      var n=(r.cromos[k]||0), antes=(ant.cromos&&ant.cromos[k])||0;
      if(n<=antes||!CR[k]) return;
      var c=CR[k], rz=String(c[3]||'').toLowerCase();
      L.push({peso:PESO[rz==='legendaria'?'legendaria':rz==='épica'?'epica':rz==='rara'?'rara':'comun'],
        eyebrow:antes?'CARTA REPETIDA':'CARTA NUEVA', titulo:c[1],
        sub:c[3]+(c[2]?' · '+c[2]:'')+(antes?' · ya la tenías, ahora llevas '+n:''),
        img:'assets/img/tarjetas/'+k+'_carta.png'+CARDV, clase:'carta '+(rz==='legendaria'?'leg':rz==='épica'?'epi':rz==='rara'?'rar':'')});
    });
    (r.heroes||[]).forEach(function(k){
      if((ant.heroes||[]).indexOf(k)>=0||!HE[k]) return;
      // SG_HEROES va [clave, nombre, peso, rareza]: la rareza es el 3, no el 2 (el 2 es el peso del sorteo)
      L.push({peso:PESO.heroe, eyebrow:'HÉROE DE LA REBELIÓN', titulo:HE[k][1], sub:HE[k][3]||'',
        img:'assets/img/heroes/'+k+'.jpg', clase:'figura'});
    });
    if((r.nivel||1)>(ant.nivel||1)){
      var SG2=window.SG||{}, ni=SG2.nivelInfo?SG2.nivelInfo(r.xp,st.d&&st.d.tipo):null;
      L.push({peso:PESO.nivel, eyebrow:'HAS SUBIDO DE NIVEL', titulo:'Nivel '+r.nivel,
        sub:(ni&&ni.titulo?ni.titulo:'')+(r.rango_nombre?' · '+r.rango_nombre:''),
        img:(SG2.avatarSrc?SG2.avatarSrc(r.avatar,r.alias,r.xp,st.d&&st.d.tipo).src:''), clase:'figura'});
    }
    (r.skins||[]).forEach(function(n){
      if((ant.skins||[]).indexOf(n)>=0) return;
      var RG=(window.SG&&window.SG.RANGOS)||[];
      L.push({peso:PESO.skin, eyebrow:'NUEVO ASPECTO', titulo:RG[n-1]||('Skin '+n),
        sub:'Ya puedes ponértelo desde tu vestuario, gratis', img:'', clase:'texto'});
    });
    (r.insignias||[]).forEach(function(k){
      if((ant.insignias||[]).indexOf(k)>=0) return;
      L.push({peso:PESO.insignia, eyebrow:'INSIGNIA', titulo:NOM[k]||k, sub:'',
        img:'assets/img/insignias/'+k+'.png', clase:'figura'});
    });
    (r.bonus||[]).forEach(function(k){
      if((ant.bonus||[]).indexOf(k)>=0) return;
      var mp=k.match(/^planeta:(\d)$/), mr=k.match(/^racha:(\d+)$/);
      if(mp){ var pl=(window.SG_PLANETAS||[])[Number(mp[1])-1];
        L.push({peso:PESO.planeta, eyebrow:'PLANETA COMPLETO', titulo:pl?pl[1]:('Tema '+mp[1]),
          sub:'Has terminado todos sus retos', img:pl?('assets/img/planetas/'+pl[0]+'.png'+(window.SG_IMGV||'')):'', clase:'figura'}); }
      else if(mr) L.push({peso:PESO.racha, eyebrow:'CONSTANCIA', titulo:'🔥 '+mr[1]+' semanas seguidas',
          sub:'Has vuelto cada semana. Eso es lo difícil.', img:'', clase:'texto'});
      else if(k==='tutorial') L.push({peso:PESO.tutorial, eyebrow:'EL CAPITÁN TE PAGA',
          titulo:'Bienvenido a bordo', sub:'Por hacer la visita guiada', img:'', clase:'texto'});
      else if(k.indexOf('serie:')===0){
        var sl=(window.SG_SERIES_ALBUM||[]).filter(function(x){return x[0]===k.slice(6);})[0];
        L.push({peso:PESO.serie, eyebrow:'SERIE COMPLETA', titulo:'✦ '+(sl?sl[2]:'Serie completa'),
          sub:sl?sl[1]:'', img:'', clase:'texto'}); }
      else if(k==='album') L.push({peso:PESO.legendaria-1, eyebrow:'COLECCIONISTA',
          titulo:'🃏 ¡Álbum completo!', sub:'Las 20 cartas. Muy poca gente llega aquí.', img:'', clase:'texto'});
    });
    if(r.titulo&&r.titulo!==ant.titulo)
      L.push({peso:PESO.titulo, eyebrow:'NUEVO TÍTULO', titulo:'«'+r.titulo+'»', sub:'Se lee bajo tu alias', img:'', clase:'texto'});
    if(r.marco&&r.marco!==ant.marco)
      L.push({peso:PESO.marco, eyebrow:'MARCO DORADO', titulo:'Tu avatar, en oro', sub:'', img:'', clase:'texto'});
    if(r.fondo&&r.fondo!==ant.fondo)
      L.push({peso:PESO.fondo, eyebrow:'FONDO DE FICHA', titulo:r.fondo, sub:'Tu ficha, con tu planeta detrás', img:'', clase:'texto'});
    L.sort(function(a,b){return a.peso-b.peso;});     // en crescendo: lo mejor, al final
    return L;
  }
  function celebrar(r){
    var ant=fotoAnterior();
    guardarFoto(r);
    if(!ant) return;                                   // primera visita: foto en silencio
    var L=logrosNuevos(r,ant);
    if(!L.length) return;
    var extra=[];
    if(L.length>MAX_CARTELES){ extra=L.slice(0,L.length-MAX_CARTELES); L=L.slice(L.length-MAX_CARTELES); }
    cartel(L,0,extra);
  }
  function cerrarCartel(){
    var ov=document.getElementById('nave-logro'); if(!ov) return;
    ov.classList.remove('open'); ov.innerHTML=''; document.removeEventListener('keydown',teclaCartel);
  }
  function teclaCartel(e){
    if(e.key==='Escape'){e.preventDefault();cerrarCartel();}
    else if(e.key==='Enter'||e.key===' '){var b=document.querySelector('#nave-logro .logro-ok');if(b){e.preventDefault();b.click();}}
  }
  function cartel(L,i,extra){
    if(i>=L.length){ cerrarCartel(); return; }
    var x=L[i], ultimo=(i===L.length-1);
    var ov=document.getElementById('nave-logro');
    if(!ov){ov=document.createElement('div');ov.id='nave-logro';ov.className='logro';document.body.appendChild(ov);}
    var masCosas=(ultimo&&extra&&extra.length)
      ? '<p class="logro-mas">Y además: '+extra.map(function(e){return esc(e.titulo);}).join(' · ')+'</p>' : '';
    ov.innerHTML='<div class="logro-fondo"></div><div class="logro-caja '+x.clase+'" role="dialog" aria-modal="true">'
      +'<div class="logro-chispas"></div>'
      +'<div class="logro-eyebrow">'+esc(x.eyebrow)+'</div>'
      +(x.img?'<img class="logro-img" src="'+x.img+'" alt="">':'')
      +'<h3>'+esc(x.titulo)+'</h3>'+(x.sub?'<p class="logro-sub">'+esc(x.sub)+'</p>':'')
      +masCosas
      +(L.length>1?'<div class="logro-cuenta">'+(i+1)+' de '+L.length+'</div>':'')
      +'<button type="button" class="btn primary logro-ok">'+(ultimo?'¡A la nave! ✓':'Siguiente →')+'</button>'
      +'</div>';
    ov.classList.add('open');
    ov.querySelector('.logro-fondo').onclick=cerrarCartel;
    ov.querySelector('.logro-ok').onclick=function(){cartel(L,i+1,extra);};
    document.removeEventListener('keydown',teclaCartel);
    document.addEventListener('keydown',teclaCartel);
    ov.querySelector('.logro-ok').focus();
  }

  // ---------- la lupa del álbum ----------
  // Las cartas llevan texto y a tamaño de miniatura no hay quien lo lea. Solo se abren las que TIENES:
  // las que no, siguen siendo una silueta y no hay nada que leer en ellas.
  function cromosMios(){var t=(st.yo&&st.yo.cromos)||{}; return CROMOS.filter(function(c){return t[c[0]];});}
  // El personaje, en grande. Mismo overlay que las cartas: si un día cambia el fondo o el cerrar,
  // cambia para los dos. `data-modo` lo distingue, que las flechas solo tienen sentido en el álbum.
  function lupaAvatar(){
    var r=st.yo, d=st.d, SG=window.SG||{}; if(!r) return;
    var src=SG.avatarSrc?SG.avatarSrc(r.avatar,r.alias,r.xp,d.tipo):null; if(!src) return;
    var ni=SG.nivelInfo?SG.nivelInfo(r.xp,d.tipo):{nivel:1,rangoNombre:''};
    var ov=document.getElementById('cromo-lupa');
    if(!ov){ov=document.createElement('div');ov.id='cromo-lupa';ov.className='lupa';document.body.appendChild(ov);}
    ov.setAttribute('data-modo','avatar');
    ov.innerHTML='<div class="lupa-fondo"></div><div class="lupa-caja" role="dialog" aria-modal="true" aria-label="Tu personaje">'
      +'<button type="button" class="lupa-x" aria-label="Cerrar">×</button>'
      +'<img class="lupa-av" src="'+esc(src.src)+'" data-fb="'+esc(src.fallback)+'" alt="Tu personaje"'
      +' onerror="var f=this.dataset.fb; if(this.src.indexOf(f)<0)this.src=f;">'
      +'<div class="lupa-pie"><h4>'+(r.corona?'👑 ':'')+esc(r.alias)+'</h4>'
      +(r.titulo?'<p class="small">«'+esc(r.titulo)+'»</p>':'')
      +'<p class="small muted">Nivel '+ni.nivel+' · '+esc(ni.rangoNombre||src.rango||'')+'</p></div></div>';
    ov.classList.add('open');
    ov.querySelector('.lupa-fondo').onclick=cerrarLupa;
    ov.querySelector('.lupa-x').onclick=cerrarLupa;
    document.removeEventListener('keydown',teclaLupa);
    document.addEventListener('keydown',teclaLupa);
    ov.querySelector('.lupa-x').focus();
  }
  function cerrarLupa(){var ov=document.getElementById('cromo-lupa'); if(!ov) return;
    ov.classList.remove('open'); ov.innerHTML=''; ov.removeAttribute('data-modo');
    document.removeEventListener('keydown',teclaLupa);}
  function teclaLupa(e){
    if(e.key==='Escape'){e.preventDefault();cerrarLupa();return;}
    var ov=document.getElementById('cromo-lupa'); if(!ov||!ov.classList.contains('open')) return;
    if(ov.getAttribute('data-modo')==='avatar') return;      // el personaje es uno: no hay anterior ni siguiente
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();
      var mias=cromosMios(), i=Number(ov.getAttribute('data-i'))||0;
      if(mias.length<2) return;
      lupaCromo(mias[(i+(e.key==='ArrowLeft'?-1:1)+mias.length)%mias.length][0]);}
  }
  function lupaCromo(clave){
    var mias=cromosMios(), i=-1;
    for(var k=0;k<mias.length;k++) if(mias[k][0]===clave) i=k;
    if(i<0) return;                                   // no la tiene: no hay nada que abrir
    var c=mias[i], t=(st.yo&&st.yo.cromos)||{}, nn=t[clave]||1;
    var NOMSERIE={}; SERIES.forEach(function(sr){NOMSERIE[sr[0]]=sr[1];});
    var rz=c[3], cls=rz==='LEGENDARIA'?'leg':rz==='épica'?'epi':rz==='rara'?'rar':'com';
    var ov=document.getElementById('cromo-lupa');
    if(!ov){ov=document.createElement('div');ov.id='cromo-lupa';ov.className='lupa';document.body.appendChild(ov);}
    ov.setAttribute('data-i',i);
    ov.innerHTML='<div class="lupa-fondo"></div><div class="lupa-caja" role="dialog" aria-modal="true" aria-label="'+esc(c[1])+'">'
      +'<button type="button" class="lupa-x" aria-label="Cerrar">×</button>'
      +(mias.length>1?'<button type="button" class="lupa-nav prev" aria-label="Carta anterior">‹</button>'
                     +'<button type="button" class="lupa-nav next" aria-label="Carta siguiente">›</button>':'')
      +'<img class="lupa-carta '+cls+'" src="assets/img/tarjetas/'+clave+'_carta.png'+CARDV+'" alt="'+esc(c[1])+'">'
      // el pie NO repite lo que ya pone la carta (nombre grande, rareza y probabilidad): solo lo que
      // la carta no puede saber — de que serie es, cuantas tienes y por donde vas en tu album
      +'<div class="lupa-pie"><h4>'+esc(c[1])+'</h4>'
      +'<p class="small muted">'+esc(NOMSERIE[c[2]]||('Serie '+c[2]))
      +(nn>1?' · tienes <b>'+nn+'</b>':'')+(mias.length>1?' · <b>'+(i+1)+'</b> de '+mias.length+' tuyas':'')+'</p></div></div>';
    ov.classList.add('open');
    ov.querySelector('.lupa-fondo').onclick=cerrarLupa;
    ov.querySelector('.lupa-x').onclick=cerrarLupa;
    var pv=ov.querySelector('.lupa-nav.prev'), nx=ov.querySelector('.lupa-nav.next');
    if(pv)pv.onclick=function(){lupaCromo(mias[(i-1+mias.length)%mias.length][0]);};
    if(nx)nx.onclick=function(){lupaCromo(mias[(i+1)%mias.length][0]);};
    document.removeEventListener('keydown',teclaLupa);
    document.addEventListener('keydown',teclaLupa);
    ov.querySelector('.lupa-x').focus();
  }

  // ---------- render ----------
  function render(){
    root.innerHTML=cabecera()+accesos()+pestanas()+contenido();
    verTablero(st.tab==='tablero');
    Array.prototype.forEach.call(root.querySelectorAll('.nave-tab[data-tab]'),function(b){
      b.onclick=function(){ irA(b.getAttribute('data-tab')); };
    });
    wireYt(root);
    Array.prototype.forEach.call(root.querySelectorAll('.acc[data-ir]'),function(a){
      a.onclick=function(e){ e.preventDefault(); irA(a.getAttribute('data-ir')); };
    });
    wireVentanas(root);
    var bav=root.querySelector('#btn-av'); if(bav) bav.onclick=lupaAvatar;
    var det=root.querySelector('#nave-detalle');
    Array.prototype.forEach.call(root.querySelectorAll('.nave-pl.on'),function(el){
      function abrir(){var t=Number(el.getAttribute('data-tema'));
        var sems=st.semanas.filter(function(s){return s.tema_n===t&&(st.estado==='fin'||s.sem<=st.actual);});
        det.innerHTML=sems.map(function(s){return fichaSemana(s);}).join('');wireYt(det);det.scrollIntoView({behavior:'smooth',block:'start'});}
      el.addEventListener('click',abrir);
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();abrir();}});
    });
    var bm=root.querySelector('#btn-mail'), im=root.querySelector('#in-mail');
    if(bm)bm.onclick=function(){identificar(im.value);};
    if(im)im.addEventListener('keydown',function(e){if(e.key==='Enter')identificar(im.value);});
    var bo=root.querySelector('#btn-olvidar'); if(bo)bo.onclick=olvidar;
    // 29-ago · VESTIRSE TIENE QUE NOTARSE. Funcionaba, pero el único aviso era que el botón se
    // quedaba gris mientras Apps Script contestaba (2-5 s) y el repintado llegaba solo, arriba del
    // todo, donde el alumno no estaba mirando: parecía que el clic no había hecho nada, y volvía a
    // pulsar. Ahora: se marca AL INSTANTE (optimista), se cambia el avatar de la ficha en el sitio,
    // y al confirmar el servidor sale un cartel. Si falla, se deshace y se dice por qué.
    Array.prototype.forEach.call(root.querySelectorAll('button.vest[data-viste]'),function(b){
      b.onclick=function(){
        if(b.classList.contains('no')||!st.email) return;
        var clave=b.getAttribute('data-viste');
        if(b.classList.contains('on')) return;            // ya lo llevas puesto: no molestes al servidor
        var antes=root.querySelector('button.vest.on');
        var nombre=(b.querySelector('b')||{}).textContent||'tu personaje';
        var img=(b.querySelector('img')||{}).getAttribute&&b.querySelector('img').getAttribute('src');
        // 1) al instante, antes de que el servidor conteste
        if(antes) antes.classList.remove('on');
        b.classList.add('on'); b.classList.add('guardando');
        var av=root.querySelector('#btn-av img.av'); var avAntes=av?av.getAttribute('src'):null;
        if(av&&img) av.setAttribute('src',img);
        // 2) y se pide de verdad
        post({accion:'vestir',per:per,email:st.email,viste:clave},function(){
          b.classList.remove('guardando');
          if(st.yo) st.yo.viste=clave;
          aviso('✅ Ya llevas puesto <b>'+esc(nombre)+'</b>');
          refrescarYo();                                   // callado: sin pantalla de carga ni saltos
        },function(e){
          b.classList.remove('on'); b.classList.remove('guardando');
          if(antes) antes.classList.add('on');
          if(av&&avAntes) av.setAttribute('src',avAntes);
          aviso('⚠️ No se ha podido cambiar: '+esc(String(e)), true);
        });
      };});
    Array.prototype.forEach.call(root.querySelectorAll('.album .c[data-c]'),function(el){
      var clave=el.getAttribute('data-c');
      el.onclick=function(){lupaCromo(clave);};
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();lupaCromo(clave);}});
    });
    var pb=root.querySelector('#pase-ok');
    if(pb)pb.onclick=function(){
      var inp=root.querySelector('#pase-in'), msg=root.querySelector('#pase-msg');
      var val=String(inp.value||'').trim().toUpperCase();
      if(val.length!==4){msg.textContent='Son cuatro letras.';return;}
      pb.disabled=true; msg.textContent='Enviando…';
      post({accion:'pase',per:per,email:st.email,palabra:val},function(r){
        if(r&&r.ok){ msg.textContent=''; identificar(st.email); }   // recarga: celebra y actualiza créditos
        else { pb.disabled=false; msg.textContent=(r&&r.error)||'No ha podido ser.'; }
      },function(e){ pb.disabled=false; msg.textContent=e; });
    };
    var ob=root.querySelector('#btn-onboard'); if(ob)ob.onclick=function(){onboarding(0);};
  }

  // ---------- carga ----------
  if(!API){root.innerHTML='<p class="lead">La nave aún no está conectada.</p>';return;}
  root.innerHTML=cargando('Estableciendo conexión con NEBULA…','Sincronizando la Bitácora de tu PER');
  fetch(API+'?per='+encodeURIComponent(per),{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){
    if(d.error){root.innerHTML='<p class="lead">PER no encontrado. Pregunta a tu Capitán por el enlace bueno.</p>';return;}
    st.d=d; st.semanas=window.SGCAL.vista(d.tipo,SEM);
    var a=window.SGCAL.semanaActual(d.inicio); var forzada=parseInt(q.get('semana')||'0',10); if(forzada)a=forzada;
    st.actual=a==null?1:a;
    st.estado=a==null?'curso':a<1?'antes':a>st.semanas.length?'fin':'curso';
    if(st.estado==='fin')st.actual=st.semanas.length;
    if(st.estado==='antes')st.actual=0;
    render();
    if(st.email)identificar(st.email);
    if(!localStorage.getItem('sgNaveOnboard_'+per))onboarding(0);
  }).catch(function(){root.innerHTML='<p class="lead">No se pudo contactar con NEBULA. Prueba a recargar.</p>';});
})();
