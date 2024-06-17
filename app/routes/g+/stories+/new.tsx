import { Suspense, useEffect, useState } from 'react';
import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation, useSubmit, Await} from '@remix-run/react'
import { useDisclosure } from '@mantine/hooks';
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Divider, TextInput, Radio, Textarea, Group, Stack, ActionIcon, Box} from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';
import { generateClaudeResponse } from '@/app/lib/miranda.ts'

import Anthropic from "@anthropic-ai/sdk";
import { getUserInfo } from '@/app/lib/auth';
import { generateNewGameGPT } from '@/app/lib/miranda.ts';
import { decode } from '@/app/lib/decode.tsx';
import { sqidify } from '@/app/lib/utils.server';
import { getUniqueWords } from '@/app/lib/utils';
import { FaTrash, FaX } from 'react-icons/fa6';
import { MdOutlineDeleteForever } from 'react-icons/md';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log("stories/new > ActionFunction > ", Object.fromEntries(formData))

  const userInfo = await getUserInfo(request)

  if (formData.get('_action') === 'generate') {
    const readerName = userInfo.data?.profileName
    const genre = formData.get('genre') as string
    const topic = formData.get('topic') as string
    const difficulty = formData.get('difficulty') as string
    const level = formData.get('level') as string
    const focus = formData.get('focus') as string

    // save level to account profile
    // const { supabaseClient } = createSupabaseServerClient(request)
    // const { data: levelDescData, error: levelDescError} = await supabaseClient
    //   .from('accounts')
    //   .select('level_description')
    //   .eq('id', userInfo.data?.profileId)
    // console.log("levelDescData", levelDescData, levelDescError)



  
    // Construct the prompt
    let prompt = ''
    prompt += `Your task is to write a ${genre} story for ${readerName} with the following requirements: \n`
    prompt += `- The story should be fun to read, with an intriguing setting and a capitvating plot that has a beginning, middle, and end. The story should contain relatable characters. It should be developmentally appropriate. If possible, include important and teachable lessons. \n`
    prompt += `- The story should be about: ${topic}.\n`
    if (level && level != "") {
      prompt += `- The story should be written at a ${readerName}'s reading level: ${level}\n`
    }
    if (difficulty == "easy") {
      prompt += `- The story should be easy for ${readerName} to read.\n`
    }
    else if (difficulty == "normal") {
      prompt += `- The story should contain just the right difficulty ${readerName} to read.\n`
    }
    else if (difficulty == "hard") {
      prompt += `- The story should be challenging for ${readerName} to read.\n`
    }
    if (focus && focus != "") {
      prompt += `- The story should help ${readerName} practice these skills: ${focus}.\n`
    }
    prompt += `- The story should be separated into pages just like a storybook. Each page should take less than 1 minute to read. \n`
  
  
    prompt += `\n`
  
    prompt += `Explain what phonemic concepts or reading skills are utilized in this story. `
    prompt += `Return a JSON object like this: { "pages": ["Lorem ipsum dolor sit amet. Aenean id porttitor elit.", "Donec vestibulum risus sit amet turpis tristique scelerisque. Nulla quis sagittis sapien."], "conceptExplanation": "In the past, ${readerName} seems to do well in XX but struggle with XX. This story practices XX."}\n\n`
    prompt += `Return only minified JSON object without any markdown tags. Please ensure all dialogue or quotes within the story are enclosed in double quotes.`
  
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

    // set existing active stories to queued
    const {error: queueActiveGamesError} = await supabaseClient.from("game_sessions")
      .update({status: "queued"})
      .eq("status", "active")
      .eq("game_id", 2)
      .eq("user_id", userInfo.data?.profileId)
    if (queueActiveGamesError) { console.log(queueActiveGamesError.message); throw new Error(queueActiveGamesError.message) }

    // insert new active story
    const storyData = {
      user_id: userInfo.data?.profileId,
      game_id: 2,
      game_data: {conceptExplanation: formData.get("conceptExplanation"), pages: pagesWithStatus, dict: decodeWords},
      progress: {conceptExplanation: formData.get("conceptExplanation"), pages: pagesWithStatus, dict: decodeWords},
      status: "active",
    }
    const { data, error } = await supabaseClient.from('game_sessions').insert(storyData).select()
    if (error) { return json({ error: error }) }
    
    // redirect to the new story
    return redirect(`/g/stories/${sqidify(data[0].id)}`)
  }

  return { error: "Invalid action" }
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
    .limit(50)
  
  const uniqueWords = getUniqueWords(progressData?.map((item: any) => item.word).join(" ") as string)
  console.log(uniqueWords, uniqueWords.length, progressData)
  const needManualLeveling = uniqueWords.length <= 10 ? true : false

  return json({userInfo, needManualLeveling})
}


export default function Page() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const userInfo = loaderData.userInfo
  const userLogInAs = userInfo.userLogInAs
  const accountName = userInfo.accountName
  const profileName = userInfo.profileName
  // console.log("actionData", actionData)
  // console.log("loaderData", loaderData)
  
  // for step 2: preview story
  const [pages, setPages] = useState<string[]>([""]);  
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

      <Title order={2} mt="lg" mb="sm">Generate Story with AI</Title>
      <Form method="post">
        <input type="hidden" name="_action" value="generate" />
        <Stack>
          {loaderData.needManualLeveling && (
            <>
              <Alert color="red" mb="md">We don't have enough data on your reading level. Please tell me a bit about where you area in your literacy journey.</Alert>
              <TextInput 
                name="level"
                label="Rough reading level"
                placeholder="ex: Kindergarten level, can read CVC words, working on long vowels, etc."
                description="Once we get more data through this app, you will not need to provide this information."
                required
              />
            </>
          )}
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
              <Radio name="difficulty" value="easy" label="Easy peasy" />
              <Radio name="difficulty" value="normal" label="Just right"  />
              <Radio name="difficulty" value="hard" label="Challenge me!" />
            </Group>
          </Radio.Group>

          <TextInput 
            name="focus"
            label="Any specific concepts to focus on?"
            placeholder="ex: CVC, long vowel teams, etc."
          />

          <Button variant="primary" mt="md" type="submit" disabled={navigation.state === 'submitting'}>
            {navigation.state === 'submitting' ? 'Generating...' : 'Generate'}
          </Button>
        </Stack>
      </Form>

      <Divider my="xl" label="OR" />

      <Title order={2} mb="sm">
        {!actionData?.preview && "Write a Story"}
        {actionData?.preview && "Story Preview"}
      </Title>
      
      {/* {actionData?.preview && ( */}
          <>
            <Form method="post" onSubmit={handleStorySubmit}>
              <input type="hidden" name="_action" value="save" />
              {actionData?.data?.conceptExplanation && (
                <>
                  <input type="hidden" name="conceptExplanation" value={actionData?.data?.conceptExplanation} />
                  <Alert color="blue" mb="md">{actionData.data.conceptExplanation}</Alert>
                </>
              )}
              
                {pages.map((page: string, index: number) => (
                  <Box key={index}>
                    <Textarea
                      label={`Page ${index + 1}`}
                      placeholder="Enter text for this page"
                      value={page}
                      onChange={(event) => handlePagesChange(index, event.currentTarget.value)}
                      required
                      mt="md"
                    />
                    <ActionIcon size="sm" color="red.3" mt={3} radius="xl" variant="outline" onClick={() => setPages(pages.filter((_, i) => i !== index))}><FaX size={12} /></ActionIcon>
                  </Box>
                ))}
              <Space mt="md" />
              <Anchor variant="light" onClick={() => setPages([...pages, ""])}>Add Page</Anchor>
              <br />
              {/* <Divider my="sm" /> */}
              <Button variant="primary" mt="md" type="submit" disabled={navigation.state === 'submitting' || pages.length == 0}>Let's Read!</Button>
            </Form>
          </>
        {/* ) */}
      {/* } */}
      
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