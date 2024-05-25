// app/sessions.ts
import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

interface UserInfo {
  userLogInAs: any,
  accountName: string,
  profileName: string,
  profileId: number,
  isChild: boolean
}

type SessionData = {
  userData: UserInfo;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>(
    {
      cookie: {
        name: "__nellsession",
        maxAge: 60 * 60 * 24 * 30, // seconds
        path: "/",
        sameSite: "lax",
        secrets: [process.env.NELL_SESSION_SECRET ?? 'nyl345191'],
        secure: process.env.NODE_ENV === "production",
      },
    }
  );

export { getSession, commitSession, destroySession };

// httpOnly: true,
