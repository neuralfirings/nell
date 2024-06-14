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
import { sqidify } from '@/app/lib/utils.server';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const url = new URL(request.url)
  const formData = await request.formData()
  return null
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const activeGames = await getActiveGames(2, request)
  // console.log("wordchain/_index > loader", activeGames)

  if (activeGames.length == 0) {
    return redirect("/g/stories/new")
  }

  // continue if there are activaGames, but just return the first one for now
  console.log("activeGames", activeGames)
  const activeGame = activeGames[0]
  const activeGameSqid = sqidify(activeGame.id)
  return redirect(`/g/stories/${activeGameSqid}`)
}

export default function Page() {
  // const loaderData = useLoaderData<typeof loader>();
  // console.log('loaderData', loaderData)
  // const navigation = useNavigation();
  
  return (
    <>
    </>
  )
}