import { json, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { createSupabaseServerClient } from '@/app/supabase.server';
import { sessionToUserInfo } from '@/app/lib/auth';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  console.log("getprogress > action")

  const { supabaseClient, headers } = createSupabaseServerClient(request)
  const formData = await request.formData()
  const subject = formData.get('subject')
  // const profileId = formData.get('accountId')

  
  // get logged in account
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession()
  if (sessionError) return { error: "get session error: " + sessionError.message }
  // console.log("sessionData", sessionData, sessionError)
  const userInfo = sessionToUserInfo(sessionData)
  // console.log("userInfo", userInfo)

  // get progress
  const { data: progressData, error: progressError} = await supabaseClient.from('progress')
    .select("task, word, completed, assists, timestamp")
    // .eq('account_id',  29) //userInfo.profileId)
    // .eq('subject', 'early_literacy') //subject)
  if (progressError) return { error: "progress error: " + progressError.message }
  console.log("progress", progressData, progressError)
  
  // do stuff
  return json({ progressData }, {
    status: 200,
    headers: { "Content-Type": "application/json"}
  })
}


// export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
//   return json({ success: true }, {
//     status: 200,
//     headers: { "Content-Type": "application/json"}
//   })
// }

// export default function Page() {
//   return null
// }