-- Reservations: notes + pricing split
alter table public.reservations
  add column if not exists notes text,
  add column if not exists nightly_rate numeric,
  add column if not exists total_price numeric;

-- Backward compatibility for legacy single "price" column.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservations'
      and column_name = 'price'
  ) then
    execute '
      update public.reservations
      set total_price = price
      where total_price is null and price is not null
    ';
  end if;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_nightly_rate_non_negative
    check (nightly_rate is null or nightly_rate >= 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.reservations
    add constraint reservations_total_price_non_negative
    check (total_price is null or total_price >= 0);
exception
  when duplicate_object then null;
end $$;
