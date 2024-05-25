import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from '@supabase/supabase-js'
// import { Database } from "@/app/supabase.definitions"
import { Container } from '@mantine/core';

import { redirect } from '@remix-run/node'
import { Form } from '@remix-run/react'
// import { createSupabaseServerClient } from '@/app/supabase.server'
import { createSuperbaseClient } from '@/app/supabase.server'


export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // const { supabaseClient } = createSupabaseServerClient(request)
  const {supAdmin: supabaseClient} = createSuperbaseClient()

  // Fetch data from your database
  const { data, error } = await supabaseClient.from('test').select()

    // .like('sounds->>', 'AE')
    // .or('sounds->>.ilike.%"AE"%');
    // .eq('sound->>', 'AE');
    // .or('sounds.cs.{AE}', 'sounds.cs.{K}');
    // .filter('sounds', '@>', '["AE"]');
    // .or('example.ilike.tip')
    // .or('sounds.ilike.%"AE"%');
  console.log("supa data", data, error)

  // auth
  const { data: { user } } = await supabaseClient.auth.getUser()
  // if (!user) {
  //   return redirect('/')
  // }
  return { user, data }
}

export default function Page() {
  const loader = useLoaderData<typeof loader>();
  return (
    <Container>
      <h1>Database</h1>
      <pre>
        {JSON.stringify(loader.data, null, 2)}
      </pre>

      <h1>User</h1>
      <pre>
        {JSON.stringify(loader.user, null, 2)}
      </pre>


      <Form method="post" action="/test/supabase/auth">
        <label>Sign In</label><br />
        <input type="hidden" name="_action" value="signin" />
        <input type="email" name="email" placeholder="Your Email" required /><br />
        <input type="password" name="password" placeholder="" required /><br />
        <button type="submit">Sign In</button><br />
      </Form>
      <br />
      <Form method="post" action="/test/supabase/auth">
        <label>Sign Up</label><br />
        <input type="hidden" name="_action" value="signup" />
        <input type="email" name="email" placeholder="Your Email" required /><br />
        <input type="password" name="password" placeholder="" required /><br />
        <button type="submit">Sign Up</button><br />
      </Form>
      <br />
      <Form action="/test/supabase/auth" method="post">
        <input type="hidden" name="_action" value="signout" />
        <button type="submit">Sign Out</button><br />
      </Form>
      <br />
      <Form action="/test/supabase/googlesignin" method="post">
        <button type="submit">Google Sign In</button>
      </Form>
      
    </Container>
  )

}
