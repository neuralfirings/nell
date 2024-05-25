import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, TextInput, Code, Stack } from '@mantine/core'
import { downloadWords, downloadInstructions } from '@/app/lib/tts.ts'


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log('formData', Object.fromEntries(formData))

  const formAction = formData.get("_action")

  if (formAction === "instructions") {
    const name = formData.get('name') as string
    const instruction = formData.get('instruction') as string
    console.log("input", [{name, instruction}])
    const result = await downloadInstructions([{name, instruction}])
    return result
  }
  else {
    const txt = formData.get('text') as string
    const words = txt.split(" ")
    const result = await downloadWords(words)
    return result
  }

  // do stuff
  // return redirect('/')
  return null
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  // return json({ success: true })
  return null
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Container>
      <Stack gap="md">
        <Title order={2}>Test Word Download</Title>
        <Form method="post">
          <input type="hidden" name="_action" value="word" />
          <TextInput name="text" placeholder="Text to convert to speech" label="Word string to download" />
          <Button variant="primary" mt="md" type="submit">Convert to Speech</Button>
        </Form>

        <Title order={2}>Test Instructions Download</Title>
        <Form method="post">
          <input type="hidden" name="_action" value="instructions" />
          <TextInput name="name" placeholder="Text to convert to speech" label="Name" />
          <TextInput name="instruction" placeholder="Text to convert to speech" label="Instruction Text" />
          <Button variant="primary" mt="md" type="submit">Convert to Speech</Button>
        </Form>
        <Code block>
          {JSON.stringify(actionData, null, 2)}
        </Code>
      </Stack>
    </Container>
  )
}