<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HandleCorsManually
{
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [
            'https://sync.atssfiber.ph',
            'https://backend.atssfiber.ph',
            'https://backend.atssfiber.ph/public',
            'https://www.atssfiber.ph',
            'https://atssfiber.ph',
        ];

        $origin = $request->header('Origin');

        if (in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, X-XSRF-TOKEN');
            header('Access-Control-Max-Age: 86400');
        }

        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200);
        }

        $response = $next($request);

        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-XSRF-TOKEN');
            $response->headers->set('Access-Control-Max-Age', '86400');
        }

        return $response;
    }
}
