import React from 'react';
import type { Decorator } from '@storybook/react';

// React 18+ compatibility decorator
export const withReact18: Decorator = (Story) => {
  return <Story />;
};

// Provider decorator for any context providers needed
export const withProviders: Decorator = (Story) => {
  return (
    <div style={{ padding: '1rem' }}>
      <Story />
    </div>
  );
};
