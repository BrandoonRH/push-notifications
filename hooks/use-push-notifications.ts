// 📲 CUSTOM HOOK PARA MANEJO DE PUSH NOTIFICATIONS CON EXPO
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router, useRootNavigationState } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

// ⚙️ CONFIGURACIÓN GLOBAL: Cómo manejar notificaciones cuando llegan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true, // 🔊 Reproducir sonido
    shouldSetBadge: true, // 🔴 Mostrar badge (número en ícono)
    shouldShowBanner: true, // 📢 Mostrar banner superior
    shouldShowList: true, // 📋 Agregar a lista de notificaciones
  }),
});

// 📋 Interface para opciones de envío de notificaciones
interface SendPushOptions {
  to: string[]; // 🎯 Array de tokens de destino
  title: string; // 🏷️ Título de la notificación
  body: string; // 📝 Cuerpo del mensaje
  data?: Record<string, any>; // 📦 Datos extra (opcional)
}

// 📤 FUNCIÓN: Envía push notification usando API de Expo
async function sendPushNotification(options: SendPushOptions) {
  const { to, title, body, data } = options;

  // 📦 Estructura del mensaje según formato de Expo
  const message = {
    to: to, // 🎯 Destinatarios (tokens)
    sound: "default", // 🔊 Sonido por defecto
    title: title, // 🏷️ Título
    body: body, // 📝 Mensaje
    data: data, // 📦 Datos custom (ej: chatId)
  };

  // 🌐 Envía POST a la API de Expo Push Notifications
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

// ⚠️ FUNCIÓN: Maneja errores de registro
function handleRegistrationError(errorMessage: string) {
  alert(errorMessage); // 🚨 Muestra alerta al usuario
  throw new Error(errorMessage);
}

// 🔐 FUNCIÓN: Registra el dispositivo y obtiene el Expo Push Token
async function registerForPushNotificationsAsync() {
  // 🤖 ANDROID: Configurar canal de notificaciones
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX, // 🔔 Importancia máxima
      vibrationPattern: [0, 250, 250, 250], // 📳 Patrón de vibración
      lightColor: "#FF231F7C", // 💡 Color de LED
    });
  }

  // 📱 Verifica que sea dispositivo REAL (no emulador)
  if (Device.isDevice) {
    // 🔍 1. Verifica permisos existentes
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // ❌ Si no tiene permiso, solicita al usuario
    if (existingStatus !== "granted") {
      //! 💡 Aquí podrías mostrar un mensaje explicativo antes del prompt
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 🚫 Si el usuario rechaza, lanza error
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!",
      );
      return;
    }

    // 🔑 Obtiene el Project ID de la configuración de Expo
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }

    try {
      // 🎫 OBTIENE EL EXPO PUSH TOKEN (el ID único del dispositivo)
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      // 📊 Log del token (útil para testing)
      console.log({ [Platform.OS]: pushTokenString });
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    // ⚠️ Los emuladores NO soportan push notifications reales
    handleRegistrationError("Must use physical device for push notifications");
  }
}

// 🎣 CUSTOM HOOK PRINCIPAL
export const usePushNotifications = () => {
  // 📍 Estado: chatId pendiente (cuando se toca una notificación)
  const [pendingChatId, setPendingChatId] = useState<string | null>("");

  // 🧭 Estado de navegación (para saber cuándo está listo el router)
  const rootNavigationState = useRootNavigationState();

  // 🎫 Estado: Token de Expo Push
  const [expoPushToken, setExpoPushToken] = useState("");

  // 📬 Estado: Historial de notificaciones recibidas
  const [notifications, setNotifications] = useState<
    Notifications.Notification[]
  >([]);

  // 🔄 EFECTO 1: Registra el dispositivo al montar el hook
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ""))
      .catch((error: any) => setExpoPushToken(`${error}`));
  }, []);

  // 🔄 EFECTO 2: Configura listeners de notificaciones
  useEffect(() => {
    // 📨 LISTENER 1: Cuando LLEGA una notificación (app abierta)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        /*  
        💡 Opción comentada: Navegar automáticamente al recibir
        const chatId = notification.request.content.data?.chatId;
        if (chatId) {
          router.push(`/chat/${chatId}`);
        } 
        */

        // 📋 Agrega la notificación al historial
        setNotifications((prev) => [notification, ...prev]);
      },
    );

    // 👆 LISTENER 2: Cuando el usuario TOCA una notificación
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);

        // 📦 Extrae datos custom de la notificación
        const chatId = response.notification.request.content.data?.chatId;

        /*  
        💡 Opción comentada: Navegar inmediatamente
        if (chatId) {
          router.push(`/chat/${chatId}`);
        } 
        */

        // 📍 Guarda el chatId para navegar después (cuando el router esté listo)
        if (typeof chatId === "string" && chatId.length > 0) {
          setPendingChatId(chatId);
        }
      });

    // 🚀 MANEJO: Notificación inicial (app cerrada → abierta por notificación)
    const handleInitialNotificationResponse = () => {
      const response = Notifications.getLastNotificationResponse();

      const chatId = response?.notification?.request?.content?.data?.chatId;
      if (typeof chatId === "string" && chatId.length > 0) {
        setPendingChatId(chatId);
      }
    };

    handleInitialNotificationResponse();

    // 🧹 Cleanup: Remueve listeners al desmontar
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // 🔄 EFECTO 3: Navega a chat cuando el router está listo y hay chatId pendiente
  useEffect(() => {
    if (!rootNavigationState.key) return; // ⏳ Router no está listo
    if (!pendingChatId) return; // 🚫 No hay navegación pendiente

    // 🧭 Navega al chat
    router.push(`/chat/${pendingChatId}`);

    // 🧹 Limpia el estado
    setPendingChatId(null);
  }, [pendingChatId, rootNavigationState?.key]);

  // 📤 Retorna props y métodos para usar en componentes
  return {
    // Props
    expoPushToken, // 🎫 Token del dispositivo
    notifications, // 📬 Historial de notificaciones

    // Methods
    sendPushNotification, // 📤 Función para enviar notificaciones
  };
};

/* 
📲 EXPLICACIÓN DETALLADA DEL SISTEMA DE PUSH NOTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 ARQUITECTURA DEL SISTEMA:

┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO COMPLETO                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. TU BACKEND (NestJS)                                            │
│     │                                                               │
│     │ POST /send-notification                                      │
│     │ body: { token, title, body, data }                           │
│     ↓                                                               │
│                                                                     │
│  2. EXPO PUSH NOTIFICATION SERVICE                                 │
│     https://exp.host/--/api/v2/push/send                          │
│     │                                                               │
│     │ Procesa y rutea según plataforma:                           │
│     ├─→ iOS → APNs (Apple Push Notification service)              │
│     └─→ Android → FCM (Firebase Cloud Messaging)                  │
│     ↓                                                               │
│                                                                     │
│  3. APNs / FCM                                                     │
│     │                                                               │
│     │ Servicios nativos de Apple/Google                           │
│     ↓                                                               │
│                                                                     │
│  4. DISPOSITIVO DEL USUARIO                                        │
│     │                                                               │
│     │ App recibe la notificación                                  │
│     │ Listeners reaccionan                                         │
│     └─→ Actualiza UI / Navega a pantalla                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


🔑 EXPO PUSH TOKEN:

Es un identificador ÚNICO del dispositivo que permite enviarle notificaciones.

Formato: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

Ejemplo: ExponentPushToken[I22V7M...]

Se genera cuando:
1. El usuario acepta permisos de notificaciones
2. Llamas a Notifications.getExpoPushTokenAsync()
3. El dispositivo se registra con los servicios de Expo


📱 DIFERENCIAS POR PLATAFORMA:

┌──────────────────┬───────────────────┬────────────────────────┐
│ Aspecto          │ iOS (APNs)        │ Android (FCM)          │
├──────────────────┼───────────────────┼────────────────────────┤
│ Permisos         │ Prompt obligatorio│ Permitidas por defecto │
│ Canales          │ No existen        │ Obligatorios (API 26+) │
│ Sonidos          │ Configurables     │ Por canal              │
│ Badges           │ Sí                │ Sí                     │
│ Vibración        │ No configurable   │ Por canal              │
│ Importancia      │ No aplicable      │ 5 niveles              │
│ Credenciales     │ .p8 key de Apple  │ google-services.json   │
└──────────────────┴───────────────────┴────────────────────────┘


🎯 ESTADOS DE LA NOTIFICACIÓN:

1️⃣ RECIBIDA (app abierta):
   - notificationListener se ejecuta
   - Se agrega al array de notifications
   - Opcional: mostrar in-app notification

2️⃣ TOCADA (app abierta o en background):
   - responseListener se ejecuta
   - Extrae data.chatId
   - Navega a la pantalla correspondiente

3️⃣ APP CERRADA → ABIERTA POR NOTIFICACIÓN:
   - getLastNotificationResponse() retorna la notificación
   - Extrae data.chatId
   - Espera que el router esté listo
   - Navega automáticamente


🔄 FLUJO DE NAVEGACIÓN:

┌──────────────────────────────────────────────────────────────┐
│ PROBLEMA: ¿Por qué no navegar inmediatamente?               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Si la app está cerrada y se abre por una notificación:     │
│                                                              │
│ 1. App se inicia                                            │
│ 2. Listeners se registran                                   │
│ 3. getLastNotificationResponse() detecta notificación       │
│ 4. Intenta router.push() → ❌ ROUTER NO ESTÁ LISTO          │
│                                                              │
│ SOLUCIÓN:                                                    │
│ - Guardar chatId en pendingChatId                          │
│ - Esperar a que rootNavigationState.key exista             │
│ - Entonces hacer router.push()                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘


📤 ENVÍO DE NOTIFICACIONES:

Método 1: Desde la app (testing)
```typescript
await sendPushNotification({
  to: [expoPushToken],
  title: "Nuevo mensaje",
  body: "Tienes un mensaje de Juan",
  data: { chatId: "chat_123" }
})
```

Método 2: Desde Expo Dev Tools
https://expo.dev/notifications
- Pegas tu token
- Escribes título y mensaje
- Envías

Método 3: Desde tu backend
```typescript
// NestJS endpoint
@Post('send-notification')
async sendNotification(@Body() body) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: body.token,
      title: body.title,
      body: body.message,
      data: body.data
    })
  })
}
```


⚙️ CONFIGURACIÓN REQUERIDA:

1️⃣ app.json / app.config.js:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    }
  }
}
```

2️⃣ Firebase Console (Android):
- Crear proyecto
- Agregar app Android
- Descargar google-services.json
- Agregar a la raíz del proyecto

3️⃣ Apple Developer (iOS):
- Crear App ID
- Habilitar Push Notifications
- Crear .p8 key
- Configurar en Expo


🔐 PERMISOS:

iOS:
```typescript
const { status } = await Notifications.requestPermissionsAsync()
// status: 'granted' | 'denied' | 'undetermined'
```

Android (API 33+):
Requiere permiso en runtime desde Android 13:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```


📦 DATA PAYLOAD:

La propiedad `data` puede contener cualquier JSON:
```typescript
data: {
  chatId: "chat_123",
  userId: "user_456",
  action: "open_chat",
  timestamp: Date.now(),
  customField: "whatever"
}
```

Acceso en listeners:
```typescript
const data = notification.request.content.data
const chatId = data?.chatId
```


🎨 CANALES DE ANDROID:

Desde Android 8.0 (API 26), las notificaciones DEBEN usar canales:
```typescript
await Notifications.setNotificationChannelAsync('chat-messages', {
  name: 'Mensajes de chat',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
  sound: 'message.wav'
})
```

Luego al enviar:
```typescript
android: {
  channelId: 'chat-messages'
}
```


🔔 NOTIFICATION HANDLER:

Define comportamiento global:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // Mostrar alert/banner
    shouldPlaySound: true,       // Reproducir sonido
    shouldSetBadge: true,        // Actualizar badge
    shouldShowBanner: true,      // Banner superior (iOS)
    shouldShowList: true,        // Agregar a centro notif.
  }),
})
```


⚠️ LIMITACIONES:

1. Emuladores:
   - iOS Simulator: ❌ NO funciona
   - Android Emulator: ⚠️ Funciona parcialmente
   - Dispositivo físico: ✅ Requerido

2. Desarrollo:
   - Expo Go: ✅ Funciona
   - Development build: ✅ Funciona
   - Production: ✅ Funciona

3. Frecuencia:
   - Expo limita a ~100 notificaciones/segundo
   - Para producción usar FCM/APNs directamente


🐛 DEBUGGING:

1. Token no se genera:
   - Verificar permisos
   - Verificar projectId en app.json
   - Usar dispositivo real

2. Notificaciones no llegan:
   - Verificar token correcto
   - Revisar logs de Expo Push Service
   - Verificar credenciales FCM/APNs

3. App no navega al tocar:
   - Verificar data.chatId existe
   - Log de responseListener
   - Verificar rootNavigationState.key


💡 BUENAS PRÁCTICAS:

✅ Guardar tokens en tu backend con userId
✅ Implementar lógica de retry en envío
✅ Manejar tokens expirados (actualizar)
✅ Usar canales específicos por tipo de notificación
✅ No enviar notificaciones sensibles sin cifrado
✅ Respetar preferencias del usuario (silenciar)
✅ Testing exhaustivo en dispositivos reales
✅ Implementar analytics de interacción


🔗 INTEGRACIÓN CON BACKEND:

Tu backend debe:
1. Almacenar expoPushToken por usuario
2. Endpoint para enviar notificaciones
3. Queue system para envío masivo
4. Logging de éxitos/fallos
5. Manejo de tokens inválidos


📊 RESUMEN:

┌────────────────────────────────────────────────────────────┐
│ PASOS PRINCIPALES:                                         │
├────────────────────────────────────────────────────────────┤
│ 1. Solicitar permisos                                      │
│ 2. Obtener Expo Push Token                                │
│ 3. Enviar token a tu backend                              │
│ 4. Configurar listeners                                    │
│ 5. Manejar notificaciones recibidas                       │
│ 6. Navegar según data payload                             │
│ 7. Backend envía a Expo Push Service                      │
│ 8. Expo rutea a APNs/FCM                                  │
│ 9. Usuario recibe notificación                            │
└────────────────────────────────────────────────────────────┘

¡Sistema completo de Push Notifications con Expo! 📲✨
*/
