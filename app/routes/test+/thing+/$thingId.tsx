import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Code } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url)
  console.log(url.searchParams.get('code'))
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  console.log(formData.get('code'))

  // do stuff
  // return redirect('/')
  return null
}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const urlParams = Object.fromEntries(url.searchParams);
  console.log(urlParams.foo) // ?foo=bar => bar
  // do stuff
  return {params, urlParams}
  // return json({ success: true })
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();


  return (
    <Container>
      <Code block>
        {JSON.stringify(loaderData, null, 2)}
      </Code>
    </Container>
  )
}