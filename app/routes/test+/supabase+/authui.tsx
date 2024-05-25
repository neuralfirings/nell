import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/app/supabase.server'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Container } from '@mantine/core'


export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { supabaseClient } = createSupabaseServerClient(request)

  const sbClient = await createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
  
  return {sbServer: sbClient}
}

// const supabase = createClient(
//   "https://fdyaqvgimrebqczodjqq.supabase.co",
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeWFxdmdpbXJlYnFjem9kanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ4OTQ0NTksImV4cCI6MjAzMDQ3MDQ1OX0.sPiWazzLdZNKqPuGfNyGi0L1lqRZKTIC5D5ukrDLSkE"  
// )

// console.log("supabase", process.env.SUPABASE_URL)


export default function Page() {
  const loader = useLoaderData<typeof loader>();
  return(
    <Container>
      <Auth 
        supabaseClient={loader.sbServer} 
        appearance={{ theme: ThemeSupa }}
        providers={['google']}
      />
    </Container>
    
  )
}