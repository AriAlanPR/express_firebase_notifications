# Firebase notification test server

Small Express server used to send Firebase Cloud Messaging test notifications.

## Firebase credentials

Set `FIREBASE_PROD` in `.env` with the JSON filename located under `firebase_config/`:

```env
FIREBASE_PROD=your-service-account-file.json
```

## Run

```bash
npm install
npm start
```

The server listens on `PORT` or `3000` by default.

## Routers

- `/btrack`: existing BTrack-style test notifications.
- `/sii`: SII Mobile notification payload emulator.

The Firebase Admin SDK is initialized once in `services/firebaseAdmin.js` and shared by both routers.

## BTrack test notification

```http
POST /btrack
```

Body:

```json
{
    "deviceId": "FCM_DEVICE_TOKEN"
}
```

## Enable SII push notifications in TraficoWeb

Before sending an emulated SII notification, the device token must be registered in TraficoWeb for the authenticated user. This is the same request SII Mobile sends after login.

Use a valid Passport bearer token from the user you want to test with:

```bash
export TRAFICO_BASE_URL="https://your-traficoweb-host"
export PASSPORT_TOKEN="USER_PASSPORT_TOKEN"
export FCM_DEVICE_TOKEN="DEVICE_FCM_TOKEN"
```

You can call TraficoWeb directly with `curl`, or use this project's helper endpoints to send the same requests with custom data.

### Helper endpoint: register device token in TraficoWeb

```http
POST /sii/traficoweb/register-token
```

Body:

```json
{
    "traficoBaseUrl": "https://your-traficoweb-host",
    "passportToken": "USER_PASSPORT_TOKEN",
    "fcmToken": "DEVICE_FCM_TOKEN",
    "deviceType": "ios"
}
```

`traficoBaseUrl` and `passportToken` may also be provided through `TRAFICO_BASE_URL` and `TRAFICO_PASSPORT_TOKEN` in `.env`. The token can be sent as `fcmToken`, `fcm_token`, `deviceId`, or `token`.

Curl:

```bash
curl -X POST http://localhost:3000/sii/traficoweb/register-token \
    -H "Content-Type: application/json" \
    -d '{
        "traficoBaseUrl": "'"$TRAFICO_BASE_URL"'",
        "passportToken": "'"$PASSPORT_TOKEN"'",
        "fcmToken": "'"$FCM_DEVICE_TOKEN"'",
        "deviceType": "ios"
    }'
```

### Helper endpoint: remove device token in TraficoWeb

```http
POST /sii/traficoweb/remove-token
```

Body:

```json
{
    "traficoBaseUrl": "https://your-traficoweb-host",
    "passportToken": "USER_PASSPORT_TOKEN",
    "fcmToken": "DEVICE_FCM_TOKEN"
}
```

Curl:

```bash
curl -X POST http://localhost:3000/sii/traficoweb/remove-token \
    -H "Content-Type: application/json" \
    -d '{
        "traficoBaseUrl": "'"$TRAFICO_BASE_URL"'",
        "passportToken": "'"$PASSPORT_TOKEN"'",
        "fcmToken": "'"$FCM_DEVICE_TOKEN"'"
    }'
```

### Helper endpoint: send a custom request to TraficoWeb

Use this when you want this project to call a TraficoWeb endpoint with fake or custom data. This is useful for testing endpoints that trigger notification-related behavior in TraficoWeb without writing a new route in this helper for every case.

```http
POST /sii/traficoweb/request
```

Body:

```json
{
    "traficoBaseUrl": "https://your-traficoweb-host",
    "passportToken": "USER_PASSPORT_TOKEN",
    "method": "POST",
    "path": "/v2/auth/some/traficoweb/path",
    "body": {
        "custom": "value"
    }
}
```

`traficoBaseUrl` and `passportToken` may also be provided through `TRAFICO_BASE_URL` and `TRAFICO_PASSPORT_TOKEN` in `.env`. `passportToken` is optional for TraficoWeb routes that do not require authentication.

Curl:

```bash
curl -X POST http://localhost:3000/sii/traficoweb/request \
    -H "Content-Type: application/json" \
    -d '{
        "traficoBaseUrl": "'"$TRAFICO_BASE_URL"'",
        "passportToken": "'"$PASSPORT_TOKEN"'",
        "method": "POST",
        "path": "/v2/auth/some/traficoweb/path",
        "body": {
            "custom": "value"
        }
    }'
```

### Register device token

```http
PUT /v2/auth/sii/fcm-token
```

```bash
curl -X PUT "$TRAFICO_BASE_URL/v2/auth/sii/fcm-token" \
    -H "Authorization: Bearer $PASSPORT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "fcm_token": "'"$FCM_DEVICE_TOKEN"'",
        "device_type": "ios"
    }'
```

Use `android` or `ios` for `device_type`.

Expected result: TraficoWeb stores the token for the authenticated user. If the same token already exists, TraficoWeb updates the association instead of creating a duplicate.

### Remove device token

This emulates logout cleanup from SII Mobile.

```http
DELETE /v2/auth/sii/fcm-token
```

```bash
curl -X DELETE "$TRAFICO_BASE_URL/v2/auth/sii/fcm-token" \
    -H "Authorization: Bearer $PASSPORT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "fcm_token": "'"$FCM_DEVICE_TOKEN"'"
    }'
```

Expected result: TraficoWeb removes the token if it belongs to the authenticated user. The request still succeeds if the token was already absent.

### Suggested test order

1. Get the FCM token from the SII Mobile device or debug logs.
2. Register it in TraficoWeb with `PUT /v2/auth/sii/fcm-token`.
3. Send one of the emulator payloads from this project using `/sii/*`.
4. Confirm the device receives the notification and SII Mobile stores it with the expected `actionType`.
5. Remove the token with `DELETE /v2/auth/sii/fcm-token` when the test is finished.

## SII Mobile notification emulator

These endpoints emulate the payload shape currently sent by TraficoWeb to SII Mobile.

All endpoints accept the same JSON body:

```json
{
    "deviceId": "FCM_DEVICE_TOKEN",
    "actionPayload": "12345",
    "perfilId": "10"
}
```

`deviceId` is required. `token` and `fcmToken` are also accepted as aliases. `actionPayload`, `perfilId`, `title`, and `body` are optional.

The generated FCM data payload includes:

```json
{
    "id": "sii-test-user",
    "title": "Solicitud Rechazada",
    "body": "Tu solicitud de clasificación fue descartada.",
    "type": "sii_notification",
    "timestamp": "2026-06-10T00:00:00.000Z",
    "actionType": "classification_request_rejected",
    "actionPayload": "12345",
    "perfilId": "10"
}
```

### Preset endpoints

```http
POST /sii/classification-request-rejected
POST /sii/traffic-entry-created
POST /sii/communication-created
POST /sii/pedimento-created
```

These endpoints send a notification directly to the supplied mobile device token, without calling TraficoWeb. They are useful to validate how SII Mobile receives, stores, filters, and navigates each supported notification type.

### Generic endpoint

```http
POST /sii/send
```

This endpoint sends a notification directly to the mobile device using Firebase Admin. It does not call TraficoWeb.

Example:

```json
{
    "deviceId": "FCM_DEVICE_TOKEN",
    "actionType": "classification_request_rejected",
    "actionPayload": "12345",
    "perfilId": "10"
}
```

Valid `actionType` values:

- `classification_request_rejected`
- `traffic_entry_created`
- `communication_created`
- `pedimento_created`

You can list the supported presets with:

```http
GET /sii/presets
```

### Curl examples

```bash
curl -X POST http://localhost:3000/sii/classification-request-rejected \
    -H "Content-Type: application/json" \
    -d '{
        "deviceId": "FCM_DEVICE_TOKEN",
        "actionPayload": "12345",
        "perfilId": "10"
    }'
```

```bash
curl -X POST http://localhost:3000/sii/send \
    -H "Content-Type: application/json" \
    -d '{
        "deviceId": "FCM_DEVICE_TOKEN",
        "actionType": "traffic_entry_created",
        "actionPayload": "BOD-12345",
        "perfilId": "10"
    }'
```
