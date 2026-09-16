// STARGATE — La Nave del Recluta (web del alumnado por PER)
// recluta.html?per=<id>[&embed=1][&semana=N]  ·  sin ?per: selector de PER
// Identificación: el recluta escribe su correo UNA vez por dispositivo (localStorage); la nave pide al
// servidor SOLO su ficha (doPost accion=quien, sin PIN). El correo nunca va en la URL ni se lista en el API.
(function(){
  var API=(window.SG_TABLERO_API||"").trim(), CID=(window.SG_GOOGLE_CLIENT_ID||"").trim(),
      SEM=window.SG_SEMANAS||[], NOMBRES=window.SG_BADGE_NAMES||{},
      BADGES=window.SG_BADGES||[], PLAN=window.SG_PLANETAS||[], root=document.getElementById('nave-app'),
      CROMOS=window.SG_CROMOS||[], SERIES=window.SG_CROMO_SERIES||[], CARDV=window.SG_CARDV||'',
      SELLOS=window.SG_SERIES_ALBUM||[],
      // 15-sep (noche) · los logros de a bordo: 16 hitos, 5 cubiertas y el Contramaestre (_site_data.py)
      AB_TODO=window.SG_A_BORDO||{hitos:[],cubiertas:[],heroes:[],carta:null},
      SINPUA=window.SG_SIN_PUA||{hitos:[],cubiertas:[]};
  // 🔴 16-sep · en un PUA no hay Zoco ni sorteo, así que sus cuatro logros tampoco: son 12 en 4 cubiertas y el
  // Contramaestre llega al completar esas cuatro. Se lee por tipo de grupo, para que el mismo fichero valga para los dos.
  function esPUA(){ return (st&&st.d&&st.d.tipo)==='PUA'; }
  var AB = { heroes: AB_TODO.heroes, carta: AB_TODO.carta,
    get hitos(){ return esPUA() ? AB_TODO.hitos.filter(function(x){ return (SINPUA.hitos||[]).indexOf(x.clave)<0; }) : AB_TODO.hitos; },
    get cubiertas(){ return esPUA() ? AB_TODO.cubiertas.filter(function(c){ return (SINPUA.cubiertas||[]).indexOf(c.clave)<0; }) : AB_TODO.cubiertas; } };
  if(!root) return;
  var q=new URLSearchParams(location.search); if(q.get('embed')==='1') document.body.classList.add('embed');
  // 🔴 13-sep · LA NAVE DEL COMANDANTE: el simulacro que maneja el docente en clase (ver fuente.js → simulacro)
  var SIMULACRO = q.get('simulacro')==='1' && !!(window.SG&&SG.FUENTE&&SG.FUENTE.simulacro);
  if(SIMULACRO){ document.body.classList.add('simulacro'); document.documentElement.style.colorScheme='dark'; }
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  // NEBULA en vídeo (holograma vivo); si el navegador no puede, se queda su imagen
  function nebulaVideo(cls){return '<video class="nebula-v '+(cls||'')+'" autoplay muted loop playsinline preload="auto" poster="assets/img/personajes/nebula_poster.jpg"><source src="media/video/nebula_loop.mp4" type="video/mp4"></video>';}
  function cargando(txt,pista){return '<div class="cargando"><div class="txt">'+txt+'</div><div class="barra"><i></i></div>'+(pista?'<div class="pista">'+pista+'</div>':'')+'</div>';}
  /**
   * EL MENSAJE DEL FORO, EN PÁRRAFOS DE VERDAD.
   *
   * 🔴 Venía de un fichero de texto con los saltos puestos a mano cada ~76 caracteres —así se
   * escribió para pegarlo en el foro de la plataforma— y aquí se pintaba en un `<pre>`, que respeta
   * cada salto. Resultado: frases cortadas por la mitad («…llegue a cualquier parte: el / m-learning»)
   * que parecían un error de carga. Ahora los saltos SUELTOS se cosen —son del formato de origen, no
   * del autor— y los DOBLES se respetan, que esos sí separan párrafos de verdad.
   *
   * Y la firma: el texto acaba en «— Capitán», que es el personaje. Quien lo lee tiene delante a una
   * persona con nombre, así que se firma con el suyo — «Comandante Ana Ruiz» dice mucho más que
   * «Capitán», y es lo que pidió Norberto.
   */
  function msgHtml(txt,perId){txt=String(txt==null?'':txt);
    txt=perId?txt.split('{id-del-PER}').join(perId):txt.split('?per={id-del-PER}').join('').split('&per={id-del-PER}').join('');
    var jefe=(st.yo&&st.yo.profe)||'';
    // 🔴 Sin duplicar el tratamiento: hay docentes cuyo nombre en el sistema YA es «Comandante
    // Orion», y anteponerlo otra vez firmaba «Comandante Comandante Orion».
    if(jefe){
      var firma = /^comandante\b/i.test(jefe.trim()) ? jefe.trim() : 'Comandante '+jefe.trim();
      txt=txt.replace(/—\s*Capit[áa]n\b/g,'— '+firma);
    }
    var parrafos=txt.split(/\n\s*\n/).map(function(b){
      return esc(b.replace(/\s*\n\s*/g,' ').trim());
    }).filter(Boolean);
    return parrafos.map(function(b){
      return '<p>'+b.replace(/https?:\/\/[^\s<»)]+/g,function(u){
        return '<a href="'+u+'" target="_blank" rel="noopener">'+u+'</a>'; })+'</p>';
    }).join('');}
  function ytb(v,c){return '<div class="yt" data-id="'+v.id+'" role="button" tabindex="0"><img loading="lazy" src="https://i.ytimg.com/vi/'+v.id+'/hqdefault.jpg" alt=""><span class="play">▶</span><div class="cap"><b>'+esc(v.titulo)+'</b><em>'+esc(c)+'</em></div></div>';}
  function wireYt(el){Array.prototype.forEach.call(el.querySelectorAll('.yt'),function(y){y.onclick=function(){if(y.classList.contains('on'))return;var f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+y.getAttribute('data-id')+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;y.insertBefore(f,y.firstChild);y.classList.add('on');};});}
  function minis(keys){return keys.map(function(k){return '<figure class="mini badge"><img loading="lazy" src="assets/img/insignias/'+k+'.png" alt="'+esc(NOMBRES[k]||k)+'"><figcaption>'+esc(NOMBRES[k]||k)+'</figcaption></figure>';}).join('');}

  // ---------- sin PER: selector ----------
  var per=q.get('per');
  if(!per){
    /**
     * 🔴 12-sep · SIN GRUPO, A LA PUERTA ÚNICA. Esta pantalla decía «te falta el enlace de tu clase»
     * a cualquiera que llegara sin `?per=`, con sesión o sin ella. Tenía sentido cuando no había
     * forma de saber quién eras; desde que existe `entrar.html`, que lo sabe, era un callejón. Y
     * Norberto se metió en él con la cuenta del referente vitalicio: pulsó la baldosa «La Nave del
     * Recluta» de la portada, entró con Google… y la Nave le dijo que le faltaba un enlace.
     *
     * La puerta única reparte: al docente a su puesto de mando, al alumno a SU Nave con su grupo
     * puesto, a quien es las dos cosas le pregunta, y al que no conoce le pide el código. Nadie se
     * queda aquí mirando un mensaje.
     */
    // (con el motor nuevo; la marcha atrás `?motor=apps` conserva su lista de grupos de siempre)
    var motorEfectivo = (new URLSearchParams(location.search).get('motor') || window.SG_MOTOR || 'apps').toLowerCase();
    if (motorEfectivo === 'firestore') { location.replace('entrar.html'); return; }
    if(!API){root.innerHTML='<p class="lead">La nave aún no está conectada.</p>';return;}
    // 🔴 9-sep · SIN ?per= EL SELECTOR SALIA DOS VECES. Esta pantalla ya pregunta «¿de qué PER eres
    // recluta?», y debajo la sección del tablero —que pinta tablero.js por su cuenta— preguntaba
    // «elige tu PER» otra vez, con la misma lista. Se apaga: aquí todavía no hay grupo que enseñar.
    verTablero(false);
    root.innerHTML=cargando('Contactando con NEBULA…','Localizando los PER activos');
    SG.FUENTE.lista().then(function(d){
      var pers=d.pers||[];
      /**
       * 🔴 UN AGUJERO NEGRO. Norberto: «si pongo "soy estudiante" llego a un agujero negro, no
       * puedo seguir». Y era literal: esta pantalla pregunta «¿de qué PER eres recluta?» y pintaba
       * la lista de grupos… que con el motor nuevo llega VACÍA, porque esa lista la servía el
       * sistema viejo. Resultado: una pregunta, ninguna respuesta posible y ni un enlace.
       *
       * Los grupos del motor nuevo no se pueden listar en abierto, y es a propósito: sería publicar
       * cuántas clases hay y cómo se llaman a cualquiera que pase. Así que cuando no hay lista se
       * dice la VERDAD —a tu Nave se entra por el enlace de tu clase— y se ofrecen las dos únicas
       * salidas reales: pedirle el enlace a tu Comandante, o alistarte si aún no lo has hecho.
       */
      if(!pers.length){
        root.innerHTML='<div class="card"><h3>Te falta el enlace de tu clase</h3>'
          +'<p class="lead">A tu Nave se entra por el enlace que reparte tu Comandante: lleva tu '
          +'grupo dentro. Sin él no puedo saber de qué clase eres.</p>'
          +'<p class="small muted">Búscalo donde tu docente lo haya dejado —el aula virtual, el foro '
          +'de la plataforma de UNIR o el Genially de clase—. Si no lo encuentras, pídeselo: es el '
          +'mismo para todo el grupo y no caduca.</p>'
          +'<p class="small muted">¿Todavía no te has alistado? Ese enlace es el mismo: el '
          +'alistamiento y la Nave son la misma puerta.</p>'
          +'<p><a class="btn" href="index.html">← Volver al inicio</a></p></div>';
        return;
      }
      root.innerHTML='<div class="card"><h3>¿De qué PER eres recluta?</h3><p class="small muted">Elige tu grupo para entrar en tu nave. Si no lo sabes, pregunta a tu Capitán.</p>'
        // 🔴 Solo el NOMBRE del grupo. «REGULAR/PUA» es jerga de la hoja de cálculo: al alumnado no le
        // dice nada y le hace dudar de si ha elegido bien.
        +pers.map(function(p){return '<p><a class="btn" href="recluta.html?per='+encodeURIComponent(p.id)+'">🚀 '+esc(p.nombre)+'</a></p>';}).join('')+'</div>';
    }).catch(function(){root.innerHTML='<p class="lead">No se pudo cargar la lista de PERs.</p>';});
    return;
  }

  // ---------- estado ----------
  var KEY_MAIL='sgNaveEmail_'+per;
  var st={d:null,semanas:[],actual:1,estado:'curso',email:localStorage.getItem(KEY_MAIL)||'',yo:null,cargandoYo:false,msgYo:'',
          // la pestaña abierta sale del #hash: así un enlace a #retos abre esa, y F5 no te devuelve al principio
          tab:(location.hash||'').replace('#','')||'ficha'};

  // v3.65 · `quien` admite dos formas de decir quién eres: el correo tecleado (como siempre) o el
  // token de «Iniciar sesión con Google». 🔴 Con token, el correo lo pone GOOGLE en el servidor, no
  // el navegador: es lo que impide que alguien escriba el correo de un compañero y vea su ficha.
  // 🔴 La Nave ya no sabe CON QUIÉN habla, y ese es el truco entero de la mudanza: pide su ficha y
  // se la dan, venga del Apps Script de siempre o de Firestore. Lo decide assets/js/fuente.js con un
  // interruptor, así que volver al motor viejo es cambiar una palabra y no reescribir esta página.
  function quien(quien_,cb){
    SG.FUENTE.quien(per,quien_).then(cb).catch(function(){cb({error:'red'});});
  }
  // Vestirse escribe, pero SIN PIN a propósito: el alumnado no va a recordar otra clave. El servidor
  // solo deja ponerse algo que ya se tiene desbloqueado, así que lo peor que puede pasar es que
  // alguien le cambie el disfraz a un compañero — cosmético y se deshace en un clic.
  // lo que haría cada botón si no fuera una demo — para que el aviso diga algo concreto
  var QUE_HARIA = {
    registrar: 'sumaría los puntos del reto al momento',
    cancelar: 'desharía el reto y te devolvería lo que costó',
    evidencia: 'guardaría el enlace de tu evidencia',
    canje: 'cobraría los créditos y te daría la recompensa',
    vestir: 'te cambiaría el personaje',
    adorno: 'te pondría el adorno en la ficha y en el tablero',
    pase: 'te daría los créditos de la asistencia',
    reflexion: 'guardaría tu reflexión, y la vería tu tripulación',
    comentar: 'dejaría tu comentario a esa persona de tu tripulación',
    borrarComentario: 'quitaría tu comentario',
    hitos: 'apuntaría tus logros de a bordo',
    abrir: 'abriría lo que tienes sin abrir'
  };
  function enDemo(){ return DEMO && !st.email && demoPermitido(); }
  function post(cuerpo,cb,err){
    /**
     * 🔴 EN LA DEMOSTRACIÓN NO SE ESCRIBE NADA, y se dice con amabilidad. Todo lo que pasa por aquí
     * es una escritura —registrar un reto, canjear, vestirse, poner un adorno, fichar—, y el
     * visitante de la demo no tiene sesión: el servidor contestaría «no autenticado» y la pantalla
     * enseñaría un error rojo en la página que existe precisamente para causar buena impresión.
     * Peor que un error: un botón que parece roto.
     *
     * Así que se frena aquí, en el único embudo por el que salen todas, y se explica qué habría
     * pasado. La demo sigue siendo navegable de punta a punta; solo no deja huella.
     */
    if(enDemo()){
      var hace = QUE_HARIA[cuerpo.accion] || 'guardaría el cambio';
      var capa = document.querySelector('.neb-capa');
      // Si NEBULA estaba en pantalla (el canje), lo explica ELLA, en personaje. Un cartel rojo de
      // «no autenticado» encima de su ventana sería lo contrario de lo que la demo quiere enseñar.
      if(capa){
        capa.innerHTML='<div class="neb-caja" role="dialog" aria-modal="true">'
          +'<div class="neb-cara"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div>'
          +'<div class="neb-quien">NEBULA</div><h3>Esto es una demostración</h3>'
          +'<p class="neb-nota">En tu Nave de verdad, ahora mismo '+hace+'. Aquí no se cobra nada '
          +'ni se guarda nada: puedes pulsar todo lo que quieras.</p>'
          +'<div class="neb-botones"><button type="button" class="btn primary" data-cerrar>Entendido</button></div></div>';
        var bc=capa.querySelector('[data-cerrar]');
        var fuera=function(){ capa.classList.add('cerrando');
          setTimeout(function(){ if(capa.parentNode) capa.parentNode.removeChild(capa); render(); },160); };
        bc.onclick=fuera; capa.onclick=function(ev){ if(ev.target===capa) fuera(); };
        setTimeout(function(){ bc.focus(); },40);
      } else {
        aviso('🎬 <b>Esto es una demostración.</b> En tu Nave de verdad, este botón ' + hace
          + '. Aquí no se guarda nada.');
        // 🔴 Y se repinta: quien llamó ya había puesto el botón en «Registrando…» y deshabilitado.
        // Sin repintar se quedaría así para siempre, que es un botón roto en la página del escaparate.
        setTimeout(render, 60);
      }
      return;
    }
    SG.FUENTE.accion(cuerpo)
      .then(function(d){ if(d&&d.error){ if(err)err(d.error); else alert(d.error); return; } cb(d);
        // 15-sep (noche) · y si lo hecho puede ser un logro de a bordo, se pregunta al servidor (sin prisa)
        if(HITOS_TRAS[cuerpo.accion]) hitosLuego(); })
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
  // Entrar con la cuenta de Google: el correo lo resuelve el servidor a partir del token firmado.
  function identificarConGoogle(token){
    st.cargandoYo=true; st.msgYo=''; render();
    quien({token:token},function(d){
      st.cargandoYo=false;
      st.pase=(d&&d.pase)||null;
      if(d&&d.yo){
        st.yo=d.yo; st.email=(d.correo||'').toLowerCase(); st.verificado=true;
        if(st.email) localStorage.setItem(KEY_MAIL,st.email);
        st.msgYo='';
        setTimeout(ofrecerCapitulos, 700); setTimeout(zocoAlEntrar, 1200); setTimeout(sorteosAlEntrar, 900); setTimeout(ofertaAlEntrar, 1100);
      } else if(d&&d.error){
        st.msgYo='No he podido comprobar tu cuenta: '+esc(d.error);
      } else {
        // Entró bien en Google pero no está en este grupo: es el flujo de «no te encuentro →
        // alístate», igual que con el correo tecleado.
        st.email=(d&&d.correo)||''; st.verificado=true;
        st.msgYo='Tu cuenta es correcta, pero todavía no estás alistado en este grupo.';
      }
      render();
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
      if(!motorNuevo()) st.pase=(d&&d.pase)||null;   // v3.27 · ¿hay pase de lista abierto ahora mismo?
      if(d&&d.yo){st.yo=d.yo;st.email=email;localStorage.setItem(KEY_MAIL,email);st.msgYo='';
        // 🔴 ACTO 2: aquí, con su ficha ya delante. Se espera un poco a que la nave termine de
        // pintarse — explicar «mira tu personaje» sobre una pantalla en blanco no explica nada.
        setTimeout(ofrecerCapitulos, 700); setTimeout(zocoAlEntrar, 1200); setTimeout(sorteosAlEntrar, 900); setTimeout(ofertaAlEntrar, 1100);
      }
      else if(d&&d.yo===null){st.yo=null;st.msgYo='No encuentro a nadie con ese correo en este grupo. Tiene que ser el <b>mismo correo de Google</b> con el que '+(motorNuevo()?'te alistaste':'rellenaste la Bitácora de mando')+'. ¿Todavía no te has alistado? Ese es el primer paso — el botón de abajo.';}
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
  /**
   * 13-sep · UNA SEMANA CONGELADA (Navidad, Semana Santa): el referente la congela en su calendario
   * y el curso se para. Que el recluta sepa por qué no avanza nada y cuándo vuelve.
   */
  function pausaNave(){
    var d=st.d||{}; if(!d.pausa||!d.inicio||!window.SGSEMANAS||st.estado!=='curso') return '';
    var vuelve=window.SGSEMANAS.inicioDeSemana(d.inicio, (st.actual||1)+1, d.pausas);
    var f=window.SGSEMANAS.fecha(vuelve), MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return '<p class="prox-cap pausa-nave">⏸️ <b>Semana de pausa.</b> El viaje se detiene: la semana '+((st.actual||1)+1)+' empieza el <b>'+f.getDate()+' de '+MESES[f.getMonth()]+'</b>.</p>';
  }
  function cabecera(){
    var d=st.d,n=st.semanas.length;
    var pos=st.estado==='antes'?'La misión aún no ha empezado':st.estado==='fin'?'Misión completada — la puerta está abierta':'Semana '+st.actual+' de '+n;
    var prox=porCapitulos()?proximoCap():null, sp=prox?semanaCap(prox):0;
    var ab=porCapitulos()?capsAbiertos().filter(function(c){ return c.clave==='c1'||PASOS_CAP[c.clave]; }):[];
    // 🔴 13-sep · Norberto: «la posibilidad de ver onboardings pasados». El menú enseña TODOS los
    // capítulos: los abiertos, con si ya los viste, se vuelven a ver; los que vienen, con su semana.
    var vistos=porCapitulos()?capsVistos():{}, vienen=porCapitulos()?capsTipo().filter(function(c){ return ab.indexOf(c)<0; }):[];
    return '<div class="tab-head"><div><div class="eyebrow teal">La Nave del Recluta · '+esc(d.nombre)+(d.tipo==='PUA'?' · PUA':'')+'</div><h3>'+pos+'</h3>'+(st.tab==='retos'?plazos():'')
      // 🔴 13-sep · lo que llega después, en UNA línea (lo cerrado no se enseña: agobia)
      +(prox&&st.estado!=='fin'?'<p class="prox-cap">🔓 '+(sp===st.actual+1?'La semana que viene':'En la semana '+sp)+': <b>'+prox.icono+' '+esc(prox.titulo)+'</b></p>':'')
      +pausaNave()+'</div>'
      +'<div class="small muted rep-caps"><button class="btn small" id="btn-onboard" type="button" aria-haspopup="'+(ab.length>0)+'">▶ '+(ab.length?'Capítulos de NEBULA':'Repetir bienvenida')+'</button>'
      +(ab.length?'<div class="rep-menu" id="rep-menu" hidden><p class="rep-tit">Capítulos de NEBULA</p>'+ab.map(function(c){
          var v=vistos[c.clave];
          return '<button type="button" class="btn small" data-cap="'+c.clave+'"><span>'+c.icono+' '+c.n+' · '+esc(c.titulo)+'</span>'
            +'<em>'+(v?(v.estado==='saltado'?'saltado · ver':'✓ visto · ver otra vez'):'nuevo · ver')+'</em></button>'; }).join('')
          +vienen.map(function(c){ return '<div class="rep-vien"><span>🔒 '+c.n+' · '+esc(c.titulo)+'</span><em>semana '+semanaCap(c)+'</em></div>'; }).join('')
          +'</div>':'')
      +'</div></div>';
  }
  // ================= LA PUERTA (30-ago) =================
  // Petición de Norberto: la identificación y el menú, FIJOS justo bajo la cabecera; la semana,
  // después. Antes el login vivía dentro de la pestaña «Mi ficha», debajo de la semana y de los
  // accesos: lo primero que hay que hacer estaba lo cuarto en pantalla.
  function login(){
    if(st.yo||st.cargandoYo) return '';
    // 🔴 9-sep · NINGUN FORMULARIO ANTES DEL CORREO. Norberto: «hasta no poner el mail no se
    // deberia ver ningun enlace ni form, no quiero trolls». El de Dudas es ANONIMO (por eso se le
    // pueden mandar tickets sin sesion), asi que a la vista de cualquiera es una invitacion a
    // ensuciar la clase. Los otros dos piden cuenta de Google, pero tampoco pintan nada aqui.
    // El de alistarse aparece SOLO cuando ya se ha buscado un correo y no estaba: es el flujo de
    // toda la vida «no te encuentro → registrate», y de paso no hay ni un enlace que rastrear.
    /**
     * 🔴 12-sep · CALLEJÓN SIN SALIDA. Con el motor nuevo, `formBitacora` no existe, así que esta
     * variable era siempre falsa y NO SALÍA EL BOTÓN DE ALISTARSE. Alguien que llegara a la Nave por
     * el enlace de un compañero entraba con su cuenta, leía «todavía no te has alistado» y se quedaba
     * ahí, sin nada que pulsar. La única salida era que alguien le pasara otro enlace distinto.
     */
    var altaUrl = motorNuevo()
      ? 'alistarse.html?per=' + encodeURIComponent(per) + '&motor=firestore'
      : (st.d && st.d.formBitacora) || '';
    var alta = altaUrl && st.msgYo;
    return '<div class="card nave-login"><div class="nave-perfil">'+nebulaVideo('nebula-mini')+''
      +'<div><h3>Identifícate, recluta</h3><p class="small muted">'
      // 🔴 En el motor nuevo NO hay Bitácora de mando: se alista uno en su propia página. Mandar a
      // un recluta a buscar un formulario de Google que ya no existe es la peor primera pantalla
      // posible, y era exactamente lo que ponía aquí.
      +((CID||motorNuevo())?'Entra con la <b>misma cuenta de Google</b> con la que '+(motorNuevo()?'te alistaste':'rellenas la Bitácora de mando')+'. Solo se te pedirá una vez en este dispositivo, y solo verás <b>tu</b> ficha.'
           :'Escribe el correo con el que te alistaste en la Bitácora de mando. Solo lo pediré una vez en este dispositivo, y solo te enseño <b>tu</b> ficha.')
      +'<br><b>¿Primera vez?</b> Entra igualmente y te digo cómo subir a bordo.</p></div></div>'
      +((CID||motorNuevo())?'<div id="g-nave" class="g-nave"></div>'
        +'<p class="small muted" style="margin:6px 0 14px">Es la forma segura: Google nos dice quién eres y '
        +'<b>nadie puede entrar con tu correo</b>. Solo pide ver tu dirección de correo — ni Drive, ni contraseña.</p>'
        +(motorNuevo()?'':'<div class="o-bien"><span>o escríbelo a mano</span></div>'):'')
      // 🔴 Con el motor nuevo el correo NO se teclea: quien pide la ficha es quien ha iniciado
      // sesión y el servidor lo sabe sin preguntar. Dejar el campo sería ofrecer una puerta que no
      // lleva a ningún sitio — y era justo la puerta por la que se veía la ficha del vecino.
      +(motorNuevo()?''
        :'<div class="selrow"><input id="in-mail" type="email" placeholder="tu.correo@ejemplo.com" autocomplete="email"><button class="btn primary" id="btn-mail" type="button">Entrar en la nave</button></div>')
      +(st.msgYo?'<p class="small" style="margin-top:8px;color:var(--amber)">'+st.msgYo+'</p>':'')
      +(alta?'<div class="nave-alta"><span class="o">¿aún no te has alistado?</span>'
        +(motorNuevo()
          ? '<a class="btn primary" href="'+esc(altaUrl)+'">🧭 Alistarme ahora →</a>'
            +'<p class="small muted">Es el <b>primer paso</b> y solo se hace una vez: nombre, alias, '
            +'Comandante y personaje. Si tu clase tiene <b>código</b>, tenlo a mano — te lo pedirá.</p>'
          : '<a class="btn primary" href="'+esc(altaUrl)+'" data-vent="📓 Bitácora de mando">📓 Alistarme en la Bitácora de mando →</a>'
            +'<p class="small muted">Es el <b>primer paso</b> y solo se hace una vez: eliges alias y personaje. '
            +'Hasta que no lo envíes no existes a bordo. Después vuelve aquí con <b>ese mismo correo</b>.</p>')
        +'</div>':'')
      +'</div>';
  }
  /**
   * LAS INSIGNIAS, EN EL ORDEN EN QUE SE GANAN.
   *
   * 🔴 El orden sale del CALENDARIO, no de una lista aparte. Cada semana declara qué insignias
   * entran en juego, así que ese es el único sitio donde el orden es un hecho y no una opinión —
   * y el día que se mueva un reto de semana, la colección se reordena sola.
   *
   * Las que no aparecen en ninguna semana (las de hito, que se otorgan solas) van al final, en el
   * orden del catálogo: no tienen fecha porque no dependen del calendario sino de lo que hagas.
   */
  function badgesCronologicos(){
    var cuando = {}, n = 0;
    (st.semanas || SEM || []).forEach(function (sm) {
      (sm.insignias || []).forEach(function (k) { if (cuando[k] == null) cuando[k] = ++n; });
    });
    var sinFecha = 9999;
    return BADGES.slice().sort(function (a, b) {
      return (cuando[a] == null ? sinFecha + BADGES.indexOf(a) : cuando[a])
           - (cuando[b] == null ? sinFecha + BADGES.indexOf(b) : cuando[b]);
    });
  }

  /**
   * ════════ EL VISOR DE VÍDEOS («rollo blockbuster») ════════
   *
   * Norberto: «pon los vídeos en una fila exclusiva y genera con código un visor donde los vídeos se
   * vayan desbloqueando según la fecha, con un menú para ver vídeos anteriores, pero que aparezca un
   * vídeo a tamaño decente para verlo, no miniaturas: los vídeos de la semana en orden, una fila
   * debajo para pasar al siguiente y un menú para ver anteriores».
   *
   * · La pantalla es grande (16:9, hasta 960 px) y el vídeo solo se carga al pulsar: la carátula la
   *   sirve YouTube y hasta entonces no se descarga nada. Se usa youtube-nocookie.
   * · Debajo, la tira de la semana: el que se ve, resaltado; el resto, a un toque.
   * · Arriba, las semanas como temporadas: las que ya han llegado se pueden ver; las futuras salen
   *   con candado y sin título —se sabe que hay algo, no qué—, igual que los planetas.
   */
  var CINE={sem:0,i:0,jugando:false};
  function cine(){
    var L=st.semanas||[]; if(!L.length||st.estado==='antes') return '';
    var hasta=Math.min(Math.max(st.actual,1),L.length);
    if(!CINE.sem||CINE.sem>hasta) { CINE.sem=hasta; CINE.i=0; CINE.jugando=false; }
    // si la semana elegida no trae vídeos, la más reciente que sí
    var sm=L[CINE.sem-1]; if(!sm||!(sm.videos&&sm.videos.length)){
      for(var k=hasta;k>=1;k--){ if(L[k-1]&&L[k-1].videos&&L[k-1].videos.length){ CINE.sem=k; sm=L[k-1]; break; } } }
    if(!sm||!(sm.videos&&sm.videos.length)) return '';
    var V=sm.videos, i=Math.min(CINE.i,V.length-1), v=V[i][0], nota=V[i][1]||'';
    var chips=L.map(function(s,j){
      var n=j+1, abierta=n<=hasta, tiene=s.videos&&s.videos.length;
      if(!tiene) return '';
      return abierta
        ? '<button type="button" class="cine-t'+(n===CINE.sem?' on':'')+'" data-cine-sem="'+n+'" title="'+esc(s.tema||'')+'">S'+n+'</button>'
        : '<span class="cine-t cerrada" title="Se desbloquea la semana '+n+'">🔒'+n+'</span>';
    }).join('');
    var pantalla = CINE.jugando
      ? '<iframe src="https://www.youtube-nocookie.com/embed/'+esc(v.id)+'?autoplay=1&rel=0&modestbranding=1" title="'+esc(v.titulo)+'" '
        +'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'
      : '<button type="button" class="cine-poster" data-cine-play="1" aria-label="Ver «'+esc(v.titulo)+'»">'
        +'<img src="https://i.ytimg.com/vi/'+esc(v.id)+'/maxresdefault.jpg" alt="" loading="lazy" '
        +'onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/'+esc(v.id)+'/hqdefault.jpg\'">'
        +'<span class="cine-play" aria-hidden="true">▶</span></button>';
    return '<section class="cine" aria-label="Los vídeos de la semana">'
      +'<div class="cine-cab"><div><div class="eyebrow teal">Los vídeos · semana '+CINE.sem+(CINE.sem===hasta?' (esta)':'')+'</div>'
      +'<h3>'+esc(sm.tema||'')+'</h3></div>'
      +'<div class="cine-temporadas" role="group" aria-label="Semanas">'+chips+'</div></div>'
      +'<div class="cine-pantalla">'+pantalla+'</div>'
      +'<div class="cine-info"><div><b>'+esc(v.titulo)+'</b>'+(nota?'<em>'+esc(nota)+'</em>':'')+'</div>'
      +'<div class="cine-nav"><span>'+(i+1)+' de '+V.length+'</span>'
      +(i<V.length-1?'<button type="button" class="btn small" data-cine-i="'+(i+1)+'">Siguiente ▶</button>':'')+'</div></div>'
      +(V.length>1?'<div class="cine-tira">'+V.map(function(x,j){
          return '<button type="button" class="cine-mini'+(j===i?' on':'')+'" data-cine-i="'+j+'">'
            +'<img src="https://i.ytimg.com/vi/'+esc(x[0].id)+'/mqdefault.jpg" alt="" loading="lazy">'
            +'<span><b>'+esc(x[0].titulo)+'</b>'+(x[1]?'<em>'+esc(x[1])+'</em>':'')+'</span></button>';
        }).join('')+'</div>':'')
      +'</section>';
  }
  document.addEventListener('click', function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-leer-entero]'); if(!b) return;
    var m=b.previousElementSibling; if(!m) return;
    var abierto=m.classList.toggle('abierto');
    b.textContent=abierto?'Recoger ▴':'Leer entero ▾';
  });
  // Un solo oyente para todo el visor: se repinta solo el visor, no la Nave entera (que haría saltar
  // la página arriba y cortaría el vídeo que suena).
  document.addEventListener('click', function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-cine-sem],[data-cine-i],[data-cine-play]');
    if(!b||!b.closest('.cine')) return;
    if(b.hasAttribute('data-cine-sem')){ CINE.sem=Number(b.getAttribute('data-cine-sem')); CINE.i=0; CINE.jugando=false; }
    else if(b.hasAttribute('data-cine-i')){ CINE.i=Number(b.getAttribute('data-cine-i')); CINE.jugando=true; }
    else CINE.jugando=true;
    var viejo=document.querySelector('.cine'); if(!viejo) return;
    var tmp=document.createElement('div'); tmp.innerHTML=cine();
    if(tmp.firstChild) viejo.parentNode.replaceChild(tmp.firstChild, viejo);
  });

  /**
   * LA ORDEN DE LA SEMANA, al lado de tu ficha.
   *
   * Es el mensaje del foro que toca hoy — el mismo que el profesorado pega en la plataforma de
   * UNIR. Aquí no se copia: se lee. Ocupa el sitio que antes tenía la colección de insignias
   * porque es lo único de esta pantalla que CADUCA: la colección no cambia porque abras la Nave.
   */
  function ordenDeLaSemana(){
    if (st.estado === 'antes')
      return '<div class="card orden-sem"><div class="eyebrow amber">La orden de la semana</div>'
        + '<h3>En la rampa de lanzamiento</h3>'
        + '<p class="small">La misión empieza el <b>' + esc(st.d.inicio) + '</b>. Mientras tanto, '
        + 've preparando tu Bitácora.</p></div>';
    var lista = st.semanas || [];
    if (!lista.length) return '';
    var sm = lista[Math.min(Math.max(st.actual, 1), lista.length) - 1];
    if (!sm) return '';
    return '<div class="card orden-sem"><div class="eyebrow amber">La orden de la semana</div>'
      + '<h3>' + esc(sm.tema) + '</h3>'   // el número vive en la cabecera, y en un sitio basta
      + '<p class="small muted">' + esc(sm.sub || '') + '</p>'
      // recortado, con «Leer entero»: la orden entera empujaba la tarjeta muy por debajo de la ficha
      + '<div class="foro-msg recortado">' + msgHtml(sm.foro, per) + '</div>'
      + '<button type="button" class="leer-entero" data-leer-entero>Leer entero ▾</button>'
      /**
       * 🔴 LOS VÍDEOS DE LA SEMANA, AQUÍ. Estaban solo dentro de «ver la semana entera», a dos
       * clics — y son lo primero que hay que ver: el propio mensaje del foro los nombra por su
       * enlace y luego no estaban a mano. En tira horizontal y sin cabecera propia, pegados al
       * mensaje que los menciona, así no abren un hueco nuevo. La carátula la sirve YouTube y el
       * vídeo solo se carga al pulsarlo: no cuesta nada de más en cada visita.
       */
      // 🔴 13-sep · los vídeos se van a su propia fila, al visor (cine()): en una tira de miniaturas
      // metida aquí, «¿tú crees que alguien va a ver los vídeos en ese tamaño?» (Norberto)
      + (sm.lanza && sm.lanza.length
          ? '<p class="small"><b>Se lanza:</b> ' + sm.lanza.map(esc).join(' · ') + '</p>' : '')
      + '<p class="small" style="margin-top:10px">'
      + '<button class="btn small" type="button" data-tab="semana">Ver la semana entera →</button></p></div>';
  }

  /**
   * EL PANEL DE LOS PLANETAS, EMBEBIDO.
   *
   * 🔴 Antes era un botón que abría una ventana encima de la Nave, y eso lo convertía en «algo más
   * que mirar luego». Es el mapa del viaje: tiene que estar puesto, no escondido detrás de un clic.
   *
   * Se carga PEREZOSO (loading="lazy") y va después de la ficha a propósito: un Genially pesa, y
   * lo primero que tiene que pintar la Nave es quién eres tú.
   */
  function panelEmbebido(){
    var u = miPanel();
    if (!u) return '';
    // 🔴 No se llama «Los ocho planetas»: así se llama el MAPA, que está en «Mis retos» y es otra
    // cosa (qué está abierto y qué no). Dos títulos iguales para dos pantallas distintas es la forma
    // más barata de que alguien busque una y encuentre la otra.
    return '<div class="card panel-planetas"><h3>🪐 Tu panel de control</h3>'
      + '<p class="small muted">Cada planeta es un tema, con sus retos y sus materiales. Se abre '
      + 'aquí mismo, sin salir de la Nave.</p>'
      + '<div class="marco-genially"><iframe src="' + esc(u) + '" loading="lazy" allowfullscreen '
      + 'allow="fullscreen" referrerpolicy="no-referrer-when-downgrade" '
      + 'title="Panel de control de los planetas"></iframe></div>'
      + '<p class="small"><a href="' + esc(u) + '" target="_blank" rel="noopener">Abrirlo a pantalla completa →</a></p></div>';
  }


  /**
   * MI BOTÍN · todo lo ganado, en un solo sitio.
   *
   * 🔴 Antes esto vivía repartido: las insignias y el álbum dentro de «Mi ficha», el vestuario más
   * abajo en la misma pantalla. Son la misma pregunta —«¿qué llevo ganado?»— contestada en tres
   * sitios, y por eso el aterrizaje era una pared. Aquí están las tres cosas y ninguna más.
   *
   * Nace con la primera sección abierta y las otras dos cerradas: al entrar quieres ver tus
   * insignias, no cargar 55 cartas de golpe.
   */
  function botin(){
    var r=st.yo, d=st.d; if(!r) return '';
    var tieneIns=function(kk){ return (r.insignias||[]).indexOf(kk)>=0; };
    var celdaIns=function(kk){var tiene=tieneIns(kk);
      return '<div class="b'+(tiene?'':' no')+'" data-key="'+kk+'" role="button" tabindex="0" title="'+esc(NOMBRES[kk]||kk)+(tiene?'':' · pendiente')+' — pulsa para ver cómo se gana"><img loading="lazy" src="assets/img/insignias/'+kk+'.png" alt=""><span>'+esc(NOMBRES[kk]||kk)+'</span></div>';};
    /**
     * 15-sep · LAS INSIGNIAS, POR TEMAS. Norberto: «¿qué opinas de organizarlas por temas? ¿es posible?».
     * Sí, y encaja con el viaje: cada planeta trae su tripulante (P) y su reto (R), así que de un vistazo
     * se ve qué planeta tienes a medias. Detrás, las de la historia (NEBULA, el Capitán, Vaeon) y los hitos,
     * que no son de ningún tema. Cada casilla es la de siempre: se pulsa y dice cómo se gana.
     */
    var deIns=function(pre){ return BADGES.filter(function(k){ return k.indexOf(pre)===0; }); };
    var grupoIns=function(tit, sub, ks, img){
      if(!ks.length) return '';
      var n=ks.filter(tieneIns).length;
      return '<div class="ins-tema'+(n===ks.length?' completo':'')+'"><div class="ins-tema-cab">'+(img?'<img src="'+esc(img)+'" alt="">':'')
        +'<div class="ins-tema-t"><b>'+esc(tit)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</div><em>'+(n===ks.length?'✓ ':'')+n+' / '+ks.length+'</em></div>'
        +'<div class="badge-col">'+ks.map(celdaIns).join('')+'</div></div>';
    };
    var temasIns=''; for(var tt=1;tt<=8;tt++){ var pl=PLAN[tt-1]||[];
      temasIns+=grupoIns('Tema '+tt+(pl[1]?' · '+pl[1]:''), '', deIns('P'+tt+'_').concat(deIns('R'+tt+'_')), pl[0]?'assets/img/planetas/'+pl[0]+'.png'+(window.SG_IMGV||''):''); }
    var col='<div class="ins-temas">'+temasIns
      +grupoIns('La historia', 'NEBULA, el Capitán y Vaeon', deIns('E'), '')
      +grupoIns('Hitos del viaje', 'Llegan solos con lo que haces', badgesCronologicos().filter(function(k){ return /^H/.test(k); }), '')+'</div>';
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
    var album=CROMOS.length?('<details class="cajon album-cromos"><summary><b>🃏 Tu álbum de cromos</b> <span class="cnt">'+nCromos+' / '+CROMOS.length+'</span></summary>'
      +'<p class="small muted">Cada «Sobre de cromos» (15 ◈) trae una carta al azar. Los ocho tripulantes son <b>comunes</b>; '
      +'los Ecos, NEBULA y el Capitán, <b>raros</b>; el Recluta y la Estática, <b>épicos</b>; y hay dos '
      +'<b>LEGENDARIOS</b>: el General Vaeon (2 de cada 100 sobres) y <b>Ander Vaeon</b>, la carta que revela '
      +'quién era antes de ser Vaeon — <b>1 de cada 100</b>, la más difícil de toda la galaxia.'
      +'</p>'
      +(repes?'<p class="repes'+(libres>=3?' listo':'')+'">🔁 Llevas <b>'+repes+'</b> repetido'+(repes===1?'':'s')
        +(libres>=3?' — y con 3 te llevas un sobre <b>gratis</b>. Puedes cambiar '+Math.floor(libres/3)+' vez'+(Math.floor(libres/3)===1?'':'es')+'.'
                   :(libres?' ('+libres+' sin cambiar): con 3 te llevas un sobre gratis.':' — ya los has cambiado todos por sobres.'))
        +(libres>=3&&d.formCanje?' <a class="btn small" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">Cambiar 3 repetidos →</a>':'')+'</p>':'')
      +series+'</details>'):'';
    var nIns=(r.insignias||[]).length;
    return '<section><div class="eyebrow">Lo que llevas ganado</div><h2>Mi botín</h2>'
      +'<p class="lead">Tus insignias, tus cartas y tus personajes. Lo que has conseguido tú, no lo '
      +'que se puede comprar — eso está en el <button class="btn small" type="button" data-tab="mercado">Mercado Estelar</button>.</p>'
      // 14-sep · lo ganado en un sorteo, lo primero: es lo que más ilusión hace
      +sinAbrirHtml(r)
      +((r.premios||[]).length?'<div class="card botin-premios"><p>🏆 <b>Lo que has ganado en el Gran Sorteo:</b> '+r.premios.map(esc).join(' · ')
        +'</p><p class="small muted">Tu docente te dirá cómo recibirlo.</p></div>':'')
      +'<details class="cajon" open><summary><b>🏅 Insignias</b> <span class="cnt">'+nIns+' / '+BADGES.length+'</span></summary>'
      +'<p class="small muted">Por planetas: cada tema tiene su tripulante y su reto. '
      +'Las apagadas están por conseguir: púlsalas para ver qué piden.</p>'
      +col+'</details>'
      +aBordo()
      +album
      // 🔴 13-sep · el cambio de héroes repetidos vive dentro del cajón plegado: se anuncia en la tapa
      +'<details class="cajon"><summary><b>🎭 Personajes y héroes</b> <span class="cnt">tu vestuario</span>'
      +((r.heroes_repes||0)>=2?' <span class="chip ok">🔁 '+r.heroes_repes+' héroes repetidos para cambiar</span>':'')+'</summary>'
      +vestuario()+'</details>'
      +adornos()
      +'</section>';
  }

  /**
   * 15-sep (noche) · LO QUE SE QUEDÓ SIN ABRIR. Si un sobre o una cápsula no se llegó a abrir (un corte al abrir el regalo de
   * la llamada, el premio de una cubierta…), se quedaba en el inventario sin forma de abrirlo, aunque la Nave decía «ábrela
   * desde tu álbum». Ahora sale arriba del botín, con su botón.
   */
  function sinAbrir(r){
    var R=(st.d&&st.d.recompensas)||[];
    return ((r&&r.sinAbrir)||[]).map(function(x){ var rc=R.filter(function(y){ return y.doc===x.id; })[0];
      return rc&&(esCofre(rc.tipo)||/^oferta/.test(rc.tipo||''))?{id:x.id, usos:x.usos, nombre:rc.nombre}:null; }).filter(Boolean);
  }
  function sinAbrirHtml(r){
    var l=sinAbrir(r); if(!l.length||!motorNuevo()) return '';
    return '<div class="card botin-sinabrir"><p>🎁 <b>Tienes '+(l.length===1?'algo':'cosas')+' sin abrir</b></p><div class="sa-lista">'
      +l.map(function(x){ return '<button type="button" class="btn primary" data-abrirpend="'+esc(x.id)+'" data-usos="'+x.usos+'">Abrir: '+esc(x.nombre)+'</button>'; }).join('')
      +'</div></div>';
  }

  /**
   * LOS ADORNOS COMPRADOS: título, marco y fondo de planeta.
   *
   * 🔴 Esto existe porque Norberto compró los tres y «no ha tenido ningún efecto». Sus
   * descripciones decían «elígelo en el formulario», que era el flujo del sistema VIEJO. Con el
   * motor nuevo no hay formulario: tres de las diez recompensas de la tienda cobraban créditos y no
   * hacían nada. La ficha ya sabía pintarlos; faltaba dónde elegirlos.
   *
   * Solo aparece lo que se ha comprado — enseñar un selector de algo que no tienes es una tienda
   * disfrazada de ajustes.
   */
  function adornos(){
    var r=st.yo; if(!r||!motorNuevo()) return '';
    var comprados=r.canjeados||{};
    var tieneTit=(comprados['Título de recluta']||0)>0;
    var tieneFon=(comprados['Fondo de ficha: tu planeta']||0)>0;
    var tieneMar=(comprados['Marco dorado del avatar']||0)>0;
    if(!tieneTit&&!tieneFon&&!tieneMar) return '';

    var partes='';
    if(tieneTit){
      partes+='<div class="ad-uno"><b>🏷️ Tu título</b>'
        +'<p class="small muted">Se lee bajo tu alias, en tu ficha y en el tablero.</p>'
        +'<div class="ad-fila"><input id="ad-titulo" maxlength="40" value="'+esc(r.titulo||'')+'" '
        +'placeholder="La que no se rinde" autocomplete="off">'
        +'<button class="btn min" type="button" data-adorno="titulo">Ponérmelo</button></div></div>';
    }
    if(tieneFon){
      // 🔴 Los OCHO planetas, siempre. Preguntó: «respecto al planeta, ¿debería poder elegir?».
      // Sí, y además poder cambiarlo cuando quiera: se compra una vez y se lleva el que apetezca,
      // como las skins. Comprarlo otra vez no tendría sentido — el tope de la tienda es 1.
      var ops=PLAN.map(function(p){
        return '<button type="button" class="ad-pl'+(r.fondo===p[1]?' on':'')+'" data-fondo="'+esc(p[1])+'" '
          +'title="'+esc(p[1])+'"><img loading="lazy" src="assets/img/planetas/'+p[0]+'.png'+(window.SG_IMGV||'')+'" alt="">'
          +'<span>'+esc(p[1])+'</span></button>';
      }).join('');
      partes+='<div class="ad-uno"><b>🌌 El fondo de tu ficha</b>'
        +'<p class="small muted">Elige cuál de los ocho llevas detrás. Puedes cambiarlo cuando quieras.</p>'
        +'<div class="ad-planetas">'+ops
        +'<button type="button" class="ad-pl ad-nada'+(r.fondo?'':' on')+'" data-fondo=""><span>Sin fondo</span></button>'
        +'</div></div>';
    }
    if(tieneMar){
      var puesto=r.marco==='oro';
      partes+='<div class="ad-uno"><b>🖼️ El marco dorado</b>'
        +'<p class="small muted">Enmarca tu avatar en tu ficha y en el tablero.</p>'
        +'<div class="ad-fila"><button class="btn'+(puesto?' primary':' min')+'" type="button" '
        +'data-marco="'+(puesto?'':'oro')+'">'+(puesto?'✓ Puesto — quitármelo':'Ponérmelo')+'</button></div></div>';
    }
    return '<details class="cajon" open><summary><b>✨ Tus adornos</b> '
      +'<span class="cnt">lo que has comprado</span></summary>'
      +'<div class="ad-grid">'+partes+'</div></details>';
  }

  /**
   * 15-sep (noche) · LOS LOGROS DE A BORDO. Norberto: «algo que implique ver un progreso por parte del
   * estudiante» y, de premio a todos, «un avatar y una carta personalizada, especial, legendaria».
   * Cinco cubiertas de la Nave con sus hitos (la PRIMERA vez que se hace cada cosa); cada cubierta, su
   * premio; las cinco, el Contramaestre. Lo apunta el servidor (`stargateHitos`) mirando los datos: aquí
   * solo se enseña, y lo que falta dice qué hacer y lleva adonde se hace.
   */
  function hitosDe(r){ return (r&&r.hitos)||{}; }
  function nHitos(r){ var h=hitosDe(r); return AB.hitos.filter(function(x){ return h[x.clave]; }).length; }
  function esContramaestre(r){ return !!((r&&r.cubiertas)||{}).todo; }
  function premioTexto(p){ p=p||{}; return p.tipo==='sobre'?'un sobre de cromos':p.tipo==='capsula'?'una cápsula de rescate (un héroe al azar)':(p.n||0)+' ◈'; }
  function fechaCorta(ms){ if(!ms) return ''; var f=new Date(Number(ms)); return f.getDate()+'/'+(f.getMonth()+1); }
  /** La carta del Contramaestre con TU alias escrito en el hueco del nombre (misma letra y sitio que las demás). */
  function cartaABordo(alias, cls){
    var c=AB.carta||{}, n=String(alias||'').toUpperCase();
    return '<div class="ab-carta'+(cls?' '+cls:'')+'"><img src="assets/img/tarjetas/'+esc(c.clave)+'_carta.png'+CARDV+'" alt="'+esc((c.nombre||'')+(n?' · '+n:''))+'">'
      +'<span class="ab-nombre" style="--ab-l:'+Math.max(5,n.length)+'">'+esc(n)+'</span></div>';
  }
  function aBordo(){
    // (se presentan en la semana 9 —en PUA, la 7—, capítulo c9: antes se apuntan en silencio y aquí no sale nada)
    var r=st.yo; if(!r||!motorNuevo()||!AB.hitos.length||!abierto('logros')) return '';
    var h=hitosDe(r), cub=r.cubiertas||{}, dias=r.dias||{}, n=nHitos(r), ley=esContramaestre(r);
    var cubs=AB.cubiertas.map(function(c){
      var suyos=AB.hitos.filter(function(x){ return x.cubierta===c.clave; });
      var hechos=suyos.filter(function(x){ return h[x.clave]; }).length, llena=hechos===suyos.length;
      return '<div class="ab-cub'+(llena?' llena':'')+'"><div class="ab-cab"><b>'+esc(c.nombre)+'</b><span>'+esc(c.sub)+'</span>'
        +'<em>'+(llena?'✓ ':'')+hechos+' / '+suyos.length+'</em></div>'
        +'<ul class="ab-hitos">'+suyos.map(function(x){
          var ya=h[x.clave];
          return '<li class="ab-h'+(ya?' hecho':'')+'"><span class="ab-i" aria-hidden="true">'+x.icono+'</span>'
            +'<div class="ab-t"><b>'+esc(x.titulo)+'</b><span>'+esc(x.que)+'</span></div>'
            +(ya?'<em class="ab-ok" title="Conseguido el '+fechaCorta(ya)+'">✓ '+fechaCorta(ya)+'</em>'
                :(x.donde&&tabVisible(x.donde)?'<button type="button" class="btn min" data-tab="'+esc(x.donde)+'">Ir</button>':''))+'</li>';
        }).join('')+'</ul>'
        +'<p class="ab-premio">🎁 '+(cub[c.clave]?'<b>Premio recibido:</b> '+esc(premioTexto(c.premio)):'Al completarla: <b>'+esc(premioTexto(c.premio))+'</b>')+'</p></div>';
    }).join('');
    var HN={}; (window.SG_HEROES||[]).forEach(function(x){ HN[x[0]]=x[1]; });
    var heroes=(AB.heroes||[]).map(function(k){
      return '<img src="assets/img/heroes/'+esc(k)+(ley?'':'_bloqueado')+'.jpg" alt="'+esc(ley?(HN[k]||''):'Sin descubrir')+'">'; }).join('');
    var leyenda='<div class="ab-leyenda'+(ley?' ganada':'')+'">'
      +(ley?'<button type="button" class="ab-carta-btn" id="ab-carta" aria-label="Ver tu carta en grande">'+cartaABordo(r.alias)+'</button>'
           :'<div class="ab-carta oculta" aria-hidden="true"><img src="assets/img/tarjetas/'+esc((AB.carta||{}).clave)+'_carta.png'+CARDV+'" alt=""><span class="ab-q">?</span></div>')
      +'<div class="ab-ley-t"><div class="eyebrow amber">'+(ley?'Ya es tuyo':'El premio de las cinco cubiertas')+'</div><h3>Contramaestre de la Nave</h3>'
      +(ley?'<p>NEBULA te ha nombrado <b>Contramaestre</b>: conoces cada rincón de la Nave. El héroe legendario, en sus dos versiones, ya está en tu vestuario —ponte el que quieras— y esta carta lleva tu nombre.</p>'
           :'<p>Completa las cinco y NEBULA te nombra <b>Contramaestre</b>: un <b>héroe legendario</b> —en dos versiones, él y ella, y eliges cuál llevar— que no sale en ninguna cápsula, y una <b>carta legendaria con tu alias</b>. No se compra, no se regala y no se cambia en el Zoco.</p>')
      +'<div class="ab-heroes">'+heroes+'</div></div></div>';
    var diasTxt=dias.total?'<p class="ab-dias">🔥 Llevas <b>'+(dias.racha||0)+'</b> día'+(dias.racha===1?'':'s')+' seguido'+(dias.racha===1?'':'s')+' a bordo'
      +((dias.mejor||0)>(dias.racha||0)?' (tu mejor racha: '+dias.mejor+')':'')+' y <b>'+dias.total+'</b> en total. Cuenta una visita al día.</p>':'';
    return '<details class="cajon a-bordo" id="a-bordo"><summary><b>🎖️ Logros de a bordo</b> <span class="cnt">'+n+' / '+AB.hitos.length+'</span>'
      +(ley?' <span class="chip ok">🌟 Contramaestre</span>':'')+'</summary>'
      +'<p class="small muted">La <b>primera vez</b> que haces cada cosa en la Nave. Se apuntan solos. Cada cubierta completa trae su premio, y las cinco, el <b>Contramaestre de la Nave</b>.</p>'
      // (el Contramaestre, como sexta casilla: ocupa el hueco que dejan cinco cubiertas en tres columnas)
      +diasTxt+'<div class="ab-cubiertas">'+cubs+leyenda+'</div></details>';
  }

  /**
   * LOS RETOS DE ESTA SEMANA, EN GRANDE.
   *
   * 🔴 Petición de Norberto y la pieza que faltaba: «lo que se puede conseguir, en grande, clicable
   * con ficha explicativa y paso a paso». Hasta ahora la Nave te decía qué semana era y te dejaba
   * buscar el reto entre veinte, en otra pestaña. Aquí están los dos o tres que tocan HOY, con lo
   * que dan a la vista y el botón de marcarlos dentro.
   *
   * El paso a paso sale de la explicación del catálogo partida por frases. No se escribe aparte:
   * duplicar el texto de un reto es garantizar que un día digan cosas distintas.
   *
   * Y debajo, una línea con lo que lleva sin registrar de semanas anteriores. Es el dato que más
   * mueve y hasta hoy no estaba en ninguna parte.
   */
  function creditosDeReto(id){
    var P=window.SG&&window.SG.PAQUETE, cat=window.SG_CATALOGO;
    var tipo=(st.d&&st.d.tipo)||'REGULAR';
    if(P&&P.creditosDe&&cat&&cat.creditos){ try{ return P.creditosDe({id:id},tipo,cat); }catch(e){} }
    // El motor viejo no carga el catálogo: se cae a los valores de siempre.
    var l=String(id).charAt(0);
    if(id==='A0') return 20;
    if(l==='X') return 100;
    if(l==='B') return tipo==='PUA'?55:50;
    return 20;
  }
  // La explicación de un reto, partida en pasos. Las frases cortas se pegan a la anterior: «Piénsalo
  // para aula invertida.» no es un paso, es una coletilla de la frase de antes.
  function pasosDeReto(txt){
    // 🔴 NADA DE LOOKBEHIND. `split(/(?<=\.)\s+/)` era lo natural, pero el lookbehind es ES2018 y
    // Safari no lo entendió hasta la 16.4: en un iPhone de hace tres años esto NO es un bucle que
    // falla, es un error de SINTAXIS que tumba el fichero entero — la Nave no cargaría. Y la Nave la
    // abren doscientos móviles cualesquiera. Se parte a mano, que funciona en todas partes.
    // 🔴 13-sep · «Graba un clip corto (máx. 60 s)…» salía partido en dos pasos: «(máx.» y «60 s)…».
    // No se corta dentro de un paréntesis, tras una abreviatura, ni si lo que sigue va en minúscula o
    // es un número (eso no es una frase nueva). Visto en la Nave con una cuenta real.
    var ABREV=/(?:^|[\s(])(máx|mín|aprox|ej|p\.\s?ej|pág|págs|núm|etc|vs|sr|sra|dr|dra|ud|uds|cap|fig|min|seg)\.$/i;
    var texto=String(txt||''), fr=[], act='', hondo=0;
    for(var i=0;i<texto.length;i++){
      var ch=texto[i]; act+=ch;
      if(ch==='(') hondo++; else if(ch===')'&&hondo>0) hondo--;
      if(ch==='.' && (i+1>=texto.length || /\s/.test(texto[i+1]))){
        var j=i+1; while(j<texto.length && /\s/.test(texto[j])) j++;
        var sig=texto[j]||'';
        var sigue=sig && (/[a-záéíóúñü0-9]/.test(sig));
        if(hondo>0 || sigue || ABREV.test(act)) continue;
        fr.push(act.trim()); act='';
      }
    }
    if(act.trim()) fr.push(act.trim());
    fr=fr.filter(Boolean);
    var out=[];
    fr.forEach(function(f){
      if(out.length && f.length<42) out[out.length-1]+=' '+f; else out.push(f);
    });
    return out;
  }
  /**
   * QUÉ TE LLEVAS, dicho con su nombre. La insignia ya se enseñaba, pero como una pegatina sin
   * explicar: una miniatura y un nombre propio («Bran Okafor») que no dice nada a quien aún no
   * conoce a Bran. La letra del identificador SÍ lo dice, y estaba ahí desde el principio sin usar.
   */
  var CLASE_PREMIO = {
    P: ["Recuperas a", "per"],      // los ocho de la tripulación perdida
    L: ["Recuperas a", "per"],      // los secundarios de su historia
    E: ["Insignia especial", "esp"],
    H: ["Hito", "hito"],
    R: ["Insignia", "ins"],
    S: ["Insignia secreta", "esp"]
  };
  /**
   * 🔴 LA INSIGNIA, EN GRANDE Y A LA DERECHA. Antes era una pegatina de 30 px al final de un montón
   * de texto, con media tarjeta en blanco debajo. Norberto: «hay mucho aire; la segunda mitad de la
   * caja debería ser la insignia en grande, así eliminamos aire y se ve claramente la recompensa».
   * Y es lo correcto: lo que mueve a hacer un reto es VER lo que te llevas — el personaje que
   * recuperas tiene cara, y a 30 px no se le ve.
   */
  function premioDeReto(claves){
    return (claves||[]).map(function(k){
      var c = CLASE_PREMIO[String(k).charAt(0)] || CLASE_PREMIO.R;
      return '<figure class="rs-trofeo '+c[1]+'">'
        +'<img loading="lazy" src="assets/img/insignias/'+k+'.png" alt="">'
        +'<figcaption><em>'+c[0]+'</em><b>'+esc(NOMBRES[k]||k)+'</b></figcaption></figure>';
    }).join('');
  }
  /**
   * CUÁNTA GENTE LO LLEVA YA. Sale del tablero, que trae el contador por reto y el número de
   * reclutas activos — nunca quién.
   *
   * 🔴 Se calla en dos casos, y los dos importan. Con menos de tres activos el porcentaje deja de
   * ser un dato y pasa a ser un dedo señalando: en un grupo de dos, «50 %» es «tu compañero sí y
   * tú no». Y con cero hechos tampoco se enseña: «0 %» no informa de nada y apaga las ganas de ser
   * el primero, que es justo lo contrario de lo que se busca.
   */
  function cuantosLoLlevan(id){
    var d=st.d||{}, act=Number(d.activos||0), n=Number((d.retos_n||{})[id]||0);
    if(act<3 || !n) return '';
    var pct=Math.round(n*100/act);
    return '<span class="rs-cuantos" title="'+n+' de '+act+' reclutas activos de tu grupo">'
      +'<svg viewBox="0 0 24 24" aria-hidden="true" width="13" height="13"><path fill="currentColor" '
      +'d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 1.6c-3 0-6 1.5-6 3.4V19h12v-3c0-1.9-3-3.4-6-3.4Z'
      +'M17 11.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Zm0 1.4c-.7 0-1.4.1-2 .3 1.2.8 2 1.8 2 3V19h4v-2.7'
      +'c0-1.6-2.5-2.9-4-2.9Z"/></svg>'
      +pct+'%</span>';
  }

  /**
   * LO QUE SE PUEDE HACER CON UN RETO YA REGISTRADO. Norberto, y es de las cosas más certeras que
   * ha dicho: «muchos estudiantes darán a completado solo por probar».
   *
   * Sin salida, ese clic es irreversible y cada duda acaba siendo un mensaje al docente. Con
   * salida, probar deja de dar miedo — y quien prueba, se queda.
   *
   * 🔴 Y la evidencia se puede pegar SIN cancelar. Antes, para añadir un enlace olvidado había que
   * deshacer la entrega y rehacerla: mover xp, créditos y puede que el nivel arriba y abajo por un
   * campo de texto.
   */
  function accionesDeHecho(id){
    if(!motorNuevo()) return '';
    // el enlace que ya entregó, a la vista y listo para cambiarlo (antes salía vacío: parecía perdido)
    var ya=((st.yo&&st.yo.evidencias)||{})[id]||'', los=enlacesDe(ya);
    var R=reflexionDe(id), mia=((st.yo&&st.yo.reflexiones)||{})[id]||'';
    return '<div class="rh">'
      +(R?'<div class="rf-caja rf-mia"><label class="rf-et" for="rfh-'+esc(id)+'">✍️ Tu reflexión <span class="rf-preg">'+esc(R.pide)+'</span></label>'
        +'<textarea class="rh-rf rf-txt" id="rfh-'+esc(id)+'" data-rfh="'+esc(id)+'" rows="5" maxlength="2000" placeholder="Escríbela aquí: al menos '+R.min+' letras">'+esc(mia)+'</textarea>'
        +'<div class="rf-pie"><span class="rf-n'+(mia.length>=R.min?' ok':'')+'" data-rfn-min="'+R.min+'">'+mia.length+' / '+R.min+'</span>'
        +'<button class="btn min" type="button" data-guardarf="'+esc(id)+'">'+(mia?'Guardar cambios':'Guardar mi reflexión')+'</button></div></div>':'')
      +(los.length?'<p class="rh-ya">🔗 '+(los.length>1?'Tus enlaces: ':'Tu enlace: ')+los.map(function(u){
          return '<a href="'+esc(/^https?:\/\//i.test(u)?u:'https://'+u)+'" target="_blank" rel="noopener">'+esc(u.replace(/^https?:\/\//,'').slice(0,60))+'</a>'; }).join(' · ')+'</p>':'')
      +'<div class="rh-ev"><input class="rh-in" data-evid="'+esc(id)+'" type="text" inputmode="url" value="'+esc(ya)+'" '
        +'placeholder="Enlace de tu evidencia (si son dos, sepáralos con un espacio)" autocomplete="off">'
      +'<button class="btn min" type="button" data-guardaev="'+esc(id)+'">'+(ya?'Cambiar enlace':'Guardar enlace')+'</button></div>'
      +'<button class="btn min rh-desHacer" type="button" data-deshacer="'+esc(id)+'">'
      +'↩︎ No lo he hecho todavía</button>'
      +'<p class="rh-nota">Cancelar devuelve los xp y los créditos de este reto. Si ya los has '
      +'gastado, tu saldo puede quedarse a cero.</p></div>';
  }

  /**
   * 🔴 15-sep · LA TARJETA DE UN RETO, UNA SOLA. Norberto, de «Qué hay que hacer, explicado»: «esta visión de los retos es
   * muy fea, no hay imágenes, no se ve la insignia… debería ser exactamente lo mismo que lo que aparece en "Lo que puedes
   * conseguir esta semana"». Ahora las dos vistas pintan esta misma tarjeta: el premio y la insignia a la vista, «Cómo se
   * hace» al desplegarla y el botón de marcarlo dentro.
   *
   * Y «💡 Ver un ejemplo» (Norberto: «es lo que más les ayuda»), SOLO en los retos que tengan uno (SG_EJEMPLOS, de
   * _site_data.py → EJEMPLOS_RETOS): un enlace sale como botón en la tarjeta; un texto, dentro, con los pasos.
   */
  /**
   * 15-sep · LO QUE AYUDA A HACERLO, donde se hace. Norberto, de A0: «mete el gif de cómo compartir la publicación en
   * padlet, y añade el enlace al Padlet que se genera al crear el grupo». A3 (un Genially), el de compartir un Genially.
   */
  var GIF_RETOS = { A0: ["compartir-padlet.gif", "¿Cómo copio el enlace de mi publicación en Padlet?"],
                    A3: ["compartir-genially.gif", "¿Cómo comparto mi Genially?"] };
  function extraReto(id, d){
    var out='', g=GIF_RETOS[id];
    if(id==='A0' && d.padlet) out+='<p class="rs-extra"><a class="btn min" href="'+esc(d.padlet)+'" target="_blank" rel="noopener">🧱 Abrir el padlet de tu clase ↗</a></p>';
    if(g) out+='<details class="rs-gif"><summary>'+esc(g[1])+'</summary><img src="assets/img/ayuda/'+g[0]+'" alt="'+esc(g[1])+'" loading="lazy"></details>';
    return out;
  }
  function tarjetaReto(t, mios){
    var r=st.yo||{}, d=st.d||{}, AY=window.SG_AYUDA_RETOS||{};
    var ya=!!mios[t[0]], pasos=pasosDeReto(AY[t[0]]);
    var cuando=ya&&r.retos_fecha&&r.retos_fecha[t[0]]?' · '+fecha(r.retos_fecha[t[0]]):'';
    var gancho=(window.SG_GANCHO_RETOS||{})[t[0]]||'';
    var ej=(window.SG_EJEMPLOS||{})[t[0]]||null, ejUrl=ej&&ej.enlace?(/^https?:\/\//i.test(ej.enlace)?ej.enlace:'https://'+ej.enlace):'';
    /**
     * 🔴 16-sep · LOS RELÁMPAGO (L*) SE VEN DISTINTOS, y lo importante no es el rayo: es la frase
     * «se hace en clase». Norberto: «me gusta mucho que los relámpago se animen a hacer en clase, así
     * los que vienen se lo llevan hecho; hagamos hincapié en esto». El que no pueda venir lo tiene
     * abierto igual — no se castiga a quien esa noche trabajaba—, pero quien viene sale con él hecho.
     */
    var rel = t[0].charAt(0) === 'L';
    return '<details class="reto-sem'+(ya?' hecho':'')+(rel?' relampago':'')+'">'
      +'<summary><div class="rs-cab"><span class="chip '+(ya?'ok':'pend')+'">'
        +(ya?'✓ Registrado'+cuando:'Pendiente')+'</span>'
        +(rel?'<span class="chip rel">⚡ En clase · 10-15 min</span>':'')
        +cuantosLoLlevan(t[0])
        +'<span class="small muted">'+esc(t[0])+'</span></div>'
      +'<div class="rs-cols"><div class="rs-izq">'
        +'<b class="rs-tit">'+esc(t[1])+'</b>'
        +(gancho?'<p class="rs-gancho">'+esc(gancho)+'</p>':'')
        +'<div class="rs-premio"><span class="p xp">+'+t[3]+' xp</span>'
          +'<span class="p cr">+'+creditosDeReto(t[0])+' ◈</span>'
          +(ejUrl?'<a class="rs-ej" href="'+esc(ejUrl)+'" target="_blank" rel="noopener">💡 Ver un ejemplo ↗</a>':'')+'</div>'
        +'<div class="rs-abrir">▾ '+(ya?'Ver lo que pedía':'Cómo se hace, paso a paso')+'</div>'
      +'</div><div class="rs-der">'+premioDeReto(t[2])+'</div></div></summary>'
      +'<div class="rs-detalle">'
      +(pasos.length?'<ol class="rs-pasos">'+pasos.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol>'
                    :'<p class="small muted">Sin explicación todavía: pregunta a tu docente.</p>')
      +(ej&&ej.texto?'<p class="rs-ej-txt">💡 <b>Un ejemplo:</b> '+esc(ej.texto)+(ejUrl?' <a href="'+esc(ejUrl)+'" target="_blank" rel="noopener">Verlo ↗</a>':'')+'</p>':'')
      +extraReto(t[0], d)
      +(ya?'<p class="rs-ok">✓ Ya lo tienes registrado.</p>'+accionesDeHecho(t[0])
          // 15-sep · S7 es el Escape UNI: su puerta, y se registra solo con el botón del final del escape
          // 16-sep · el reto A6 no se marca: se GANA al Simulador de Joran (batalla.html)
          :(t[0]===(BT.reto||'A6')&&motorNuevo())
            ? '<div class="rs-marcar rs-batalla"><a class="btn epico" href="batalla.html?per='+esc(per)+'"><span class="ep-luz"></span><span class="ep-txt">⚔️ Enfréntate al Simulador de Joran</span></a>'
              +'<p class="small muted">No hay nada que entregar: se registra solo si le ganas. Y si pierdes, cada derrota lo cansa.</p></div>'
          :(t[0]==='S7'&&window.SG_ESCAPE_UNI)
            ? '<div class="rs-marcar rs-escape"><a class="btn epico" href="'+esc(window.SG_ESCAPE_UNI)+'" target="_blank" rel="noopener"><span class="ep-luz"></span><span class="ep-txt">🗝️ Entrar en el Escape UNI</span></a>'
              +'<p class="small muted">Se registra solo, con el botón del final del escape.</p></div>'
          :(motorNuevo()
            ? '<div class="rs-marcar">'+campoReflexion(t[0],'rs-rf')+campoEvidencia(t[0],'rs-ev')
              +'<button class="btn primary" type="button" data-hecho="'+esc(t[0])+'">✅ Lo he hecho</button></div>'
            : (d.formBitacora?'<p style="margin-top:12px"><a class="btn primary" href="'+esc(d.formBitacora)+'" target="_blank" rel="noopener">Marcarlo en la Bitácora →</a></p>':'')))
      +panelTripulacion(t[0])
      +'</div></details>';
  }

  function retosDeLaSemana(){
    var r=st.yo, d=st.d; if(!r||st.estado==='antes') return '';
    var RET=(window.SG_RETOS||{})[(d&&d.tipo)||'REGULAR']||[];
    var AY=window.SG_AYUDA_RETOS||{};
    var lista=st.semanas||[]; if(!lista.length||!RET.length) return '';
    var sm=lista[Math.min(Math.max(st.actual,1),lista.length)-1]; if(!sm) return '';
    var mios={}; ((r.retos)||[]).forEach(function(k){mios[k]=true;});

    // Qué retos entran esta semana: los del tema de la semana que NO entraron en una semana anterior.
    // Se deduce del calendario, que es quien sabe cuándo abre cada tema.
    var antes={};
    lista.forEach(function(x){ if(x.sem<sm.sem) RET.forEach(function(t){ if(t[4]===x.tema_n) antes[t[0]]=true; }); });
    var suyos=RET.filter(function(t){ return t[4]===sm.tema_n && !antes[t[0]]; });
    if(!suyos.length) suyos=RET.filter(function(t){ return t[4]===sm.tema_n; });
    if(!suyos.length) return '';

    var tarjetas=suyos.map(function(t){ return tarjetaReto(t, mios); }).join('');

    // Los atrasados: lo abierto que todavía no ha registrado, sin contar los de esta semana.
    var deEstaSemana={}; suyos.forEach(function(t){ deEstaSemana[t[0]]=true; });
    var atrasados=RET.filter(function(t){
      if(mios[t[0]]||deEstaSemana[t[0]]) return false;
      var s1=lista.filter(function(x){return x.tema_n===t[4];})[0];
      return s1 && s1.sem<=st.actual;
    }).length;

    // 🔴 El titular dice lo que te llevas, no el tema. El tema ya lo dice la tarjeta de justo
    // encima («La orden de la semana») y repetirlo dos veces seguidas no informaba de nada. Aquí
    // la pregunta es otra: ¿me merece la pena abrir esto? Pues el botín que queda por coger.
    var quedanXp=0, quedanCr=0, quedan=0;
    suyos.forEach(function(t){ if(!mios[t[0]]){ quedan++; quedanXp+=t[3]; quedanCr+=creditosDeReto(t[0]); } });
    var titular = quedan
      ? 'Te quedan '+quedanXp+' xp y '+quedanCr+' ◈ por coger'
      : '✓ Ya tienes todo lo de esta semana';
    return '<div class="card retos-semana"><div class="eyebrow amber">Lo que puedes conseguir esta semana</div>'
      +'<h3>'+esc(titular)+'</h3>'
      +'<p class="small muted">'+(suyos.length===1?'Un reto':suyos.length+' retos')+' de '+esc(sm.tema)
      +'. Pulsa uno para ver qué hay que hacer, y márcalo aquí mismo cuando lo tengas.</p>'
      // filas llenas: con 4 retos, dos y dos (de tres en tres quedaba uno solo en la segunda fila)
      +'<div class="rs-grid'+(suyos.length===4?' par':'')+'">'+tarjetas+'</div>'
      +(atrasados?'<p class="rs-atras">🕗 Y llevas <b>'+atrasados+'</b> reto'+(atrasados===1?'':'s')
        +' sin registrar de semanas anteriores. '
        +'<button class="btn small" type="button" data-tab="retos">Verlos en Mis retos →</button></p>':'')
      +'</div>';
  }

  /**
   * 🔴 13-sep · LO QUE LLEVAS, EN CUATRO CIFRAS. Debajo de la barra la ficha se quedaba en blanco
   * (la orden de la semana, a su lado, es más alta) y ese hueco era justo el «aire» del que se quejaba
   * Norberto. En vez de rellenarlo, se le da trabajo: lo que el recluta ha ganado, de un vistazo, y
   * cada cifra lleva a su sitio. Nada inventado: son los mismos datos de «Mi botín» y «Mis retos».
   */
  function cifrasDeBitacora(r){
    var tengo=r.cromos||{}, nCr=CROMOS.filter(function(c){return tengo[c[0]];}).length;
    var nRet=((r.retos||[]).filter(function(k){return /^[ABXS]\d/.test(k);})).length;
    function c(tab,num,de,que,tit){
      return '<button type="button" class="nc" data-tab="'+tab+'" title="'+tit+'"><b>'+num+(de?'<small>/'+de+'</small>':'')+'</b><span>'+que+'</span></button>';
    }
    return '<div class="nave-cifras">'
      +c('retos',nRet,'','reto'+(nRet===1?'':'s')+' hecho'+(nRet===1?'':'s'),'Ver tus retos')
      +c('botin',(r.insignias||[]).length,BADGES.length,'insignias','Ver tus insignias')
      +(CROMOS.length?c('botin',nCr,CROMOS.length,'cromos','Ver tu álbum de cromos'):'')
      +c('rankings',r.pos||'—','','puesto','Ver el tablero')
      // 15-sep (noche) · y los logros de a bordo: lleva a su cajón de «Mi botín», ya abierto
      +(AB.hitos.length&&motorNuevo()&&abierto('logros')?'<button type="button" class="nc" id="nc-ab" title="Ver tus logros de a bordo"><b>'+nHitos(r)
        +'<small>/'+AB.hitos.length+'</small></b><span>'+(esContramaestre(r)?'🌟 logros':'logros')+'</span></button>':'')
      +'</div>';
  }

  function personaje(){
    if(st.cargandoYo) return '<div class="card">'+cargando('Contactando con NEBULA…','Buscándote en el registro de la tripulación')+'</div>';
    // 30-ago · el login ya NO vive aquí: es lo primero de la página (ver login() y el orden de
    // render). La ficha sin identificar solo apunta hacia arriba.
    // 9-sep · INALCANZABLE desde que la Nave nace cerrada: sin identificar, render() no llama a
    // contenido(). Se queda como red de seguridad, pero SIN el texto viejo, que decia «las demas
    // pestañas funcionan sin identificarse» — y desde hoy no funciona ninguna. Un cartel que miente
    // es peor que no tener cartel.
    if(!st.yo) return '';
    var r=st.yo, d=st.d, SG=window.SG||{};
    var av=SG.avatarImg?SG.avatarImg(r.avatar,r.alias,'grande'+(r.marco==='oro'?' marco-oro':''),r.xp,d.tipo):'';
    // NIVEL (xp, solo suben) y CRÉDITOS (lo único que se gasta)
    var ni=SG.nivelInfo?SG.nivelInfo(r.xp,d.tipo):{nivel:1,rango:1,rangoNombre:'Recluta',titulo:'',pct:0,faltan:0,siguiente:null,evo:null};
    var rg=ni.rango;
    var cred=(r.creditos!=null?r.creditos:(r.xp_disponibles!=null?r.xp_disponibles:0));
    /**
     * 🔴 13-sep · LA BARRA DICE LO JUSTO; EL DETALLE, AL PASAR POR ENCIMA. Norberto: «no hace falta
     * tanta info: "te faltan 300 xp para el nivel 7 · tu personaje evoluciona a Comandante al llegar
     * al nivel 8". Quizá un texto flotante al poner el ratón sobre la barra». La barra es enfocable
     * (se abre también con el teclado y con un toque en el móvil), y a su lado solo el número que
     * importa.
     */
    var barra=ni.siguiente
      ?'<div class="barra-nivel" tabindex="0" role="img" aria-label="'+ni.faltan+' xp para el nivel '+(ni.nivel+1)+'">'
        +'<div class="progress"><i style="width:'+ni.pct+'%"></i></div>'
        +'<span class="bn-tip"><b>'+ni.faltan+' xp</b> para el nivel '+(ni.nivel+1)
        +(ni.evo?'<br>Tu personaje evoluciona a <b>'+esc(ni.evo.rango)+'</b> en el nivel '+ni.evo.nivel:'')+'</span>'
        +'<span class="bn-lado">nivel '+(ni.nivel+1)+' en <b>'+ni.faltan+'</b> xp</span></div>'
      :'<p class="small muted">Nivel máximo: <b>'+esc(ni.titulo)+'</b>. Has hecho el viaje entero. 🫡</p>';
    // 30-ago · cada insignia se abre en grande con su ficha (planeta y qué hay que hacer para
    // ganarla) — el modal ya existía en la web; aquí solo se cablea. Las pendientes también: ver
    // qué pide una insignia que no tienes es la mejor gasolina.
    // fondo de ficha: su planeta elegido
    var PLK={}; PLAN.forEach(function(p){PLK[p[1]]=p[0];});
    var estiloFicha=r.fondo&&PLK[r.fondo]?' style="background-image:linear-gradient(rgba(10,16,26,.82),rgba(10,16,26,.9)),url(assets/img/planetas/'+PLK[r.fondo]+'.png);background-size:cover;background-position:center"':'';
    // 29-ago · el personaje se abre en grande al pulsarlo. Es la imagen que el recluta ha elegido y
    // la que evoluciona con su nivel: verla del tamaño de un pulgar era desaprovecharla. Reusa la
    // misma lupa que las cartas, así que ya trae fondo, Escape, foco y botón de cerrar.

    return '<div class="grid cols-2 nave-estado"><div class="card"'+estiloFicha+'><div class="nave-perfil">'
      +'<button type="button" class="av-lupa" id="btn-av" title="Pulsa para verte en grande" aria-label="Ampliar tu personaje">'+av+'</button>'
      +'<div><h3>'+(r.corona?'👑 ':'')+esc(r.alias)+(r.racha>=3?' <span class="chip-racha" title="Semanas seguidas registrando algo">🔥 '+r.racha+'</span>':'')+'</h3>'
      +(r.titulo?'<div class="titulo-recluta">«'+esc(r.titulo)+'»</div>':'')
      +'<p class="small"><b>Nivel '+ni.nivel+' · '+esc(ni.rangoNombre)+'</b>'+(ni.titulo&&ni.titulo!==ni.rangoNombre?' <span class="muted">('+esc(ni.titulo)+')</span>':'')+' · puesto '+r.pos+(r.planeta&&r.planeta!=='—'?' · planeta '+esc(r.planeta):'')+(r.corona?' · <b>corona semanal</b>':'')+'</p>'
      +'<p class="monedas"><span class="m xp" title="Los xp no se gastan nunca: marcan tu nivel y hacen evolucionar a tu personaje."><b>'+r.xp+'</b> xp</span>'
      +'<span class="m cred" title="Los créditos son la moneda de misión: es lo único que se descuenta al canjear recompensas."><b>'+cred+'</b> ◈ créditos</span></p>'
      // (lo de «los xp solo suben, los créditos se gastan» ya lo dicen las dos pastillas al pasar por
      // encima: repetido debajo era una línea de relleno. Y «sin biografía todavía», también.)
      +'</div></div>'+barra
      +cifrasDeBitacora(r)
      +(r.bio?'<blockquote class="nave-bio">'+esc(r.bio)+'</blockquote>':'')
      +'</div>'
      // Al lado de tu ficha, lo que toca ESTA semana. Es lo único que caduca de toda la pantalla, y
      // por eso es lo que merece el sitio bueno — la colección no cambia porque abras la Nave.
      +ordenDeLaSemana()+'</div>'
      +cine()
      // 🔴 EL ORDEN DE ESTA PANTALLA, y no es casual:
      //   1 · quién eres y qué toca        (lo que caduca)
      //   2 · los retos de la semana       (lo que se puede hacer HOY)
      //   3 · los planetas, embebido       (a dónde ir a por el material)
      //   4 · el duelo                     (una frase que empuja)
      // Lo que es colección se ha ido entero a «Mi botín».
      +diplomaCaja()
      +votacionCaja()
      +retosDeLaSemana()
      +simuladorCaja()
      +panelEmbebido()
      +duelo();
  }

  // ================= EL DIPLOMA (16-sep) =================
  // Norberto: «al finalizar la gamificación… un diploma con el alias del jugador, su nombre real, insignias completadas,
  // porcentajes… un mensaje final del comandante y NEBULA. Puede ser el broche de oro». Sale cuando el viaje se acaba
  // (la semana de canje): antes no significaría nada. Se dibuja y se descarga en `diploma.html`.
  function diplomaCaja(){
    if(!motorNuevo()||!st.yo||st.estado!=='fin') return '';
    return '<div class="card dip-caja">'
      +'<div class="eyebrow amber">Fin del viaje</div>'
      +'<h3>📜 Tu diploma de la Tripulación Cero</h3>'
      +'<p class="small">Tu alias y tu nombre, tus insignias, tus cartas, tus héroes y todo lo que has recorrido, '
      +'firmado por tu Capitán. Se descarga como imagen y se puede imprimir.</p>'
      +'<p><a class="btn epico" href="diploma.html?per='+esc(per)+'"><span class="ep-luz"></span>'
      +'<span class="ep-txt">📜 Ver mi diploma</span></a></p></div>';
  }

  // ================= LA VOTACIÓN DEL AULA (16-sep) =================
  // Norberto: «cada docente puede publicar una votación para que respondan, la próxima semana se resuelve… y GamificaPro
  // tiene algo divertido: comprar voto extra». Aquí se vota; el recuento y el cobro del voto extra los hace el servidor
  // (`castVote`). Mientras está abierta NO se enseñan los resultados: si se ven, la gente vota a lo que va ganando.
  var VOTO = { v: null, mia: {}, cargada: false, pidiendo: false };
  var CFGV = window.SG_VOTACION || { voto_extra: 15, max_extra: 2 };
  function miFaccion(){
    var d=st.d||{}, yo=st.yo||{};
    var e=((d.escuadrones)||[]).filter(function(x){ return String(x.comandante||'')===String(yo.profe||''); })[0];
    return e ? e.id : '';
  }
  function cargarVotacion(){
    if(VOTO.cargada || VOTO.pidiendo || !motorNuevo() || SIMULACRO || enDemo() || !st.yo) return;
    var M=window.SG&&window.SG.MOTOR; if(!M||!M.votaciones) return;
    VOTO.pidiendo=true;
    M.votaciones(per).then(function(l){
      var mi=miFaccion();
      VOTO.v=(l||[]).filter(function(v){ return v.isActive && (!v.eligibleFactionId || v.eligibleFactionId===mi); })[0]||null;
      VOTO.cargada=true; VOTO.pidiendo=false;
      if(!VOTO.v) return render();
      return M.miPapeleta(per, VOTO.v.id, st.yo.ficha).then(function(p){ VOTO.mia=p||{}; render(); });
    }).catch(function(){ VOTO.cargada=true; VOTO.pidiendo=false; });
  }
  function votacionCaja(){
    if(!motorNuevo()||!st.yo) return '';
    if(!VOTO.cargada){ setTimeout(cargarVotacion, 300); return ''; }
    var v=VOTO.v; if(!v) return '';
    var dados=Object.keys(VOTO.mia).reduce(function(n,k){ return n+Number(VOTO.mia[k]||0); },0);
    var gratis=Number(v.votesPerPerson||1), extra=Number(v.costPerVote||0), tope=Number(v.maxPaidVotesPerPerson||0);
    var pagados=Math.max(0, dados-gratis), puedePagar=extra>0 && pagados<tope;
    var creditos=Number((st.yo.creditos!=null?st.yo.creditos:st.yo.xp_disponibles)||0);
    var mio=Object.keys(VOTO.mia).filter(function(k){ return VOTO.mia[k]>0; });
    return '<div class="card voto-caja">'
      +'<div class="eyebrow amber">La voz de la tripulación'+(v.stargateProfe?' · '+esc(v.stargateProfe):'')+'</div>'
      +'<h3>🗳️ '+esc(v.title)+'</h3>'
      +(dados
         ? '<p class="small">Ya has votado'+(mio.length?': <b>'+esc(((v.options||[]).filter(function(o){return o.id===mio[0];})[0]||{}).title||'')+'</b>':'')
           +'. '+(v.stargateResuelve?'Se resuelve en la semana '+v.stargateResuelve+'.':'Se resuelve la semana que viene.')+'</p>'
         : '<p class="small muted">Vota una opción. '+(v.stargateResuelve?'Se resuelve en la semana '+v.stargateResuelve+'.':'Se resuelve la semana que viene.')+'</p>')
      +'<div class="voto-ops">'+(v.options||[]).map(function(o){
          var mia=Number(VOTO.mia[o.id]||0);
          return '<button type="button" class="voto-op'+(mia?' mio':'')+'" data-voto="'+esc(o.id)+'"'
            +((dados>=gratis && !puedePagar)?' disabled':'')+'>'+esc(o.title)+(mia>1?' <em>×'+mia+'</em>':'')+'</button>'; }).join('')
      +'</div>'
      +(dados>=gratis && puedePagar
         ? '<p class="small voto-extra">⚡ <b>Voto extra</b>: puedes votar otra vez por <b>'+extra+' ◈</b> ('
           +(tope-pagados)+' más como mucho'+(creditos<extra?'; te faltan créditos':'')+'). Pulsa la opción que quieras.</p>'
         : '')
      +'<p class="small muted voto-pie">Los resultados se enseñan en clase cuando se resuelva.</p></div>';
  }

  // ================= EL SIMULADOR DE JORAN (16-sep) =================
  // Norberto: «si el usuario gana desbloquea algo nuevo en su nave: el Simulador de Joran. Puede usarlo para repasar
  // los diferentes temas… habrá un ranking de cada tema y un modo en que entren todas las preguntas».
  // La batalla vive en su propia página (batalla.html), que también se embebe en los Geniallys; aquí está la puerta:
  // cerrada hasta que le gana (o hasta que NEBULA lo presenta, capítulo c11), abierta y con sus marcas después.
  var BT = window.SG_BATALLA || {};
  function ganoAJoran(){ return !!((st.yo && st.yo.simulador || {})[BT.clave || 'joran']); }
  function simuladorCaja(){
    if(!motorNuevo() || !st.yo) return '';
    var gano = ganoAJoran(), presentado = abierto('simulador');
    if(!gano && !presentado) return '';
    var S = st.yo.simulador || {}, marcas = S.marcas || {}, T = S.total || null;
    var mejores = Object.keys(marcas).sort(function(a, b){ return (marcas[b].p||0) - (marcas[a].p||0); }).slice(0, 3);
    return '<div class="card sim-caja' + (gano ? '' : ' cerrada') + '">'
      + '<img class="sim-em" src="assets/img/batalla/emblema.webp" alt="" width="84" height="84" loading="lazy">'
      + '<div class="sim-txt"><div class="eyebrow amber">' + (gano ? 'Desbloqueado' : 'Bloqueado') + '</div>'
      + '<h3>🎮 El Simulador de Joran</h3>'
      + '<p class="small">' + (gano
          ? 'Repasa tema a tema o con todas las preguntas del viaje, y mide tu marca contra la de tu tripulación.'
          : 'Gánale a <b>' + esc(BT.rival || 'RUTA AZUL') + '</b> en el reto ' + esc(BT.reto || 'A6') + ' y se queda en tu Nave para siempre.') + '</p>'
      + (gano && mejores.length ? '<p class="sim-marcas">' + mejores.map(function(m){
          return '<span>' + esc(m === 'todas' ? 'Todas' : 'T' + m.slice(1)) + ' <b>' + (marcas[m].p || 0) + '</b></span>'; }).join('') + '</p>' : '')
      + (gano && T ? '<p class="small muted">' + (T.batallas || 0) + ' batallas · ' + (T.aciertos || 0) + ' aciertos'
          + (T.aciertos ? ' · ' + (Math.round((T.ms / 1000) / T.aciertos * 10) / 10) + ' s por acierto' : '') + '</p>' : '')
      + '<p><a class="btn ' + (gano ? 'primary' : 'epico') + '" href="batalla.html?per=' + esc(per) + '">'
      + (gano ? '🎮 Entrenar' : '<span class="ep-luz"></span><span class="ep-txt">⚔️ Enfrentarte al simulador</span>') + '</a></p>'
      + '</div></div>';
  }
  /**
   * 🔴 EL RETO A6 SE REGISTRA SOLO. Si ganó en la página de la batalla y el reto no quedó registrado (cerró la
   * pestaña, se fue la wifi, o ya llevaba sus tres retos del día), la Nave lo registra al entrar. El servidor ya
   * sabe que le ganó —`completeMission` lo comprueba—, así que esto no regala nada: solo evita el «gané y no consta».
   */
  function comprobarBatalla(){
    if(!motorNuevo() || SIMULACRO || enDemo() || !st.yo || st.yo.congelado) return;
    var id = BT.reto || 'A6';
    if(!ganoAJoran() || ((st.yo.retos) || []).indexOf(id) >= 0) return;
    var tope = Number(window.SG_TOPE_DIA || 0);
    if(tope && registrosDeHoy() >= tope) return;
    var antes = JSON.parse(JSON.stringify(st.yo));
    post({accion:'registrar', per:per, reto:id, evidencia:'', reflexion:''}, function(){
      aviso('🏅 <b>Reto ' + esc(id) + ' registrado</b>: le ganaste al Simulador de Joran.');
      refrescarYCelebrar(antes, null, 'reto');
    }, function(){ /* si no se puede hoy (tope, red), se reintenta la próxima vez que entre */ });
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
    // v3.39 · los TRES rangos de la Rebelión, con nombre y probabilidad (petición de Norberto):
    // ⚔️ Resistencia (raras, 4% cada una · 56% del sobre) — el grueso del ejército, las primeras en caer
    // 🔥 Vanguardia (épicas, 3% · 36%) — van por delante, cuesta alcanzarlas
    // 🌟 Mito (legendarias, 2% · 8%) — nadie las ha visto: van en sombra hasta que caen
    var RANGO_HEROE={'rara':'⚔️ Resistencia','épica':'🔥 Vanguardia','epica':'🔥 Vanguardia','LEGENDARIA':'🌟 MITO'};
    var copias=yo.heroes_n||{};
    var verHeroes=abierto('heroes')||(yo.heroes||[]).length>0;
    // (el Contramaestre no se enseña, ni en sombra, hasta que NEBULA presenta los logros de a bordo)
    HER=HER.filter(function(h){ return (AB.heroes||[]).indexOf(h[0])<0 || abierto('logros') || mios[h[0]]; });
    var he=!verHeroes?'':HER.map(function(h){
      var tengo=!!mios[h[0]], nx=Number(copias[h[0]])||0;
      // 15-sep (noche) · el Contramaestre: solo se gana con los logros de a bordo (y no va al Zoco)
      var deABordo=(AB.heroes||[]).indexOf(h[0])>=0;
      var cel=celda('heroe:'+h[0], 'assets/img/heroes/'+h[0]+(tengo?'':'_bloqueado')+'.jpg',
        h[1], tengo?(deABordo?'🎖️ De a bordo':(RANGO_HEROE[h[3]]||h[3])):(deABordo?'logros de a bordo':'sin descubrir'), puesto==='heroe:'+h[0], tengo)
        // la burbuja con las copias, como las cartas del álbum
        .replace('</button>', nx>1?'<span class="nx" title="Tienes '+nx+'">×'+nx+'</span></button>':'</button>');
      // 13-sep · y un botón para ponerlo en el Zoco (pulsar el héroe sigue siendo ponérselo)
      return tengo&&!deABordo&&abierto('zoco')&&motorNuevo()
        ? '<div class="vest-caja">'+cel+'<button type="button" class="vest-zoco" data-zoco-poner="'+esc(per+'__heroe_'+h[0])+'" title="Poner en el Zoco" aria-label="Poner '+esc(h[1])+' en el Zoco">🔄</button></div>'
        : cel;
    }).join('');
    var n=(yo.heroes||[]).length, rh=Number(yo.heroes_repes)||0;
    var cambio = rh ? '<p class="repes'+(rh>=2?' listo':'')+'">🔁 Llevas <b>'+rh+'</b> héroe'+(rh===1?'':'s')+' repetido'+(rh===1?'':'s')
      +(rh>=2?' — cambia 2 por <b>un héroe nuevo al azar</b>. '
          +(motorNuevo()?'<button class="btn small primary" type="button" data-canje="heroe_repes" data-nombre="Cambiar 2 héroes repetidos" data-coste="0" data-tipo="heroe_repes" data-abrir="1" data-usos="1">Cambiar 2 repetidos →</button>':'')
          :': con 2, un héroe nuevo al azar.')+'</p>' : '';
    return '<section id="vestuario"><div class="eyebrow amber">Tu vestuario</div>'
      +'<h2>Ponte lo que quieras</h2>'
      +'<p class="lead">Las <b>skins</b> de tu personaje se desbloquean al subir de nivel, y los '
      +'<b>héroes</b> llegan en las <b>cápsulas</b> del Mercado (de rescate, de élite y la legendaria); el <b>Contramaestre</b>, solo con los logros de a bordo. Todo lo que tengas te lo pones '
      +'y te lo quitas cuando quieras, <b>gratis</b>.</p>'
      +'<h3 style="margin-top:1em">Tus skins <span class="small muted">'+skins.length+' de 5</span></h3>'
      +'<div class="vest-grid">'+sk+'</div>'
      +(verHeroes
        ? '<h3 style="margin-top:1.4em">Héroes de la Rebelión <span class="small muted">'+n+' de '+HER.length+'</span></h3>'
          +cambio+'<div class="vest-grid">'+he+'</div>'
        : '')
      +(d.formCanje?'<p style="margin-top:12px"><a class="btn small primary" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎭 Conseguir un héroe →</a></p>':'')
      +'</section>';
  }

  // v3.27 · EL PASE DE LISTA. Solo se ve mientras el docente tiene la ventana abierta. La consigna
  // NO llega hasta aqui: la tiene en su pantalla, y por eso hay que estar en la clase.
  /**
   * 🔴 LA LLAMADA A FILAS (12-sep) — el pase de lista, rehecho.
   *
   * El sistema viejo escondía una palabra de cuatro letras que el alumnado tecleaba. Aquí no hay
   * palabra: cuando tu Comandante toca llamada, el botón APARECE SOLO en tu Nave y desaparece al
   * cerrarse la ventana. La defensa no es un secreto, es el momento — tu docente la toca cuando
   * quiere y dura lo que él decida.
   *
   * Llega EN DIRECTO (una conexión a la escucha, no preguntar cada diez segundos: con 200 alumnos
   * eso serían 1.200 lecturas por minuto para enterarse tarde).
   */
  /**
   * 14-sep · LA CUENTA CONGELADA por su referente: entra y mira, pero no hace nada. El candado está
   * en el servidor; aquí solo se dice, arriba y sin que se pueda cerrar, para que nadie pulse cosas
   * pensando que la web está rota.
   */
  function avisoCongelado(){
    if(!st.yo||!st.yo.congelado||SIMULACRO) return '';
    return '<div class="card congelado-aviso" role="status"><p>🧊 <b>Tu referente ha congelado tu cuenta.</b> '
      +'Puedes mirar tu Nave, pero no registrar retos, comprar, fichar ni usar el Zoco hasta que la descongele. '
      +'Si crees que es un error, habla con tu Comandante.</p></div>';
  }
  function avisoPase(){
    var L=st.llamada;
    if(!L||!st.yo||st.yo.congelado) return '';
    /**
     * 🔴 12-sep · UNA LLAMADA DE OTRO ESCUADRÓN NO ES ASUNTO TUYO. Cada Comandante toca llamada para
     * SU escuadrón, y la Nave se la enseñaba a todo el grupo: el laboratorio simuló una clase y a
     * Carla —del otro Comandante— le salió «✋ Presente» en una llamada que no era la suya. Al
     * pulsar, el servidor le decía que no. Un botón que existe para decirte que no es un botón roto.
     * El recluta se ata a su escuadrón por el nombre de su Comandante (`profe`), que es la misma
     * llave que usan los rankings.
     */
    if(L.faccion){
      var e=((st.d&&st.d.escuadrones)||[]).filter(function(x){return x.id===L.faccion;})[0];
      if(e && st.yo.profe && e.comandante && e.comandante!==st.yo.profe) return '';
    }
    if(st.fichado) return '<div class="pase-nave hecho">✅ <b>Presente.</b> Ya estás en la lista de hoy.</div>';
    var seg=Math.max(0,Math.round((L.hasta-Date.now())/1000));
    return '<div class="pase-nave"><b>🔔 Llamada a filas</b>'
      +'<span class="small">'+esc(L.comandante||'Tu Comandante')+' ha tocado llamada'
      +(L.escuadron?' para <b>'+esc(L.escuadron)+'</b>':'')+'. Responde y te llevas <b>'
      +(L.xp||0)+' xp</b> y <b>'+(L.creditos||0)+' ◈</b>.</span>'
      +'<div class="pase-fila"><button class="btn primary" id="pase-ok" type="button">✋ Presente</button>'
      +'<span class="pase-cuenta" id="pase-cuenta">'+reloj(seg)+'</span></div>'
      +'<div class="small muted" id="pase-msg"></div></div>';
  }
  function reloj(seg){
    var m=Math.floor(seg/60), s2=seg%60;
    return 'quedan '+m+':'+(s2<10?'0':'')+s2;
  }
  /**
   * La escucha. Se monta una vez por visita y se deshace al salir: sin deshacerla, cambiar de grupo
   * dejaría conexiones vivas escuchando un grupo que ya no miras.
   */
  function vigilarLlamada(){
    if(!motorNuevo()||!per||st.paraVigilar) return;
    if(SIMULACRO) return;   // la llamada del simulacro la toca el botón de su barra, no la clase de verdad
    var M=window.SG&&window.SG.MOTOR; if(!M||!M.vigilarLlamada) return;
    // 15-sep · de las llamadas abiertas, la de SU escuadrón (o una para todo el grupo): si otro
    // Comandante tenía la suya abierta y era más reciente, este recluta se quedaba sin su «Presente»
    var deMiEscuadron=function(x){
      if(!x.restrictedFactionId) return true;
      var e=((st.d&&st.d.escuadrones)||[]).filter(function(y){return y.id===x.restrictedFactionId;})[0];
      return !(e && st.yo && st.yo.profe && e.comandante && e.comandante!==st.yo.profe);
    };
    st.paraVigilar = M.vigilarLlamada(per, function(sesion){
      // 🔴 13-sep · «no hay llamada» es null en los dos lados: antes, `undefined !== null` repintaba la
      // Nave entera con la PRIMERA respuesta aunque no hubiera llamada, y se comía lo que se escribía
      var antes = st.llamada ? st.llamada.id : null;
      st.llamada = sesion ? {
        id: sesion.id,
        hasta: (sesion.endTime && sesion.endTime.toDate ? sesion.endTime.toDate() : new Date(sesion.endTime)).getTime(),
        comandante: sesion.teacherDisplayName || '',
        escuadron: nombreEscuadron(sesion.restrictedFactionId),
        faccion: sesion.restrictedFactionId || '',
        xp: Number(sesion.pointsReward||15), creditos: Number(sesion.coinsReward||30)
      } : null;
      if((st.llamada ? st.llamada.id : null)!==antes){ st.fichado=false; render(); }
    }, deMiEscuadron);
    // La cuenta atrás se refresca sola. Cuando llega a cero, se repinta y el aviso desaparece.
    if(!st.relojLlamada) st.relojLlamada=setInterval(function(){
      if(!st.llamada) return;
      var seg=Math.round((st.llamada.hasta-Date.now())/1000);
      if(seg<=0){ st.llamada=null; render(); return; }
      var el=document.getElementById('pase-cuenta'); if(el) el.textContent=reloj(seg);
    },1000);
  }
  function nombreEscuadron(id){
    if(!id) return '';
    var e=((st.d&&st.d.escuadrones)||[]).filter(function(x){return x.id===id;})[0];
    return e?e.nombre:'';
  }
  /** Las cartas que tenía ANTES de este premio, contadas: {clave: n}. */
  function inventarioDe(yo){
    // el tablero da `cromos` como {clave: cuántas}; se copia para no tocar la ficha
    var src=(yo&&yo.cromos)||{}, n={};
    Object.keys(src).forEach(function(k){ n[k]=Number(src[k])||0; });
    // 🔴 13-sep · y los HÉROES: un héroe repetido se revelaba como nuevo (60 ◈ y ni un aviso)
    (yo&&yo.heroes||[]).forEach(function(k){ n[k]=Number((yo.heroes_n||{})[k])||1; });
    return n;
  }
  function marcaRepetida(c, tenia){
    var x = (window.SG.SOBRE && SG.SOBRE.normaliza) ? SG.SOBRE.normaliza(c) : c;
    x.repetida = !!tenia[x.clave]; tenia[x.clave]=(tenia[x.clave]||0)+1;
    return x;
  }
  function fichar(){
    var b=document.getElementById('pase-ok'), m=document.getElementById('pase-msg');
    if(!b||!st.yo||!st.yo.ficha) return;
    b.disabled=true; b.textContent='Registrando…';
    var antes=JSON.parse(JSON.stringify(st.yo)), donde=puntoDe(b);
    if(enDemo()){ b.disabled=false; b.textContent='✋ Presente';
      aviso('🎬 <b>Esto es una demostración.</b> En tu Nave de verdad, «Presente» te daría los créditos de la asistencia.'); return; }
    (SIMULACRO ? SG.FUENTE.fichar() : window.SG.MOTOR.ficharLlamada(per, st.yo.ficha)).then(function(r){
      st.fichado=true;
      if(r&&r.repetido){ if(m) m.textContent='Ya constabas en la lista de hoy.'; render(); return; }
      /**
       * 🔴 LA RACHA SE DICE, o no sirve de nada. Un bonus que llega sin avisar es dinero que
       * aparece: no premia la constancia porque nadie lo relaciona con haber venido tres veces
       * seguidas. Decirlo EN el momento es lo que convierte +10 créditos en una racha.
       */
      // El regalo del docente, si lo puso al abrir la llamada. Va con la ventana de NEBULA porque
      // es lo mismo que un canje: has ganado algo y hay que ver QUÉ.
      // 🔴 12-sep · Carta a carta, con el mismo sobre que el Mercado: tres cartas de golpe en una
      // línea de texto es tirar el mejor momento de la clase. Se deja un segundo para que suban los
      // contadores de la asistencia, y luego se abre el regalo.
      if(r && r.regalo && r.regalo.length && window.SG.SOBRE){
        var tenia = inventarioDe(antes);
        setTimeout(function(){
          SG.SOBRE.revelar(r.regalo.map(function(c){ return marcaRepetida(c, tenia); }),
            { titulo:'🎁 El regalo de tu Comandante', alAlbum:function(){ irA('botin'); } });
        }, 1300);
      }
      if(r && r.racha > 1){
        var txt = '🔥 <b>'+r.racha+' clases seguidas</b>'
          + (r.extra ? ' · +'+r.extra+' ◈ extra por constancia' : '');
        if(r.extra >= 25) txt += ' (el tope)';
        aviso(txt);
      }
      refrescarYCelebrar(antes, donde, 'reto');
    }).catch(function(e){
      b.disabled=false; b.textContent='✋ Presente';
      if(m) m.textContent=String(e&&e.message||e);
      if(window.SG&&SG.FIESTA) SG.FIESTA.sonar('error');
    });
  }
  // v3.28 · El Genially del alumno es el de SU docente si lo tiene; si no, el del grupo. Algunos
  // docentes retocan el panel para sus alumnos y ese es el que tienen que ver.
  function miPanel(){
    var d=st.d||{}, p=(st.yo&&st.yo.profe)||'';
    // 14-sep · y si el grupo no tiene uno: el Panel de control maestro de STARGATE (el de todos)
    return (p && d.paneles && d.paneles[p]) || d.panel || window.SG_PANEL_MAESTRO || '';
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
    // 30-ago · Padlet bloquea su URL directa dentro de un iframe; la de embed se deriva del id del
    // tablero (el final del slug), así que con el enlace normal basta — no hace falta pedir el
    // código de inserción de cada PER.
    var mp=u.match(/padlet\.com\/[^\/]+\/(?:.*-)?([a-z0-9]{8,20})(?:[\/?#]|$)/i);
    if(mp && u.indexOf('/embed/')<0) u='https://padlet.com/embed/'+mp[1];
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
    // Google Forms no deja mirar dentro del iframe (otro dominio), pero SÍ se nota que ha navegado:
    // al enviar carga la pantalla de «respuesta registrada», y eso es un `load` más. El primero es
    // el formulario; a partir del segundo, algo se ha enviado.
    var envio=false, cargas=0;
    var f=ov.querySelector('iframe');
    f.addEventListener('load',function(){
      cargas++; if(cargas>1) envio=true;
      var c=ov.querySelector('.vent-carga'); if(c)c.remove();
    });
    // 🔴 11-sep · AL CERRAR, REFRESCAR. Petición de Norberto y fallo real de recorrido: canjeabas un
    // héroe, cerrabas la ventana y la Nave seguía enseñando los créditos de antes. Parecía que no
    // había pasado nada, y el siguiente paso natural del alumno era volver a canjearlo.
    // Solo si el formulario ha llegado a ENVIARSE (ver `envio`): cerrar sin enviar no cambia nada, y
    // recargar por gusto es hacerle esperar dos segundos para enseñarle lo mismo.
    function cerrar(){ov.classList.remove('open');ov.innerHTML='';document.body.classList.remove('vent-abierta');
      document.removeEventListener('keydown',esc27);
      if(envio) refrescar();}
    function esc27(e){if(e.key==='Escape'){e.preventDefault();cerrar();}}
    ov.querySelector('.vent-fondo').onclick=cerrar;
    ov.querySelector('.vent-x').onclick=cerrar;
    document.addEventListener('keydown',esc27);
    ov.querySelector('.vent-x').focus();
    return false;
  }
  // Cablea como ventana todo enlace marcado con data-vent (los formularios y el Genially).
  // Vuelve a pedir los datos y repinta. No se usa location.reload() a propósito: eso perdería la
  // pestaña en la que estabas y te devolvería arriba del todo, que es peor que no refrescar.
  function refrescar(){
    if(!st.email) return;
    var aviso=document.createElement('div');
    aviso.className='nave-refresco'; aviso.textContent='Actualizando tu ficha…';
    document.body.appendChild(aviso);
    identificar(st.email);
    setTimeout(function(){ if(aviso.parentNode) aviso.parentNode.removeChild(aviso); }, 2600);
  }
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
  /**
   * 🔴 12-sep · DE SEIS PESTAÑAS A CINCO. Las seis mezclaban tres cosas: lo que HACES (retos, semana,
   * planetas — tres sitios para lo mismo), lo que TIENES (insignias y álbum dentro de la ficha, el
   * vestuario más abajo) y lo que COMPRAS, que encima se llamaba «Recompensas» y sonaba a lo ganado.
   *
   * Ahora cada cosa tiene un sitio y solo uno:
   *   · «Esta semana» sube al aterrizaje, que es donde se mira nada más entrar.
   *   · «Los planetas» se funde con «Mis retos», que ya van agrupados por planeta.
   *   · «Mi botín» recoge todo lo ganado: insignias, cartas y personajes.
   *   · «Recompensas» pasa a «Mercado Estelar», que es como ya se llamaba el formulario de canje:
   *     no estrena palabra, y al lado del botín por fin se entiende cuál es cuál.
   *
   * La clave interna: los identificadores VIEJOS siguen funcionando (`tabValida` los traduce), así
   * que los enlaces con #premios o #ficha que alguien tenga guardados no se rompen.
   */
  var TABS=[['nave','🛰️','Mi nave'],['retos','🎯','Mis retos'],['botin','🏅','Mi botín'],
            ['mercado','🛒','Mercado Estelar'],['zoco','🔄','El Zoco'],['rankings','🏆','Rankings']];
  var TABS_VIEJAS={ficha:'nave',semana:'nave',planetas:'retos',premios:'mercado',tablero:'rankings'};
  // ================= LA NAVE POR CAPÍTULOS (13-sep) =================
  // Norberto: «de primeras no quiero que puedan hacer mil cosas, esto puede agobiar; que se
  // desbloquearan las opciones cada semana». El calendario vive en `_site_data.py → CAPITULOS` (llega
  // como SG_CAPITULOS): cada capítulo abre sus pestañas y piezas en su semana. Lo cerrado NO se enseña
  // —ni con candado—: una línea dice qué llega después. Lo que ya TIENES se ve siempre (un héroe
  // regalado en clase antes de la semana de los héroes sigue en tu vestuario). Con el motor viejo,
  // todo abierto como siempre.
  var CAPS_TODOS=(window.SG_CAPITULOS||[]).filter(function(c){ return c.listo!==false; });
  // 🔴 16-sep · UN PUA NO TIENE EL GRAN SORTEO, EL ZOCO NI EL HANGAR (Norberto: «en PUA podríamos capar ciertas
  // opciones: nooo hay sorteo, podemos quitar zoco»). Sus capítulos no existen para ese grupo: ni se abren, ni se
  // cuentan, ni salen en «lo que viene». La marca vive en el capítulo (`semanas.PUA` = null, desde _site_data.py).
  function capsTipo(){ var t=esPUA()?'PUA':'REGULAR'; return CAPS_TODOS.filter(function(c){ return (c.semanas||{})[t]!=null; }); }
  function semanaCap(c){ return (c.semanas&&c.semanas[esPUA()?'PUA':'REGULAR'])||99; }
  function porCapitulos(){ return motorNuevo() && capsTipo().length>0 && !!st.d; }
  function capsAbiertos(){
    if(!porCapitulos()) return capsTipo();
    var sem = st.estado==='antes' ? 0 : st.estado==='fin' ? 999 : (st.actual||1);
    var extra=(st.d&&st.d.capitulosAbiertos)||{};
    return capsTipo().filter(function(c,i){ return i===0 || semanaCap(c)<=sem || extra[c.clave]; });
  }
  function abierto(pieza){
    if(!porCapitulos()) return true;
    return capsAbiertos().some(function(c){ return (c.abre||[]).indexOf(pieza)>=0; });
  }
  function proximoCap(){ var ab=capsAbiertos(); return capsTipo().filter(function(c){ return ab.indexOf(c)<0; })[0]||null; }
  function tabVisible(k){ return k==='nave'||k==='retos'||k==='botin'||abierto(k); }
  function tabsVisibles(){ return TABS.filter(function(x){ return tabVisible(x[0]); }); }
  function tabValida(k){
    if(TABS_VIEJAS[k]) k=TABS_VIEJAS[k];
    return TABS.some(function(x){return x[0]===k;}) && tabVisible(k) ? k : 'nave';
  }
  st.tab=tabValida(st.tab);
  // el botón «atrás» del navegador también cambia de pestaña: es lo que espera cualquiera
  window.addEventListener('hashchange',function(){ irA((location.hash||'').replace('#',''), false); });
  /**
   * LA BARRA. Una sola fila pegada arriba, en vez de dos.
   *
   * 🔴 12-sep · Antes había DOS filas fijas: las pestañas (56 px) y una parrilla de accesos (89 px).
   * 144 px de pantalla permanente. Esa parrilla era el puente a los formularios de Google, y con el
   * motor nuevo los retos se marcan en la página y el canje está en el Mercado: de cinco botones
   * quedaban tres, y dos se usan una vez por semana. Ahora: identidad · pestañas · contadores · «···».
   *
   * Los contadores van AQUÍ y no es solo por compactar. Antes tus xp solo se veían en la ficha, así
   * que si marcabas un reto desde otra pestaña la celebración se la llevaba una cifra que no estabas
   * mirando. En la barra el número sube donde siempre lo tienes delante.
   */
  function pestanas(){
    var r=st.yo||{}, SG=window.SG||{};
    var ni=SG.nivelInfo?SG.nivelInfo(r.xp||0,(st.d&&st.d.tipo)||'REGULAR'):{nivel:1};
    var cred=(r.creditos!=null?r.creditos:(r.xp_disponibles||0));
    // 🔴 `avatarSrc` devuelve un OBJETO (src, fallback, rango…), no una cadena. Metido tal cual en
    // un src, el navegador pedía «[object Object]» y la barra salía con la foto rota.
    var mini=SG.avatarSrc?SG.avatarSrc(r.avatar,r.alias,r.xp||0,(st.d&&st.d.tipo)||'REGULAR'):null;
    /**
     * 🔴 LA IDENTIDAD SUBE A LA LÍNEA DE «STARGATE». Petición de Norberto: «en la línea de arriba
     * del todo, donde pone STARGATE (recluta), añade la miniatura del personaje, nombre, dinero,
     * exp, nivel. En la segunda fila los botones, fijo».
     *
     * Y gana espacio de verdad: esa primera línea ya existía y solo llevaba una marca. Meter ahí
     * quién eres y cuánto tienes deja la segunda fila entera para las secciones, y las dos quedan
     * pegadas arriba desde el primer momento — no hay que hacer scroll para saber tu saldo.
     */
    pintarIdentidad(r, ni, cred, mini);
    return '<nav class="nave-barra-u" role="navigation" aria-label="Tu nave">'
      // 🔴 `role="tab"` PROMETE que las flechas mueven entre pestañas. Si no se cumple, quien navega
      // con teclado se queda pulsando flechas sin que pase nada — y eso es peor que no poner el rol.
      // Se cumple abajo, en `cablearTeclado`. Y `tabindex` sigue el patrón estándar: solo la pestaña
      // activa es alcanzable con el tabulador; dentro, se mueve uno con las flechas.
      +'<div class="nb-tabs" role="tablist" aria-label="Secciones de tu nave">'+tabsVisibles().map(function(x){
        var on = st.tab===x[0];
        return '<button type="button" class="nb-t'+(on?' on':'')+'" role="tab"'
          +' aria-selected="'+on+'" aria-controls="nave-panel" tabindex="'+(on?'0':'-1')+'"'
          +' id="nb-t-'+x[0]+'" data-tab="'+x[0]+'" title="'+esc(x[2])+'">'
          +'<span class="i" aria-hidden="true">'+x[1]+'</span><b>'+esc(x[2])+'</b>'
          +(x[0]==='zoco'&&zocoPendientes().length?'<span class="nb-badge" title="Te toca responder">'+zocoPendientes().length+'</span>':'')+'</button>';
      }).join('')+'</div>'
      +'<div class="nb-fin">'
        +'<button type="button" class="nb-mas" id="nb-mas" aria-haspopup="true" aria-expanded="false" aria-label="Más opciones">···</button>'
      +'</div>'
      +menuMas()
      +'</nav>';
  }
  /**
   * Escribe la identidad en la barra del sitio. Se hace por JS y no en el HTML porque esa barra la
   * genera `_build_site.py` para las 28 páginas: llenarla de datos de alumnado allí sería meter la
   * Nave en la cabecera de la guía del profesorado.
   *
   * 🔴 Los ids `nb-xp` y `nb-cr` se conservan: son los que hace rodar la fiesta al ganar puntos, y
   * cambiarlos habría dejado los contadores quietos en el único momento en que tienen que moverse.
   */
  function pintarIdentidad(r, ni, cred, mini){
    var barra=document.querySelector('.nav .wrap'); if(!barra) return;
    document.body.classList.add('nave-dentro');
    var caja=barra.querySelector('.nb-id');
    if(!caja){ caja=document.createElement('div'); caja.className='nb-id'; barra.appendChild(caja); }
    caja.innerHTML=(mini?'<img class="nb-cara" src="'+esc(mini.src)+'" alt="" '
        +'data-fb="'+esc(mini.fallback)+'" onerror="if(this.src.indexOf(this.dataset.fb)<0)this.src=this.dataset.fb">':'')
      +'<div class="nb-id-txt"><b>'+esc(r.alias||'')+'</b>'
        +'<span class="nb-nv">Nivel '+(ni.nivel||1)+(ni.rangoNombre?' · '+esc(ni.rangoNombre):'')+'</span></div>'
      +'<span class="nb-m xp" id="nb-xp" title="Los xp no se gastan nunca: marcan tu nivel."><b>'+(r.xp||0)+'</b> xp</span>'
      +'<span class="nb-m cr" id="nb-cr" title="Los créditos son lo único que se gasta."><b>'+cred+'</b> ◈</span>';
  }

  /** Lo que se usa una vez por semana no merece un botón permanente: vive aquí dentro. */
  function menuMas(){
    var d=st.d||{};
    return '<div class="nb-menu" id="nb-menu" hidden role="menu">'
      +(d.formTicket?'<a role="menuitem" href="'+esc(ticketUrl(d))+'" data-vent="🎟️ Contacta con NEBULA">🎟️ <span>Dudas a NEBULA<em>anónimo, no lo ve tu clase</em></span></a>':'')
      +(d.padlet?'<a role="menuitem" href="'+esc(d.padlet)+'" data-vent="🧱 Padlet de la clase">🧱 <span>Padlet de la clase<em>el muro común</em></span></a>':'')
      +'<a role="menuitem" href="ayuda.html" target="_blank" rel="noopener">❓ <span>¿Mi enlace abre lo mío?<em>compruébalo antes de entregar</em></span></a>'
      +(d.formBitacora?'<a role="menuitem" href="'+esc(d.formBitacora)+'" data-vent="📓 Bitácora de mando">📓 <span>Bitácora de mando<em>marca lo completado</em></span></a>':'')
      +(d.formCanje?'<a role="menuitem" href="'+esc(d.formCanje)+'" data-vent="🛸 Mercado Estelar">🛸 <span>Mercado Estelar<em>gasta tus créditos</em></span></a>':'')
      +'<hr><div class="nb-fiesta" id="nb-fiesta"></div>'
      +'<a role="menuitem" href="#" id="nb-salir">🚪 <span>No soy yo / salir</span></a>'
      +'</div>';
  }
  function contenido(){
    // 🔴 El orden importa: primero quién eres y qué toca hoy, luego el pique con quien tienes
    // cerca (una frase), y lo demás en cajones cerrados. El vestuario es una colección, como el
    // álbum: se mira cuando se quiere mirar, no cada vez que abres la Nave.
    if(st.tab==='nave')     return personaje();
    if(st.tab==='retos')    return mapa()+retos();
    if(st.tab==='botin')    return botin();
    if(st.tab==='mercado')  return recompensas();
    if(st.tab==='zoco')     return zocoVista();
    return '';                                  // «rankings»: vive en su propia sección del HTML
  }
  // El tablero es una <section> aparte del HTML (la pinta tablero.js), así que se enseña y se esconde
  // en vez de repintarse: repintarlo obligaría a pedir los datos otra vez cada vez que se cambia de pestaña.
  function verTablero(si){
    var sec=document.getElementById('nave-ranking');
    if(sec) sec.style.display = si ? '' : 'none';
    // Al enseñarlo, que se repinte: puede haberse pintado antes de saber quién eres, y entonces le
    // faltaba el ranking de tu escuadrón.
    if(si && window.SG_RANKING_REPINTA){ try{ window.SG_RANKING_REPINTA(); }catch(e){} }
  }
  /**
   * Las flechas mueven entre pestañas, e Inicio/Fin van a la primera y la última. Es lo que espera
   * quien navega con teclado en cuanto ve `role="tablist"`, y es lo que promete ese rol.
   */
  function cablearTeclado(){
    var tabs=[].slice.call(root.querySelectorAll('.nb-t'));
    if(!tabs.length) return;
    tabs.forEach(function(b,i){
      b.onkeydown=function(e){
        var j=null;
        if(e.key==='ArrowRight') j=(i+1)%tabs.length;
        else if(e.key==='ArrowLeft') j=(i-1+tabs.length)%tabs.length;
        else if(e.key==='Home') j=0;
        else if(e.key==='End') j=tabs.length-1;
        if(j===null) return;
        e.preventDefault();
        irA(tabs[j].getAttribute('data-tab'));
        // Tras repintar, el foco tiene que quedarse donde el usuario lo dejó.
        var nueva=root.querySelector('.nb-t[data-tab="'+tabs[j].getAttribute('data-tab')+'"]');
        if(nueva) nueva.focus();
      };
    });
  }

  function irA(k, empujarHash){
    st.tab=tabValida(k);
    if(empujarHash!==false){ try{ history.replaceState(null,'','#'+st.tab); }catch(e){} }
    render();
    // 14-sep · el Zoco, siempre al día al entrar: se enseñaba lo de la última vez que se abrió (otra
    // pestaña, otro recluta que acaba de poner algo…). Se pinta lo que hay y se repinta al llegar lo nuevo.
    if(st.tab==='zoco' && st.zoco) cargarZoco().then(function(){ if(st.tab==='zoco') render(); });
    // 🔴 13-sep · al cambiar de pestaña, arriba del todo. Buscaba `.nave-tabs`, el nombre de la barra
    // de antes del rediseño: no la encontraba y te dejaba a media página de la pestaña nueva.
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
  }
  // 12-sep · `accesos()` se ha eliminado: su contenido vive ahora en el menú «···» de la barra,
  // y el aviso de la llamada a filas se pinta directamente en render().
  // ================= EL DUELO (30-ago) =================
  // Petición de Norberto: un ranking reducido con quien va justo delante y quien pisa los talones,
  // y un banco de frases que unas veces apremia a alcanzar y otras a escaparse. Decisiones:
  //   · TARJETA en «Mi ficha», no ventana al entrar: al abrir la Nave ya compiten NEBULA y las
  //     celebraciones; un popup más se cierra sin leer, la tarjeta está siempre donde aterrizas.
  //   · Los datos salen del tablero que la propia página ya carga (sg:tablero): ni una llamada más.
  //   · La frase sugiere EL RETO CONCRETO que cierra el hueco: «te faltan 120 xp: un Reto B lo
  //     resuelve» empuja más que un ánimo genérico.
  var FRASES_ARRIBA=[
    '¡Tú puedes! Estás a {delta} xp de superar a {alias}. {sugerencia}',
    '{alias} va justo delante, a solo {delta} xp. Un último empujón y ese puesto es tuyo. 🚀',
    'NEBULA detecta una nave a {delta} xp por delante: es {alias}. Rumbo de intercepción. 🛰️',
    'El puesto de {alias} tiembla: {delta} xp y le adelantas. {sugerencia}',
    '¿Ves esa estela? Es {alias}, a {delta} xp. Nadie recuerda a quien CASI adelanta. 😉'];
  var FRASES_ABAJO=[
    '¡Cuidado, te pisan los talones! {alias} está a solo {delta} xp. ¿Hacemos una misión para desmarcarnos?',
    '{alias} se acerca por popa: {delta} xp de margen. Un reto a tiempo y le pierdes de vista. 🛡️',
    'Tu margen con {alias} es de {delta} xp. En esta galaxia, quien se acomoda, ve pasar naves. ⚠️',
    'Aviso de NEBULA: {alias} lleva los motores encendidos y está a {delta} xp. Toca acelerar.'];
  var FRASES_LIDER=[
    '👑 Vas en cabeza, recluta. {alias} te sigue a {delta} xp: que el trono no se enfríe.',
    '👑 Primer puesto. {alias} está a {delta} xp — también en cabeza se entrena. {sugerencia}'];
  // 30-ago · Norberto: «si hay empate, anima a desmarcarse». El empate es la tercera vía del banco
  // y salta tanto si empatas con el de delante como con el de detrás.
  var FRASES_EMPATE=[
    '⚡ Empate técnico con {alias}: el siguiente reto decide quién va delante. ¿Va a ser tuyo?',
    '⚡ {alias} y tú vais CLAVADOS a xp. Un solo reto rompe el empate… ¿quién se desmarca primero?',
    '⚡ Cero distancia con {alias}. En la Cero lo llaman «órbita compartida» — hasta que alguien enciende motores. 🔥',
    '⚡ Mismos xp que {alias}. Cualquier reto te desmarca: el que tengas a medias es el candidato perfecto.'];
  function sugerenciaDuelo(delta){
    if(delta<=0) return '';
    if(delta<=100) return 'Cualquier reto te lo da.';
    if(delta<=250) return 'Un Reto B (250 xp) lo resuelve.';
    if(delta<=500) return 'Una Actividad (500 xp) lo resuelve de golpe.';
    return 'Paso a paso: cada reto suma.';
  }
  function fraseDuelo(banco, alias, delta){
    var f=banco[Math.floor(Math.random()*banco.length)];
    return esc(f).replace('{alias}','<b>'+esc(alias)+'</b>')
                 .replace('{delta}','<b>'+delta+'</b>')
                 .replace('{sugerencia}',esc(sugerenciaDuelo(delta)));
  }
  function duelo(){
    if(!st.yo || !abierto('rankings')) return '';
    var d=window.SG_TABLERO_DATA;
    // el tablero aún no ha llegado: se deja el hueco y sg:tablero repinta cuando esté
    if(!d||!d.reclutas) return '<div id="duelo-hueco"></div>';
    var lista=d.reclutas.slice().sort(function(a,b){return (a.pos||99)-(b.pos||99);});
    var i=lista.findIndex(function(x){return x.pos===st.yo.pos;});
    if(i<0) return '';
    var yo=lista[i], arriba=i>0?lista[i-1]:null, abajo=i<lista.length-1?lista[i+1]:null;
    if(!arriba&&!abajo)
      return '<div class="card duelo"><h3>⚔️ Tu duelo</h3><p class="small muted">De momento la pista es tuya: nadie delante, nadie detrás. Cuando se alisten más reclutas, aquí verás tu duelo.</p></div>';
    // la frase: si hay empate con el de arriba manda el empate; si no, se alterna al azar entre
    // alcanzar al de delante y escaparse del de detrás (que es justo lo que pidió Norberto)
    var msg;
    var empatado=(arriba&&arriba.xp===yo.xp)?arriba:(abajo&&abajo.xp===yo.xp)?abajo:null;
    if(empatado) msg=fraseDuelo(FRASES_EMPATE,empatado.alias,0);
    else if(!arriba) msg=fraseDuelo(FRASES_LIDER,abajo.alias,yo.xp-abajo.xp);
    else if(!abajo) msg=fraseDuelo(FRASES_ARRIBA,arriba.alias,arriba.xp-yo.xp);
    else msg=Math.random()<0.5?fraseDuelo(FRASES_ARRIBA,arriba.alias,arriba.xp-yo.xp)
                              :fraseDuelo(FRASES_ABAJO,abajo.alias,yo.xp-abajo.xp);
    function fila(p,es){
      if(!p) return '';
      return '<div class="duelo-fila'+(es==='yo'?' yo':'')+'"><span class="pos">#'+p.pos+'</span>'
        +'<b>'+(es==='yo'?'TÚ · ':'')+esc(p.alias)+'</b>'
        +(p.corona?' <span title="corona semanal">👑</span>':'')
        +'<span class="pts">'+p.xp+' xp</span>'
        +(es==='arriba'?(p.xp===yo.xp?'<em>⚡ empate</em>':'<em>te saca '+(p.xp-yo.xp)+'</em>')
          :es==='abajo'?(p.xp===yo.xp?'<em>⚡ empate</em>':'<em>a '+(yo.xp-p.xp)+' de ti</em>'):'<em>tu puesto</em>')
        +'</div>';
    }
    return '<div class="card duelo"><h3>⚔️ Tu duelo</h3>'
      +'<div class="duelo-tabla">'+fila(arriba,'arriba')+fila(yo,'yo')+fila(abajo,'abajo')+'</div>'
      +'<p class="duelo-msg">'+msg+'</p>'
      +'<p class="small" style="margin:8px 0 0"><a href="#tablero" data-ir="tablero" class="btn small">Ver el tablero completo →</a></p></div>';
  }
  // ================= MODO DEMO · enseñar la Nave sin ser nadie (9-sep) =================
  // Norberto: «un PER de prueba abierto, sin correo... para enseñar al público o mostrar la
  // plataforma desde el punto de vista del estudiante».
  // 🔴 LA PUERTA: solo funciona en grupos cuyo nombre lleve DEMO o PRUEBA — exactamente la misma
  // regla que usa sembrarDemo() para decidir dónde puede meter alumnado falso. Así, por definición,
  // solo se puede enseñar un grupo que ya está poblado de mentira: en una clase real «14210 AP
  // 2026-27» el modo demo no existe, y nadie ve la ficha de un alumno de verdad sin identificarse.
  // Y no hace ni una llamada nueva: se viste con un recluta del tablero PÚBLICO, que no lleva
  // correos ni nombres. Aunque alguien fuerce ?demo=1, no hay nada privado que enseñar.
  var DEMO = q.get('demo')==='1';
  function demoPermitido(){
    var n=String((st.d&&st.d.nombre)||'').toUpperCase();
    return DEMO && (n.indexOf('DEMO')>=0 || n.indexOf('PRUEBA')>=0);
  }
  function ponDemo(r){
    // el 3.º del ranking: tiene recorrido que enseñar (insignias, cromos, un duelo por arriba y por
    // abajo) sin ser el primero, que no tiene a nadie delante y deja el duelo a medias.
    var lista=r.slice().sort(function(a,b){return (a.pos||99)-(b.pos||99);});
    st.yo=lista[Math.min(2,lista.length-1)];
    st.email=''; st.msgYo='';
  }
  function vestirDemo(){
    if(st.yo||!demoPermitido()) return false;
    // 🔴 Los reclutas vienen YA en la respuesta de la Nave (st.d.reclutas): no hay que esperar al
    // tablero ni pedir nada. Buscarlos fuera era la causa de que la demo no arrancase.
    var r=(st.d&&st.d.reclutas)||[];
    if(!r.length){ var g=window.SG_TABLERO_DATA; r=(g&&g.reclutas)||[]; }
    if(!r.length) return false;
    ponDemo(r); return true;
  }
  // 🔴 9-sep · POR QUE NO ARRANCABA. La primera version esperaba al aviso «sg:tablero», y eso era
  // una carrera: si el tablero llegaba antes que los datos del PER, el aviso ya habia pasado y la
  // demo no arrancaba NUNCA — sin un solo error en consola, de los fallos que no se ven. Y buscaba
  // los reclutas fuera (window.SG_TABLERO_DATA) cuando ya venian DENTRO de la propia respuesta de
  // la Nave. Mirando en casa no hay carrera que perder ni llamada que hacer.
  function vestirDemoSeguro(){ if(vestirDemo()) render(); }
  // cuando el tablero llega después que la ficha, el duelo se pinta solo (una vez)
  document.addEventListener('sg:tablero',function(){
    if(vestirDemo()){ render(); return; }
    if(st.tab==='ficha'&&st.yo&&document.getElementById('duelo-hueco')) render();
  });
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
      // 15-sep · la misma tarjeta que «Lo que puedes conseguir esta semana» (tarjetaReto), en su rejilla
      var fichas='<div class="rs-grid rs-grid-pl">'+suyos.map(function(r){ return tarjetaReto(r, mios); }).join('')+'</div>';
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
      +'<p class="lead">Cada semana la nave avanza sola: los planetas se van desbloqueando con el calendario. Pulsa uno visitado para volver a ver sus órdenes, vídeos y retos.'+(miPanel()?' Las presentaciones de cada planeta están en el <a href="'+esc(miPanel())+'" target="_blank" rel="noopener"><b>panel de control</b></a>.':'')+'</p>'
      +'<div class="nave-mapa">'+tiles+'</div><div id="nave-detalle"></div></section>';
  }
  function fichaSemana(s,titulo){
    return '<div class="foro-card">'+(s.capitulo?'<span class="pill amber">Nuevo capítulo: '+esc(s.capitulo)+'</span>':'')
      +'<h2>'+esc(titulo||('Semana '+s.sem+' · '+s.tema))+'</h2><div class="muted">'+esc(s.sub)+'</div>'
      +'<div class="foro-msg">'+msgHtml(s.foro,per)+'</div>'
      +(s.lanza.length?'<h4>🗝️ Retos</h4><ul>'+s.lanza.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')
      +(s.insignias.length?'<h4>🏅 Insignias en juego</h4><div class="minis">'+minis(s.insignias)+'</div>':'')
      +(s.videos.length?'<h4>🎬 Vídeos</h4><div class="yt-list three">'+s.videos.map(function(v){return ytb(v[0],v[1]);}).join('')+'</div>':'')
      +'</div>';
  }
  function estaSemana(){
    if(st.estado==='antes') return '<section><div class="eyebrow amber">Esta semana</div><h2>En la rampa de lanzamiento</h2><p class="lead">La misión empieza el '+esc(st.d.inicio)+'. Mientras tanto: preséntate ante el mando y registra tu alias en la <a href="'+esc(st.d.formBitacora||'#')+'" target="_blank" rel="noopener">Bitácora de mando</a>.</p></section>';
    var idx=Math.min(Math.max(st.actual,1),st.semanas.length)-1; var s=st.semanas[idx];
    // 🔴 «Semana 14» salía TRES veces en la misma pantalla: en la cabecera, aquí y en los retos.
    // El número vive en la cabecera —que es donde dice dónde vas, «semana 14 de 15»— y aquí y en
    // los retos se queda el TEMA, que es lo que de verdad cambia entre una semana y otra.
    var tit=st.estado==='fin'?'Última orden · '+s.tema:s.tema;
    return '<section><div class="eyebrow amber">La orden de la semana</div><h2>Esta semana en la nave</h2>'+fichaSemana(s,tit)+'</section>';
  }
  /**
   * QUÉ ES CADA COSA, en una línea, y DÓNDE se usa.
   *
   * 🔴 La descripción del catálogo cuenta la mecánica («una carta al azar de las 20 del álbum…»);
   * esto contesta otra pregunta, la que de verdad se hace quien acaba de gastar sus créditos: «vale,
   * ¿y esto dónde está ahora?». Sin ella, comprar un marco dorado y no ver nada distinto en ningún
   * sitio se parece mucho a que te hayan cobrado por nada.
   */
  var QUE_ES = {
    cromo:      ["🃏","Carta del álbum","Se abre sola y se queda en tu álbum.","Ver mi álbum","botin"],
    cromo_repes:["🔁","Cambio de repetidos","Tus repetidas se convierten en un sobre nuevo.","Ver mi álbum","botin"],
    heroe:      ["🛡️","Héroe de la Rebelión","Lo tendrás en el vestuario: puedes vestirlo cuando quieras.","Ir al vestuario","botin"],
    // 14-sep · los sobres y las cápsulas nuevos
    sobre_grande:["🃏","Cartas del álbum","Cinco cartas que se abren solas y se quedan en tu álbum.","Ver mi álbum","botin"],
    sobre_raro: ["💎","Cartas del álbum","Tres cartas con muchas más raras y épicas. Se quedan en tu álbum.","Ver mi álbum","botin"],
    sobre_epico:["✨","Cartas del álbum","Tres cartas sin comunes. Se quedan en tu álbum.","Ver mi álbum","botin"],
    capsula_elite:["🟪","Héroe de la Rebelión","Un héroe de la Vanguardia o un Mito, a tu vestuario.","Ir al vestuario","botin"],
    capsula_legendaria:["🟨","Héroe legendario","Un Mito seguro, a tu vestuario.","Ir al vestuario","botin"],
    heroe_repes:["🔁","Cambio de héroes repetidos","Dos repetidos se convierten en un héroe nuevo al azar.","Ir al vestuario","botin"],
    marco:      ["🖼️","Adorno de tu ficha","Enmarca tu avatar. Se ve en tu ficha y en el tablero.","Ver mi ficha","nave"],
    fondo:      ["🌌","Adorno de tu ficha","Cambia el fondo de tu ficha. Se ve en tu ficha y en el tablero.","Ver mi ficha","nave"],
    titulo:     ["🏷️","Adorno de tu ficha","Un título que acompaña a tu alias delante de toda la clase.","Ver mi ficha","nave"],
    nota:       ["📈","Afecta a tu nota","No se aplica sola: la aprueba tu docente al terminar las clases.","Entendido",""],
    sorteo:     ["🎟️","Una participación del Gran Sorteo","Es una papeleta más: cuantas tengas, más posibilidades. La ves en el Mercado.","Ver el sorteo","mercado"]
  };
  /**
   * EL GRAN SORTEO, EN EL MERCADO (14-sep). Norberto: «dos licencias de Genially de año completo, a
   * partir de la semana 6: que los estudiantes puedan comprar participaciones y el profe regalarlas».
   * Una tarjeta propia: qué se sortea, cuándo, cuántas papeletas llevas y, cuando ya se ha hecho,
   * quién ha ganado. La compra es la de siempre (purchaseReward); la papeleta es `lotteryEntries`.
   */
  var MESES_L=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function fechaLarga(ms){ if(!ms) return ''; var f=new Date(Number(ms)); return f.getDate()+' de '+MESES_L[f.getMonth()]; }
  function tarjetaSorteo(x, r, mis){
    var S=x.sorteo||{}, mias=Number(((r&&r.participaciones)||{})[x.doc]||0), max=(x.max&&x.max<99)?x.max:0;
    var img='assets/img/canje/'+esc(S.imagen||'sorteo_generico.jpg');
    var cab='<div class="rec-foto"><img loading="lazy" src="'+img+'" alt=""></div><div class="rec-cuerpo">'
      +'<div class="rec-quees">🎟️ El Gran Sorteo</div><h3>'+esc(S.premio||x.nombre)+'</h3>';
    if(S.hecho){
      var gane=r&&(S.ganadoresFichas||[]).indexOf(r.fid)>=0;
      return '<div class="card rec-card sorteo hecho">'+cab
        +'<p class="sorteo-res">🎉 Ya se ha sorteado. '+(S.ganadoresAlias||[]).length+' ganador'+((S.ganadoresAlias||[]).length===1?'':'es')+': <b>'
        +(S.ganadoresAlias||[]).map(esc).join('</b> y <b>')+'</b></p>'
        +(gane?'<p class="sorteo-gane">🏆 <b>¡Has ganado!</b> Tu docente te dirá cómo recibir tu premio.</p>':'')
        +'</div><div class="rec-pie"></div></div>';
    }
    var tope=max&&mias>=max;
    var afford=!r?'':tope?'<span class="chip done">Ya tienes las '+max+' que se permiten</span>'
      :(mis>=x.coste?'<span class="chip ok">Te lo puedes permitir</span>':'<span class="chip wip">Te faltan '+(x.coste-mis)+' ◈</span>');
    var boton=(motorNuevo()&&r&&!tope&&mis>=x.coste&&x.id)
      ? '<button class="btn primary" type="button" data-canje="'+esc(x.doc||x.id)+'" data-nombre="'+esc('una participación del Gran Sorteo')+'" data-coste="'+x.coste+'" data-tipo="sorteo" data-abrir="0" data-usos="1">🎟️ Una participación · '+x.coste+' ◈</button>'
      : '';
    // 14-sep · la reventa (Norberto: «debes permitir también añadir al Zoco participaciones»)
    if(mias>0&&r&&motorNuevo()&&abierto('zoco'))
      boton+='<button class="btn" type="button" data-zoco-poner="'+esc(x.doc)+'">🔄 Revender una en el Zoco</button>';
    return '<div class="card rec-card sorteo">'+cab
      +'<p class="pts">'+x.coste+' ◈ <span class="small muted">cada participación</span></p>'
      +'<p class="sorteo-mias">Llevas <b>'+mias+'</b> participaci'+(mias===1?'ón':'ones')+(max?' <span class="small muted">(como mucho '+max+')</span>':'')+'</p>'
      +'<p class="small rec-desc">'+(S.ganadores>1?'<b>'+S.ganadores+' ganadores</b>, nadie gana dos':'<b>1 ganador</b>')
      +(S.fecha?' · se sortea <b>solo</b> el <b>'+fechaLarga(S.fecha)+'</b>: ese día, al entrar, verás el resultado':'')+'. Cada participación es una papeleta: cuantas más, más posibilidades. Tu docente también las regala. Como en una lotería, lo jugado no se devuelve.</p>'
      +'</div><div class="rec-pie">'+afford+boton+'</div></div>';
  }
  function queEs(tipo){ return QUE_ES[tipo] || ["🎁","Recompensa","",'',""]; }
  /**
   * 14-sep · LA OFERTA DE LA SEMANA (Norberto: «un ítem que aparece aleatoriamente de forma temporal en
   * el mercado… rebajado, con stock limitado en tiempo y en unidades»). Arriba del Mercado, en grande:
   * qué es, el precio tachado y el rebajado, cuántas quedan y cuánto le queda. Una por persona.
   */
  function vivaOferta(o){ var t=Date.now(); return !!o && !o.cancelada && t>=(o.desde||0) && t<(o.fin||0) && (o.quedan==null || o.quedan>0); }
  function imgOferta(o){
    var q=(o&&o.que)||{};
    if(q.tipo==='heroe') return 'assets/img/heroes/'+q.clave+'.jpg';
    if(q.tipo==='carta') return 'assets/img/tarjetas/'+q.clave+'_carta.png'+CARDV;
    var t=((st.d&&st.d.recompensas)||[]).filter(function(r){ return r.tipo===q.cual; })[0], im=t&&(window.SG_IMG_RECOMPENSA||{})[t.nombre];
    return 'assets/img/canje/'+(im||'sobre.jpg');
  }
  function quedaTiempo(fin){ var s=Math.max(0,Math.round((fin-Date.now())/1000)), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60);
    return d?d+' d '+h+' h':h?h+' h '+m+' min':m+' min'; }
  function tarjetaOferta(x){
    var o=x.oferta, r=st.yo, mis=r?(r.creditos!=null?r.creditos:0):0, ya=!!(r&&r.ofertas&&r.ofertas[x.doc]), q=o.que||{};
    var rz=String(o.rareza||'común').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    var boton=!r||!motorNuevo()?'':ya?'<span class="chip done">✅ Ya la tienes (una por persona)</span>'
      :mis<o.precio?'<span class="chip wip">Te faltan '+(o.precio-mis)+' ◈</span>'
      :'<button class="btn primary grande" type="button" data-canje="'+esc(x.doc)+'" data-nombre="'+esc(o.nombre)+'" data-coste="'+o.precio+'" data-tipo="oferta_'+esc(o.abre||'sobre')+'" data-abrir="1" data-usos="'+(x.usos||1)+'">⚡ Comprar por '+o.precio+' ◈</button>';
    return '<div class="card oferta-card rz-'+rz+(q.tipo==='carta'?' es-carta':'')+'">'
      +'<div class="of-foto"><img src="'+esc(imgOferta(o))+'" alt="" loading="lazy"><span class="of-pct">−'+o.pct+' %</span></div>'
      +'<div class="of-cuerpo"><div class="of-kicker">⚡ '+(o.auto?'Oferta de la semana':'Oferta especial')+(o.rareza?' · '+esc(o.rareza):'')+'</div>'
      +'<h3>'+esc(o.nombre)+'</h3>'
      +'<p class="of-precio"><s>'+o.base+' ◈</s> <b>'+o.precio+' ◈</b></p>'
      +'<p class="of-meta">'+(o.quedan==null?'<span>Sin límite de unidades</span>':'<span>Quedan <b>'+o.quedan+'</b> de '+(o.total||o.quedan)+'</span>')
      +'<span>Una por persona</span><span>⏳ Termina en <b>'+quedaTiempo(o.fin)+'</b></span></p>'
      +boton+'</div></div>';
  }
  /** 14-sep · al entrar: si esta semana aún no tiene su oferta, el servidor la crea (una vez) */
  var ofertaPedida=false;
  function ofertaAlEntrar(){
    if(ofertaPedida||!st.yo||SIMULACRO||!motorNuevo()||st.estado!=='curso'||(st.actual||0)<3) return;
    var M=window.SG&&window.SG.MOTOR; if(!M||!M.oferta) return;
    if(((st.d&&st.d.recompensas)||[]).some(function(x){ return x.tipo==='oferta'&&x.oferta&&x.oferta.auto&&x.oferta.semana===st.actual; })) return;
    ofertaPedida=true;
    M.oferta(per,'semana').then(function(r){
      if(r&&r.nueva) return SG.FUENTE.tablero(per,true).then(function(d){ if(d&&!d.error){ st.d=d; render(); } });
    }).catch(function(){});
  }
  /** 14-sep · lo que se abre al comprarlo: el sobre de siempre, los sobres nuevos y las cápsulas. */
  function esCofre(t){ return /^(cromo|heroe|sobre_[a-z]+|capsula_[a-z]+)$/.test(String(t||'')); }

  function recompensas(){
    var d=st.d; var cat=d.recompensas||[]; var n=st.semanas.length; var r=st.yo;
    if(!cat.length) return '<section><div class="eyebrow violet">Recompensas</div><h2>Mercado Estelar</h2><p class="lead">Aquí se canjean tus <b>créditos ◈</b> por recompensas (los xp no se gastan nunca). El catálogo se abrirá pronto en la nave; mientras tanto, tu Capitán tiene la lista.</p>'
      +(d.formCanje?'<a class="btn" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🎁 Ir al formulario de canje</a>':'')+'</section>';
    var abiertas=0;
    /**
     * 🔴 LAS BLOQUEADAS, AL FINAL. Norberto: «mueve al final la recompensa bloqueada; deja en la
     * primera fila cromos, cambiar 3 repetidos y el héroe, así no quedan agujeros».
     * Y tiene razón en lo de los agujeros: las de nota se abren en la semana 15, así que durante
     * catorce semanas la tienda se veía llena de huecos grises intercalados entre lo comprable —
     * parecía rota, no parecía que hubiera algo por venir.
     */
    var n=st.semanas.length;
    /**
     * 🔴 13-sep · LA SEMANA DE DESBLOQUEO, UNA SOLA VEZ EN PUA. El motor viejo daba `desde` en semanas
     * REGULAR y aquí se pasaba a PUA; el motor nuevo YA la da en PUA (`stargateSemana`), y se volvía
     * a escalar: el Arsenal —semana 8 en el servidor— salía abierto en la 4, con su botón, y al
     * pulsarlo el servidor decía que no. Lo encontró la revisión del calendario.
     */
    // 13-sep · y lo de un capítulo que el referente ha abierto antes de tiempo, a la venta desde ya
    var yaAbierto=function(t){ var ex=d.capitulosAbiertos||{}; return capsTipo().some(function(c){ return ex[c.clave]&&(c.mercado||[]).indexOf(t)>=0; }); };
    var desdeDe=function(x){ if(motorNuevo()&&yaAbierto(x.tipo)) return 1;
      return motorNuevo() ? (Number(x.desde)||14) : window.SGCAL.desdeEfectiva(x.desde||14,d.tipo,n); };
    var ofertas=cat.filter(function(x){ return x.tipo==='oferta'&&x.oferta&&vivaOferta(x.oferta); });
    cat = cat.filter(function(x){ return x.tipo!=='oferta'; }).sort(function(a,b){
      var aa=st.estado!=='antes'&&st.actual>=desdeDe(a);
      var bb=st.estado!=='antes'&&st.actual>=desdeDe(b);
      if(aa!==bb) return aa?-1:1;          // primero lo que se puede comprar hoy
      return 0;                            // y dentro de cada grupo, el orden del catálogo
    });
    var cards=cat.map(function(x){
      var desde=desdeDe(x); var abierta=st.estado!=='antes'&&st.actual>=desde;
      // 🔴 13-sep · con la Nave por capítulos, lo cerrado no se enseña: una línea al final dice qué llega
      if(!abierta&&porCapitulos()) return '';
      if(!abierta) return '<div class="card rec-card lock"><h3>🔒 Recompensa clasificada</h3><p class="small muted">Se desbloquea en la semana '+desde+'.</p></div>';
      abiertas++;
      var mis=r?(r.creditos!=null?r.creditos:(r.xp_disponibles||0)):0;
      if(x.tipo==='sorteo'&&x.sorteo) return tarjetaSorteo(x, r, mis);
      // el catálogo limita cuántas veces puede concederse cada recompensa: si ya llegó al tope,
      // se avisa aquí para que ni lo intente (el script también lo deniega sin cobrar).
      var veces=(r&&r.canjeados?r.canjeados[x.nombre]:0)||0;
      var repetible=!x.max||x.max>=99, tope=!repetible&&veces>=x.max;
      var afford=!r?'':faltanRepes
        ? '<span class="chip wip">Necesitas 3 repetidas · tienes '+((r&&r.repes_disponibles)||0)+'</span>'
        :tope?'<span class="chip done">Ya la tienes'+(x.max>1?' ('+veces+'/'+x.max+')':'')+'</span>'
        :(mis>=x.coste?'<span class="chip ok">Te lo puedes permitir</span>':'<span class="chip wip">Te faltan '+(x.coste-mis)+' ◈</span>')
        +(veces?' <span class="chip">canjeada '+veces+(repetible?' vece'+(veces===1?'z':'s'):' de '+x.max)+'</span>':'');
      var aviso=x.tipo==='nota'?'<p class="small muted">⏳ Queda pendiente hasta que tu docente la apruebe.</p>':x.tipo==='avatar'||x.tipo==='avatar_url'?'<p class="small muted">⚡ Automática: si se concede, tu avatar cambia solo.</p>':'';
      // 🔴 Con el motor nuevo se canjea aquí mismo. El cobro y la comprobación de saldo los hace el
      // servidor —el navegador no puede tocar los créditos ni queriendo—, así que el botón solo
      // pide; si no llega, contesta que no y no se mueve nada.
      // 🔴 Hay recompensas que NO se pagan con créditos (cambiar 3 repetidos por un sobre cuesta
      // repetidos). Con `x.coste === 0` la tarjeta decía «0 ◈» y el botón «Canjear por 0 ◈», que no
      // es que sea feo: es que dice una cosa falsa sobre lo que te va a costar.
      var gratis = !x.coste;
      /**
       * 🔴 «Aunque no tenga 3 cromos, me deja darle a seguir». Cierto: el servidor lo deniega, pero
       * la pantalla dejaba pulsar, abría la ventana de NEBULA y solo entonces decía que no. Hacer
       * pulsar para decir «no» es la forma más barata de parecer roto.
       */
      var faltanRepes = x.tipo === 'cromo_repes' && (r ? (r.repes_disponibles || 0) : 0) < 3;
      var boton = (motorNuevo() && r && !tope && !faltanRepes && mis>=x.coste && x.id)
        ? '<button class="btn primary" type="button" data-canje="'+esc(x.doc||x.id)+'" '
          +'data-nombre="'+esc(x.nombre)+'" data-coste="'+x.coste+'" data-tipo="'+esc(x.tipo||'')+'"'
          +' data-abrir="'+(esCofre(x.tipo)?'1':'0')+'"'
          // 🔴 Cuántas cartas trae: un sobre son TRES, un héroe uno. El dato viaja con el botón
          // porque el número lo decide el catálogo (`maxUses`), no la Nave.
          // 🔴 12-sep · era «3» a fuego, y los grupos creados antes de pasar a tres cartas traen
          // sobres de UNA: se pedían tres aperturas, dos fallaban en silencio. Ahora lo dice el sobre.
          +' data-usos="'+(x.usos||(x.tipo==='cromo'?3:1))+'">'
          +(gratis?'Cambiar':'Canjear por '+x.coste+' ◈')+'</button>'
        : '';
      // El pie va aparte y se pega abajo (`margin-top:auto`): así el botón de todas las tarjetas de
      // una fila cae en la MISMA línea, aunque un título ocupe tres renglones y otro uno.
      // 🔴 13-sep · el cambio de héroes repetidos va EN la tarjeta del héroe, no en una tarjeta más:
      // se ofrece donde se compran, y solo cuando hay dos que cambiar
      if(x.tipo==='heroe' && motorNuevo() && r && (r.heroes_repes||0)>=2)
        boton += '<button class="btn" type="button" data-canje="heroe_repes" data-nombre="Cambiar 2 héroes repetidos" data-coste="0" data-tipo="heroe_repes" data-abrir="1" data-usos="1">🔁 Cambiar 2 repetidos</button>';
      var qe=queEs(x.tipo), img=(window.SG_IMG_RECOMPENSA||{})[x.nombre];
      return '<div class="card rec-card'+(tope?' agotada':'')+'">'
        +(img?'<div class="rec-foto"><img loading="lazy" src="assets/img/canje/'+esc(img)+'" alt=""></div>'
             :'<div class="rec-foto sin"><span>'+qe[0]+'</span></div>')
        +'<div class="rec-cuerpo">'
        +'<div class="rec-quees">'+qe[0]+' '+esc(qe[1])+'</div>'
        +'<h3>'+esc(x.nombre)+'</h3>'
        +'<p class="pts'+(gratis?' libre':'')+'">'+(gratis?'Sin créditos':x.coste+' ◈')+'</p>'
        +(x.desc?'<p class="small rec-desc">'+esc(x.desc)+'</p>':'')
        +(qe[2]?'<p class="rec-donde">'+esc(qe[2])+'</p>':'')
        +aviso+'</div>'
        +'<div class="rec-pie">'+afford+boton+'</div></div>';
    }).join('');
    return '<section><div class="eyebrow violet">Recompensas</div><h2>Mercado Estelar</h2>'
      +'<p class="lead">Tus <b>xp</b> no se gastan nunca: marcan tu nivel y hacen evolucionar a tu personaje. Lo que se canjea son los <b>créditos ◈</b>, que ganas con el mismo trabajo. Las recompensas se van desbloqueando con el viaje.</p>'
      +(d.cierre_canje&&d.cierre_canje!==d.cierre_misiones
        ? '<p class="small" style="color:var(--amber)"><b>Ojo al calendario:</b> las misiones se registran hasta el <b>'+fecha(d.cierre_misiones)+'</b>, pero el canje sigue abierto <b>una semana más</b>, hasta el <b>'+fecha(d.cierre_canje)+'</b>. Esa última semana ya no se gana nada: solo se gasta lo ganado.</p>'
        : (d.cierre_canje?'<p class="small muted">El canje cierra el <b>'+fecha(d.cierre_canje)+'</b>.</p>':''))
      // filas llenas: de tres en tres si cuadra, si no de dos en dos (con 2, 4 o 10 tarjetas)
      // 14-sep · la oferta de la semana (y las del referente), arriba y en grande
      +(ofertas.length?'<div class="ofertas">'+ofertas.map(tarjetaOferta).join('')+'</div>':'')
      +'<div class="grid '+((abiertas%3===0||abiertas<2)?'cols-3':(abiertas%2===0?'cols-2':'cols-3'))+' nave-rec">'+cards+'</div>'
      +(porCapitulos()?(function(){
          var ab=capsAbiertos(), vienen=capsTipo().filter(function(c){ return ab.indexOf(c)<0 && (c.mercado||[]).length; });
          return vienen.length?'<p class="rec-prox">🔓 <b>Próximamente en el Mercado:</b> '+vienen.map(function(c){
            return c.icono+' '+esc(c.titulo)+' <span>(semana '+semanaCap(c)+')</span>'; }).join(' · ')+'</p>':'';
        })():'')
      +(motorNuevo()
        ? (abiertas?'<p class="small muted" style="margin-top:14px">Se canjea desde aquí mismo: no hay formulario que rellenar. Las subidas de nota quedan <b>pendientes</b> hasta que tu docente las apruebe.</p>':'')
        : (abiertas&&d.formCanje?'<p style="margin-top:14px"><a class="btn primary" href="'+esc(d.formCanje)+'" target="_blank" rel="noopener">🛸 Ir al Mercado Estelar</a></p>':'<p class="small muted" style="margin-top:14px">Aún no hay recompensas canjeables: sigue sumando xp.</p>'))
      +'</section>';
  }

  // ================= EL ZOCO ESTELAR · el trueque entre reclutas (13-sep) =================
  // Norberto: «el estudiante pulsa en un avatar o una carta y la pone en venta; en el Zoco ve lo que
  // han puesto los demás y hace su oferta —dinero, cartas, avatares—; el vendedor acepta, rechaza con
  // un mensaje o contraoferta mirando el inventario del otro, y la pelota vuelve al comprador». Lo
  // decide TODO el servidor (functions/stargateZoco.js): lo ofrecido queda apartado y el cambio va en
  // una transacción. Aquí solo se enseña y se pide. En el simulacro, el otro recluta lo hace él.
  var ZAPI=function(){ return SIMULACRO ? SG.FUENTE : SG.MOTOR; };
  var TOPE_ZOCO={heroe:180, cromo:45};
  function cargarZoco(){
    var Z=ZAPI(); if(!st.yo||!abierto('zoco')||!Z||!Z.zocoDatos) return Promise.resolve();
    return Z.zocoDatos(per).then(function(d){ st.zoco=d; })
      .catch(function(e){ st.zoco={error:String(e&&e.message||e), anuncios:[], tratos:[], uid:''}; });
  }
  function zocoPendientes(){
    var z=st.zoco; if(!z||!z.tratos) return [];
    return z.tratos.filter(function(t){ return t.estado==='abierto'
      && ((t.vende.uid===z.uid&&t.turno==='vendedor')||(t.compra.uid===z.uid&&t.turno==='comprador')); });
  }
  /**
   * NOVEDADES. 🔴 13-sep · el laboratorio lo destapó: si Olga aceptaba la oferta de Pau, Pau no se
   * enteraba al entrar (el aviso solo salía cuando «te toca»); lo leía, si acaso, en el historial
   * plegado. Ahora lo que ha pasado con tus tratos desde la última vez que miraste el Zoco sale en
   * la franja de arriba y, dentro del Zoco, en «🆕 Novedades». «Visto» se guarda en este navegador.
   */
  function zocoVistoClave(){ return 'sgZocoVisto_'+per+'_'+((st.zoco&&st.zoco.uid)||''); }
  function zocoVisto(){ try{ return Number(localStorage.getItem(zocoVistoClave()))||0; }catch(e){ return 0; } }
  function zocoNovedades(){
    var z=st.zoco; if(!z||!z.tratos||SIMULACRO) return [];
    var v=zocoVisto();
    return z.tratos.filter(function(t){ return t.estado!=='abierto' && Number(t.actualizado||0)>v; });
  }
  function marcaZocoVisto(){
    var z=st.zoco; if(!z||!z.tratos) return;
    var m=zocoVisto(); z.tratos.forEach(function(t){ m=Math.max(m, Number(t.actualizado||0)); });
    try{ localStorage.setItem(zocoVistoClave(), String(m)); }catch(e){}
  }
  function fraseNovedad(t){
    var z=st.zoco||{}, soyVende=t.vende.uid===z.uid, otro=esc((soyVende?t.compra:t.vende).alias), pz='<b>'+esc(datosPieza(t.pieza).nombre)+'</b>';
    switch(t.estado){
      case 'aceptado': return soyVende ? '<b>'+otro+'</b> ha aceptado: tu '+pz+' ya es suyo y lo tuyo está en tu cuenta.'
                                       : '<b>'+otro+'</b> ha aceptado: '+pz+' ya es tuyo.';
      case 'rechazado': return soyVende ? '<b>'+otro+'</b> no ha aceptado tu contraoferta por '+pz+'.'
                                        : '<b>'+otro+'</b> ha rechazado tu oferta por '+pz+': lo que ofreciste ha vuelto a ti.';
      case 'vendido': return pz+' se lo quedó otro recluta: lo que ofreciste ha vuelto a ti.';
      case 'retirado': return soyVende ? '<b>'+otro+'</b> ha retirado su oferta por tu '+pz+'.'
                                       : '<b>'+otro+'</b> ha retirado '+pz+' del Zoco: lo que ofreciste ha vuelto a ti.';
      case 'caducado': return 'Un trato por '+pz+' caducó sin respuesta: lo apartado ha vuelto a su dueño.';
      case 'anulado': return t.motivo==='sorteo' ? 'Se hizo el sorteo antes de cerrar el trato por '+pz+': lo apartado ha vuelto a su dueño.'
                                                  : 'El trato por '+pz+' se anuló: lo apartado ha vuelto a su dueño.';
      case 'deshecho': return 'Tu docente ha deshecho el trueque de '+pz+': cada cosa ha vuelto a su dueño.';
    }
    return 'Novedades en el trato por '+pz+'.';
  }
  function piezaDeId(id){ return {id:id, tipo:/__heroe_/.test(id)?'heroe':/__sorteo[a-z0-9]*$/i.test(id)?'participacion':'cromo', clave:String(id).split('__').pop().replace(/^(heroe|cromo)_/,'')}; }
  /** 14-sep · el sorteo de una participación (su premio, su imagen, su precio y si ya se hizo) */
  function sorteoDePieza(id){ return ((st.d&&st.d.recompensas)||[]).filter(function(x){ return x.doc===id&&x.sorteo; })[0]||null; }
  function datosPieza(p){
    if(p.tipo==='participacion'){
      var s=sorteoDePieza(p.id), S=(s&&s.sorteo)||{};
      return { nombre:'Participación · '+(S.premio||'el sorteo'), rareza:'', img:'assets/img/canje/'+(S.imagen||'sorteo_generico.jpg') };
    }
    var x=p.tipo==='heroe' ? (window.SG_HEROES||[]).filter(function(h){return h[0]===p.clave;})[0]
                           : (window.SG_CROMOS||[]).filter(function(c){return c[0]===p.clave;})[0];
    return { nombre:x?x[1]:p.clave, rareza:x?String(x[3]||''):'',
             img:p.tipo==='heroe'?'assets/img/heroes/'+p.clave+'.jpg':'assets/img/tarjetas/'+p.clave+'_carta.png'+CARDV };
  }
  function miniPieza(p, extra){
    var d=datosPieza(p);
    return '<figure class="zp '+p.tipo+'"><img src="'+esc(d.img)+'" alt="" loading="lazy"><figcaption>'+esc(d.nombre)+(extra||'')+'</figcaption></figure>';
  }
  function paqueteHtml(q){
    if(!q) return '';
    var cr=Number(q.creditos)||0, ps=(q.piezas||[]).map(piezaDeId);
    return '<div class="zq">'+(cr?'<span class="zq-cr">'+cr+' ◈</span>':'')+ps.map(function(p){ return miniPieza(p); }).join('')
      +(!cr&&!ps.length?'<em>nada</em>':'')+'</div>';
  }
  /**
   * Lo que tiene alguien para cambiar: [{id, tipo, clave, n}] (de su ficha del tablero). Con
   * `conParticipaciones`, también sus participaciones de sorteos abiertos: se pueden VENDER, pero no
   * sirven para pagar (el servidor no las aparta: una papeleta apartada se quedaría fuera del bombo).
   */
  function piezasDe(r, conParticipaciones){
    var out=[];
    // (el Contramaestre no: es de quien completa los logros de a bordo, y el servidor lo rechaza)
    Object.keys((r&&r.heroes_n)||{}).forEach(function(k){ if((AB.heroes||[]).indexOf(k)<0) out.push({id:per+'__heroe_'+k, tipo:'heroe', clave:k, n:r.heroes_n[k]}); });
    Object.keys((r&&r.cromos)||{}).forEach(function(k){ if(r.cromos[k]>0) out.push({id:per+'__cromo_'+k, tipo:'cromo', clave:k, n:r.cromos[k]}); });
    if(conParticipaciones) Object.keys((r&&r.participaciones)||{}).forEach(function(id){
      var s=sorteoDePieza(id), n=Number(r.participaciones[id])||0;
      if(n>0&&s&&!s.sorteo.hecho) out.push({id:id, tipo:'participacion', clave:String(id).split('__').pop(), n:n}); });
    return out;
  }
  /** El tope de créditos por una pieza: 3 veces su precio (una participación, 3 veces lo que cuesta). */
  function topeZoco(p){ if(p.tipo!=='participacion') return TOPE_ZOCO[p.tipo]||45; var s=sorteoDePieza(p.id); return Math.max(15, 3*((s&&s.coste)||0)); }
  var ESTADO_TRATO={aceptado:'✅ Cambiado', rechazado:'✖️ Rechazado', retirado:'↩️ Retirado', caducado:'⌛ Caducó sin respuesta',
    anulado:'🚫 Anulado: ya no lo tenía', vendido:'💰 Se lo quedó otro', deshecho:'↺ Deshecho por el docente'};
  function tarjetaTrato(t, z){
    var soyVende=t.vende.uid===z.uid, otro=soyVende?t.compra:t.vende, pz=datosPieza(t.pieza);
    var toca=t.estado==='abierto'&&((soyVende&&t.turno==='vendedor')||(!soyVende&&t.turno==='comprador'));
    var tit = soyVende ? '<b>'+esc(otro.alias)+'</b> quiere tu <b>'+esc(pz.nombre)+'</b>'
                       : 'Tu oferta por <b>'+esc(pz.nombre)+'</b> de <b>'+esc(otro.alias)+'</b>';
    var cuerpo = '<div class="zt-fila"><div><span class="zt-et">'+(soyVende?'Te ofrece':'Ofreces')+'</span>'+paqueteHtml(t.ofrece)+'</div>'
      +(t.pide?'<div><span class="zt-et">'+(soyVende?'Le pides':'Te pide')+'</span>'+paqueteHtml(t.pide)+'</div>':'')+'</div>'
      +((t.mensajes||[]).length?'<ul class="zt-msgs">'+t.mensajes.map(function(m){
          var suyo=(m.de==='vendedor')===soyVende; return '<li class="'+(suyo?'mio':'suyo')+'"><b>'+esc(suyo?'Tú':otro.alias)+':</b> «'+esc(m.texto)+'»</li>'; }).join('')+'</ul>':'');
    var botones='';
    if(toca && soyVende && t.paso===1) botones='<button class="btn primary" data-zt="aceptar" data-t="'+t.id+'">✅ Aceptar</button>'
      +'<button class="btn" data-zt="contraofertar" data-t="'+t.id+'">↩️ Contraofertar</button>'
      +'<button class="btn" data-zt="rechazar" data-t="'+t.id+'">✖️ Rechazar</button>';
    else if(toca && !soyVende && t.paso===2) botones='<button class="btn primary" data-zt="aceptar" data-t="'+t.id+'">✅ Aceptar</button>'
      +'<button class="btn" data-zt="rechazar" data-t="'+t.id+'">✖️ No, gracias</button>';
    else if(t.estado==='abierto' && !soyVende && t.paso===1) botones='<button class="btn small" data-zt="retirar" data-t="'+t.id+'">Retirar mi oferta</button>';
    var estado = t.estado==='abierto' ? (toca?'<span class="chip wip">Te toca</span>':'<span class="chip">⏳ Esperando a '+esc(otro.alias)+'</span>')
                                      : '<span class="chip">'+(t.estado==='anulado'&&t.motivo==='sorteo'?'🎟️ Anulado: ya se sorteó':(ESTADO_TRATO[t.estado]||t.estado))+'</span>';
    return '<div class="card zt'+(toca?' toca':'')+'"><div class="zt-cab"><img class="zt-pz '+t.pieza.tipo+'" src="'+esc(pz.img)+'" alt="">'
      +'<div><p class="zt-tit">'+tit+'</p>'+estado+(t.paso===2&&t.estado==='abierto'?' <span class="chip">paso 2 de 3</span>':'')+'</div></div>'
      +cuerpo+(botones?'<div class="zt-btns">'+botones+'</div>':'')+'</div>';
  }
  function zocoVista(){
    var z=st.zoco, r=st.yo||{};
    if(!z){ cargarZoco().then(function(){ if(st.tab==='zoco') render(); }); return '<section><h2>El Zoco Estelar</h2><div class="card">'+cargando('Abriendo el Zoco…','')+'</div></section>'; }
    if(z.error) return '<section><h2>El Zoco Estelar</h2><div class="card"><p class="malo">No he podido abrir el Zoco: '+esc(z.error)+'</p></div></section>';
    // 14-sep · las participaciones de un sorteo que ya se ha hecho ya no valen: no se enseñan
    var vale=function(a){ if(a.pieza.tipo!=='participacion') return true; var s=sorteoDePieza(a.pieza.id); return !!(s&&!s.sorteo.hecho); };
    var pend=zocoPendientes(), mios=z.anuncios.filter(function(a){ return a.vende.uid===z.uid&&vale(a); }),
        otros=z.anuncios.filter(function(a){ return a.vende.uid!==z.uid&&vale(a); });
    var apartado=z.tratos.filter(function(t){ return t.estado==='abierto'&&t.compra.uid===z.uid; })
      .reduce(function(a,t){ return a+(Number(t.ofrece&&t.ofrece.creditos)||0); },0);
    var miOferta={}; z.tratos.forEach(function(t){ if(t.estado==='abierto'&&t.compra.uid===z.uid) miOferta[t.anuncio]=t; });
    var ofertasA={}; z.tratos.forEach(function(t){ if(t.estado==='abierto'&&t.vende.uid===z.uid) ofertasA[t.anuncio]=(ofertasA[t.anuncio]||0)+1; });
    var tarjeta=function(a, mio){
      var d=datosPieza(a.pieza), mo=miOferta[a.id];
      return '<div class="card zc '+a.pieza.tipo+'"><div class="zc-img"><img src="'+esc(d.img)+'" alt="" loading="lazy"></div>'
        +'<div class="zc-txt"><b>'+esc(d.nombre)+'</b><span class="zc-meta">'+(d.rareza?esc(d.rareza.charAt(0).toUpperCase()+d.rareza.slice(1).toLowerCase())+' · ':'')+(mio?'<em>tuyo</em>':'de '+esc(a.vende.alias))+'</span>'
        +(mio ? (ofertasA[a.id]?'<span class="chip ok">'+ofertasA[a.id]+' oferta'+(ofertasA[a.id]>1?'s':'')+'</span>':'<span class="chip">sin ofertas aún</span>')
               +'<button class="btn small" data-zretirar="'+a.id+'">Retirar</button>'
              : mo ? '<span class="chip">⏳ Ya has ofertado</span>'
                   : '<button class="btn primary" data-zofertar="'+a.id+'">Hacer una oferta</button>')
        +'</div></div>';
    };
    if(!st.zocoNov){ st.zocoNov=zocoNovedades().map(function(t){ return t.id; }); marcaZocoVisto(); }
    var nov=z.tratos.filter(function(t){ return t.estado!=='abierto' && st.zocoNov.indexOf(t.id)>=0; });
    var hist=z.tratos.filter(function(t){ return t.estado!=='abierto' && nov.indexOf(t)<0; }).slice(0,6);
    var abiertos=z.tratos.filter(function(t){ return t.estado==='abierto' && pend.indexOf(t)<0; });
    return '<section class="zoco"><div class="eyebrow violet">Trueque entre reclutas</div><h2>El Zoco Estelar</h2>'
      +'<p class="lead">Pon tus héroes, cromos o participaciones del sorteo y los demás te ofrecen lo suyo: créditos, cartas o héroes. Lo que ofreces queda <b>apartado</b> hasta que te respondan, y cada trato se cierra en <b>3 pasos</b> como mucho.</p>'
      +'<div class="zoco-barra"><button class="btn primary grande" id="z-poner" type="button">➕ Poner algo mío</button>'
      +'<span class="small">Tienes <b>'+(r.creditos!=null?r.creditos:0)+' ◈</b>'+(apartado?' · <b>'+apartado+' ◈</b> apartados en tus ofertas':'')+'</span></div>'
      +(nov.length?'<h3 class="z-h">🆕 Novedades</h3><div class="zt-lista">'+nov.map(function(t){ return '<p class="zt-nov">'+fraseNovedad(t)+'</p>'+tarjetaTrato(t,z); }).join('')+'</div>':'')
      +(pend.length?'<h3 class="z-h">🔔 Te toca responder</h3><div class="zt-lista">'+pend.map(function(t){ return tarjetaTrato(t,z); }).join('')+'</div>':'')
      +'<h3 class="z-h">En el Zoco ahora <span class="small muted">'+otros.length+'</span></h3>'
      +(otros.length?'<div class="zc-grid">'+otros.map(function(a){ return tarjeta(a,false); }).join('')+'</div>'
                    :'<p class="small muted">Todavía nadie ha puesto nada. Sé el primero: pulsa «Poner algo mío».</p>')
      +(mios.length?'<h3 class="z-h">Lo tuyo en el Zoco <span class="small muted">'+mios.length+'</span></h3><div class="zc-grid">'+mios.map(function(a){ return tarjeta(a,true); }).join('')+'</div>':'')
      +(abiertos.length?'<h3 class="z-h">Tus tratos en marcha</h3><div class="zt-lista">'+abiertos.map(function(t){ return tarjetaTrato(t,z); }).join('')+'</div>':'')
      +(hist.length?'<details class="cajon"><summary><b>Historial</b> <span class="cnt">'+hist.length+'</span></summary><div class="zt-lista">'+hist.map(function(t){ return tarjetaTrato(t,z); }).join('')+'</div></details>':'')
      +'</section>';
  }
  // ── las ventanas del Zoco (poner, ofertar, contraofertar, rechazar)
  function zocoCapa(html){
    var capa=document.createElement('div'); capa.className='zoco-capa';
    capa.innerHTML='<div class="zoco-caja" role="dialog" aria-modal="true">'+html+'</div>';
    document.body.appendChild(capa);
    var fuera=function(){ document.removeEventListener('keydown',tecla,true); if(capa.parentNode) capa.parentNode.removeChild(capa); };
    var tecla=function(e){ if(e.key==='Escape'){ e.preventDefault(); fuera(); } };
    document.addEventListener('keydown',tecla,true);
    capa.onclick=function(e){ if(e.target===capa) fuera(); };
    Array.prototype.forEach.call(capa.querySelectorAll('[data-cerrar]'),function(b){ b.onclick=fuera; });
    return { capa:capa, fuera:fuera };
  }
  function selector(piezas, max, marcadas){
    return '<div class="zm-grid">'+piezas.map(function(p){
      var d=datosPieza(p), ya=(marcadas&&marcadas[p.id])||0;
      return '<button type="button" class="zm-p '+p.tipo+'" data-p="'+esc(p.id)+'" aria-pressed="false"'+(p.n-ya<=0?' disabled':'')+'>'
        +'<img src="'+esc(d.img)+'" alt="" loading="lazy"><b>'+esc(d.nombre)+'</b>'
        +(p.n>1?'<span class="nx">×'+p.n+'</span>':'')+(ya?'<span class="zm-ya">'+(p.n-ya<=0?'ya en el Zoco':ya+' en el Zoco')+'</span>':'')+'</button>'; }).join('')+'</div>';
  }
  function cablearSelector(caja, max, alCambiar){
    var el=[];
    Array.prototype.forEach.call(caja.querySelectorAll('.zm-p'),function(b){
      b.onclick=function(){ var id=b.getAttribute('data-p'), i=el.indexOf(id);
        if(i>=0){ el.splice(i,1); b.classList.remove('on'); b.setAttribute('aria-pressed','false'); }
        else { if(el.length>=max) return; el.push(id); b.classList.add('on'); b.setAttribute('aria-pressed','true'); }
        alCambiar(el); };
    });
    return function(){ return el.slice(); };
  }
  /** Los mensajes del servidor nombran las piezas por su clave (H03_xeno): aquí, por su nombre. */
  function bonitoZoco(t){
    return String(t||'').replace(/^[A-Za-z]*Error:\s*/,'').replace(/\b([A-Z]\d{1,2}_[a-z0-9_]+)\b/g, function(m){
      var x=(window.SG_HEROES||[]).filter(function(h){return h[0]===m;})[0]||(window.SG_CROMOS||[]).filter(function(c){return c[0]===m;})[0];
      return x?'«'+x[1]+'»':m; });
  }
  /**
   * El final de un trato, en la ventana de NEBULA. 🔴 13-sep · «Sí, cambiar» dejaba la pregunta
   * ABIERTA para siempre: `nebulaPregunta` no se cierra al decir que sí (el sí se transforma en la
   * entrega), y el Zoco no la transformaba. Ahora el sí pasa a «Un momento…» y luego al resultado.
   */
  function zocoFin(o){
    var capa=document.querySelector('.neb-capa');
    if(!capa){ capa=document.createElement('div'); capa.className='neb-capa'; document.body.appendChild(capa); }
    capa.classList.remove('cerrando');
    capa.innerHTML='<div class="neb-caja '+(o.mal?'mal':'gana')+'" role="dialog" aria-modal="true" aria-labelledby="neb-t">'
      +'<div class="neb-cara"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div><div class="neb-quien">NEBULA</div>'
      +'<h3 id="neb-t">'+o.titulo+'</h3>'+(o.arte?'<div class="neb-arte"><img src="'+esc(o.arte)+'" alt=""></div>':'')
      +'<p class="neb-nota">'+o.texto+'</p><div class="neb-botones"><button type="button" class="btn primary" data-cerrar>Seguir</button></div></div>';
    var b=capa.querySelector('[data-cerrar]');
    var fuera=function(){ document.removeEventListener('keydown',tecla,true); capa.classList.add('cerrando');
      setTimeout(function(){ if(capa.parentNode) capa.parentNode.removeChild(capa); },160); };
    var tecla=function(e){ if(e.key==='Escape'){ e.preventDefault(); fuera(); } };
    document.addEventListener('keydown',tecla,true);
    b.onclick=fuera; capa.onclick=function(ev){ if(ev.target===capa) fuera(); };
    setTimeout(function(){ b.focus(); },40);
  }
  function zocoEspera(){
    var bs=document.querySelector('.neb-capa .neb-botones'); if(bs) bs.innerHTML='<p class="neb-nota">Un momento…</p>';
  }
  /**
   * Pedir algo al Zoco y repintar. `ok(r)` devuelve un texto (aviso abajo) o {titulo, texto, arte,
   * mal} (ventana de NEBULA). Los errores, siempre en la ventana: un aviso de 6 s no se lee entero.
   */
  function tras(promesa, ok){
    zocoEspera();
    return promesa.then(function(r){
      hitosLuego(2500);      // 15-sep · poner algo o cerrar un trato puede ser un logro de a bordo
      return cargarZoco().then(function(){ if(st.tab==='zoco') marcaZocoVisto(); quien(null,function(d){ if(d&&d.yo) st.yo=d.yo; render();
        var m=ok?ok(r):'';
        if(m&&typeof m==='object') return zocoFin(m);
        var capa=document.querySelector('.neb-capa'); if(capa&&capa.parentNode) capa.parentNode.removeChild(capa);
        if(m) aviso(m); }); });
    }).catch(function(e){
      zocoFin({ titulo:'No se ha podido', mal:true, texto:esc(bonitoZoco(e&&e.message||e))+'<br><b>No se ha tocado nada.</b>' });
      cargarZoco().then(function(){ render(); });
    });
  }
  function zocoPonerVentana(soloId){
    var z=st.zoco||{anuncios:[]}, puestas={};
    z.anuncios.forEach(function(a){ if(a.vende.uid===z.uid) puestas[a.pieza.id]=(puestas[a.pieza.id]||0)+1; });
    if(soloId){
      var pz=datosPieza(piezaDeId(soloId));
      return nebulaPregunta({ titulo:'¿Pongo «'+esc(pz.nombre)+'» en el Zoco?',
        cuerpo:'<p class="neb-nota">Sigue siendo tuyo (y te lo puedes seguir poniendo) hasta que aceptes una oferta. Lo retiras cuando quieras.</p>',
        si:'Sí, ponerlo', no:'Ahora no' }).then(function(ok){ if(ok) tras(ZAPI().zocoPoner(per,[soloId]), function(){ return '🔄 <b>'+esc(pz.nombre)+'</b> ya está en el Zoco.'; }); });
    }
    var mias=piezasDe(st.yo, true);
    if(!mias.length) return aviso('Todavía no tienes héroes, cromos ni participaciones que cambiar.');
    var v=zocoCapa('<h3>Poner algo tuyo en el Zoco</h3><p class="small muted">Marca uno o varios. Siguen siendo tuyos hasta que aceptes una oferta.</p>'
      +selector(mias, 8, puestas)
      +'<div class="zm-pie"><button class="btn primary" id="zm-ok" disabled>Poner en el Zoco</button><button class="btn" data-cerrar>Cancelar</button></div>');
    var ok=v.capa.querySelector('#zm-ok');
    var el=cablearSelector(v.capa, 8, function(l){ ok.disabled=!l.length; ok.textContent=l.length?'Poner '+l.length+' en el Zoco':'Poner en el Zoco'; });
    ok.onclick=function(){ var l=el(); if(!l.length) return; ok.disabled=true; v.fuera();
      tras(ZAPI().zocoPoner(per,l), function(){ return '🔄 <b>'+l.length+'</b> '+(l.length===1?'cosa':'cosas')+' en el Zoco.'; }); };
  }
  function zocoOfertaVentana(anuncio){
    var d=datosPieza(anuncio.pieza), tope=topeZoco(anuncio.pieza), mis=Number((st.yo||{}).creditos)||0;
    var z=st.zoco||{anuncios:[]}, puestas={};
    z.anuncios.forEach(function(a){ if(a.vende.uid===z.uid) puestas[a.pieza.id]=(puestas[a.pieza.id]||0)+1; });
    var v=zocoCapa('<h3>Tu oferta por '+esc(d.nombre)+'</h3><p class="small muted">de <b>'+esc(anuncio.vende.alias)+'</b> · lo que ofreces queda apartado hasta que te responda</p>'
      +'<div class="zm-obj">'+miniPieza(anuncio.pieza)+'</div>'
      +'<label class="zm-campo">Créditos <span class="small muted">(tienes '+mis+' ◈ · como mucho '+tope+')</span><input type="number" id="zm-cr" min="0" max="'+Math.min(tope,mis)+'" value="0"></label>'
      +'<p class="zm-et">Y/o héroes y cartas tuyos <span class="small muted">(hasta 5)</span></p>'+selector(piezasDe(st.yo), 5, puestas)
      +'<label class="zm-campo">Un mensaje <span class="small muted">(opcional, lo verá también tu docente)</span><input id="zm-msg" maxlength="140" placeholder="¿Te vale esto?"></label>'
      +'<div class="zm-pie"><button class="btn primary" id="zm-ok">Enviar oferta</button><button class="btn" data-cerrar>Cancelar</button></div>');
    var el=cablearSelector(v.capa, 5, function(){});
    v.capa.querySelector('#zm-ok').onclick=function(){
      var cr=Math.max(0,Math.floor(Number(v.capa.querySelector('#zm-cr').value)||0)), ps=el();
      if(!cr&&!ps.length) return aviso('Ofrece algo: créditos, cartas o héroes.');
      if(cr>mis) return aviso('No tienes '+cr+' ◈.');
      v.fuera();
      tras(ZAPI().zocoOfertar(anuncio.id,{creditos:cr,piezas:ps},v.capa.querySelector('#zm-msg').value), function(){ return '📨 Oferta enviada a <b>'+esc(anuncio.vende.alias)+'</b>. Lo ofrecido queda apartado.'; });
    };
  }
  function zocoContraVentana(t){
    var d=datosPieza(t.pieza), tope=topeZoco(t.pieza);
    var buscar=function(l){ return (l||[]).filter(function(x){ return x.fid===t.compra.ficha; })[0]; };
    var suyo=buscar(st.d&&st.d.reclutas)||buscar((window.SG_TABLERO_DATA||{}).reclutas);
    // lo que tiene el comprador, más lo que ya ofreció (está apartado, pero es suyo)
    var ps=piezasDe(suyo); (t.ofrece.piezas||[]).forEach(function(id){ if(!ps.some(function(p){return p.id===id;})) { var p=piezaDeId(id); p.n=1; ps.push(p); } });
    var v=zocoCapa('<h3>Contraoferta por tu '+esc(d.nombre)+'</h3><p class="small muted">Esto es lo que tiene <b>'+esc(t.compra.alias)+'</b>. Elige lo que quieres: la pelota vuelve a su tejado y tendrá la última palabra.</p>'
      +'<label class="zm-campo">Créditos <span class="small muted">(como mucho '+tope+')</span><input type="number" id="zm-cr" min="0" max="'+tope+'" value="'+(Number(t.ofrece.creditos)||0)+'"></label>'
      +(ps.length?'<p class="zm-et">Y/o sus héroes y cartas <span class="small muted">(hasta 5)</span></p>'+selector(ps,5):'<p class="small muted">No tiene héroes ni cartas: pídele créditos.</p>')
      +'<label class="zm-campo">Un mensaje <span class="small muted">(opcional)</span><input id="zm-msg" maxlength="140" placeholder="Casi… ¿le sumas algo?"></label>'
      +'<div class="zm-pie"><button class="btn primary" id="zm-ok">Enviar contraoferta</button><button class="btn" data-cerrar>Cancelar</button></div>');
    var el=cablearSelector(v.capa, 5, function(){});
    v.capa.querySelector('#zm-ok').onclick=function(){
      var cr=Math.max(0,Math.floor(Number(v.capa.querySelector('#zm-cr').value)||0)), l=el();
      if(!cr&&!l.length) return aviso('Di qué quieres a cambio.');
      v.fuera();
      tras(ZAPI().zocoResponder(t.id,'contraofertar',{pide:{creditos:cr,piezas:l}, mensaje:v.capa.querySelector('#zm-msg').value}), function(){ return '↩️ Contraoferta enviada a <b>'+esc(t.compra.alias)+'</b>: ahora le toca a él.'; });
    };
  }
  function zocoRechazarVentana(t){
    var soyVende=st.zoco&&t.vende.uid===st.zoco.uid, otro=soyVende?t.compra:t.vende;
    var v=zocoCapa('<h3>'+(soyVende?'Rechazar la oferta':'No aceptar')+' de '+esc(otro.alias)+'</h3>'
      +'<p class="small muted">'+(soyVende?'Lo que te ofrecía vuelve a su dueño.':'Lo que ofreciste vuelve a ti.')+' Puedes dejarle un mensaje.</p>'
      +'<label class="zm-campo">Mensaje <span class="small muted">(opcional)</span><input id="zm-msg" maxlength="140" placeholder="Pides poco · Ya lo tengo · Busco un MITO…"></label>'
      +'<div class="zm-pie"><button class="btn primary" id="zm-ok">'+(soyVende?'Rechazar':'No, gracias')+'</button><button class="btn" data-cerrar>Volver</button></div>');
    v.capa.querySelector('#zm-ok').onclick=function(){ var m=v.capa.querySelector('#zm-msg').value; v.fuera();
      tras(ZAPI().zocoResponder(t.id,'rechazar',{mensaje:m}), function(){ return '✖️ Hecho. '+(soyVende?'Su oferta ha vuelto a '+esc(otro.alias)+'.':'Lo que ofreciste ha vuelto a ti.'); }); };
  }
  function cablearZoco(){
    if(st.tab!=='zoco') return;
    var z=st.zoco; if(!z) return;
    var b=document.getElementById('z-poner'); if(b) b.onclick=function(){ zocoPonerVentana(); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-zofertar]'),function(x){
      x.onclick=function(){ var a=z.anuncios.filter(function(y){ return y.id===x.getAttribute('data-zofertar'); })[0]; if(a) zocoOfertaVentana(a); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-zretirar]'),function(x){
      x.onclick=function(){ tras(ZAPI().zocoRetirar(x.getAttribute('data-zretirar')), function(){ return '↩️ Retirado del Zoco. Si había ofertas, han vuelto a sus dueños.'; }); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-zt]'),function(x){
      x.onclick=function(){
        var t=z.tratos.filter(function(y){ return y.id===x.getAttribute('data-t'); })[0]; if(!t) return;
        var acc=x.getAttribute('data-zt'), pz=datosPieza(t.pieza);
        if(acc==='contraofertar') return zocoContraVentana(t);
        if(acc==='rechazar') return zocoRechazarVentana(t);
        if(acc==='retirar') return tras(ZAPI().zocoResponder(t.id,'retirar'), function(){ return '↩️ Oferta retirada: lo apartado ha vuelto a ti.'; });
        if(acc==='aceptar'){
          var soyVende=t.vende.uid===z.uid, pago=t.paso===2?t.pide:t.ofrece;
          return nebulaPregunta({ titulo: soyVende?'¿Cambias tu «'+esc(pz.nombre)+'»?':'¿Aceptas y te llevas «'+esc(pz.nombre)+'»?',
            cuerpo:'<p class="neb-nota">'+(soyVende?'Te llevas':'Pagas')+':</p>'+paqueteHtml(pago),
            si:'Sí, cambiar', no:'Ahora no' }).then(function(ok){ if(!ok) return;
              tras(ZAPI().zocoResponder(t.id,'aceptar'), function(r){
                if(r&&r.motivo) return { titulo:'Trato anulado', mal:true, texto:esc(bonitoZoco(r.motivo)) };
                var otro=soyVende?t.compra:t.vende;
                return { titulo:'¡Trato hecho!', arte:pz.img, texto: soyVende
                  ? 'Tu <b>'+esc(pz.nombre)+'</b> ya es de <b>'+esc(otro.alias)+'</b>, y lo que te ha dado ya está en tu cuenta.'
                  : '<b>'+esc(pz.nombre)+'</b> ya es tuyo: lo tienes en «Mi botín».' }; }); });
        }
      };
    });
  }
  /**
   * «El vendedor recibirá un aviso la próxima vez que se conecte» (Norberto). 🔴 Era un aviso
   * flotante de 3 segundos: quien entraba mirando el móvil no lo veía nunca. Ahora es una franja
   * FIJA arriba de la Nave, en cualquier pestaña menos el propio Zoco, hasta que responda.
   */
  function avisoZoco(){
    if(!abierto('zoco')||st.tab==='zoco') return '';
    var n=zocoPendientes().length, nov=zocoNovedades();
    if(!n&&!nov.length) return '';
    var txt = n ? '🔔 <b>El Zoco Estelar:</b> tienes <b>'+n+'</b> trato'+(n>1?'s':'')+' esperando tu respuesta.'
                  +(nov.length?' Y '+nov.length+' novedad'+(nov.length>1?'es':'')+'.':'')
                : '🆕 <b>El Zoco Estelar:</b> '+fraseNovedad(nov[0])+(nov.length>1?' <span class="small">(y '+(nov.length-1)+' más)</span>':'');
    return '<div class="card zoco-aviso" role="status"><p>'+txt+'</p><button type="button" class="btn primary" data-tab="zoco">Ir al Zoco</button></div>';
  }
  /** 14-sep · el Gran Sorteo ya se ha hecho: a quien gana, que lo sepa nada más entrar; y a todos, quién. */
  function sorteosHechosSinVer(){
    var r=st.yo; if(!r||SIMULACRO) return [];
    return ((st.d&&st.d.recompensas)||[]).filter(function(x){
      return x.tipo==='sorteo'&&x.sorteo&&x.sorteo.hecho&&!localStorage.getItem('sgSorteoVisto_'+per+'_'+x.doc); });
  }
  function avisoSorteo(){
    var l=sorteosHechosSinVer(); if(!l.length) return '';
    var x=l[0], S=x.sorteo, gane=(S.ganadoresFichas||[]).indexOf(st.yo.fid)>=0, nadie=!(S.ganadoresAlias||[]).length;
    return '<div class="card sorteo-aviso'+(gane?' gane':'')+'" role="status"><p>'+(gane
        ? '🏆 <b>¡Has ganado el Gran Sorteo!</b> Te llevas: <b>'+esc(S.premio)+'</b>. Tu docente te dirá cómo recibirlo.'
        : nadie ? '🎟️ <b>El Gran Sorteo se ha resuelto:</b> esta vez nadie tenía participaciones.'
        : '🎟️ <b>El Gran Sorteo ya tiene ganadores:</b> '+esc(S.premio)+' para <b>'+(S.ganadoresAlias||[]).map(esc).join('</b> y <b>')+'</b>.')
      +'</p><span><button type="button" class="btn primary" data-sorteo-ver="'+esc(x.doc)+'">🎟️ Ver resultado del sorteo</button>'
      +'<button type="button" class="btn" data-sorteo-visto="'+esc(x.doc)+'" aria-label="Cerrar el aviso">✕</button></span></div>';
  }
  /**
   * 14-sep · «VER RESULTADO DEL SORTEO» (Norberto: «se resuelve la semana 16, automáticamente; los
   * estudiantes cuando entran esa semana les aparecerá "ver resultado del sorteo" y los ganadores»).
   * NEBULA lo cuenta: el premio, los ganadores con su cara (uno a uno) y qué te ha pasado a ti. Como
   * en una lotería, lo jugado no se devuelve.
   */
  function verResultadoSorteo(x){
    var S=x.sorteo||{}, R=(st.d&&st.d.reclutas)||[], gane=(S.ganadoresFichas||[]).indexOf(st.yo&&st.yo.fid)>=0;
    var gente=(S.ganadoresFichas||[]).map(function(f,i){ return R.filter(function(r){ return r.fid===f; })[0] || { alias:(S.ganadoresAlias||[])[i]||'', avatar:null, xp:0 }; });
    var capa=document.createElement('div'); capa.className='neb-capa';
    capa.innerHTML='<div class="neb-caja gana sorteo-resultado" role="dialog" aria-modal="true" aria-labelledby="sres-t">'
      +'<div class="neb-cara"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div><div class="neb-quien">NEBULA</div>'
      +'<h3 id="sres-t">🎟️ El resultado del Gran Sorteo</h3>'
      +'<div class="neb-arte"><img src="assets/img/canje/'+esc(S.imagen||'sorteo_generico.jpg')+'" alt=""></div>'
      +'<p class="neb-nota">'+esc(S.premio||'')+(S.fecha?' · sorteado el <b>'+fechaLarga(S.fecha)+'</b>':'')+'</p>'
      +(gente.length?'<div class="sres-gan">'+gente.map(function(p,i){
          return '<figure style="--i:'+i+'">'+(SG.avatarImg?SG.avatarImg(p.avatar,p.alias,'',p.xp,(st.d||{}).tipo):'')+'<figcaption>'+esc(p.alias)+'</figcaption></figure>'; }).join('')+'</div>'
        :'<p class="neb-nota">Nadie tenía participaciones: esta vez no hubo ganadores.</p>')
      +'<p class="neb-nota sres-tu">'+(gane?'🏆 <b>¡Eres tú!</b> Tu docente te dirá cómo recibir tu premio.'
        :'Esta vez no te ha tocado. Como en toda lotería, lo jugado no se devuelve… ¡suerte en la próxima!')+'</p>'
      +'<div class="neb-botones"><button type="button" class="btn primary" data-cerrar>Seguir</button></div></div>';
    document.body.appendChild(capa);
    var fuera=function(){ document.removeEventListener('keydown',tecla,true); if(capa.parentNode) capa.parentNode.removeChild(capa); render(); };
    // 15-sep · el foco, dentro: en «Seguir» al abrir y el tabulador no se escapa detrás (si no, otro
    // Enter sobre «Ver resultado» abría una segunda ventana encima)
    var tecla=function(e){
      if(e.key==='Escape'){ e.preventDefault(); fuera(); return; }
      if(e.key==='Tab'){ var fs=[].slice.call(capa.querySelectorAll('button,a[href]')); if(!fs.length) return;
        var i=fs.indexOf(document.activeElement), sig=e.shiftKey?(i<=0?fs.length-1:i-1):(i>=fs.length-1?0:i+1);
        e.preventDefault(); fs[sig].focus(); }
    };
    document.addEventListener('keydown',tecla,true);
    capa.querySelector('[data-cerrar]').onclick=fuera; capa.onclick=function(ev){ if(ev.target===capa) fuera(); };
    try{ capa.querySelector('[data-cerrar]').focus(); }catch(e){}
    if(gane&&window.SG&&SG.FIESTA) setTimeout(function(){ SG.FIESTA.sonar('insignia'); var a=capa.querySelector('.neb-arte'); if(a){ var r=a.getBoundingClientRect(); SG.FIESTA.chispas(r.left+r.width/2, r.top+r.height/2, ['#ffd166','#37e0ec','#ffffff']); } }, 900);
  }
  /** 14-sep · al entrar: si un sorteo ha pasado su fecha y no se ha hecho, se le pide al servidor (una vez) */
  var sorteosPedidos=false;
  function sorteosAlEntrar(){
    if(sorteosPedidos||!st.yo||SIMULACRO||!motorNuevo()) return;
    var ahora=Date.now(), M=window.SG&&window.SG.MOTOR;
    var vencidos=((st.d&&st.d.recompensas)||[]).filter(function(x){ return x.tipo==='sorteo'&&x.sorteo&&!x.sorteo.hecho&&x.sorteo.fecha&&x.sorteo.fecha<=ahora; });
    if(!vencidos.length||!M||!M.sorteosPendientes) return;
    sorteosPedidos=true;
    M.sorteosPendientes(per).then(function(r){
      if(!r||!(r.resueltos||[]).length) return;
      return SG.FUENTE.tablero(per, true).then(function(d){ if(d&&!d.error){ st.d=d; } quien(null,function(d2){ if(d2&&d2.yo) st.yo=d2.yo; render(); }); });
    }).catch(function(){});
  }
  function zocoAlEntrar(){
    if(!abierto('zoco')||!st.yo) return;
    cargarZoco().then(function(){ if(zocoPendientes().length||zocoNovedades().length) render(); });
  }
  document.addEventListener('sg:zoco', function(){ cargarZoco().then(function(){ render(); }); });

  // ---------- onboarding NEBULA, en DOS actos ----------
  // 🔴 11-sep · Norberto: «debería tener dos momentos». Tenía razón y era un fallo de fondo: NEBULA
  // te explicaba tu ficha, tus créditos y tu personaje ANTES de que existiera nada de eso, porque la
  // nave está cerrada hasta que escribes el correo. Explicar una habitación a oscuras y luego
  // encender la luz es el orden equivocado.
  //   ACTO 1 (puerta)  · quién soy y qué necesito de ti. Nada más.
  //   ACTO 2 (a bordo) · ya con su ficha delante, qué es cada cosa.
  var PASOS_PUERTA=[
    {t:'Canal abierto, recluta',x:'Soy <b>NEBULA</b>, la inteligencia de esta nave. La galaxia se apaga por <b>la Estática</b> — un silencio que hace que nadie cree, registre ni comparta. Cruzarás <b>ocho planetas</b> (los ocho temas del curso) para reencenderla.'},
    {t:'Tu arma: la Bitácora',x:'Contra la Estática no sirven las armas: sirve <b>dejar constancia</b>. Tu <b>Bitácora Estelar</b> es tu ePortfolio: cada evidencia que registres la hace más fuerte. Cuando esté completa, la puerta a la Tierra se abrirá.'},
    {t:'Y ahora, ¿quién eres?',x:'Esta nave es <b>tuya</b>, pero no puedo abrirla sin saber a quién se la abro. Escribe ahí arriba el <b>correo</b> con el que te alistaste.<br><br>¿Todavía no te has alistado? Escríbelo igualmente: te doy el enlace para subir a bordo.<br><br><b>Nos vemos al otro lado.</b>'}
  ];
  // 🔴 12-sep · Reescrito con la Nave nueva. El acto 2 hablaba de «seis pestañas», de marcar los
  // retos en la Bitácora y señalaba botones de una parrilla de accesos que ya no existe. Un guía que
  // señala a un sitio vacío es peor que no tener guía.
  /**
   * 🔴 13-sep · UN SOLO ACTO, YA DENTRO. Con la puerta única el recluta llega a la Nave con la sesión
   * de Google hecha: el «acto 1» que le pedía «escribe ahí arriba el correo con el que te
   * alistaste» se le enseñaba A QUIEN YA HABÍA ENTRADO (la sesión tarda un instante en confirmarse y
   * la comprobación miraba antes). Así que la historia de NEBULA abre este acto, sobre su propia
   * ficha, y cada paso señala algo que existe hoy en pantalla: los vídeos, los retos con el enlace y
   * el tope diario, los marcadores, las pestañas y el mercado.
   */
  var PASOS=[
    {t:'Canal abierto, recluta',foco:'.nave-estado',
     x:'Soy <b>NEBULA</b>, la inteligencia de esta nave. La galaxia se apaga por <b>la Estática</b>, un silencio que hace que nadie cree ni comparta. Cruzarás <b>ocho planetas</b>, los ocho temas del curso, para reencenderla.<br><br><b>Esto de aquí eres tú</b>: tu personaje, tu nivel y lo que llevas ganado. Al lado, la orden de esta semana.'},
    {t:'La historia, en grande',foco:'.cine',
     x:'Cada semana se desbloquean los <b>vídeos</b> de la historia. Se ven aquí, a buen tamaño, y con las semanas de arriba vuelves a los anteriores cuando quieras.'},
    {t:'Lo que puedes conseguir',foco:'.retos-semana',
     x:'Los <b>retos de esta semana</b>, con lo que da cada uno: <b>experiencia</b>, que sube de nivel a tu personaje y nunca baja, y <b>créditos ◈</b>, que se gastan.<br><br>Pulsa uno, hazlo y márcalo con <b>«Lo he hecho»</b>. Donde hay algo que entregar te pido el <b>enlace</b>: sin él no se registra, y tu docente lo ve. Como mucho, <b>'+(Number(window.SG_TOPE_DIA)||3)+' retos al día</b>.'},
    {t:'Tus marcadores, siempre a la vista',foco:'.nb-fin',
     x:'Arriba a la derecha, tus <b>xp</b> y tus <b>créditos</b>. Estés en la pestaña que estés, los verás subir en cuanto ganes algo.'},
    {t:'Cinco sitios, y ya está',foco:'.nb-tabs',
     x:'<b>Mi nave</b> es esto. <b>Mis retos</b>, el viaje entero por los ocho planetas. <b>Mi botín</b>, lo que llevas ganado: insignias, cromos y personajes. <b>Mercado Estelar</b>, donde se gasta. Y <b>Rankings</b>: tu clase de ocho maneras distintas, porque si no destacas en una, destacas en otra.'},
    {t:'Y ahora, estrénate',foco:'.nb-t[data-tab="mercado"]',
     x:'Cuando tu docente toque <b>llamada a filas</b> en clase, te saldrá aquí arriba: pulsa <b>«Presente»</b> y te llevas créditos y un sobre.<br><br>Y si ya tienes para uno, ve al <b>Mercado Estelar</b> y abre un <b>sobre de cromos</b>. Es la forma más rápida de entender para qué sirve todo esto. Corto y cierro.'}
  ];
  // Un solo motor para los dos actos: el acto decide QUÉ pasos, con qué clave de memoria y qué pone
  // el último botón. Duplicar la función habría sido la vía rápida para que uno de los dos se quede
  // sin arreglar el día que se toque algo.
  var ACTOS={
    puerta:{pasos:PASOS_PUERTA, clave:'sgNavePuerta_', fin:'Escribo mi correo ✓'},
    nave:  {pasos:PASOS,        clave:'sgNaveOnboard_', fin:'A la nave ✓'}
  };
  /**
   * 🔴 13-sep · NEBULA POR CAPÍTULOS. El capítulo 1 es la bienvenida de siempre, contando SOLO lo que
   * ya está abierto (en la semana 1 no hay Mercado que señalar). Los demás son cortos —dos o tres
   * pasos— y señalan las pestañas, que están en la barra estés donde estés. Quien llega tarde los ve
   * seguidos y en orden: «Capítulo 2 de 3». Lo visto queda en SU ficha (no en el navegador) y el
   * docente lo ve en «Alumnado».
   */
  function pasosCap1(){
    var p=PASOS.slice(0,4);
    var nt=tabsVisibles().length;
    p.push({t:nt>=5?'Cinco sitios, y ya está':'De momento, '+(nt===3?'tres':nt)+' sitios',foco:'.nb-tabs',
      x:nt>=5?PASOS[4].x
        :'<b>Mi nave</b> es esto. <b>Mis retos</b>, el viaje entero por los ocho planetas. Y <b>Mi botín</b>, lo que llevas ganado: insignias y cromos.<br><br>Cada semana se abre algo nuevo en la Nave, y te lo cuento yo.'});
    p.push(abierto('mercado')?PASOS[5]:{t:'Y ahora, estrénate',foco:'.nb-t[data-tab="botin"]',
      x:'Cuando tu docente toque <b>llamada a filas</b> en clase, te saldrá aquí arriba: pulsa <b>«Presente»</b> y te llevas créditos y un <b>sobre de cromos</b>. Las cartas, en Mi botín.<br><br>Haz tus retos de la semana y márcalos. Corto y cierro.'});
    return p;
  }
  var PASOS_CAP={
    c1:null,   // se arma al momento (pasosCap1): depende de lo que ya esté abierto
    c2:[{t:'Se abre el Mercado Estelar',foco:'.nb-t[data-tab="mercado"]',
         x:'Tus <b>xp</b> no se gastan nunca: suben tu nivel. Lo que se gasta son los <b>créditos ◈</b>, y es aquí. Empieza por un <b>sobre de cromos</b>: tres cartas al azar por 15 ◈.'},
        {t:'Tu álbum y las repetidas',foco:'.nb-t[data-tab="botin"]',
         x:'Las cartas van a tu <b>álbum</b>, en Mi botín. ¿Te sale una repetida? Con <b>tres repetidas</b> te llevas un sobre nuevo, gratis.'},
        {t:'Y los rankings',foco:'.nb-t[data-tab="rankings"]',
         x:'Tu clase de <b>ocho maneras</b>: por xp, por la semana, por colección, por constancia… Si no destacas en una, destacas en otra. Y en Mi nave, tu <b>duelo</b> con quien va justo delante y justo detrás.'}],
    c3:[{t:'Llegan los Héroes de la Rebelión',foco:'.nb-t[data-tab="mercado"]',
         x:'En el Mercado ya está la <b>cápsula de rescate</b>: llega a tu Nave con un <b>héroe al azar</b> de los 30 dentro, por 60 ◈. Tres rangos: la Resistencia, la Vanguardia y los <b>MITOS</b>, que casi nadie llega a ver.'},
        {t:'Tu vestuario',foco:'.nb-t[data-tab="botin"]',
         x:'Tus héroes viven en <b>Mi botín → Personajes y héroes</b>. Te los pones y te los quitas gratis, cuando quieras. ¿Repetido? Con <b>2 repetidos</b>, uno nuevo al azar.'}],
    c4:[{t:'Tu ficha, a tu gusto',foco:'.nb-t[data-tab="mercado"]',
         x:'Tres adornos nuevos en el Mercado: un <b>título</b> bajo tu alias, el <b>fondo</b> de tu ficha con el planeta que elijas y el <b>marco dorado</b> de tu avatar. Y el <b>sobre grande</b>: cinco cartas en vez de tres.'},
        {t:'Dónde se ven',foco:'.nb-t[data-tab="botin"]',
         x:'Se ponen desde <b>Mi botín</b>, y se ven en tu ficha y en el <b>tablero de toda la clase</b>.'}],
    c5:[{t:'Se abre El Zoco Estelar',foco:'.nb-t[data-tab="zoco"]',
         x:'Aquí se <b>cambia</b> entre reclutas, sin tienda de por medio. Pon tus héroes o cromos (repetidos o no) y los demás te ofrecen lo suyo: <b>créditos, cartas o héroes</b>.'},
        {t:'Cómo se hace un trato',foco:'.nb-t[data-tab="zoco"]',
         x:'Ofreces algo y queda <b>apartado</b> hasta que te respondan. Quien vende acepta, rechaza con un mensaje o te hace una <b>contraoferta</b> mirando lo que tienes. Tú tienes la última palabra: <b>3 pasos</b> y trato cerrado.'},
        {t:'Poner lo tuyo',foco:'.nb-t[data-tab="botin"]',
         x:'Desde tu álbum (abre una carta en grande) o desde tu vestuario (el 🔄 de cada héroe): «Poner en el Zoco». Sigue siendo tuyo hasta que aceptes una oferta. Y las <b>participaciones del Gran Sorteo</b> también se revenden aquí.'}],
    // 16-sep · LA OFERTA DE LA SEMANA (semana 5): empezaba en la 3 sin que nadie la explicara; ahora tiene su capítulo
    c10:[{t:'La oferta de la semana',foco:'.nb-t[data-tab="mercado"]',
          x:'Desde hoy, cada semana sale <b>una oferta</b> en el Mercado: un sobre, una cápsula, un héroe o una carta concretos, <b>rebajados entre un 20 y un 40 %</b>. Arriba del todo, con su cuenta atrás.'},
         {t:'Poco tiempo y pocas unidades',foco:'.nb-t[data-tab="mercado"]',
          x:'Dura lo que dura la semana y, si es algo raro, hay pocas unidades para todo el grupo: cuando se acaban, se acabó. <b>Una por persona</b>. Tu docente también puede preparar las suyas.'}],
    // 16-sep · EL SIMULADOR DE JORAN (semana 11): la semana pasada se peleó en clase; hoy se enseña a todos
    c11:[{t:'El Simulador de Joran',foco:'.nb-t[data-tab="nave"]',
          x:'Joran dejó encendido su simulador de entrenamiento, <b>RUTA AZUL</b>: un rival hecho de luz que pregunta por el temario. Quien le ganó en el reto ya lo tiene en su Nave; quien no, puede volver a intentarlo — <b>cada derrota lo cansa</b>.'},
         {t:'Repasar jugando',foco:'.nb-t[data-tab="nave"]',
          x:'Dentro se entrena <b>tema a tema</b> o con <b>todas</b> las preguntas del viaje, y se elige la dificultad. Cada modo tiene su <b>ranking</b> del grupo, y hay reconocimientos al más rápido, al más certero y a quien más sabe.'}],
    // 14-sep · el Gran Sorteo: lo cuenta con el premio y los ganadores de SU grupo (el referente
    // puede cambiarlos), por eso se arma al momento
    c6:function(){
      var s=((st.d&&st.d.recompensas)||[]).filter(function(x){ return x.tipo==='sorteo'&&x.sorteo&&!x.sorteo.hecho; })[0];
      var S=(s&&s.sorteo)||{}, premio=S.premio?'<b>'+esc(S.premio)+'</b>':'un premio', n=Number(S.ganadores)||1;
      return [{t:'El Gran Sorteo',foco:'.nb-t[data-tab="mercado"]',
               x:'Se sortea'+(n>1?'n <b>'+n+'</b> × ':' ')+premio+' entre toda la tripulación. Cada <b>participación</b> es una papeleta: cuantas más tengas, más posibilidades.'},
              {t:'Cómo se consiguen',foco:'.nb-t[data-tab="mercado"]',
               x:'Se compran en el <b>Mercado</b> con créditos'+(s?' ('+s.coste+' ◈ cada una'+(s.max&&s.max<99?', como mucho '+s.max:'')+')':'')+'. Tu docente también las <b>regala</b> en clase, o las esconde en un enlace. '
                 +(S.fecha?'Se sortea <b>solo</b> el <b>'+fechaLarga(S.fecha)+'</b>: ese día, al entrar en tu Nave, verás el resultado. ':'Se sortea solo, y al entrar en tu Nave verás el resultado. ')+'Como en una lotería, lo jugado no se devuelve, y <b>nadie gana dos</b>. '
                 +'Guárdalas bien: más adelante, en el Zoco, también se podrán revender.'}];
    },
    // 15-sep (noche) · los logros de a bordo (semana 9; en PUA, la 7): con lo que ya lleva, que se apuntaba desde el primer día
    c9:function(){
      var n=nHitos(st.yo), tot=AB.hitos.length;
      return [{t:'Los logros de a bordo',foco:'.nb-t[data-tab="botin"]',
               x:'Desde el primer día, la Nave ha ido apuntando la <b>primera vez</b> que haces cada cosa: tu primer reto, tu primera reflexión, tu primera compra, tu primer trato en el Zoco… Son <b>'+tot+' logros de a bordo</b>'+(n?', y ya llevas <b>'+n+'</b>':'')+'. Los tienes en <b>Mi botín</b>.'},
              {t:'Cinco cubiertas, cinco premios',foco:'.nb-t[data-tab="botin"]',
               x:'Van en cinco cubiertas: <b>el puente, el Mercado, el camarote, el Zoco y la constancia</b> —tus días a bordo: tres seguidos, siete seguidos y veinte en total—. Cada cubierta completa trae su premio: un <b>sobre</b>, <b>créditos</b> o una <b>cápsula de rescate</b>. Si ya tenías alguna, el premio te llega ahora.'},
              {t:'Y el Contramaestre',foco:'.nb-t[data-tab="botin"]',
               x:'Con las cinco, te nombro <b>Contramaestre de la Nave</b>: un héroe legendario —él y ella, y eliges cuál llevar— que no sale en ninguna cápsula, y una <b>carta legendaria con tu alias</b>. No se compra, no se regala y no se cambia: solo se gana.'}];
    },
    // 14-sep · el Hangar de las Leyendas (semana 7 desde el 16-sep): las cápsulas de élite y legendaria, y el sobre épico
    c8:[{t:'El Hangar de las Leyendas',foco:'.nb-t[data-tab="mercado"]',
         x:'Tres cosas nuevas en el Mercado. La <b>cápsula de élite</b>: sin la Resistencia, un héroe de la Vanguardia o un Mito. El <b>sobre épico</b>: tres cartas y ninguna común.'},
        {t:'La cápsula legendaria',foco:'.nb-t[data-tab="mercado"]',
         x:'Y la joya del hangar: la <b>cápsula legendaria</b>, que trae <b>siempre un Mito</b>. Es la más cara, así que piénsatelo… o estate atento: tu docente puede esconder una en una presentación, o dártela de premio.'}],
    c7:[{t:'Se abre el Arsenal de batalla',foco:'.nb-t[data-tab="mercado"]',
         x:'Los créditos que has ahorrado ya se pueden cambiar por <b>nota</b>: subir 0,5 o 1 punto en un entregable, o que se recalifique un trabajo.'},
        {t:'Antes de comprar, lee esto',foco:'.nb-t[data-tab="mercado"]',
         x:'No se aplica solo: queda <b>pendiente</b> hasta que tu docente lo apruebe. Y si ya tienes la nota máxima de evaluación continua, <b>no te sube nada</b>: compruébalo antes.'}]
  };
  function pasosDe(clave){ var v=PASOS_CAP[clave]; return clave==='c1'?pasosCap1():typeof v==='function'?v():v; }
  /** Lo visto: su ficha manda; el navegador es copia (y la bienvenida de antes cuenta como el capítulo 1). */
  function capsVistos(){
    var v=Object.assign({}, (st.yo&&st.yo.capitulos)||{});
    capsTipo().forEach(function(c){ var l=localStorage.getItem('sgCap_'+per+'_'+c.clave); if(l&&!v[c.clave]) v[c.clave]={estado:l}; });
    if(!v.c1&&localStorage.getItem('sgNaveOnboard_'+per)) v.c1={estado:'hecho'};
    return v;
  }
  function capsPendientes(){
    var v=capsVistos();
    return capsAbiertos().filter(function(c){ return (c.clave==='c1'||PASOS_CAP[c.clave]) && !v[c.clave]; });
  }
  function marcarCap(c, estado){
    if(SIMULACRO) return;
    try{ localStorage.setItem('sgCap_'+per+'_'+c.clave, estado); }catch(e){}
    if(st.yo){ st.yo.capitulos=Object.assign({}, st.yo.capitulos||{}); st.yo.capitulos[c.clave]={estado:estado, fecha:Date.now()}; }
    // en su ficha, sin molestar: si falla, queda la copia del navegador y se vuelve a intentar otro día
    if(motorNuevo()&&SG.FUENTE&&SG.FUENTE.accion)
      SG.FUENTE.accion({accion:'capitulo', per:per, cap:c.clave, estado:estado, v:1}).catch(function(){});
  }
  var enCapitulos=false;
  function ofrecerCapitulos(){
    if(!motorNuevo()){ if(!localStorage.getItem('sgNaveOnboard_'+per)) onboarding(0,'nave'); return; }
    if(enCapitulos||!st.yo||SIMULACRO) return;
    var lista=capsPendientes(); if(!lista.length) return;
    enCapitulos=true;
    (function sigue(i){
      if(i>=lista.length){ enCapitulos=false; render(); return; }
      var c=lista[i];
      onboarding(0, c.clave, { cap:c, orden:i+1, de:lista.length, alTerminar:function(estado){
        marcarCap(c, estado);
        // «Salir» se salta lo que queda de esta tanda (se puede repetir desde «Repetir bienvenida»)
        if(estado==='saltado'){ for(var k=i+1;k<lista.length;k++) marcarCap(lista[k],'saltado'); enCapitulos=false; render(); return; }
        setTimeout(function(){ sigue(i+1); }, 350);
      }});
    })(0);
  }
  /**
   * 🔴 13-sep · ENCUADRAR LO QUE SE SEÑALA. Con `scrollIntoView({block:'center'})` un bloque alto (los
   * vídeos, los retos) quedaba con su cabecera fuera de la pantalla o DEBAJO de la ventana de NEBULA,
   * que ocupa la parte de abajo: «mira esto» y no se veía. Visto recorriendo la Nave con una cuenta
   * real. Ahora el bloque se coloca bajo las barras pegadas y por encima de la ventana; si cabe, en
   * medio de ese hueco, y si no, con su cabecera arriba. Lo que vive en la barra no mueve la página.
   */
  function llevarA(el, ov){
    var barra=0;
    [].slice.call(document.querySelectorAll('.nav,.nave-barra-u,.nave-barra')).forEach(function(n){
      var st=getComputedStyle(n).position; if(st==='sticky'||st==='fixed') barra=Math.max(barra, n.getBoundingClientRect().bottom); });
    var r=el.getBoundingClientRect();
    if(r.top>=0 && r.bottom<=barra+4) return;            // está en la propia barra: ya se ve
    var caja=ov&&ov.querySelector('.tour-box'), reserva=caja?caja.getBoundingClientRect().height+20:0;
    var libre=Math.max(160, innerHeight-barra-reserva);
    var margen=r.height<libre-24 ? Math.max(12,(libre-r.height)/2) : 12;
    var y=Math.max(0, Math.round(scrollY + r.top - barra - margen));
    try{ window.scrollTo({top:y, behavior:'smooth'}); }catch(e){ window.scrollTo(0,y); }
  }
  function onboarding(i, acto, op){
    acto=acto||'nave'; op=op||onboarding._op||{};
    // un capítulo es un acto más, con sus pasos y sin clave propia (lo apunta marcarCap)
    var A=ACTOS[acto]||{pasos:pasosDe(acto)||[], clave:'', fin:op.de&&op.orden<op.de?'Siguiente capítulo →':'A la nave ✓'};
    if(i===0) A.pasosFijos=A.pasos;
    var P=onboarding._P&&onboarding._acto===acto&&i>0?onboarding._P:A.pasos;
    onboarding._P=P; onboarding._acto=acto; onboarding._op=op;
    var ov=document.getElementById('nave-onboard');
    if(!ov){ov=document.createElement('div');ov.id='nave-onboard';ov.className='tour open';document.body.appendChild(ov);}
    ov.classList.add('open');
    if(i>=P.length){ov.classList.remove('open');ov.innerHTML='';if(A.clave)localStorage.setItem(A.clave+per,'1');
      Array.prototype.forEach.call(document.querySelectorAll('.tour-foco'),function(el){el.classList.remove('tour-foco');});
      onboarding._P=null; onboarding._op=null; onboarding._foco=null;
      if(op.alTerminar) op.alTerminar(onboarding._salir?'saltado':'hecho');
      onboarding._salir=false;
      return;}
    var s=P[i];
    if(i===0) onboarding._dir=1;
    if(s.foco && !document.querySelector(s.foco)){
      var paso=(onboarding._dir||1); var k=i+paso;
      if(k>=0 && k<P.length) return onboarding(k, acto);
    }
    var cab=op.cap
      ? (op.de>1?'Capítulo '+op.orden+' de '+op.de+' · ':'Capítulo '+op.cap.n+' · ')+op.cap.icono+' '+esc(op.cap.titulo)+' · '+(i+1)+' / '+P.length
      : 'NEBULA · '+(i+1)+' / '+P.length;
    ov.innerHTML='<div class="tour-box">'+nebulaVideo('tour-cap nebula')
      +'<div class="tour-panel"><div class="tour-step">'+cab+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p>'
      +'<div class="tour-btns"><button type="button" class="tour-prev"'+(i===0?' disabled':'')+'>← Anterior</button>'
      +'<button type="button" class="tour-next primary">'+(i===P.length-1?A.fin:'Siguiente →')+'</button>'
      +'<button type="button" class="tour-exit">Salir</button></div></div></div>';
    // 🔴 Resaltar y DESPLAZAR: explicar «esto de aquí» sin que se vea el «aquí» no explica nada. Se
    // limpia siempre antes, para que no se queden dos cosas encendidas si alguien va y viene.
    Array.prototype.forEach.call(document.querySelectorAll('.tour-foco'),function(el){el.classList.remove('tour-foco');});
    onboarding._foco=s.foco||null;
    if(s.foco){ try{
      var diana=document.querySelector(s.foco);
      if(diana){ diana.classList.add('tour-foco'); llevarA(diana, ov); }
    }catch(e){} }
    ov.querySelector('.tour-prev').onclick=function(){onboarding._dir=-1; onboarding(i-1,acto);};
    ov.querySelector('.tour-next').onclick=function(){onboarding._dir=1; onboarding(i+1,acto);};
    ov.querySelector('.tour-exit').onclick=function(){onboarding._salir=true; onboarding(P.length,acto);};
  }

  // ---------- ¡ENHORABUENA! ----------
  // v3.19 · El premio se ganaba en un formulario y se contaba por correo, minutos despues. El momento
  // de ganar y el momento de enterarte estaban en sitios distintos, y por eso «gano algo y no me
  // entero». Ahora lo cuenta la Nave, que es donde esta el arte: al entrar compara lo que tienes con
  // lo que tenias la ultima vez que miraste.
  //
  // 🔴 La PRIMERA vez no se celebra nada: si no, un recluta que entra por primera vez recibiria una
  // fanfarria por todo lo que ya tiene. Se guarda la foto en silencio y a partir de ahi se compara.
  var KEY_VISTO='sgNaveVisto_'+(SIMULACRO?'sim_':'')+per;
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
  var cartelFin=null;          // 15-sep · lo que toca cuando se cierra la tanda de carteles (el sobre de un premio)
  function cerrarCartel(){
    var ov=document.getElementById('nave-logro'); if(!ov) return;
    ov.classList.remove('open'); ov.innerHTML=''; document.removeEventListener('keydown',teclaCartel);
    var f=cartelFin; cartelFin=null; if(f) setTimeout(f, 140);
  }
  function teclaCartel(e){
    if(e.key==='Escape'){e.preventDefault();cerrarCartel();}
    else if(e.key==='Enter'||e.key===' '){var b=document.querySelector('#nave-logro .logro-ok');if(b){e.preventDefault();b.click();}}
  }
  function cartel(L,i,extra,fin){
    if(fin!==undefined) cartelFin=fin;
    if(i>=L.length){ cerrarCartel(); return; }
    var x=L[i], ultimo=(i===L.length-1);
    var ov=document.getElementById('nave-logro');
    if(!ov){ov=document.createElement('div');ov.id='nave-logro';ov.className='logro';document.body.appendChild(ov);}
    var masCosas=(ultimo&&extra&&extra.length)
      ? '<p class="logro-mas">Y además: '+extra.map(function(e){return esc(e.titulo);}).join(' · ')+'</p>' : '';
    ov.innerHTML='<div class="logro-fondo"></div><div class="logro-caja '+x.clase+'" role="dialog" aria-modal="true">'
      +'<div class="logro-chispas"></div>'
      +'<div class="logro-eyebrow">'+esc(x.eyebrow)+'</div>'
      +(x.html?x.html:x.img?'<img class="logro-img" src="'+x.img+'" alt="">':'')
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

  /**
   * 15-sep (noche) · LOS LOGROS DE A BORDO, AL MOMENTO. Al entrar y después de hacer algo que pueda ser un
   * hito (registrar, escribir, comentar, comprar, vestirse, el Zoco) se pregunta al servidor. Si hay algo
   * nuevo, NEBULA lo celebra —cuando no haya otra ventana encima: un logro no pisa un sobre abierto—, luego
   * se abre el premio de la cubierta (si es un sobre o una cápsula) y la ficha se pone al día.
   */
  var hitosEnCurso=false, hitosOtraVez=false, hitosT=null;
  var HITOS_TRAS={registrar:1, reflexion:1, comentar:1, canje:1, vestir:1, adorno:1, abrir:1};
  function hitosLuego(ms){ clearTimeout(hitosT); hitosT=setTimeout(comprobarHitos, ms||1500); }
  function hayCapa(){ return !!document.querySelector('#nave-logro.open, .neb-capa, .sb-capa, #cromo-lupa.open, .zoco-capa, .tour.open'); }
  function cuandoLibre(fn, t0){ t0=t0||Date.now(); if(!hayCapa()||Date.now()-t0>120000) return fn(); setTimeout(function(){ cuandoLibre(fn,t0); }, 700); }
  function comprobarHitos(){
    if(!motorNuevo()||SIMULACRO||enDemo()||!st.yo||st.yo.congelado||!AB.hitos.length) return;
    if(hitosEnCurso){ hitosOtraVez=true; return; }
    hitosEnCurso=true;
    post({accion:'hitos',per:per}, function(d){
      hitosEnCurso=false;
      if(d&&d.hitos&&st.yo){ st.yo.hitos=d.hitos; st.yo.cubiertas=d.cubiertas||{}; st.yo.dias=d.dias||st.yo.dias; }
      // (antes de su capítulo —semana 9— se apuntan en silencio: NEBULA los presenta y entonces se celebran)
      if(abierto('logros')&&d&&((d.nuevos||[]).length||(d.premios||[]).length||d.legendario)) cuandoLibre(function(){ celebrarHitos(d); });
      else if(d&&d.hitos&&(st.tab==='botin'||st.tab==='nave')&&!hayCapa()) render();      // el contador de días, al día
      if(hitosOtraVez){ hitosOtraVez=false; hitosLuego(600); }
    }, function(){ hitosEnCurso=false; });
  }
  function celebrarHitos(d){
    var HB={}, CB={}; AB.hitos.forEach(function(x){ HB[x.clave]=x; }); AB.cubiertas.forEach(function(x){ CB[x.clave]=x; });
    var n=Object.keys(d.hitos||{}).filter(function(k){ return HB[k]; }).length, L=[];
    var nuevos=(d.nuevos||[]).filter(function(k){ return HB[k]; });
    if(nuevos.length>3){
      // quien ya lo había hecho antes de que existieran (o todo de golpe): un cartel, no un muro de clics
      L.push({eyebrow:'LOGROS DE A BORDO · '+n+' DE '+AB.hitos.length, titulo:'🎖️ '+nuevos.length+' logros de golpe',
        sub:nuevos.map(function(k){ return HB[k].icono+' '+HB[k].titulo; }).join(' · '), img:'', clase:'texto'});
    } else nuevos.forEach(function(k){ var x=HB[k], cb=CB[x.cubierta]||{};
      // lo que dice: en qué cubierta está, cuánto le queda y qué premio espera al completarla
      var suyos=AB.hitos.filter(function(y){ return y.cubierta===x.cubierta; }), ya=suyos.filter(function(y){ return (d.hitos||{})[y.clave]; }).length;
      L.push({eyebrow:'LOGRO DE A BORDO · '+n+' DE '+AB.hitos.length, titulo:x.icono+' '+x.titulo,
        sub:(cb.nombre||'')+' · '+ya+' de '+suyos.length+(ya<suyos.length&&cb.premio?' · al completarla, '+premioTexto(cb.premio):''), img:'', clase:'texto'}); });
    (d.premios||[]).forEach(function(p){ var c=CB[p.cubierta]||{nombre:p.cubierta};
      L.push({eyebrow:'CUBIERTA COMPLETA', titulo:'🎁 '+c.nombre, sub:'Tu premio: '+(p.tipo==='creditos'?p.creditos+' ◈, ya en tu ficha.'
        :p.tipo==='capsula'?'una cápsula de rescate. Se abre al cerrar esto.':'un sobre de cromos. Se abre al cerrar esto.'), img:'', clase:'texto'}); });
    if(d.legendario) L.push({eyebrow:'LEGENDARIO DE A BORDO', titulo:'Contramaestre de la Nave',
      sub:'Has completado las cinco cubiertas. El héroe legendario (él y ella) ya está en tu vestuario, y esta carta lleva tu nombre.',
      html:cartaABordo(st.yo&&st.yo.alias,'en-logro'), clase:'carta leg'});
    var botines=d.botines||[];
    var despues=function(){
      var fin=function(){ refrescarYo(); };
      if(botines.length&&window.SG&&SG.SOBRE){
        var tenidas=inventarioDe(st.yo||{});
        SG.SOBRE.revelar(botines.map(function(c){ return marcaRepetida(c, tenidas); }),
          { titulo:'El premio de tu cubierta', alAlbum:function(){ irA('botin'); } }).then(fin, fin);
      } else fin();
    };
    if(window.SG&&SG.FIESTA) try{ SG.FIESTA.sonar(d.legendario?'insignia':'xp'); }catch(e){}
    if(!L.length) return despues();
    cartel(L,0,[],despues);
  }
  /** La carta del Contramaestre, en grande (con tu alias). No es del álbum: no tiene anterior ni siguiente. */
  function lupaABordo(){
    var r=st.yo; if(!r||!esContramaestre(r)) return;
    var ov=document.getElementById('cromo-lupa');
    if(!ov){ov=document.createElement('div');ov.id='cromo-lupa';ov.className='lupa';document.body.appendChild(ov);}
    ov.setAttribute('data-modo','abordo');
    ov.innerHTML='<div class="lupa-fondo"></div><div class="lupa-caja" role="dialog" aria-modal="true" aria-label="Tu carta de Contramaestre">'
      +'<button type="button" class="lupa-x" aria-label="Cerrar">×</button>'
      +cartaABordo(r.alias,'en-lupa')
      +'<div class="lupa-pie"><h4>Contramaestre de la Nave</h4>'
      +'<p class="small muted">Logros de a bordo'+((r.cubiertas||{}).todo?' · desde el '+fechaCorta(r.cubiertas.todo):'')+' · no está en el álbum ni sale en ningún sobre</p></div></div>';
    ov.classList.add('open');
    ov.querySelector('.lupa-fondo').onclick=cerrarLupa;
    ov.querySelector('.lupa-x').onclick=cerrarLupa;
    document.removeEventListener('keydown',teclaLupa);
    document.addEventListener('keydown',teclaLupa);
    ov.querySelector('.lupa-x').focus();
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
    // lo que manda es lo que el recluta VE: si la foto de la ficha ya cambió (vestirse optimista),
    // la lupa abre esa misma imagen aunque el servidor aún no haya contestado
    var enFicha=document.querySelector('#btn-av img.av');
    if(enFicha&&enFicha.getAttribute('src')) src={src:enFicha.getAttribute('src'),fallback:enFicha.getAttribute('data-fb')||src.fallback,rango:src.rango};
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
    if(ov.getAttribute('data-modo')) return;      // el personaje (o la carta de a bordo) es uno: no hay anterior ni siguiente
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
      +(nn>1?' · tienes <b>'+nn+'</b>':'')+(mias.length>1?' · <b>'+(i+1)+'</b> de '+mias.length+' tuyas':'')+'</p>'
      // 13-sep · desde la ficha de la carta, al Zoco (Norberto: «al abrirse la ficha del ítem, un botón "Poner en venta"»)
      +(abierto('zoco')&&motorNuevo()?'<button type="button" class="btn small lupa-zoco" id="lupa-zoco">🔄 Poner en el Zoco</button>':'')
      +'</div></div>';
    ov.classList.add('open');
    var lz=ov.querySelector('#lupa-zoco'); if(lz) lz.onclick=function(){ cerrarLupa(); zocoPonerVentana(per+'__cromo_'+clave); };
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
  // v3.65 · El botón de Google se pinta DESPUÉS de cada render, porque la tarjeta de login se
  // vuelve a crear entera cada vez. 🔴 La librería se carga una sola vez y solo si hace falta: si no
  // hay ID de cliente, esta web no habla con Google en absoluto.
  var gsiCargado=false, gsiListo=false;
  // ¿Estamos con el motor nuevo? Entonces entrar es entrar en Firebase, no pedirle un token a
  // Google para mandárselo a un servidor que lo verifique. Es el mismo botón y menos piezas.
  function motorNuevo(){ return window.SG && SG.FUENTE && SG.FUENTE.nombre==='firestore'; }

  function montarBotonFirebase(){
    var hueco=document.getElementById('g-nave'); if(!hueco) return;
    // la «G» de Google: la misma que en las demás puertas, y por la misma razón —un botón que solo
    // dice «entrar» no promete nada, y este es el que más gente va a pulsar de toda la web
    hueco.innerHTML='<button class="btn primary grande btn-google" type="button" id="fb-entrar">'
      + ((window.SG && window.SG.LOGO_G) || '')
      + '<span>Iniciar sesión con Google</span></button>';
    document.getElementById('fb-entrar').onclick=function(){
      var M=window.SG.MOTOR;
      if(!M) return;
      M.entrar().then(function(){ identificarPorSesion(); })
       .catch(function(e){ st.msgYo='No he podido entrar: '+esc(e.message); render(); });
    };
  }
  // Con sesión iniciada no hace falta preguntar nada: quien pide la ficha ES quien ha entrado.
  function identificarPorSesion(){
    // 🔴 Sin los datos del grupo no hay Nave que pintar. Si el enlace trae un grupo que no existe,
    // la página ya lo ha dicho con sus palabras; llegar aquí y renderizar encima reventaba con un
    // error de consola feísimo y dejaba la pantalla a medias.
    if(!st.d) return;
    st.cargandoYo=true; st.msgYo=''; render();
    quien(null,function(d){
      st.cargandoYo=false;
      if(d&&d.yo){ st.yo=d.yo; st.email=(d.correo||'').toLowerCase(); st.verificado=true;
        if(st.email) localStorage.setItem(KEY_MAIL,st.email);
        setTimeout(ofrecerCapitulos, 700); setTimeout(zocoAlEntrar, 1200); setTimeout(sorteosAlEntrar, 900); setTimeout(ofertaAlEntrar, 1100);
        setTimeout(comprobarHitos, 1800);   // 15-sep · el día a bordo y los logros que ya se vean en los datos
        setTimeout(comprobarBatalla, 2400);  // 16-sep · y el reto A6, si ganó al simulador y no llegó a registrarse
      } else if(d&&d.sinSesion&&!DEMO&&window.top===window.self&&q.get('embed')!=='1'){
        /**
         * 🔴 13-sep · SIN SESIÓN, A LA PUERTA ÚNICA. La Nave tenía su propia caja «Identifícate,
         * recluta», una segunda puerta con otras palabras. Quien llega aquí sin sesión (un enlace
         * guardado, un marcador) va a la de todos: entra con Google y la puerta le trae de vuelta a
         * SU Nave, o le pide el código si aún no está. Dentro de una presentación incrustada se
         * queda la caja de aquí: sacar al alumno de la diapositiva sería peor.
         */
        location.replace('entrar.html'); return;
      } else if(d&&d.sinFicha){
        st.verificado=true;
        st.msgYo='Tu cuenta es correcta, pero todavía no te has alistado en este grupo. Es un minuto:';
      } else if(d&&d.error){ st.msgYo=esc(d.error); }
      render();
    });
  }

  function montarBotonGoogle(){
    if(motorNuevo()) return montarBotonFirebase();
    var hueco=document.getElementById('g-nave');
    if(!hueco||!CID) return;
    function pinta(){
      try{
        if(!gsiListo){ google.accounts.id.initialize({client_id:CID,callback:function(r){
          if(r&&r.credential) identificarConGoogle(r.credential);
        }}); gsiListo=true; }
        google.accounts.id.renderButton(hueco,{theme:'filled_blue',size:'large',text:'signin_with',locale:'es',width:280});
      }catch(e){ hueco.innerHTML='<p class="small muted">No he podido cargar el botón de Google. Entra escribiendo tu correo.</p>'; }
    }
    if(window.google&&window.google.accounts&&window.google.accounts.id) return pinta();
    if(gsiCargado) return;
    gsiCargado=true;
    var sc=document.createElement('script');
    sc.src='https://accounts.google.com/gsi/client'; sc.async=true;
    sc.onload=function(){ pinta(); };
    sc.onerror=function(){ hueco.innerHTML='<p class="small muted">No he podido cargar el botón de Google. Entra escribiendo tu correo.</p>'; };
    document.head.appendChild(sc);
  }
  // Marcar un reto. Se bloquea el botón mientras va y vuelve: sin eso, dos clics nerviosos mandan
  // dos peticiones y la segunda se encuentra el reto ya hecho, con un error que no ha hecho nadie.
  // Si la sesión cambia mientras la Nave está abierta —se entra, se sale, o Firebase termina de
  // restaurar una sesión guardada— la ficha se vuelve a pedir sola. Sin esto había que recargar.
  document.addEventListener('sg:sesion',function(e){
    if(!motorNuevo()) return;
    if(!st.d) return;
    if(!e.detail){ if(st.yo){ st.yo=null; st.email=''; st.verificado=false; render(); } return; }
    // 🔴 Si entra OTRA cuenta hay que volver a pedir la ficha, no solo si no había ninguna. Con la
    // comprobación a medias, cambiar de usuario dejaba en pantalla la ficha del anterior: sus
    // retos, sus créditos y sus insignias, con el nombre del nuevo. Pasa en un ordenador
    // compartido, que en un máster es casi la norma.
    var otro = String(e.detail.correo||'').toLowerCase() !== String(st.email||'').toLowerCase();
    if(!st.yo || otro) identificarPorSesion();
  });

  /** Ponerse (o quitarse) un adorno. Cosmético: se aplica al momento y se deshace en un clic. */
  function ponerAdorno(campo, valor, boton){
    if(boton){ boton.disabled=true; }
    post({accion:'adorno',per:per,campo:campo,valor:valor},function(){
      var antes=st.yo?JSON.parse(JSON.stringify(st.yo)):{};
      aviso(valor?'✨ Puesto. Míralo en tu ficha.':'Quitado.');
      refrescarYCelebrar(antes, null, 'canje-mudo', '');
    },function(e){
      if(boton){ boton.disabled=false; }
      aviso('No he podido ponértelo: '+esc(e), true);
    });
  }

  /** Pegar el enlace que se olvidó, sin tocar el reto ni los puntos. */
  function guardarEvidencia(id, boton){
    var caja=document.querySelector('[data-evid="'+id+'"]');
    var v=caja?caja.value.trim().split(/\s+/).filter(Boolean).join(' '):'';
    if(!v) return aviso('Pega primero el enlace.', true);
    if(!enlacesValidos(v)) return aviso('🔗 Eso no parece un enlace (o son más de dos): cada uno con su dominio, como padlet.com/…, separados por un espacio.', true);
    boton.disabled=true; boton.textContent='Guardando…';
    post({accion:'evidencia',per:per,reto:id,evidencia:v},function(){
      if(st.yo){ st.yo.evidencias=st.yo.evidencias||{}; st.yo.evidencias[id]=v; }
      boton.textContent='✓ Guardado';
      setTimeout(function(){ boton.disabled=false; boton.textContent='Cambiar enlace'; },1600);
      aviso('🔗 Enlace guardado en <b>'+esc(id)+'</b>.');
    },function(e){
      boton.disabled=false; boton.textContent='Guardar enlace';
      aviso('No he podido guardarlo: '+esc(e), true);
    });
  }

  /**
   * Deshacer una entrega propia. Se pregunta con NEBULA, no con el `confirm()` del navegador, y se
   * dice exactamente qué se va a perder: quitar puntos sin avisar de cuántos es lo que convierte un
   * botón útil en uno que nadie se atreve a tocar.
   */
  function deshacerReto(id, boton){
    var RET=(window.SG_RETOS||{})[(st.d&&st.d.tipo)||'REGULAR']||[];
    var t=RET.filter(function(x){return x[0]===id;})[0];
    var xp=t?t[3]:0, cr=t?creditosDeReto(id):0;
    // 🔴 12-sep · Si ya se ha gastado lo que dio el reto, NO se puede deshacer (lo decide el servidor:
    // marcar → gastar → deshacer era quedarse gratis con lo comprado). Se avisa ANTES de preguntar,
    // con el saldo delante, en vez de dejar pulsar para decir que no después.
    var tengo=(st.yo&&st.yo.creditos!=null)?Number(st.yo.creditos):0;
    if(cr>0 && tengo<cr){
      return nebulaPregunta({
        titulo:'Este ya no se puede deshacer tú solo',
        cuerpo:'<p class="neb-nota">Este reto te dio <b>'+cr+' ◈</b> y ya te los has gastado (te quedan <b>'
          +tengo+' ◈</b>). Deshacerlo te dejaría con lo comprado gratis, así que eso lo decide tu '
          +'Comandante: escríbele si lo marcaste sin querer.</p>',
        si:'Entendido', no:''
      });
    }
    nebulaPregunta({
      titulo:'¿Deshacemos «'+esc(t?t[1]:id)+'»?',
      cuerpo:'<p class="neb-precio"><b>−'+xp+' xp · −'+cr+' ◈</b>'
        +'<span>vuelve a quedar pendiente</span></p>'
        +'<p class="neb-nota">Puedes volver a marcarlo cuando lo tengas hecho de verdad.</p>',
      si:'Sí, deshacer', no:'Mejor no'
    }).then(function(ok){
      if(!ok) return;
      boton.disabled=true; boton.textContent='Deshaciendo…';
      var antes=st.yo?JSON.parse(JSON.stringify(st.yo)):{};
      post({accion:'cancelar',per:per,reto:id},function(){
        var c=document.querySelector('.neb-capa'); if(c) c.remove();
        aviso('↩︎ <b>'+esc(id)+'</b> vuelve a estar pendiente.');
        refrescarYCelebrar(antes, null, 'canje-mudo', '');
      },function(e){
        boton.disabled=false; boton.textContent='↩︎ No lo he hecho todavía';
        nebulaProblema(e, 'No he podido deshacerlo', 'No se ha tocado nada: el reto sigue registrado.');
      });
    });
  }

  /**
   * 🔴 13-sep · LA EVIDENCIA Y EL TOPE DIARIO, dichos ANTES de pulsar. La regla vive en
   * `_site_data.py` (EVIDENCIA_RETOS, TOPE_RETOS_DIA) y llega aquí como SG_EVIDENCIA / SG_TOPE_DIA:
   * el campo dice «obligatorio» donde lo es, y la Nave comprueba el enlace y el tope antes de
   * mandar nada. Lo mismo comprueba `fuente.js` en la puerta por la que salen los registros.
   */
  function evidenciaDe(id){ return (window.SG_EVIDENCIA||{})[id]||''; }
  /**
   * 15-sep (noche) · LOS RETOS QUE SE RESPONDEN EN EL PROPIO RETO. Norberto: «en vez de ponerlo en el foro, que lo
   * respondan directamente sobre el reto… una caja de texto más grande». La regla (qué retos, qué pregunta, cuánto
   * mínimo) viene de `_site_data.py → REFLEXION_RETOS` como SG_REFLEXION; la guarda `fuente.js` en
   * `stargate_reflexiones` y la ve su tripulación («Lo que ha escrito tu tripulación», abajo).
   */
  function reflexionDe(id){ return (window.SG_REFLEXION||{})[id]||null; }
  function campoReflexion(id, clase){
    var R=reflexionDe(id); if(!R) return '';
    var ide='rf-'+clase+'-'+id;
    return '<div class="rf-caja"><label class="rf-et" for="'+esc(ide)+'">✍️ '+esc(R.pide)+'</label>'
      +'<textarea class="'+clase+' rf-txt" id="'+esc(ide)+'" data-rf="'+esc(id)+'" rows="6" maxlength="2000" placeholder="Escríbelo aquí mismo: al menos '+R.min+' letras."></textarea>'
      +'<div class="rf-pie"><span class="rf-n" data-rfn-min="'+R.min+'">0 / '+R.min+'</span>'
      +'<span class="rf-aviso">👀 La leerá tu tripulación en este reto y puede salir en clase con tu alias, nunca con tu nombre.</span></div></div>';
  }
  // el contador de letras, al escribir (en verde al llegar al mínimo)
  document.addEventListener('input',function(ev){
    var x=ev.target; if(!x||!x.classList||!x.classList.contains('rf-txt')) return;
    x.classList.remove('falta');
    var n=x.parentNode&&x.parentNode.querySelector('.rf-n'); if(!n) return;
    var min=Number(n.getAttribute('data-rfn-min')||0), l=x.value.trim().length;
    n.textContent=l+' / '+min; n.classList.toggle('ok', l>=min);
  });
  function guardarReflexionMia(id, boton){
    var R=reflexionDe(id), caja=document.querySelector('[data-rfh="'+id+'"]'), t=caja?caja.value.trim():'';
    if(!R) return;
    if(t.length<R.min){ if(caja){ caja.classList.add('falta'); caja.focus(); }
      return aviso('✍️ <b>Tu reflexión es muy corta</b>: escribe al menos '+R.min+' letras (llevas '+t.length+').', true); }
    boton.disabled=true; boton.textContent='Guardando…';
    post({accion:'reflexion',per:per,reto:id,texto:t},function(){
      if(st.yo){ st.yo.reflexiones=st.yo.reflexiones||{}; st.yo.reflexiones[id]=t; }
      delete (st.rf||{})[id];   // la tripulación la verá al día
      boton.textContent='✓ Guardada'; setTimeout(function(){ boton.disabled=false; boton.textContent='Guardar cambios'; },1600);
      aviso('✍️ Reflexión guardada en <b>'+esc(id)+'</b>.');
    },function(e){ boton.disabled=false; boton.textContent='Guardar mi reflexión'; aviso('No he podido guardarla: '+esc(e), true); });
  }
  /**
   * «💬 LO QUE HA ESCRITO TU TRIPULACIÓN». Norberto: «que pudieran ver el del resto de sus compañeros así como el
   * enlace (servirá de ejemplo también)… responderse/comentar». Se lee al abrirlo (una consulta por reto, guardada un
   * minuto); se ve por alias y personaje, nunca por nombre. Comentar pasa por `post`, así que en la demostración y en
   * la Nave del Comandante no se escribe nada (y se dice).
   */
  function panelTripulacion(id){
    if(!reflexionDe(id)||!motorNuevo()||enDemo()) return '';
    return '<div class="rf-tripu" data-rftripu="'+esc(id)+'"><button type="button" class="btn min rf-ver" data-rfver="'+esc(id)+'" aria-expanded="false">💬 Lo que ha escrito tu tripulación</button>'
      +'<div class="rf-lista" hidden></div></div>';
  }
  function recluDeFicha(fid){
    var l=(st.d&&st.d.reclutas)||((window.SG_TABLERO_DATA||{}).reclutas)||[];
    return l.filter(function(r){ return r.fid===fid; })[0]||null;
  }
  function caraRF(r){
    var src=''; try{ src=(r&&SG.avatarSrc)?SG.avatarSrc(r.avatar,r.alias,r.xp||0,(st.d&&st.d.tipo)||'REGULAR').src:''; }catch(e){}
    return src?'<img class="rf-cara" src="'+esc(src)+'" alt="" loading="lazy">':'<span class="rf-cara rf-ini">'+esc(String((r&&r.alias)||'?').charAt(0).toUpperCase())+'</span>';
  }
  function cargarTripulacion(id, forzar){
    st.rf=st.rf||{};
    var c=st.rf[id];
    if(c&&!forzar&&Date.now()-c.t<60000) return Promise.resolve(c);
    var M=window.SG&&SG.MOTOR;
    if(!M||!M.reflexionesDe) return Promise.reject(new Error('sin motor'));
    return Promise.all([M.reflexionesDe(per,id), M.comentariosDe(per,id).catch(function(){ return []; })]).then(function(x){
      st.rf[id]={t:Date.now(), items:x[0]||[], coms:x[1]||[]}; return st.rf[id];
    });
  }
  function pintarTripulacion(id, caja){
    var c=(st.rf||{})[id]; if(!c||!caja) return;
    var mioF=(st.yo&&(st.yo.ficha||st.yo.fid))||'';
    var items=c.items.slice().sort(function(a,b){ return (a.fichaId===mioF?-1:0)-(b.fichaId===mioF?-1:0); });
    // lo que alguien estaba escribiendo en un comentario no se borra al repintar la lista
    var escritos={}; [].slice.call(caja.querySelectorAll('[data-rfform] input')).forEach(function(i){ if(i.value) escritos[i.parentNode.getAttribute('data-rfform')]=i.value; });
    if(!items.length){ caja.innerHTML='<p class="rf-vacio">Todavía no ha escrito nadie. ¡Sé la primera persona de tu tripulación!</p>'; return; }
    caja.innerHTML='<p class="small muted rf-cuantos">'+items.length+(items.length===1?' reflexión':' reflexiones')+' de tu tripulación. Las ves por su alias; tú sales igual.</p>'
      +items.map(function(x){
        var r=recluDeFicha(x.fichaId), alias=(r&&r.alias)||'Un recluta', mia=x.fichaId===mioF;
        var us=enlacesDe(x.enlace||'').map(function(u,k){ var h=/^https?:\/\//i.test(u)?u:'https://'+u;
          return '<a class="rf-enlace" href="'+esc(h)+'" target="_blank" rel="noopener noreferrer">🔗 '+(k?'Otro enlace':'Ver lo que hizo')+'</a>'; }).join(' ');
        var coms=c.coms.filter(function(m){ return m.reflexion===x.id; });
        return '<article class="rf-item'+(mia?' mia':'')+'">'
          +'<div class="rf-quien">'+caraRF(r)+'<b>'+esc(alias)+'</b>'+(mia?'<span class="chip ok">la tuya</span>':'')+'</div>'
          +'<p class="rf-texto">'+esc(x.texto||'').replace(/\n+/g,'<br>')+'</p>'
          +(us?'<p class="rf-enlaces">'+us+'</p>':'')
          +'<div class="rf-coms">'+coms.map(function(m){
              var ra=recluDeFicha(m.fichaId), suyo=m.fichaId===mioF;
              return '<p class="rf-com"><b>'+esc((ra&&ra.alias)||'Un recluta')+'</b> '+esc(m.texto||'')
                +(suyo?' <button type="button" class="rf-borrar" data-rfborrar="'+esc(m.id)+'" data-rfreto="'+esc(id)+'" title="Quitar mi comentario" aria-label="Quitar mi comentario">✕</button>':'')+'</p>'; }).join('')+'</div>'
          +(SIMULACRO?'<p class="small muted">En la Nave de Comandante no se comenta: aquí no se guarda nada.</p>'
            :'<form class="rf-comentar" data-rfform="'+esc(x.id)+'" data-rfreto="'+esc(id)+'"><input maxlength="400" placeholder="'+(mia?'Contesta a tu tripulación…':'Comenta algo a '+esc(alias)+'…')+'" aria-label="Tu comentario">'
            +'<button type="submit" class="btn min">Enviar</button></form>')
          +'</article>';
      }).join('');
    Object.keys(escritos).forEach(function(k){ var i=caja.querySelector('[data-rfform="'+k+'"] input'); if(i) i.value=escritos[k]; });
  }
  function abrirTripulacion(id, boton, forzar){
    var caja=boton&&boton.parentNode&&boton.parentNode.querySelector('.rf-lista'); if(!caja) return;
    st.rfAbierto=st.rfAbierto||{}; st.rfAbierto[id]=true;
    caja.hidden=false; boton.setAttribute('aria-expanded','true'); boton.textContent='💬 Lo que ha escrito tu tripulación ▴';
    var c=(st.rf||{})[id];
    if(!c) caja.innerHTML='<p class="small muted">Cargando…</p>';
    else pintarTripulacion(id, caja);
    if(c&&!forzar&&Date.now()-c.t<60000) return;   // fresco: ya está pintado
    cargarTripulacion(id, forzar).then(function(){ pintarTripulacion(id, caja); },
      function(){ caja.innerHTML='<p class="small muted">No he podido traer lo de tu tripulación. Vuelve a probar en un momento.</p>'; });
  }
  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-rfver]');
    if(b){ var id=b.getAttribute('data-rfver'), caja=b.parentNode.querySelector('.rf-lista');
      if(caja&&!caja.hidden){ caja.hidden=true; b.setAttribute('aria-expanded','false'); b.textContent='💬 Lo que ha escrito tu tripulación'; if(st.rfAbierto) delete st.rfAbierto[id]; return; }
      return abrirTripulacion(id, b); }
    var x=ev.target&&ev.target.closest&&ev.target.closest('[data-rfborrar]');
    if(x){ var reto=x.getAttribute('data-rfreto'); x.disabled=true;
      post({accion:'borrarComentario',per:per,id:x.getAttribute('data-rfborrar')},function(){
        var bb=document.querySelector('[data-rfver="'+reto+'"]'); if(bb) abrirTripulacion(reto, bb, true);
      },function(e){ x.disabled=false; aviso('No he podido quitarlo: '+esc(e), true); }); }
    var g=ev.target&&ev.target.closest&&ev.target.closest('[data-guardarf]');
    if(g) guardarReflexionMia(g.getAttribute('data-guardarf'), g);
  });
  document.addEventListener('submit',function(ev){
    var f=ev.target&&ev.target.closest&&ev.target.closest('[data-rfform]'); if(!f) return;
    ev.preventDefault();
    var i=f.querySelector('input'), t=i?i.value.trim():'', reto=f.getAttribute('data-rfreto'), bt=f.querySelector('button');
    if(!t) return;
    if(bt){ bt.disabled=true; bt.textContent='Enviando…'; }
    post({accion:'comentar',per:per,reflexion:f.getAttribute('data-rfform'),reto:reto,texto:t},function(){
      // enviado: la casilla se vacía ANTES de repintar (si no, «lo que estabas escribiendo» lo volvía a poner)
      if(i) i.value='';
      var bb=document.querySelector('[data-rfver="'+reto+'"]'); if(bb) abrirTripulacion(reto, bb, true);
    },function(e){ if(bt){ bt.disabled=false; bt.textContent='Enviar'; } aviso('No he podido enviarlo: '+esc(e), true); });
  });
  function campoEvidencia(id, clase){
    // 15-sep · un reto secreto (S7) no pide un enlace: pide la PALABRA que se trae del enigma
    if(window.SG_SECRETO&&SG_SECRETO.esSecreto(id))
      return '<input class="'+clase+' secreto" data-ev="'+esc(id)+'" type="text" autocomplete="off" spellcheck="false" '
        +'placeholder="La palabra que borró Vaeon" aria-label="La palabra que borró Vaeon">';
    var e=evidenciaDe(id);
    var ph = e==='obligatoria' ? 'Enlace de lo que has hecho (obligatorio)'
           : e==='recomendada' ? 'Enlace de lo que has hecho (recomendado)'
           : 'Enlace de lo que has hecho (opcional)';
    // 15-sep · y un «+» para un segundo enlace (Norberto: «añade un botón "+" por si alguien necesita
    // compartir dos URL»): se guardan juntos, separados por un espacio, en el mismo sitio de siempre.
    return '<span class="ev-par"><input class="'+clase+(e==='obligatoria'?' obligatoria':'')+'" data-ev="'+esc(id)+'" type="url" inputmode="url" '
      +'placeholder="'+ph+'" autocomplete="off"'+(e==='obligatoria'?' required aria-required="true"':'')+'>'
      +'<button type="button" class="ev-mas" data-evmas="'+esc(id)+'" title="Añadir un segundo enlace" aria-label="Añadir un segundo enlace">+</button>'
      +'<input class="'+clase+' ev2" data-ev2="'+esc(id)+'" type="url" inputmode="url" placeholder="Otro enlace (opcional)" autocomplete="off" hidden></span>';
  }
  document.addEventListener('click',function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-evmas]'); if(!b) return;
    var par=b.closest('.ev-par'), i2=par&&par.querySelector('[data-ev2]'); if(!i2) return;
    i2.hidden=false; b.hidden=true; i2.focus();
  });
  /** Un enlace creíble: con dominio y sin espacios. «www.algo.com» vale; «lo subí al foro» no. */
  function enlaceValido(v){ return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(String(v||'').trim()); }
  /** Uno o dos enlaces, separados por espacios (15-sep · el segundo del «+»). */
  function enlacesValidos(v){ var t=String(v||'').trim().split(/\s+/).filter(Boolean); return t.length>=1&&t.length<=2&&t.every(enlaceValido); }
  function enlacesDe(v){ return String(v||'').trim().split(/\s+/).filter(Boolean); }
  function registrosDeHoy(){
    var hoy=new Date(); hoy.setHours(0,0,0,0);
    var f=(st.yo&&st.yo.retos_fecha)||{};
    // solo los retos que registra el propio recluta (A, B, X, S): los hitos (H1…) se completan solos
    // —el de Reclutamiento, al alistarse— y contarlos le quitaba un hueco el primer día
    return Object.keys(f).filter(function(k){ return /^[ABXS]\d/.test(k) && new Date(f[k])>=hoy; }).length;
  }
  document.addEventListener('click', function(ev){
    var b=ev.target&&ev.target.closest&&ev.target.closest('[data-voto]'); if(!b||b.disabled) return;
    var v=VOTO.v; if(!v) return;
    var dados=Object.keys(VOTO.mia).reduce(function(n,k){ return n+Number(VOTO.mia[k]||0); },0);
    var tipo=dados>=Number(v.votesPerPerson||1)?'paid':'free';
    var M=window.SG&&window.SG.MOTOR; if(!M) return;
    b.disabled=true;
    M.votar(per, v.id, b.getAttribute('data-voto'), tipo).then(function(){
      aviso(tipo==='paid'?'⚡ <b>Voto extra contado.</b> Gracias por mojarte.':'🗳️ <b>Voto contado.</b> Se resuelve en clase.');
      VOTO.cargada=false; VOTO.mia={};
      quien(null,function(d){ if(d&&d.yo) st.yo=d.yo; cargarVotacion(); });
    }).catch(function(e){
      b.disabled=false;
      var m=String((e&&e.message)||e);
      aviso(/INSUFFICIENT_COINS/.test(m)?'No te llegan los créditos para el voto extra.'
        :/NO_FREE_VOTES_LEFT/.test(m)?'Ya has usado tu voto. Puedes comprar uno extra si tu docente lo permite.'
        :/MAX_PAID_VOTES/.test(m)?'Ya has comprado todos los votos extra que se pueden.'
        :/FACTION_NOT_ELIGIBLE/.test(m)?'Esta votación es de otro escuadrón.'
        :'No he podido contar tu voto: '+esc(m), true);
    });
  });

  function marcarReto(id, boton, alEmpezar){
    var tope=Number(window.SG_TOPE_DIA||0);
    if(tope && registrosDeHoy()>=tope){
      aviso('⏳ <b>Hoy ya has registrado '+tope+' retos.</b> Vuelve mañana: así cada reto cuenta de verdad.', true);
      return;
    }
    /**
     * 🔴 15-sep · EL RETO SECRETO PIDE SU PALABRA. En el motor nuevo nadie la pedía: S7 salía con su
     * «Lo he hecho» y se regalaba con un clic (150 xp y una insignia legendaria). Se compara su huella
     * (secreto.js), nunca la palabra; y si no la trae, no se manda nada.
     */
    if(window.SG_SECRETO&&SG_SECRETO.esSecreto(id)&&!marcarReto._palabraOk){
      var cajasS=[].slice.call(document.querySelectorAll('[data-ev="'+id+'"]'));
      var escrita=cajasS.filter(function(x){return x.value&&x.value.trim();})[0];
      if(!escrita){
        cajasS.forEach(function(x){ x.classList.add('falta'); }); if(cajasS[0]) cajasS[0].focus();
        aviso('🕳️ <b>Este reto pide una palabra</b>: la que borró Vaeon. Está al final de un enlace que no debería estar en la presentación del planeta Vínculo.', true);
        return;
      }
      if(boton){ boton.disabled=true; boton.textContent='Comprobando…'; }
      SG_SECRETO.comprobar(id, escrita.value).then(function(ok){
        if(!ok){
          if(boton){ boton.disabled=false; boton.textContent='✅ Lo he hecho'; }
          escrita.classList.add('falta'); escrita.focus();
          aviso('🕳️ <b>Esa no es la palabra que borró Vaeon.</b> Busca el enlace escondido en Vínculo y resuelve el enigma.', true);
          return;
        }
        marcarReto._palabraOk=true;
        try{ marcarReto(id, boton, alEmpezar); } finally { marcarReto._palabraOk=false; }
      });
      return;
    }
    // 15-sep (noche) · los retos que se responden en el propio reto: su reflexión, con su mínimo
    var RF=reflexionDe(id), textoRF='';
    if(RF){
      var cajasR=[].slice.call(document.querySelectorAll('[data-rf="'+id+'"]'));
      var conRF=cajasR.filter(function(x){return x.value&&x.value.trim();})[0]||null;
      textoRF=conRF?conRF.value.trim():'';
      if(textoRF.length<RF.min){
        cajasR.forEach(function(x){ x.classList.add('falta'); }); if(conRF||cajasR[0]) (conRF||cajasR[0]).focus();
        aviso('✍️ <b>Este reto se responde aquí mismo</b>: escribe al menos '+RF.min+' letras (llevas '+textoRF.length+').', true);
        return;
      }
    }
    if(evidenciaDe(id)==='obligatoria'){
      var cajas=[].slice.call(document.querySelectorAll('[data-ev="'+id+'"]'));
      var buena=cajas.filter(function(x){return enlaceValido(x.value);})[0];
      if(!buena){
        cajas.forEach(function(x){ x.classList.add('falta'); });
        if(cajas[0]) cajas[0].focus();
        aviso('🔗 <b>Este reto necesita el enlace</b> de lo que has hecho (tu Bitácora, el vídeo, el juego…). '
          +'Así tu Comandante puede verlo — y enseñarlo en clase si es bueno.', true);
        return;
      }
    }
    // el segundo enlace (el del «+»), si se ha escrito, también tiene que ser un enlace
    var ev2s=[].slice.call(document.querySelectorAll('[data-ev2="'+id+'"]'));
    var ev2=ev2s.filter(function(x){return x.value&&x.value.trim();})[0]||null;
    if(ev2&&!enlaceValido(ev2.value)){
      ev2.classList.add('falta'); ev2.focus();
      aviso('🔗 <b>El segundo enlace no parece un enlace</b>: debería tener un dominio, como padlet.com/…', true);
      return;
    }
    if(boton){ boton.disabled=true; boton.textContent='Registrando…'; }
    // El mismo reto puede tener casilla de evidencia en dos sitios (la tarjeta de la semana y la
    // pestaña de retos). Se coge la que esté escrita, no la primera que aparezca.
    var evs=[].slice.call(document.querySelectorAll('[data-ev="'+id+'"]'));
    var ev=evs.filter(function(x){return x.value&&x.value.trim();})[0]||evs[0]||null;
    // La foto de cómo estaba la ficha y DÓNDE se ha pulsado. Las dos cosas hay que tomarlas ahora:
    // dentro de un momento la Nave se repinta entera y ni la una ni la otra existirán.
    var antes=st.yo?JSON.parse(JSON.stringify(st.yo)):{};
    var donde=puntoDe(boton);
    // (la palabra de un reto secreto no es una evidencia: no se guarda donde el docente lee los enlaces)
    var secreto=!!(window.SG_SECRETO&&SG_SECRETO.esSecreto(id));
    var evidencia=secreto?'':[ev?ev.value.trim():'', ev2?ev2.value.trim():''].filter(Boolean).join(' ');
    post({accion:'registrar',per:per,reto:id,evidencia:evidencia,reflexion:textoRF},function(res){
      // Quien haya pedido apartarse (la ficha de la insignia) lo hace AHORA: si la celebración
      // ocurre debajo de un modal, se pierde la mitad de la recompensa.
      if(alEmpezar) try{ alEmpezar(); }catch(e){}
      if(RF) delete (st.rf||{})[id];
      if(res&&res.avisoReflexion) aviso('✅ Reto <b>'+esc(id)+'</b> registrado, pero tu reflexión no se ha guardado: ábrelo y pulsa «Guardar mi reflexión».', true);
      else aviso('✅ Reto <b>'+esc(id)+'</b> registrado. ¡Buen trabajo!');
      refrescarYCelebrar(antes, donde, 'reto');
    },function(e){
      if(boton){ boton.disabled=false; boton.textContent='✅ Lo he hecho'; }
      if(window.SG&&SG.FIESTA) SG.FIESTA.sonar('error');
      aviso('No he podido registrarlo: '+esc(e), true);
    });
  }

  // El ticket es un formulario compartido por todos los grupos: lleva un hueco para el Comandante
  // que solo la Nave puede rellenar, porque es la única que sabe de quién es cada recluta. Si no hay
  // nadie identificado, el hueco se queda vacío y el alumno lo escribe: nadie se queda sin enviarlo.
  function ticketUrl(d){
    var u=String(d.formTicket||'');
    return u.split('{COMANDANTE}').join(encodeURIComponent((st.yo&&st.yo.profe)||''));
  }

  function puntoDe(el){
    if(!el||!el.getBoundingClientRect) return null;
    var r=el.getBoundingClientRect();
    return (r.width||r.height)?{x:r.left+r.width/2, y:r.top+r.height/2}:null;
  }

  // Vuelve a pedir la ficha, repinta, y SOLO ENTONCES celebra: las cifras que ruedan necesitan que
  // los elementos existan, y existen después del repintado.
  function refrescarYCelebrar(antes, donde, tipo, extra){
    quien(null,function(d){
      st.cargandoYo=false;
      if(d&&d.yo){ st.yo=d.yo; st.email=(d.correo||'').toLowerCase(); st.verificado=true; }
      render();
      if(!window.SG||!SG.FIESTA||!d||!d.yo) return;
      // 'canje-mudo': el canje ya se ha celebrado dentro de la ventana de NEBULA; aquí solo
      // se ponen los datos al día. Duplicarlo sacaba los números saltarines DEBAJO del diálogo.
      if(tipo==='canje-mudo') return;
      if(tipo==='canje') SG.FIESTA.canje(antes, d.yo, donde, extra);
      else SG.FIESTA.reto(antes, d.yo, donde);
    });
  }

  // El servidor devuelve el identificador del documento («grupo__cromo_P1_bran»); el recluta merece
  // ver el nombre del personaje, no eso.
  function nombreDeCarta(docId){
    var k=String(docId).split('__').pop().replace(/^(cromo|heroe)_/,'');
    var c=(window.SG_CROMOS||[]).filter(function(x){return x[0]===k;})[0];
    if(c) return c[1];
    var h=(window.SG_HEROES||[]).filter(function(x){return x[0]===k;})[0];
    return h?h[1]:k;
  }

  /**
   * NEBULA PREGUNTA. Sustituye al `confirm()` del navegador, que además de feo decía
   * «stargate.mistercuarter.es dice» —el nombre del servidor— justo en el momento en que el juego
   * tenía que sostener la ficción. Y lo peor: `confirm()` CONGELA la página entera mientras está
   * abierto, así que ni la barra de créditos ni nada podían moverse detrás.
   *
   * Devuelve una promesa que resuelve true/false. Se cierra con Escape, pulsando fuera o con
   * «Ahora no» — porque una ventana de la que no se sabe salir asusta más que una compra.
   */
  function nebulaPregunta(o){
    return new Promise(function(resolve){
      var previo = document.activeElement;
      var capa = document.createElement('div');
      capa.className = 'neb-capa';
      capa.innerHTML =
        '<div class="neb-caja" role="dialog" aria-modal="true" aria-labelledby="neb-t">'
        + '<div class="neb-cara"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div>'
        + '<div class="neb-quien">NEBULA</div>'
        + '<h3 id="neb-t">' + (o.titulo || '') + '</h3>'
        + (o.cuerpo ? '<div class="neb-cuerpo">' + o.cuerpo + '</div>' : '')
        + '<div class="neb-botones">'
        + (o.no === '' ? '' : '<button type="button" class="btn" data-no>' + esc(o.no || 'Ahora no') + '</button>')
        + '<button type="button" class="btn primary" data-si>' + esc(o.si || 'Confirmar') + '</button>'
        + '</div></div>';
      document.body.appendChild(capa);
      // El primer foco va al botón que NO hace nada: quien pulsa Intro por inercia no compra.
      var bNo = capa.querySelector('[data-no]'), bSi = capa.querySelector('[data-si]');
      setTimeout(function(){ bNo.focus(); }, 30);

      /**
       * 🔴 DECIR QUE SÍ NO CIERRA LA VENTANA. Y no es un detalle de estilo: el «sí» encadena con la
       * entrega, que se pinta EN ESTA MISMA capa. Cuando esto la quitaba también al confirmar, la
       * entrega no encontraba dónde pintarse y el canje volvía a terminar en el cartelito de abajo
       * —exactamente el problema que esta ventana venía a resolver—.
       * Se va sola solo si dices que no; si dices que sí, se queda y se transforma.
       */
      function cerrar(v){
        if(!capa.parentNode) return;
        document.removeEventListener('keydown', tecla, true);
        if(v){ resolve(true); return; }
        capa.classList.add('cerrando');
        setTimeout(function(){
          if(capa.parentNode) capa.parentNode.removeChild(capa);
          if(previo && previo.focus) { try{ previo.focus(); }catch(e){} }
        }, 140);
        resolve(false);
      }
      // 🔴 El foco no puede escaparse a la página de detrás: si se va, quien navega con teclado
      // acaba pulsando botones que no ve y el diálogo deja de ser modal de verdad.
      function tecla(e){
        if(e.key === 'Escape'){ e.preventDefault(); cerrar(false); return; }
        if(e.key !== 'Tab') return;
        var f = [bNo, bSi];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
      document.addEventListener('keydown', tecla, true);
      bNo.onclick = function(){ cerrar(false); };
      bSi.onclick = function(){ cerrar(true); };
      capa.onclick = function(e){ if(e.target === capa) cerrar(false); };
    });
  }

  function canjear(id, nombre, coste, boton, abrir, tipo, usos){
    if(tipo==='heroe_repes') return nebulaPregunta({
      titulo: '¿Cambio 2 héroes repetidos por uno al azar?',
      cuerpo: '<p class="neb-precio"><b>2 repetidos</b><span>nunca el último de ninguno</span></p>'
        + '<p class="neb-nota">Te llevas un héroe con las mismas probabilidades que en el Mercado. Si sale otro repetido, vuelve al montón y lo puedes cambiar otra vez.</p>',
      si: 'Sí, cambiar', no: 'Ahora no'
    }).then(function(ok){ if(ok) canjearYa(id, nombre, 0, boton, true, tipo, 1); });
    var precio = coste > 0
      ? '<p class="neb-precio"><b>' + coste + ' ◈</b><span>de tus ' + (st.yo && st.yo.creditos != null ? st.yo.creditos : 0) + ' ◈</span></p>'
      : '<p class="neb-precio"><b>Sin créditos</b><span>esta no se paga con ◈</span></p>';
    nebulaPregunta({
      titulo: '¿Canjeo «' + esc(nombre) + '»?',
      cuerpo: precio + '<p class="neb-nota">Los créditos se descuentan al confirmar. Tus <b>xp</b> no se tocan: el nivel de tu personaje no baja nunca.</p>',
      si: coste > 0 ? 'Sí, canjear' : 'Sí, cambiar',
      no: 'Ahora no'
    }).then(function(ok){ if(ok) canjearYa(id, nombre, coste, boton, abrir, tipo, usos); });
  }

  /**
   * LO QUE HAS CONSEGUIDO. La misma ventana en la que NEBULA preguntó se queda abierta y se
   * convierte en la respuesta: ella preguntó, ella contesta.
   *
   * 🔴 Por qué no basta el cartelito de abajo que había antes. El canje es el único momento en que
   * un recluta GASTA algo suyo, y hasta hoy la respuesta a ese gesto era una línea de texto en el
   * borde inferior de la pantalla que se iba sola en unos segundos. En el móvil ni se veía. Quien
   * compraba un marco dorado no sabía si había pasado algo, dónde mirar ni qué hacer con él — y eso
   * se parece demasiado a que te hayan cobrado por nada.
   *
   * Tres cosas que tienen que quedar claras, en este orden:
   *   1. QUÉ has conseguido — con su imagen, grande, no un nombre suelto.
   *   2. QUÉ te ha costado — los créditos bajando de verdad, contados, no apareciendo ya bajados.
   *   3. QUÉ haces ahora con ello — y un botón que te lleva allí, porque «está en tu álbum» no
   *      sirve de nada si no sabes dónde está el álbum.
   */
  function nebulaEntrega(o){
    var capa = document.querySelector('.neb-capa');
    if(!capa){ capa=document.createElement('div'); capa.className='neb-capa'; document.body.appendChild(capa); }
    var qe = queEs(o.tipo);
    var arte = o.arte
      ? '<div class="neb-arte"><img src="'+o.arte+'" alt=""></div>'
      : '<div class="neb-arte emoji"><span>'+qe[0]+'</span></div>';
    capa.classList.remove('cerrando');
    capa.innerHTML =
      '<div class="neb-caja gana" role="dialog" aria-modal="true" aria-labelledby="neb-t">'
      + '<div class="neb-cara"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div>'
      + '<div class="neb-quien">NEBULA</div>'
      + '<h3 id="neb-t">' + esc(o.titulo) + '</h3>'
      + arte
      + '<div class="neb-gana-nom">' + esc(o.queEs || qe[1]) + '</div>'
      + (o.coste ? '<p class="neb-gasto"><b id="neb-cr">' + (o.antes || 0) + '</b> ◈'
                 + '<span class="neb-menos">−' + o.coste + '</span></p>' : '')
      + '<p class="neb-donde">' + esc(o.donde || qe[2]) + '</p>'
      + '<div class="neb-botones">'
      + (qe[3] && qe[4] ? '<button type="button" class="btn" data-ir="' + qe[4] + '">' + esc(qe[3]) + '</button>' : '')
      + '<button type="button" class="btn primary" data-cerrar>Seguir</button>'
      + '</div></div>';

    var bCerrar = capa.querySelector('[data-cerrar]'), bIr = capa.querySelector('[data-ir]');
    setTimeout(function(){ bCerrar.focus(); }, 40);
    function fuera(){
      capa.classList.add('cerrando');
      document.removeEventListener('keydown', tecla, true);
      setTimeout(function(){ if(capa.parentNode) capa.parentNode.removeChild(capa); }, 160);
    }
    function tecla(e){
      if(e.key==='Escape'){ e.preventDefault(); fuera(); return; }
      if(e.key!=='Tab') return;
      var f=[]; if(bIr) f.push(bIr); f.push(bCerrar);
      var i=f.indexOf(document.activeElement); e.preventDefault();
      f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();
    }
    document.addEventListener('keydown', tecla, true);
    bCerrar.onclick = fuera;
    capa.onclick = function(e){ if(e.target===capa) fuera(); };
    if(bIr) bIr.onclick = function(){ fuera(); irA(bIr.getAttribute('data-ir')); };

    // Los créditos BAJAN a la vista. Ver el número caer es lo que convierte un cobro en una compra.
    if(o.coste && window.SG && SG.FIESTA){
      var cr = capa.querySelector('#neb-cr');
      setTimeout(function(){
        SG.FIESTA.sonar('gasto');
        SG.FIESTA.rodar(cr, o.antes||0, Math.max(0,(o.antes||0)-o.coste), 850);
      }, 260);
    }
    // Y el premio se celebra DESPUÉS del gasto: primero pagas, luego te llevas.
    if(window.SG && SG.FIESTA) setTimeout(function(){
      SG.FIESTA.sonar(o.tipo==='nota' ? 'xp' : 'insignia');
      var a = capa.querySelector('.neb-arte');
      if(a){
        a.classList.add('brilla');
        var r = a.getBoundingClientRect();
        SG.FIESTA.chispas(r.left+r.width/2, r.top+r.height/2, ['#37e0ec','#f5b043','#ffffff']);
      }
    }, o.coste ? 1000 : 300);
  }

  function canjearYa(id, nombre, coste, boton, abrir, tipo, usos){
    if(boton){ boton.disabled=true; boton.textContent='Canjeando…'; }
    var antes=st.yo?JSON.parse(JSON.stringify(st.yo)):{};
    var tenia=(st.yo&&st.yo.creditos!=null)?st.yo.creditos:0;
    var donde=puntoDe(boton);
    esperandoNebula();
    post({accion:'canje',per:per,recompensa:id,abrir:abrir,usos:usos||1,tipo:tipo||''},function(d){
      var botin = d && d.botin;
      // Si ha tocado una carta, lo que se enseña es LA CARTA, no «Sobre de cromos»: nadie compra un
      // sobre por el sobre.
      // El arte de lo que te llevas. Si ha tocado una carta, LA CARTA; si no, la imagen de la
      // propia recompensa —que ya existe en assets/img/canje/ para las diez— y solo si no hubiera
      // ninguna se cae al emoji. Entregar un icono genérico teniendo la ilustración es desperdiciar
      // el único momento en que se enseña lo comprado.
      var varias = (d && d.botines) || (botin ? [botin] : []);
      /**
       * 🔴 12-sep · SI TRAE CARTAS, SE ABREN CARTA A CARTA. Norberto: «una forma visual y atractiva
       * de presentar los 3 cromos ganados, uno detrás de otro». NEBULA cede el sitio al sobre —su
       * ventana enseñaba la primera carta y los nombres de las otras en una línea— y al cerrar se
       * dice lo que ha costado. Para lo que no son cartas (un marco, subir nota) sigue NEBULA.
       */
      if (varias.length && window.SG.SOBRE && !(d && d.sinAbrir)) {
        var capaN = document.querySelector('.neb-capa'); if (capaN && capaN.parentNode) capaN.parentNode.removeChild(capaN);
        var tenidas = inventarioDe(antes);
        SG.SOBRE.revelar(varias.map(function(c){ return marcaRepetida(c, tenidas); }),
          { titulo: /^oferta_/.test(tipo || '') ? '⚡ Lo que traía tu oferta' : tipo === 'heroe' ? 'Lo que traía la cápsula de rescate' : tipo === 'capsula_elite' ? 'Lo que traía la cápsula de élite'
                  : tipo === 'capsula_legendaria' ? '¡Un Mito de la cápsula legendaria!' : tipo === 'heroe_repes' ? 'Tu héroe nuevo (por 2 repetidos)'
                  : tipo === 'sobre_grande' ? 'Tu sobre grande' : tipo === 'sobre_raro' ? 'Tu sobre de raras' : tipo === 'sobre_epico' ? 'Tu sobre épico' : 'Tu sobre de cromos',
            alAlbum: function(){ irA('botin'); } })
          .then(function(){
            aviso(/^(heroe|capsula|oferta_heroe)/.test(tipo || '') ? '🛡️ <b>Un héroe</b> a tu vestuario' + (coste ? ' · −' + coste + ' ◈' : '') + '.'
              : '🃏 <b>' + varias.length + (varias.length === 1 ? ' carta' : ' cartas') + '</b> a tu álbum'
              + (coste ? ' · −' + coste + ' ◈' : '') + '.');
          });
        refrescarYCelebrar(antes, donde, 'canje-mudo', '');
        return;
      }
      var arte = botin ? arteDeCarta(botin) : null;
      if (!arte) {
        var propia = (window.SG_IMG_RECOMPENSA || {})[nombre];
        if (propia) arte = 'assets/img/canje/' + propia;
      }
      nebulaEntrega({
        tipo: tipo, coste: coste, antes: tenia, arte: arte,
        titulo: varias.length > 1 ? '¡Te han tocado ' + varias.length + '!' : (botin ? '¡Te ha tocado!' : '¡Es tuya!'),
        queEs: varias.length > 1
          ? varias.map(nombreDeCarta).join(' · ')
          : (botin ? nombreDeCarta(botin) : nombre),
        donde: (d && d.sinAbrir)
          ? 'La tienes, pero no he podido abrirla ahora. Ábrela desde «Mi botín» cuando quieras: está arriba del todo.'
          : null
      });
      // El refresco sigue pasando por detrás: la ficha, la barra y el álbum quedan al día para
      // cuando se cierre la ventana. Sin la fiesta de antes, que ahora ocurre DENTRO de la ventana.
      refrescarYCelebrar(antes, donde, 'canje-mudo', '');
    },function(e){
      if(boton){ boton.disabled=false; boton.textContent=coste?('Canjear por '+coste+' ◈'):'Cambiar'; }
      if(window.SG&&SG.FIESTA) SG.FIESTA.sonar('error');
      nebulaProblema(e);
    });
  }

  /** Mientras el servidor cobra y reparte. Sin esto, la ventana se quedaba muda unos segundos. */
  function esperandoNebula(){
    var caja=document.querySelector('.neb-caja'); if(!caja) return;
    caja.classList.add('esperando');
    var b=caja.querySelector('.neb-botones');
    // 🔴 Ocupaba media caja y el texto se partía a la mitad sin sentido. Y una espera muda es una
    // espera que parece rota: la barra no mide nada real —el servidor no informa del progreso— pero
    // dice «esto sigue vivo», que es justo lo que hace falta durante dos segundos de incertidumbre.
    if(b) b.innerHTML='<div class="neb-trab"><p>NEBULA está tramitando el canje…</p>'
      +'<div class="neb-barra"><i></i></div></div>';
  }
  /** Y si no ha podido ser, lo dice ella, no un cartel en el borde de la pantalla. */
  // 🔴 12-sep · Con su título y su tranquilidad según qué haya fallado. Servía solo para el canje y
  // se usaba también al deshacer: el recluta leía «No he podido canjearla · No se te ha cobrado
  // nada» cuando lo que había intentado era deshacer un reto.
  function nebulaProblema(e, titulo, calma){
    var capa=document.querySelector('.neb-capa');
    if(!capa){ aviso((titulo||'No he podido canjearla')+': '+esc(e), true); return; }
    capa.innerHTML='<div class="neb-caja mal" role="dialog" aria-modal="true">'
      +'<div class="neb-cara"><img src="assets/img/personajes/nebula.png" alt="NEBULA"></div>'
      +'<div class="neb-quien">NEBULA</div><h3>'+esc(titulo||'No he podido canjearla')+'</h3>'
      +'<p class="neb-nota">'+esc(e)+'</p>'
      +'<p class="neb-nota"><b>'+esc(calma||'No se te ha cobrado nada.')+'</b></p>'
      +'<div class="neb-botones"><button type="button" class="btn primary" data-cerrar>Entendido</button></div></div>';
    var b=capa.querySelector('[data-cerrar]');
    function fuera(){ capa.classList.add('cerrando'); setTimeout(function(){ if(capa.parentNode) capa.parentNode.removeChild(capa); },160); }
    b.onclick=fuera; capa.onclick=function(ev){ if(ev.target===capa) fuera(); };
    setTimeout(function(){ b.focus(); },40);
  }
  /** El arte real de la carta o del héroe que ha tocado. */
  function arteDeCarta(docId){
    var k=String(docId).split('__').pop();
    var V=window.SG_CARDV||'';
    // 🔴 Las cartas del álbum son «<clave>_carta.png», no «<clave>.jpg» (los héroes sí son .jpg).
    // Con el nombre a medias la imagen no cargaba y la ventana entregaba un hueco: lo peor posible
    // justo en el momento de enseñar el premio. Es el mismo camino que usa el álbum, línea 295.
    if(k.indexOf('heroe_')===0) return 'assets/img/heroes/'+k.slice(6)+'.jpg';
    if(k.indexOf('cromo_')===0) return 'assets/img/tarjetas/'+k.slice(6)+'_carta.png'+V;
    return null;
  }

  /**
   * COMPLETAR LA MISIÓN DESDE LA FICHA DE LA INSIGNIA.
   *
   * 🔴 La ficha explicaba perfectamente qué hay que hacer para ganarla… y ahí te dejaba. Quien la
   * abre convencido tenía que cerrarla, buscar el reto en otra pestaña y marcarlo allí. El botón va
   * donde nace la intención, no tres pantallas después.
   *
   * Solo aparece cuando tiene sentido: en la Nave, con alguien identificado, con el motor nuevo
   * (el viejo se marca por formulario) y si ese reto AÚN le falta. Si ya lo tiene, se le dice.
   */
  function retoDeInsignia(clave){
    var RET=(window.SG_RETOS||{})[(st.d&&st.d.tipo)||'REGULAR']||[];
    return RET.filter(function(t){ return (t[2]||[]).indexOf(clave)>=0; })[0]||null;
  }
  window.SG_BADGE_EXTRA = function(clave){
    if(!st.yo || !motorNuevo()) return '';
    var t = retoDeInsignia(clave); if(!t) return '';
    var ya = ((st.yo.retos)||[]).indexOf(t[0])>=0;
    if(ya) return '<p class="mi-ya">✓ Ya la tienes. La ganaste con este reto.</p>';
    // 16-sep · el reto A6 se gana en el simulador
    if(t[0]===(BT.reto||'A6'))
      return '<div class="mi-hacer"><p class="small muted">Se gana con <b>'+esc(t[1])+'</b> · +'+t[3]+' xp</p>'
        +'<p><a class="btn epico" href="batalla.html?per='+esc(per)+'"><span class="ep-luz"></span><span class="ep-txt">⚔️ Enfréntate al Simulador de Joran</span></a></p>'
        +'<p class="small muted">Se registra solo al ganarle.</p></div>';
    // 15-sep · S7 es el Escape UNI: su puerta (se registra solo al final del escape)
    if(t[0]==='S7'&&window.SG_ESCAPE_UNI)
      return '<div class="mi-hacer"><p class="small muted">Se gana con <b>'+esc(t[1])+'</b> · +'+t[3]+' xp</p>'
        +'<p><a class="btn epico" href="'+esc(window.SG_ESCAPE_UNI)+'" target="_blank" rel="noopener"><span class="ep-luz"></span><span class="ep-txt">🗝️ Entrar en el Escape UNI</span></a></p>'
        +'<p class="small muted">Se registra solo, con el botón del final del escape.</p></div>';
    // 15-sep · y la casilla del enlace aquí también: ahora TODOS los retos A, B y X lo piden (sin ella, «Lo he hecho»
    // desde la ficha de la insignia se quedaba en «falta el enlace» sin sitio donde ponerlo)
    return '<div class="mi-hacer"><p class="small muted">Se gana con <b>'+esc(t[1])+'</b> · +'+t[3]+' xp</p>'
      +campoReflexion(t[0],'mi-rf')
      +((window.SG_SECRETO&&SG_SECRETO.esSecreto(t[0]))||evidenciaDe(t[0])||reflexionDe(t[0])?campoEvidencia(t[0],'mi-ev'):'')
      +'<button class="btn primary" type="button" id="mi-hecho" data-reto="'+esc(t[0])+'">✅ Lo he hecho</button></div>';
  };
  window.SG_BADGE_WIRE = function(clave, caja, cerrar){
    var b = caja.querySelector('#mi-hecho'); if(!b) return;
    b.onclick = function(){
      var id = b.getAttribute('data-reto');
      // (15-sep · lo desactiva marcarReto cuando de verdad registra: si faltaba el enlace o la palabra,
      // el botón se quedaba en «Registrando…» para siempre)
      // Se cierra la ficha para que se vea la celebración y los contadores subiendo: taparlos con
      // un modal encima era quedarse sin la mitad de la recompensa.
      marcarReto(id, b, function(){ if(cerrar) cerrar(); });
    };
  };

  /**
   * 🔴 13-sep · LO QUE ESTÁ A MEDIAS NO SE PIERDE AL REPINTAR. La Nave se repinta entera por muchos
   * motivos (llega la llamada, se refresca la ficha, cambia la sesión…), y cada repintado cerraba la
   * tarjeta que el estudiante tenía abierta y BORRABA el enlace que estaba pegando. Visto con una
   * cuenta real: escribes tu enlace, pulsas «Lo he hecho» y no pasa nada. Ahora se recuerdan las
   * tarjetas abiertas, lo escrito en cada enlace, dónde estaba el cursor y el scroll (misma pestaña).
   */
  function claveDetalle(d, i){ var su=d.querySelector('summary'); return (d.className||'')+'::'+(su?su.textContent.replace(/\s+/g,' ').trim().slice(0,70):i); }
  function recordarEstado(){
    if(!root) return null;
    // la pestaña que SE VE (no st.tab: al cambiar de pestaña st.tab ya es la nueva y no hay que restaurar nada)
    var pan=root.querySelector('#nave-panel'), vista=pan?String(pan.getAttribute('aria-labelledby')||'').replace('nb-t-',''):'';
    var e={tab:vista, abiertos:[], valores:{}, foco:null, ini:null, fin:null, y:window.pageYOffset||0};
    [].slice.call(root.querySelectorAll('details')).forEach(function(d,i){ if(d.open) e.abiertos.push(claveDetalle(d,i)); });
    [].slice.call(root.querySelectorAll('input[data-ev]')).forEach(function(x){ if(x.value) e.valores[x.getAttribute('data-ev')+'|'+x.className.split(' ')[0]]=x.value; });
    e.segundos={}; [].slice.call(root.querySelectorAll('input[data-ev2]')).forEach(function(x){ if(!x.hidden) e.segundos[x.getAttribute('data-ev2')+'|'+x.className.split(' ')[0]]=x.value; });
    // 15-sep (noche) · y lo que va escrito en una reflexión (o en un comentario) no se pierde al repintar
    e.textos={}; [].slice.call(root.querySelectorAll('textarea[data-rf],textarea[data-rfh]')).forEach(function(x){ e.textos[x.id]=x.value; });
    e.coms={}; [].slice.call(root.querySelectorAll('[data-rfform] input')).forEach(function(x){ if(x.value) e.coms[x.parentNode.getAttribute('data-rfform')]=x.value; });
    var a=document.activeElement;
    if(a && root.contains(a) && a.getAttribute && a.getAttribute('data-ev')){
      e.foco=a.getAttribute('data-ev')+'|'+a.className.split(' ')[0]; try{ e.ini=a.selectionStart; e.fin=a.selectionEnd; }catch(_){}
    }
    return e;
  }
  function restaurarEstado(e){
    if(!e||!root||e.tab!==st.tab) return;
    if(e.abiertos.length) [].slice.call(root.querySelectorAll('details')).forEach(function(d,i){ if(e.abiertos.indexOf(claveDetalle(d,i))>=0) d.open=true; });
    Object.keys(e.valores).forEach(function(k){ var p=k.split('|'), x=root.querySelector('input[data-ev="'+p[0]+'"].'+p[1]); if(x&&!x.value) x.value=e.valores[k]; });
    Object.keys(e.textos||{}).forEach(function(k){ var x=document.getElementById(k); if(x&&root.contains(x)){ x.value=e.textos[k]; try{ x.dispatchEvent(new Event('input',{bubbles:true})); }catch(_){} } });
    Object.keys(st.rfAbierto||{}).forEach(function(id){ var b=root.querySelector('[data-rfver="'+id+'"]'); if(b) abrirTripulacion(id, b); });
    Object.keys(e.coms||{}).forEach(function(k){ var f=root.querySelector('[data-rfform="'+k+'"] input'); if(f) f.value=e.coms[k]; });
    Object.keys(e.segundos||{}).forEach(function(k){ var p=k.split('|'), x=root.querySelector('input[data-ev2="'+p[0]+'"].'+p[1]);
      if(x){ x.hidden=false; if(!x.value) x.value=e.segundos[k]; var b=x.parentNode&&x.parentNode.querySelector('[data-evmas]'); if(b) b.hidden=true; } });
    if(e.foco){ var p=e.foco.split('|'), x=root.querySelector('input[data-ev="'+p[0]+'"].'+p[1]);
      if(x){ try{ x.focus({preventScroll:true}); if(e.ini!=null) x.setSelectionRange(e.ini,e.fin); }catch(_){} } }
    if(Math.abs((window.pageYOffset||0)-e.y)>2){ try{ window.scrollTo(0,e.y); }catch(_){} }
  }
  function render(){ var e=recordarEstado(); pintarNave(); restaurarEstado(e); reencenderFoco(); }
  // 14-sep · si la Nave se repinta con NEBULA a medio contar (llegan datos frescos), lo que estaba
  // iluminado se sustituye y se apaga: el paso decía «esto de aquí» sin «aquí». Se vuelve a encender.
  function reencenderFoco(){
    var ov=document.getElementById('nave-onboard'), sel=onboarding._foco;
    if(!ov||!ov.classList.contains('open')||!sel||document.querySelector('.tour-foco')) return;
    try{ var d=document.querySelector(sel); if(d) d.classList.add('tour-foco'); }catch(_){}
  }
  /**
   * 🛰️ LA BARRA DEL SIMULACRO. Lo que el docente necesita para enseñar la Nave delante de la clase:
   * en qué semana está (se ve lo abierto hasta entonces), su personaje, una llamada a filas de
   * mentira, el capítulo de NEBULA de esa semana y «Empezar de cero». Y lo más importante, escrito:
   * nada de esto cuenta.
   */
  function barraSimulacro(){
    if(!SIMULACRO) return '';
    var n=st.semanas.length||15, s=st.actual||1;
    var cap=capsAbiertos().filter(function(c){ return semanaCap(c)===s; })[0]
         || capsAbiertos().filter(function(c){ return PASOS_CAP[c.clave]||c.clave==='c1'; }).slice(-1)[0];
    var opciones=''; for(var k=1;k<=n;k++) opciones+='<option value="'+k+'"'+(k===s?' selected':'')+'>'+k+'</option>';
    return '<div class="sim-barra" role="region" aria-label="Simulacro">'
      +'<span class="sim-tit"><b>🛰️ La Nave de tu Comandante</b><em>Simulacro: nada de esto cuenta ni se guarda</em></span>'
      +'<div class="sim-mandos">'
      // 🔴 13-sep · proyectada en la sesión, la semana es la de la clase y no se cambia: así no hay spoiler
      // por un despiste delante de todos. Para ensayar otra semana está «Mis enlaces → Tu Nave de Comandante».
      +(q.get('embed')==='1'?'<span class="sim-sem">Semana <b>'+s+'</b></span>':'<label class="sim-sem">Semana <select id="sim-sem">'+opciones+'</select></label>')
      +'<button type="button" class="btn small" id="sim-pj">🎭 Mi personaje</button>'
      +'<button type="button" class="btn small" id="sim-ll"'+(st.llamada?' disabled':'')+'>📣 Llamada a filas</button>'
      +(cap?'<button type="button" class="btn small primary" id="sim-cap" data-cap="'+cap.clave+'">▶ NEBULA · '+cap.icono+' '+esc(cap.titulo)+'</button>':'')
      +'<button type="button" class="btn small" id="sim-cero">↺ Empezar de cero</button>'
      +'</div>'
      +'<div class="sim-pjs" id="sim-pjs" hidden>'+[1,2,3,4,5,6,7].map(function(nn){ return ['f','m'].map(function(v){
          return '<button type="button" data-pj="'+nn+v+'" aria-label="Personaje '+nn+v+'"><img src="assets/img/avatares/evo/p'+nn+v+'_r5.jpg" alt="" loading="lazy"></button>'; }).join(''); }).join('')+'</div>'
      +'</div>';
  }
  function cablearSimulacro(){
    if(!SIMULACRO) return;
    // otra semana o otro personaje, SIN recargar: la ficha se vuelve a sembrar y se repinta
    var fresca=function(){ quien(null,function(d){ if(d&&d.yo){ st.yo=d.yo; } render(); }); };
    var sem=document.getElementById('sim-sem');
    if(sem) sem.onchange=function(){
      SG.FUENTE.ponSemana(sem.value).then(function(n){
        st.actual=n; st.estado='curso'; st.llamada=null; st.fichado=false;
        try{ var u=new URL(location.href); u.searchParams.set('semana',n); history.replaceState(null,'',u.toString()); }catch(e){}
        if(!tabVisible(st.tab)) st.tab='nave';
        fresca();
      });
    };
    var pj=document.getElementById('sim-pj'), pjs=document.getElementById('sim-pjs');
    if(pj&&pjs) pj.onclick=function(){ pjs.hidden=!pjs.hidden; };
    if(pjs) Array.prototype.forEach.call(pjs.querySelectorAll('[data-pj]'),function(b){
      b.onclick=function(){ var k=b.getAttribute('data-pj'); SG.FUENTE.ponAvatar(Number(k.charAt(0)), k.charAt(1)).then(fresca); };
    });
    var ll=document.getElementById('sim-ll');
    if(ll) ll.onclick=function(){
      st.llamada={ id:'simulacro', hasta:Date.now()+10*60000, comandante:(SG.FUENTE.comandante&&SG.FUENTE.comandante())||'', escuadron:'', faccion:'', xp:15, creditos:30 };
      st.fichado=false; render();
      if(!st.relojLlamada) st.relojLlamada=setInterval(function(){
        if(!st.llamada) return; var seg=Math.round((st.llamada.hasta-Date.now())/1000);
        if(seg<=0){ st.llamada=null; render(); return; }
        var el=document.getElementById('pase-cuenta'); if(el) el.textContent=reloj(seg);
      },1000);
    };
    var cp=document.getElementById('sim-cap');
    if(cp) cp.onclick=function(){ var c=capsTipo().filter(function(x){ return x.clave===cp.getAttribute('data-cap'); })[0]; if(c) onboarding(0,c.clave,{cap:c}); };
    // 14-sep · desde la sesión proyectada (&nebula=1): NEBULA arranca sola con el capítulo de la semana,
    // el MISMO que verá el alumnado, y el docente lo sigue en directo (Norberto: «el onboarding sirve
    // también para ellos… que quede grabado en la clase y sepan cómo hacer las cosas»)
    if(cp && q.get('nebula')==='1' && !st.nebulaSola){ st.nebulaSola=true; setTimeout(function(){ var b=document.getElementById('sim-cap'); if(b) b.click(); }, 900); }
    var cero=document.getElementById('sim-cero');
    if(cero) cero.onclick=function(){ st.llamada=null; st.fichado=false;
      SG.FUENTE.reiniciar().then(function(){ quien(null,function(d){ if(d&&d.yo){ st.yo=d.yo; } irA('nave'); }); }); };
  }
  function pintarNave(){
    // una pestaña que aún no se ha abierto (un enlace con #mercado en la semana 1) → Mi nave
    if(st.d&&!tabVisible(st.tab)) st.tab='nave';
    /**
     * 🔴 13-sep · CON SESIÓN, FUERA EL TITULAR GRANDE. «La Nave del Recluta» con su párrafo ocupaba
     * 250 px arriba del todo en CADA visita, y a quien ya ha entrado no le cuenta nada que la barra
     * pegada no diga. Se queda para la puerta (sin sesión), que es donde presenta la Nave.
     */
    document.body.classList.toggle('nave-dentro', !!st.yo);
    // 30-ago · el orden que pidió Norberto: puerta → menú (pegajoso al hacer scroll) → semana → contenido
    // 🔴 Sin identificar no se pinta la nave: ni pestañas, ni accesos a los formularios, ni
    // tablero. Antes se veia el panel entero y solo la ficha estaba vacia.
    var dentro = !!st.yo;
    // El ranking «Mi escuadrón» necesita saber quién eres. En el tablero proyectado no hay nadie, y
    // por eso ese modo no aparece allí: no se esconde por seguridad, es que no significa nada.
    try{ window.SG_YO_ALIAS = st.yo ? st.yo.alias : ''; }catch(e){}
    if(st.yo) vigilarLlamada();
    /**
     * 🔴 LA DEMO TIENE SALIDA. Es la página del escaparate —la enlaza el botón DEMO de la portada—, y
     * una demo que no dice cómo se entra de verdad deja al visitante mirando algo que no puede usar.
     * El cartel dice lo que es, que se puede pulsar todo sin miedo, y ofrece las dos salidas que
     * alguien busca en ese momento: entrar con su cuenta o volver a la presentación.
     */
    var avisoDemo = (dentro && DEMO && !st.email)
      ? '<div class="card demo-aviso"><p class="small">'
        + '🎬 <b>Modo demostración.</b> Estás viendo la Nave con la ficha de <b>'+esc(st.yo.alias||'un recluta')
        + '</b>, un recluta de ejemplo. Pulsa lo que quieras: aquí no se guarda nada.</p>'
        + '<p class="demo-salidas"><a class="btn primary btn-google" href="entrar.html">'
        + ((window.SG && window.SG.LOGO_G) || '') + '<span>Entrar con mi cuenta</span></a>'
        + '<a class="btn ghost" href="index.html">Volver a la presentación</a></p></div>'
      : '';
    root.innerHTML = avisoDemo + (dentro
      ? barraSimulacro()+login()+pestanas()+avisoCongelado()+avisoPase()+avisoSorteo()+avisoZoco()+cabecera()
        +'<div id="nave-panel" role="tabpanel" aria-labelledby="nb-t-'+st.tab+'">'+contenido()+'</div>'
      : login()+(st.cargandoYo?'<div class="card">'+cargando('Contactando con NEBULA…','Buscándote en el registro de la tripulación')+'</div>':''));
    verTablero(dentro && st.tab==='rankings');
    // Solo con el motor nuevo: en la Nave de siempre no suena nada, y un botón de silenciar algo
    // que no hace ruido es una promesa incumplida.
    if(dentro && motorNuevo() && window.SG && SG.FIESTA) SG.FIESTA.montarInterruptor('nb-fiesta');
    montarBotonGoogle();   // el hueco del botón solo existe cuando se pinta el login
    // Cualquier botón con data-tab cambia de pestaña, no solo los de la barra: la orden de la
    // semana lleva uno para saltar a la vista completa.
    Array.prototype.forEach.call(root.querySelectorAll('[data-tab]'),function(b){
      b.onclick=function(){ irA(b.getAttribute('data-tab')); };
    });
    // El menú «···». Se cierra al pulsar fuera y con Escape, como cualquier menú.
    var mas=document.getElementById('nb-mas'), menu=document.getElementById('nb-menu');
    if(mas&&menu){
      mas.onclick=function(e){ e.stopPropagation();
        var abierto=menu.hidden;
        menu.hidden=!abierto; mas.setAttribute('aria-expanded', String(abierto)); };
      menu.onclick=function(e){ e.stopPropagation(); };
      if(!window.__sgMenuFuera){
        window.__sgMenuFuera=true;
        document.addEventListener('click',function(){ var m=document.getElementById('nb-menu'),
          b=document.getElementById('nb-mas'); if(m){m.hidden=true;} if(b){b.setAttribute('aria-expanded','false');} });
        document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ var m=document.getElementById('nb-menu');
          if(m&&!m.hidden){ m.hidden=true; var b=document.getElementById('nb-mas'); if(b){b.focus();b.setAttribute('aria-expanded','false');} } } });
      }
    }
    cablearSimulacro();
    cablearZoco();
    Array.prototype.forEach.call(root.querySelectorAll('[data-sorteo-ver]'),function(b){
      b.onclick=function(){ var d=b.getAttribute('data-sorteo-ver'); try{ localStorage.setItem('sgSorteoVisto_'+per+'_'+d,'1'); }catch(x){}
        var x=((st.d&&st.d.recompensas)||[]).filter(function(r){ return r.doc===d; })[0]; if(x) verResultadoSorteo(x); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-sorteo-visto]'),function(b){
      var ir=b.onclick;   // el de «Ver el sorteo» ya cambia de pestaña (data-tab)
      b.onclick=function(e){ try{ localStorage.setItem('sgSorteoVisto_'+per+'_'+b.getAttribute('data-sorteo-visto'),'1'); }catch(x){}
        if(ir) ir.call(b,e); else render(); }; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-zoco-poner]'),function(b){
      b.onclick=function(e){ e.stopPropagation(); zocoPonerVentana(b.getAttribute('data-zoco-poner')); }; });
    // 15-sep (noche) · los logros de a bordo: la cifra de la ficha lleva a su cajón (abierto) y la carta se amplía
    var ncab=root.querySelector('#nc-ab');
    if(ncab) ncab.onclick=function(){ irA('botin'); setTimeout(function(){ var dab=document.getElementById('a-bordo');
      if(dab){ dab.open=true; dab.scrollIntoView({behavior:'smooth',block:'start'}); } }, 80); };
    var abc=root.querySelector('#ab-carta'); if(abc) abc.onclick=lupaABordo;
    Array.prototype.forEach.call(root.querySelectorAll('[data-abrirpend]'),function(b){
      b.onclick=function(){ b.disabled=true; b.textContent='Abriendo…';
        var antes=st.yo?JSON.parse(JSON.stringify(st.yo)):{};
        post({accion:'abrir',per:per,recompensa:b.getAttribute('data-abrirpend'),usos:Number(b.getAttribute('data-usos'))||1},function(d){
          var bs=(d&&d.botines)||[];
          if(bs.length&&window.SG&&SG.SOBRE){ var ten=inventarioDe(antes);
            SG.SOBRE.revelar(bs.map(function(c){ return marcaRepetida(c, ten); }),{titulo:'Lo que tenías sin abrir', alAlbum:function(){ irA('botin'); }}).then(refrescarYo, refrescarYo); }
          else refrescarYo();
        },function(e){ b.disabled=false; b.textContent='Abrir'; aviso('⚠️ No se ha podido abrir: '+esc(String(e)), true); }); }; });
    var salir=document.getElementById('nb-salir');
    if(salir) salir.onclick=function(e){ e.preventDefault(); olvidar(); };
    cablearTeclado();
    Array.prototype.forEach.call(root.querySelectorAll('[data-hecho]'),function(b){
      b.onclick=function(){ marcarReto(b.getAttribute('data-hecho'), b); };
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-adorno]'),function(b){
      b.onclick=function(){
        var c=b.getAttribute('data-adorno');
        var i=document.getElementById('ad-'+c);
        ponerAdorno(c, i?i.value.trim():'', b);
      };
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-fondo]'),function(b){
      b.onclick=function(){ ponerAdorno('fondo', b.getAttribute('data-fondo'), b); };
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-marco]'),function(b){
      b.onclick=function(){ ponerAdorno('marco', b.getAttribute('data-marco'), b); };
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-guardaev]'),function(b){
      b.onclick=function(){ guardarEvidencia(b.getAttribute('data-guardaev'), b); };
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-deshacer]'),function(b){
      b.onclick=function(){ deshacerReto(b.getAttribute('data-deshacer'), b); };
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-canje]'),function(b){
      b.onclick=function(){ canjear(b.getAttribute('data-canje'), b.getAttribute('data-nombre'),
                                   Number(b.getAttribute('data-coste')), b,
                                   b.getAttribute('data-abrir')==='1',
                                   b.getAttribute('data-tipo'),
                                   Number(b.getAttribute('data-usos')||1)); };
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
        // 30-ago · el parche optimista también toca avatar.heroe/skin: la lupa del personaje lee de
        // ahí, y si solo cambiáramos la foto abriría el traje ANTERIOR (visto por Norberto en vivo).
        if(st.yo&&st.yo.avatar){var mh=clave.match(/^heroe:(.+)$/),ms=clave.match(/^skin:([1-5])$/);
          st.yo.avatar.heroe=mh?mh[1]:'';if(ms)st.yo.avatar.skin=Number(ms[1]);}
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
    Array.prototype.forEach.call(root.querySelectorAll('.badge-col .b[data-key]'),function(el){
      function abrirB(){ if(window.SG_OPEN_BADGE) window.SG_OPEN_BADGE(el.getAttribute('data-key')); }
      el.onclick=abrirB;
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirB();}});
    });
    Array.prototype.forEach.call(root.querySelectorAll('.album .c[data-c]'),function(el){
      var clave=el.getAttribute('data-c');
      el.onclick=function(){lupaCromo(clave);};
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();lupaCromo(clave);}});
    });
    var pb=root.querySelector('#pase-ok');
    if(pb)pb.onclick=function(){
      // Con el motor nuevo no hay palabra que teclear: el botón solo está ahí si la llamada está
      // abierta, y pulsarlo es la respuesta. Con el viejo sigue pidiéndose la consigna.
      if(motorNuevo()) return fichar();
      var inp=root.querySelector('#pase-in'), msg=root.querySelector('#pase-msg');
      if(!inp) return;
      var val=String(inp.value||'').trim().toUpperCase();
      if(val.length!==4){msg.textContent='Son cuatro letras.';return;}
      pb.disabled=true; msg.textContent='Enviando…';
      post({accion:'pase',per:per,email:st.email,palabra:val},function(r){
        if(r&&r.ok){ msg.textContent=''; identificar(st.email); }   // recarga: celebra y actualiza créditos
        else { pb.disabled=false; msg.textContent=(r&&r.error)||'No ha podido ser.'; }
      },function(e){ pb.disabled=false; msg.textContent=e; });
    };
    var ob=root.querySelector('#btn-onboard'), rm=root.querySelector('#rep-menu');
    if(ob)ob.onclick=function(){
      if(rm){ rm.hidden=!rm.hidden; return; }
      if(porCapitulos()&&st.yo) return onboarding(0,'c1',{cap:capsTipo()[0]});
      onboarding(0, (st.yo||motorNuevo())?'nave':'puerta');
    };
    if(rm) Array.prototype.forEach.call(rm.querySelectorAll('[data-cap]'),function(b){
      b.onclick=function(){ rm.hidden=true; var c=capsTipo().filter(function(x){return x.clave===b.getAttribute('data-cap');})[0];
        if(!c) return;
        var v=capsVistos()[c.clave];
        // si lo termina y no estaba visto (o se lo había saltado), queda apuntado como visto
        onboarding(0,c.clave,{cap:c, alTerminar:function(estado){ if(estado==='hecho'&&(!v||v.estado!=='hecho')){ marcarCap(c,'hecho'); render(); } }}); };
    });
    // el menú se cierra al pulsar fuera
    if(rm&&!window.__sgRepFuera){ window.__sgRepFuera=true;
      document.addEventListener('click',function(e){ var m=document.getElementById('rep-menu'), b2=document.getElementById('btn-onboard');
        if(m&&!m.hidden&&!m.contains(e.target)&&e.target!==b2&&!(b2&&b2.contains(e.target))) m.hidden=true; }); }
  }

  // ---------- carga ----------
  if(!API){root.innerHTML='<p class="lead">La nave aún no está conectada.</p>';return;}
  // 🔴 9-sep · EL TABLERO EMPIEZA ESCONDIDO. Visto por Norberto en el embed de la Nave dentro de un
  // Genially: mientras la Nave dice «Estableciendo conexión con NEBULA…», DEBAJO ya se veia
  // «¿Cómo va la tripulación?» con su propio «Cargando el tablero…». Dos cargas apiladas, y en un
  // embed —donde no hay cabecera ni pie— parecen restos de otra página. La sección es una <section>
  // del HTML que pinta tablero.js por su cuenta, asi que hay que apagarla a mano hasta que la Nave
  // sepa en qué pestaña está.
  verTablero(false);
  root.innerHTML=cargando('Estableciendo conexión con NEBULA…','Sincronizando la Bitácora de tu PER');
  SG.FUENTE.tablero(per).then(function(d){
    if(d.error){root.innerHTML='<p class="lead">PER no encontrado. Pregunta a tu Capitán por el enlace bueno.</p>';return;}
    st.d=d; st.semanas=window.SGCAL.vista(d.tipo,SEM);
    // 🔴 El rango se calcula distinto en PUA (diez semanas, no quince). La fiesta dibuja el avatar
    // del nivel nuevo y necesita saberlo, o a un recluta de PUA le enseñaría el arte equivocado
    // justo en el momento de enseñarle en qué se ha convertido.
    window.SG_TIPO_PER = d.tipo || 'REGULAR';
    var a=window.SGCAL.semanaActual(d.inicio, d.pausas); var forzada=parseInt(q.get('semana')||'0',10); if(forzada)a=forzada;
    st.actual=a==null?1:a;
    st.estado=a==null?'curso':a<1?'antes':a>st.semanas.length?'fin':'curso';
    if(st.estado==='fin')st.actual=st.semanas.length;
    if(st.estado==='antes')st.actual=0;
    render();
    // 🔴 El modo demo se intenta AQUI ademas de en sg:tablero, porque el tablero puede llegar antes
    // que los datos del PER: entonces demoPermitido() todavia no sabia el nombre del grupo y la
    // demo no arrancaba nunca. Con los dos puntos de entrada da igual quien llegue primero.
    // Y en demo NO se identifica a nadie: el correo guardado de otro dia no pinta nada aqui.
    if(DEMO) vestirDemoSeguro();
    // Con el motor nuevo, si la sesión de Firebase sigue viva se entra sin pulsar nada; con el
    // viejo, lo que se recuerda es el correo que se tecleó una vez.
    else if(motorNuevo()) identificarPorSesion();
    else if(st.email)identificar(st.email);
    // 🔴 Acto 1 solo si la nave está cerrada. Si el recluta ya está identificado (vuelve desde el
    // mismo dispositivo) no tiene sentido presentarse otra vez: va directo a lo suyo.
    // 13-sep · y SOLO con el motor viejo: con el nuevo no hay correo que teclear ni puerta aquí.
    if(!motorNuevo() && !st.yo && !DEMO && !localStorage.getItem('sgNavePuerta_'+per)) onboarding(0,'puerta');
  }).catch(function(){root.innerHTML='<p class="lead">No se pudo contactar con NEBULA. Prueba a recargar.</p>';});
})();
