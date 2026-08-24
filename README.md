# STARGATE · Web del proyecto (CCD)

Sitio estático de la gamificación **STARGATE** de la asignatura *Creación de Contenidos,
M-learning y Gamificación en el Aula* (CCD). Pensado para el profesorado y para desplegar en
**Hostinger**.

## Páginas (v2 · 23-ago-2026 · «puesto de mando del profesorado»)
- `index.html` — **Portada** (vídeo en bucle, la misión en 60 s, navegación, visita guiada con el Capitán).
- `guia.html` — **Guía** (narrativa, personajes, Bitácora, retos e insignias, dinamización, FAQ).
- `cronologia.html` — **Cronología**: mapa de 15 semanas + tarjeta por semana (vídeos, retos, insignias, hito, foro para copiar).
- `actividades.html` — **Misiones y evaluación** + documentos oficiales descargables (`assets/docs/`).
- `geniallys.html` — **Geniallys** (carpeta compartida con el profesorado: estándar por perfil, copia para modificar; enlaces públicos en `GENIALLYS` de `_site_data.py`).
- `registro.html` — **Registro y tablero en vivo** por PER (API de Apps Script), avatares evolutivos, ticket/canje en versión docente, guía de instalación.
- `profes.html` · `tickets.html` · `foro.html` · `embed.html` — panel del profesorado (PIN), tickets visual, foro dinámico semanal (`?todos=1` = todos los mensajes para copiar) y generador de enlaces/embeds/QR.
- `recluta.html` — **La Nave del Recluta** (v3.1, 24-ago): la web del alumnado por PER (`?per=<id>`, `&embed=1`): el recluta se identifica con su CORREO una vez por dispositivo (POST `accion=quien`, sin PIN; el correo nunca va en la URL ni se lista) y lo primero que ve es SU personaje (avatar+rango+xp+colección+bio); onboarding con NEBULA, planetas desbloqueados por calendario, foro unidireccional, recompensas con desbloqueo semanal y botón al panel de control Genially del PER. Motor compartido en `assets/js/calendario.js`.
- `apps-script/` — código de la hoja maestra (Code.gs + Dialog.html); copia servida en `assets/descargas/`.
- `grupos.html` — **Grupos** (v3.6): un panel por PER con todos los accesos del docente (tablero, Nave,
  panel del profesorado, tickets, foro, enlaces/embeds) más sus formularios y el panel de control, y un botón
  para copiar el enlace del alumnado. `?per=<id>` resalta uno. La entrada **Grupos** del menú superior
  despliega los PER activos desde cualquier página.
- `recursos.html` — **Sala de recursos** (tablero de 24 insignias, las 20 cartas del álbum, ranking).

Datos editables en `_site_data.py` (cronología, vídeos, Geniallys, **catálogo de cromos**); los textos
del foro se leen de `../FORO_DINAMIZADOR_STARGARTE.md` al construir. Visita guiada en
`assets/js/tour.js` (pasos = array `STEPS`).

### El álbum de cromos — fuente única
`_site_data.py → CROMOS` (20 cartas en 4 series: la Tripulación Cero, los Ecos, la Nave y la Sombra)
es **el único sitio donde se define el álbum**. Al ejecutar `_build_site.py`:
1. se inyecta en `recluta.html` como `window.SG_CROMOS` / `SG_CROMO_SERIES` (lo pinta `assets/js/recluta.js`);
2. se **reescribe** el bloque `var CROMOS` de `apps-script/Code.gs` entre `CROMOS-INICIO` y `CROMOS-FIN`;
3. se copian `Code.gs` y `Dialog.html` a `assets/descargas/*.txt` (lo que se pega en Apps Script).

Los pesos deben sumar 100 (hay un `assert`). Las imágenes de las cartas las genera
`../Retos e Insignias/_work/cartas.py` y las publica aquí `publicar_tarjetas.py` (720×1210).
**No editar `var CROMOS` ni el `.txt` a mano: se pisan en el siguiente build.**

### La lista de grupos (PER)
`doGet ?per=all` **no pide PIN** y devuelve `id/nombre/tipo/estado/inicio` de los PER no archivados.
`window.SG.pers(cb)` (en `stargate.js`) la sirve con **caché de 12 h en localStorage** y revalidación en
segundo plano: la usan el desplegable «Grupos» del menú y `grupos.html`. Como `head()` inyecta
`window.SG_TABLERO_API` en todas las páginas del profesorado, el desplegable funciona en cualquiera.

## Estructura
```
web-stargate/
├── index.html · actividades.html · recursos.html
├── assets/
│   ├── css/stargate.css
│   ├── fonts/ (Unbounded, DM Sans)
│   └── img/insignias · img/tarjetas
├── _build_site.py   (generador; regenera los .html desde los datos)
└── README.md
```
Todas las rutas son **relativas**, así que el sitio funciona igual en la raíz del dominio o en un subdirectorio.

## Editar / regenerar
El HTML se genera con `_build_site.py` (Python 3 + Pillow para los assets). Para cambiar textos,
edita el script y ejecútalo desde esta carpeta:
```bash
python3 _build_site.py
```
También puedes editar los `.html` a mano si es un retoque puntual.

## Incrustar un Genially (en `recursos.html`)
En Genially: **Compartir → Insertar** y copia el enlace. Sustituye un hueco «Próximamente» por:
```html
<div class="responsive-embed">
  <iframe src="https://view.genially.com/TU_ID" allowfullscreen scrolling="no" loading="lazy"></iframe>
</div>
```

## Desplegar en Hostinger
El sitio es estático: basta con subir el **contenido de esta carpeta** a `public_html`.
Ver `DESPLIEGUE.md` para las tres formas (Git de hPanel, Administrador de archivos, o GitHub Actions).

---
Basado en los materiales oficiales de la asignatura. Documento vivo.
