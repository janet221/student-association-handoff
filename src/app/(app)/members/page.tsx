import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";

type Member = { id: string; name: string; department_role: string | null; assignments: { id: string; tasks: { name: string } | null; activity_roles: { name: string } | null }[] };

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: term } = await supabase.from("terms").select("id").eq("is_current", true).maybeSingle();
  const { data } = term ? await supabase.from("members").select("id, name, department_role, assignments(id, tasks(name), activity_roles(name))").eq("term_id", term.id).order("name") : { data: [] };
  const members = (data ?? []) as unknown as Member[];

  return (
    <main className="page-wrap">
      <section className="page-intro"><SectionHeading number="05" label="MEMBERS" title="人員管理" description="角色可以傳承，姓名必須由本屆重新安排。" /></section>
      <section className="member-list">
        <div className="member-row member-head"><span>姓名</span><span>本屆職務</span><span>負責角色</span><span>工作數</span></div>
        {members.map((member) => <div className="member-row" key={member.id}><b>{member.name}</b><span>{member.department_role ?? "未設定"}</span><span>{member.assignments.map((assignment) => assignment.activity_roles?.name).filter(Boolean).join("、") || "待分配"}</span><strong>{member.assignments.length.toString().padStart(2, "0")}</strong></div>)}
        {!members.length && <div className="empty-state"><b>尚未建立本屆成員</b><p>Seed Data 載入後即可展示工作分配。</p></div>}
      </section>
    </main>
  );
}
