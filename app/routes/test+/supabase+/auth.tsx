import { json, redirect } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import type { ActionFunctionArgs } from '@remix-run/node'
import { createSupabaseServerClient } from '@/app/supabase.server'
import { Container } from '@mantine/core'

export const action = async ({ request }: ActionFunctionArgs) => {
  const { supabaseClient, headers } = createSupabaseServerClient(request)
  const formData = await request.formData()
  const formAction = formData.get('_action') as string

  if (formAction == "signin") {
    console.log("signin formData", Object.fromEntries(formData))
    
    // const {data,  error } = await supabaseClient.auth.signInWithOtp({
    //   email: formData.get('email') as string,
    //   options: {
    //     emailRedirectTo: 'http://localhost:5173/test/supabase/callback',
    //   },
    // })

    const {data, error} = await supabaseClient.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
  
    console.log("signin data, error", data, error)
    if (error) {
      return json({ success: false }, { headers })
    }
    return redirect('/test/supabase', {
      headers,
    })
  }
  else if (formAction == "signup") {
    console.log("signup formData", Object.fromEntries(formData))
    const {data,  error } = await supabaseClient.auth.signUp({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      options: {
        emailRedirectTo: 'http://neuralfirings.local:5173/test/supabase',
      },
    })
    console.log("signup data, error", data, error)
    if (error) {
      return json({ success: false }, { headers })
    }
    return redirect('/test/supabase', {
      headers,
    })
  
  }
  else if (formAction == "signout") {
    const { error } = await supabaseClient.auth.signOut()

    console.log("signin error", error)
    if (error) {
      return json({ success: false }, { headers })
    }
    return redirect('/test/supabase', {
      headers,
    })
  }
  else if (formAction == "google") {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://neuralfirings.local:5173/test/supabase/callback',
      },
    })
    console.log("google data, error", data, error)
    if (error) {
      return json({ success: false }, { headers })
    }
    return null; 
  }
}
export default function Page() {
  const actionResponse = useActionData<typeof action>()
  return (
    <Container>
      {!actionResponse?.success ? (
        <Form method="post" action="/test/supabase/signin">
          <input type="email" name="email" placeholder="Your Email" required />
          <br />
          <button type="submit">Sign In</button>
        </Form>
      ) : (
        <h3>Please check your email.</h3>
      )}
    </Container>
  )
}