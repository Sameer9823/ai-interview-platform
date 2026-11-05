/**
 * Grants or revokes administrator access. Run by an operator with database access:
 *   npm run admin:grant -- someone@example.com
 *   npm run admin:grant -- someone@example.com --revoke
 * The person must already have an account. Nobody is promoted automatically, and the web app has no way to do this.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email || !email.includes("@")) throw new Error("Usage: npm run admin:grant -- email@example.com [--revoke]");
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) throw new Error("No account with that email. Ask the person to sign up first.");
  if (!user.emailVerified) throw new Error("That account's email is not verified. Verify it before granting admin.");
  const platformRole = flag === "--revoke" ? "NONE" : "ADMIN";
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { platformRole, tokenVersion: { increment: 1 } } }), // also signs out existing sessions
    db.auditLog.create({ data: { userId: user.id, action: "ROLE_CHANGED", metadata: { platformRole, via: "scripts/grant-admin" } } }),
  ]);
  console.log(`${email} is now ${platformRole === "ADMIN" ? "an administrator" : "a regular user"}.`);
}
main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
