# Open Days Rental Feature Documentation

## Overview

The Pink House cubby rental system has been enhanced with a dynamic rental period adjustment feature that takes into account the charity shop's operating days. This ensures sellers are only charged for days when the shop is actually open, making the rental system more fair and transparent.

## How It Works

### Configuring Open Days

As an administrator, you can configure which days of the week the charity shop is open:

1. Navigate to the admin dashboard and select "Settings"
2. Go to the "Open Days" tab
3. Check or uncheck the days of the week when the shop is open
4. Save your changes

### Rental Period Calculation

When a seller rents a cubby, the system now:

1. Takes the rental period (e.g., 7 days, 14 days, 30 days)
2. Adjusts the end date by counting only the days when the shop is open
3. Extends the rental period so that sellers get the full number of open days they paid for

For example, if the shop is only open Wednesday through Saturday (4 days per week), and a seller books a 7-day rental starting on February 1st, the system will:

- Count 7 actual open days (which will span across ~12 calendar days)
- Set the end date to February 12th instead of February 8th
- Show sellers both the total calendar days and the number of open shop days

### Example Scenarios

#### Example 1: Weekend Closure

**Shop Configuration:**
- Open: Monday through Friday
- Closed: Saturday and Sunday

**Rental:**
- Period: 7 days
- Start date: Monday, February 1st

**Result:**
- End date: Tuesday, February 9th (spanning 9 calendar days)
- The seller gets all 7 open days they paid for

#### Example 2: Part-Time Shop

**Shop Configuration:**
- Open: Wednesday, Thursday, Friday, Saturday
- Closed: Sunday, Monday, Tuesday

**Rental:**
- Period: 7 days
- Start date: Wednesday, February 1st

**Result:**
- End date: Saturday, February 11th (spanning 11 calendar days)
- The seller gets all 7 open days they paid for

## User Experience

### For Sellers

Sellers will notice:

- Clear indication of the shop's open days in the rental process
- Transparent display of how many calendar days their rental will span
- Visual explanation of the adjusted rental period
- Confirmation of the exact start and end dates

### For Staff

Staff members will see:

- The same adjusted rental periods in the cubby management interface
- Clear indication of the actual open days in each rental
- Accurate scheduling information for cubby availability

## Technical Implementation

This feature is implemented through:

1. A new system setting (`shop_open_days`) that stores the configuration
2. SQL functions that calculate the effective rental period
3. Frontend components that display the adjusted dates to users
4. Utilities for calculating and converting between calendar days and open days

## Benefits

- **Fairness:** Sellers only pay for days when their items can actually be sold
- **Transparency:** Clear communication about how rental periods are calculated
- **Flexibility:** Administrators can easily update open days if shop hours change
- **Consistency:** All rental calculations use the same logic 