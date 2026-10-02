import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || 'campus_hms_super_secret_session_key_2026_production_grade';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}
