// Health check endpoint
// eslint-disable-next-line import/no-internal-modules
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'altamedica-admin',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
  });
}
