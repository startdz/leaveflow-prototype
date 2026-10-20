export type UserRole = "admin" | "manager" | "employee";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveType =
  | "Annual leave"
  | "Sick leave"
  | "Personal leave"
  | "Maternity/paternity leave";
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
};
export type LeaveRequest = {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewNote?: string;
};
