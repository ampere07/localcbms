<?php

namespace App\Http\Controllers;

use App\Models\JobOrder;
use App\Models\Customer;
use App\Models\TechnicalDetail;
use App\Models\BillingAccount;
use App\Models\Application;
use App\Models\ModemRouterSN;
use App\Models\ContractTemplate;
use App\Models\Port;
use App\Models\VLAN;
use App\Models\LCPNAP;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

use App\Services\GoogleDriveService;
use App\Models\RadiusConfig;

class JobOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            \Log::info('Accessing job_orders table');
            
            $query = JobOrder::with('application');
            
            if ($request->has('assigned_email')) {
                $assignedEmail = $request->query('assigned_email');
                \Log::info('Filtering job orders by assigned_email: ' . $assignedEmail);
                $query->where('assigned_email', $assignedEmail);
            }
            
            $jobOrders = $query->get();

            \Log::info('Found ' . $jobOrders->count() . ' job orders in database');
            
            if ($jobOrders->isEmpty()) {
                \Log::info('No job orders found in database');
            } else {
                \Log::info('First job order example:', $jobOrders->first()->toArray());
            }

            $formattedJobOrders = $jobOrders->map(function ($jobOrder) {
                $application = $jobOrder->application;
                
                return [
                    'id' => $jobOrder->id,
                    'JobOrder_ID' => $jobOrder->id,
                    'application_id' => $jobOrder->application_id,
                    'Timestamp' => $jobOrder->timestamp ? $jobOrder->timestamp->format('Y-m-d H:i:s') : null,
                    'Installation_Fee' => $jobOrder->installation_fee,
                    'Billing_Day' => $jobOrder->billing_day,
                    'Onsite_Status' => $jobOrder->onsite_status,
                    'billing_status_id' => $jobOrder->billing_status_id,
                    'Status_Remarks' => $jobOrder->status_remarks,
                    'Assigned_Email' => $jobOrder->assigned_email,
                    'Contract_Template' => $jobOrder->contract_link,
                    'contract_link' => $jobOrder->contract_link,
                    'Modified_By' => $jobOrder->created_by_user_email,
                    'Modified_Date' => $jobOrder->updated_at ? $jobOrder->updated_at->format('Y-m-d H:i:s') : null,
                    'Username' => $jobOrder->username,
                    'group_name' => $jobOrder->group_name,
                    'pppoe_username' => $jobOrder->pppoe_username,
                    'pppoe_password' => $jobOrder->pppoe_password,
                    
                    'date_installed' => $jobOrder->date_installed,
                    'usage_type' => $jobOrder->usage_type,
                    'connection_type' => $jobOrder->connection_type,
                    'router_model' => $jobOrder->router_model,
                    'modem_router_sn' => $jobOrder->modem_router_sn,
                    'Modem_SN' => $jobOrder->modem_router_sn,
                    'modem_sn' => $jobOrder->modem_router_sn,
                    'lcpnap' => $jobOrder->lcpnap,
                    'port' => $jobOrder->port,
                    'vlan' => $jobOrder->vlan,
                    'visit_by' => $jobOrder->visit_by,
                    'visit_with' => $jobOrder->visit_with,
                    'visit_with_other' => $jobOrder->visit_with_other,
                    'ip_address' => $jobOrder->ip_address,
                    'address_coordinates' => $jobOrder->address_coordinates,
                    'onsite_remarks' => $jobOrder->onsite_remarks,
                    'username_status' => $jobOrder->username_status,
                    
                    'client_signature_url' => $jobOrder->client_signature_url,
                    'setup_image_url' => $jobOrder->setup_image_url,
                    'speedtest_image_url' => $jobOrder->speedtest_image_url,
                    'signed_contract_image_url' => $jobOrder->signed_contract_image_url,
                    'box_reading_image_url' => $jobOrder->box_reading_image_url,
                    'router_reading_image_url' => $jobOrder->router_reading_image_url,
                    'port_label_image_url' => $jobOrder->port_label_image_url,
                    'house_front_picture_url' => $jobOrder->house_front_picture_url,
                    'installation_landmark' => $jobOrder->installation_landmark,
                    
                    'created_at' => $jobOrder->created_at ? $jobOrder->created_at->format('Y-m-d H:i:s') : null,
                    'updated_at' => $jobOrder->updated_at ? $jobOrder->updated_at->format('Y-m-d H:i:s') : null,
                    'created_by_user_email' => $jobOrder->created_by_user_email,
                    'updated_by_user_email' => $jobOrder->updated_by_user_email,
                    
                    'First_Name' => $application ? $application->first_name : null,
                    'Middle_Initial' => $application ? $application->middle_initial : null,
                    'Last_Name' => $application ? $application->last_name : null,
                    'Address' => $application ? $application->installation_address : null,
                    'Installation_Address' => $application ? $application->installation_address : null,
                    'Location' => $application ? $application->location : null,
                    'City' => $application ? $application->city : null,
                    'Region' => $application ? $application->region : null,
                    'Barangay' => $application ? $application->barangay : null,
                    'Email_Address' => $application ? $application->email_address : null,
                    'Mobile_Number' => $application ? $application->mobile_number : null,
                    'Secondary_Mobile_Number' => $application ? $application->secondary_mobile_number : null,
                    'Desired_Plan' => $application ? $application->desired_plan : null,
                    'Referred_By' => $application ? $application->referred_by : null,
                    'Billing_Status' => $jobOrder->billing_status_id,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedJobOrders,
                'table' => 'job_orders',
                'count' => $jobOrders->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching job orders: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch job orders',
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'application_id' => 'nullable|integer|exists:applications,id',
                'timestamp' => 'nullable|date',
                'installation_fee' => 'nullable|numeric|min:0',
                'billing_day' => 'nullable|integer|min:0',
                'billing_status_id' => 'nullable|integer|exists:billing_status,id',
                'onsite_status' => 'nullable|string|max:255',
                'assigned_email' => 'nullable|email|max:255',
                'onsite_remarks' => 'nullable|string',
                'status_remarks' => 'nullable|string|max:255',
                'modem_router_sn' => 'nullable|string|max:255',
                'username' => 'nullable|string|max:255',
                'group_name' => 'nullable|string|max:255',
                'installation_landmark' => 'nullable|string|max:255',
                'created_by_user_email' => 'nullable|email|max:255',
                'updated_by_user_email' => 'nullable|email|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $request->all();
            
            $jobOrder = JobOrder::create($data);

            $jobOrder->load('application');

            return response()->json([
                'success' => true,
                'message' => 'Job order created successfully',
                'data' => $jobOrder,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create job order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $jobOrder = JobOrder::with('application')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $jobOrder,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Job order not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            \Log::info('JobOrder Update Request', [
                'id' => $id,
                'request_data' => $request->all()
            ]);

            $jobOrder = JobOrder::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'application_id' => 'nullable|integer|exists:applications,id',
                'timestamp' => 'nullable|date',
                'date_installed' => 'nullable|date',
                'installation_fee' => 'nullable|numeric|min:0',
                'billing_day' => 'nullable|integer|min:0',
                'onsite_status' => 'nullable|string|max:100',
                'assigned_email' => 'nullable|email|max:255',
                'onsite_remarks' => 'nullable|string',
                'status_remarks' => 'nullable|string|max:255',
                'modem_router_sn' => 'nullable|string|max:255',
                'router_model' => 'nullable|string|max:255',
                'connection_type' => 'nullable|string|max:100',
                'usage_type' => 'nullable|string|max:255',
                'ip_address' => 'nullable|string|max:45',
                'lcpnap' => 'nullable|string|max:255',
                'port' => 'nullable|string|max:255',
                'vlan' => 'nullable|string|max:255',
                'visit_by' => 'nullable|string|max:255',
                'visit_with' => 'nullable|string|max:255',
                'visit_with_other' => 'nullable|string|max:255',
                'address_coordinates' => 'nullable|string|max:255',
                'username' => 'nullable|string|max:255',
                'group_name' => 'nullable|string|max:255',
                'installation_landmark' => 'nullable|string|max:255',
                'pppoe_username' => 'nullable|string|max:255',
                'pppoe_password' => 'nullable|string|max:255',
                'created_by_user_email' => 'nullable|email|max:255',
                'updated_by_user_email' => 'nullable|email|max:255',
            ]);

            if ($validator->fails()) {
                \Log::error('JobOrder Update Validation Failed', [
                    'id' => $id,
                    'errors' => $validator->errors()->toArray()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $request->all();
            
            \Log::info('JobOrder Updating with data', [
                'id' => $id,
                'data' => $data
            ]);

            $jobOrder->update($data);

            \Log::info('JobOrder Updated Successfully', [
                'id' => $id,
                'updated_fields' => array_keys($data)
            ]);

            $jobOrder->load('application');

            return response()->json([
                'success' => true,
                'message' => 'Job order updated successfully',
                'data' => $jobOrder,
            ]);
        } catch (\Exception $e) {
            \Log::error('JobOrder Update Failed', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update job order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $jobOrder = JobOrder::findOrFail($id);
            $jobOrder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Job order deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete job order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function approve($id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $jobOrder = JobOrder::with('application')->lockForUpdate()->findOrFail($id);
            
            if (!$jobOrder->application) {
                throw new \Exception('Job order must have an associated application');
            }

            $application = $jobOrder->application;
            $defaultUserId = 1;

            \Log::info('Job Order Approval - Application Data', [
                'application_id' => $application->id,
                'mobile_number' => $application->mobile_number,
                'secondary_mobile_number' => $application->secondary_mobile_number,
                'first_name' => $application->first_name,
                'last_name' => $application->last_name,
            ]);

            if (empty($application->secondary_mobile_number)) {
                \Log::warning('Secondary mobile number is empty in application', [
                    'application_id' => $application->id,
                    'job_order_id' => $id
                ]);
            }

            $customer = Customer::create([
                'first_name' => $application->first_name,
                'middle_initial' => $application->middle_initial,
                'last_name' => $application->last_name,
                'email_address' => $application->email_address,
                'contact_number_primary' => $application->mobile_number,
                'contact_number_secondary' => $application->secondary_mobile_number,
                'address' => $application->installation_address,
                'location' => $application->location,
                'barangay' => $application->barangay,
                'city' => $application->city,
                'region' => $application->region,
                'address_coordinates' => $jobOrder->address_coordinates,
                'housing_status' => $application->housing_status,
                'referred_by' => $application->referred_by,
                'desired_plan' => $application->desired_plan,
                'house_front_picture_url' => $jobOrder->house_front_picture_url,
                'created_by' => $defaultUserId,
                'updated_by' => $defaultUserId,
            ]);

            \Log::info('Customer Created with Contact Numbers', [
                'customer_id' => $customer->id,
                'contact_number_primary' => $customer->contact_number_primary,
                'contact_number_secondary' => $customer->contact_number_secondary,
                'from_application_secondary' => $application->secondary_mobile_number,
            ]);

            $accountNumber = $this->generateAccountNumber();
            
            \Log::info('Generated account number', [
                'generated_account_no' => $accountNumber
            ]);

            $installationFee = $jobOrder->installation_fee ?? 0;
            
            $planId = null;
            if ($application->desired_plan) {
                $desiredPlan = $application->desired_plan;
                
                \Log::info('Parsing desired_plan', [
                    'desired_plan' => $desiredPlan
                ]);
                
                if (strpos($desiredPlan, ' - P') !== false) {
                    $parts = explode(' - P', $desiredPlan);
                    $planName = trim($parts[0]);
                    $priceString = trim($parts[1]);
                    $price = (float) str_replace(',', '', $priceString);
                    
                    \Log::info('Parsed plan components', [
                        'plan_name' => $planName,
                        'price' => $price
                    ]);
                    
                    $plan = Plan::where('plan_name', $planName)
                                ->where('price', $price)
                                ->first();
                    
                    if ($plan) {
                        $planId = $plan->id;
                        \Log::info('Plan found successfully', [
                            'plan_name' => $planName,
                            'price' => $price,
                            'plan_id' => $planId
                        ]);
                    } else {
                        \Log::warning('Plan not found with exact match', [
                            'plan_name' => $planName,
                            'price' => $price
                        ]);
                    }
                } else {
                    \Log::warning('desired_plan format unexpected', [
                        'desired_plan' => $desiredPlan,
                        'expected_format' => 'PLAN_NAME - PPRICE'
                    ]);
                }
            }
            
            $billingAccount = BillingAccount::create([
                'customer_id' => $customer->id,
                'account_no' => $accountNumber,
                'date_installed' => $jobOrder->date_installed ?? now(),
                'plan_id' => $planId,
                'account_balance' => $installationFee,
                'balance_update_date' => now(),
                'billing_day' => $jobOrder->billing_day,
                'billing_status_id' => 2,
                'created_by' => $defaultUserId,
                'updated_by' => $defaultUserId,
            ]);
            
            \Log::info('BillingAccount created', [
                'billing_account_id' => $billingAccount->id,
                'plan_id_stored' => $billingAccount->plan_id
            ]);

            $lastName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $application->last_name ?? 'user'));
            $mobileNumber = preg_replace('/[^0-9]/', '', $application->mobile_number ?? '');
            $usernameForTechnical = $lastName . $mobileNumber;
            
            $existingUsername = TechnicalDetail::where('username', $usernameForTechnical)->first();
            if ($existingUsername) {
                $usernameForTechnical = $usernameForTechnical . '_' . time();
            }

            $modemSN = $jobOrder->modem_router_sn;
            if ($modemSN) {
                $existingModemSN = TechnicalDetail::where('router_modem_sn', $modemSN)->first();
                if ($existingModemSN) {
                    $modemSN = $modemSN . '_' . time();
                }
            }

            $lcpnapValue = $jobOrder->lcpnap;
            $lcpValue = null;
            $napValue = null;
            
            if ($lcpnapValue && strpos($lcpnapValue, '/') !== false) {
                $parts = explode('/', $lcpnapValue);
                $lcpValue = trim($parts[0]);
                $napValue = isset($parts[1]) ? trim($parts[1]) : null;
            }

            $technicalDetail = TechnicalDetail::create([
                'account_id' => $billingAccount->id,
                'username' => $usernameForTechnical,
                'username_status' => $jobOrder->username_status,
                'connection_type' => $jobOrder->connection_type,
                'router_model' => $jobOrder->router_model,
                'router_modem_sn' => $modemSN,
                'ip_address' => $jobOrder->ip_address,
                'lcp' => $lcpValue,
                'nap' => $napValue,
                'port' => $jobOrder->port,
                'vlan' => $jobOrder->vlan,
                'lcpnap' => $jobOrder->lcpnap,
                'usage_type_id' => $jobOrder->usage_type_id,
                'created_by' => $defaultUserId,
                'updated_by' => $defaultUserId,
            ]);

            $jobOrder->update([
                'billing_status_id' => 2,
                'account_id' => $billingAccount->id,
                'updated_by_user_email' => 'system@ampere.com'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Job order approved successfully',
                'data' => [
                    'customer_id' => $customer->id,
                    'billing_account_id' => $billingAccount->id,
                    'technical_detail_id' => $technicalDetail->id,
                    'account_number' => $accountNumber,
                    'plan_id' => $planId,
                    'desired_plan' => $application->desired_plan,
                    'installation_fee' => $installationFee,
                    'account_balance' => $installationFee,
                    'contact_number_primary' => $customer->contact_number_primary,
                    'contact_number_secondary' => $customer->contact_number_secondary,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Error approving job order: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve job order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function generateAccountNumber(): string
    {
        DB::table('billing_accounts')->lockForUpdate()->get();
        
        $customAccountNumber = DB::table('custom_account_number')->first();
        
        if (!$customAccountNumber) {
            \Log::info('No custom_account_number record found, using default generation');
            return $this->generateDefaultAccountNumber();
        }
        
        $prefix = $customAccountNumber->starting_number;
        
        if ($prefix === null) {
            $prefix = '';
        } else {
            $prefix = (string)$prefix;
        }
        
        \Log::info('Custom account number config', [
            'prefix' => $prefix,
            'prefix_length' => strlen($prefix)
        ]);
        
        $prefixLength = strlen($prefix);
        $minIncrementLength = 4;
        
        $pattern = '^' . preg_quote($prefix, '/') . '\d+$';
        
        $latestAccount = BillingAccount::where('account_no', 'REGEXP', $pattern)
            ->where('account_no', 'LIKE', $prefix . '%')
            ->orderByRaw('LENGTH(account_no) DESC, account_no DESC')
            ->lockForUpdate()
            ->first();
        
        \Log::info('Latest account search', [
            'prefix' => $prefix,
            'pattern' => $pattern,
            'found' => $latestAccount ? $latestAccount->account_no : 'none'
        ]);
        
        if ($latestAccount) {
            $numericPart = substr($latestAccount->account_no, $prefixLength);
            $lastIncrement = (int)$numericPart;
            $lastIncrementLength = strlen($numericPart);
            $nextIncrement = $lastIncrement + 1;
            
            $nextIncrementLength = max($lastIncrementLength, strlen((string)$nextIncrement));
            
            \Log::info('Incrementing from existing account', [
                'last_account' => $latestAccount->account_no,
                'last_increment' => $lastIncrement,
                'last_increment_length' => $lastIncrementLength,
                'next_increment' => $nextIncrement,
                'next_increment_length' => $nextIncrementLength
            ]);
        } else {
            $nextIncrement = 1;
            $nextIncrementLength = $minIncrementLength;
            
            \Log::info('No existing account found, starting from 1', [
                'next_increment' => $nextIncrement,
                'next_increment_length' => $nextIncrementLength
            ]);
        }
        
        $newAccountNumber = $prefix . str_pad($nextIncrement, $nextIncrementLength, '0', STR_PAD_LEFT);
        
        \Log::info('Generated account number', [
            'account_number' => $newAccountNumber,
            'prefix' => $prefix,
            'increment' => $nextIncrement,
            'increment_length' => $nextIncrementLength
        ]);
        
        return $newAccountNumber;
    }

    private function generateDefaultAccountNumber(): string
    {
        $latestAccount = BillingAccount::orderBy('account_no', 'desc')
            ->lockForUpdate()
            ->first();
        
        if ($latestAccount && is_numeric($latestAccount->account_no)) {
            $nextNumber = (int) $latestAccount->account_no + 1;
            return str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        }
        
        return '0001';
    }

    public function getModemRouterSNs(): JsonResponse
    {
        try {
            $modems = ModemRouterSN::all();
            return response()->json([
                'success' => true,
                'data' => $modems,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch modem router SNs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getContractTemplates(): JsonResponse
    {
        try {
            $templates = ContractTemplate::all();
            return response()->json([
                'success' => true,
                'data' => $templates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch contract templates',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPorts(): JsonResponse
    {
        try {
            $ports = Port::all();
            return response()->json([
                'success' => true,
                'data' => $ports,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ports',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getVLANs(): JsonResponse
    {
        try {
            $vlans = VLAN::all();
            return response()->json([
                'success' => true,
                'data' => $vlans,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch VLANs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getLCPNAPs(): JsonResponse
    {
        try {
            $lcpnaps = LCPNAP::all();
            return response()->json([
                'success' => true,
                'data' => $lcpnaps,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch LCPNAPs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function createRadiusAccount(Request $request, $id): JsonResponse
    {
        try {
            $jobOrder = JobOrder::with('application')->findOrFail($id);

            if (!$jobOrder->application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job order must have an associated application',
                ], 400);
            }

            if (!empty($jobOrder->pppoe_username) && !empty($jobOrder->pppoe_password)) {
                Log::info('PPPoE credentials already exist in job order', [
                    'job_order_id' => $id,
                    'pppoe_username' => $jobOrder->pppoe_username,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'PPPoE credentials already exist',
                    'data' => [
                        'username' => $jobOrder->pppoe_username,
                        'password' => $jobOrder->pppoe_password,
                        'group' => $jobOrder->group_name,
                        'credentials_exist' => true,
                    ],
                ]);
            }

            $application = $jobOrder->application;

            $lastName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $application->last_name ?? ''));
            $mobileNumber = preg_replace('/[^0-9]/', '', $application->mobile_number ?? '');
            $username = $lastName . $mobileNumber;

            if (empty($username) || strlen($username) < 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to generate username from application data',
                ], 400);
            }

            $planName = $application->desired_plan;
            if (empty($planName)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plan name is required to create radius account. No desired_plan found in application.',
                ], 400);
            }
            
            if (strpos($planName, ' - P') !== false) {
                $planName = trim(explode(' - P', $planName)[0]);
            }

            Log::info('RADIUS Account Creation - Input Data', [
                'job_order_id' => $id,
                'last_name' => $lastName,
                'mobile_number' => $mobileNumber,
                'generated_username' => $username,
                'original_plan' => $application->desired_plan,
                'extracted_plan_name' => $planName,
            ]);

            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $password = '';
            $charactersLength = strlen($characters);
            for ($i = 0; $i < 12; $i++) {
                $password .= $characters[random_int(0, $charactersLength - 1)];
            }

            $modifiedUsername = str_replace(['|', 'ñ'], ['i', 'n'], $username);

            $radiusConfig = RadiusConfig::first();
            
            if (!$radiusConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'RADIUS configuration not found. Please configure RADIUS settings first.',
                ], 400);
            }

            $baseUrl = sprintf(
                '%s://%s:%s/rest/user-manage/user',
                $radiusConfig->ssl_type,
                $radiusConfig->ip,
                $radiusConfig->port
            );
            
            $primaryUrl = $baseUrl;
            $backupUrl = $baseUrl;
            $radiusUsername = $radiusConfig->username;
            $radiusPassword = $radiusConfig->password;
            
            Log::info('Retrieved RADIUS configuration from database', [
                'config_id' => $radiusConfig->id,
                'ssl_type' => $radiusConfig->ssl_type,
                'ip' => $radiusConfig->ip,
                'port' => $radiusConfig->port,
                'username' => $radiusConfig->username,
                'primary_url' => $primaryUrl,
            ]);

            $payload = [
                'name' => $modifiedUsername,
                'group' => $planName,
                'password' => $password
            ];

            Log::info('Creating RADIUS account', [
                'job_order_id' => $id,
                'username' => $modifiedUsername,
                'group' => $planName,
                'payload' => $payload,
                'radius_config_id' => $radiusConfig->id,
                'radius_url' => $primaryUrl,
            ]);

            $response = Http::withBasicAuth($radiusUsername, $radiusPassword)
                ->withOptions([
                    'verify' => false,
                    'timeout' => 10,
                ])
                ->put($primaryUrl, $payload);

            if (!$response->successful()) {
                Log::warning('Primary RADIUS server request failed, trying backup URL', [
                    'primary_url' => $primaryUrl,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                $response = Http::withBasicAuth($radiusUsername, $radiusPassword)
                    ->withOptions([
                        'verify' => false,
                        'timeout' => 10,
                    ])
                    ->put($backupUrl, $payload);
            }

            if (!$response->successful()) {
                $errorBody = $response->body();
                $errorData = json_decode($errorBody, true);
                
                Log::error('RADIUS account creation failed on both primary and backup', [
                    'job_order_id' => $id,
                    'username' => $modifiedUsername,
                    'group' => $planName,
                    'primary_url' => $primaryUrl,
                    'backup_url' => $backupUrl,
                    'status' => $response->status(),
                    'body' => $errorBody,
                    'error_detail' => $errorData['detail'] ?? 'Unknown error',
                ]);

                $errorMessage = 'Failed to create RADIUS account on both primary and backup servers';
                if (isset($errorData['detail'])) {
                    if (strpos($errorData['detail'], 'input does not match any value of group') !== false) {
                        $errorMessage = "The plan '{$planName}' does not exist in the RADIUS server. Please verify the plan name matches exactly with a group in the RADIUS server.";
                    } else {
                        $errorMessage .= ': ' . $errorData['detail'];
                    }
                }

                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'error' => $errorBody,
                    'debug_info' => [
                        'username' => $modifiedUsername,
                        'group_sent' => $planName,
                        'radius_error' => $errorData['detail'] ?? 'Unknown',
                    ],
                ], 500);
            }

            Log::info('RADIUS account created successfully', [
                'job_order_id' => $id,
                'username' => $modifiedUsername,
                'response' => $response->json(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'RADIUS account created successfully',
                'data' => [
                    'username' => $modifiedUsername,
                    'password' => $password,
                    'group' => $planName,
                    'radius_response' => $response->json(),
                    'credentials_exist' => false,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating RADIUS account', [
                'job_order_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create RADIUS account',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function uploadImages(Request $request, $id): JsonResponse
    {
        try {
            Log::info('[BACKEND] Upload images request received', [
                'job_order_id' => $id,
                'folder_name' => $request->input('folder_name'),
                'has_signed_contract' => $request->hasFile('signed_contract_image'),
                'has_setup' => $request->hasFile('setup_image'),
                'has_box_reading' => $request->hasFile('box_reading_image'),
                'has_router_reading' => $request->hasFile('router_reading_image'),
                'has_port_label' => $request->hasFile('port_label_image'),
                'has_client_signature' => $request->hasFile('client_signature_image'),
                'has_speed_test' => $request->hasFile('speed_test_image'),
            ]);

            $validator = Validator::make($request->all(), [
                'folder_name' => 'required|string|max:255',
                'signed_contract_image' => 'nullable|image|max:10240',
                'setup_image' => 'nullable|image|max:10240',
                'box_reading_image' => 'nullable|image|max:10240',
                'router_reading_image' => 'nullable|image|max:10240',
                'port_label_image' => 'nullable|image|max:10240',
                'client_signature_image' => 'nullable|image|max:10240',
                'speed_test_image' => 'nullable|image|max:10240',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $jobOrder = JobOrder::findOrFail($id);
            $folderName = $request->input('folder_name');

            $driveService = new GoogleDriveService();
            
            $folderId = $driveService->createFolder($folderName);

            $imageUrls = [];

            if ($request->hasFile('signed_contract_image')) {
                $file = $request->file('signed_contract_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Signed contract received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'signed_contract_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['signed_contract_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            if ($request->hasFile('setup_image')) {
                $file = $request->file('setup_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Setup image received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'setup_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['setup_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            if ($request->hasFile('box_reading_image')) {
                $file = $request->file('box_reading_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Box reading image received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'box_reading_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['box_reading_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            if ($request->hasFile('router_reading_image')) {
                $file = $request->file('router_reading_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Router reading image received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'router_reading_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['router_reading_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            if ($request->hasFile('port_label_image')) {
                $file = $request->file('port_label_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Port label image received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'port_label_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['port_label_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            if ($request->hasFile('client_signature_image')) {
                $file = $request->file('client_signature_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Client signature image received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'client_signature_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['client_signature_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            if ($request->hasFile('speed_test_image')) {
                $file = $request->file('speed_test_image');
                $fileSizeKB = round($file->getSize() / 1024, 2);
                Log::info('[BACKEND] Speed test image received', [
                    'size_kb' => $fileSizeKB,
                    'size_mb' => round($fileSizeKB / 1024, 2),
                    'mime_type' => $file->getMimeType(),
                ]);
                $fileName = 'speed_test_' . time() . '.' . $file->getClientOriginalExtension();
                $imageUrls['speedtest_image_url'] = $driveService->uploadFile(
                    $file,
                    $folderId,
                    $fileName,
                    $file->getMimeType()
                );
            }

            Log::info('Job order images uploaded successfully', [
                'job_order_id' => $id,
                'folder_name' => $folderName,
                'folder_id' => $folderId,
                'image_count' => count($imageUrls),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Images uploaded successfully to Google Drive',
                'data' => $imageUrls,
                'folder_id' => $folderId,
            ]);

        } catch (\Exception $e) {
            Log::error('Error uploading job order images', [
                'job_order_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload images to Google Drive',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
