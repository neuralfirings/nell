
import { json, redirect, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, Link} from '@remix-run/react'

import { Container, Paper, TextInput, PasswordInput, Button, Divider, Alert, Anchor, Title } from '@mantine/core'
import { GoogleSignInButton } from '@/app/components/googleSignIn';
import { createSupabaseServerClient } from '@/app/supabase.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabaseClient, headers } = createSupabaseServerClient(request)
  const formData = await request.formData()
  const formAction = formData.get('_action') as string
  const url = new URL(request.url);
  const domain = url.origin.replaceAll("localhost", "neuralfirings.local");


  const { data: { user } } = await supabaseClient.auth.getUser()
  if (user) { return redirect('/dashboard') }

  if (formAction == "login") {
    console.log("signin formData", Object.fromEntries(formData))
    const {data, error} = await supabaseClient.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
  
    console.log("signin data, error", data, error)
    if (error) {
      return json({ success: false, error: error.message }, { headers })
    }
    return redirect('/dashboard', { headers }); 
  }
  else if (formAction == "google") {
    console.log("auth redirect", `${domain}/auth/callback`)
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${domain}/auth/callback`,
        queryParams: {
          prompt:'consent',
        }
      },
    })
    console.log("google data, error", data, error)
    if (error) {
      return json({success: false, error: error.message }, { headers })
    }
    return redirect(data.url, { headers }); 
  }
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (user) { return redirect('/dashboard') }
  return null
}

export default function Page() {
  const actionData = useActionData<typeof action>();

  return (
    <Container size={420} my={40}>
      <Title order={2}>Sign In</Title>
      <Paper withBorder shadow="md" p={30} mt="sm" radius="md">

        {actionData?.error && (
          <Alert color="red" mb="md">
            {actionData.error}
          </Alert>
        )}

        <Form action="/login" method="post">
          <input type="hidden" name="_action" value="login" />
          <TextInput
            name="email"
            label="Email"
            placeholder="you@example.com"
            required
          />
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Your password"
            required
            mt="md"
          />
          <Button fullWidth mt="xl" type="submit">
            Login
          </Button>
        </Form>

        <Divider my="sm" label="or" labelPosition="center" />

        <GoogleSignInButton />
      
      </Paper>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Need an account? <Anchor href="/signup">Sign up</Anchor>
      </div>
    </Container>
  )
}