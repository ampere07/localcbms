<?php

namespace App\Http\Controllers;

use App\Models\ServiceOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ServiceOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        try {
            // Directly use the service_order table
            $tableName = 'service_orders';
            
            // Log that we're accessing the table
            Log::info('Accessing ' . $tableName . ' table');
            
            // Query the table
            $serviceOrders = DB::table('service_orders')->get();

            // Log the count of service orders found
            $count = count($serviceOrders);
            Log::info('Found ' . $count . ' service orders in database');
            
            // Check if we got any service orders
            if ($count === 0) {
                Log::info('No service orders found in database');
            } else {
                // Log the first service order for debugging
                Log::info('First service order example:', json_decode(json_encode($serviceOrders[0]), true));
            }

            return response()->json([
                'success' => true,
                'data' => $serviceOrders,
                'table' => $tableName,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching service orders: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service orders: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'Ticket_ID' => 'required|string|max:255|unique:service_orders,Ticket_ID',
                'Full_Name' => 'required|string|max:255',
                'Contact_Number' => 'required|string|max:255',
                'Full_Address' => 'required|string',
                'Concern' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }
            
            $serviceOrder = ServiceOrder::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Service order created successfully',
                'data' => $serviceOrder,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating service order: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        try {
            $serviceOrder = ServiceOrder::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $serviceOrder,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service order not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $serviceOrder = ServiceOrder::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'Ticket_ID' => 'string|max:255|unique:service_orders,Ticket_ID,' . $id . ',id',
                'Full_Name' => 'string|max:255',
                'Contact_Number' => 'string|max:255',
                'Full_Address' => 'string',
                'Concern' => 'string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }
            
            $serviceOrder->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Service order updated successfully',
                'data' => $serviceOrder,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $serviceOrder = ServiceOrder::findOrFail($id);
            $serviceOrder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Service order deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
