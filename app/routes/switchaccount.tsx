import { useState } from 'react';
import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useLocation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Group, Stack } from '@mantine/core'

import { createSupabaseServerClient, createSuperbaseClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header'
import { GrownUpValidator } from '../components/grownUpValidator';
import { getUserInfo } from '../lib/auth';
import { SignOutButton } from '../components/signOutButton';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const { supabaseClient, headers } = createSupabaseServerClient(request)
  const { supAdmin } = createSuperbaseClient()
  const formData = await request.formData()
  const formDataObj = Object.fromEntries(formData)
  console.log(formDataObj, formDataObj.user2 == "self")
  const account_uid = formData.get('account_uid') as string
  const logInAs = formDataObj.user2 == "self" ? {
    id: Number(formData.get('user1_id')), 
    name: formData.get('user1_name'),
    isChild: false,
  } : { 
    id:  Number(formData.get('user2_id')), 
    name: formData.get('user2_name') ,
    isChild: true
  }
  console.log("logInAs", logInAs  )

  const {data: appUpdateData, error: appUpdateError} = await supAdmin.auth.admin.updateUserById(
    account_uid, 
    { app_metadata: { logInAs: logInAs} }
  );
  if (appUpdateError) return {"actionSuccess": false, "error": appUpdateError}
  // console.log("adminResponse", appUpdateData, appUpdateError)

  const { data: sessionRefreshData, error: sessionRefreshError } = await supabaseClient.auth.refreshSession()
  if (sessionRefreshError) return {"actionSuccess": false, "error": sessionRefreshError}
  // const { session, user } = data

  // const { error: getUserInfoError, headers } = await getUserInfo(request, true)
  // if (getUserInfoError) return {"actionSuccess": false, "error": getUserInfoError}

  // return redirect('/dashboard')
  return redirect('/dashboard', { headers })
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { supabaseClient } = createSupabaseServerClient(request)

  // redirect to login if not authenticated
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) { return redirect('/login') }
  
  // get account data
  const {data: account }= await supabaseClient
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);

  // create account if not exist then redirect to configure
  if (account == null || account?.length === 0) { 
    const { data, error } = await supabaseClient.from('accounts').insert([
      { user_id: user.id },
    ])
    return redirect('/configure')
  }
  
  // get relationship data
  const {data: relationships }= await supabaseClient
    .from('relationships')
    .select('id, relationship, user2!inner(id, name)')
    .eq('user1', account[0].id);
  
  // userInfo
  const { data: userInfo } = await getUserInfo(request, true)

  return { user, account, relationships, userInfo }
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const [dialogOpened, setDialogOpened] = useState(true);
  const location = useLocation();

  console.log("loaderData", loaderData)

  return (
    <>
      {loaderData.userInfo.isChild  == true && (
        <GrownUpValidator
          opened={dialogOpened}
          onClose={() => setDialogOpened(false)}
        />
      )}

      {(!dialogOpened || loaderData.userInfo.isChild == false ) && (
        <Container>
          
          <Header 
            pageTitle='Switch Account'
            name={loaderData.user.app_metadata.logInAs == null ? loaderData.user.user_metadata.name : loaderData.user.app_metadata.logInAs.name} 
            child={loaderData.user.app_metadata.logInAs != null}
          />
          <Paper withBorder shadow="sm" p="md" my="sm" radius="md">

            
            {loaderData?.relationships.length > 0 && (<Text>Log in as</Text>)}
            <Group>
              {/* {loaderData?.relationships.length > 0 && ( */}
                <Form method="post">
                  <input type="hidden" name="_action" value="loginas" />
                  <input type="hidden" name="user2" value="self" />
                  <input type="hidden" name="user1_id" value={loaderData.account[0].id} />
                  <input type="hidden" name="user1_name" value={loaderData.user.user_metadata.name} />
                  <input type="hidden" name="account_uid" value={loaderData.account[0].user_id} />
                  <Button key="self" variant="primary" mt="md" type="submit">{loaderData.userInfo.accountName} (the Grown Up)</Button>
                </Form>
              {/* )} */}
              {loaderData?.relationships.map((r: any) => (
                <Form method="post" key={r.id} >
                  <input type="hidden" name="_action" value="loginas" />
                  <input type="hidden" name="account_uid" value={loaderData.account[0].user_id} />
                  <input type="hidden" name="user2_id" value={r.user2.id} />
                  <input type="hidden" name="user2_name" value={r.user2.name} />
                  <Button variant="primary" mt="md" type="submit">{r.user2.name}</Button>
                </Form>
              ))}
              <Form action="/logout" method="post">
                <input type="hidden" name="_action" value="signout" />
                <Button  mt="md" variant="default" type="submit">Sign Out</Button>
              </Form>  
            </Group>

            <Space my="md" />

            {false && loaderData?.relationships && (
              <Alert color="gray" mb="md">
                <pre>
                  {JSON.stringify(loaderData.relationships, null, 2)}
                </pre>
                <pre>
                  {JSON.stringify(loaderData.user, null, 2)}
                </pre>
              </Alert>
            )}

          </Paper>
        </Container>
      )}
    </>

  )
}