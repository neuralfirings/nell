import { Container, Title, Anchor, Space, Button, Divider } from '@mantine/core';
import { Form, Link } from '@remix-run/react';

export default function Index() {
  return (
    <Container>
        <Title>Heading Default: Iakg</Title>
        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quae vero libero ex quia iusto! Totam id labore cumque ipsa illum consectetur numquam voluptatem, nulla eveniet? Accusamus nesciunt labore sint consequuntur.</p>
        
        <Anchor mr="md" href="/login">Log In</Anchor>
        <Anchor mr="md" href="/signup">Sign Up</Anchor>
        <Anchor mr="md" href="/dashboard">Dashboard</Anchor>

        <Divider my="lg" />
        <Form method="post" action="/logout">
          <Button type="submit" variant="transparent" mr="md" href="/logout">Log Out</Button>
        </Form>
    </Container>
  );
}
