# Guía de Notificaciones de UltraGol

## 🔔 Sistema de Notificaciones Mejorado

He corregido el error "Error al mostrar selector de equipos" y mejorado todo el sistema de notificaciones con mejor manejo de errores y validación.

## ✅ Mejoras Implementadas

### 1. **Compatibilidad con Service Workers (CRÍTICO - Móviles)**
- **Detección automática**: El sistema detecta si hay un Service Worker activo
- **Método correcto según plataforma**:
  - Con Service Worker (móviles): Usa `registration.showNotification()`
  - Sin Service Worker (desktop): Usa `new Notification()`
- **Limpieza de datos**: Las funciones se separan de los datos clonables antes de enviar al SW
- **Clicks funcionan**: El Service Worker maneja los clicks correctamente:
  - Enfoca ventana existente si está abierta
  - Navega a la URL correcta
  - Abre nueva ventana si es necesario
- **Normalización de URLs**: Convierte URLs relativas a absolutas para comparación correcta

### 2. **Mejor Manejo de Errores**
- Validación del DOM antes de crear modales
- Try-catch anidados para prevenir fallos
- Mensajes de error claros para el usuario
- Fallback a alertas si los toasts fallan

### 3. **Carga de Equipos Robusta**
- Timeout de 5 segundos para la API
- Múltiples intentos de fallback:
  1. API externa (`https://ultragol-api-3-six.vercel.app/Equipos`)
  2. Archivo local (`/data/teams.json`)
  3. Archivo local alternativo (`./data/teams.json`)
- Validación de estructura de datos

### 4. **Test de Notificaciones Mejorado**
- La página `test-notifications.html` ahora carga dinámicamente el NotificationManager
- Compatible con Service Workers
- Mejores diagnósticos y logs
- Fácil de usar para pruebas

## 📱 Cómo Probar las Notificaciones

> **⚠️ Importante:** Las notificaciones del navegador requieren HTTPS. Asegúrate de usar tu dominio de Replit (`.dev`) en lugar de `localhost`.

### Opción 1: Página de Pruebas (Recomendado)

1. **Abre la página de pruebas:**
   - Ve a: `https://[tu-dominio-replit].dev/test-notifications.html`

2. **Sigue los pasos en orden:**
   - Click en "1. Solicitar Permiso de Notificaciones"
   - Acepta el permiso en tu navegador
   - Click en "2. Enviar Notificación de Prueba" para verificar que funciona
   - Click en "3. Obtener Notificaciones de la API" para ver notificaciones reales
   - Click en "4. Mostrar Selector de Equipos" para elegir tu equipo favorito

3. **Verifica en el log:**
   - Todas las acciones se registran en el panel negro de logs
   - Busca mensajes con ✅ (éxito) o ❌ (error)

### Opción 2: Página Principal

1. **Abre la página principal:**
   - Ve a: `https://[tu-dominio-replit].dev/`

2. **Espera 3 segundos:**
   - Automáticamente aparecerá un modal pidiendo activar notificaciones

3. **Activa las notificaciones:**
   - Click en "Activar"
   - Acepta el permiso del navegador
   - Selecciona tu equipo favorito

4. **Recibirás notificaciones:**
   - El sistema revisará cada 60 segundos si hay nuevas notificaciones
   - Solo recibirás notificaciones de tu equipo seleccionado

## 🛠️ Funciones de Consola (Debugging)

Abre la consola del navegador (F12) y prueba estos comandos:

```javascript
// Ver el estado del sistema de notificaciones
estadoNotificaciones()

// Activar notificaciones manualmente
activarNotificaciones()

// Mostrar el selector de equipos
elegirEquipo()

// Limpiar toda la configuración (reset completo)
limpiarNotificaciones()
```

## 🔧 Solución de Problemas

### ❌ "Error al mostrar selector de equipos"

**Causas posibles:**
- La API de equipos está lenta o no responde
- Problemas de conexión a internet
- Font Awesome no se cargó completamente

**Solución:**
1. Espera unos segundos y vuelve a intentar
2. Recarga la página (Ctrl+F5 o Cmd+Shift+R)
3. Verifica tu conexión a internet
4. Usa la página de pruebas para ver logs detallados

### ⚠️ "Las notificaciones no aparecen"

**Verifica:**
1. ¿Diste permiso de notificaciones?
   - Revisa el ícono de la barra de direcciones
   - En Android: Configuración → Aplicaciones → Chrome → Permisos → Notificaciones

2. ¿Seleccionaste un equipo?
   - Ejecuta `estadoNotificaciones()` en la consola
   - Debe mostrar tu equipo favorito

3. ¿Hay notificaciones disponibles?
   - Prueba el botón "3. Obtener Notificaciones de la API" en test-notifications.html
   - Debe mostrar cuántas notificaciones hay

### 🚫 "Bloqueé las notificaciones por accidente"

**Cómo restablecer permisos:**

**En Chrome (Desktop):**
1. Click en el ícono de candado/información en la barra de direcciones
2. Busca "Notificaciones"
3. Cambia de "Bloqueadas" a "Permitir"
4. Recarga la página

**En Chrome (Android):**
1. Abre el menú (⋮) → Configuración
2. Configuración del sitio → Notificaciones
3. Busca tu dominio de Replit
4. Activa las notificaciones
5. Recarga la página

**En Safari (iOS):**
1. Configuración → Safari → Sitios web
2. Notificaciones
3. Busca tu dominio y permite notificaciones

**En Firefox:**
1. Click en el ícono de candado → Conexión segura
2. Más información → Permisos
3. Notificaciones → Cambiar a "Permitir"

### 🔕 "No quiero notificaciones"

**Opción 1: Desde la Consola (Rápido)**
```javascript
limpiarNotificaciones()
```
Luego recarga la página.

**Opción 2: Sin usar la Consola**
1. Ve a `test-notifications.html`
2. Click en "🗑️ Limpiar LocalStorage y Reiniciar"
3. El sistema limpiará todo y recargará la página

**Opción 3: Desde el Navegador**
1. Bloquea las notificaciones desde el ícono de la barra de direcciones
2. Recarga la página
3. El sistema no volverá a preguntar

## 📊 Verificar que Todo Funciona

**Lista de verificación:**
- ✅ El modal de permisos aparece después de 3 segundos
- ✅ El selector de equipos muestra todos los equipos de Liga MX
- ✅ Puedes seleccionar un equipo
- ✅ Recibes una notificación de bienvenida
- ✅ Las notificaciones de prueba funcionan
- ✅ Los mensajes toast aparecen cuando hay errores o confirmaciones

## 🎯 Características del Sistema

- **Notificaciones en Tiempo Real:** Verifica cada 60 segundos
- **Solo Tu Equipo:** Filtra notificaciones relevantes
- **Persistente:** Guarda tu configuración en localStorage
- **Resiliente:** Múltiples fallbacks si la API falla
- **Multiplataforma:** Funciona en desktop, móvil y tablet

## 📝 Notas Técnicas

- **API:** Se conecta a `https://ultragol-api-3-six.vercel.app/notificaciones/ligamx`
- **Polling:** Intervalo de 60 segundos
- **LocalStorage:** Guarda `selectedTeam`, `notificationPermission`, `lastNotificationId`, `notificationModalShown`
- **Timeout:** 5 segundos para cada solicitud a la API
- **Fallback:** Usa datos locales si la API falla

---

¿Necesitas ayuda? Abre la consola del navegador y ejecuta `estadoNotificaciones()` para ver el estado completo del sistema.
