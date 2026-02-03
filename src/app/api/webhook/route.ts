import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // TODO: Implement Farcaster webhook handling
  console.log('Farcaster webhook received');
  return NextResponse.json({ success: true, message: 'Webhook received' });
}
