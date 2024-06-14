import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Stack, Input, TextInput } from '@mantine/core'

import { getUserInfo, sessionToUserInfo } from '@/app/lib/auth';
import { createSupabaseServerClient } from '@/app/supabase.server';
import { newWordChainGameData } from '@/app/lib/miranda';
import { NewWordChainGameButton } from '@/app/components/wordChainComponents';
import { LoadingScreen } from '@/app/components/utils';
import { getUniqueWords } from '@/app/lib/utils';
// import { useTransition } from 'react';
// import { Input } from 'postcss';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log("wc/new > action > ", Object.fromEntries(formData))
  const level = formData.get('level') as string
  console.log("level", level)
  
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
    gameData = await newWordChainGameData(request, gameInput, null)
  }
  else {
    // create game_data object, maybe call a prompt function or something
    console.log("Feeling lucky!!")// new word chain game")
    // const await getProgress(request, "early_literacy")

    // // get logged in account
    // const { data: userInfo, error: userInfoError } = await getUserInfo(request)
    // if (userInfoError) return redirect('/login')
    // console.log("userInfo", userInfo)
    // return null

    // const formData = new FormData();
    // formData.append('subject', 'early_literacy');
    // formData.append('accountId', String(userInfo?.profileId));
    // const response = await fetch('/api/getprogress', { method: 'POST', body: formData});
    // if (!response.ok) {
    //   console.error('Error:', response.status);
    //   throw new Error('Network response was not ok: ' + response.status);
    // }
    // const data = await response.json();
    // console.log("PROGRESS >>>>", data)


    gameData = await newWordChainGameData(request, null, level)
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
  const { data: userInfo, error: userInfoError } = await getUserInfo(request)
  if (userInfoError) { return redirect('/login') } // redirect to login if not authenticated

  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: progressData, error: progressError } = await supabaseClient
    .from('progress')
    .select('word')
    .eq('account_id', userInfo?.profileId)
    .eq('subject', 'early_literacy')
    .limit(20)
  
  const uniqueWords = getUniqueWords(progressData?.map((item: any) => item.word).join(" ") as string)
  // console.log(uniqueWords)
  const needManualLeveling = uniqueWords.length <= 10 ? true : false

  return json({needManualLeveling})
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

        {/* <NewWordChainGameButton text="Auto Generate Game" variant="filled"/> */}

        <Form method="post" action="/g/wordchain/new">
          {loaderData.needManualLeveling && (
            <>
              <Alert color="red" mb="md">We don't have enough data on your reading level. Please tell me a bit about where you area in your literacy journey.</Alert>
              <TextInput 
                name="level"
                label="Rough reading level"
                placeholder="ex: Kindergarten level, can read CVC words, working on long vowels, etc."
                description="Once we get more data through this app, you will not need to provide this information."
                required
                mb="sm"
              />
            </>
          )}
          <Button variant='filled' type="submit">Auto Generate Game</Button>
        </Form>
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
