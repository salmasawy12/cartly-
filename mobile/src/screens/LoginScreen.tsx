import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../components/Button';
import InlineError from '../components/InlineError';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../theme';

export default function LoginScreen({ navigation, route }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Please check your credentials');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="cart" size={36} color={colors.white} />
          </View>
          <Text style={styles.title}>Cartly</Text>
          <Text style={styles.tagline}>Shopping lists your whole family can share</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            error={!!error}
            onChangeText={text => {
              setEmail(text);
              setError(null);
            }}
          />
          <TextField
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            error={!!error}
            onChangeText={text => {
              setPassword(text);
              setError(null);
            }}
          />
          {error ? <InlineError message={error} /> : null}
          <Button title="Log In" onPress={handleLogin} loading={submitting} style={styles.loginButton} />
        </View>

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextStrong}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  tagline: { ...typography.caption, textAlign: 'center' },
  form: { marginBottom: spacing.lg },
  loginButton: { marginTop: spacing.sm },
  link: { alignItems: 'center', paddingVertical: spacing.md },
  linkText: { ...typography.caption },
  linkTextStrong: { color: colors.primary, fontWeight: '700' },
});
