import { getUserInfo } from "@/app/lib/auth"
import { desqidify } from "@/app/lib/utils.server"
import { createSupabaseServerClient } from "@/app/supabase.server"
import { ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs, json, redirect } from "@remix-run/node"
import { useActionData, useLoaderData } from "@remix-run/react"

export const action: ActionFunction = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  const sqid = params.sqid as string
  const id = desqidify(sqid)
  const progress = JSON.parse(formData.get('progress') as string)
  const currPageIndex = Number(formData.get('currPageIndex') as string)
  progress.pages[currPageIndex].wordStatuses = JSON.parse(formData.get('wordStatuses') as string)

  const alPagesDone = progress.pages.every((page: any) => page.status === "done")
  console.log("alPagesDone", alPagesDone)

  // update supabase
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data, error } = await supabaseClient
    .from('game_sessions')
    .update({
      progress: progress,
      status: alPagesDone ? "completed" : "active" 
    })
    .eq('id', id)
  console.log("update supabase", data, error)
  // if (error) return json({error: error.message})
  if (error) throw error.message

  // return json({"data": "saved" })
  // window.location.href = `/g/stories/${sqid}`
  // return { redirect: `/g/stories/${sqid}?refresh=clean` }
  console.log("allPagesDone again", alPagesDone)
  if (alPagesDone == true) {
    console.log("save user progress")
    const userInfo = await getUserInfo(request)
    const accountId = userInfo.data?.profileId
    const progressInserts = progress.pages.map((page: any) => {
    // let saveAssistArray = []
    // for (let key in page.assist) {

    // }
    return {
      account_id: accountId,
      task: "read",
      word: page.text,
      game_session_id: id,
      completed: true,
      subject: "early_literacy", 
      assists: page.assists
    }})
    console.log("about to insert", JSON.stringify(progressInserts, null, 2))
    const { data, error } = await supabaseClient
      .from('progress')
      .insert(progressInserts)
    if (error) throw error.message
    
    console.log("new story!")
    return redirect(`/g/stories/new`)
  }
  else {
    console.log("next page!")
    return redirect(`/g/stories/${sqid}`) //?refresh=clean
  }
}

// export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
//   return null
// }

// export default function Page() {
//   const actionData = useActionData<typeof action>();
//   const loaderData = useLoaderData<typeof loader>();
//   if (actionData.redirect)
//     window.location.replace(actionData.redirect)

//   return null
// }
