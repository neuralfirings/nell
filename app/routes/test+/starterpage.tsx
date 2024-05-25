import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  console.log(formData.get('code'))

  // do stuff
  return null
  return redirect('/')
}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const urlParams = Object.fromEntries(url.searchParams);
  console.log(urlParams.foo) // ?foo=bar => bar

  console.log(params.thingId) // if $thingId is a param in the route
  
  // do stuff
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