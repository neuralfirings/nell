import { useLoaderData } from "@remix-run/react";
import { Form } from '@remix-run/react'
import { Button } from '@mantine/core'
import { FcGoogle } from 'react-icons/fc';

export function GoogleSignInButton() {
  return (
    <Form action="/login" method="post">
      <input type="hidden" name="_action" value="google" />
      <Button
        fullWidth
        leftSection={<FcGoogle />}
        variant="outline"
        type="submit"
      >
        Login with Google
      </Button>
    </Form>
  )
}
