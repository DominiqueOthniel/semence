import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Document HTML web : empêche le zoom auto iOS/Android
 * quand un champ (PIN, etc.) reçoit le focus.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                overflow: hidden;
                overscroll-behavior: none;
                -webkit-text-size-adjust: 100%;
                text-size-adjust: 100%;
              }
              input, textarea, select {
                font-size: 16px !important;
              }
              input:focus, textarea:focus {
                font-size: 16px !important;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
