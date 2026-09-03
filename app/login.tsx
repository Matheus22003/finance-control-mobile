import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Brand } from '@/components/Brand';
import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

export default function Login() {
  const colors = palette[useColorScheme() ?? 'light'];
  const { accessToken, isRestoring, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isRestoring) return null;
  if (accessToken) return <Redirect href="/" />;

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Informe seus dados', 'Preencha e-mail e senha para entrar.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch {
      Alert.alert('Não foi possível entrar', 'Confira seus dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.brand}><Brand /></View>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>Bem-vindo de volta</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Entre para ver seu Finance Control.</Text>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" colors={colors} />
        <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry colors={colors} />
        <Pressable accessibilityRole="button" accessibilityLabel="Entrar" disabled={submitting} onPress={() => void submit()} style={[styles.button, { backgroundColor: colors.primary }, submitting && styles.disabled]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
      <Text style={[styles.security, { color: colors.textMuted }]}>Sua sessão é protegida pelo armazenamento seguro do dispositivo.</Text>
    </Screen>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: typeof palette.light } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  brand: { marginTop: 44 }, heading: { gap: 8 }, title: { fontFamily: 'Inter_800ExtraBold', fontSize: 30, letterSpacing: -1 }, muted: { fontFamily: 'Inter_400Regular', fontSize: 15 }, card: { borderWidth: 1, borderRadius: radius.card, gap: 16, padding: 20 }, field: { gap: 7 }, label: { fontFamily: 'Inter_700Bold', fontSize: 13 }, input: { borderWidth: 1, borderRadius: radius.control, minHeight: 50, paddingHorizontal: 14, fontFamily: 'Inter_400Regular', fontSize: 16 }, button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control, marginTop: 4 }, buttonText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }, disabled: { opacity: 0.6 }, security: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
