import { z } from "zod";
import { getLeaves, saveLeaves } from "@/lib/store";
import type { LeaveRequest } from "@/lib/types";

const updateSchema = z.object({
  action: z.enum(["update", "delete", "approve", "reject"]),
  actorId: z.string(),
  type: z
    .enum([
      "Annual leave",
      "Sick leave",
      "Personal leave",
      "Maternity/paternity leave",
    ])
    .optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  reason: z.string().trim().min(3).max(500).optional(),
  reviewNote: z.string().max(500).optional(),
});
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/leaves/[id]">,
) {
  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success)
    return Response.json({ message: "Data tidak valid." }, { status: 400 });
  const data = parsed.data;
  const leaves = await getLeaves();
  const index = leaves.findIndex((x) => x.id === id);
  if (index < 0)
    return Response.json(
      { message: "Pengajuan tidak ditemukan." },
      { status: 404 },
    );
  const item = leaves[index]!;
  if (data.action === "update") {
    if (item.userId !== data.actorId || item.status !== "pending")
      return Response.json(
        { message: "Hanya pengajuan pending milik sendiri yang dapat diubah." },
        { status: 403 },
      );
    if (
      !data.type ||
      !data.startDate ||
      !data.endDate ||
      !data.reason ||
      data.endDate < data.startDate
    )
      return Response.json(
        { message: "Periksa kembali data pengajuan." },
        { status: 400 },
      );
    leaves[index] = {
      ...item,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
    };
  } else if (data.action === "delete") {
    if (item.userId !== data.actorId || item.status !== "pending")
      return Response.json(
        {
          message: "Hanya pengajuan pending milik sendiri yang dapat dihapus.",
        },
        { status: 403 },
      );
    leaves.splice(index, 1);
  } else {
    const users = await (await import("@/lib/store")).getUsers();
    const actor = users.find((u) => u.id === data.actorId);
    if (!actor || !["manager", "admin"].includes(actor.role))
      return Response.json(
        { message: "Hanya manager/admin yang dapat meninjau." },
        { status: 403 },
      );
    if (item.status !== "pending")
      return Response.json(
        { message: "Pengajuan sudah ditinjau." },
        { status: 409 },
      );
    leaves[index] = {
      ...item,
      status: data.action === "approve" ? "approved" : "rejected",
      reviewerId: data.actorId,
      reviewedAt: new Date().toISOString(),
      reviewNote: data.reviewNote ?? "",
    } as LeaveRequest;
  }
  await saveLeaves(leaves);
  return Response.json({ leaves });
}
