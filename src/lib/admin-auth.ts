import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'eddyjoy_admin_session';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

type AdminCredential = {
  email: string;
  password: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePassword(value: string) {
  return value.trim();
}

function safeEqualText(a: string, b: string) {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    'eddyjoy-admin-dev-secret'
  );
}

function signPayload(payload: string) {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
}

function encodeToken(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeToken(value: string) {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function parseCredential(emailValue: string | undefined, passwordValue: string | undefined): AdminCredential | null {
  const email = normalizeEmail(emailValue || '');
  const password = normalizePassword(passwordValue || '');
  if (!email || !password) return null;
  return { email, password };
}

export function getAdminCredentials(): AdminCredential[] {
  const primary =
    parseCredential(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD) ||
    parseCredential('admin@gmail.com', 'Mmm@29315122');

  const secondary =
    parseCredential(process.env.ADMIN_EMAIL_2, process.env.ADMIN_PASSWORD_2) ||
    parseCredential('joy@admin.com', 'Eddj0s@24');

  return [primary, secondary].filter((item): item is AdminCredential => !!item);
}

export function getAdminEmails() {
  return getAdminCredentials().map((credential) => credential.email);
}

export function authenticateAdmin(emailInput: string, passwordInput: string) {
  const email = normalizeEmail(emailInput);
  const password = normalizePassword(passwordInput);
  if (!email || !password) return null;

  const credentials = getAdminCredentials();
  const matched = credentials.find(
    (credential) => safeEqualText(credential.email, email) && safeEqualText(credential.password, password)
  );

  return matched?.email || null;
}

export function createAdminSessionToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const payload = `${normalizedEmail}|${expiresAt}`;
  const signature = signPayload(payload);
  return encodeToken(`${payload}|${signature}`);
}

export function verifyAdminSessionToken(token: string | null | undefined) {
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  const [email, expiresAtRaw, signature] = decoded.split('|');
  if (!email || !expiresAtRaw || !signature) return null;

  const payload = `${email}|${expiresAtRaw}`;
  const expectedSignature = signPayload(payload);
  if (!safeEqualText(signature, expectedSignature)) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  const normalizedEmail = normalizeEmail(email);
  const allowedEmails = new Set(getAdminEmails());
  if (!allowedEmails.has(normalizedEmail)) return null;

  return normalizedEmail;
}

export function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}
