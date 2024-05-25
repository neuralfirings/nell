import { Suspense, useEffect, useState } from 'react';
import { useLoaderData, Await, defer } from '@remix-run/react';
import { delay } from '@/app/lib/utils';
import { Container } from '@mantine/core';

export async function loader() {
  // Simulating an asynchronous data fetch
  const data =  delay(2000)
  // const data = new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve('Data loaded successfully!');
  //   }, 2000);
  // });

  return defer({ data });
  // return { data}
}

export default function MyComponent() {
  const { data } = useLoaderData();

  return (
    <Container>
      <Suspense fallback={<div>Loading...</div>}>
        {/* <DelayComponent /> */}
        <Await resolve={data}>
          {(resolvedData) => (
            <div>
              <p>{JSON.stringify(resolvedData)}</p>
            </div>
          )}
        </Await>
      </Suspense>
    </Container>
  );
}

async function DelayComponent() {
  let x = await delay(2000)
  return (
    <p>Delayed 2 seconds</p>
  )
}

// function DelayComponent() {
//   const [isDelayed, setIsDelayed] = useState(true);

//   useEffect(() => {
//     delay(2000).then(() => {
//       setIsDelayed(false);
//     });
//   }, []);

//   if (isDelayed) {
//     return null; // Render nothing while delaying
//   }

//   return <p>Delayed 2 seconds</p>;
// }

// function DelayComponent() {
//   throw delay(2000).then(() => {
//     return (
//       <p>Delayed 2 seconds</p>
//     );
//   });
// }