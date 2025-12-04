
// data/mockData.ts
import { Item, Staff, AccessCode } from '../types';

const today = new Date();
const toYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

const d1 = new Date(today); d1.setDate(today.getDate() + 5);
const d2 = new Date(today); d2.setDate(today.getDate() - 2);
const d3 = new Date(today); d3.setDate(today.getDate() + 10);
const d4 = new Date(today); d4.setDate(today.getDate() + 30);

export const mockItems: Item[] = [
    { 
        itemId: 'item_demo_1', 
        name: 'Almarai Fresh Milk', 
        category: 'Dairy', 
        expirationDate: toYYYYMMDD(d1), 
        notificationDays: 7, 
        quantity: 15, 
        imageUrl: 'https://i.imgur.com/iVv5vFw.png', 
        addedByStaffId: 'DEMO-STAFF', 
        storeCode: 'C42' 
    },
    { 
        itemId: 'item_demo_2', 
        name: 'Sliced Bread', 
        category: 'Bakery', 
        expirationDate: toYYYYMMDD(d2), 
        notificationDays: 3, 
        quantity: 4, 
        imageUrl: 'https://i.imgur.com/T5f1p3w.png', 
        addedByStaffId: 'DEMO-STAFF', 
        storeCode: 'C42' 
    },
    { 
        itemId: 'item_demo_3', 
        name: 'Cheddar Cheese', 
        category: 'Dairy', 
        expirationDate: toYYYYMMDD(d3), 
        notificationDays: 10, 
        quantity: 20, 
        imageUrl: 'https://i.imgur.com/eAnC7Vz.png', 
        addedByStaffId: 'DEMO-STAFF', 
        storeCode: 'C16' 
    },
     { 
        itemId: 'item_demo_4', 
        name: 'Orange Juice', 
        category: 'Beverages', 
        expirationDate: toYYYYMMDD(d4), 
        notificationDays: 10, 
        quantity: 12, 
        imageUrl: '', 
        addedByStaffId: 'DEMO-STAFF', 
        storeCode: 'C42' 
    }
];

export const mockStaff: Staff[] = [
    { staffId: 'DEMO-STAFF', name: 'Demo Staff', storeId: 'C42' },
    { staffId: 'admin_user', name: 'Admin', storeId: 'C42' }
];

export const mockAccessCodes: AccessCode[] = [
    { code: 'DEMO', staffId: 'DEMO-STAFF', storeCode: 'C42', createdAt: Date.now() }
];
