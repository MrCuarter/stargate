'use strict';
// 44 · UN CURSO ENTERO, DE PRINCIPIO A FIN
// Norberto, 9-sep: «crear un PER, añadir estudiantes, hacer retos, canjear... No podemos
// permitirnos errores, debe ser matemáticos, sin fallo.»
// Las otras baterías miran piezas sueltas. Esta hace lo que hace un curso de verdad: un grupo con
// gente a distintos ritmos, retos que se registran, dinero que se gana y se gasta, y un docente
// corrigiendo. Vigila las CUENTAS y los invariantes que, si se rompen, se rompen en silencio y
// delante de los alumnos: que los xp no bajen nunca al comprar, que nadie pague de más, que editar
// la Bitácora no borre lo anterior y que el progreso de uno no toque el del vecino.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const leer = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
console.log("\n▶ 44 · Un curso entero");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco", PIN = "0000";
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", PIN);
const CRED = G.CREDITOS;
const RET = G.retosDe_("REGULAR");
const todos = () => G.tablero_(PER, true).reclutas;
const ficha = em => todos().filter(x => x.email === em)[0];
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());

// ---------------------------------------------------------------- a) cada reto paga su xp EXACTO
// El catálogo dice cuánto vale cada reto. El motor lo lee, lo suma y lo enseña. Entre medias hay
// una hoja de cálculo y un formulario: aquí se comprueba que no se pierde ni se dobla ni uno.
let alumno = 0;
RET.forEach(function(cat){
  const em = "solo" + (alumno++) + "@alumno.es";
  E.enviarBitacora(G, PER, { email: em, alias: "S" + alumno, nombre: "Solo " + alumno, profe: "Mr Cuarter" });
  const antes = ficha(em);
  E.enviarBitacora(G, PER, { email: em, marcados: E.marcar(G, [cat]) }, alumno + 1);
  const x = ficha(em);
  igual(x.xp - antes.xp, cat[3], "«" + cat[0] + "» paga sus " + cat[3] + " xp, ni uno más ni uno menos");
});

// ---------------------------------------------------------------- b) y la web no miente sobre el dinero
// 🔴 9-sep · ESTE ERA EL FALLO. La FAQ decía «Reto A 10 · Reto B 30 · Actividad 60» a mano, cuando
// el motor paga 20 · 50 · 100. La tabla buena de registro.html sí se generaba, así que la web se
// contradecía a sí misma y el docente le daba al alumnado la cifra equivocada.
const guia = leer("guia.html");
const promesa = "Reto A " + CRED.retoA + " · Reto B " + CRED.retoB +
                " · Actividad " + CRED.actividad + " · hitos " + CRED.derivada;
c(guia.indexOf(promesa) >= 0, "🔴 la guía dice los créditos DE VERDAD (" + promesa + ")");
c(guia.indexOf("Reto A 10 · Reto B 30") < 0, "   y no quedan los números viejos a mano");
c(guia.indexOf("y <b>" + CRED.retoA + " créditos ◈</b>") >= 0,
  "   la FAQ del Reto A también (" + CRED.retoA + " ◈)");

// ---------------------------------------------------------------- c) una clase de verdad, a distintos ritmos
const CLASE = [
  ["ana@alumno.es",   "Ana",   RET.length],       // lo hace todo
  ["bruno@alumno.es", "Bruno", 12],
  ["cora@alumno.es",  "Cora",   7],
  ["dani@alumno.es",  "Dani",   3],
  ["eva@alumno.es",   "Eva",    0],                // se alista y no registra nada
];
const filaDe = {};
CLASE.forEach(function(a){
  E.enviarBitacora(G, PER, { email: a[0], alias: a[1], nombre: a[1] + " Apellido", profe: "Mr Cuarter" });
  filaDe[a[0]] = ++alumno + 1;
});
CLASE.forEach(function(a){
  if (a[2]) E.enviarBitacora(G, PER, { email: a[0], marcados: E.marcar(G, RET.slice(0, a[2])) }, filaDe[a[0]]);
});

// quien más ha hecho, más xp: el orden del ranking no puede salir al revés
for (let i = 1; i < CLASE.length; i++)
  c(ficha(CLASE[i-1][0]).xp > ficha(CLASE[i][0]).xp,
    CLASE[i-1][1] + " va por delante de " + CLASE[i][1] + " (" + ficha(CLASE[i-1][0]).xp + " > " + ficha(CLASE[i][0]).xp + " xp)");
igual(ficha("eva@alumno.es").xp, G.XP_RECLUTAMIENTO,
  "🔬 quien solo se alista tiene los xp del alistamiento, no cero ni basura");

// el viaje completo llega a Leyenda: es la promesa de la web («Leyenda = el viaje completo»)
const ana = ficha("ana@alumno.es");
igual(ana.nivel, 10, "🔴 quien lo hace TODO llega al nivel 10");
igual(ana.rango_nombre, "Leyenda", "   y es Leyenda de la Cero");

// ---------------------------------------------------------------- d) comprar NO baja de nivel
// Es una promesa escrita en la web y en la FAQ. Si un canje tocara los xp, un alumno perdería el
// personaje que ya había desbloqueado por gastarse el dinero. Sería imperdonable.
const xpAntes = ana.xp, credAntes = ana.creditos, nivelAntes = ana.nivel;
const premio = G.recompensasCat_().filter(r => r.tipo === "heroe")[0];
const r1 = E.enviarCanje(G, PER, { email: "ana@alumno.es", recompensa: premio.nombre + " — " + premio.coste + " créditos" });
igual(String(r1.estado).indexOf("Concedido"), 0, "el canje se concede");
igual(ficha("ana@alumno.es").xp, xpAntes, "🔴 los xp NO se mueven al comprar");
igual(ficha("ana@alumno.es").nivel, nivelAntes, "🔴 ni el nivel");
igual(ficha("ana@alumno.es").creditos, credAntes - premio.coste,
  "y los créditos bajan EXACTAMENTE el precio (" + premio.coste + " ◈)");

// ---------------------------------------------------------------- e) nadie gasta lo que no tiene
const pobre = ficha("dani@alumno.es");
const caro = G.recompensasCat_().filter(r => r.coste > pobre.creditos).sort((a,b) => a.coste - b.coste)[0];
if (caro) {
  const r2 = E.enviarCanje(G, PER, { email: "dani@alumno.es", recompensa: caro.nombre + " — " + caro.coste + " créditos" });
  c(String(r2.estado).indexOf("Concedido") !== 0,
    "🔴 «" + caro.nombre + "» (" + caro.coste + " ◈) se RECHAZA: solo tiene " + pobre.creditos);
  igual(ficha("dani@alumno.es").creditos, pobre.creditos, "   y no se le cobra nada");
  c(ficha("dani@alumno.es").creditos >= 0, "   el saldo nunca queda en negativo");
}

// ---------------------------------------------------------------- f) editar la Bitácora no borra nada
// Google reescribe la fila entera cuando el alumno edita desde otra sección: las casillas que no ve
// llegan VACÍAS. Si el sistema hiciera caso, perdería medio curso de golpe.
const antesCora = ficha("cora@alumno.es");
E.enviarBitacora(G, PER, { email: "cora@alumno.es", marcados: E.desmarcar(G, RET.slice(0, 5)) }, filaDe["cora@alumno.es"]);
igual(ficha("cora@alumno.es").xp, antesCora.xp, "🔴 desmarcar 5 retos NO le quita xp: lo ganado, ganado");
igual(ficha("cora@alumno.es").n, antesCora.n, "   ni le quita insignias");

// ---------------------------------------------------------------- g) el vecino no se entera
// Un fallo de índice de fila y el trabajo de uno acaba en la ficha de otro.
const foto = {}; todos().forEach(x => { foto[x.email] = x.xp; });
E.enviarBitacora(G, PER, { email: "bruno@alumno.es", marcados: E.marcar(G, RET) }, filaDe["bruno@alumno.es"]);
todos().forEach(function(x){
  if (x.email !== "bruno@alumno.es")
    igual(x.xp, foto[x.email], "a «" + x.alias + "» no le ha cambiado nada porque Bruno registrara lo suyo");
});
c(ficha("bruno@alumno.es").xp > foto["bruno@alumno.es"], "y Bruno sí ha subido");

// ---------------------------------------------------------------- h) el docente deshace un canje
const o = G.perObj_(G.perFila_(PER).v);
const shC = G._maestra.getSheetByName(o.tabC);
// la fila concreta de ESE canje. Coger getLastRow() a ciegas es cómo esta batería se equivocó la
// primera vez: la última fila era un canje RECHAZADO de otro alumno.
function filaCanje(email, nombreRec) {
  const v = shC.getDataRange().getValues(), cab = v[0].map(String);
  const cM = cab.indexOf("Dirección de correo electrónico") >= 0
    ? cab.indexOf("Dirección de correo electrónico") : cab.indexOf("Correo electrónico");
  const cR = cab.indexOf("Recompensa"), cE = cab.indexOf("Estado");
  for (let i = v.length - 1; i >= 1; i--)
    if (String(v[i][cM] || "").toLowerCase() === email && String(v[i][cR] || "").indexOf(nombreRec) === 0
        && String(v[i][cE] || "").indexOf("Concedido") === 0) return i + 1;
  return 0;
}
const filaAna = filaCanje("ana@alumno.es", premio.nombre);
c(filaAna > 1, "encuentro la fila del canje de Ana (" + filaAna + ")");
const credConPremio = ficha("ana@alumno.es").creditos;
const heroesAntes = ficha("ana@alumno.es").n_heroes;
const rv = api({ accion: "canje_revertir", per: PER, fila: filaAna, profe: "Mr Cuarter", pin: PIN });
igual(rv.ok, true, "revertir el canje de Ana responde que sí");
igual(ficha("ana@alumno.es").creditos, credConPremio + premio.coste, "🔴 le vuelve el dinero exacto");
igual(ficha("ana@alumno.es").xp, xpAntes, "   y los xp siguen sin moverse");
igual(ficha("ana@alumno.es").n_heroes, heroesAntes - 1,
  "   y se le retira el héroe: ni premio ni dinero a la vez");

// 🔴 Y EL SORTEO NO SE REVIERTE. Si se pudiera, un alumno pediría revertir cada sobre malo hasta
// que saliera la carta legendaria: dinero infinito disfrazado de arreglo.
const sobre = G.recompensasCat_().filter(r => r.tipo === "cromo" && r.coste > 0)[0];
E.enviarCanje(G, PER, { email: "ana@alumno.es", recompensa: sobre.nombre + " — " + sobre.coste + " créditos" });
const filaSobre = filaCanje("ana@alumno.es", sobre.nombre);
const credConSobre = ficha("ana@alumno.es").creditos;
const rvS = api({ accion: "canje_revertir", per: PER, fila: filaSobre, profe: "Mr Cuarter", pin: PIN });
c(!rvS.ok, "🔴 un sobre de cromos NO se puede revertir");
c(String(rvS.error || "").indexOf("sobre de cromos") >= 0, "   y el docente lee por qué: " + String(rvS.error || "").slice(0, 60));
igual(ficha("ana@alumno.es").creditos, credConSobre, "   y no se le devuelve nada");

// ---------------------------------------------------------------- i) las cuentas de la clase cuadran
const T = G.tablero_(PER, true);
const sumaXp = T.reclutas.reduce((s, x) => s + x.xp, 0);
c(sumaXp > 0, "la clase suma " + sumaXp + " xp");
T.reclutas.forEach(function(x){
  igual(x.creditos, x.creditos_ganados - x.creditos_gastados,
    "«" + x.alias + "»: saldo = ganado − gastado (" + x.creditos_ganados + " − " + x.creditos_gastados + ")");
  c(x.creditos >= 0, "   y no debe dinero");
  c(x.xp >= G.XP_RECLUTAMIENTO, "   y nunca baja del alistamiento");
});

E.resumen("Un curso entero");
