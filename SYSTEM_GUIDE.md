# CPESS Financial Transparency System

## Overview
A mobile-first financial transparency system for the Computer Engineering Society - University of Batangas (CPESS). Focused exclusively on organization fund management with complete transparency for all members.

## Access Control

### Officer Accounts (Full Permissions)
Six pre-configured officer accounts with complete access:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| President | cpess.president@gmail.com | cpessPres!dent2024 | Full access + Approval authority |
| VP Internal | cpess.vpinternal@gmail.com | cpessVPintern@l2024 | Full access + Approval authority |
| VP External | cpess.vpexternal@gmail.com | cpessVPextern@l2024 | Full access + Approval authority |
| Treasurer | cpess.treasurer@gmail.com | cpessTreasur3r2024 | Full access (create transactions) |
| Assistant Treasurer | cpess.asst.treasurer@gmail.com | cpessAsstTreas2024 | Full access (create transactions) |
| Auditor | cpess.auditor@gmail.com | cpessAud!tor2024 | Full access |

**Officer Permissions:**
- Create, edit, and delete transactions
- Upload proof images
- Add/edit notes
- View audit logs and revision history
- Approve or reject transactions (President & VPs only)

### Member Accounts (Read-Only)
**Self-Registration for Students:**
- Any student can create an account using their `@ub.edu.ph` email address
- No manual registration by officers required
- Automatic read-only access upon signup

**Member Permissions:**
- View all transactions (approved, pending, rejected)
- View all financial reports
- View audit logs (read-only)
- View revision history
- No ability to create, edit, or delete any data

## Features

### 1. Organization Dashboard
- Total organization fund balance
- Real-time transaction feed (auto-refreshes every 30 seconds)
- Category summary with visual breakdown
- Pending approval count
- Recent approved transactions
- Monthly financial summary

### 2. Transactions Management
**Transaction Details:**
- Title
- Amount (positive for income, negative for expense)
- Category (Event, Materials, Fundraising, Supplies, Transportation, Other)
- Detailed description
- Date
- Proof image (required)
- Created by (officer name)
- Status (Pending/Approved/Rejected)

**Approval Workflow:**
1. Any officer creates a transaction → Status: Pending
2. President, VP Internal, or VP External approves/rejects it
3. Only approved transactions count toward the balance
4. All transactions (regardless of status) are visible to everyone

**Features:**
- Search and filter transactions by status
- View transaction details with proof images
- Edit transactions (with required reason for transparency)
- Delete transactions (officers only)
- View complete revision history for each transaction

### 3. Monthly Reports
- Select any month from the past year
- Total income/expense/net balance for selected month
- Category breakdown showing income and expense per category
- Complete transaction list for the month (approved only)
- Export to CSV functionality for external analysis

### 4. Audit & Security Features

**Audit Logs:**
Every action is permanently tracked:
- Who performed the action
- What entity was affected (transaction, user)
- What changes were made (before/after)
- When it happened (timestamp)
- Reason for edits (required for updates)

**Revision History:**
- Every edit to a transaction creates a permanent revision record
- View complete chronological history of all changes
- See who made each change and their reason
- Original data is never lost or overwritten
- Members can view history (transparency)

## Database Schema

### Tables
1. **users** - User accounts (officers and members)
2. **transactions** - Organization fund transactions with approval workflow
3. **audit_logs** - Complete audit trail of all actions
4. **transaction_revisions** - Complete transaction edit history

### Security
- Row Level Security (RLS) enabled on all tables
- Members have SELECT-only permissions
- Officers have full CRUD permissions based on role
- Audit logs are append-only (cannot be edited or deleted)
- Proof images stored securely in Supabase Storage

## Technical Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (mobile-first approach)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for proof images)
- **Edge Functions:** Automated officer account initialization

## Getting Started

### For Students (Members)
1. Visit the login page
2. Click "New student? Create an account"
3. Enter your full name
4. Enter your @ub.edu.ph email address
5. Create a password
6. Click "Create Account"
7. Sign in with your new credentials
8. You now have read-only access to all financial data

### For Officers
1. Use your pre-configured officer email and password
2. Sign in directly (no need to create account)
3. You have full access based on your role

### Creating Transactions (Officers Only)
1. Navigate to Transactions page
2. Click "Add Transaction"
3. Fill in all required fields:
   - Title (descriptive name)
   - Amount (positive for income, negative for expense)
   - Category
   - Date
   - Description (detailed explanation)
   - Proof image (receipt, screenshot, etc.)
4. Submit - transaction will be pending approval

### Approving Transactions (President & VPs Only)
1. Navigate to Transactions page
2. Look for transactions with "Pending" status
3. Click the view button to see details
4. Click approve (✓) or reject (✗) button
5. Approved transactions will count toward balance and appear in reports

### Editing Transactions (Officers Only)
1. Find the transaction you need to edit
2. Click the edit button
3. **Required:** Enter a reason for the edit
4. Make your changes
5. Submit - original version is saved in revision history

### Viewing Reports
1. Navigate to Reports page
2. Select desired month from dropdown (past 12 months)
3. View financial summary and category breakdown
4. Review complete transaction list
5. Export to CSV for external use if needed

## Important Notes
- **Transparency First:** All members can see everything, including pending and rejected transactions
- **No Email Notifications:** System is web-based only
- **No Messaging:** Focus is on data transparency, not communication
- **Mobile Optimized:** Works perfectly on phones and tablets
- **Real-Time Updates:** Dashboard refreshes automatically
- **Permanent History:** Nothing is ever truly deleted - all changes are tracked

## System Focus
This system is designed exclusively for **organization fund management**. It does not handle:
- Class funds or section-specific finances
- Individual member dues
- Event-specific sub-budgets
- Other non-organization finances

The focus is complete transparency for the main CPESS organization funds.

---

Created by [Victor Roxas](https://victorroxas.vercel.app/)
