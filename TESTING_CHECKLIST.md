## 🧪 Data Persistence Testing Checklist

Use this checklist to verify the implementation works correctly.

---

## ✅ Pre-Testing Setup

- [ ] Installed dependencies: `cd backend && npm install`
- [ ] Backend starts: `cd backend && node index.js`
- [ ] Database file created: `backend/inventory.db` (36KB+)
- [ ] Frontend opens without errors

---

## 🧪 Test 1: Basic Persistence

**Goal**: Verify data survives server restart

**Steps:**
1. [ ] Login as staff (code: `ABCDE`)
2. [ ] Add an item: "Test Item 1"
3. [ ] Verify item appears on dashboard
4. [ ] Stop backend server (Ctrl+C)
5. [ ] Restart backend server (node index.js)
6. [ ] Refresh frontend page
7. [ ] Login again (code: `ABCDE`)

**Expected Result:**
- [ ] "Test Item 1" still appears on dashboard ✅

---

## 🧪 Test 2: Cross-Device Sync (Same Staff)

**Goal**: Same staff sees data from different devices

**Requirements:**
- 2 phones/devices or 2 browser windows

**Steps:**

**Device 1:**
1. [ ] Login as staff (code: `ABCDE`)
2. [ ] Note the current number of items
3. [ ] Add 3 new items:
   - [ ] "Item from Device 1 - A"
   - [ ] "Item from Device 1 - B"
   - [ ] "Item from Device 1 - C"
4. [ ] Verify all 3 appear on Device 1

**Device 2 (Different Phone/Browser):**
5. [ ] Open app in different browser/phone
6. [ ] Login with same code: `ABCDE`
7. [ ] Wait for data to load

**Expected Result:**
- [ ] All 3 items from Device 1 appear on Device 2 ✅
- [ ] Items show in same order
- [ ] Quantities match

**Bonus:**
8. [ ] On Device 2, add 2 new items:
   - [ ] "Item from Device 2 - X"
   - [ ] "Item from Device 2 - Y"
9. [ ] Return to Device 1 and refresh
10. [ ] Expected: See all 5 items (3 from Device 1 + 2 from Device 2) ✅

---

## 🧪 Test 3: Admin Creates Staff

**Goal**: Verify new staff data persists

**Steps:**
1. [ ] Login as Admin (email: `mohamadhassoun012@gmail.com`)
2. [ ] Go to "Admin Staff" page
3. [ ] Create new staff:
   - [ ] Name: "New Test Staff"
   - [ ] Store: "C42"
4. [ ] Note the generated access code
5. [ ] Wait for success message
6. [ ] Stop backend server (Ctrl+C)
7. [ ] Restart backend server (node index.js)
8. [ ] Login as Admin again

**Expected Result:**
- [ ] "New Test Staff" still appears in the list ✅
- [ ] Access code is the same ✅

---

## 🧪 Test 4: Admin Deletes Staff (Cascade)

**Goal**: Verify staff deletion removes their items

**Setup:**
- Need a staff member with some items
- Access code: `ABCDE` (default)

**Steps:**
1. [ ] Login as staff (`ABCDE`)
2. [ ] Add 5 items (so we can verify they get deleted)
3. [ ] Logout
4. [ ] Login as Admin
5. [ ] Go to "Admin Staff" page
6. [ ] Find staff "STAFF-1" (default staff)
7. [ ] Delete this staff member
8. [ ] Confirm deletion
9. [ ] Go to "Dashboard" to check items

**Expected Result:**
- [ ] Staff removed from list ✅
- [ ] All 5 items added by that staff are also deleted ✅
- [ ] Access code `ABCDE` no longer works (try login)

---

## 🧪 Test 5: Multiple Concurrent Users

**Goal**: Verify multiple staff can use app simultaneously

**Requirements:** 3 staff members with different codes

**Steps:**
1. [ ] Admin creates 2 more staff members:
   - [ ] Staff 2 (note code)
   - [ ] Staff 3 (note code)
2. [ ] Open 3 browser windows (or 3 devices)
3. [ ] Login in each window:
   - [ ] Window 1: Staff 1 (code: `ABCDE`)
   - [ ] Window 2: Staff 2 (new code)
   - [ ] Window 3: Staff 3 (new code)
4. [ ] Each window adds items (different items)
5. [ ] Verify each sees only their own items

**Expected Result:**
- [ ] Each user sees only their items ✅
- [ ] No cross-contamination of data ✅
- [ ] Dashboard shows correct counts ✅

---

## 🧪 Test 6: Data Integrity - No Duplicate Items

**Goal**: Verify same item isn't added twice

**Steps:**
1. [ ] Login as staff (`ABCDE`)
2. [ ] Add item: "Milk" (quantity: 5)
3. [ ] Add same item again: "Milk" (quantity: 5)
4. [ ] Check item count

**Expected Result:**
- [ ] 2 separate items exist (not merged) ✅
- [ ] Can edit/delete independently ✅

---

## 🧪 Test 7: Edit Item Persistence

**Goal**: Verify edited items save to database

**Steps:**
1. [ ] Add item: "Bread" (expires: tomorrow)
2. [ ] Edit the item: Change to "Whole Wheat Bread" (expires: next week)
3. [ ] Refresh page (Ctrl+R)
4. [ ] Verify changes persisted

**Expected Result:**
- [ ] Item name is "Whole Wheat Bread" ✅
- [ ] Expiration date is correct ✅

---

## 🧪 Test 8: Delete Item Persistence

**Goal**: Verify deleted items don't reappear

**Steps:**
1. [ ] Add 3 items
2. [ ] Delete the 2nd item
3. [ ] Refresh page
4. [ ] Check item count
5. [ ] Stop and restart backend
6. [ ] Refresh page again

**Expected Result:**
- [ ] Item count = 2 (after refresh) ✅
- [ ] Item count = 2 (after server restart) ✅
- [ ] Deleted item never reappears ✅

---

## 🧪 Test 9: Backup & Recovery

**Goal**: Verify database can be backed up and restored

**Steps:**
1. [ ] Add 10 items (so we have data to verify)
2. [ ] Backup database:
   ```bash
   cp backend/inventory.db backend/inventory.db.backup
   ```
3. [ ] Verify backup file exists:
   ```bash
   ls -lh backend/inventory.db*
   ```
4. [ ] Delete original database:
   ```bash
   rm backend/inventory.db
   ```
5. [ ] Restart backend (will create empty database)
6. [ ] Restore from backup:
   ```bash
   cp backend/inventory.db.backup backend/inventory.db
   ```
7. [ ] Restart backend
8. [ ] Login and verify all 10 items are back

**Expected Result:**
- [ ] All 10 items restored ✅
- [ ] No data loss ✅

---

## 🧪 Test 10: Admin Dashboard

**Goal**: Verify admin sees all data from all staff

**Steps:**
1. [ ] Create 3 staff members
2. [ ] Add items from each staff (different items)
3. [ ] Login as Admin
4. [ ] Go to Admin Dashboard

**Expected Result:**
- [ ] Admin sees all staff members ✅
- [ ] Admin sees all items from all staff ✅
- [ ] Counts are correct ✅
- [ ] Can delete any staff/item ✅

---

## 🧪 Test 11: Server Stability

**Goal**: Verify backend stays stable over time

**Steps:**
1. [ ] Keep backend running for 5 minutes
2. [ ] Continuously add items (5 second intervals)
3. [ ] Monitor backend console for errors
4. [ ] Check database file size regularly

**Expected Result:**
- [ ] No errors in console ✅
- [ ] Database file grows gradually (not suddenly) ✅
- [ ] Performance remains stable ✅

---

## 🧪 Test 12: Error Scenarios

### Invalid Login
1. [ ] Try login with wrong code
2. [ ] Expected: Error message, not logged in ✅

### Missing Data
1. [ ] Try to access deleted item
2. [ ] Expected: 404 or appropriate error ✅

### Database Corruption (Simulate)
1. [ ] Stop backend
2. [ ] Add garbage to database file:
   ```bash
   echo "corrupted" >> backend/inventory.db
   ```
3. [ ] Try to start backend
4. [ ] Expected: Error (don't corrupt your data!)
5. [ ] Restore from backup ✅

---

## 📊 Performance Metrics

Record these metrics for your reference:

| Metric | Expected | Actual |
|--------|----------|--------|
| Database file size (100 items) | < 1MB | _____ |
| Load time for dashboard | < 1 sec | _____ |
| Add item time | < 500ms | _____ |
| Delete item time | < 500ms | _____ |
| Backend memory usage | < 100MB | _____ |

---

## ✅ Final Verification

Before considering this complete, verify:

- [ ] All 12 tests passed ✅
- [ ] No console errors ✅
- [ ] Database file created (inventory.db) ✅
- [ ] Cross-device sync working ✅
- [ ] Admin controls working ✅
- [ ] Data persists after restart ✅
- [ ] Documentation reviewed ✅

---

## 📝 Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Backend Version:** Node.js `v22+`  
**Database:** SQLite `inventory.db`  

### Results:
- [ ] All tests PASSED ✅
- [ ] Ready for production deployment ✅

### Issues Found:
(List any issues here)
1. _______________
2. _______________

---

## 🎉 Sign-Off

**Tested by:** _______________  
**Date:** _______________  
**Status:** ✅ READY FOR PRODUCTION

---

**Notes:**
- This checklist covers all critical data persistence scenarios
- Estimated time: 30-45 minutes to complete all tests
- Run tests on staging before production deployment
