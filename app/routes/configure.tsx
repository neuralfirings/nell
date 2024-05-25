import { LoaderFunction, LoaderFunctionArgs, ActionFunction, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { Container, Group, Text, Button, Title, Divider, Paper, Checkbox, TextInput, Space, Box, Anchor, Alert } from '@mantine/core';

import { createSupabaseServerClient } from '@/app/supabase.server'
import { act, useState } from 'react';
import { MdOutlinePersonAdd } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";

import { Header } from '@/app/components/header'

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const { supabaseClient } = createSupabaseServerClient(request)
  const formData = await request.formData()

  // if not logged in, redirect
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) { return redirect('/login') }

  // get array of students from formData
  let students = []
  for (let [key, value] of formData.entries()) {
    if (key.startsWith("studentName")) {
      students.push({
        name: value,
        new: key.split("-")[2] == "new",
        id: key.split("-")[2] == "new" ? -1 : key.split("-")[1]
      })
    }
  }

  // update accounts table
  const { data: updateAcctData, error: updateAcctError } = await supabaseClient
    .from('accounts')
    .update({ 
      is_parent: formData.get("isParent") == "on",
      is_teacher: formData.get("isTeacher") == "on"
    })
    .eq('user_id', user.id)
    .select()
  if (updateAcctError) return {"updateAccountSuccess": false, "error": updateAcctError}

  // add students if not exist
  const { data: addStudentData, error: addStudentError }  = await supabaseClient
    .from('accounts')
    .insert(students
      .filter(s => s.new )
      .map((s) => ({name: s.name, is_student: true}))
    )
    .select()
  if (addStudentError) return {"updateAccountSuccess": false, "error": addStudentError}
  const addStudentIds: number[] = addStudentData?.map((student) => student.id)

  // update student names if exists
  const { data: updateStudentData, error: updatetudentError }  = await supabaseClient
    .from('accounts')
    .upsert(students
      .filter(s => !s.new )
      .map((s) => ({id: s.id, name: s.name, is_student: true}))
    )
    .select()
  if (updatetudentError) return {"updateAccountSuccess": false, "error": updatetudentError}

  // then add relationships
  const { error: addRelationshipError } = await supabaseClient
    .from('relationships')
    .insert(addStudentIds.map((studentId) => ({
      user1: updateAcctData[0].id,
      user2: studentId,
      relationship: "teacher/student"
    })))
  if (addRelationshipError) return {"updateAccountSuccess": false, "error": addRelationshipError}

  // remove relationships that are no longer valid
  const allStudentIds = [...addStudentIds, ...students.filter(s => !s.new).map(s => Number(s.id))]
  const {data: relationships }= await supabaseClient
    .from('relationships')
    .select('id, relationship, user2!inner(id, name)')
    .eq('user1', updateAcctData[0].id);
  const deleteRelationshipIds = relationships.filter(r => allStudentIds.indexOf(r.user2.id) == -1).map(r => r.id)
  // console.log("deleteRelationshipIds", deleteRelationshipIds)
  const { error: deleteRelationshipError } = await supabaseClient
    .from('relationships')
    .delete()
    .in('id', deleteRelationshipIds)
  if (deleteRelationshipError) return {"updateAccountSuccess": false, "error": deleteRelationshipError}

  // return success
  return {"updateAccountSuccess": true}
}

export const loader: LoaderFunction = async  ({ request }: LoaderFunctionArgs) => {
  const { supabaseClient } = createSupabaseServerClient(request)

  // redirect to login if not authenticated
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) { return redirect('/login') }
  if (user.app_metadata.logInAs != null ) { return redirect('/dashboard') } // if log in as a child, redirect to dashboard

  // get account data
  let {data: account }= await supabaseClient
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);

  // create account if not exist
  if (account?.length === 0) { 
    const { data, error } = await supabaseClient.from('accounts').insert([
      { user_id: user.id },
    ])
    const {data: newAccount } = await supabaseClient
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);
    account = newAccount
  }
  // get relationship data
  const {data: relationships }= await supabaseClient
    .from('relationships')
    .select('id, relationship, user2!inner(id, name)')
    .eq('user1', account[0].id);

  return { user, account, relationships }
}

export default function Page() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  
  let [students, setStudents] = useState(loaderData.relationships.map(r => ({ id: r.user2.id, name: r.user2.name, new: false })))
  let [isTeacher, setIsTeacher] = useState(loaderData.account[0].is_teacher)
  let [isParent, setIsParent] = useState(loaderData.account[0].is_parent)

  const handleAddStudent = () => {
    setStudents([...students, { id: Date.now(), new: true, name: '' }]);
  };

  const handleRemoveStudent = (id) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  const handleStudentNameChange = (id, name) => {
    setStudents(
      students.map((student) => (student.id === id ? { ...student, name } : student))
    );
  };

  const handleIsTeacherChange = (checked) => {
    setIsTeacher(checked)
  }

  const handleIsParentChange = (checked) => {
    setIsParent(checked)
  }
  return (
    <Container>
      <Header 
        name={loaderData.user.app_metadata.name}
        child={false}
      />
      

      <Title order={2}>Configure Account</Title>
      <Paper withBorder shadow="sm" p="md" my="sm" radius="md">

        {actionData?.updateAccountSuccess && (
          <Alert color="green" mb="md">Account updated</Alert>
        )}
        {!actionData?.updateAccountSuccess && actionData?.error && (
          <Alert color="red" mb="md">
            <pre>{JSON.stringify(actionData.error, null, 2)}</pre>
          </Alert>
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
            defaultChecked={loaderData.account[0].is_parent}
            onChange={(event) => handleIsParentChange(event.target.checked)}
          />
          <Checkbox
            label="I am a teacher"
            name="isTeacher"
            size="md"
            my="md"
            defaultChecked={loaderData.account[0].is_teacher}
            onChange={(event) => handleIsTeacherChange(event.target.checked)}
          />


          <Divider my="xl" />

          <div style={{ opacity: isTeacher ? 1 : 0.5 }}>
            <Group align="start" >
              <Title order={4}>My Students </Title>
              <Anchor size="xl" onClick={isTeacher ? handleAddStudent : null}><IoMdAddCircleOutline /></Anchor>
            </Group>
            {students.map((student) => (
              <Box key={student.id} mt="md" >
                  <Group align="flex-end">
                    <TextInput
                      label="Student Name"
                      name={`studentName-${student.id}${student.new ? "-new" : "-existing"}`}
                      placeholder="Enter student name"
                      value={student.name}
                      onChange={(event) => handleStudentNameChange(student.id, event.target.value)}
                      disabled={!isTeacher}
                      required
                    />
                    <Button 
                      disabled={!isTeacher} variant="outline" color="red" onClick={() => handleRemoveStudent(student.id)}>
                      Remove
                    </Button>
                  </Group>
              </Box>
            ))}
          </div>

          <Space my="md" />
          
          <Divider my="xl" />

          <div style={{ opacity: isParent ? 1 : 0.5 }}>
            <Title order={4}>My Children</Title>
            <Text>Coming soon...</Text>
          </div>


          
          <Space />
          {/* <Button variant="primary" mt="md" type="submit">Redirect to Index</Button> */}

          <input type="hidden" name="_action" value="finishSignUp" />
          <Button variant="primary" mt="md" type="submit" disabled={navigation.state === 'submitting'}>
            {navigation.state === 'submitting' ? 'Updating...' : 'Update'}
          </Button>
        </Form>

        <Space mt="md" />

      </Paper>

    </Container>
  )

}
