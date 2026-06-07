import { webcrypto } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createCouponCode() {
  const values = new Uint8Array(7);
  webcrypto.getRandomValues(values);
  const suffix = Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
  const prefix = process.env.COUPON_PREFIX || "ST";
  return `${prefix}-${suffix}`;
}

export function getExpirationDate() {
  const days = Number(process.env.COUPON_EXPIRATION_DAYS || 30);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}
