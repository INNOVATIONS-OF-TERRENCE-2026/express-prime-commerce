-- Migration: Enable pg_cron for automated profit protection
-- This runs the profit-protection-cron edge function every hour

-- Enable pg_cron extension (requires Supabase Pro plan or self-hosted)
-- create extension if not exists pg_cron;

-- Alternative: Use pg_net to call the edge function on a schedule
-- This works on all Supabase plans

-- First, ensure the http extension is available
create extension if not exists http with schema extensions;

-- Create a function to call the profit protection edge function
create or replace function public.run_profit_protection()
returns void
language plpgsql
security definer
as $$
declare
  supabase_url text;
  service_key text;
  response http_response;
begin
  -- Get the project URL from settings or use env variable
  select value->>'url' into supabase_url 
  from global_settings 
  where key = 'supabase_config';
  
  if supabase_url is null then
    supabase_url := current_setting('app.supabase_url', true);
  end if;

  -- Call the edge function
  -- Note: In production, you'd use a service role key stored securely
  select * into response from http((
    'POST',
    supabase_url || '/functions/v1/profit-protection-cron',
    ARRAY[http_header('Content-Type', 'application/json')],
    'application/json',
    '{}'
  )::http_request);

  -- Log the result
  insert into public.system_logs (event_type, event_data, created_at)
  values (
    'profit_protection_run',
    jsonb_build_object(
      'status', response.status,
      'ran_at', now()
    ),
    now()
  );

exception when others then
  -- Log errors but don't fail silently
  insert into public.system_logs (event_type, event_data, created_at)
  values (
    'profit_protection_error',
    jsonb_build_object(
      'error', SQLERRM,
      'ran_at', now()
    ),
    now()
  );
end;
$$;

-- Create system_logs table if it doesn't exist
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb default '{}',
  created_at timestamptz default now()
);

-- Create index for querying logs
create index if not exists idx_system_logs_event_type on public.system_logs(event_type);
create index if not exists idx_system_logs_created_at on public.system_logs(created_at desc);

-- RLS for system_logs (admin only)
alter table public.system_logs enable row level security;

create policy "Admin can view system logs"
  on public.system_logs for select
  using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid()
      and role in ('founder', 'admin')
    )
  );

-- Grant necessary permissions
grant usage on schema extensions to postgres, anon, authenticated, service_role;
grant execute on function public.run_profit_protection() to service_role;

-- ============================================================================
-- ALTERNATIVE: Schedule using Supabase Dashboard
-- ============================================================================
-- If pg_cron is available, uncomment below:
-- 
-- select cron.schedule(
--   'profit-protection-hourly',
--   '0 * * * *',  -- Every hour at minute 0
--   $$select public.run_profit_protection()$$
-- );
--
-- To remove the cron job:
-- select cron.unschedule('profit-protection-hourly');
-- ============================================================================

-- ============================================================================
-- MANUAL TRIGGER: Create a webhook endpoint for external schedulers
-- ============================================================================
-- You can also trigger this from:
-- 1. Vercel Cron Jobs
-- 2. GitHub Actions scheduled workflows
-- 3. External cron services (cron-job.org, etc.)
-- 
-- Just call: POST https://your-project.supabase.co/functions/v1/profit-protection-cron
-- ============================================================================

comment on function public.run_profit_protection() is 
'Triggers the profit protection analysis. Can be called manually or scheduled via pg_cron.';
