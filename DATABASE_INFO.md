# CPESS Finance Database Information

## Admin Login Credentials
- **Email:** cpess.admin@admin.com
- **Password:** 12341234
- **Status:** Active and confirmed

## Database Access

This project uses a Supabase database. The database connection details are in your `.env` file:

```
VITE_SUPABASE_URL=https://dqsqidxhbktkqpolfcaz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Current Database State

### Users Table (9 users)
1. **cpess.admin@admin.com** - Admin (CPESS Administrator)
2. **cpess.president@gmail.com** - Officer (Paul Alfred Manongsong - President)
3. **cpess.vpinternal@gmail.com** - Officer (Niña Kristal Malaluan - VP Internal)
4. **cpess.vpexternal@gmail.com** - Officer (Lei Allizter Cervantes - VP External)
5. **cpess.treasurer@gmail.com** - Officer (Jyenn Lee Cabrera - Treasurer)
6. **cpess.asst.treasurer@gmail.com** - Officer (Madeline Dela Torre - Assistant Treasurer)
7. **cpess.auditor@gmail.com** - Officer (Alejandro Miguel Sandoval - Auditor)
8. **2100599@ub.edu.ph** - Member (Victor Roxas)

### Database Tables
- **users** - User accounts and roles
- **transactions** - Financial transactions
- **audit_logs** - System audit trail
- **transaction_revisions** - Transaction history

## Accessing the Database

### Option 1: Through the Application (Recommended)
1. Log in as admin: cpess.admin@admin.com / 12341234
2. Navigate to "Admin Panel" in the menu
3. View and manage all users

### Option 2: SQL Queries via Chat
You can ask me to run SQL queries to view or modify data. For example:
- "Show me all users"
- "Show me all transactions"
- "Add a new user"
- "View audit logs"

### Option 3: Direct Supabase Access
The database is hosted on Supabase. To access it externally, you need to be the owner of the Supabase project. The project reference is: **dqsqidxhbktkqpolfcaz**

If this is your Supabase account:
1. Go to https://supabase.com/dashboard
2. Log in with your Supabase credentials
3. Find the project with reference "dqsqidxhbktkqpolfcaz"
4. Use the Table Editor or SQL Editor

**Note:** The Supabase dashboard login is separate from your admin account - you need to use your Supabase account credentials (the account that owns this project).

## Testing Admin Login

If you're unable to log in, please try:
1. Clear your browser cache/cookies
2. Use an incognito/private window
3. Make sure you're using: **cpess.admin@admin.com** (not @gmail.com)
4. Password is exactly: **12341234**

If it still doesn't work, let me know and I'll investigate further!
