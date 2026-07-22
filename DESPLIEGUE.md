# Desplegar la web en Hostinger

El sitio es **estático** (HTML + CSS + imágenes + fuentes). No necesita PHP ni base de datos.
Objetivo: que el **contenido de `web-stargate/`** quede en la carpeta `public_html` de tu dominio.

Elige **una** de estas tres formas.

---

## Opción A — Git desde el panel de Hostinger (recomendada)
Despliegas tirando directamente del repositorio de GitHub.

1. En **hPanel** → tu dominio → **Avanzado → GIT**.
2. **Crear un nuevo repositorio**:
   - **Repository:** `https://github.com/MrCuarter/stargate.git` (o la URL SSH si has configurado la clave).
   - **Branch:** `main`.
   - **Directory:** `public_html` (o `public_html/stargate` si lo quieres en un subdominio/carpeta).
3. Pulsa **Crear**. Hostinger clona el repo.
4. Cada vez que actualices GitHub, vuelve a esta pantalla y pulsa **Desplegar (Deploy)** para traer los cambios.
   - *Opcional:* copia la **URL del webhook** que muestra Hostinger y pégala en GitHub → *Settings → Webhooks* para que despliegue solo en cada push.

> ⚠️ Si el repositorio contiene solo esta web (así lo hemos montado), los archivos quedan en la raíz de
> `public_html` y `index.html` será la portada. Perfecto.

---

## Opción B — Administrador de archivos (la más simple, sin Git)
1. Comprime la carpeta: deja `index.html`, `actividades.html`, `recursos.html` y `assets/` dentro de un ZIP
   (que el ZIP **no** tenga una carpeta extra por encima; los `.html` deben quedar en la raíz).
2. hPanel → **Archivos → Administrador de archivos** → entra en `public_html`.
3. **Subir** el ZIP y luego **Extraer** ahí.
4. Comprueba que `public_html/index.html` existe. Visita tu dominio.

Para actualizar: repite subiendo los archivos cambiados.

---

## Opción C — Despliegue automático con GitHub Actions (FTP)
Para que cada push publique solo. Necesitas los datos **FTP** de Hostinger (hPanel → Archivos → Cuentas FTP).

1. En GitHub: *Settings → Secrets and variables → Actions* y crea:
   `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
2. Crea el archivo `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Hostinger
on:
  push: { branches: [ main ] }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: FTP Deploy
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./            # raíz del repo (esta carpeta)
          server-dir: public_html/ # destino en Hostinger
          exclude: |
            **/.git*
            **/.git*/**
            **/*.md
            _build_site.py
```
3. Haz push. En *Actions* verás el despliegue.

---

## Comprobaciones tras desplegar
- La portada carga con la tipografía **Unbounded** (títulos) → señal de que `assets/fonts/` se sirve bien.
- Las **insignias** se ven en «Personajes» y en la Sala de recursos → `assets/img/` correcto.
- Navegación entre **Guía / Actividades / Sala de recursos** funciona.
- Si algo sale sin estilos: revisa que la carpeta `assets/` se subió completa y que las rutas son
  `assets/...` (relativas). No hace falta tocar nada más.
