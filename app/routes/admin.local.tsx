import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Code, TextInput, Textarea } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';
import fs from 'fs'

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const filepath = formData.get('filepath') as string
  const content = formData.get('content') ? formData.get('content') as string : ""

  if (filepath != null && filepath != "")
    fs.writeFileSync(filepath, content, 'utf8')

  // do stuff
  return null
}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const urlParams = Object.fromEntries(url.searchParams);
  const key = urlParams.key
  const dir = urlParams.dir
  const file = urlParams.file

  if (key != process.env.NELL_ADMIN_KEY) {
    return {}
  }
  
  const listDir = dir ? fs.readdirSync(dir) : "none"
  const listFile = file ? fs.readFileSync(dir + "/" + file, 'utf8') : "none"
  
  return json({ listDir, listFile})
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();


  return (
    <Container>
      <Title order={2}>Dir List</Title>  
      <Code block>
        {JSON.stringify(loaderData.listDir, null, 2)}
      </Code>
      <Title mt="sm" order={2}>File</Title>  
      <Code block>
        {loaderData.listFile}
      </Code>
      <Title mt="sm" order={2}>Write</Title>  
      <Form method="post">
        <TextInput required name="filepath" label="Filepath" />
        <Textarea name="content" label="Content" rows={10} />
        <Button variant="primary" mt="md" type="submit">Write to File</Button>
      </Form>
    </Container>
  )
}