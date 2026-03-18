import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function createClients(authHeader?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY')!;

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    admin,
    getUser: async () => {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) throw new Error('Missing authorization header');
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) throw new Error('Invalid or expired token');
      return data.user;
    },
  };
}
