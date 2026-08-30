# Banco de pruebas del Apps Script de STARGATE

Ejecuta **el `Code.gs` de verdad** fuera de Google: hojas de cálculo en memoria, Drive, Google Docs,
Forms, correo, propiedades del script, cerrojo y triggers, todo simulado. No sustituye a la prueba en
vivo, pero coge los fallos de lógica en **dos segundos y sin gastar cuota** — y ya ha encontrado
nueve: los tres de la v3.12, los cuatro de la v3.13 y los dos peores de la prueba en vivo del 25-ago.

**Hoy: 40 baterías · 1.671 comprobaciones · 0 fallos**, y las mismas cifras contra la copia ASCII.

## Cómo se usa

```bash
cd Project_CCD/web-stargate
node pruebas/run.js              # todas las baterías
node pruebas/run.js 3 9          # solo la 3 y la 9
node pruebas/run.js --ascii      # 🔴 prueba la copia que se PEGA en Apps Script
```

No hace falta instalar nada: Node y punto (`package.json` local con `type: commonjs`, porque el repo
padre es ESM).

## 🔴 `--ascii`: probar lo que de verdad se pega

Al pegar el `Code.gs` por automatización, el portapapeles re-codifica y los acentos se convierten en
mojibake (`"Bit√°cora"`). Eso rompería `idx_(cab,"bitácora")` y `idx_(cab,"quién imparte")`. Por eso
el build genera `assets/descargas/Code.gs.ascii.txt`, sin un solo byte no-ASCII. **`--ascii` corre las
mismas baterías contra esa copia**: si las dos dan el mismo resultado, lo que se pega es equivalente.

## Qué hay dentro

| Fichero | Qué es |
|---|---|
| `mocks.js` | Google simulado: Sheets, Drive, Docs, correo, propiedades, cerrojo, triggers, UI programable |
| `formapp.js` | Google Forms simulado — incluida la pestaña de respuestas **con las mismas cabeceras** que genera Google (de ahí saca los datos `idx_()`) |
| `entorno.js` | Monta el mundo, carga `Code.gs` en un contexto `vm` y ofrece los atajos (`crearPERDemo`, `enviarBitacora`, `enviarCanje`, `reclutaRico`…) y las comprobaciones |
| `run.js` | Lanzador: cada batería en su propio proceso, para que ninguna se contamine con la anterior |

## Las baterías

| # | Cubre |
|---|---|
| 1 | Alistamiento, identidad, docente declarado, xp/créditos, niveles, evolución, derivadas y escalado PUA |
| 2 | **Append-only**: saltarse secciones de la Bitácora no borra insignias; avatar congelado; otorgar/anular |
| 3 | Canje: catálogo, calendario, tope por alumno, saldo, efectos automáticos y aviso al docente |
| 4 | Álbum de 20 cromos (pesos, series, rarezas, repetidos) y corona semanal (incluido el empate) |
| 5 | Consola del profesorado (portada, pestaña por PER, limpieza) y DATOS/RESUMEN |
| 6 | API: `doGet` público **sin filtrar datos personales**, `doPost` con PIN, ficha bidireccional, archivar |
| 7 | Crear un PER (formularios, carpeta, documento, triggers) y **migrar un formulario antiguo** |
| 8 | v3.13 · **lotes con continuación**: resetear la hoja y actualizar formularios sin agotar los 360 s |
| 9 | v3.13 · el aviso de un canje de nota **no se pierde** aunque nadie tenga correo; reclutas sin docente |
| 10 | v3.13 · **dossier del profesorado**: un documento con todos los grupos, mismo enlace siempre, envío por correo |
| 11 | v3.14 · vincular formularios **con reintento**, y limpieza si `crearPER` se cae a medias |
| 12 | v3.14 · el alta de un PER **cabe en el tiempo**: el acabado se difiere y lo termina `continuarAltaPER` |
| 13 | v3.14 · **calendario del PER**: apertura, cierre de misiones y cierre del canje (una semana más) |
| 14 | v3.14 · robustez de la prueba en vivo: el canje no depende del correo, triggers únicos, orbes cacheados, una fila se resuelve una vez |
| 15 | v3.15 · **parte de salud** (mundo sano vs. mundo roto a propósito) y **reproceso de canjes** sin resolver, por lotes |
| 16 | v3.15 · **cuota de correo**: sin cuota el canje se concede igual y queda traza; el aviso de cuota baja, uno al día |
| 17 | v3.15 · **3 repetidos = 1 sobre**, insignias por **serie completa** (sin tocar el «/24») y **racha** de semanas |
| 18 | v3.15 · **aviso antes de que cierre el canje**: umbrales 7 y 1 días, solo a quien le quedan créditos, una vez |
| … | (19-39: la tabla se quedó corta; el título de cada batería lo dice su primera línea) |
| 40 | v3.42 · **migrar el catálogo en un grupo vivo**: el orden de operaciones al borrar páginas, los 6 minutos de Apps Script y la identidad de un item |

## 🔴 El simulador NO es más fácil que Google (v3.42)

Los dos peores fallos del 30-ago pasaron el banco porque el simulador era más benévolo. Ya no:

- **Borrar tiene reglas.** `deleteItem` sobre un salto de página al que todavía navega una opción de
  un desplegable (o el salto de otra página) lanza `Invalid data updating form`, igual que Forms.
  Se reescriben los desplegables ANTES de borrar, nunca después.
- **Escribir cuesta tiempo.** `M.cronometro` cobra cada escritura de Forms y puede matar la pasada al
  llegar al corte de los 6 minutos. `coste = 0` por defecto: hay que pedirlo. La bandera
  `cronometro.muerto` sobrevive a los `try/catch` de Code.gs, así que es lo que hay que mirar.
  `cronometro.escrituras` cuenta cuántas van (sirve para exigir que una pasada repetida no escriba).
- **Cada `getItems()` devuelve envoltorios NUEVOS.** Comparar items con `===` entre dos lecturas es
  false SIEMPRE, como en Google: la identidad es `getId()`, y la posición, `getIndex()`.
- **`getGoToPage()` da la PÁGINA destino o null**; el «enviar»/«continuar» se lee con
  `getPageNavigationType()`. Y `Form.getDescription()` existe.

## Añadir una batería

Crea `pruebaN_loquesea.js`, copia la cabecera de cualquiera y usa `E.comprobar / E.igual / E.contiene`
y `E.resumen("...")` al final. `run.js` la recoge sola por el nombre.

## Lo que el banco NO puede ver

Permisos y OAuth · el despliegue del web app · cómo se ve un Google Form de verdad · el navegador ·
las LECTURAS, que aquí siguen siendo gratis (solo se cobran las escrituras de Forms). Los timeouts se
provocan con `G.MARGEN_MS = 0` o, si se quiere el peso real de una migración, con `M.cronometro`.
Para el resto está el guion de prueba en vivo del traspaso.
