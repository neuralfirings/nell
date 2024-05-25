import { json, LoaderFunction, LoaderFunctionArgs, createCookieSessionStorage } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react'
import { Container, Code } from '@mantine/core'

type SessionData = {
  userId: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>(
  {
    cookie: {
      secure: false, //process.env.NODE_ENV === "production", // Adjust based on environment
      secrets: ["s3cret1"],
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      name: "__session2",
      path: '/',
      sameSite: 'lax' // or 'none' if cross-origin and secure
    },
  }
);


export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  
  console.log("Cookie from Request:", cookieHeader); // Check what cookies are received

  if (session.has("userId")) {
    console.log("Session found: userId", session.get("userId"));
    return json({ data: "session found", userId: session.get("userId") });
  } else {
    console.log("No session found, setting new session");
    session.set("userId", "abcdefg");
    const setCookieHeader = await commitSession(session);
    console.log("Set-Cookie Header:", setCookieHeader); // Check the Set-Cookie header value

    return json({ data: "no session found, new session set", userId: session.get("userId") }, {
      headers: {
        "Set-Cookie": setCookieHeader,
      },
    });
  }
};  

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Container>
      <Code block>
        {new Date().toLocaleString()}
        <br />
        {JSON.stringify(loaderData, null, 2)}
      </Code>
    </Container>
  )
} 