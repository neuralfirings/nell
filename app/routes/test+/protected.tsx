import { SignOutButton, SignedIn, SignedOut, UserButton, } from "@clerk/remix";
import { Link } from "@remix-run/react";
import { Container, Title, Button } from "@mantine/core"

export default function Index() {
  return (
    <Container>
      <Title>Protected Page</Title>
      <SignedIn>
        <UserButton /> You are signed in!
        <br /><br />

        <SignOutButton />
        
      </SignedIn>

      <SignedOut>
        <p>You are signed out</p>
        <div>
          <Link to="/test.clerk">Go to Sign in</Link>
        </div>
        <div>
          <Link to="/test.clerk">Go to Sign up</Link>
        </div>
      </SignedOut>
    </Container>
  );
}