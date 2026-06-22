# Medora Lab — Emergent Google Auth Testing Playbook

This app uses **Emergent-managed Google OAuth** (Emergent Auth) for staff login.

## Test User & Session (mongosh seed)

```bash
mongosh --eval "
use('test_database');
var userId = 'user_test_' + Date.now();
var sessionToken = 'session_test_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.staff.' + Date.now() + '@medora.test',
  name: 'Test Staff',
  picture: 'https://api.dicebear.com/7.x/initials/svg?seed=Test',
  role: 'lab_supervisor',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Curl smoke tests

```bash
# /api/auth/me with Authorization header (fallback to cookie)
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

# Lab orders list
curl -X GET "$URL/api/lab/orders" -H "Authorization: Bearer $TOKEN"

# Reception creates a walk-in order
curl -X POST "$URL/api/lab/orders/walkin" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patient":{"name":"Walk-In Test","mrn":"WI-1","age":40,"sex":"M","phone":"+10000"},"test_code":"CBC","priority":"urgent","notes":"Walk-in"}'

# Doctor places order
curl -X POST "$URL/api/lab/orders" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"patient_id":"p-1001","test_code":"CBC","priority":"stat","notes":"Doctor order"}'
```

## Browser cookie test

```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://your-app.com/lab")
```

## Roles supported

| Role | Lands at | Capabilities |
|------|----------|--------------|
| lab_supervisor | /lab | Everything: validate, release, reject, amend, promote users |
| lab_technician | /lab | Orders, collection, processing only (no validate/release) |
| doctor | /doctor | Place lab orders for patients; view their patients' results |
| receptionist | /reception | Register walk-in patients, create lab orders, bill |

## Promotion rules
- First user to ever sign in is auto-elevated to `lab_supervisor`.
- All other users default to `lab_technician`.
- Supervisors can change any user's role via `/admin/users` (or `PATCH /api/users/{user_id}/role`).

## Checklist
- [ ] users collection has `user_id`, `role`, `email`, `name`, `created_at`
- [ ] user_sessions has `user_id`, `session_token`, `expires_at`
- [ ] All queries use `{"_id": 0}` projection
- [ ] First-user-becomes-supervisor logic works on a fresh DB
- [ ] /api/auth/me returns role
- [ ] Frontend routes /lab, /doctor, /reception, /admin gated by role

## Notes
- Do NOT store passwords; OAuth handled by Emergent.
- Session cookie: `session_token`, httpOnly, secure, samesite=None.
