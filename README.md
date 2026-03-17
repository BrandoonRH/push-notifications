# 📲 Push Notifications App — React Native con Expo

> 📌 **6.º proyecto del curso _React Native con Expo_ de Fernando Herrera**

Este proyecto corresponde a la **Sección 10 del curso**, donde se implementa un **sistema completo de Push Notifications** utilizando Expo, integrando el dispositivo móvil con un backend personalizado en NestJS.

---

## 🚀 Descripción del proyecto

Push Notifications App es una aplicación móvil que demuestra cómo implementar notificaciones push end-to-end, desde la obtención del token del dispositivo hasta el envío de notificaciones desde un servidor backend.

El proyecto incluye:

- 📱 **App móvil (React Native + Expo)** que recibe notificaciones
- 🖥️ **Backend (NestJS)** que envía notificaciones
- 🔔 Integración con **Expo Push Notification Service**
- 🔥 Configuración de **Firebase Cloud Messaging (FCM)** para Android
- 🍎 Configuración de **APNs** para iOS
- 📊 Historial de notificaciones recibidas
- 🧭 Navegación automática al tocar notificaciones

---

## 🎯 Funcionalidades implementadas

### 📱 En la App Móvil:

- ✅ Solicitud de permisos de notificaciones
- ✅ Generación de Expo Push Token
- ✅ Recepción de notificaciones en tiempo real
- ✅ Historial de notificaciones
- ✅ Navegación basada en el payload de la notificación
- ✅ Manejo de notificaciones cuando la app está:
  - Abierta (foreground)
  - En background
  - Cerrada

### 🖥️ En el Backend:

- ✅ Endpoint para enviar notificaciones
- ✅ Validación de tokens de Expo
- ✅ División automática en chunks (batches de 100)
- ✅ Manejo de errores y tokens inválidos
- ✅ Integración con Expo Server SDK

---

## 🛠️ Tecnologías utilizadas

### Frontend (App móvil):

- **React Native** - Framework móvil
- **Expo** (SDK 52+)
- **expo-notifications** - Manejo de notificaciones
- **expo-device** - Detección de dispositivo físico
- **expo-router** - Navegación
- **TypeScript**

### Backend:

- **NestJS** - Framework de Node.js
- **expo-server-sdk** - SDK oficial de Expo para servidores
- **TypeScript**

### Servicios externos:

- **Expo Push Notification Service** - Ruteo de notificaciones
- **Firebase Cloud Messaging (FCM)** - Para Android
- **Apple Push Notification service (APNs)** - Para iOS

---

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener:

- ✅ Node.js (v18 o superior)
- ✅ npm o yarn
- ✅ Expo CLI: `npm install -g expo-cli`
- ✅ Cuenta de Expo: https://expo.dev
- ✅ **Dispositivo físico** (Android o iOS)
  - ⚠️ Las notificaciones push NO funcionan en emuladores/simuladores
- ✅ Cuenta de Firebase (para Android)
- ✅ Cuenta de Apple Developer (para iOS - opcional)

---

## ⚙️ Configuración inicial

### 1. Firebase (Para Android)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Agrega una app Android
4. Descarga `google-services.json`
5. Coloca el archivo en la raíz del proyecto móvil
6. En Firebase Console:
   - Project Settings → Cloud Messaging
   - Copia el **Server Key** (lo usarás después)

### 2. Expo Project ID

1. Asegúrate de tener un proyecto en [Expo](https://expo.dev)
2. Copia el **Project ID** de tu proyecto
3. Agrégalo en `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "tu-project-id-aqui"
      }
    }
  }
}
```

---

## 🚀 Instalación y ejecución

### Frontend (App móvil)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd push-notifications-app

# 2. Instalar dependencias
npm install

# 3. Iniciar el proyecto
npx expo start

# 4. Escanear el QR code con:
#    - iOS: Cámara nativa
#    - Android: App de Expo Go
```

### Backend (NestJS)

```bash
# 1. Ir a la carpeta del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor
npm run start:dev

# El servidor estará corriendo en http://localhost:3000
```

---

## 📱 Cómo probar las notificaciones

### Método 1: Desde la app móvil (desarrollo)

1. Abre la app en tu dispositivo físico
2. Acepta los permisos de notificaciones
3. Copia el **Expo Push Token** que aparece en pantalla
4. Ve a https://expo.dev/notifications
5. Pega tu token
6. Escribe un título y mensaje
7. Envía la notificación

### Método 2: Desde el backend

1. Obtén tu Expo Push Token de la app
2. Usa Postman o cURL:

```bash
POST http://localhost:3000/push-notifications/send
Content-Type: application/json

{
  "tokens": [
    "ExponentPushToken[tu-token-aqui]"
  ]
}
```

3. La notificación llegará a tu dispositivo

### Método 3: Desde código

En la app, descomenta el botón en `index.tsx`:

```typescript
<Button
  title="Press to Send Notification"
  onPress={async () => {
    await sendPushNotification({
      body: "Body desde mi app",
      title: "Titulo desde la app",
      to: [expoPushToken],
      data: {
        chatId: "chat_123",
      },
    });
  }}
/>
```

---

## 🔧 Configuración avanzada (Producción)

### 1. Expo Access Token (opcional)

Si necesitas enviar más de 600 notificaciones/día:

1. Ve a https://expo.dev/accounts/[tu-cuenta]/settings/access-tokens
2. Crea un nuevo token
3. Agrégalo en tu backend:

```typescript
private readonly expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});
```

### 2. FCM v1 (recomendado)

Para usar la nueva API de Firebase:

```typescript
private readonly expo = new Expo({
  useFcmV1: true,
});
```

Requiere configuración adicional en Firebase Console.

---

## 📂 Estructura del proyecto

### Frontend (App móvil):

```
├── app/
│   ├── _layout.tsx          # Layout raíz
│   └── index.tsx            # Pantalla principal
├── hooks/
│   └── use-push-notifications.ts  # Hook de notificaciones
├── components/
│   └── themed-text.tsx      # Componente de texto
├── app.json                 # Configuración de Expo
└── google-services.json     # Credenciales de Firebase
```

### Backend (NestJS):

```
├── src/
│   ├── push-notifications/
│   │   ├── push-notifications.service.ts   # Lógica de envío
│   │   ├── push-notifications.controller.ts
│   │   └── push-notifications.module.ts
│   └── main.ts
└── package.json
```

---

## 🎓 Conceptos aprendidos

- ✅ Expo Push Notification Service
- ✅ Obtención y validación de Expo Push Tokens
- ✅ Manejo de permisos de notificaciones
- ✅ Listeners de notificaciones (received, response)
- ✅ Navegación basada en payload
- ✅ Configuración de canales en Android
- ✅ Integración backend con expo-server-sdk
- ✅ Chunking de mensajes masivos
- ✅ Manejo de tickets y errores
- ✅ Diferencias entre iOS y Android
- ✅ Testing con dispositivos físicos

---

## ⚠️ Problemas comunes

### No llegan las notificaciones

- ✅ Verifica que estás usando un **dispositivo físico** (no emulador)
- ✅ Revisa que los permisos están otorgados
- ✅ Confirma que el token es válido con `Expo.isExpoPushToken()`
- ✅ Verifica que `google-services.json` esté en la raíz del proyecto
- ✅ Revisa los logs del backend para errores

### Token no se genera

- ✅ Usa un dispositivo físico
- ✅ Verifica que el `projectId` está en `app.json`
- ✅ Acepta los permisos cuando se solicitan

### App no navega al tocar notificación

- ✅ Verifica que el `chatId` está en `data`
- ✅ Revisa que `rootNavigationState.key` existe
- ✅ Agrega logs en el `responseListener`

---

## 📚 Recursos adicionales

- [Documentación oficial de Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Tool de testing de Expo](https://expo.dev/notifications)

---

## ✨ Autor

Proyecto desarrollado como parte del curso
**React Native con Expo — Fernando Herrera**

---

## 📝 Notas finales

- 🔴 **Importante**: Las notificaciones push requieren dispositivo físico
- 📱 Tested en Android e iOS
- 🚀 Listo para escalar con queue systems (Bull/BullMQ)
- 💾 Considera implementar persistencia de tokens en base de datos
- 🔐 En producción, usa HTTPS y variables de entorno

---

🎯 **Objetivo cumplido:** Sistema completo de Push Notifications desde cero con Expo y NestJS.

```

```

```

```
