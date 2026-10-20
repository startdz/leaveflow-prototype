import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getLeaves, getUsers, saveLeaves } from "@/lib/store";

const schema = z
  .object({
    userId: z.string(),
    type: z.enum([
      "Annual leave",
      "Sick leave",
      "Personal leave",
      "Maternity/paternity leave",
    ]),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    reason: z.string().trim().min(3).max(500),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
  });
export const dynamic = "force-dynamic";
export async function GET() {
  const [leaves, users] = await Promise.all([getLeaves(), getUsers()]);
  return Response.json({ leaves, users });
}
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json(
      { message: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  const users = await getUsers();
  if (!users.some((u) => u.id === parsed.data.userId && u.role === "employee"))
    return Response.json(
      { message: "Pengaju harus merupakan employee." },
      { status: 400 },
    );
  const leaves = await getLeaves();
  const item = {
    ...parsed.data,
    id: randomUUID(),
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  await saveLeaves([item, ...leaves]);
  return Response.json(item, { status: 201 });
}
