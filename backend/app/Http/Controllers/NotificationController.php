<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class NotificationController extends Controller
{
    public function getRecentApplications(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            
            $applications = Application::with(['customer', 'plan'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'customer_name' => $app->customer ? $app->customer->full_name : 'Unknown',
                        'plan_name' => $app->plan ? $app->plan->plan_name : 'Unknown',
                        'status' => $app->status,
                        'created_at' => $app->created_at,
                        'formatted_date' => $app->created_at->diffForHumans(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);
        } catch (\Exception $e) {
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notification count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function broadcastNewApplication($application)
    {
        try {
            $data = [
                'id' => $application->id,
                'customer_name' => $application->customer ? $application->customer->full_name : 'Unknown',
                'plan_name' => $application->plan ? $application->plan->plan_name : 'Unknown',
                'status' => $application->status,
                'created_at' => $application->created_at,
                'formatted_date' => $application->created_at->diffForHumans(),
            ];

            Http::post('http://127.0.0.1:3001/broadcast/new-application', $data);
        } catch (\Exception $e) {
            \Log::error('Failed to broadcast new application', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
