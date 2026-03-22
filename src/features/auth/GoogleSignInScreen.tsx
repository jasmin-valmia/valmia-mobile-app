import { Text, View } from 'react-native';

export function GoogleSignInScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>ValMia Events</Text>
      <Text style={{ fontSize: 16, lineHeight: 22 }}>
        Expo + Clerk authentication scaffold is ready. Add the Google iOS and Android OAuth client IDs to
        finish native sign-in.
      </Text>
      <View style={{ borderRadius: 12, backgroundColor: '#111827', padding: 16 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Continue with Google</Text>
      </View>
    </View>
  );
}
