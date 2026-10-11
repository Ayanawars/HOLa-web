-- Passenger names are historical snapshots, including members who have left.
-- Deleting a player must neither delete passengers nor touch finalized trips.
alter table public.train_trip_members
  drop constraint if exists train_trip_members_player_name_fkey;
comment on column public.train_trip_members.player_name is
  'Historical passenger name. Kept when the player leaves or their profile is deleted.';
