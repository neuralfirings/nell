import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url)
  console.log(url.searchParams.get('code'))
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  console.log(formData.get('code'))

  // do stuff
  return redirect('/')
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  throw new Error("This is an error")
  return json({ success: true })
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();


  return (
    <Container>
      {navigation.state === 'submitting' && (<LoadingScreen />)}
      <Title order={2}>This is a heading</Title>
      <Paper withBorder shadow="sm" p="md" my="sm" radius="md">

        {loaderData?.success && (
          <Alert color="green" mb="md">Loader Function Data: Success</Alert>
        )}

        {!loaderData?.success && (
          <Alert color="red" mb="md">Loader Function Data: Fail</Alert>
        )}

        <Text> 
          I am a Text object in a Paper object in a Container object.
        </Text>

        <Form method="post">
          <Button variant="primary" mt="md" type="submit">Redirect to Index</Button>
        </Form>

        <Space mt="md" />

        <Anchor target="/">Link to Index</Anchor>

      </Paper>
    </Container>
  )
}