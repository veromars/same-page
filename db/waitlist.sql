-- 랜딩(page2.social)의 대기자 등록 폼이 쓰는 테이블.
-- Supabase 대시보드 → SQL Editor 에 그대로 붙여넣고 실행하면 된다.
--
-- 정책 요약: anon(브라우저)은 insert 만 가능. select/update/delete 없음
-- → 등록된 이메일은 프런트에서 다시 읽히지 않는다. 목록은 대시보드나
--   service_role 로만 본다.

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text,
  created_at timestamptz not null default now()
);

-- 대소문자 무시 중복 방지 (폼도 소문자로 보내지만 이중 방어)
create unique index if not exists waitlist_email_lower_key
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

-- 익명 사용자는 삽입만
drop policy if exists "anon insert waitlist" on public.waitlist;
create policy "anon insert waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);
