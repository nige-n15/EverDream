import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new HttpError(500, `Missing required environment variable: ${name}`);
  }

  return value;
}

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseAnonKey) {
  throw new HttpError(500, "Missing SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY");
}

export function createUserClient(request: Request) {
  const authorization = request.headers.get("Authorization") ?? "";

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireUser(request: Request) {
  const userClient = createUserClient(request);
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, "Unauthorized");
  }

  return {
    user,
    userClient,
    adminClient: createAdminClient(),
  };
}
