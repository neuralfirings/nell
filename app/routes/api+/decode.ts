import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space } from '@mantine/core'
import { decode } from '@/app/lib/decode';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  // const requestBody = await request.json();
  // const foo = requestBody.foo;
  // const body = await request.json();
  // const data = {
  //   results: "success",
  //   foo: foo
  // };
  // return json({ greeting }, { status: 200 });


  // const formData = await request.formData()
  // console.log("api>decode", Object.fromEntries(formData))
  // const text = formData.get('text') as string
  // const wordsArr = text.split(" ")
  const wordsArr = ["cat"]
  console.log("api>decode", wordsArr)
  const decoded = await decode(wordsArr, request)
  return decoded
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const foo = url.searchParams.get('foo');
    const data = {
      results: "success",
      foo: foo
    };
    return json(data, { status: 200 });
  }

  // if (request.method === 'POST') {
  //   const requestBody = await request.json();
  //   const foo = requestBody.foo;
  //   const body = await request.json();
  //   const data = {
  //     results: "success",
  //     foo: foo
  //   };
  //   return json({ greeting }, { status: 200 });
  // }

  return json({ error: 'Method not allowed' }, { status: 405 });
}

// export default function Page() {
//   return (
//   )
// }