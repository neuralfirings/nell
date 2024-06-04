import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, TextInput } from '@mantine/core'
import { downloadWords } from '@/app/lib/tts.ts'


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  // console.log('formData', Object.fromEntries(formData))
  const txt = formData.get('text') as string
  const words = txt.split(" ")
  const result =  await downloadWords(words)
  // console.log('result', result)
  return result
}

// export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
//   // do stuff
//   // return json({ success: true })
//   return null
// }
