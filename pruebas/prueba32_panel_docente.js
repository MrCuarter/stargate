'use strict';
// 32 · CADA DOCENTE, SU GENIALLY
// El panel se resolvía en dos escalones (el del PER, y si no el estándar). Algunos docentes retocan
// el Genially para SUS alumnos, así que ahora son tres, del más concreto al más general:
//    docente del alumno → PER → estándar
// Lo que más puede doler y esta batería vigila: que editar el equipo docente NO se lleve por delante
// el panel que cada uno había guardado (esa URL no viaja en el formulario del equipo).
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 32 · Cada docente, su Genially");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
const o = () => G.perObj_(G.perFila_(PER).v);
const DOCS = G.docentesDe_(PER);
c(DOCS.length >= 2, "el PER de pruebas trae equipo docente (" + DOCS.map(d => d.nombre).join(", ") + ")");
const A = DOCS[0].nombre, B = DOCS[1].nombre;

// ---------------------------------------------------------------- a) los tres escalones
G.PropertiesService.getScriptProperties().setProperty("PANEL_STD_VER", "https://estandar");
igual(G.panelDe_(o(), A), "https://estandar", "sin nada propio, cae en el estándar");

const fila = G.perFila_(PER).fila;
G.hoja_(G.H.PERS).getRange(fila, 20).setValue("https://del-per");
igual(G.panelDe_(o(), A), "https://del-per", "el del PER manda sobre el estándar");

igual(G.guardarPanelDocente_(PER, A, "https://el-de-A"), true, "un docente guarda el suyo");
igual(G.panelDe_(o(), A), "https://el-de-A", "🔴 y el suyo manda sobre el del PER");
igual(G.panelDe_(o(), B), "https://del-per", "pero solo para él: el otro sigue con el del grupo");
igual(G.panelDe_(o(), ""), "https://del-per", "y un alumno sin docente declarado, también");

igual(G.guardarPanelDocente_(PER, "Quien No Existe", "https://nada"), false,
      "no se puede guardar el panel de alguien que no está en el equipo");

// ---------------------------------------------------------------- b) la API lo publica por docente
const d = JSON.parse(G.doGet({ parameter: { per: PER } }).getContent());
igual(d.paneles[A], "https://el-de-A", "la API publica el panel de quien lo tiene");
igual(d.paneles[B], undefined, "y no inventa uno para quien no lo tiene");
igual(d.panel, "https://del-per", "más el del grupo, para el resto");

// ---------------------------------------------------------------- c) editar el equipo NO lo borra
// 🔴 Esto es lo que habría dolido: la URL propia no viaja en el formulario del equipo docente, así
// que reescribir las filas sin rescatarla antes la borraba en silencio.
G.guardarDocentes_(PER, DOCS.map(x => ({ nombre: x.nombre, correo: x.correo, rol: x.rol })));
igual(G.panelDe_(o(), A), "https://el-de-A",
      "🔴 tras editar el equipo docente, el panel propio SIGUE ahí");

// y se puede quitar a propósito
igual(G.guardarPanelDocente_(PER, A, ""), true, "se puede dejar vacío");
igual(G.panelDe_(o(), A), "https://del-per", "y vuelve a ver el del grupo");

E.resumen("Cada docente, su Genially");
