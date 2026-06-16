import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '@/app/generated/prisma/client'

// Prisma 7 uses driver adapters. PrismaLibSql takes a Config object (url, authToken, etc.)
// and manages the connection internally — we don't create a separate libsql client.
// DATABASE_URL = "file:./dev.db" in development (see .env).
// For production on Turso: set DATABASE_URL to "libsql://..." and add authToken env var.
// See DECISIONS.md D-002.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function makePrisma() {
  // Local dev uses a SQLite file ("file:./dev.db"); production uses Turso ("libsql://...")
  // which additionally requires an auth token. The token is ignored for file: URLs.
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
