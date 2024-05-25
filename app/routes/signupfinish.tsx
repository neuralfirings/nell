
import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Checkbox, Box, Group, TextInput } from '@mantine/core'
import { useState } from 'react';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  let studentNames = []
  for (let [key, value] of formData.entries()) {
    if (key.startsWith("studentName")) {
      studentNames.push(value)
    }
  }
  console.log(formData.get("isParent"), formData.get("isTeacher"), studentNames)



  // do stuff
  // return redirect('/')
  // console.log()
  return null
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  // do stuff
  return json({ success: true })
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();

  const [students, setStudents] = useState([])

  let studentId: number = 0

  const handleAddStudent = () => {
    setStudents([...students, { id: Date.now(), name: '' }]);
  };

  const handleRemoveStudent = (id) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  const handleStudentNameChange = (id, name) => {
    setStudents(
      students.map((student) => (student.id === id ? { ...student, name } : student))
    );
  };

  return (
    <Container>
      <Title order={2}>Finishing signing up</Title>
      <Paper withBorder shadow="sm" p="md" my="sm" radius="md">

        {false && loaderData?.success && (
          <Alert color="green" mb="md">Loader Function Data: Success</Alert>
        )}

        <Text> 
          Select your role
        </Text>

        <Form method="post">
          <Checkbox
            label="I am a parent"
            name="isParent"
            size="md"
            my="md"
          />
          <Checkbox
            label="I am a teacher"
            name="isTeacher"
            size="md"
            my="md"
          />

          {students.map((student) => (
            <Box key={student.id} mt="md">
                <Group align="flex-end">
                  <TextInput
                    label="Student Name"
                    name={`studentName-${student.id}`}
                    placeholder="Enter student name"
                    value={student.name}
                    onChange={(event) => handleStudentNameChange(student.id, event.target.value)}
                    required
                  />
                  <Button variant="outline" color="red" onClick={() => handleRemoveStudent(student.id)}>
                    Remove
                  </Button>
                </Group>
            </Box>
          ))}
          <Space mt="md" />

          <Anchor mt="md" onClick={handleAddStudent}>Add a student</Anchor>
          
          <Space />
          {/* <Button variant="primary" mt="md" type="submit">Redirect to Index</Button> */}

          <input type="hidden" name="_action" value="finishSignUp" />
          <Button variant="primary" mt="md" type="submit">Submit</Button>
        </Form>

        <Space mt="md" />


      </Paper>
    </Container>
  )
}