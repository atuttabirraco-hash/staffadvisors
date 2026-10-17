import { createHash, randomInt, timingSafeEqual } from "crypto";

export function hashEmail(email: string) {
  const pepper = process.env["EMAIL_PEPPER"] ?? "";
  return createHash("sha256").update(pepper + ":" + email.trim().toLowerCase()).digest("hex");
}

export function hashCode(emailHash: string, code: string) {
  const pepper = process.env["EMAIL_PEPPER"] ?? "";
  return createHash("sha256").update(pepper + ":" + emailHash + ":" + code).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function newCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Sends the 6-digit code. Returns false until an email sender domain is configured
 * for the project; plug the transactional email send in here.
 */
export async function sendOtpEmail(_email: string, _code: string): Promise<boolean> {
  return false;
}
