# Rebate System Flow Diagram

## Database Structure
```
┌─────────────────────────────────┐
│        rebates table            │
├─────────────────────────────────┤
│ id                              │
│ rebates_id                      │
│ number_of_dates                 │
│ rebate_type                     │
│ selected_rebate                 │
│ month          (e.g. November)  │
│ status         (Unused/Used)    │
│ modified_by                     │
│ modified_date                   │
└─────────────────────────────────┘
         │
         │ 1:N relationship
         │
         ▼
┌─────────────────────────────────┐
│    rebates_usage table          │
├─────────────────────────────────┤
│ id                              │
│ rebates_id     (FK to rebates)  │
│ account_no                      │
│ status         (Unused/Used)    │
│ month                           │
└─────────────────────────────────┘
```

## Invoice Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVOICE GENERATION START                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Step 1: calculateRebates()                          │
├─────────────────────────────────────────────────────────────────┤
│  Current Month = November                                        │
│                                                                  │
│  Query rebates table:                                            │
│    WHERE status = 'Unused'                                       │
│    AND month = 'November'                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Step 2: Check Customer Match                        │
├─────────────────────────────────────────────────────────────────┤
│  Does customer's LCP/NAP/Location                                │
│  match rebate's selected_rebate?                                 │
└──────────────┬──────────────────┬────────────────────────────────┘
               │ NO               │ YES
               │                  │
               ▼                  ▼
          Skip rebate    ┌────────────────────────────────────┐
                         │ Step 3: Check rebate_usage         │
                         ├────────────────────────────────────┤
                         │ Query rebates_usage:               │
                         │   WHERE rebates_id = [rebate.id]   │
                         │   AND account_no = [account]       │
                         │   AND status = 'Unused'            │
                         └────────┬──────────────┬────────────┘
                                  │ NOT FOUND    │ FOUND
                                  │              │
                                  ▼              ▼
                            Skip rebate    ┌──────────────────────┐
                                           │ Step 4: Apply Rebate │
                                           ├──────────────────────┤
                                           │ Calculate:           │
                                           │ rebate_value =       │
                                           │   daily_rate *       │
                                           │   number_of_dates    │
                                           │                      │
                                           │ Add to total         │
                                           └──────────┬───────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│           Step 5: Create Invoice with Rebate Deduction          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Step 6: markRebatesAsUsed()                         │
├─────────────────────────────────────────────────────────────────┤
│  For each matched rebate:                                        │
│    1. Find rebate_usage entry                                    │
│    2. Update rebate_usage.status = 'Used'                        │
│    3. Call checkAndUpdateRebateStatus()                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Step 7: checkAndUpdateRebateStatus()                     │
├─────────────────────────────────────────────────────────────────┤
│  Count unused rebate_usage entries for this rebates_id          │
└──────────────┬──────────────────┬────────────────────────────────┘
               │                  │
               ▼                  ▼
    ┌──────────────────┐   ┌──────────────────────────────┐
    │ Count > 0        │   │ Count = 0                    │
    │                  │   │                              │
    │ Keep rebates     │   │ Update rebates               │
    │ status = Unused  │   │ status = Used                │
    │                  │   │                              │
    │ Log: "Still has  │   │ Log: "All entries used,      │
    │ unused entries"  │   │ marking as Used"             │
    └──────────────────┘   └──────────────────────────────┘
```

## Example Timeline: 3 Accounts

```
Time: T0 (Initial State)
═══════════════════════════════════════════════════════════════

rebates table:
┌────┬────────────┬───────┬──────────┐
│ ID │   Month    │Status │ Accounts │
├────┼────────────┼───────┼──────────┤
│ 14 │ November   │Unused │    3     │
└────┴────────────┴───────┴──────────┘

rebates_usage table:
┌────┬───────────┬────────────┬────────┐
│ ID │ Rebate ID │ Account    │ Status │
├────┼───────────┼────────────┼────────┤
│  1 │    14     │   A0001    │ Unused │
│  2 │    14     │   A0002    │ Unused │
│  3 │    14     │   A0003    │ Unused │
└────┴───────────┴────────────┴────────┘


Time: T1 (Invoice for A0001)
═══════════════════════════════════════════════════════════════

rebates table:
┌────┬────────────┬───────┬──────────┐
│ ID │   Month    │Status │ Accounts │
├────┼────────────┼───────┼──────────┤
│ 14 │ November   │Unused │    3     │ ← Still Unused
└────┴────────────┴───────┴──────────┘

rebates_usage table:
┌────┬───────────┬────────────┬────────┐
│ ID │ Rebate ID │ Account    │ Status │
├────┼───────────┼────────────┼────────┤
│  1 │    14     │   A0001    │  Used  │ ← Changed
│  2 │    14     │   A0002    │ Unused │
│  3 │    14     │   A0003    │ Unused │
└────┴───────────┴────────────┴────────┘

Unused Count: 2 → rebates.status stays Unused


Time: T2 (Invoice for A0002)
═══════════════════════════════════════════════════════════════

rebates table:
┌────┬────────────┬───────┬──────────┐
│ ID │   Month    │Status │ Accounts │
├────┼────────────┼───────┼──────────┤
│ 14 │ November   │Unused │    3     │ ← Still Unused
└────┴────────────┴───────┴──────────┘

rebates_usage table:
┌────┬───────────┬────────────┬────────┐
│ ID │ Rebate ID │ Account    │ Status │
├────┼───────────┼────────────┼────────┤
│  1 │    14     │   A0001    │  Used  │
│  2 │    14     │   A0002    │  Used  │ ← Changed
│  3 │    14     │   A0003    │ Unused │
└────┴───────────┴────────────┴────────┘

Unused Count: 1 → rebates.status stays Unused


Time: T3 (Invoice for A0003)
═══════════════════════════════════════════════════════════════

rebates table:
┌────┬────────────┬───────┬──────────┐
│ ID │   Month    │Status │ Accounts │
├────┼────────────┼───────┼──────────┤
│ 14 │ November   │ Used  │    3     │ ← Changed to Used!
└────┴────────────┴───────┴──────────┘

rebates_usage table:
┌────┬───────────┬────────────┬────────┐
│ ID │ Rebate ID │ Account    │ Status │
├────┼───────────┼────────────┼────────┤
│  1 │    14     │   A0001    │  Used  │
│  2 │    14     │   A0002    │  Used  │
│  3 │    14     │   A0003    │  Used  │ ← Changed
└────┴───────────┴────────────┴────────┘

Unused Count: 0 → rebates.status changes to Used
```

## Decision Tree

```
                        ┌─────────────────────┐
                        │ Invoice Generation  │
                        │    for Account      │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ Is current month =  │
                        │   rebate.month?     │
                        └──────┬──────┬───────┘
                               │NO    │YES
                               ▼      ▼
                           SKIP    ┌──────────────┐
                                   │ Does customer│
                                   │ match rebate │
                                   │  criteria?   │
                                   └──┬──────┬────┘
                                      │NO    │YES
                                      ▼      ▼
                                   SKIP   ┌────────────┐
                                          │ Exists in  │
                                          │rebate_usage│
                                          │ as Unused? │
                                          └──┬────┬────┘
                                             │NO  │YES
                                             ▼    ▼
                                          SKIP  ┌─────────┐
                                                │ APPLY   │
                                                │ REBATE  │
                                                └────┬────┘
                                                     │
                                                     ▼
                                                ┌─────────┐
                                                │  Mark   │
                                                │ Usage   │
                                                │  Used   │
                                                └────┬────┘
                                                     │
                                                     ▼
                                          ┌──────────────────┐
                                          │ All usage Used?  │
                                          └────┬──────┬──────┘
                                               │NO    │YES
                                               ▼      ▼
                                          Keep    Mark rebate
                                          Unused      Used
```

## Status Legend

```
┌───────────────────────────────────────────────────────────────┐
│                     STATUS VALUES                             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Unused  = Ready to be used / Not yet consumed               │
│  Used    = Already consumed / Cannot be used again           │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                  TABLE RESPONSIBILITIES                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  rebates table:                                               │
│    - Defines the rebate offer                                │
│    - Status shows if ALL assigned accounts have used it      │
│    - Changes to "Used" only when complete                    │
│                                                               │
│  rebates_usage table:                                         │
│    - Lists which accounts can use the rebate                 │
│    - Status shows if THIS account has used it                │
│    - Changes to "Used" immediately after invoice             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```
