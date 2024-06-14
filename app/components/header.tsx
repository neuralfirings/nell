import { Form, Link } from "@remix-run/react";
import { Group, Text, Button, Anchor, Title} from '@mantine/core';
import { NewWordChainGameButton } from "./wordChainComponents";
import { getUserInfo } from "../lib/auth";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";

export function Header({ pageTitle, name, child }: { pageTitle: string, name: string, child: boolean }) {
  return (
    <>
        <Group justify="space-between">
          <Group>
            <Title order={4}>{pageTitle}</Title>
            {pageTitle == "Word Chain" && <Button variant="transparent" component={Link} to="/g/wordchain/new">New</Button>}
            {pageTitle == "Stories" && <Button variant="transparent" component={Link} to="/g/stories/new">New</Button>}
            {/* {pageTitle == "Word Chain" && <NewWordChainGameButton variant="transparent" text="I'm feeling lucky" />} */}
          </Group>
          <Group justify="end" align="center">
            <Text>Hi, {name}</Text>
            <Anchor component={Link} to="/dashboard">Dashboard</Anchor>     
            {!child && (
              <>
                <Anchor component={Link} to="/configure">Configure Account</Anchor>     
              </>
            )}
            <Anchor component={Link} to="/switchaccount">Switch Account</Anchor>     
            {!child && (
              <Form action="/logout" method="post">
                <input type="hidden" name="_action" value="signout" />
                <Button variant="default" type="submit">Sign Out</Button>
              </Form>  
            )}
          </Group>

        </Group>
    </>
  )
}
