import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
export const HARDCODED_ADMIN = {
  username: "admin_zeyneb",
  password: "SuperSecretPassword123!",
  secretKey: "zeyneb_hardcoded_jwt_secret_key"
};
