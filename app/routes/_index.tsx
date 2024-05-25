import { Container, Title, Anchor, Space } from '@mantine/core';
import { Link } from '@remix-run/react';

export default function Index() {
  return (
    <Container>
        <Title>Heading Default: Iakg</Title>
        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quae vero libero ex quia iusto! Totam id labore cumque ipsa illum consectetur numquam voluptatem, nulla eveniet? Accusamus nesciunt labore sint consequuntur.</p>
        
        <Anchor mr="md" href="/login">Log In</Anchor>
        <Anchor mr="md" href="/signup">Sign Up</Anchor>
        <Anchor mr="md" href="/dashboard">Dashboard</Anchor>
    </Container>
  );
}
