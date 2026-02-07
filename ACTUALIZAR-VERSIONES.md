# 🔄 Guía para Actualizar Versiones (Cache Busting)

## ¿Por qué necesito esto?

Cuando haces cambios a tus archivos CSS o JavaScript, los navegadores guardan las versiones antiguas en caché. Esto hace que **ni tú ni tus visitantes vean los cambios nuevos** hasta que borren el caché del navegador.

La solución es **cambiar el número de versión** cada vez que hagas cambios. Así el navegador piensa que es un archivo nuevo y lo descarga automáticamente.

## 📝 Método Rápido (Recomendado)

Cada vez que hagas cambios a tus archivos CSS o JS:

1. Abre el archivo `update-versions.sh`
2. En la línea 3, cambia el número de versión a la fecha de hoy:
   ```bash
   VERSION="20251109"  # Cambia esto a la fecha actual (AAAAMMDD)
   ```
   
3. Guarda el archivo y ejecuta en la terminal:
   ```bash
   ./update-versions.sh
   ```

Esto actualizará TODOS tus archivos HTML automáticamente.

## 📅 Formato de Versión Recomendado

Usa la fecha de hoy en formato `AAAAMMDD`:
- Hoy (9 nov 2025): `20251109`
- Mañana: `20251110`
- 15 dic 2025: `20251215`

## ✅ Proceso Completo para Actualizar tu Sitio

1. **Haces cambios** a tus archivos CSS/JS
2. **Actualizas la versión** con el script (método rápido de arriba)
3. **Subes a GitHub:**
   ```bash
   git add .
   git commit -m "Actualización de estilos v20251109"
   git push origin main
   ```
4. **Espera 2-3 minutos** para que GitHub Pages actualice
5. **Listo!** Todos verán los cambios automáticamente (sin borrar caché)

## 🎯 Ejemplo de Cómo Funciona

**Antes:**
```html
<link rel="stylesheet" href="css/main.css?v=2024091801">
```

**Después de ejecutar el script:**
```html
<link rel="stylesheet" href="css/main.css?v=20251109">
```

El navegador ve `?v=20251109` como una URL diferente y descarga el archivo nuevo.

## 📁 Archivos que se Actualizan Automáticamente

El script actualiza **TODOS** los archivos HTML en tu proyecto:

**Archivos en la raíz:**
- index.html, standings.html, teams.html
- calendario.html, estadisticas.html, donaciones.html
- noticias.html, partido-live.html, team-profile.html
- Y todos los demás archivos .html en la raíz

**Archivos en carpetas:**
- ULTRA/index.html
- ULTRACANALES/index.html, ULTRACANALES/canales.html
- live-chat/index.html, live-chat/auth.html
- Y cualquier otro archivo .html en subcarpetas

El script busca TODOS los archivos HTML automáticamente, no importa dónde estén.

## ⚡ Método Manual (Si Prefieres)

Si solo cambiaste UN archivo CSS/JS específico, puedes actualizar manualmente:

1. Abre el archivo HTML que usa ese CSS/JS
2. Busca la línea del archivo (ejemplo: `css/main.css?v=20251109`)
3. Cambia el número al final a la fecha de hoy
4. Guarda y sube a GitHub

## 🚨 Importante

**SIEMPRE actualiza la versión cuando cambies:**
- Archivos CSS (estilos)
- Archivos JavaScript (funcionalidad)
- Antes de subir cambios a GitHub Pages

**NO necesitas actualizar versión cuando cambies:**
- Solo contenido HTML (texto, imágenes)
- Archivos JSON de datos
- Configuración del servidor

---

**Última actualización:** 9 de noviembre, 2025
**Versión actual:** v20251109
