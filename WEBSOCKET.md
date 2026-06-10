# WebSocket Chat Documentation

Real-time chat system using Socket.IO for private 1:1 and group messaging.

---

## Table of Contents

1. [Connection and Handshake](#1-connection-and-handshake)
2. [Connection Lifecycle](#2-connection-lifecycle)
3. [Client Events (Emit)](#3-client-events-emit)
4. [Server Events (Listen)](#4-server-events-listen)
5. [Error Codes](#5-error-codes)
6. [Rate Limits](#6-rate-limits)
7. [Payload Specifications](#7-payload-specifications)

---

## 1. Connection and Handshake

### URL
```
ws://localhost:5000 (local)
wss://api.domain.com (production)
```

### Connection Setup

Pass JWT token in handshake auth:
```typescript
const socket = io(URL, {
  auth: { authorization: 'Bearer YOUR_JWT_TOKEN' }
});
```

### After Connection

Listen for `connected` event to confirm success:
```typescript
socket.on('connected', (data) => {
  // { user: { _id, firstName, lastName } }
});
```

### Connection Errors

If auth fails, you'll get error before `connected`:
- Missing token → `"Authentication token is required"`
- Invalid format → `"Invalid authentication token format"`
- Expired token → `"Invalid or expired authentication token"`
- Too many attempts → `"Too many socket connection attempts, please try again later"`

---

## 2. Connection Lifecycle

| Event | When | What to Do |
|-------|------|-----------|
| `connected` | After successful auth | Save user info, UI ready |
| `disconnect` | Connection lost | Hide real-time features, show offline |
| `reconnect` | Auto-reconnect succeeded | Refresh data |
| `error` | Any error | Show error to user |

```typescript
socket.on('connected', (data) => {
  // Ready to chat
});

socket.on('disconnect', () => {
  // Waiting for reconnect (auto)
});

socket.on('error', (error) => {
  // { message: 'error message' }
});
```

---

## 3. Client Events (Emit)

Naming convention (recommended):
- Private messages: `private.message.send` (client) → `private.message.sent` (server)
- Group messages: `group.message.send` (client) → `group.message.sent` (server)
- Chat history: `private.chat.history` / `group.chat.history` (server responses)

Asynchronous acknowledgment pattern (preferred):
- Emit with an ack callback: `socket.emit(event, payload, (ack) => { /* ack: { success, message, data } */ })`
- Use the ack for immediate success/failure of the action; the server will still broadcast the resulting message event to room members.

### Send Private Message

**Emit event:**
```typescript
socket.emit('private.message.send', {
  text: 'Your message',
  targetUserId: 'recipient_id'
}, (ack) => {
  // ack: { success: boolean, message?: string, data?: { messageId } }
});
```

**Listen for broadcast:**
```typescript
socket.on('private.message.sent', (message) => {
  // New message in this private conversation
});
```

**Rules:**
- Text: 1-2000 characters
- targetUserId: Valid user ObjectId
- Rate limit: 60 per minute

---

### Get Private Chat History

**Emit event:**
```typescript
socket.emit('private.chat.request', { targetUserId: 'other_user_id' }, (ack) => {
  // ack.data.messages -> array of messages (optional if server instead emits 'private.chat.history')
});
```

**Listen for response:**
```typescript
socket.on('private.chat.history', (messages) => {
  // Array of messages
});
```

**Rules:**
- Auto-joins conversation room
- Auto-creates conversation if doesn't exist
- Rate limit: 30 per minute

---

### Send Group Message

**Emit event:**
```typescript
socket.emit('group.message.send', {
  text: 'Your message',
  targetGroupId: 'group_id'
}, (ack) => {
  // ack: { success, message, data }
});
```

**Listen for broadcast:**
```typescript
socket.on('group.message.sent', (message) => {
  // New message in this group
});
```

**Rules:**
- Text: 1-2000 characters
- targetGroupId: Valid group ObjectId
- Must be group member
- Rate limit: 60 per minute

---

### Get Group Chat History

**Emit event:**
```typescript
socket.emit('group.chat.request', { groupId: 'group_id' }, (ack) => {
  // ack.data.messages or server emits 'group.chat.history'
});
```

**Listen for response:**
```typescript
socket.on('group.chat.history', (messages) => {
  // Array of group messages
});
```

**Rules:**
- Auto-joins group room
- Must be group member
- Rate limit: 30 per minute

---

Note: If your current server uses legacy names (`send-private-message`, `message-sent`), the frontend can map the new names to the server names; updating server to the distinct naming is recommended for clarity.

## 4. Server Events (Listen)

Distinct server event names (recommended):
- `private.message.sent` — broadcast to private conversation participants
- `group.message.sent` — broadcast to group members
- `private.chat.history` / `group.chat.history` — history responses (or use ack payload)
- `error` — global error

### private.message.sent

Broadcast to all users in the private conversation room.

```typescript
socket.on('private.message.sent', (message) => {
  // { _id, text, conversationId, senderId, createdAt }
  // Add to UI message list
});
```

Emitted after the server processes `private.message.send`. The server also returns an ack to the emitter callback: `{ success: boolean, message?: string, data?: { messageId } }`

---

### group.message.sent

Broadcast to all users in the group room.

```typescript
socket.on('group.message.sent', (message) => {
  // { _id, text, conversationId, senderId, createdAt }
});
```

Emitted after the server processes `group.message.send`. The emitter receives an ack callback as above.

---

### private.chat.history

Response to `private.chat.request` (only to requester). May be returned via ack or emitted as this event.

```typescript
socket.on('private.chat.history', (messages) => {
  // Array of message objects
});
```

---

### group.chat.history

Response to `group.chat.request` (only to requester). May be returned via ack or emitted as this event.

```typescript
socket.on('group.chat.history', (messages) => {
  // Array of message objects
});
```

---

### error

Emitted on any error.

```typescript
socket.on('error', (error) => {
  // { message: 'error description' }
  // Show to user
});
```


Acknowledgment pattern summary:
- Use ack callbacks for immediate action result (create succeeded/failed).
- Server still broadcasts the `.sent` event to room members to deliver the created message.
- Ack payload shape: `{ success: boolean, message?: string, data?: any }`.

---

## 5. Error Codes

All errors emit to `error` event with message string.

| Error Message | Cause | Action |
|---------------|-------|--------|
| `Authentication token is required` | Missing JWT | Pass token in auth |
| `Invalid authentication token format` | Wrong format | Use "Bearer TOKEN" |
| `Invalid or expired authentication token` | Token expired/invalid | Refresh token |
| `Invalid authentication token payload` | Bad token claim | Re-login |
| `Too many socket connection attempts, please try again later` | >20 attempts in 5m | Wait 5 mins |
| `Too many messages, please slow down.` | >60 msgs/min | Throttle sending |
| `Too many chat history requests, please slow down.` | >30 requests/min | Wait before fetching |
| `Invalid socket event payload` | Bad payload format | Check payload schema |
| `You cannot start a direct chat with yourself` | Self-message attempt | Send to different user |
| `Group not found or you are not a member` | Not member or no group | Verify group exists/membership |
| `Socket event failed` | Server error | Retry or check server logs |

---

## 6. Rate Limits

All limits reset every minute.

| Event | Limit | Duration |
|-------|-------|----------|
| Socket connections | 20 | 5 minutes |
| `send-private-message` | 60 | 1 minute |
| `send-group-message` | 60 | 1 minute |
| `get-chat-history` | 30 | 1 minute |
| `get-group-chat` | 30 | 1 minute |

Hitting limit triggers `error` event: "Too many messages, please slow down."

---

## 7. Detailed JSON Payload Specifications

A. Ack Format (used in emitter callback)
```json
{
  "success": true,
  "message": "Optional human message",
  "data": { /* optional payload e.g. { messageId: '...' } */ }
}
```

B. Send Private Message (client → server)
```json
{
  "text": "string (1-2000)",
  "targetUserId": "string (24-hex ObjectId)"
}
```

C. Private Message Sent (server → room)
```json
{
  "_id": "string",
  "text": "string",
  "conversationId": "string",
  "senderId": "string",
  "createdAt": "ISO8601 string",
  "metadata": { /* optional, e.g., edited: false */ }
}
```

D. Send Group Message (client → server)
```json
{
  "text": "string (1-2000)",
  "targetGroupId": "string (24-hex ObjectId)"
}
```

E. Group Message Sent (server → room)
Same schema as C.

F. Chat History Response (server → requester or ack.data)
```json
{
  "messages": [ /* array of Message objects (see C) */ ],
  "cursor": "optional pagination cursor string",
  "hasMore": true
}
```

G. Error Event
```json
{ "message": "human readable error" }
```

Validation rules summary:
- text: required, trimmed length 1-2000
- targetUserId/targetGroupId: 24-hex ObjectId
- Private chats auto-create; group requires membership

Frontend should:
- Send payloads matching the schemas above
- Prefer ack callback for immediate success/failure handling
- Rely on `.sent` broadcasts to receive created messages and append to UI

---

## 8. Room Management

**Private Chats:** Auto-join room using conversationId when calling `get-chat-history`. Auto-creates conversation if needed.

**Group Chats:** Join room using groupId when calling `get-group-chat`. Requires group membership.

**Multi-Tab:** Each tab gets separate socket connection but receives same room messages. Closing one tab doesn't affect others.

**Broadcasting:** All users in a room receive `message-sent` events broadcast by any room member.

