import { json, redirect } from '@remix-run/node'
import type { ActionFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient, createSuperbaseClient } from '@/app/supabase.server'
import { getUserInfo } from '../lib/auth'
import { useActionData } from '@remix-run/react'
import { Alert, Code, Container, Space } from '@mantine/core'
import Login from './test+/supabase+/sessionlogin'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabaseClient } = createSupabaseServerClient(request)
  const { supAdmin } = createSuperbaseClient()
  // console.log("old header >>>>>>", headers)

  // const userInfo = await getUserInfo(request)
  const { data: { user } } = await supabaseClient.auth.getUser()

  // server client sign out
  const { error } = await supabaseClient.auth.signOut() // signOut({scope:'global',});
  if (error) return json({ success: false, error: error })

  // service acct remove app_metadata & sign out
  // const { data: { user } } = await supabaseClient.auth.getUser()
  console.log("LOGOUT USERID >>>", user, user?.id)
  if (user?.id != null) {
    console.log("LOGOUT USERID >>>", user.id)
    const {data: appUpdateData, error: appUpdateError} = await supAdmin.auth.admin.updateUserById(
      user?.id, 
      { app_metadata: { } }
    );
  }    
  const { error: adminError } = await supAdmin.auth.signOut()
  if (adminError) return json({ success: false, error: adminError })

  // localStorage.removeItem('supabase.auth.token');
  
  const {  error: getUserInfoError, headers } = await getUserInfo(request, true) 
  if (getUserInfoError && getUserInfoError != "User not authenticated") return json({ success: false, error: getUserInfoError })

  return redirect('/', { headers })
  // return redirect('/', {headers})
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  return (
    <Container>
      <Alert color="red">Uh oh, something went wrong.</Alert>
      <Space mt="lg" />
      <Code block>{JSON.stringify(actionData, null, 2)}</Code>
    </Container>
  )
}