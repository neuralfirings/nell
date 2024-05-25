import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, useOutletContext, Form, Await, useNavigation, Link} from '@remix-run/react'
import { Container, Paper, Code, Button, Alert, Title, Text, Anchor, Space, Divider, Center, Loader } from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';

import { WordChainGameUI, NewWordChainGameButton } from '@/app/components/wordChainComponents';

import { getUserInfo } from '@/app/lib/auth';
import { getActiveGames, getAllGames } from '@/app/lib/miranda';
import { ConsoleAndPageLog, LoadingScreen } from '@/app/components/utils';
import { Suspense, useEffect, useRef } from 'react';


export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  return null
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const {data: allGames, error: allGamesError} = await getAllGames(Number(process.env.NELL_WORDCHAIN_ID), request)
  if (allGamesError) return json({ "error": allGamesError })
  return {allGames}
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  console.log("loaderData", loaderData)
  
  return (
    <>
      {/* {navigation.state === 'submitting' && (<LoadingScreen />)} */}
      <Space mt="md" />
      <Title order={1}>My Games</Title>
      <Title order={3}>Active Games</Title>
      {loaderData.allGames.filter((game: any) => (game.status === 'active')).map((game: any) => (
        <GameListItem key={game.id} game={game} />
      ))}
      <Title order={3}>Queued Games</Title>
      {loaderData.allGames.filter((game: any) => (game.status === 'queued')).map((game: any) => (
        <GameListItem key={game.id} game={game} />
      ))}
      <Title order={3}>Completed Games</Title>
      {loaderData.allGames.filter((game: any) => (game.status === 'completed')).map((game: any) => (
        <GameListItem key={game.id} game={game} />
      ))}
      <Title order={3}>Unfinished Games</Title>
      {loaderData.allGames.filter((game: any) => (game.status === 'unfinished')).map((game: any) => (
        <GameListItem  key={game.id} game={game} />
      ))}
      <Title order={1}>Public Games</Title>
      {loaderData.allGames.filter((game: any) => (game.visibility === 'public')).map((game: any) => (
        <GameListItem   key={game.id} game={game} />
      ))}
      <Space mt={50} />
    </>
  )
}

function GameListItem({ game }: any) {
  return (
    <Anchor component={Link} to={`/g/wordchain/${game.id}`}>
      {game.game_data.wordChain.map((e: any) => e.word).join(' -> ')}
    </Anchor>
  )
}