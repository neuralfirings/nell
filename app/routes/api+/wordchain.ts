import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  // const url = new URL(request.url)
  // console.log(url.searchParams.get('code'))
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))

  if (formData.get("_action") === "new") {
    console.log("new game, is this on the terminal?")
    return { "status": "how is this passed back?" }
  }
  // console.log(formData.get('code'))

  // do stuff
  // return redirect('/')
  console.log("Action function called")
  return null
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  console.log('loader loader pumpkin eater')
  return json({ success: true })
}

// export default function Page() {
//   return (
//   )
// }