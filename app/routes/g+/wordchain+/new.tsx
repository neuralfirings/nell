import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Stack, Input, TextInput } from '@mantine/core'

import { getUserInfo } from '@/app/lib/auth';
import { createSupabaseServerClient } from '@/app/supabase.server';
import { newWordChainGameData } from '@/app/lib/miranda';
import { NewWordChainGameButton } from '@/app/components/wordChainComponents';
import { LoadingScreen } from '@/app/components/utils';
// import { useTransition } from 'react';
// import { Input } from 'postcss';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log("wc/new > action > ", Object.fromEntries(formData))
  
  const { data: userInfo}  = await getUserInfo(request)
  const { supabaseClient } = createSupabaseServerClient(request)
  const action = formData.get("_action")
  let gameData = {}
  if (action == "manual") {
    const words = formData.get("words") as string
    const wordsArr = words.split(" ")
    const gameInput = {
      "wordChain": wordsArr.map((word: string) => {return {word: word, "status": "new", "task": "decode"}}),
      "conceptExplanation": formData.get("concepts") as string
    }
    gameData = await newWordChainGameData(request, gameInput)
  }
  else {
    // create game_data object, maybe call a prompt function or something
    gameData = await newWordChainGameData(request)
  }

  // create a progress object
  let progress = {}

  // mark existing games that are active or queued --> unfinished
  // TODO: maybe something more complex with active v. queued?
  const { data: updateGameData, error: updateGameError } = await supabaseClient
    .from('game_sessions')
    .update({ status: 'unfinished' })
    .eq('game_id', process.env.NELL_WORDCHAIN_ID)
    .eq('user_id', userInfo?.profileId)
    .or('status.eq.active,status.eq.queued')
  if (updateGameError) return { "error": updateGameError }

  // create a new game session in the database
  const { data: newGameData, error: newGameError } = await supabaseClient
    .from("game_sessions")
    .insert([{
      user_id: userInfo?.profileId,
      game_id: process.env.NELL_WORDCHAIN_ID,
      status: "active",
      game_data: gameData,
      progress: progress
    }])
    .select()
  if (newGameError) return { "error": newGameError }
  
  return redirect(`/g/wordchain`)
}
export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  // return json({ success: true })
  return null
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <>
      {navigation.state === 'submitting' && (<LoadingScreen />)}
      <Stack gap="md">
        <Title>New Word Chain Game</Title>

        <NewWordChainGameButton text="Auto Generate Game" variant="filled"/>
        or
        <Form method="post">
          <input type="hidden" name="_action" value="manual" />
          <TextInput type="text" name="words" label="Enter word list separated by spaces" placeholder="ex: cat hat hot hop" />
          <br />
          <TextInput type="text" name="concepts" label="What concepts are worked on?" placeholder="ex: these works practice /a/ and /o/ sounds" />
          <br />
          <Button type="submit" variant="filled">Create Game</Button>
        </Form>
      </Stack>
    </>
  )
}
