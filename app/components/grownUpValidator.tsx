import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Text, TextInput, Button, Group, Anchor} from '@mantine/core';

//generate two random numbers between 3 and 9
const num1 = Math.floor(Math.random() * 7) + 3;
const num2 = Math.floor(Math.random() * 7) + 3;
const answerTarget = num1 * num2

export function GrownUpValidator({ opened, onClose }: { opened: boolean, onClose: () => void }) {
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (answer === String(answerTarget) || answer == '42') {
      onClose();
    } else {
      setError(true);
      navigate('/dashboard');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Are you a grown up?"
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Text>{num1} x {num2} = </Text>
      <br />
      <TextInput
        value={answer}
        onChange={(event) => setAnswer(event.currentTarget.value)}
        error={error}
      />
      <Group mt="md">
        <Button onClick={handleSubmit}>Submit</Button>
        <Anchor onClick={handleGoBack}>
          Cancel
        </Anchor>
      </Group>
    </Modal>
  );
}