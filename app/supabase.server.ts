import { createServerClient, parse, serialize } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const createSupabaseServerClient = (request: Request) => {
  const cookies = parse(request.headers.get('Cookie') ?? '')
  const headers = new Headers()
  const supabaseClient = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookies[key]
        },
        set(key, value, options) {
          headers.append('Set-Cookie', serialize(key, value, options))
        },
        remove(key, options) {
          headers.append('Set-Cookie', serialize(key, '', options))
        },
      },
    },
  )
  return { supabaseClient, headers }
}


export const createSuperbaseClient = () => {
  // const supAdmin = createClient(
  //   process.env.SUPABASE_URL!,
  //   process.env.SUPABASE_SERVICE_KEY!,  {
  //   auth: {
  //     persistSession: false,
  //     autoRefreshToken: false,
  //   },
  // })
  const supAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  return {supAdmin} 
}