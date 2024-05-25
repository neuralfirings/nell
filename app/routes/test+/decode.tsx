import { json, redirect, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { Title, TextInput, Button, Container, Paper } from '@mantine/core';
import { decode } from '@/app/lib/decode'
import { useLoaderData } from "@remix-run/react";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const text = url.searchParams.get("text");
  console.log('text', text)
  if (text == null) return {results: null, text: null}
  else {
    const wordsArr = (text || '').split(' ')
    const results = await decode(wordsArr, request) 
    return {results: results, text: text}
  }
};


export async function action({ request }: LoaderFunctionArgs){
  const formData = await request.formData();
  const text = formData.get('text');
  const wordsArr = (text || '').split(' ')
  const results = await decode(wordsArr, request) 
  return {results: results, text: text}

  // Perform any necessary server-side operations with the input value

  // Example: Redirect to a different route after processing the form
  // return redirect('/success');
  // return null
}

export default function InlineFormPage() {
  const actionData = useActionData<typeof action>();
  const { results, text } = useLoaderData<typeof loader>();

  return (
    <Container size="sm" px="xs">
      <Title>Decoder Test</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Form method="post">
          <TextInput
            name="text"
            placeholder="Enter a value"
            label="Input Field"
            required
          />
          <Button type="submit" mt="sm">
            Submit
          </Button>
        </Form>

        {actionData && (
          <div>
            <h2>Results</h2>
            <pre>{JSON.stringify(actionData.results, null, 2)}</pre>
          </div>
        )}

        {results && (
          <div>
            <h2>Results (from Query)</h2>
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </Paper>
    </Container>
  );
}