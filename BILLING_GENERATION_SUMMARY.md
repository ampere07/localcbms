# Billing Generation System - Force Generate Feature

## Overview
Updated the Customer.tsx component to support force-generating sample SOA (Statement of Account) and invoices for all active accounts regardless of their billing day.

## Changes Made

### Frontend (Customer.tsx)
**Location:** `C:/Users/AMPERE/Documents/GitHub/localcbms/frontend/src/pages/Customer.tsx`

#### Updated Function: `handleGenerateSampleData`

**Before:**
- Used `.then()/.catch()` promise chain
- No confirmation dialog
- Direct execution

**After:**
- Added confirmation dialog before generation
- Converted to async/await for better error handling
- Prompts: "Generate sample SOA and invoices for ALL active accounts regardless of billing day?"
- Better structured try-catch-finally blocks

```typescript
const handleGenerateSampleData = async () => {
  if (!confirm('Generate sample SOA and invoices for ALL active accounts regardless of billing day?')) {
    return;
  }
  
  setIsLoading(true);
  
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://192.168.100.10:8000/api'
    : 'http://192.168.100.10:8000/api';

  const generationDate = new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch(`${API_BASE_URL}/billing-generation/force-generate-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        generation_date: generationDate
      })
    });
    
    // ... result handling
  } catch (err) {
    // ... error handling
  } finally {
    setIsLoading(false);
  }
};
```

### Backend API Endpoint
**Location:** `C:/Users/AMPERE/Documents/GitHub/localcbms/backend/app/Http/Controllers/BillingGenerationController.php`

#### Existing Endpoint: `forceGenerateAll`
- **Route:** `POST /api/billing-generation/force-generate-all`
- **Purpose:** Generates SOA and invoices for ALL active accounts regardless of billing day
- **Parameters:** 
  - `generation_date` (optional): Defaults to current date

**Logic Flow:**
1. Queries all active accounts where:
   - `billing_status_id = 2` (Active status)
   - `date_installed IS NOT NULL`
2. For each account:
   - Creates Statement of Account first
   - Creates Invoice second
3. Returns comprehensive results with success/failure counts

### Billing Generation Service
**Location:** `C:/Users/AMPERE/Documents/GitHub/localcbms/backend/app/Services/EnhancedBillingGenerationService.php`

#### Key Methods

**1. createEnhancedStatement**
Generates Statement of Account with:
- Previous balance from last SOA
- Current period charges
- Monthly service fee (prorated if first billing)
- VAT calculation
- Other charges and deductions
- Total amount due

**2. createEnhancedInvoice**
Generates Invoice with:
- Prorated amount based on date installed or monthly fee
- Other basic charges
- Total amount calculation
- Updates account balance

**3. calculateChargesAndDeductions**
Handles all charge types:
- **Staggered Fees**: Payment plans with schedules
- **Staggered Install Fees**: Monthly installment payments
- **Discounts**: Unused, Permanent, and Monthly types
- **Advanced Payments**: Pre-paid amounts for specific months
- **Rebates**: Mass rebates by barangay
- **Service Fees**: Service charge logs

## Database Tables Used

### Core Tables
1. **billing_accounts** - Customer billing information
2. **customers** - Customer details
3. **invoices** - Invoice records
4. **statement_of_accounts** - SOA records
5. **app_plans** (plan_list) - Service plan pricing

### Charge/Deduction Tables
6. **discounts** - Discount records with status tracking
   - Unused: One-time use
   - Permanent: Applied every billing cycle
   - Monthly: Applied for N remaining months

7. **installments** - Staggered payment schedules
   - Has related `installment_schedules` table
   - Tracks payment completion

8. **advanced_payments** - Pre-paid amounts
   - Applied based on payment_month

9. **mass_rebates** (rebates) - Bulk discount by location
   - Applied by barangay_code or 'All'
   - Based on billing_day and rebate_days

10. **service_charge_logs** - Service fees
    - Status: Unused/Used
    - Applied once per billing cycle

11. **staggered_installation** - Installation payment plans
    - `months_to_pay` decrements each cycle
    - `monthly_payment` added to balance
    - Completed when `months_to_pay = 0`

### Related Tables
12. **barangays** - Location data
13. **billing_configs** - System configuration

## Generation Logic

### Order of Operations
**CRITICAL: SOA must be generated BEFORE invoice**

1. **Generate SOA First**
   - Uses previous balance from last SOA's `total_amount_due`
   - Calculates current charges
   - Creates SOA record

2. **Generate Invoice Second**  
   - Calculates current period amounts
   - Updates `account_balance` to new total
   - Creates invoice record

### Why This Order Matters
- SOA needs previous balance from last period
- Invoice updates the account balance to current total
- If invoice runs first, SOA will use wrong balance

### Example Flow
```
Previous Period:
  - Total Amount Due: ₱6,694.00

Current Period:
  Step 1 - Generate SOA:
    - Balance from Previous Bill: ₱6,694.00 ✓
    - Current Charges: ₱1,299.00
    - Total Amount Due: ₱7,993.00
  
  Step 2 - Generate Invoice:
    - Updates account_balance to ₱7,993.00
    - Invoice created
```

## Usage

### From Frontend
1. Navigate to Customer page
2. Click "Generate Sample Data" button
3. Confirm dialog: "Generate sample SOA and invoices for ALL active accounts regardless of billing day?"
4. System generates for all active accounts
5. Results displayed with counts

### From API
```bash
POST http://192.168.100.10:8000/api/billing-generation/force-generate-all

Request Body:
{
  "generation_date": "2025-11-22"  // Optional, defaults to today
}

Response:
{
  "success": true,
  "message": "Force generated X billing records for Y active accounts",
  "data": {
    "invoices": {
      "success": 10,
      "failed": 0,
      "errors": []
    },
    "statements": {
      "success": 10,
      "failed": 0,
      "errors": []
    },
    "total_accounts": 10,
    "generation_date": "2025-11-22"
  }
}
```

## Error Handling

### Frontend
- Confirmation dialog prevents accidental generation
- Loading state with spinner
- Success/failure alerts with details
- Console logging for debugging

### Backend
- Transaction-based generation (DB rollback on error)
- Individual account error tracking
- Comprehensive logging
- Detailed error messages in response

## Features Implemented

✅ Force generate regardless of billing day  
✅ Generate SOA first, then invoice  
✅ Handle all discount types (Unused, Permanent, Monthly)  
✅ Process staggered payment schedules  
✅ Apply staggered installation fees  
✅ Calculate advanced payments  
✅ Apply mass rebates by location  
✅ Process service fees  
✅ Update installment statuses  
✅ Track payment received from previous period  
✅ Prorate charges for new installations  
✅ Confirmation dialog before generation  

## Testing Checklist

- [ ] Test generation with no active accounts
- [ ] Test with accounts having different billing days
- [ ] Test with various discount types
- [ ] Test with staggered payments
- [ ] Test with advanced payments
- [ ] Test with rebates
- [ ] Test proration for new installations
- [ ] Test error handling for invalid data
- [ ] Test balance updates
- [ ] Verify SOA shows correct previous balance
- [ ] Verify invoice updates account balance

## Known Limitations

1. Transaction payments are tracked but not automatically applied during generation
2. Mass rebates require barangay_id to match
3. Generation date parameter affects calculations
4. Service fees are marked as "Used" after generation

## Future Enhancements

1. Add transaction payment application during generation
2. Add single-account force generation option
3. Add date range filtering for generation
4. Add generation scheduling
5. Add email notifications after generation
6. Add PDF generation for SOA/invoices
