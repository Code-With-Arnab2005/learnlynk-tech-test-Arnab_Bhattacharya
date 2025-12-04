-- LearnLynk Tech Test - Task 2: RLS Policies on leads

alter table public.leads enable row level security;

-- Example helper: assume JWT has tenant_id, user_id, role.
-- You can use: current_setting('request.jwt.claims', true)::jsonb

-- TODO: write a policy so:
-- - counselors see leads where they are owner_id OR in one of their teams
-- - admins can see all leads of their tenant


-- Example skeleton for SELECT (replace with your own logic):

alter table public.leads add column team_id uuid; -- adding team_id column to leads table for leads_select_policy
-- created user_teams table for writing the select policy
create table if not exists public.user_teams (
    user_id uuid not null,
    team_id uuid not null,
    primary key (user_id, team_id)
);

create policy "leads_select_policy"
on public.leads
for select
using (
  -- TODO: add real RLS logic here, refer to README instructions
  --admins can see all leads of their tenant
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'admin'
  and tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid)

  or

  --counselors can see leads where they are owner_id or in one of their teams
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'counselor'
  and (
    owner_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid
    or team_id in (
      select team_id
      from public.user_teams
      where user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid
    )
  ))
);

-- TODO: add INSERT policy that:
-- - allows counselors/admins to insert leads for their tenant
-- - ensures tenant_id is correctly set/validated
create policy "leads_insert_policy"
on public.leads
for insert
with check (
  tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
  and (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' IN ('admin', 'counselor'))
  )
)
