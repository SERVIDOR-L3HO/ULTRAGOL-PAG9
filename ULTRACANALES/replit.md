# ULTRACANALES - Portal de Transmisiones en Vivo

## Descripción General
ULTRACANALES es una página web estática moderna y creativa para ver canales de televisión en vivo. El proyecto presenta un diseño futurista con animaciones espectaculares, efectos de brillo, y un reproductor integrado para transmisiones deportivas.

## Estado Actual
✅ **Completamente funcional** - La aplicación está lista para usar
- Servidor HTTP corriendo en puerto 5000
- Todos los canales cargados desde JSON
- Reproductor de video integrado y funcionando
- Sin errores en consola del navegador

## Estructura del Proyecto

```
/
├── index.html                              # Página principal
├── canales.html                            # Página de todos los canales
├── style.css                               # Estilos compartidos
├── canales-style.css                       # Estilos específicos de página canales
├── script.js                               # Lógica de la página principal
├── canales-script.js                       # Lógica de la página canales
├── firebase-config.js                      # Configuración de Firebase Auth
└── attached_assets/
    ├── channels_1760214639614.json         # Datos de canales deportivos
    ├── ultracanales (1)_1760216153008.json # Más canales (mexicanos e internacionales)
    ├── 297938-removebg-preview_1760222866015.png # Nuevo logo ULTRACANALES
    └── logos/                              # Logos oficiales de canales
        ├── tyc-sports.jpg
        ├── espn-premium.jpg
        ├── dsports.jpg
        ├── tudn.jpg
        ├── fox-sports-premium.jpg
        └── ... (20+ logos)
```

## Características Principales

### Diseño Visual
- **Nuevo logo**: Logo ULTRACANALES con balón de fútbol y rayo naranja
- **Buscador central**: Barra de búsqueda prominente en el header
- **Botón de inicio de sesión**: Botón verde estilo Google con icono
- **Indicador EN VIVO**: Badge pulsante en la esquina superior derecha
- **Tarjetas de canales**: Efectos hover con elevación y brillo
- **Animaciones suaves**: Transiciones y efectos de entrada

### Funcionalidades
- **Autenticación Firebase**: Inicio de sesión con Google
- **Búsqueda en tiempo real**: Filtrado de canales mientras escribes
- **Navegación multi-página**: Página principal y página de todos los canales
- **Filtros por categoría**: En página de canales (México, Fox Sports, ESPN, DAZN, Sudamérica, Entretenimiento, Infantiles, Cultura, Noticias, Otros)
- **Vista en cuadrícula**: Diseño de tarjetas moderno en página de canales
- **Compartir canales con Deep Links**: 
  - Botón de compartir que genera links únicos por canal
  - Deep linking automático - al abrir link compartido se abre ese canal específico
  - Web Share API para dispositivos móviles
  - Copia automática al portapapeles como fallback
  - Meta tags Open Graph estáticos (nota: para meta tags dinámicos por canal se requeriría server-side rendering)
- Carga dinámica de canales desde JSON
- Categorización de canales por proveedor
- Reproductor de video con iframe integrado
- Selector de fuentes múltiples por canal
- Diseño responsive para móviles

### Categorías de Canales (288 canales totales en 27 categorías)

**Canales Deportivos Latinoamérica:**
- 🇲🇽 Canales Mexicanos (6 canales)
- 🦊 Fox Sports (7 canales)
- 🏁 DAZN (2 canales)
- ⚽ La Liga (2 canales)
- 📡 DirectTV Sports (3 canales)
- 🎯 ESPN México (5 canales)
- 🌎 ESPN Internacional (7 canales)
- ⭐ ESPN Premium (1 canal)
- 🌎 Sudamérica (9 canales)
- 🏀 Otros Deportes (1 canal)

**Canales Internacionales:**
- 🇫🇷 Canales Francia (50 canales)
- 🇪🇸 Canales España (18 canales)
- 🇺🇸 Canales USA (3 canales)
- 🇦🇷 Canales Argentina (6 canales)
- 📺 ESPN & DirectTV LATAM (3 canales)
- 🇩🇪 Canales Alemania (14 canales)
- 🇬🇧 Canales UK (10 canales)
- 🇮🇹 Canales Italia (4 canales)
- 🇵🇹 Canales Portugal (4 canales)
- 🇬🇷 Canales Grecia (3 canales)
- 🇧🇪 Canales Bélgica (2 canales)
- ⚡ Canales Extra (46 canales)

**Entretenimiento y Otros:**
- 🎬 Entretenimiento (26 canales)
- 👶 Canales Infantiles (7 canales)
- 📚 Cultura y Documentales (13 canales)
- 📰 Noticias (19 canales)
- 📺 Otros Canales (17 canales)

## Tecnologías Utilizadas
- **HTML5** - Estructura semántica
- **CSS3** - Animaciones y efectos visuales
- **JavaScript ES6 Modules** - Módulos nativos del navegador
- **Firebase Authentication** - Autenticación con Google
- **Python HTTP Server** - Servidor estático

## Cómo Funciona

### Flujo de Usuario
1. El usuario ve las categorías de canales organizadas
2. Al hacer clic en un canal, se abre el reproductor
3. Puede seleccionar entre múltiples fuentes del canal
4. El video se reproduce en iframe fullscreen
5. Botón X para cerrar el reproductor

### Arquitectura
- Los datos de canales se cargan desde `channels_1760214639614.json`
- El JavaScript genera dinámicamente las tarjetas de canales
- Cada canal puede tener múltiples fuentes (fallback)
- El reproductor usa iframes para embed de streams

## Cambios Recientes
- **18 Oct 2025 - Expansión Internacional de Canales**:
  - ✅ **166 canales nuevos agregados**: Expansión de 122 a 288 canales totales en 27 categorías
  - ✅ **12 nuevas categorías internacionales agregadas**:
    - 🇫🇷 Canales Francia (50 canales) - beIN, Canal+, Eurosport, RMC Sport, C+Live
    - 🇪🇸 Canales España (18 canales) - Movistar LaLiga, DAZN España, M+ Deportes
    - 🇺🇸 Canales USA (3 canales) - TUDN USA, beIN Español, FOX Deportes
    - 🇦🇷 Canales Argentina (6 canales) - TNT Sport, FOX Sports Argentina
    - 📺 ESPN & DirectTV LATAM (3 canales) - Cobertura regional
    - 🇩🇪 Canales Alemania (14 canales) - Bundesliga, Sky Sports Alemania, DAZN
    - 🇬🇧 Canales UK (10 canales) - Sky Sports, TNT Sport UK, Premier League
    - 🇮🇹 Canales Italia (4 canales) - DAZN Italia, Sky Calcio
    - 🇵🇹 Canales Portugal (4 canales) - Sport TV, BTV
    - 🇬🇷 Canales Grecia (3 canales) - Greek Sports
    - 🇧🇪 Canales Bélgica (2 canales) - Canales belgas
    - ⚡ Canales Extra (46 canales) - Eventos deportivos especiales
  - ✅ **Sistema de fuentes dual implementado**:
    - "Opción 1": Nueva fuente principal con servidor rereyano.ru
    - "OPCIÓN OFICIAL": Fuentes originales como respaldo
  - ✅ **Script de procesamiento automático**: Herramienta Python (process_channels.py) para agregar canales masivamente
  - ✅ **Organización mejorada**: Canales agrupados por región geográfica y tipo de contenido

- **17 Oct 2025 - Expansión Masiva de Canales**:
  - ✅ **82 canales nuevos agregados**: Expansión de 40 a 122 canales totales
  - ✅ **5 nuevas categorías**:
    - 🎬 Entretenimiento (26 canales) - Películas y series
    - 👶 Infantiles (7 canales) - Contenido para niños
    - 📚 Cultura (13 canales) - Documentales y educación
    - 📰 Noticias (19 canales) - Canales informativos internacionales
    - 📺 Otros (17 canales) - Contenido variado
  - ✅ **81 logos nuevos**: Imágenes oficiales para todos los canales nuevos
  - ✅ **Sistema de logos automático**: Detección y fallback inteligente de imágenes
  - ✅ **Filtros actualizados**: Botones para todas las categorías en página de canales
  - ✅ **Sin duplicados**: Sistema inteligente detectó y evitó 39 canales duplicados

- **12 Oct 2025 - Sistema de Compartir y Deep Links**:
  - ✅ **Funcionalidad de compartir**: Botón que genera links únicos para cada canal
  - ✅ **Deep linking**: Al abrir un link compartido (ej: `?channel=espn-mexico`) se abre ese canal automáticamente
  - ✅ **Web Share API**: Integración nativa en móviles para compartir por WhatsApp, redes sociales, etc.
  - ✅ **Fallback a portapapeles**: Si Web Share no está disponible, copia el link automáticamente
  - ✅ **Notificación visual**: Mensaje animado confirmando que el link fue copiado
  - ✅ **Meta tags Open Graph**: Configurados para vista previa en redes sociales (genéricos debido a limitaciones de servidor estático)
  - ✅ **Reorganización de fuentes**: 
    - Azteca 7, Canal 5, Las Estrellas, TV Pública: fuente 6 (stream2.php target=3) movida a fuente 1
    - Todos los demás canales: fuente 3 (stream.php target=3) movida a fuente 1

- **12 Oct 2025 - Actualización UX Hero Banner**:
  - ✅ **Banner Hero "El Fútbol Respira Aquí"**: Banner animado debajo del buscador en ambas páginas
  - ✅ **Transiciones profesionales**: Banner se oculta suavemente al abrir el reproductor
  - ✅ **Auto-restauración**: Banner reaparece al cerrar el reproductor
  - ✅ **Botón "MÁS CANALES"**: Reemplazó al botón "TyC Sports" con diseño llamativo naranja pulsante
  - ✅ **Buscador reubicado**: Movido debajo del header en ambas páginas
  - ✅ **Botón "Todos los Canales" removido**: Eliminado del header para simplificar navegación

- **11 Oct 2025 - Actualización Mayor v2**:
  - ✅ **Header responsive completo**: Diseño adaptado para móviles
  - ✅ **Botón "Todos los Canales"**: Agregado en header superior
  - ✅ **Botón de búsqueda móvil**: Ícono de búsqueda en vista móvil
  - ✅ **Sección "Más Canales" eliminada**: Centralizado en página de canales
  - ✅ **Estilos responsive optimizados**: Media queries para móvil perfeccionadas
  
- **11 Oct 2025 - Actualización Mayor**:
  - ✅ **Nuevo logo ULTRACANALES**: Logo con balón y rayo naranja
  - ✅ **Autenticación Firebase**: Inicio de sesión con Google integrado
  - ✅ **Botón verde de inicio de sesión**: Estilo moderno con icono de Google
  - ✅ **Buscador funcional**: Búsqueda en tiempo real de canales
  - ✅ **Nueva página de canales**: Vista en cuadrícula con diseño moderno
  - ✅ **Filtros por categoría**: México, Fox Sports, ESPN, DAZN, Sudamérica
  - ✅ **Navegación mejorada**: Sistema multi-página (index.html y canales.html)
  - ✅ **Header rediseñado**: Sin menú hamburguesa, buscador central
  - ✅ **Módulos ES6**: Código organizado en módulos JavaScript
  
- **11 Oct 2025 - Versión Inicial**:
  - Diseño completo de UI estilo DAZN (negro, blanco, naranja)
  - Integración de todos los canales deportivos
  - Implementación de reproductor multi-fuente
  - Rediseño completo con colores profesionales
  - Agregada sección "Más Canales" con canales mexicanos e internacionales
  - Carga de 2 archivos JSON para separar contenidos
  - **Logos reales integrados**: 20+ logos oficiales de canales
  - Sistema de mapeo de logos a canales
  - Fix de renderizado de backgrounds con CSS puro

## Configuración del Servidor

### Workflow Actual
```bash
python3 -m http.server 5000
```

Este servidor simple sirve archivos estáticos en el puerto 5000, que es el único puerto no bloqueado por firewall en Replit.

## Mantenimiento

### Para Agregar Nuevos Canales
1. Editar `attached_assets/channels_1760214639614.json`
2. Agregar canal en la categoría correspondiente o crear nueva categoría
3. Formato requerido:
```json
{
  "id": "canal-id",
  "name": "Nombre del Canal",
  "sources": ["url1", "url2"],
  "live": true
}
```

### Para Modificar Estilos
- Colores principales en `:root` de `style.css`
- Animaciones personalizables con `@keyframes`
- Diseño responsive en media queries al final del CSS

## Notas Técnicas
- Cache-Control configurado automáticamente por Python HTTP server
- Todos los archivos cargan correctamente (status 200/304)
- Sin errores de JavaScript en consola del navegador
- Diseño mobile-first con breakpoint en 768px

---

**Fecha de última actualización**: 12 de Octubre, 2025
