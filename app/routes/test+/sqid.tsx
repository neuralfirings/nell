import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Table } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';

import { sqidify } from '@/app/lib/utils.server';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  return null
}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  return null
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  let numArr = []
  for (let i = 0; i < 100; i++) {
    numArr.push(i)
  }

  const sqiDict = numArr.map((num) => { return { id: num, sqid: sqidify(num) } })

  return (
    <Container>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>id</Table.Th>
            <Table.Th>sqid</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sqiDict.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>{item.id}</Table.Td>
              <Table.Td>{item.sqid}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Container>
  )
}