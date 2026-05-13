import { NextResponse } from 'next/server'

export async function POST() {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
  return NextResponse.json({ email: adminEmail })
}
