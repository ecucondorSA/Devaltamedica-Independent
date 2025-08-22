import React from 'react';

// Small component stubs used by web-app during build.
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
	<button {...props}>{children}</button>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
	<div {...props}>{children}</div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
	<input {...props} />
);

export default {};
