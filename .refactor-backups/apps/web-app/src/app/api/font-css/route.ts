import { NextResponse } from 'next/server';

export async function GET() {
  const css = `/* Minimal critical font CSS */
@font-face { font-family: Inter; src: local('Inter'); font-display: swap; }
@font-face { font-family: Lexend; src: local('Lexend'); font-display: swap; }
`;
  return new NextResponse(css, {
    status: 200,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
