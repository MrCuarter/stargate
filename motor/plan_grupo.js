'use strict';
/**
 * STARGATE · UN GRUPO, POR EL MISMO CAMINO QUE LOS DE VERDAD (10-oct-2026, V8 del §1d de gamificapro/docs/PLAN_CENTRALIZAR.md).
 *
 * Los sembradores de la línea de órdenes (motor/sembrar.js y motor/sembrar_prueba.js) escriben el grupo con el plan de
 * `crearGrupoMod` (GamificaPro, functions/modGrupos.js → planDelGrupo): lo mismo que escribe el servidor cuando un referente crea
 * un grupo desde crear.html —el proyecto con su versión (`modVersion`), el equipo con los vitalicios del mod, y los retos, las
 * campañas y las recompensas con sus ids de documento—, aquí con la cuenta de servicio o en el emulador. Así no queda una copia
 * aparte de cómo se traducen los ids, y un grupo de prueba nace en la versión de los de verdad (`versiones.nacen`) o en la que
 * se fuerce (`version`: 1, la de siempre, como per-16450; 2, la definitiva). Como `sembrar_grupos_prueba.cjs` de DPG.
 *
 *   const G = require("./plan_grupo.js");
 *   const plan = await G.plan({ id, proyecto, privado, misiones, campanas, recompensas }, { uid, correo, nombre }, version);
 *   await G.escribir(db, plan);          → en lotes de 400 (unos 110 documentos: uno)
 *
 * El GamificaPro del plan: GAMIFICAPRO_DIR (un worktree, o el de los emuladores del laboratorio) o el checkout de siempre.
 */
const path = require("path"), { pathToFileURL } = require("url");
const GP = process.env.GAMIFICAPRO_DIR || "/Users/nor/Claude/vibewebs/gamificapro";

/** El plan (puro) → { id, codigo, escrituras: [{ ruta, datos }], version } */
async function plan(paquete, creador, version) {
  const desde = f => import(pathToFileURL(path.join(GP, "functions", f)).href);
  const { planDelGrupo } = await desde("modGrupos.js");
  const { personasDe } = await desde("comun.js");
  const r = planDelGrupo({ mod: "stargate", paquete, creador, personas: personasDe("stargate"), ahora: Date.now() });
  if (version != null) r.escrituras[0].datos.modVersion = Number(version);
  r.version = r.escrituras[0].datos.modVersion;
  return r;
}

/** ['projects', id, 'privado', 'stargate'] → su referencia (colección y documento, por turnos) */
const refDe = (db, ruta) => ruta.reduce((r, x, i) => (i % 2 ? r.doc(x) : (r ? r.collection(x) : db.collection(x))), null);

async function escribir(db, p) {
  for (let i = 0; i < p.escrituras.length; i += 400) {
    const lote = db.batch();
    p.escrituras.slice(i, i + 400).forEach(e => lote.set(refDe(db, e.ruta), e.datos));
    await lote.commit();
  }
}

/** `--version=1|2` de la línea de órdenes (null si no se da; para en seco si no vale) */
function versionPedida(argv) {
  const a = (argv || process.argv).find(x => x.indexOf("--version=") === 0);
  if (!a) return null;
  const v = Number(a.slice(10));
  if (v !== 1 && v !== 2) { console.error("✗ --version: 1 o 2"); process.exit(2); }
  return v;
}

module.exports = { plan, escribir, versionPedida, GP };
