# CPESS Finance Database Information

## ✅ ALL ACCOUNTS WORKING - PASSWORDS RESET & VERIFIED

### Admin Account
- **Email:** cpess.admin@admin.com
- **Password:** 12341234
- **Role:** Admin (Full system access + Admin Panel)
- **Status:** ✅ Verified Working

### Officer Accounts (All passwords: 12341234)
All officer accounts have been reset and verified:

1. **cpess.president@gmail.com** - President (Paul Alfred Manongsong) ✅
2. **cpess.vpinternal@gmail.com** - VP Internal (Niña Kristal Malaluan) ✅
3. **cpess.vpexternal@gmail.com** - VP External (Lei Allizter Cervantes) ✅
4. **cpess.treasurer@gmail.com** - Treasurer (Jyenn Lee Cabrera) ✅
5. **cpess.asst.treasurer@gmail.com** - Assistant Treasurer (Madeline Dela Torre) ✅
6. **cpess.auditor@gmail.com** - Auditor (Alejandro Miguel Sandoval) ✅

### Member Account
- **2100599@ub.edu.ph** - Member (Victor Roxas)
- **Password:** 12341234
- **Status:** ✅ Verified Working

---

## 🗄️ Database Access

### Finding Your Supabase Project

**Project Reference:** dqsqidxhbktkqpolfcaz
**Project URL:** https://dqsqidxhbktkqpolfcaz.supabase.co

Based on your Supabase organizations, the CPESS Finance project is located in one of these:
- **Fairpoint** (1 project)
- **roxasvctr-gmailcom's projects** (1 project)
- **wedding invitations** (1 project)

**To find it:**
1. Go to https://supabase.com/dashboard
2. Click on each organization name
3. Look for a project with reference ending in "dqsqidxhbktkqpolfcaz"
4. Once found, you can:
   - Use **Table Editor** to view all data visually
   - Use **SQL Editor** to run queries
   - View **Authentication** users
   - Check **Database** schema

### Quick SQL Queries (Once in SQL Editor)

```sql
-- View all users and their roles
SELECT email, role, full_name, officer_position, is_active
FROM users
ORDER BY role, created_at;

-- View all transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20;

-- View audit log
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;
```

---

## 🎯 How to Login to the App

### For Admin:
1. Open your application
2. Email: `cpess.admin@admin.com`
3. Password: `12341234`
4. After login, you'll see **"Admin Panel"** in the navigation
5. Click Admin Panel to manage all users

### For Officers:
1. Use your officer email (e.g., cpess.president@gmail.com)
2. Password: `12341234`
3. You'll have access to create and manage transactions

### For Members:
1. Use your @ub.edu.ph email
2. Password: `12341234` (or create account if new)
3. Read-only access to view financial data

---

## 🔧 Troubleshooting Login Issues

If you still can't login:

1. **Clear browser data:**
   - Open developer tools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

2. **Try incognito/private window:**
   - This rules out cookie/cache issues

3. **Check for errors:**
   - Press F12 to open developer console
   - Look for red error messages
   - Share those with me if login still fails

4. **Verify you're using the correct email:**
   - Admin: `cpess.admin@admin.com` (NOT @gmail.com)
   - Officers: their @gmail.com addresses
   - Members: @ub.edu.ph addresses

5. **Double-check password:**
   - Copy and paste: `12341234`
   - No extra spaces

---

## 📊 Database Tables

- **users** - User accounts, roles, and positions
- **transactions** - Financial transactions (income/expenses)
- **audit_logs** - Complete audit trail of all actions
- **transaction_revisions** - History of transaction changes

---

## 🆘 Still Having Issues?

Let me know:
1. Which account you're trying to use
2. Any error message shown
3. Screenshot of the console (F12)

I can diagnose and fix the issue immediately!

**Note:** All accounts have been tested via API and are confirmed working. If the frontend doesn't work, it may be a browser or deployment issue that we can troubleshoot together.
