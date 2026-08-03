# Authentication & Organization Onboarding

NPC uses **LINE Login as the only authentication method** for the MVP. This document
describes the intended backend so the current front-end flow can be wired to real
persistence and secure sessions.

> Current state: the onboarding flow (login, create organization, invitations, join
> requests, approvals, notifications, roles, member management) is fully implemented in
> the UI and driven by a client-side store (`src/lib/workspace.tsx`) with a mocked LINE
> login, so the whole flow is demoable in one browser. To ship, replace the store
> actions with the API endpoints below, back them with `supabase-auth-schema.sql`, and
> validate LINE identity on the server.

## LINE Login flow

1. Frontend redirects to LINE's authorization endpoint (`https://access.line.me/oauth2/v2.1/authorize`)
   with `response_type=code`, your channel `client_id`, `redirect_uri`, `state` (CSRF), and
   `scope=profile openid`.
2. LINE redirects back with `code` → `POST /auth/line/callback`.
3. **On the server**, exchange `code` at `https://api.line.me/oauth2/v2.1/token`, then
   **validate the returned `id_token`** at `https://api.line.me/oauth2/v2.1/verify`
   (check signature, `iss`, `aud` = channel ID, `exp`, and `nonce`). Never trust identity
   sent from the client.
4. Upsert `users` by `line_user_id`; create a **server-side session** and set an
   **HTTP-only, Secure, SameSite=Lax cookie**. The client never sees the LINE tokens.
5. `GET /auth/me` returns the current user + their memberships → the UI decides:
   no membership ⇒ onboarding (create / join); has membership ⇒ workspace.

## Roles

`Owner` › `Admin` › `Member`. The creator of an organization is the `Owner` and stays
Owner unless ownership is explicitly transferred.

| Capability | Owner | Admin | Member |
|---|:--:|:--:|:--:|
| Manage organization settings | ✓ | | |
| Assign roles / remove members | ✓ | ✓ (not Owner) | |
| Invite members · approve/reject requests | ✓ | ✓ | |
| Set department & job title | ✓ | ✓ | |
| Upload / delete documents | ✓ | ✓ | delete only if permitted |
| Ask NPC · browse knowledge · view members | ✓ | ✓ | ✓ |
| View activity logs | ✓ | ✓ | |

## API endpoints

| Method & path | Purpose | Authorization |
|---|---|---|
| `POST /auth/line/callback` | Exchange code, validate id_token, start session | public |
| `GET /auth/me` | Current user + memberships | session |
| `POST /organizations` | Create org (creator becomes Owner) | session |
| `GET /organizations/current` | Current org | member |
| `PATCH /organizations/current` | Rename / describe / settings | Owner |
| `POST /invitations` | Create invite link (returns raw token once) | Owner/Admin |
| `GET /invitations` | List active invitations | Owner/Admin |
| `POST /invitations/{id}/revoke` | Revoke | Owner/Admin |
| `GET /invite/{token}` | Public preview: org name + inviter (by hashed token) | public |
| `POST /invite/{token}/request` | Create a join request | session |
| `GET /join-requests` | Pending requests | Owner/Admin |
| `PATCH /join-requests/{id}/approve` | Approve + assign role/dept/title | Owner/Admin |
| `PATCH /join-requests/{id}/reject` | Reject (optional reason) | Owner/Admin |
| `GET /members` | List members | member |
| `PATCH /members/{id}` | Edit role / dept / title / suspend | Owner/Admin |
| `DELETE /members/{id}` | Remove member | Owner/Admin |
| `GET /notifications` | List notifications | session |
| `PATCH /notifications/{id}/read` · `PATCH /notifications/read-all` | Mark read | session |

## Security requirements

- **Validate the LINE `id_token` on the backend**; never trust client-supplied identity.
- Server-side sessions in **HTTP-only, Secure** cookies. Store `line_user_id` server-side only.
- **Hash invitation tokens** (SHA-256) before storing; the raw token is shown to the creator
  once and never persisted or logged. `GET /invite/{token}` looks up by hash.
- Reject **expired, revoked, or fully-used** invitations.
- Enforce **organization-scoped access on every endpoint** (via RLS + a checked `organization_id`);
  a user can never read or write another org's data.
- Require **Owner/Admin** for all member-management and approval actions.
- **No self-approval** — the reviewer's `user_id` must differ from the request's `user_id`.
- Prevent **duplicate pending requests** (enforced by a partial unique index).
- **Do not grant workspace access until a request is approved.**
- Record approvals, rejections, and role changes in the **activity log**.
