/**
 * STARGATE · DE DÓNDE ERES, CON LA PIEL DE LA NAVE (11-nov-2026). La pieza es de GamificaPro (sdk/origen.js, `GP.origen`, y la
 * función `modOrigen`); aquí solo se viste y se dice cuándo se pregunta. NO lleva lógica propia: lo que falta lo decide `queFalta`.
 *
 * Norberto (11-nov): «Me gustaría hacerlo ya… que cuando entren en directo ya aparezca el mapa y se les pregunte en esta edición su
 * ciudad y país. En la siguiente ya lo hacemos desde el principio. En esta, lo preguntamos la primera vez que se unen en directo… Los
 * estudiantes que no se han metido hasta Navidad, en Navidad les salta el aviso para completar datos. Los del directo, les salta la
 * próxima vez la edad y lugar.» Así:
 *   · SG.origen.alFichar(per)   → justo después de fichar en la Llamada a filas (la sesión que sigue el recluta y el «Presente» de la
 *                                 Nave): si aún no ha dicho de dónde es, solo la ciudad y el país (el globo de la sala se enciende con
 *                                 ella). Pregunta al servidor (`mio`) una vez por fichaje; «Ahora no» ahí no cuenta.
 *   · SG.origen.alEntrar(per, yo) → al entrar en la Nave: la edad a quien dio su ciudad en el directo (con ella puesta), y desde la
 *                                 pausa de Navidad (DESDE), todo a quien no ha dicho nada; «Ahora no» dos veces y no más.
 * Nunca en la demo, el simulacro, la Nave incrustada, a un fantasma ni a una cuenta congelada. Qué se guarda y quién lo ve: privacidad.html.
 */
(function () {
  window.SG = window.SG || {};
  var DESDE = "2026-12-21";   // la pausa de Navidad de STARGATE (del 21-dic al 3-ene): el aviso a quien no ha dicho nada
  var URL_LISTA = "assets/js/ciudades.json";
  var TEXTOS = {
    tituloLugar: "¿Desde dónde te unes a la tripulación?",
    introLugar: "Tu ciudad se enciende en el globo de la Llamada a filas, con tu personaje. Solo tu ciudad y tu país: nada más.",
    tituloEdad: "Una última cosa, recluta",
    introEdad: "Ya sales en el globo de tu tripulación. ¿Qué edad tienes? Nadie verá la tuya: solo cuenta para las cifras del grupo. Si tu ciudad no es esa, cámbiala aquí.",
    titulo: "¿Desde dónde viajas?",
    intro: "Tu ciudad se enciende en el globo de la Llamada a filas, con tu personaje. Tu edad no la ve nadie: solo cuenta para las cifras del grupo.",
    ciudad: "¿De qué ciudad eres?",
    gracias: "¡Hecho! Ya brillas en el globo de tu tripulación.",
  };
  function listos() {
    var G = window.GP && window.GP.origen, M = window.SG && window.SG.MOTOR;
    return G && M && typeof M.llamar === "function" ? { G: G, M: M } : null;
  }
  function base(per, o) {
    return { llamar: o.M.llamar, projectId: per, url: URL_LISTA, desde: DESDE, veces: 2, textos: TEXTOS,
      clases: { boton: "btn", primario: "primary", ventana: "sg-origen" } };
  }
  window.SG.origen = {
    DESDE: DESDE,
    /** Después de fichar: la ciudad y el país, si aún no los ha dicho. → Promise<boolean> (si se abrió la ventana). */
    alFichar: function (per, o) {
      o = o || {};
      var x = listos();
      if (!x || !per || o.excluir) return Promise.resolve(false);
      return Promise.resolve(x.M.llamar("modOrigen", { accion: "mio", projectId: String(per), directo: true })).then(function (r) {
        r = r && r.data ? r.data : r;
        if (!r || r.que !== "lugar") return false;
        return x.G.pedir(Object.assign(base(per, x), { modo: "lugar", alGuardar: function (g) { if (o.alGuardar) o.alGuardar(g, TEXTOS.gracias); } }));
      }, function () { return false; });   // (la pieza apagada o sin desplegar: no se pregunta, y fichar ya está hecho)
    },
    /** Al entrar en la Nave: la edad a quien dio su ciudad; a quien nada, desde Navidad. yo = el recluta (con `origen`: su `modOrigen`). */
    alEntrar: function (per, yo, o) {
      o = o || {};
      var x = listos();
      if (!x || !per || !yo || o.excluir || yo.fantasma || yo.congelado) return false;
      return x.G.pedir(Object.assign(base(per, x), { estado: yo.origen || {}, alGuardar: function (g) { if (o.alGuardar) o.alGuardar(g, TEXTOS.gracias); } }));
    },
  };
})();
