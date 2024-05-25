import type { ActionFunctionArgs, LoaderFunctionArgs,} from "@remix-run/node"; // or cloudflare/deno
import { json, redirect } from "@remix-run/node"; // or cloudflare/deno
import { useLoaderData } from "@remix-run/react";
import { Code, Container } from '@mantine/core';

import { getSession, commitSession } from "@/app/sessions";
import { getUserInfo } from "@/app/lib/auth";

export async function loader({request}: LoaderFunctionArgs) {
  const {data, error, headers, source} = await getUserInfo(request);
  return json({data, source, error, headers}, {headers});
}

export async function action({request}: ActionFunctionArgs) {
  return null
}

export default function Login() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Container>
      <Code block>
        {new Date().toLocaleString()}
        <br />
        {JSON.stringify(loaderData, null, 2)}
      </Code>
    </Container>
  );
}
