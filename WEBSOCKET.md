# WebSocket Chat Documentation

Real-time chat system using Socket.IO with private 1:1 and group messaging capabilities.

---

## Table of Contents

1. [Connection and Handshake](#1-connection-and-handshake)
2. [Connection Lifecycle Events](#2-connection-lifecycle-events)
3. [Client to Server Events](#3-client-to-server-events)
4. [Server to Client Events](#4-server-to-client-events)
5. [Global Error Reference Codes](#5-global-error-reference-codes)
6. [Rate Limiting Rules](#6-rate-limiting-rules)
7. [Message Validation & Models](#7-message-validation--models)
8. [Room Management](#8-room-management)

---

## 1. Connection and Handshake

### Endpoint

```
ws://localhost:5000/socket.io/?EIO=4&transport=websocket
or
wss://your-api-domain.com/socket.io/?EIO=4&transport=websocket (production)
```

### Required Headers

```javascript
{
  "Authorization": "Bearer <JWT_ACCESS_TOKEN>"
}
```

The `Authorization` header must be passed in the Socket.IO handshake `auth` object.

### Client Connection Example

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    authorization: `Bearer ${accessToken}`, // JWT token from login
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on('connected', (data) => {
  console.log('Connected as:', data.user);
  // { user: { _id, firstName, lastName } }
});

socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

### Handshake Flow

1. **Client sends** JWT token in `socket.handshake.auth.authorization`
2. **Server validates**:
   - Rate limit on connection attempts
   - JWT token format (Bearer prefix + token)
   - JWT signature and expiration
   - Token payload contains valid userId
3. **Server stores** socket mapping: `userId → [socket.id, socket.id, ...]` (multi-tab support)
4. **Server emits** `connected` event with user data
5. **Connection established** → event handlers registered

### Handshake Failure Scenarios

| Scenario | Error Message |
|----------|---------------|
| Too many connection attempts | `"Too many socket connection attempts, please try again later"` |
| Missing auth token | `"Authentication token is required"` |
| Invalid token format | `"Invalid authentication token format"` |
| Expired/invalid JWT | `"Invalid or expired authentication token"` |
| Missing userId in payload | `"Invalid authentication token payload"` |

---

## 2. Connection Lifecycle Events

### Connected Event (Server → Client)

Emitted immediately after successful authentication.

```javascript
socket.on('connected', (data) => {
  console.log(data);
  // Output:
  // {
  //   user: {
  //     _id: "507f1f77bcf86cd799439011",
  //     firstName: "John",
  //     lastName: "Doe"
  //   }
  // }
});
```

### Disconnect Event (Server → Client)

Emitted when the connection is closed (gracefully or abruptly).

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected. Reason:', reason);
  // Possible reasons:
  // - "io server disconnect" (server disconnected client)
  // - "io client disconnect" (client disconnected)
  // - "transport close" (network issue)
  // - "transport error" (connection error)
});
```

### Reconnect Events

Socket.IO auto-reconnects with exponential backoff.

```javascript
socket.on('reconnect_attempt', () => {
  console.log('Attempting to reconnect...');
});

socket.on('reconnect', () => {
  console.log('Reconnected successfully');
  // Auto re-emits handlers, no manual reset needed
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnect failed:', error);
});

socket.on('reconnect_failed', () => {
  console.log('Permanent reconnection failure');
  // Trigger login/refresh token flow
});
```

### Connection State

```javascript
socket.connected // true/false
socket.disconnected // true/false
socket.id // unique socket id for this connection
```

---

## 3. Client to Server Events

### 3.1 Send Private Message

**Event:** `send-private-message`

**Payload:**
```typescript
{
  text: string,          // 1-2000 characters
  targetUserId: string   // MongoDB ObjectId of recipient
}
```

**Example:**
```javascript
socket.emit('send-private-message', {
  text: 'Hey, how are you?',
  targetUserId: '507f1f77bcf86cd799439011'
});
```

**Response:** Server broadcasts `message-sent` event to the conversation room (see Section 4.1)

**Errors:**
- Text length validation fails → `error` event
- Invalid targetUserId format → `error` event
- Rate limit exceeded → `error` event with "Too many messages" message
- Cannot message yourself → `error` event with "You cannot start a direct chat with yourself"

---

### 3.2 Get Chat History (Private)

**Event:** `get-chat-history`

**Payload:**
```typescript
string  // MongoDB ObjectId of the other user (targetUserId)
```

**Example:**
```javascript
socket.emit('get-chat-history', '507f1f77bcf86cd799439011');
```

**Response:** Server emits `chat-history` event with all messages (see Section 4.2)

**Behavior:**
- Automatically joins Socket.IO room for the conversation
- Creates conversation if it doesn't exist
- Fetches all messages from that conversation

**Errors:**
- Invalid ObjectId format → `error` event
- Rate limit exceeded → `error` event with "Too many chat history requests" message

---

### 3.3 Send Group Message

**Event:** `send-group-message`

**Payload:**
```typescript
{
  text: string,           // 1-2000 characters
  targetGroupId: string   // MongoDB ObjectId of group
}
```

**Example:**
```javascript
socket.emit('send-group-message', {
  text: 'Hello everyone!',
  targetGroupId: '607f1f77bcf86cd799439022'
});
```

**Response:** Server broadcasts `message-sent` event to all group members in the room

**Errors:**
- Not a member of the group → `error` event with "Group not found or you are not a member"
- Text validation fails → `error` event
- Invalid targetGroupId format → `error` event
- Rate limit exceeded → `error` event

---

### 3.4 Get Group Chat History

**Event:** `get-group-chat`

**Payload:**
```typescript
string  // MongoDB ObjectId of the group (targetGroupId)
```

**Example:**
```javascript
socket.emit('get-group-chat', '607f1f77bcf86cd799439022');
```

**Response:** Server emits `group-chat-history` event with all group messages (see Section 4.4)

**Behavior:**
- Validates membership before joining room
- Automatically joins Socket.IO room for the group
- Fetches all messages from that group

**Errors:**
- Invalid ObjectId format → `error` event
- Not a group member → `error` event with "Group not found or you are not a member"
- Rate limit exceeded → `error` event

---

## 4. Server to Client Events

### 4.1 Message Sent (Broadcast)

**Event:** `message-sent`

Emitted to all users in the conversation/group room after a message is created.

**Payload:**
```typescript
{
  _id: string,              // MongoDB ObjectId of message
  text: string,             // Message content
  conversationId: string,   // ObjectId of conversation/group
  senderId: string,         // ObjectId of sender
  createdAt: string         // ISO 8601 timestamp
}
```

**Example:**
```javascript
socket.on('message-sent', (message) => {
  console.log(`${message.senderId} sent: ${message.text}`);
  // Add to UI message list
});
```

**When Emitted:**
- After `send-private-message` is processed successfully
- After `send-group-message` is processed successfully
- To all users in the room (including sender)

---

### 4.2 Chat History (Private)

**Event:** `chat-history`

Direct response to `get-chat-history` event (only to requester).

**Payload:**
```typescript
Message[]

// where Message:
{
  _id: string,              // MongoDB ObjectId
  text: string,             // Message content
  conversationId: string,   // Conversation ObjectId
  senderId: string,         // Sender ObjectId
  createdAt: string         // ISO 8601 timestamp
}
```

**Example:**
```javascript
socket.on('chat-history', (messages) => {
  console.log(`Loaded ${messages.length} messages`);
  messages.forEach(msg => {
    console.log(`${msg.senderId}: ${msg.text}`);
  });
});
```

**When Emitted:**
- Only to the socket that requested it
- Contains all messages from that private conversation (sorted by creation date)

---

### 4.3 Connected (After Auth)

**Event:** `connected`

Emitted once after successful handshake/authentication.

**Payload:**
```typescript
{
  user: {
    _id: string,        // User MongoDB ObjectId
    firstName: string,
    lastName: string
  }
}
```

**Example:**
```javascript
socket.on('connected', (data) => {
  console.log(`Welcome, ${data.user.firstName}`);
});
```

---

### 4.4 Group Chat History

**Event:** `group-chat-history`

Direct response to `get-group-chat` event (only to requester).

**Payload:**
```typescript
Message[]

// where Message:
{
  _id: string,              // MongoDB ObjectId
  text: string,             // Message content
  conversationId: string,   // Group ObjectId
  senderId: string,         // Sender ObjectId
  createdAt: string         // ISO 8601 timestamp
}
```

**Example:**
```javascript
socket.on('group-chat-history', (messages) => {
  console.log(`Loaded ${messages.length} group messages`);
});
```

---

## 5. Global Error Reference Codes

All errors are emitted as `error` events with a `message` string.

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

### Error Messages Reference

| Category | Message | Cause | Action |
|----------|---------|-------|--------|
| **Auth** | `Authentication token is required` | Missing JWT in handshake | Ensure token is passed in `auth.authorization` |
| | `Invalid authentication token format` | Token doesn't start with "Bearer " | Verify token format: "Bearer <JWT>" |
| | `Invalid or expired authentication token` | JWT signature invalid or expired | Get new token via `/api/auth/refresh-token` |
| | `Invalid authentication token payload` | Token missing `_id` claim | Ensure token is from valid login |
| **Rate Limit** | `Too many socket connection attempts, please try again later` | >20 connection attempts in 5 mins | Wait 5 minutes before retrying |
| | `Too many messages, please slow down.` | >60 messages per minute | Throttle message sending |
| | `Too many chat history requests, please slow down.` | >30 history requests per minute | Wait before fetching history again |
| **Validation** | `Invalid socket event payload` | Event data doesn't match schema | Check payload format in Section 7 |
| **Chat Logic** | `You cannot start a direct chat with yourself` | `targetUserId` === own userId | Send to a different user |
| | `Group not found or you are not a member` | Group doesn't exist or user not member | Verify group exists and user is added |
| **Server** | `Socket event failed` | Unexpected server error | Check server logs, retry |

### Error Event Payload

```typescript
{
  message: string  // Human-readable error message
}
```

---

## 6. Rate Limiting Rules

Rate limiting is enforced per user and event type. Limits are tracked using Redis.

### Connection Attempt Limits

| Type | Limit | Duration | Key |
|------|-------|----------|-----|
| Socket connection attempts | 20 | 5 minutes | `socket.handshake.address \|\| socket.id` |

**Behavior:** If exceeded, connection is rejected with error `"Too many socket connection attempts, please try again later"`

### Message Event Limits

| Event | Limit | Duration | Key |
|-------|-------|----------|-----|
| `send-private-message` | 60 | 1 minute | `{userId}:send-private-message` |
| `send-group-message` | 60 | 1 minute | `{userId}:send-group-message` |

**Behavior:** If exceeded, client receives `error` event with `"Too many messages, please slow down."`

### Read Event Limits

| Event | Limit | Duration | Key |
|-------|-------|----------|-----|
| `get-chat-history` | 30 | 1 minute | `{userId}:get-chat-history` |
| `get-group-chat` | 30 | 1 minute | `{userId}:get-group-chat` |

**Behavior:** If exceeded, client receives `error` event with `"Too many chat history requests, please slow down."`

### Frontend Recommendations

- Debounce rapid message sends (wait 100ms between messages)
- Throttle history requests (once per 2 seconds per conversation)
- Show "too many requests" UI after error event
- Implement exponential backoff on rate limit errors

---

## 7. Message Validation & Models

### Text Field Validation

```typescript
text: {
  type: string,
  minLength: 1,
  maxLength: 2000,
  required: true
}
```

**Frontend Validation:**
```javascript
const validateMessage = (text) => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (text.length > 2000) {
    return { valid: false, error: 'Message must be under 2000 characters' };
  }
  return { valid: true };
};

const result = validateMessage(userInput);
if (!result.valid) {
  showError(result.error);
} else {
  socket.emit('send-private-message', {
    text: userInput.trim(),
    targetUserId: recipient._id
  });
}
```

### ObjectId Validation

Both `targetUserId` and `targetGroupId` must be valid MongoDB ObjectIds (24-character hex string).

**Frontend Validation:**
```javascript
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

if (!isValidObjectId(targetUserId)) {
  showError('Invalid user ID');
  return;
}
```

### Message Model (Response)

```typescript
interface Message {
  _id: string,              // MongoDB ObjectId (unique)
  text: string,             // 1-2000 characters
  conversationId: string,   // ObjectId of conversation/group
  senderId: string,         // ObjectId of user who sent it
  createdAt: string,        // ISO 8601 timestamp (UTC)
  updatedAt?: string        // ISO 8601 timestamp (UTC)
}
```

**Example Message Object:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "text": "Hey, how are you?",
  "conversationId": "507f1f77bcf86cd799439012",
  "senderId": "507f1f77bcf86cd799439013",
  "createdAt": "2026-06-11T01:08:00.000Z"
}
```

### Conversation Model (Inferred)

```typescript
interface Conversation {
  _id: string,                    // MongoDB ObjectId
  type: 'direct' | 'group',       // Conversation type
  members: string[],              // Array of member ObjectIds
  directKey?: string,             // For direct chats: "userId1:userId2"
  lastMessage?: Message,          // Latest message
  updatedAt: string              // ISO 8601 timestamp
}
```

---

## 8. Room Management

### How Rooms Work

Socket.IO rooms are virtual groupings of sockets. Messages broadcast to a room reach all connected users in that room.

### Private Chat Rooms

**Room ID:** Same as `conversationId` (MongoDB ObjectId)

**Participants:** All sockets of users in the conversation (typically 2 users)

**Room Lifecycle:**
1. User A calls `get-chat-history` with User B's ID
2. Server checks/creates conversation record
3. Server emits `socket.join(conversationId)`
4. User A's socket is now in the room
5. When User A sends `send-private-message`, message is broadcast to all users in that room
6. If User B also calls `get-chat-history`, User B joins the same room
7. Both users now receive `message-sent` events

**Example:**
```javascript
// User A
socket.emit('get-chat-history', userBId);
// → joins room: "507f1f77bcf86cd799439012"

// User B (same conversation)
socket.emit('get-chat-history', userAId);
// → joins room: "507f1f77bcf86cd799439012"

// User A sends message
socket.emit('send-private-message', {
  text: 'Hello',
  targetUserId: userBId
});
// → Both User A and User B receive 'message-sent' event
```

### Group Chat Rooms

**Room ID:** Same as `groupId` (MongoDB ObjectId)

**Participants:** All sockets of users who are group members

**Room Lifecycle:**
1. User A calls `get-group-chat` with groupId
2. Server validates User A is a group member
3. Server emits `socket.join(groupId)`
4. User A's socket is now in the room
5. Any group member sending `send-group-message` broadcasts to all users in the room
6. Only group members can join the room

**Example:**
```javascript
// User A (group member)
socket.emit('get-group-chat', groupId);
// → joins room: "607f1f77bcf86cd799439022"

// User B (same group member)
socket.emit('get-group-chat', groupId);
// → joins room: "607f1f77bcf86cd799439022"

// User A sends group message
socket.emit('send-group-message', {
  text: 'Hello everyone!',
  targetGroupId: groupId
});
// → All group members in room receive 'message-sent' event
```

### Multi-Tab Support

The server tracks multiple connections per user using `connectedSockets` map:

```typescript
connectedSockets = {
  userId1: [socketId1, socketId2, socketId3],  // 3 tabs open
  userId2: [socketId4],                         // 1 tab open
}
```

**Behavior:**
- Each browser tab/window gets its own socket connection
- User A can have `send-private-message` open in one tab and `get-group-chat` in another
- Both tabs receive the same `message-sent` events (since both are in the room)
- Closing a tab triggers `disconnect` for that socket only
- Other tabs remain connected

**Frontend Handling:**
```javascript
// Tab 1
socket1.on('message-sent', (msg) => {
  updateMessageList(msg);
});

// Tab 2
socket2.on('message-sent', (msg) => {
  updateMessageList(msg);
});

// Both tabs update independently, no sync needed
```

### Direct Chat Auto-Creation

When you call `get-chat-history` with another user:
- If no conversation exists, the server creates one automatically
- Conversation is created with type `direct` and both user IDs
- No explicit "create conversation" API needed

**Important:** This happens transparently; frontend doesn't need to handle it.

### Group Membership Validation

When you call `get-group-chat` or `send-group-message`:
- Server validates you are a member of the group
- If not a member, `error` event is emitted
- You cannot join a group room you're not a member of

**Frontend:** Handle membership errors gracefully:
```javascript
socket.on('error', (error) => {
  if (error.message.includes('Group not found')) {
    showAlert('You are not a member of this group');
    navigateBack();
  }
});
```

---

## Quick Reference: Frontend Integration Example

```typescript
import { io } from 'socket.io-client';

class ChatClient {
  private socket: Socket;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.userId = userId;
    this.socket = io('http://localhost:5000', {
      auth: { authorization: `Bearer ${accessToken}` },
    });

    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on('connected', (data) => {
      console.log('Connected as:', data.user.firstName);
    });

    this.socket.on('message-sent', (message) => {
      this.onMessageReceived(message);
    });

    this.socket.on('chat-history', (messages) => {
      this.onHistoryLoaded(messages);
    });

    this.socket.on('group-chat-history', (messages) => {
      this.onGroupHistoryLoaded(messages);
    });

    this.socket.on('error', (error) => {
      console.error('Chat error:', error.message);
      this.onError(error.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected');
    });
  }

  sendPrivateMessage(targetUserId: string, text: string) {
    if (text.length < 1 || text.length > 2000) {
      console.error('Text must be 1-2000 characters');
      return;
    }
    this.socket.emit('send-private-message', { text, targetUserId });
  }

  fetchChatHistory(targetUserId: string) {
    this.socket.emit('get-chat-history', targetUserId);
  }

  sendGroupMessage(targetGroupId: string, text: string) {
    if (text.length < 1 || text.length > 2000) {
      console.error('Text must be 1-2000 characters');
      return;
    }
    this.socket.emit('send-group-message', { text, targetGroupId });
  }

  fetchGroupHistory(targetGroupId: string) {
    this.socket.emit('get-group-chat', targetGroupId);
  }

  private onMessageReceived(message: any) {
    // Update UI with new message
  }

  private onHistoryLoaded(messages: any[]) {
    // Load chat history into UI
  }

  private onGroupHistoryLoaded(messages: any[]) {
    // Load group history into UI
  }

  private onError(message: string) {
    // Show error to user
  }

  disconnect() {
    this.socket.disconnect();
  }
}

export default ChatClient;
```

---

## Support & Troubleshooting

### Common Issues

**Connection fails with "Invalid or expired authentication token"**
- Ensure JWT token is fresh (not expired)
- Get new token via `/api/auth/refresh-token`
- Pass token in correct format: `Bearer <JWT>`

**Messages not appearing**
- Check both users are in the same room
- Verify WebSocket connection is active: `socket.connected === true`
- Check browser console for rate limit errors

**Disconnect on page refresh**
- Normal behavior; Socket.IO auto-reconnects with new token if needed
- Consider using persistent authentication strategy

**Rate limit errors**
- Implement client-side debouncing/throttling
- Don't send >60 messages per minute per user
- Wait before retrying after rate limit error

---

## Glossary

- **Socket**: Individual connection between client and server
- **Room**: Virtual grouping of sockets; broadcast to all sockets in a room
- **Conversation**: Chat session between users (private 1:1 or group)
- **JWT**: JSON Web Token for authentication
- **ObjectId**: MongoDB's unique identifier (24-character hex string)
- **EIO**: Engine.IO version (protocol version for Socket.IO)

