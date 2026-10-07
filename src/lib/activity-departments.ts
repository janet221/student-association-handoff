export function activityDepartment(name: string) {
  if (name === "系運" || name === "商管盃") return "體育股";
  return "其他工作";
}
