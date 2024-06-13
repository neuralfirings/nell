import { Suspense, useEffect, useState } from 'react';
import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation, useSubmit, Await} from '@remix-run/react'
import { useDisclosure } from '@mantine/hooks';
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Divider, TextInput, Radio, Textarea, Group, Stack} from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';
import { generateClaudeResponse } from '@/app/lib/miranda.ts'

import Anthropic from "@anthropic-ai/sdk";
import { getUserInfo } from '@/app/lib/auth';
import { generateNewGameGPT } from '@/app/lib/miranda.ts';
import { decode } from '@/app/lib/decode.tsx';
import { sqidify } from '@/app/lib/utils.server';
import { getUniqueWords } from '@/app/lib/utils';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log("stories/new > ActionFunction > ", Object.fromEntries(formData))

  const userInfo = await getUserInfo(request)

  if (formData.get('_action') === 'generate') {
    const readerName = userInfo.data?.profileName
    const genre = formData.get('genre') as string
    const topic = formData.get('topic') as string
    const level = formData.get('level') as string
  
    // Construct the prompt
    let prompt = ''
    prompt += `Your task is to write a ${genre} story for ${readerName} with the following requirements: \n`
    prompt += `- The story should be fun to read, with an intriguing setting and a capitvating plot that has a beginning, middle, and end. The story should contain relatable characters. It should be developmentally appropriate. If possible, include important and teachable lessons. \n`
    prompt += `- The story should be about: ${topic}.\n`
    if (level == "easy") {
      prompt += ` - The story should be easy for ${readerName} to read.\n`
    }
    else if (level == "normal") {
      prompt += ` - The story should contain just the right difficulty ${readerName} to read.\n`
    }
    else if (level == "hard") {
      prompt += ` - The story should be challenging for ${readerName} to read.\n`
    }
    prompt += `- The story should be separated into pages just like a storybook. Each page should take less than 1 minute to read. \n`
  
    prompt += `\n`
  
    prompt += `Explain what phonemic concepts or reading skills are utilized in this story. `
    prompt += `Return a JSON object like this: { "pages": ["Lorem ipsum dolor sit amet. Aenean id porttitor elit.", "Donec vestibulum risus sit amet turpis tristique scelerisque. Nulla quis sagittis sapien."], "conceptExplanation": "In the past, ${readerName} seems to do well in XX but struggle with XX. This story practices XX."}\n\n`
    prompt += `Return only minified JSON object without any markdown tags.`
  
    // Generate the story JSON
    const {data, error} = await generateNewGameGPT({
      subject: "early_literacy",
      request,
      prompt: prompt
    })
    if (error) { return json({ error: error }) }
    console.log("data", data)

    return { data, preview: true }
  }
  else if (formData.get('_action') === 'save') {
    // Save the story
    const pages = JSON.parse(formData.get('pages') as string)
    const pagesWithStatus = pages.map((page: string) => ({text: page, status: "new", assists: {}}))
    const wordsInPages = getUniqueWords(pages.join(" "))
    const decodeWords = await decode(wordsInPages)
    const { supabaseClient } = createSupabaseServerClient(request)
    const storyData = {
      user_id: userInfo.data?.profileId,
      game_id: 2,
      game_data: {conceptExplanation: formData.get("conceptExplanation"), pages: pagesWithStatus, dict: decodeWords},
      progress: {conceptExplanation: formData.get("conceptExplanation"), pages: pagesWithStatus, dict: decodeWords},
      status: "queued",
    }
    const { data, error } = await supabaseClient.from('game_sessions').insert(storyData).select()
    if (error) { return json({ error: error }) }
    return redirect(`/g/stories/${sqidify(data[0].id)}`)
  }

  return { error: "Invalid action" }
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { data, error } = await getUserInfo(request)
  if (error) { return redirect('/login') } // redirect to login if not authenticated
  return json(data)
}


export default function Page() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const userLogInAs = loaderData.userLogInAs
  const accountName = loaderData.accountName
  const profileName = loaderData.profileName
  // console.log("actionData", actionData)
  
  // for step 2: preview story
  const [pages, setPages] = useState<string[]>([]);  
  useEffect(() => {
    if (actionData && actionData.preview)
      setPages(actionData.data.pages)
  }, [actionData?.data?.pages])
  const submit = useSubmit()
  const handlePagesChange = (index: number, value: string) => {
    const updatedTextareas = [...pages];
    updatedTextareas[index] = value;
    setPages(updatedTextareas);
  };
  const handleStorySubmit = (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append('pages', JSON.stringify(pages))
    submit(formData, { method: 'post' });
  };

  return (
    <>
      <Form method="post">
        <input type="hidden" name="_action" value="generate" />
        <Stack>
          <TextInput
            name="topic"
            label="Read about"
            placeholder="Enter a topic. ex: space, trains, dinosaurs, etc."
            // value={readAboutValue}
            // onChange={handleReadAboutChange}
            required
          />

          <Radio.Group
            label="Genre"
            description="Choose a genre"
            defaultValue="fiction"
            required
          >
            <Group mt="xs">
              <Radio name="genre" value="fiction" label="Story"  />
              <Radio name="genre" value="nonfiction" label="Facts" disabled />
            </Group>
          </Radio.Group>


          <Radio.Group
            label="Ease of Reading"
            defaultValue="normal"
            required
          >
            <Group mt="xs">
              <Radio name="level" value="easy" label="Easy peasy" />
              <Radio name="level" value="normal" label="Just right"  />
              <Radio name="level" value="hard" label="Challenge me!" />
            </Group>
          </Radio.Group>

          <Button variant="primary" mt="md" type="submit" disabled={navigation.state === 'submitting'}>
            {navigation.state === 'submitting' ? 'Generating...' : 'Generate'}
          </Button>
        </Stack>
      </Form>

      {actionData?.preview && (
          <>
            <Title order={2} mt="lg" mb="sm">Story Preview</Title>
            <Form method="post" onSubmit={handleStorySubmit}>
              <input type="hidden" name="_action" value="save" />
              <input type="hidden" name="conceptExplanation" value={actionData.data.conceptExplanation} />
              <Alert color="blue" mb="md">{actionData.data.conceptExplanation}</Alert>
                {pages.map((page: string, index: number) => (
                  <Textarea
                    key={index}
                    label={`Page ${index + 1}`}
                    placeholder="Enter text for this page"
                    value={page}
                    onChange={(event) => handlePagesChange(index, event.currentTarget.value)}
                    required
                    mt="md"
                  />
                ))}
              <Button variant="primary" mt="md" type="submit" disabled={navigation.state === 'submitting'}>Add Story to Queue</Button>
            </Form>
          </>
        )
      }
      
      {actionData?.action && (
        <>
          <pre>
            {JSON.stringify(actionData.response, null, 2)}
          </pre>
        </>
      )}
    </>
  )
}