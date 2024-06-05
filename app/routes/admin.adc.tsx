import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Code, TextInput, Textarea } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';
import fs from 'fs'

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const key = formData.get('key') as string
  if (key != process.env.NELL_ADMIN_KEY) {
    return json({status: "error", error: "invalid key"})
  }
  const filepath = process.env.NODE_ENV == "production" ? "/app/lovehart-bea11be05900.json" : "./local/fake-lovehart-bea11be05900.json"
  const content = formData.get('content') ? formData.get('content') as string : ""

  try {
    fs.writeFileSync(filepath, content, 'utf8')
    return json({status: "success"})
  }
  catch (err) {
    return json({status: "error", error: err})
  }

}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  return json({})
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <Container>
      {actionData?.status === 'success' && (
        <Alert color="green" mb="md">Success</Alert>
      )}
      {actionData?.status === 'error' && (
        <Alert color="red" mb="md">Error: {actionData.error}</Alert>
      )}
      <Form method="post">
        <TextInput name="key" label="Key" type="password" />
        <Textarea name="content" label="Content" rows={10} />
        <Button variant="primary" mt="md" type="submit">Submit</Button>
      </Form>
    </Container>
  )
}