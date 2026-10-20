import "server-only";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LeaveRequest, User } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(dataDir, file), "utf8")) as T;
}
async function writeJson<T>(file: string, data: T) {
  await writeFile(
    path.join(dataDir, file),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}
export const getUsers = () => readJson<User[]>("users.json");
export const getLeaves = () => readJson<LeaveRequest[]>("leaves.json");
export async function saveLeaves(leaves: LeaveRequest[]) {
  await writeJson("leaves.json", leaves);
}
