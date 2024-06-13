
import { json, redirect, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData} from '@remix-run/react'

import { Container, Paper, TextInput, PasswordInput, Button, Divider, Alert, Title, Anchor } from '@mantine/core'
import { GoogleSignInButton } from '@/app/components/googleSignIn';
import { createSupabaseServerClient } from '@/app/supabase.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabaseClient, headers } = createSupabaseServerClient(request)
  const formData = await request.formData()
  const url = new URL(request.url);
  const domain = url.origin;

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm-password') as string;

  if (password !== confirmPassword) {
    return json({ success: false, error: 'Passwords do not match' }, { headers });
  }

  console.log("signup formData", Object.fromEntries(formData))
  const {data,  error } = await supabaseClient.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${domain}/dashboard`,
      data: {
        name: formData.get('name') as string,
      }
    },
  })
  console.log("signup data, error", data, error)
  if (error) {
    return json({ success: false }, { headers })
  }

  // create account
  const { data: accountData, error: accountError } = await supabaseClient
    .from('accounts')
    .insert({ user_id: data?.user?.id, is_teacher: true})

  //
  return redirect('/configure', {
    headers,
  })
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
      <Title order={2}>Sign Up</Title>
      <Paper withBorder shadow="md" p={30} mt="sm" radius="md">
        {actionData?.error && (
          <Alert color="red" mb="md">
            {actionData.error}
          </Alert>
        )}

        <Form action="/signup" method="post">
          <input type="hidden" name="_action" value="login" />
          <TextInput
            name="email"
            label="Email"
            placeholder="you@example.com"
            required
          />
          <TextInput
            name="name"
            label="Name (Optional)"
            placeholder="Your Name"
            mt="md"
          />
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Your password"
            required
            mt="md"
          />
          <PasswordInput
            name="confirm-password"
            label="Confirm Password"
            placeholder="Confirm your password"
            required
            mt="md"
          />
          <Button fullWidth mt="xl" type="submit">
            Sign Up
          </Button>
        </Form>

        <Divider my="sm" label="or" labelPosition="center" />

        <GoogleSignInButton />
      
      </Paper>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account? <Anchor href="/login">Log in</Anchor>
      </div>
    </Container>
  )
}