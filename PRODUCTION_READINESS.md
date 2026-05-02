# Production Readiness Checklist

This document tracks what is missing before the backend is production-ready and fully ready for frontend/client integration.

## Current Status

- TypeScript compile check passes with `npx tsc --noEmit`.
- The project is not production-ready yet.
- Main blockers are missing production scripts, incomplete features, weak validation, security hardening, missing tests, and missing integration documentation.

## Critical Gaps

- [ ] Add real production scripts in `package.json`.
  - Missing: `build`, `start`, `dev`, `test`, and optionally `lint`.
  - Current `test` script always fails.

- [ ] Fix OTP expiry field mismatch.
  - `auth.service.ts` creates `expiresAt`.
  - `user.model.ts` defines `expiredAt`.
  - This means OTP expiry is not persisted consistently.

- [ ] Fix sign-out blacklist expiry.
  - JWT `exp` is in seconds.
  - `new Date(exp)` treats the value as milliseconds.
  - Token blacklist expiry will be wrong unless converted with `exp * 1000`.

- [ ] Add refresh-token endpoint.
  - Refresh tokens are generated during sign-in.
  - There is no endpoint to rotate refresh tokens or issue a new access token.

- [ ] Enforce email verification before sign-in.
  - Currently unverified users can sign in.

- [ ] Wrap JWT verification in safe error handling.
  - `authentication.middleware.ts` can throw on invalid or expired JWT.
  - Socket auth has the same issue in `socketIo.gateways.ts`.

- [ ] Protect socket group access.
  - Any authenticated socket can currently join/read/send to any group by ID.
  - Group membership must be checked before joining or sending messages.

## Feature Gaps

- [ ] Implement comments module.
  - `comment.controller.ts` is currently empty.
  - `comment.service.ts` is currently empty.

- [ ] Implement reacts module.
  - `react.controller.ts` is currently empty.
  - `react.service.ts` is currently empty.

- [ ] Implement profile update.
  - `profile.service.ts` has an empty `updateProfile` method.

- [ ] Implement post update.

- [ ] Implement post delete.

- [ ] Implement get user posts.

- [ ] Decide what to do with GraphQL.
  - `src/GraphQl/main.gql.ts` exists but is empty.
  - Either implement and mount it or remove it from the production scope.

## Security And Stability Gaps

- [ ] Restrict CORS.
  - HTTP CORS currently allows all origins.
  - Socket.IO CORS currently allows all origins.

- [ ] Add upload hardening.
  - File size limits.
  - MIME type validation.
  - Extension validation.
  - Temp file cleanup after S3 upload.
  - Better error handling for failed uploads.

- [ ] Avoid exposing raw internal errors to clients.
  - Current global error handler may return internal error objects.

- [ ] Add rate limiting.
  - Sign-in.
  - Signup.
  - OTP confirmation.
  - Upload endpoints.
  - Socket connection/auth events.

- [ ] Add security headers.
  - Use `helmet` or equivalent middleware.

- [ ] Add request body size limits.
  - Example: `express.json({ limit: '...' })`.

- [ ] Add startup environment validation.
  - Validate required env vars before starting the server.
  - Fail fast with a clear message if configuration is missing or invalid.

- [ ] Add `.env.example`.
  - Needed for integration and deployment.
  - Should list variable names but never real secrets.

- [ ] Rotate secrets if `.env` was ever committed.
  - `.env` is ignored now, but secrets may be exposed if previously committed.

## Database Gaps

- [ ] Add timestamps to main schemas.
  - Users.
  - Posts.
  - Comments.
  - Friendships.
  - Conversations.
  - Messages.

- [ ] Add required constraints where needed.
  - Example: `ownerId` on posts should likely be required.

- [ ] Add feed/query indexes.
  - Posts by owner.
  - Posts by created date.
  - Messages by conversation.
  - Friendships by requester/receiver/status.

- [ ] Add TTL index for blacklisted tokens.
  - `expiresAt` should automatically remove expired blacklist records.

- [ ] Prevent duplicate friendship requests.
  - Add logic and/or indexes.
  - Block self-requests.

- [ ] Prevent duplicate direct conversations.
  - Use canonical member ordering and a unique index.

- [ ] Improve account deletion cleanup.
  - Delete or anonymize related posts.
  - Delete comments.
  - Delete friendships.
  - Handle conversations/messages.
  - Delete all related S3 files, not only profile picture.

## Integration Gaps

- [ ] Add API documentation.
  - OpenAPI/Swagger or Postman collection.

- [ ] Standardize response shape.
  - Some routes use `SuccessResponse`.
  - Other routes return raw `{ message }`.

- [ ] Add route validators.
  - Sign-in.
  - Confirm email.
  - Profile update.
  - Renew signed URL.
  - Friendship request.
  - Friendship response.
  - Create group.
  - Post create/update/delete.
  - Comments.
  - Reacts.

- [ ] Add socket event validation.
  - `send-private-message`.
  - `get-chat-history`.
  - `send-group-message`.
  - `get-group-chat`.

- [ ] Add health check endpoint.
  - Example: `GET /health`.
  - Should confirm server is running and optionally database is reachable.

- [ ] Add deployment config.
  - Dockerfile.
  - Production environment docs.
  - Process manager config if needed.
  - CI workflow.

- [ ] Add tests.
  - Unit tests.
  - Integration tests.
  - Auth flow tests.
  - Upload flow tests.
  - Socket flow tests.
  - Repository/database behavior tests.

- [ ] Define frontend/client contract.
  - Auth header format.
  - Socket auth payload.
  - Upload field names.
  - Response schemas.
  - Error format.
  - Pagination format.

## Suggested Work Order

1. Add production scripts, `.env.example`, startup env validation, and health check.
2. Fix OTP expiry and token blacklist expiry.
3. Harden auth: verified-only login, refresh-token flow, JWT error handling, and rate limits.
4. Add validators for all existing routes and socket events.
5. Implement missing core modules: comments, reacts, profile update, post update/delete.
6. Harden uploads and S3 cleanup.
7. Add database timestamps, indexes, TTL indexes, and duplicate prevention.
8. Add API docs and frontend integration contract.
9. Add automated tests and CI checks.

