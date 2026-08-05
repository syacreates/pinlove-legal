import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse(
    'tiktok-developers-site-verification=1KMDK634DPo9AU1ugncIJQegodXFl2qE',
    { status: 200, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' } }
  )
}
