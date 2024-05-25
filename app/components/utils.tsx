import { Center, Code, Loader, Space } from "@mantine/core";

export const ConsoleAndPageLog = ({data}: {data: any}) => {
  console.log("ConsoleAndPageLog", data)
  return (
    <>
      <Space mt={50} />
      <Code block>LOG<br />--------------------------<br />{JSON.stringify(data, null, 2)}</Code>
      <Space mt={50} />
    </>
  )
}

export const LoadingScreen = () => {
  return(
    <div className="loading-screen" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
      }}>
      <Center style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size="xl" variant="bars" />
        </div>
      </Center>
    </div>
  )
}