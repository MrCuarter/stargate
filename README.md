# STARGATE · Web del proyecto (CCD)

Sitio estático de la gamificación **STARGATE** de la asignatura *Creación de Contenidos,
M-learning y Gamificación en el Aula* (CCD). Pensado para el profesorado y para desplegar en
**Hostinger**.

## Páginas
- `index.html` — **Guía para el profesorado** (narrativa, personajes, retos e insignias, dinamización).
- `actividades.html` — **Actividades y evaluación** (Actividad 1, Actividad 2, ePortfolio, evaluación y examen).
- `recursos.html` — **Sala de recursos** (presentaciones de Genially, clasificación de puntos, tablero de insignias). *Parcialmente en construcción.*

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
