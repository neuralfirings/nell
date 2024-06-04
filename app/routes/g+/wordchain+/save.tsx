import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'
import { createSupabaseServerClient } from '@/app/supabase.server';
import { getUserInfo } from '@/app/lib/auth';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const gameData = JSON.parse(formData.get('gameData') as string)
  const id = formData.get('id')
  
  const status = formData.get('status')

  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: userInfo, error: userInfoError} = await getUserInfo(request)

  // save user progress
  const progressRows = gameData.wordChain
    .filter((e: any, i: number) => i != 0 && e.status != "new") 
    .map((e: any) => ({ 
      account_id: userInfo?.profileId, 
      game_session_id: id, 
      task: e.task == "decode" ? "wordChainDecode" : "wordChainEncode", 
      word: e.word ,
      decoded: e.decoded,
      completed: e.status == "couldNotRead" ? false : true,
      assists: e.status == "readWithHelp" || e.status == "couldNotRead" ? ["heard_sound_out"] : [],
      subject: "early_literacy"
    }))
  console.log("progressRows", progressRows)
  const { error: userProgressError } = await supabaseClient
    .from('progress')
    .insert(progressRows)
  if (userProgressError) return { success: false, error: userProgressError }

  // save game session
  const { error: gameSessionError } = await supabaseClient
    .from('game_sessions')
    .update({progress: gameData, status: status})
    .eq('id', id)
  if (gameSessionError) return { success: false, error: gameSessionError }


  return redirect('/g/wordchain')
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  return null
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  return (
    <>
      {actionData?.success == true && (
        <Alert color="green" mb="md">Save successful!</Alert>
      )}
      {actionData?.success != true && (
        <Alert color="red" mb="md">Hm, something went wrong.</Alert>
      )}
      <pre>{JSON.stringify(actionData, null, 2)}</pre>
    </>
  )
}