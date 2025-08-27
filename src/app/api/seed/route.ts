export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Missing ADMIN_EMAIL or ADMIN_PASSWORD" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return new Response(JSON.stringify({ ok: true, id: existing.id, existed: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "ADMIN" },
  });

  return new Response(JSON.stringify({ ok: true, id: user.id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}


