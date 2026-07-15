-- Supabase projects may grant function execution directly to anon by default.
-- Keep review mutation available only to signed-in users.
revoke all
on function public.record_rule_review(uuid, text, smallint, smallint, date)
from public;

revoke all
on function public.record_rule_review(uuid, text, smallint, smallint, date)
from anon;

grant execute
on function public.record_rule_review(uuid, text, smallint, smallint, date)
to authenticated;
