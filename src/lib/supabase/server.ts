import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function createLocalFallbackClient() {
  const query = () => {
    const chain: any = {};
    const keep = () => chain;
    ["select", "insert", "update", "upsert", "delete", "eq", "neq", "gte", "lte", "gt", "lt", "in", "is", "not", "or", "order", "limit", "range", "filter", "match"].forEach((method) => { chain[method] = keep; });
    chain.single = async () => ({ data: null, error: null });
    chain.maybeSingle = async () => ({ data: null, error: null });
    chain.then = (resolve: (value: { data: unknown[]; error: null }) => unknown) => resolve({ data: [], error: null });
    return chain;
  };
  return {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      resend: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    },
    from: query,
  } as any;
}

export async function createClient() {
  const cookieStore = await cookies();

  if (process.env.NODE_ENV !== "production" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    return createLocalFallbackClient();
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
