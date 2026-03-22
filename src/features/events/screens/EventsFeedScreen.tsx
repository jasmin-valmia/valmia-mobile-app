import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { useEventsFeed } from '@/features/events/hooks/useEventsFeed';

export function EventsFeedScreen() {
  const { data, isLoading, error } = useEventsFeed();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Unable to load events</Text>
        <Text style={{ marginTop: 8 }}>Check Supabase migrations, seed data, and auth credentials.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '700' }}>Upcoming events</Text>
          <Text style={{ marginTop: 4, color: '#4b5563' }}>
            Community events and activities will appear here once migrations and seed data are applied.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.title}</Text>
          <Text style={{ color: '#6b7280' }}>{item.location_name}</Text>
          <Text>
            {new Date(item.starts_at).toLocaleString()} • {item.type}
          </Text>
        </View>
      )}
      ListEmptyComponent={<Text>No events yet. Run the Supabase seed to populate the feed.</Text>}
    />
  );
}
