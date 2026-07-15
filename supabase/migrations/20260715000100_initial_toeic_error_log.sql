create extension if not exists pgcrypto;

create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  taken_on date not null default current_date,
  listening_score integer not null check (listening_score between 5 and 495),
  reading_score integer not null check (reading_score between 5 and 495),
  total_score integer generated always as (listening_score + reading_score) stored,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mock_test_id uuid references public.mock_tests(id) on delete set null,
  toeic_part text not null check (toeic_part in ('part_1','part_2','part_3','part_4','part_5','part_6','part_7')),
  capture_reason text not null check (capture_reason in ('wrong','guessed_correct','too_slow')),
  error_types text[] not null check (
    cardinality(error_types) > 0
    and error_types <@ array[
      'grammar','vocabulary','collocation','listening_detail','listening_inference',
      'distractor','reading_detail','reading_inference','paraphrase','careless',
      'time_management','other'
    ]::text[]
  ),
  question_text text not null check (length(btrim(question_text)) > 0),
  context_excerpt text,
  question_number integer check (question_number between 1 and 200),
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  my_answer text,
  correct_answer text,
  explanation text,
  time_spent_seconds integer check (time_spent_seconds > 0),
  source_name text,
  source_reference text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  rule_text text not null check (length(btrim(rule_text)) > 0),
  keywords text[] not null default '{}',
  review_step smallint not null default 0 check (review_step between 0 and 5),
  next_review_on date default (current_date + 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (review_step = 5 and next_review_on is null)
    or (review_step < 5 and next_review_on is not null)
  )
);

create table public.question_rules (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  rule_id uuid not null references public.rules(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, rule_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rule_id uuid not null references public.rules(id) on delete cascade,
  outcome text not null check (outcome in ('remembered','forgotten')),
  step_before smallint not null check (step_before between 0 and 4),
  step_after smallint not null check (step_after between 0 and 5),
  next_review_on date,
  reviewed_at timestamptz not null default now(),
  check (
    (step_after = 5 and next_review_on is null)
    or (step_after < 5 and next_review_on is not null)
  )
);

create index questions_user_created_idx on public.questions(user_id, created_at desc);
create index questions_user_part_idx on public.questions(user_id, toeic_part);
create index questions_error_types_idx on public.questions using gin(error_types);
create index questions_mock_test_idx on public.questions(user_id, mock_test_id);
create index rules_user_due_idx on public.rules(user_id, next_review_on) where next_review_on is not null;
create index question_rules_user_rule_idx on public.question_rules(user_id, rule_id);
create index reviews_user_rule_idx on public.reviews(user_id, rule_id, reviewed_at desc);
create index mock_tests_user_date_idx on public.mock_tests(user_id, taken_on desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_set_updated_at before update on public.questions
for each row execute function public.set_updated_at();
create trigger rules_set_updated_at before update on public.rules
for each row execute function public.set_updated_at();
create trigger mock_tests_set_updated_at before update on public.mock_tests
for each row execute function public.set_updated_at();

alter table public.questions enable row level security;
alter table public.rules enable row level security;
alter table public.question_rules enable row level security;
alter table public.reviews enable row level security;
alter table public.mock_tests enable row level security;

create policy "own mock tests select" on public.mock_tests for select using (auth.uid() = user_id);
create policy "own mock tests insert" on public.mock_tests for insert with check (auth.uid() = user_id);
create policy "own mock tests update" on public.mock_tests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own mock tests delete" on public.mock_tests for delete using (auth.uid() = user_id);

create policy "own questions select" on public.questions for select using (auth.uid() = user_id);
create policy "own questions insert" on public.questions for insert with check (
  auth.uid() = user_id and (
    mock_test_id is null or exists (
      select 1 from public.mock_tests m where m.id = mock_test_id and m.user_id = auth.uid()
    )
  )
);
create policy "own questions update" on public.questions for update using (auth.uid() = user_id) with check (
  auth.uid() = user_id and (
    mock_test_id is null or exists (
      select 1 from public.mock_tests m where m.id = mock_test_id and m.user_id = auth.uid()
    )
  )
);
create policy "own questions delete" on public.questions for delete using (auth.uid() = user_id);

create policy "own rules select" on public.rules for select using (auth.uid() = user_id);
create policy "own rules insert" on public.rules for insert with check (auth.uid() = user_id);
create policy "own rules update" on public.rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rules delete" on public.rules for delete using (auth.uid() = user_id);

create policy "own question rules select" on public.question_rules for select using (
  auth.uid() = user_id
  and exists (select 1 from public.questions q where q.id = question_id and q.user_id = auth.uid())
  and exists (select 1 from public.rules r where r.id = rule_id and r.user_id = auth.uid())
);
create policy "own question rules insert" on public.question_rules for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.questions q where q.id = question_id and q.user_id = auth.uid())
  and exists (select 1 from public.rules r where r.id = rule_id and r.user_id = auth.uid())
);
create policy "own question rules delete" on public.question_rules for delete using (
  auth.uid() = user_id
  and exists (select 1 from public.questions q where q.id = question_id and q.user_id = auth.uid())
  and exists (select 1 from public.rules r where r.id = rule_id and r.user_id = auth.uid())
);

create policy "own reviews select" on public.reviews for select using (
  auth.uid() = user_id
  and exists (select 1 from public.rules r where r.id = rule_id and r.user_id = auth.uid())
);
create policy "own reviews insert" on public.reviews for insert with check (
  auth.uid() = user_id
  and exists (select 1 from public.rules r where r.id = rule_id and r.user_id = auth.uid())
);

create or replace function public.record_rule_review(
  p_rule_id uuid,
  p_outcome text,
  p_step_before smallint,
  p_step_after smallint,
  p_next_review_on date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_outcome not in ('remembered', 'forgotten') then
    raise exception 'Invalid review outcome';
  end if;

  update public.rules
  set review_step = p_step_after, next_review_on = p_next_review_on
  where id = p_rule_id
    and user_id = auth.uid()
    and review_step = p_step_before;

  if not found then
    raise exception 'Rule is unavailable or its review state changed';
  end if;

  insert into public.reviews (
    user_id, rule_id, outcome, step_before, step_after, next_review_on
  ) values (
    auth.uid(), p_rule_id, p_outcome, p_step_before, p_step_after, p_next_review_on
  );
end;
$$;

revoke all on function public.record_rule_review(uuid, text, smallint, smallint, date) from public;
revoke all on function public.record_rule_review(uuid, text, smallint, smallint, date) from anon;
grant execute on function public.record_rule_review(uuid, text, smallint, smallint, date) to authenticated;
