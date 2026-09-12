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

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);

  function clearError() {
    setError(null);
    setEmailTaken(false);
  }

  async function handleRegister() {
    setSubmitting(true);
    clearError();
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (e: any) {
      const message = e.message ?? 'Please try again';
      setError(message);
      setEmailTaken(message.toLowerCase().includes('already registered'));
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start sharing lists with the people you shop for.</Text>

        <View style={styles.form}>
          <TextField
            label="Name"
            placeholder="Your name"
            value={displayName}
            onChangeText={text => {
              setDisplayName(text);
              clearError();
            }}
          />
          <TextField
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            error={emailTaken}
            onChangeText={text => {
              setEmail(text);
              clearError();
            }}
          />
          <TextField
            label="Password"
            placeholder="8+ chars, upper & lowercase, a number"
            secureTextEntry
            value={password}
            error={!!error && !emailTaken}
            onChangeText={text => {
              setPassword(text);
              clearError();
            }}
          />
          {error ? (
            <InlineError
              message={error}
              actionLabel={emailTaken ? 'Log in instead' : undefined}
              onAction={emailTaken ? () => navigation.navigate('Login', { email: email.trim() }) : undefined}
            />
          ) : null}
          <Button title="Create Account" onPress={handleRegister} loading={submitting} style={styles.submitButton} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.xl },
  form: {},
  submitButton: { marginTop: spacing.sm },
});
