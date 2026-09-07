-- Tenant isolation, enforced once.
--
-- Previously each tenant table carried its own policy with that tenant's name
-- written into the predicate, generated per table by a Python script. The
-- invariant "every tenant table has a matching policy" was maintained by hand.
-- Here there is one table and one policy, so the invariant is structural.

-- The acting user's email. The application sets this per connection; on
-- Supabase it comes from auth.email(), on plain Postgres from a session GUC.
CREATE OR REPLACE FUNCTION current_user_email() RETURNS text
LANGUAGE sql STABLE AS $$
    SELECT current_setting('app.user_email', true)
$$;

-- Tenants the acting user belongs to.
CREATE OR REPLACE FUNCTION accessible_tenant_ids() RETURNS SETOF bigint
LANGUAGE sql STABLE AS $$
    SELECT tenant_id FROM tenant_members WHERE email = current_user_email()
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_tenant_read ON profiles
    FOR SELECT
    USING (tenant_id IN (SELECT accessible_tenant_ids()));

-- Ingest writes as the table owner, which bypasses RLS. No client-facing role
-- gets a write policy, so reads are the only path in.
