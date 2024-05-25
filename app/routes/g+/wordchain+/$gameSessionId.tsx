import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';

import { sqidify, desqidify } from '@/app/lib/utils.server';  
import { WordChainGameUI } from '@/app/components/wordChainComponents';
import { loadGameSession } from '@/app/lib/miranda';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))
  return null
}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const urlParams = Object.fromEntries(url.searchParams);
  console.log(urlParams.foo) // ?foo=bar => bar

  const sessionSqid = params.gameSessionId as string
  const sessionId = desqidify(params.gameSessionId as string)
  console.log("gameSessionId", sessionSqid, sessionId) 

  const game_session = await loadGameSession(sessionId, false, request)
  console.log("game_session", game_session)
  
  // do stuff
  return json({ success: true, game_session })
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  console.log('loaderData', loaderData)


  return (
    <>
      {navigation.state === 'submitting' && (<LoadingScreen />)}
      {loaderData?.game_session && (<WordChainGameUI data={loaderData?.game_session} />)}
      {!loaderData?.game_session && (<Alert color="red">Invalid game session ID</Alert>)}
    </>
  )
}