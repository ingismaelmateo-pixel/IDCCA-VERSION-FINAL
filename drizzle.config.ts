import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_e3to1ZEaKqLS@ep-solitary-block-axze1v2s.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});