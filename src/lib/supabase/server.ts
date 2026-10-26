/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createDemoClient() {
  const query = () => {
    const chain: any = {};
    const keep = () => chain;
    ["select", "eq", "neq", "gte", "lte", "gt", "lt", "in", "is", "not", "or", "order", "limit", "range", "filter", "match"].forEach((method) => { chain[method] = keep; });
    ["insert", "update", "upsert", "delete"].forEach((method) => {
      chain[method] = () => Promise.resolve({ data: null, error: { message: "展示模式僅供瀏覽，請登入帳號後再編輯。" } });
    });
    chain.single = async () => ({ data: null, error: null });
    chain.maybeSingle = async () => ({ data: null, error: null });
    chain.then = (resolve: (value: { data: unknown[]; error: null }) => unknown) => resolve({ data: [], error: null });
    return chain;
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ error: { message: "展示模式不提供帳號登入。" } }),
      signUp: async () => ({ error: { message: "展示模式不提供帳號註冊。" } }),
      resend: async () => ({ error: { message: "展示模式不寄送驗證信。" } }),
      signOut: async () => ({ error: null }),
    },
    from: query,
  } as unknown as ReturnType<typeof createServerClient>;
}

export async function createClient() {
  const cookieStore = await cookies();

  // Demo sessions are isolated from Supabase in every environment. Their cookie
  // only enables this empty read-only client and never grants a database role.
  if (cookieStore.get("demo_session")?.value === "1" ||
      (process.env.NODE_ENV !== "production" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))) {
    return createDemoClient();
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. Proxy refreshes the session.
          }
        },
      },
    },
  );
}
