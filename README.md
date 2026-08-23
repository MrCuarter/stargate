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
- `apps-script/` — código de la hoja maestra (Code.gs + Dialog.html); copia servida en `assets/descargas/`.
- `recursos.html` — **Sala de recursos** (tablero de 24 insignias, cartas, ranking).

Datos editables en `_site_data.py` (cronología, vídeos, Geniallys); los textos del foro se leen de
`../FORO_DINAMIZADOR_STARGARTE.md` al construir. Visita guiada en `assets/js/tour.js` (pasos = array `STEPS`).

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
