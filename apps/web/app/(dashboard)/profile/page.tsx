'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck } from '@tabler/icons-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { HEADING, MUTED } from '@/lib/theme';

export default function ProfilePage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data;
    },
  });

  const form = useForm({
    initialValues: { email: '', password: '', newPassword: '' },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length < 1 ? 'Current password is required' : null),
      newPassword: (v) =>
        v.length > 0 && v.length < 8 ? 'Min 8 characters' : null,
    },
  });

  useEffect(() => {
    if (me?.email) form.setFieldValue('email', me.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const handleSubmit = form.onSubmit(
    async ({ email, password, newPassword }) => {
      setError(null);
      setSuccess(false);
      try {
        await api.patch('/auth/update', {
          email,
          password,
          ...(newPassword ? { newPassword } : {}),
        });
        setSuccess(true);
        form.setFieldValue('password', '');
        form.setFieldValue('newPassword', '');
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError('Invalid credentials');
        } else {
          setError('Something went wrong');
        }
      }
    },
  );

  return (
    <Box maw={480}>
      <Stack gap="xl">
        <Title
          order={2}
          style={{ fontFamily: HEADING, letterSpacing: '-0.02em' }}
        >
          Profile
        </Title>

        <Paper
          p="xl"
          radius="sm"
          style={{
            background: 'var(--mantine-color-dark-7)',
            border: `1px solid var(--mantine-color-dark-5)`,
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                size="sm"
                styles={{
                  label: {
                    fontFamily: HEADING,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: MUTED,
                  },
                }}
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Current Password"
                placeholder="Required to save changes"
                autoComplete="current-password"
                size="sm"
                styles={{
                  label: {
                    fontFamily: HEADING,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: MUTED,
                  },
                }}
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label={
                  <Group gap={6}>
                    <Text
                      style={{
                        fontFamily: HEADING,
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: MUTED,
                      }}
                    >
                      New Password
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: 'var(--mantine-color-dark-3)',
                      }}
                    >
                      (optional)
                    </Text>
                  </Group>
                }
                placeholder="Min 8 characters"
                autoComplete="new-password"
                size="sm"
                {...form.getInputProps('newPassword')}
              />

              {error && (
                <Alert
                  color="red"
                  radius="sm"
                  p="sm"
                  styles={{ message: { fontSize: 12 } }}
                >
                  {error}
                </Alert>
              )}

              {success && (
                <Group gap={6}>
                  <IconCheck size={13} color="var(--mantine-color-green-5)" />
                  <Text
                    style={{
                      fontSize: 12,
                      color: 'var(--mantine-color-green-5)',
                      fontFamily: HEADING,
                    }}
                  >
                    Updated successfully
                  </Text>
                </Group>
              )}

              <Button
                type="submit"
                color="brand"
                fullWidth
                size="sm"
                loading={form.submitting}
                style={{ fontFamily: HEADING, marginTop: 4 }}
              >
                Save changes
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Box>
  );
}
