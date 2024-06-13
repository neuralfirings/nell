
import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Link} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Group, Anchor, Space, Divider } from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header'

import { TiDocumentText } from "react-icons/ti";
import { RiHexagonLine } from "react-icons/ri";
import { FaLink } from "react-icons/fa6";
import { getUserInfo } from '../lib/auth';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url)
  console.log(url.searchParams.get('code'))
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  console.log(formData.get('code'))

  // do stuff
  // return redirect('/')
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { data: userInfo, error: userInfoError} = await getUserInfo(request)
  if (userInfoError) { return redirect('/login') }
  console.log("userInfo", userInfo)
  return json({userInfo})
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const userInfo = loaderData.userInfo

  return (
    <Container>
      <Header 
        pageTitle="Dashboard"
        name={userInfo.profileName} 
        child={userInfo.isChild}
      />
      <Divider my="md" />

      {/* <Paper withBorder shadow="sm" p="md" my="sm" radius="md"> */}

        {false && (
          <Alert color="green" mb="md">Loader Function Data: Success</Alert>
        )}


        <Title order={3} my="lg"> 
          What do you want to do today?
        </Title>

        <Group justify="space-between" grow>
          <Button size="xl" leftSection={<TiDocumentText />} component={Link} to="/g/read">Read</Button>
          <Button size="xl" leftSection={<RiHexagonLine />} component={Link} to="/g/spell">Spell</Button>
          <Button size="xl" leftSection={<FaLink />} component={Link} to="/g/wordchain">Word Chain</Button>
        </Group>
      {/* </Paper> */}
    </Container>
  )
}