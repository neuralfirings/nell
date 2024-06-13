import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, Outlet} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Divider } from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';


import { getUserInfo } from '@/app/lib/auth';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  return null
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { data: userInfo, error: userInfoError} = await getUserInfo(request)
  if (userInfoError) { return redirect('/login') }
  return json({userInfo})
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();
  const userInfo = loaderData.userInfo

  return (
    <Container style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <Header 
        pageTitle="Stories"
        name={userInfo.profileName} 
        child={userInfo.isChild}
      />
      <Divider my="md" />
      
      <Outlet context={{"foo": "bar"}}/>

    </Container>
  )
}

