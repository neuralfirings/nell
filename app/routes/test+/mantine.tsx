import { Title, Container } from '@mantine/core';

export default function Page() {
  return (
    <Container>
      <h1>This is header tag</h1>
      <p>blah blah blah </p>
      <h2>This is header tag</h2>
      <p>blah blah blah </p>
      <h3>This is header tag</h3>
      <p>blah blah blah </p>
      <h4>This is header tag</h4>
      <p>blah blah blah </p>

      <Title order={1}>This is h1 title</Title>
      <p>blah blah blah </p>
      <Title order={2}>This is h2 title</Title>
      <p>blah blah blah </p>
      <Title order={3}>This is h3 title</Title>
      <p>blah blah blah </p>
      <Title order={4}>This is h4 title</Title>
      <Title order={5}>This is h5 title</Title>
      <Title order={6}>This is h6 title</Title>
    </Container>
  );
}