import { LoaderFunction, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { SignOutButton, SignedIn, SignedOut, UserButton, SignIn } from "@clerk/remix";

// import { Container, Heading, Button, Grid, GridItem, Link } from '@chakra-ui/react';
import { Flex, Container, Anchor } from '@mantine/core';


export const action = async ({params, request}: ActionFunctionArgs) => {
  const formData = await request.formData();
  return null;
};


export const loader: LoaderFunction = async (args) => {
  return null;
}

export default function Page() {
  const loader: LoaderFunction = useLoaderData<typeof loader>();
  // In case the user signs out while on the page.
  // if (!isLoaded || !userId) {
  //   return null;
  // }
  return (
    <Container>
      <Flex justify="center" align="center" direction="row">
        <SignedIn>
          <UserButton /> You are signed in!
          &nbsp;
          <SignOutButton redirectUrl="/test/clerk">
            <Anchor>Sign Out</Anchor>
          </SignOutButton>
        </SignedIn>
        <SignedOut>
          <SignIn forceRedirectUrl={"/test/clerk"}/>
        </SignedOut>
      </Flex>
    </Container>
  );
}