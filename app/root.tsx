import { Links, Meta, Outlet, Scripts, ScrollRestoration, MetaFunction, useRouteError, isRouteErrorResponse } from "@remix-run/react";
import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import '@fontsource-variable/lexend';
import "@mantine/core/styles.css";
import { MantineProvider, ColorSchemeScript, createTheme, Container } from "@mantine/core";

// Chakra
// const theme = extendTheme({
//   fonts: {
//     heading: `"Lexend Variable"`,
//     body: `"Lexend Variable"`,
//   },
// })

// Mantine
const theme = createTheme({
  /** Put your mantine theme override here */
  fontFamily: 'Lexend Variable',
  headings: {
    fontWeight: "500"
  }
});

export const meta: MetaFunction = () => {
  return [
    {
      name: "viewport",
      content: "width=device-width,initial-scale=1",
    },
    { title: "Nell" },
  ];
};

export const links: LinksFunction = () => {
  const favicon = process.env.NODE_ENV === 'production'
    ? '/favicon.ico'
    : '/favicon-dev.ico';

  return [
    {
      rel: "icon",
      href: favicon,
      type: "image/x-icon",
    }
  ];
};

// export const loader: LoaderFunction = (args) => rootAuthLoader(args);
export const loader: LoaderFunction = (args) => {
  return {}
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <br />
        <MantineProvider theme={theme}>{children}</MantineProvider>
        {/* <ChakraProvider theme={theme}> */}
          {/* {children} */}
          <ScrollRestoration />
          <Scripts />
        {/* </ChakraProvider> */}
      </body>
    </html>
  );
}

function App() {
  return <Outlet />;
}

// export default ClerkApp(App);
export default App


export function ErrorBoundary() {
  const error = useRouteError();

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(error)) {
    return (
      <Container>
        <h1>Oops.. something went wrong. 🤮</h1>
        <p>isRouteErrorResponse(error) == true</p>
        <p>Status: {error.status}</p>
        <p>{error.data.message}</p>
      </Container>
    );
  }

  // Don't forget to typecheck with your own logic.
  // Any value can be thrown, not just errors
  // let errorMessage = error?.message ||  "Unknown error";
  // if (isDefinitelyAnError(error)) {
  //   errorMessage = error.message;
  // }

  return (
    <Container>
    <h1>Uh oh.. something went wrong. 🤮</h1>
      <p>Error boundary triggered</p>
      <p>Thrown Error Message: {error?.message}</p>
    </Container>
  );
}