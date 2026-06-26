-- Demo lab supervisor account (unique id — 000006 is pharmacy)
SELECT public.seed_demo_user(
  'b0000001-0001-4001-8001-000000000009',
  'lab.supervisor@oakhaven.demo',
  'Demo1234!',
  'Dr. Meera Nair',
  'lab_supervisor',
  'a0000001-0001-4001-8001-000000000001'
);
