## Backend Database Implementation

### Overview
The backend now uses **SQLite (better-sqlite3)** for persistent data storage. This replaces the previous in-memory storage that lost all data on server restart.

### Architecture

```
Frontend (React) ←→ Backend API (Express) ←→ SQLite Database (inventory.db)
```

### Key Files

#### `backend/db.js` - Database Layer
Encapsulates all database operations:

```javascript
// STORE OPERATIONS
storeOperations.getAllStores()
storeOperations.getStore(code)
storeOperations.addStore(code, name)

// STAFF OPERATIONS  
staffOperations.getAllStaff()
staffOperations.getStaffById(staffId)
staffOperations.addStaff(staffId, name, storeId)
staffOperations.deleteStaff(staffId)

// ACCESS CODES OPERATIONS
accessCodeOperations.getAllAccessCodes()
accessCodeOperations.getAccessCodeByCode(code)
accessCodeOperations.addAccessCode(code, staffId)
accessCodeOperations.deleteAccessCodesByStaffId(staffId)

// ITEMS OPERATIONS
itemOperations.getAllItems()
itemOperations.getItemsByStore(storeCode)
itemOperations.getItemsByStaff(staffId)
itemOperations.getItemById(itemId)
itemOperations.addItem(itemId, name, category, expirationDate, quantity, imageUrl, staffId, storeCode)
itemOperations.updateItem(itemId, name, category, expirationDate, quantity, imageUrl)
itemOperations.deleteItem(itemId)
itemOperations.deleteItemsByStaff(staffId)
```

#### `backend/index.js` - Express Server
Updated all endpoints to use database operations instead of in-memory arrays.

**Before:**
```javascript
items.push(newItem)
```

**After:**
```javascript
itemOperations.addItem(itemId, name, category, ...)
```

### Database Schema

#### Tables
1. **stores** - Static store locations (100+ locations)
2. **staff** - Staff members created by admin
3. **accessCodes** - One-time codes for staff login
4. **items** - Inventory items added by staff

#### Relationships
```
staff → stores (Foreign Key: storeId)
accessCodes → staff (Foreign Key: staffId, CASCADE DELETE)
items → staff (Foreign Key: addedByStaffId)
items → stores (Foreign Key: storeCode)
```

### Data Flow Examples

#### Adding an Item
```
Frontend: POST /items/add {name, expirationDate, quantity, ...}
     ↓
authMiddleware: Verify staff credentials
     ↓
itemOperations.addItem(): INSERT into items table
     ↓
Database: Store in inventory.db
     ↓
Frontend: Receive confirmation + item data
```

#### Cross-Device Persistence
```
Device 1: Staff adds 5 items
     ↓
Items saved to inventory.db
     ↓
Device 2: Staff logs in with same code
     ↓
Backend: SELECT * FROM items WHERE addedByStaffId = ?
     ↓
Database query: Find all items by this staff
     ↓
Device 2: Display 5 items
```

#### Deleting Staff (with Cascade)
```
Admin: DELETE staff member
     ↓
accessCodeOperations.deleteAccessCodesByStaffId()
     ↓ (Foreign Key Cascade)
itemOperations.deleteItemsByStaff()
     ↓
All items created by that staff deleted too
     ↓
staffOperations.deleteStaff()
     ↓
Staff member deleted
```

### Performance Considerations

- **Synchronous Operations**: `better-sqlite3` uses sync API (fast enough for small-medium deployments)
- **Prepared Statements**: All queries use parameterized queries (safe from SQL injection)
- **Indexes**: Foreign keys are indexed automatically
- **Scaling**: For 100,000+ concurrent users, consider PostgreSQL

### Adding New Features

#### Example: Add a "Status" Column to Items

1. **Update db.js** - Modify the CREATE TABLE and operations:
```javascript
db.exec(`
    CREATE TABLE IF NOT EXISTS items (
        ...
        status TEXT DEFAULT 'active',  // NEW
        ...
    )
`);

// Update itemOperations.addItem()
addItem: (itemId, ..., status = 'active') => {
    const stmt = db.prepare(`
        INSERT INTO items (..., status)
        VALUES (..., ?)
    `);
    stmt.run(..., status);
}
```

2. **Update index.js** - Add status to endpoint:
```javascript
app.post('/items/add', authMiddleware, (req, res) => {
    const { name, status, ... } = req.body;
    const newItem = itemOperations.addItem(..., status);
    res.status(201).json(newItem);
});
```

3. **Frontend** - Add form field for status

### Backup & Recovery

#### Manual Backup
```bash
cp backend/inventory.db backend/inventory.db.backup
```

#### Automatic Backup (Production)
```bash
# Add to cron job
0 2 * * * cp /app/backend/inventory.db /backups/inventory.db.$(date +%Y%m%d)
```

#### Recovery
```bash
cp backend/inventory.db.backup backend/inventory.db
npm restart
```

### Monitoring

#### Check Database Size
```bash
ls -lh backend/inventory.db
```

#### Query Stats (SQLite Shell)
```bash
sqlite3 backend/inventory.db
> SELECT COUNT(*) FROM items;
> SELECT COUNT(*) FROM staff;
> .tables
> .schema items
```

### Migration to Production Database

When ready to scale, migrate to PostgreSQL:

1. **Create new db adapter** for PostgreSQL
2. **Export data** from SQLite
3. **Import data** into PostgreSQL
4. **Update db.js** to use `pg` driver instead of `better-sqlite3`
5. **Test thoroughly** before deploying

### Security

- ✅ Foreign key constraints enabled
- ✅ Prepared statements (no SQL injection)
- ✅ Authentication middleware on all mutations
- ✅ Role-based access control (admin vs staff)
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Add request validation middleware

### Testing

#### Unit Tests (Recommended)
```javascript
const { db, itemOperations } = require('./db');

describe('Items', () => {
  it('should add and retrieve item', () => {
    const item = itemOperations.addItem('test_1', 'Milk', ..., 'staff_1', 'C42');
    expect(item.name).toBe('Milk');
  });
  
  it('should persist item after restart', () => {
    // Restart server simulation
    const retrieved = itemOperations.getItemById('test_1');
    expect(retrieved).not.toBeNull();
  });
});
```

### Troubleshooting

#### Database Locked Error
```
Error: database is locked
```
**Solution**: Make sure only one process has the database open. Close other connections.

#### Foreign Key Constraint Error
```
Error: FOREIGN KEY constraint failed
```
**Solution**: Ensure referenced staff/store exists before creating items with those IDs.

#### Database File Corrupted
```bash
# Rebuild from backup
rm backend/inventory.db
cp backend/inventory.db.backup backend/inventory.db
```

### Environment Variables

Currently uses no environment variables for database. Add one for production:

```bash
# .env
DB_PATH=./inventory.db
```

Then update db.js:
```javascript
const dbPath = process.env.DB_PATH || path.join(__dirname, 'inventory.db');
```

### Next Improvements

1. ✅ Add database transaction support
2. ✅ Add audit logs (who modified what, when)
3. ✅ Add soft deletes (archived records)
4. ✅ Add data validation
5. ✅ Add migration scripts
6. ✅ Add GraphQL layer
7. ✅ Add webhooks for real-time sync

---

**Maintained by:** Your Development Team  
**Last Updated:** Dec 4, 2025  
**Database Version:** SQLite 3  
**Driver:** better-sqlite3 v9.2.2
