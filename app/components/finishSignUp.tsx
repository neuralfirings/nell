import { Form } from "@remix-run/react";
// import { Heading, Box, Checkbox, Flex, Text, Button  } from '@chakra-ui/react';
import { Flex, Title, Checkbox, Button, Anchor, Fieldset } from '@mantine/core';
import { useState } from "react";


export function FinishSignUp() {
  return (
    <div>
      {/* <Title>Finish Signing Up</Title> */}
        <Form key="formKey" id="formid" method="post">
          <Flex gap="sm" align="flex-start" direction="column">

            <Fieldset legend="Role">
              <Checkbox name="isParent" value="true" label="Parent" />
              <br />
              <Checkbox name="isTeacher" value="yes" label="Teacher" />
            </Fieldset>
            <Anchor>
              Add a Student
            </Anchor>
            <Button type="submit">
              Finish
            </Button>
            </Flex>
        </Form>
    </div>
  );
}