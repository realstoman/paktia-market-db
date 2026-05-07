# Mobile API Integration Note

## Local Testing

Protected `/api/v1/*` routes now require these headers:

```http
X-App-Key: local-ios-app-key
X-App-Platform: ios
```

If you open a protected URL directly in the browser, you will get:

```json
{ "message": "Unauthorized app client." }
```

That is expected because the browser URL bar does not send the required headers.

### 1. Local `.env`

Add these values to your local `.env`:

```env
MOBILE_APP_KEY_IOS=local-ios-app-key
MOBILE_APP_KEY_ANDROID=local-android-app-key
FIREBASE_PROJECT_ID=your-firebase-project-id
MOBILE_FIREBASE_STUB_MODE=true
```

Then run:

```bash
php artisan config:clear
```

### 2. Test with `curl`

Catalog:

```bash
curl -H "X-App-Key: local-ios-app-key" \
  -H "X-App-Platform: ios" \
  http://127.0.0.1:8000/api/v1/products
```

Guest session:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-App-Key: local-ios-app-key" \
  -H "X-App-Platform: ios" \
  -d '{"device_id":"local-device-1","platform":"ios","app_version":"1.0.0"}' \
  http://127.0.0.1:8000/api/v1/guest/session
```

Firebase sync in local stub mode:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-App-Key: local-ios-app-key" \
  -H "X-App-Platform: ios" \
  -H "Authorization: Bearer stub:test-user-001" \
  -d '{"provider":"google","name":"Test User","email":"test@example.com"}' \
  http://127.0.0.1:8000/api/v1/auth/firebase/sync
```

### 3. Browser testing

If you want to test in the browser instead of `curl` or Postman:

- use a browser header extension such as ModHeader
- add:
    - `X-App-Key: local-ios-app-key`
    - `X-App-Platform: ios`

For authenticated routes, also add:

- `Authorization: Bearer stub:test-user-001`

## Security Note

1. `X-App-Key` is an app-client header, not a real secret.
   It is used to gate API access and identify the calling app.

2. Do not rely on a secret embedded in Flutter APK or browser JavaScript.
   Any client-side secret can eventually be extracted.

3. End-user authentication is handled by Firebase ID tokens.
   After login with Google / Apple / email-password, the app must send:

```http
Authorization: Bearer <firebase-id-token>
```

4. The backend verifies the Firebase token, reads the Firebase user, and stores or updates the matching record in `clients`.

5. For local development only, `MOBILE_FIREBASE_STUB_MODE=true` allows tokens like:

```http
Authorization: Bearer stub:test-user-001
```

Do not use stub mode in production.

## Route Guide

### App-authenticated catalog routes

Required headers:

```http
X-App-Key: ...
X-App-Platform: ...
```

Routes:

- `GET /api/v1/products`
- `GET /api/v1/products/{product}`
- `GET /api/v1/products/categories`
- `GET /api/v1/products/categories/{category}`
- `GET /api/v1/products/categories/{category}/products`
- `GET /api/v1/products/types`
- `GET /api/v1/products/types/{type}`
- `GET /api/v1/products/types/{type}/products`
- `GET /api/v1/products/top-ordered-dishes`
- `GET /api/v1/banners`
- `GET /api/v1/digital-tablet-menu/products`

### Guest session routes

Required headers:

```http
X-App-Key: ...
X-App-Platform: ...
```

Routes:

- `POST /api/v1/guest/session`

Returns:

- `guest_token`

### Firebase sync

Required headers:

```http
X-App-Key: ...
X-App-Platform: ...
Authorization: Bearer <firebase-id-token>
```

Optional header:

```http
X-Guest-Token: <guest-token>
```

Route:

- `POST /api/v1/auth/firebase/sync`

Purpose:

- verify Firebase user
- create or update local `clients` row
- merge guest cart into client cart if needed

### Cart routes

Use one of these:

- guest mode:
    - `X-Guest-Token`
- signed-in mode:
    - `Authorization: Bearer <firebase-id-token>`

Required app headers:

```http
X-App-Key: ...
X-App-Platform: ...
```

Routes:

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{cartItem}`
- `DELETE /api/v1/cart/items/{cartItem}`

### Authenticated client routes

Required headers:

```http
X-App-Key: ...
X-App-Platform: ...
Authorization: Bearer <firebase-id-token>
```

Routes:

- `GET /api/v1/me`
- `POST /api/v1/checkout`
- `GET /api/v1/me/orders`
- `GET /api/v1/me/orders/{order}`
- `GET /api/v1/me/orders/{order}/status`

## Recommended Mobile App Flow

1. App loads catalog using `/api/v1/products` and related catalog routes.
2. If user is anonymous, app creates `POST /api/v1/guest/session`.
3. Guest adds/removes cart items using `X-Guest-Token`.
4. User signs in with Firebase.
5. App calls `POST /api/v1/auth/firebase/sync`.
6. Backend stores the user in `clients`.
7. Guest cart is merged into client cart.
8. Signed-in user continues with `/api/v1/cart`, `/api/v1/checkout`, `/api/v1/me`, and `/api/v1/me/orders`.
