import LeaveDashboard from "@/components/leave-dashboard";
import { getLeaves, getUsers } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [users, leaves] = await Promise.all([getUsers(), getLeaves()]);
  return <LeaveDashboard initialUsers={users} initialLeaves={leaves} />;
}
