import { Outlet } from "@remix-run/react";
import { AppShell, Text } from '@mantine/core';

export default function App() {
  return (
    <AppShell footer={{ height: 40 }}>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
      <AppShell.Footer p="xs">
        <Text size="xs" c="gray" align="center">
          This is a test.
        </Text>
      </AppShell.Footer>
    </AppShell>
  );
}
