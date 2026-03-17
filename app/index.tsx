import { ThemedText } from "@/components/themed-text";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { FlatList, View } from "react-native";

export default function App() {
  const { expoPushToken, notifications, sendPushNotification } =
    usePushNotifications();
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "space-around" }}
    >
      <ThemedText>Your Expo push token: {expoPushToken}</ThemedText>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.request.identifier}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10 }}>
            <ThemedText>{item.request.content.body}</ThemedText>
            <ThemedText>
              {JSON.stringify(item.request.content.data, null, 2)}
            </ThemedText>
          </View>
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: "gray", opacity: 0.5 }} />
        )}
        ListEmptyComponent={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 20,
            }}
          >
            <ThemedText
              style={{
                textAlign: "center",
                fontSize: 16,
                color: "gray",
              }}
            >
              No hay Notificaciones
            </ThemedText>
          </View>
        )}
      />

      {/*  <Button
        title="Press to Send Notification"
        onPress={async () => {
          await sendPushNotification({
            body: "Body desde mi app",
            title: "Titulo desde la app",
            to: [expoPushToken],
            data: {
              chatId: "Holsus",
            },
          });
        }}
      /> */}
    </View>
  );
}
