import { LoaderFunction, redirect, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData } from "@remix-run/react";
import { getAuth } from "@clerk/remix/ssr.server";
import { SignOutButton, SignedIn, SignedOut, UserButton, SignUp, SignIn } from "@clerk/remix";
import { useAuth, useUser } from "@clerk/remix";

// import { Container, Heading, Button, Grid, GridItem, Link } from '@chakra-ui/react';
import { Container, Title, Button, Grid, Anchor } from '@mantine/core';


import { connectToDatabase } from "@/app/lib/mongodb";
import { FinishSignUp } from "@/app/components/finishSignUp";

export const action = async ({params, request}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const formAction = formData.get("_action");
  console.log("formData", formAction, Object.fromEntries(formData));
  return null;

};


export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);
  let db: any
  let account: any
  let userState: string
  let foo = "bar"
  if (!userId) {
    // return redirect("/");
    console.log("server no user")
    userState = "no user"
  }
  else {
    console.log("server", userId)
    const client = await connectToDatabase()
    db = client.db(process.env.MONGODB_DB_NAME)

    account = await db.collection("accounts").find({"userId": userId}).toArray()
    console.log("account", account)
    userState = account.length == 0 ? "half user" : "full user"
  }
  return { userState, foo };
}
// user_2fxyO8LZcnbANkrRBt6cvK0L5fh
// hi@nyl.io user_2fy1dza4ti64HeZ3HQfNpV8SY6Y


export default function SignUpPage() {
  const { userId, sessionId, getToken } = useAuth();
  const { isLoaded, isSignedIn, user } = useUser();
  const loader = useLoaderData<typeof loader>();
  console.log('userId', userId)
  console.log('sessionId', sessionId)
  const actionData = useActionData();
  // In case the user signs out while on the page.
  // if (!isLoaded || !userId) {
  //   return null;
  // }
  return (
    <Container>


      <Title>Clerk Auth</Title>
      <SignedIn>
        <UserButton /> You are signed in!
        &nbsp;
        <SignOutButton redirectUrl="/test/clerk">
          <Anchor>Sign Out</Anchor>
        </SignOutButton>
        <br /><br />
        Hello, {user?.firstName}!
        <br /><br />

        {loader.userState == "half user" ? <FinishSignUp /> : null}
        
        <br />


        {/* <SignOutButton redirectUrl={"/test/clerk"}>
          <Button colorScheme="blue">Sign Out</Button>
        </SignOutButton> */}
        
      </SignedIn>

      <SignedOut>
        
        <p>You are signed out</p>


        <Grid>
          <Grid.Col span={6}>
            <Title order={3}>Sign UP</Title><br />
            <SignUp  forceRedirectUrl={"/test/clerk"} />
          </Grid.Col>
          <Grid.Col span={6}>
            <Title order={3}>Sign IN</Title><br />
            <SignIn forceRedirectUrl={"/test/clerk"}/>
          </Grid.Col>
        </Grid>

      </SignedOut>
    </Container>
  );
}