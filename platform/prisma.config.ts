import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Load .env.local as well
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
