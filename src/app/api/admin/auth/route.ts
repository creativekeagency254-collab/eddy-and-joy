import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ADMIN_SESSION_COOKIE,
  authenticateAdmin,
  createAdminSessionToken,
  getAdminEmails,
  getAdminSessionCookieOptions,
  getAdminSessionFromRequest,
} from '@/lib/admin-auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const adminEmail = getAdminSessionFromRequest(request);

  return NextResponse.json({
    authorized: !!adminEmail,
    email: adminEmail,
    adminEmails: getAdminEmails(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid login payload.' }, { status: 400 });
    }

    const matchedEmail = authenticateAdmin(parsed.data.email, parsed.data.password);
    if (!matchedEmail) {
      return NextResponse.json({ message: 'Login failed. Check your credentials.' }, { status: 401 });
    }

    const token = createAdminSessionToken(matchedEmail);
    const response = NextResponse.json({
      authorized: true,
      email: matchedEmail,
      adminEmails: getAdminEmails(),
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
