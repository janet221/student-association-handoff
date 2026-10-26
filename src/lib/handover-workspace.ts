import { workGroups } from "@/lib/work-groups";
import { resolvedDepartment } from "@/lib/activity-departments";

export type HandoverRecord = {
  id: string;
  term_id: string;
  department_id: string;
  department: string;
  activity_id: string | null;
  welcome_message: string;
  welcome_visible: boolean;
  drive_url: string;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

export type HandoverEntry = {
  id: string;
  record_id: string;
  kind: string;
  content: string;
  workflow_time: string | null;
  workflow_note: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export function departmentIdForName(name: string) {
  return workGroups.find((group) => group.name === name)?.id ?? null;
}

export function departmentNamesForRole(role: string | null | undefined) {
  const normalized = role?.trim().toLocaleLowerCase();
  if (!normalized) return [];
  return workGroups.filter((group) => group.id.toLocaleLowerCase() === normalized || group.name.toLocaleLowerCase() === normalized);
}

export function activityOwnerDepartments(name: string, storedDepartment: string | null | undefined) {
  const configured = workGroups.filter((group) => group.activities.some((activity) => activity.name === name)).map((group) => group.name);
  return configured.length ? configured : [resolvedDepartment(storedDepartment, name)];
}

export function canManageDepartment(role: string | null | undefined, assignedRoles: string[], departmentId: string) {
  if (role === "admin") return true;
  const accepted = new Set(departmentNamesForRole(departmentId).flatMap((group) => [group.id.toLocaleLowerCase(), group.name.toLocaleLowerCase()]));
  return assignedRoles.some((assigned) => accepted.has(assigned.trim().toLocaleLowerCase()));
}
