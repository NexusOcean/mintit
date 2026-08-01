import { Center, Loader } from '@mantine/core';
import { PRIMARY } from '@/src/lib/theme';

export function PageLoader() {
  return (
    <Center style={{ minHeight: '100vh' }}>
      <Loader color={PRIMARY} />
    </Center>
  );
}
