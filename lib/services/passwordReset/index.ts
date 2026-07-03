import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";
import { ValidationError } from "@/lib/errors";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const INVITE_TTL_MS = TOKEN_TTL_MS * 24; // 24 hours for invites

/** Generate a reset token, persist it, and fire the email via Inngest. */
export async function requestPasswordReset(email: string): Promise<void> {
  // Always resolve — don't reveal whether the email exists.
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, isActive: true },
  });
  if (!user || !user.isActive) return;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  void inngest
    .send({
      name: "user/password-reset.send",
      data: { email: user.email, resetUrl: `${siteUrl}/login/reset/${token}` },
    })
    .catch(() => {});
}

/** Validate a reset token. Returns userId if valid, throws otherwise. */
export async function validateResetToken(token: string): Promise<string> {
  const row = await db.passwordResetToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, usedAt: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new ValidationError("Invalid or expired reset link.");
  }
  return row.userId;
}

/** Consume the token and update the user's password. */
export async function applyPasswordReset(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) throw new ValidationError("Password must be at least 8 characters.");

  const row = await db.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new ValidationError("Invalid or expired reset link.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
}

/**
 * Create a set-password token for a newly invited user and fire the
 * invite email with the set-password link embedded.
 */
export async function sendInviteSetPasswordEmail(
  userId: string,
  email: string,
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await db.passwordResetToken.create({ data: { userId, token, expiresAt } });

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  void inngest
    .send({
      name: "user/password-reset.send",
      data: {
        email,
        resetUrl: `${siteUrl}/login/reset/${token}`,
        isInvite: true,
      },
    })
    .catch(() => {});
}
