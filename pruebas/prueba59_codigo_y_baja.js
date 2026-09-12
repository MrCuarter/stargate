'use strict';
// 59 · QUIÉN ENTRA Y QUIÉN SE VA
//
// Dos huecos que Norberto encontró preguntando, no mirando el código: «¿puede alistarse cualquiera?»
// y «¿un docente puede eliminar a un estudiante?». Las dos respuestas eran las malas: cualquiera con
// el enlace se alistaba, y una ficha equivocada se quedaba en el grupo para siempre.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const js = f => fs.readFileSync(path.join(__dirname, "..", "assets", "js", f), "utf8");
console.log("\n▶ 59 · Quién entra y quién se va");

const { catalogo } = require(path.join(__dirname, "..", "motor", "catalogo.js"));
const P = require(path.join(__dirname, "..", "motor", "paquete.js"));
const ALTA = js("alistarse.js"), CONSOLA = js("consola.js"), MOTOR = js("motor.js");

// ---------------------------------------------------------------- a) el código que se dicta en voz alta
const cat = catalogo();
const datos = { id: "g", nombre: "G", tipo: "REGULAR", inicio: "2026-06-08", referente: "x@y.z",
                docentes: [{ nombre: "D", correo: "d@y.z", rol: "referente" }] };
const cod = P.paquete(datos, cat).proyecto.joinCode;
c(!!cod, "🔴 todo grupo nuevo nace con código de acceso");
igual(cod.length, 6, "   de seis caracteres");
c(!/[IO01]/.test(cod), "🔴 sin I, O, 0 ni 1: se dicta en clase y esos cuatro se confunden siempre");
const cien = []; for (let i = 0; i < 200; i++) cien.push(P.codigoNuevo());
igual(cien.length, new Set(cien).size > 190 ? cien.length : -1,
  "   y no se repiten (200 seguidos dan al menos 190 distintos)");
c(P.paquete(Object.assign({}, datos, { codigo: "MIOMIO" }), cat).proyecto.joinCode === "MIOMIO",
  "y se puede imponer uno, para no cambiárselo a un grupo que ya lo tenía");

// ---------------------------------------------------------------- b) alistarse lo pide
c(/function codigoCorrecto\(\)/.test(ALTA), "el alistamiento comprueba el código");
c(/if \(!esperado\) return true;/.test(ALTA),
  "🔴 y si el grupo NO tiene código se entra como siempre: los sembrados antes no pueden quedarse sin poder alistar a nadie");
c(/\.toUpperCase\(\)\.replace\(\/\[\^A-Z0-9\]\/g, ""\)/.test(ALTA),
  "   se normaliza: minúsculas, espacios y guiones no pueden dejar fuera a nadie");
c(/searchParams\.set\("codigo"/.test(ALTA),
  "🔴 y una vez acertado se mete en la dirección: un F5 no puede volver a preguntarlo");
c(/NO es seguridad/.test(ALTA),
  "🔴 y está escrito lo que NO protege: el código vive en el documento del grupo");

// ---------------------------------------------------------------- c) la consola lo enseña y lo cambia
c(/joinCode/.test(CONSOLA), "la consola enseña el código");
c(/codigo-grande/.test(CONSOLA), "   en grande, porque se dicta en voz alta");
c(/nuevoCodigo\(PER\)/.test(CONSOLA), "y se puede cambiar si se ha corrido más de la cuenta");
c(/'&codigo=' \+ esc\(DATOS\.proyecto\.joinCode\)/.test(CONSOLA),
  "🔴 y el enlace de alistamiento ya lo lleva dentro: quien lo siga no tiene que escribir nada");

// ---------------------------------------------------------------- d) dar de baja
c(/async function darDeBaja/.test(MOTOR), "🔴 un docente puede dar de baja a alguien del grupo");
c(/if \(f\.data\(\)\.projectId !== perId\)/.test(MOTOR),
  "   comprobando que esa ficha sea DE ESE grupo: el id de una ficha no dice de quién es");
c(/deleteDoc\(doc\(db, "student_profiles", fichaId, "privado", "datos"\)\)/.test(MOTOR),
  "   y se lleva por delante el expediente privado, no solo la ficha");
const baja = MOTOR.slice(MOTOR.indexOf("async function darDeBaja"), MOTOR.indexOf("async function darDeBaja") + 900);
c(baja.indexOf("xp_ledger") < 0 && baja.indexOf("applyXpDelta") < 0,
  "🔴 y NO toca el libro de experiencia: ahí queda el rastro de lo que se le dio y se le quitó");
c(/escribe su alias exactamente/.test(CONSOLA),
  "🔴 borrar pide escribir el alias: es lo único que impide un clic distraído sobre la persona equivocada");
c(/No hay deshacer/.test(CONSOLA), "   y se avisa de que no hay vuelta atrás");

E.resumen("Quién entra y quién se va");
