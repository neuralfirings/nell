import { Button } from "@mantine/core";
import { useRef, useState } from "react";


// #region componennt calling another component's function
function Component1() {
  const [currentKey, setCurrentKey] = useState(1);
  const foobarRefs = useRef<{ [key: number]: () => void }>({});

  const handleClick = () => {
    const nextKey = currentKey === 1 ? 2 : 1;
    setCurrentKey(nextKey);
    foobarRefs.current[currentKey]();
  };

  const saveFoobarRef = (key: number, foobarRef: () => void) => {
    foobarRefs.current[key] = foobarRef;
  };

  return (
    <>
      <Component2 word="one" keyProp={1} onFoobarRef={saveFoobarRef} />
      <Component2 word="two" keyProp={2} onFoobarRef={saveFoobarRef} />
      <Button onClick={handleClick}>Click {currentKey}</Button>
    </>
  );
}
function Component2({ word, keyProp, onFoobarRef }: { word: string; keyProp: number; onFoobarRef: (key: number, foobarRef: () => void) => void }) {
  const foobar = () => {
    console.log("foobar", word);
  };

  onFoobarRef(keyProp, foobar);

  return <div>{word}</div>;
}
// #endregion

export default function Page() {
  return(
    <>
      <Component1 />
    </>
  )
}