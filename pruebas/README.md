# Banco de pruebas del Apps Script de STARGATE

Ejecuta **el `Code.gs` de verdad** fuera de Google: hojas de cálculo en memoria, Drive, Google Docs,
Forms, correo, propiedades del script, cerrojo y triggers, todo simulado. No sustituye a la prueba en
vivo, pero coge los fallos de lógica en **dos segundos y sin gastar cuota** — y ya ha encontrado
siete: los tres de la v3.12 y los cuatro de la v3.13.

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

## Añadir una batería

Crea `pruebaN_loquesea.js`, copia la cabecera de cualquiera y usa `E.comprobar / E.igual / E.contiene`
y `E.resumen("...")` al final. `run.js` la recoge sola por el nombre.

## Lo que el banco NO puede ver

Permisos y OAuth · el despliegue del web app · cómo se ve un Google Form de verdad · los tiempos
reales de Drive y Forms (aquí todo es instantáneo, así que los timeouts hay que provocarlos poniendo
`G.MARGEN_MS = 0`) · el navegador. Para eso está el guion de prueba en vivo del traspaso.
