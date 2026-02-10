<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\BillingAccount;
use App\Models\TechnicalDetail;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CustomerDetailUpdateController extends Controller
{
    /**
     * Unified update method dispatches based on editType
     */
    public function update(Request $request, $accountNo): JsonResponse
    {
        $editType = $request->input('editType');

        if ($editType === 'customer_details') {
            return $this->updateCustomerDetails($request, $accountNo);
        } elseif ($editType === 'billing_details') {
            return $this->updateBillingDetails($request, $accountNo);
        } elseif ($editType === 'technical_details') {
            return $this->updateTechnicalDetails($request, $accountNo);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid or missing edit type'
        ], 400);
    }

    /**
     * Update customer details
     */
    public function updateCustomerDetails(Request $request, $accountNo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'firstName' => 'required|string|max:255',
                'middleInitial' => 'nullable|string|max:1',
                'lastName' => 'required|string|max:255',
                'emailAddress' => 'required|email|max:255',
                'contactNumberPrimary' => 'required|string|max:50',
                'contactNumberSecondary' => 'nullable|string|max:50',
                'address' => 'required|string',
                'region' => 'required|string|max:255',
                'city' => 'required|string|max:255',
                'barangay' => 'required|string|max:255',
                'location' => 'required|string|max:255',
                'addressCoordinates' => 'nullable|string|max:255',
                'housingStatus' => 'nullable|in:renter,owner',
                'referredBy' => 'nullable|string|max:255',
                'groupName' => 'nullable|string|max:255',
                'houseFrontPicture' => 'nullable'
            ]);

            DB::beginTransaction();

            $billingAccount = BillingAccount::where('account_no', $accountNo)->firstOrFail();
            $customer = Customer::findOrFail($billingAccount->customer_id);

            $houseFrontPictureUrl = $customer->house_front_picture_url;

            // Handle house front picture upload if provided
            if ($request->hasFile('houseFrontPicture')) {
                $file = $request->file('houseFrontPicture');
                $houseFrontPictureUrl = $this->uploadToGoogleDrive($file, $accountNo);
            }

            // Update customer record
            $customer->update([
                'first_name' => $validated['firstName'],
                'middle_initial' => $validated['middleInitial'],
                'last_name' => $validated['lastName'],
                'email_address' => $validated['emailAddress'],
                'contact_number_primary' => $validated['contactNumberPrimary'],
                'contact_number_secondary' => $validated['contactNumberSecondary'],
                'address' => $validated['address'],
                'region' => $validated['region'],
                'city' => $validated['city'],
                'barangay' => $validated['barangay'],
                'location' => $validated['location'],
                'address_coordinates' => $validated['addressCoordinates'],
                'housing_status' => $validated['housingStatus'],
                'referred_by' => $validated['referredBy'],
                'group_name' => $validated['groupName'],
                'house_front_picture_url' => $houseFrontPictureUrl,
                'updated_by' => $request->user()->id ?? 1,
            ]);

            DB::commit();

            Log::info('Customer details updated', [
                'account_no' => $accountNo,
                'customer_id' => $customer->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Customer details updated successfully',
                'data' => $customer->fresh()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update customer details', [
                'account_no' => $accountNo,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update billing details
     */
    public function updateBillingDetails(Request $request, $accountNo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'plan' => 'required|string|max:255',
                'billingDay' => 'nullable|integer|min:0|max:31',
                'billingStatus' => 'required|string',
                'dateInstalled' => 'nullable|date',
                'accountBalance' => 'nullable|numeric'
            ]);

            DB::beginTransaction();

            $billingAccount = BillingAccount::where('account_no', $accountNo)->firstOrFail();

            // Map billing status to billing_status_id
            $statusMap = [
                'Active' => 2,
                'Inactive' => 1,
                'Suspended' => 3,
                'Pending' => 4,
                'Disconnected' => 5
            ];

            // Resolve plan_id from plan name
            $planName = $validated['plan'];
            // Remove price suffix if present "Name - PPrice"
            $cleanedPlanName = preg_replace('/ - P\d+$/', '', $planName);
            $plan = Plan::where('plan_name', $cleanedPlanName)->first();

            $billingAccount->update([
                'billing_day' => $validated['billingDay'],
                'billing_status_id' => $statusMap[$validated['billingStatus']] ?? 1,
                'date_installed' => $validated['dateInstalled'] ?? $billingAccount->date_installed,
                'account_balance' => $validated['accountBalance'] ?? $billingAccount->account_balance,
                'plan_id' => $plan ? $plan->id : $billingAccount->plan_id,
                'balance_update_date' => isset($validated['accountBalance']) ? now() : $billingAccount->balance_update_date,
                'updated_by' => $request->user()->id ?? 1,
            ]);

            // Also update customer's desired plan
            $customer = Customer::findOrFail($billingAccount->customer_id);
            $customer->update([
                'desired_plan' => $validated['plan'],
                'updated_by' => $request->user()->id ?? 1,
            ]);

            DB::commit();

            Log::info('Billing details updated', [
                'account_no' => $accountNo,
                'billing_account_id' => $billingAccount->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Billing details updated successfully',
                'data' => $billingAccount->fresh()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update billing details', [
                'account_no' => $accountNo,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update billing details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update technical details
     */
    public function updateTechnicalDetails(Request $request, $accountNo): JsonResponse
    {
        try {
            $validated = $request->validate([
                'username' => 'required|string|max:255',
                'usernameStatus' => 'nullable|string|max:100',
                'connectionType' => 'required|string|max:100',
                'routerModel' => 'required|string|max:255',
                'routerModemSn' => 'nullable|string|max:255',
                'ipAddress' => 'nullable|string|max:45',
                'lcp' => 'nullable|string|max:255',
                'nap' => 'nullable|string|max:255',
                'port' => 'nullable|string|max:255',
                'vlan' => 'nullable|string|max:255',
                'usageType' => 'nullable|string|max:255'
            ]);

            DB::beginTransaction();

            $billingAccount = BillingAccount::where('account_no', $accountNo)->firstOrFail();
            
            // Get or create technical details
            $technicalDetail = TechnicalDetail::where('account_id', $billingAccount->id)->first();
            
            if (!$technicalDetail) {
                $technicalDetail = new TechnicalDetail();
                $technicalDetail->account_id = $billingAccount->id;
                $technicalDetail->account_no = $billingAccount->account_no;
                $technicalDetail->created_by = $request->user()->id ?? 1;
            }

            // Generate LCPNAP if LCP and NAP are provided
            $lcpnap = $technicalDetail->lcpnap;
            if (!empty($validated['lcp']) && !empty($validated['nap'])) {
                $lcpnap = $validated['lcp'] . '-' . $validated['nap'];
            }

            $technicalDetail->username = $validated['username'];
            $technicalDetail->username_status = $validated['usernameStatus'] ?? $technicalDetail->username_status;
            $technicalDetail->connection_type = $validated['connectionType'];
            $technicalDetail->router_model = $validated['routerModel'];
            $technicalDetail->router_modem_sn = $validated['routerModemSn'];
            $technicalDetail->ip_address = $validated['ipAddress'];
            $technicalDetail->lcp = $validated['lcp'];
            $technicalDetail->nap = $validated['nap'];
            $technicalDetail->port = $validated['port'];
            $technicalDetail->vlan = $validated['vlan'];
            $technicalDetail->lcpnap = $lcpnap;
            $technicalDetail->usage_type = $validated['usageType'] ?? $technicalDetail->usage_type;
            $technicalDetail->updated_by = $request->user()->id ?? 1;
            
            $technicalDetail->save();

            DB::commit();

            Log::info('Technical details updated', [
                'account_no' => $accountNo,
                'technical_detail_id' => $technicalDetail->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Technical details updated successfully',
                'data' => $technicalDetail->fresh()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update technical details', [
                'account_no' => $accountNo,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update technical details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload file to Google Drive (placeholder - implement based on your setup)
     */
    private function uploadToGoogleDrive($file, $accountNo)
    {
        // TODO: Implement Google Drive upload
        // For now, return a placeholder URL or use existing logic if any
        return 'https://drive.google.com/file/d/placeholder';
    }
}

