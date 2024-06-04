import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useOutletContext, Form, Await, useNavigation} from '@remix-run/react'
import { Container, Paper, Code, Button, Alert, Title, Text, Anchor, Space, Divider, Center, Loader } from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';

import { WordChainGameUI, NewWordChainGameButton } from '@/app/components/wordChainComponents';

import { getUserInfo } from '@/app/lib/auth';
import { getActiveGames, getAllGames } from '@/app/lib/miranda';
import { ConsoleAndPageLog, LoadingScreen } from '@/app/components/utils';
import { Suspense, useEffect, useRef } from 'react';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url)
  // console.log(url.searchParams.get('code'))
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  // console.log(formData.get('code'))
  return null
  // do stuff
  // return redirect('/')
}

// function getUniquePhonemes(inputJson) {
//   const phonemes = new Set();
//   inputJson.game_data.wordChain.forEach(item => {
//     item.phonemes.forEach(phoneme => phonemes.add(phoneme));
//   });
//   return Array.from(phonemes);
// }

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // const {data: allGames, error: allGamesError} = await getAllGames(Number(process.env.NELL_WORDCHAIN_ID), request)
  // return json)

  const activeGames = await getActiveGames(Number(process.env.NELL_WORDCHAIN_ID), request)
  // console.log("wordchain/_index > loader", activeGames)

  if (activeGames.length == 0) {return ({ showNewGame: true })}

  // continue if there are activaGames, but just return the first one for now
  const activeGame = activeGames[0]
  const phonemes = new Set();
  activeGame.game_data.wordChain.forEach((item: any) => {
    item.phonemes.forEach((phoneme: any) => phonemes.add(phoneme));
  });
  const allPhonemesArr = Array.from(phonemes);
  // console.log("allPhonemesArr", allPhonemesArr)
  

  // console.log("activeGames", activeGames)
  return json({ "activeGames": activeGames, "phonemes": allPhonemesArr, "showNewGame": false })
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();
  // console.log('loaderData', loaderData)
  const navigation = useNavigation();
  
  return (
    <>
      {navigation.state === 'submitting' && (<LoadingScreen />)}
      <Space mt="md" />
      {loaderData?.showNewGame && (
        <>
          No active games.
        </>
      )}
      {!loaderData?.showNewGame && (
        <>
          <Space mt="md" />      


          <WordChainGameUI
            data={loaderData?.activeGames[0]}
          />

        </>
      )}

      <Space mt={50} />
      {/* <ConsoleAndPageLog data={phonemeAudios} /> */}
    </>
  )
}