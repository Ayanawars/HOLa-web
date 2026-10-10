alter table public.alliance_map_position_reviews
  add column status text not null default 'correct'
  check (status in ('correct', 'misplaced'));
