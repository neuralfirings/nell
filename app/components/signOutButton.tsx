import { LoaderFunction, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { Group, Text, Button } from '@mantine/core';
import { getUserInfo } from "../lib/auth";


export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const userInfo = await getUserInfo(request)
  if (!userInfo) { return redirect('/login') }
  return { userInfo }
}

export function SignOutButton() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <Form action="/logout" method="post">
      <input type="hidden" name="_action" value="signout" />
      <Group justify="end" align="center">
        <Text>Hello, {loaderData.userInfo.profileName}</Text>
        <Button variant="default" type="submit">Sign Out</Button>
      </Group>
    </Form>
  )

}
