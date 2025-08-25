import React from 'react';

export const Calendar: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
> = ({ children, ...props }) => <div {...props}>{children}</div>;
