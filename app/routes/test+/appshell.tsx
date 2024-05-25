import { NavLink, AppShell, Burger, Title, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FaBroom } from "react-icons/fa6";


export default function App() {
  const [opened, { toggle }] = useDisclosure();

  function handleClick() {
    alert("clic")
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="sm"
          size="sm"
        />
        <div>Nell Reader</div>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          href="#required-for-focus"
          label="With icon"
          leftSection={<FaBroom />}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Title>Hello World</Title>
        <Button onClick={handleClick}>Test</Button>
        <br />
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit eveniet explicabo, iste porro nisi iusto sunt hic nihil quod dolore reprehenderit officiis accusantium adipisci officia vel nulla autem quas architecto?
      </AppShell.Main>
    </AppShell>
  );
}