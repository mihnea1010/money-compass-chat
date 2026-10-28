import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The target is always the authenticated caller, never client-supplied. */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error: authError } = await context.supabase.auth.getUser();
    if (authError || data.user?.id !== context.userId) throw new Error("Sesiunea a expirat. Intră din nou în cont.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Contul nu a putut fi șters. Încearcă din nou.");
    return { deleted: true };
  });