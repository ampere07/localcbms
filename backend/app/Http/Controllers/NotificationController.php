<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function getRecentApplications(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            
            $applications = Application::orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'customer_name' => $app->full_name,
                        'plan_name' => $app->desired_plan ?? 'No Plan Selected',
                        'status' => $app->status ?? 'Pending',
                        'created_at' => $app->created_at,
                        'formatted_date' => $app->created_at->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch notifications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getUnreadCount(Request $request)
    {
        try {
            $count = Application::where('created_at', '>=', now()->subDay())
                ->count();

            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch notification count', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notification count',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
