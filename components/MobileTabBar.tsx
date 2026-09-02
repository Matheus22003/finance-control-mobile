import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const labels: Record<string, string> = { index: 'Início', finances: 'Finanças', reports: 'Relatórios', debts: 'Dívidas', friends: 'Amigos' };
const glyphs: Record<string, string> = { index: '⌂', finances: '▤', reports: '◔', debts: '◫', friends: '◉' };

export function MobileTabBar({ state, descriptors, navigation }: any) {
  const c = palette[useColorScheme() ?? 'light'];
  return <View style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
    {state.routes.map((route, index) => {
      const focused = state.index === index; const options = descriptors[route.key].options;
      return <Pressable key={route.key} accessibilityRole="button" accessibilityState={{ selected: focused }} accessibilityLabel={options.tabBarAccessibilityLabel ?? labels[route.name]} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params); }} style={styles.item}>
        <Text style={[styles.glyph, { color: focused ? c.primary : c.textMuted }]}>{glyphs[route.name]}</Text><Text style={[styles.label, { color: focused ? c.primary : c.textMuted }]}>{labels[route.name]}</Text>
      </Pressable>;
    })}
    <Pressable accessibilityRole="button" accessibilityLabel="Adicionar lançamento" onPress={() => router.push('/create')} style={[styles.create, { backgroundColor: c.primary, borderColor: c.canvas }]}><Text style={styles.plus}>+</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ bar: { height: 78, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 3, paddingBottom: 10, position: 'relative' }, item: { minWidth: 51, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2 }, glyph: { fontSize: 18, fontFamily: 'Inter_700Bold' }, label: { fontFamily: 'Inter_700Bold', fontSize: 9 }, create: { position: 'absolute', left: '50%', top: -25, marginLeft: -27, height: 54, width: 54, borderRadius: 27, borderWidth: 5, alignItems: 'center', justifyContent: 'center', elevation: 3 }, plus: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 32 } });
