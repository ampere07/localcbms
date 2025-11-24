# Configuration Summary - Localhost URLs

## Backend Configuration (Laravel)

### Environment Variables (.env)
```
APP_URL=http://localhost:8000
SESSION_DOMAIN=localhost
SESSION_SECURE_COOKIE=false
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000
```

### CORS Configuration (config/cors.php)
```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://localhost:8000',
],
'supports_credentials' => true,
```

### Sanctum Configuration (config/sanctum.php)
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost:3000,localhost:8000')),
```

### Session Configuration (config/session.php)
```php
'domain' => env('SESSION_DOMAIN'), // localhost
'secure' => env('SESSION_SECURE_COOKIE'), // false
'same_site' => 'lax',
```

## Frontend Configuration (React)

### Environment Variables (.env)
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### API Client Configuration (src/config/api.ts)
- Uses centralized `apiClient` from axios
- Base URL: `process.env.REACT_APP_API_BASE_URL`
- CSRF token handling enabled
- Credentials support: `withCredentials: true`

## Updated Services

All frontend services now use the centralized `apiClient`:

1. **invoiceService.ts** - Uses `apiClient` from config/api
2. **staggeredInstallationService.ts** - Uses `apiClient` from config/api
3. **soaService.ts** - Uses `apiClient` from config/api
4. **transactionService.ts** - Uses `apiClient` from config/api

## URL Structure

### Backend
- API Base: `http://localhost:8000`
- API Routes: `http://localhost:8000/api/*`
- CSRF Cookie: `http://localhost:8000/sanctum/csrf-cookie`

### Frontend
- App Base: `http://localhost:3000`
- API Calls: All routed through `http://localhost:8000/api`

## Key Features

1. **Centralized Configuration**: Change URLs in one place (.env files)
2. **CSRF Protection**: Automatic token handling via Sanctum
3. **CORS Enabled**: Properly configured for localhost:3000 ↔ localhost:8000
4. **Credentials Support**: Cookies and authentication work across origins
5. **No Hardcoded URLs**: All services use environment variables

## Development Server URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Endpoint**: http://localhost:8000/api

## Notes

- Database host (127.0.0.1) is separate from application URLs and correct
- Redis/Memcached hosts (127.0.0.1) are for local services only
- All application-level communication uses localhost (not IP addresses)
