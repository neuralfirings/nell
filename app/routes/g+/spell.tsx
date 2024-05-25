import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';
import { getUserInfo } from '@/app/lib/auth';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url)
  console.log(url.searchParams.get('code'))
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  console.log(formData.get('code'))
  return null
  // do stuff
  // return redirect('/')
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { data, error } = await getUserInfo(request)
  if (error) { return redirect('/login') } // redirect to login if not authenticated
  return json(data)
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const userLogInAs = loaderData.userLogInAs
  const accountName = loaderData.accountName

  return (
    <>
      <Paper withBorder shadow="sm" p="md" my="sm" radius="md">

        <Text> 
          I am a Text object in a Paper object in a Container object.
        </Text>


      </Paper>
    </>
  )
}