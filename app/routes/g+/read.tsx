import { useState } from 'react';
import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { useDisclosure } from '@mantine/hooks';
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Divider, TextInput, Radio, Textarea, Group, Stack} from '@mantine/core'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { Header } from '@/app/components/header';
import { generateClaudeResponse } from '@/app/lib/miranda.ts'

import Anthropic from "@anthropic-ai/sdk";
import { getUserInfo } from '@/app/lib/auth';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))

  
  const prompt = JSON.parse(formData.get('prompt'))
  console.log("prompt >>>", JSON.stringify(prompt, null, 2));

  // return null

  if (prompt == null) {
    return json({ error: "Prompt is required" }, { status: 400 });
  }

  const {error: claudeResponseError, data: clauseResponse } = await generateClaudeResponse(prompt)

  return { action: "success", response: clauseResponse}
  // do stuff
  // return redirect('/')
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { data, error } = await getUserInfo(request)
  if (error) { return redirect('/login') } // redirect to login if not authenticated
  return json(data)
}

function generatePromptForReading(readerName: string, subjects: string, genre: string) {
  let prompt = ''
  prompt += `There is a student named ${readerName}. She reads at a first grade level.\n\n`
  prompt += `They are interested in ${subjects}.\n\n`
  prompt += `Write a ${genre} for ${readerName} to read.\n\n`

  prompt += `Explain why these sentences are good for ${readerName}, and what phonemic concepts or reading skills are utilized in these sentences.\n\n`
  prompt += `Return a JSON object like this:\n\n<example>\n{ "readingMaterials": ["I can read!", "Reading is fun."], "conceptExplanation": "These sentences helps practice XX"}\n</example>\n\n`
  prompt += `Do not use apostrophes, single quotes, or double quotes for now. Return only minified JSON object without any markdown tags.`

  return prompt
}

export default function Page() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const userLogInAs = loaderData.userLogInAs
  const accountName = loaderData.accountName
  const userName = userLogInAs == null ? accountName: userLogInAs.name

  const [promptOpened, { toggle: togglePrompt }] = useDisclosure(false);
  const [readAboutValue, setReadAboutValue] = useState('');
  const [genreValue, setGenreValue] = useState('story');

  const handleReadAboutChange = (event: any) => {
    setReadAboutValue(event.target.value);
  };

  const handleGenreChange = (value: any) => {
    setGenreValue(value);
  };

  const prompt = generatePromptForReading(userName, readAboutValue, genreValue)
  // `The user would like to read about: ${readAboutValue}. Write a ${genreValue} concerning this topic`;


  return (
    <>
      <Form method="post">
        <Stack>
          <TextInput
            label="Read about"
            placeholder="Enter a topic. ex: space, trains, dinosaurs, etc."
            value={readAboutValue}
            onChange={handleReadAboutChange}
            required
          />

          <Radio.Group
            label="Genre"
            description="Choose a genre"
            value={genreValue}
            onChange={handleGenreChange}
            defaultValue={"story"}
            required
          >
            <Group mt="xs">
              <Radio value="story" label="Story" />
              <Radio value="facts" label="Facts" />
              <Radio value="words" label="Words" />
            </Group>
          </Radio.Group>

          <Anchor size="sm" >see advanced options</Anchor>

          <Group align="baseline">
            <Button variant="primary" mt="md" type="submit" disabled={navigation.state === 'submitting'}>
              {navigation.state === 'submitting' ? 'Generating...' : 'Generate'}
            </Button>

            <Anchor size="sm" onClick={togglePrompt}>See Prompt</Anchor>
          </Group>

          <input type="hidden" name="prompt" value={JSON.stringify(prompt)} />

          {promptOpened && (
            <Textarea
              autosize
              minRows={10}
              value={prompt}
              disabled
            />
          )}
        </Stack>
      </Form>
      
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