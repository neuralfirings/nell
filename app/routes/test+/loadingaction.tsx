import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'
import { delay } from '@/app/lib/utils';
import { useTransition } from 'react';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  // const url = new URL(request.url)
  // console.log(url.searchParams.get('code'))
  // const formData = await request.formData()
  // console.log(Object.fromEntries(formData))
  // console.log(formData.get('code'))

  await delay(2000)

  // do stuff
  return redirect('/test')
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  return json({ success: true })
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const transition = useNavigation();

  console.log("loaded")

  return (
    <Container>
    {transition.state === 'submitting' && (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    )}
      <Title order={2}>This is a heading</Title>
      <Paper withBorder shadow="sm" p="md" my="sm" radius="md">


        <Form method="post">
          <Button variant="primary" mt="md" type="submit">Click to Load</Button>
        </Form>

      </Paper>
    </Container>
  )
}