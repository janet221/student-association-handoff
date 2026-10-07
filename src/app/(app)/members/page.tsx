import { createClient } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/section-heading";
import { createMember, updateMember } from "./actions";

type Member = { id: string; name: string; department_role: string | null; is_active: boolean; assignments: { id: string; tasks: { name: string } | null; activity_roles: { name: string } | null }[] };

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: term } = await supabase.from("terms").select("id").eq("is_current", true).maybeSingle();
  const [{ data }, { data: { user } }] = await Promise.all([
    term ? supabase.from("members").select("id, name, department_role, is_active, assignments(id, tasks(name), activity_roles(name))").eq("term_id", term.id).order("name") : Promise.resolve({ data: [] }),
    supabase.auth.getUser(),
  ]);
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  const isAdmin = profile?.role === "admin";
  const members = (data ?? []) as unknown as Member[];

  return (
    <main className="page-wrap">
      <section className="page-intro"><SectionHeading number="05" label="MEMBERS" title="人員管理" /></section>
      {isAdmin && <form action={createMember} className="admin-form member-create">
        <label>姓名<input name="name" required /></label>
        <label>本屆職務<input name="departmentRole" placeholder="例：體育股幹部" /></label>
        <button className="button primary">新增本屆成員</button>
      </form>}
      <section className="member-list">
        <div className="member-row member-head"><span>姓名</span><span>本屆職務</span><span>負責角色</span><span>工作數</span></div>
        {members.map((member) => <div className={`member-row ${member.is_active ? "" : "inactive"}`} key={member.id}>
          {isAdmin ? <form action={updateMember} className="member-edit">
            <input type="hidden" name="memberId" value={member.id} />
            <input name="name" defaultValue={member.name} required aria-label="姓名" />
            <input name="departmentRole" defaultValue={member.department_role ?? ""} placeholder="本屆職務" aria-label="本屆職務" />
            <select name="isActive" defaultValue={String(member.is_active)} aria-label="成員狀態"><option value="true">在任</option><option value="false">停用</option></select>
            <button>儲存</button>
          </form> : <><b>{member.name}</b><span>{member.department_role ?? "未設定"}</span></>}
          <span>{member.assignments.map((assignment) => assignment.activity_roles?.name).filter(Boolean).join("、") || "待分配"}</span><strong>{member.assignments.length.toString().padStart(2, "0")}</strong>
        </div>)}
        {!members.length && <div className="empty-state"><b>目前還沒有本屆成員</b><p>請先新增第 26 屆成員</p></div>}
      </section>
    </main>
  );
}
