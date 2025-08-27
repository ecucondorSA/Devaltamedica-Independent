import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/globals.css';
import { withReact18, withProviders } from './decorators';

// Fix for React 18 compatibility
if (typeof global !== 'undefined' && !global.React) {
  global.React = React;
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [withReact18, withProviders],
};

export default preview;
