
// App.tsx
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AdminPage from './components/AdminPage';
import LoginPage from './components/LoginPage';
import StorePage from './components/StorePage';
import { User, Item, Staff, AccessCode } from './types';
import { stores as staticStores } from './data/stores';
import { mockItems, mockStaff, mockAccessCodes } from './data/mockData';
import { apiGet, apiPost, apiPut } from './utils/api';

const App: React.FC = () => {
  // Data State
  const [items, setItems] = useState<Item[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [stores, setStores] = useState<{ code: string; name: string }[]>(staticStores);
  
  // UI & Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdminView, setCurrentAdminView] = useState<'admin' | 'dashboard'>('admin');
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // 1. Restore Session & Cache on App Load
  useEffect(() => {
    const storedUser = localStorage.getItem('maf_user');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.role && parsedUser.credential) {
                setCurrentUser(parsedUser);
            }
        } catch (e) {
            localStorage.removeItem('maf_user');
        }
    }

    // Load Offline Cache - MERGE both standard and demo caches to ensure everything is available
    try {
        const cachedItems = JSON.parse(localStorage.getItem('maf_items_cache') || '[]');
        const demoItems = JSON.parse(localStorage.getItem('maf_demo_items') || '[]');
        // Merge items (simple concatenation, real app might de-dupe by ID)
        const combinedItems = [...cachedItems, ...demoItems.filter((di: Item) => !cachedItems.some((ci: Item) => ci.itemId === di.itemId))];
        if (combinedItems.length > 0) setItems(combinedItems);

        const cachedStaff = JSON.parse(localStorage.getItem('maf_staff_cache') || '[]');
        const demoStaff = JSON.parse(localStorage.getItem('maf_demo_staff') || '[]');
        const combinedStaff = [...cachedStaff, ...demoStaff.filter((ds: Staff) => !cachedStaff.some((cs: Staff) => cs.staffId === ds.staffId))];
        if (combinedStaff.length > 0) setStaff(combinedStaff);

        const cachedCodes = JSON.parse(localStorage.getItem('maf_codes_cache') || '[]');
        const demoCodes = JSON.parse(localStorage.getItem('maf_demo_codes') || '[]');
        const combinedCodes = [...cachedCodes, ...demoCodes.filter((dc: AccessCode) => !cachedCodes.some((cc: AccessCode) => cc.code === dc.code))];
        if (combinedCodes.length > 0) setAccessCodes(combinedCodes);

    } catch (e) {
        // Silent catch
    }

    setIsSessionLoading(false);
  }, []);

  // 2. Persist Cache whenever data changes
  useEffect(() => {
    if (items.length) localStorage.setItem('maf_items_cache', JSON.stringify(items));
    if (staff.length) localStorage.setItem('maf_staff_cache', JSON.stringify(staff));
    if (accessCodes.length) localStorage.setItem('maf_codes_cache', JSON.stringify(accessCodes));
  }, [items, staff, accessCodes]);

  // 3. Fetch Data when User Logs In
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isDemo) {
        // If we have cached data, use it. Otherwise use mock data.
        if (items.length === 0) {
             setItems(mockItems);
             setStaff(mockStaff);
             setAccessCodes(mockAccessCodes);
        }
        setIsDataLoading(false);
        return;
    }

    const fetchData = async () => {
        setIsDataLoading(true);
        try {
            let endpoint = currentUser.role === 'admin' ? '/data/all' : `/data/store?storeCode=${currentUser.storeId}`;
            const data = await apiGet(endpoint);
            
            if (data) {
                setItems(data.items || []);
                setStaff(data.staff || []);
                setAccessCodes(data.accessCodes || []);
                if (data.stores && data.stores.length > 0) setStores(data.stores);
            }
        } catch (error) {
            // If auth error, logout. Otherwise silently fail to cached data.
            if ((error as Error).message.includes('401')) {
                handleLogout();
            }
        } finally {
            setIsDataLoading(false);
        }
    };
    fetchData();
  }, [currentUser]);

  // --- Handlers ---

  const handleLogin = async (role: 'admin' | 'staff', credential: string, isDemo = false) => {
      // 0. Immediate Demo Check
      if (isDemo) {
        setOfflineUserGeneric(role, credential);
        return;
      }

      // 1. API Login Attempt
      try {
          const user = await apiPost('/login', { role, credential });
          setCurrentUser(user);
          localStorage.setItem('maf_user', JSON.stringify(user));
      } catch (error: any) {
          // 2. Fallback / Offline Mode Logic
          const normalizedCred = credential.trim();
          
          // A. Check hardcoded fallbacks
          // Handle explicit admin email even if on Store Login tab during offline fallback
          const isHardcodedAdmin = normalizedCred.toLowerCase() === 'mohamadhassoun012@gmail.com';
          const isHardcodedStaff = role === 'staff' && (normalizedCred.toLowerCase() === 'abcde' || normalizedCred.toLowerCase() === 'demo');

          if (isHardcodedAdmin) {
               setOfflineUserGeneric('admin', credential);
               return;
          }
          if (isHardcodedStaff) {
               setOfflineUserGeneric('staff', credential);
               return;
          }

          // B. Check against state (which now includes merged offline codes)
          if (role === 'staff') {
              const matchedCode = accessCodes.find(c => c.code.toUpperCase() === normalizedCred.toUpperCase());

              if (matchedCode) {
                  const matchedStaff = staff.find(s => s.staffId === matchedCode.staffId);
                  const offlineUser: User = {
                      staffId: matchedCode.staffId,
                      name: matchedStaff ? matchedStaff.name : matchedCode.staffId,
                      role: 'staff',
                      storeId: matchedCode.storeCode,
                      credential: credential,
                      isDemo: true
                  };
                  setCurrentUser(offlineUser);
                  localStorage.setItem('maf_user', JSON.stringify(offlineUser));
                  return;
              }
          }
          
          // Rethrow if not a valid fallback user
          throw new Error(error.message || 'Login failed');
      }
  };

  const setOfflineUserGeneric = (role: 'admin' | 'staff', credential: string) => {
      const offlineUser: User = {
          staffId: role === 'admin' ? 'admin_user' : 'DEMO-STAFF',
          name: role === 'admin' ? 'Admin' : 'Staff', 
          role: role,
          storeId: 'C42',
          credential: credential,
          isDemo: true
      };
      setCurrentUser(offlineUser);
      localStorage.setItem('maf_user', JSON.stringify(offlineUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('maf_user');
  };

  const handleAddItem = async (itemData: Omit<Item, 'itemId' | 'addedByStaffId' | 'storeCode'>) => {
    if (!currentUser) return;
    if (currentUser.isDemo) {
        const newItem: Item = {
            ...itemData,
            itemId: `demo_item_${Date.now()}`,
            addedByStaffId: currentUser.staffId,
            storeCode: currentUser.storeId || 'C42'
        };
        updateLocalItems([...items, newItem]);
        return;
    }
    try {
        const newItem = await apiPost('/items/add', { ...itemData, credential: currentUser.credential });
        setItems(prev => [...prev, newItem]);
    } catch (error: any) { 
        alert(`Failed: ${error.message}. Adding locally.`);
        // Fallback add locally
         const newItem: Item = {
            ...itemData,
            itemId: `offline_item_${Date.now()}`,
            addedByStaffId: currentUser.staffId,
            storeCode: currentUser.storeId || 'C42'
        };
        setItems(prev => [...prev, newItem]);
    }
  };

  const handleUpdateItem = async (updatedItem: Item) => {
    if (!currentUser) return;
    if (currentUser.isDemo) {
        updateLocalItems(items.map(i => i.itemId === updatedItem.itemId ? updatedItem : i));
        return;
    }
    try {
        const result = await apiPut(`/items/${updatedItem.itemId}`, { ...updatedItem, credential: currentUser.credential });
        setItems(prev => prev.map(i => i.itemId === result.itemId ? result : i));
    } catch (error: any) { 
        alert(`Failed: ${error.message}. Updating locally.`);
        setItems(prev => prev.map(i => i.itemId === updatedItem.itemId ? updatedItem : i));
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!currentUser) return;
    if (currentUser.isDemo) {
        updateLocalItems(items.filter(i => i.itemId !== itemId));
        return;
    }
    try {
        await apiPost(`/items/${itemId}/delete`, { credential: currentUser.credential });
        setItems(prev => prev.filter(i => i.itemId !== itemId));
    } catch (error: any) { 
        alert(`Failed: ${error.message}. Deleting locally.`);
        setItems(prev => prev.filter(i => i.itemId !== itemId));
    }
  };

  const updateLocalItems = (newItems: Item[]) => {
      setItems(newItems);
      localStorage.setItem('maf_demo_items', JSON.stringify(newItems));
  };

  const handleAddStaffAndCode = async (storeCode: string, staffIdInput: string): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') return false;
    
    // Check if we are offline or demo
    if (currentUser.isDemo) {
        return addStaffLocal(storeCode, staffIdInput);
    }

    try {
        const res: any = await apiPost('/admin/staff', { storeCode, staffId: staffIdInput, credential: currentUser.credential });
        setStaff(prev => [...prev, { staffId: res.staffId, name: res.staffId, storeId: storeCode }]);
        setAccessCodes(prev => [...prev, { code: res.accessCode, staffId: res.staffId, createdAt: Date.now(), storeCode }]);
        alert(`Success: Code ${res.accessCode}`);
        return true;
    } catch (error: any) { 
        return addStaffLocal(storeCode, staffIdInput);
    }
  };
  
  const addStaffLocal = (storeCode: string, staffIdInput: string): boolean => {
        const demoStaffId = staffIdInput || `staff_${Date.now()}`;
        const newStaff = { staffId: demoStaffId, name: demoStaffId, storeId: storeCode };
        const newCode = { code: Math.random().toString(36).substring(2, 7).toUpperCase(), staffId: demoStaffId, createdAt: Date.now(), storeCode };
        
        // Update state - this triggers the main useEffect to save to 'maf_codes_cache'
        setStaff(prev => [...prev, newStaff]);
        setAccessCodes(prev => [...prev, newCode]);

        // Backup to demo specific cache 
        try {
            const currentDemoStaff = JSON.parse(localStorage.getItem('maf_demo_staff') || '[]');
            const currentDemoCodes = JSON.parse(localStorage.getItem('maf_demo_codes') || '[]');
            localStorage.setItem('maf_demo_staff', JSON.stringify([...currentDemoStaff, newStaff]));
            localStorage.setItem('maf_demo_codes', JSON.stringify([...currentDemoCodes, newCode]));
        } catch(e) {}

        alert(`Offline/Demo Created: Code ${newCode.code} for ${demoStaffId}`);
        return true;
  }

  const handleDeleteCode = async (code: AccessCode) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!window.confirm(`Delete staff ${code.staffId}?`)) return;
    
    if (currentUser.isDemo) {
        deleteCodeLocal(code);
        return;
    }
    
    try {
        await apiPost(`/admin/codes/${code.code}/delete`, { credential: currentUser.credential });
        setAccessCodes(prev => prev.filter(c => c.code !== code.code));
        setStaff(prev => prev.filter(s => s.staffId !== code.staffId));
    } catch (error: any) { 
        deleteCodeLocal(code);
    }
  };
  
  const deleteCodeLocal = (code: AccessCode) => {
        setAccessCodes(prev => prev.filter(c => c.code !== code.code));
        setStaff(prev => prev.filter(s => s.staffId !== code.staffId));
        
        // Also update demo cache
        try {
             const currentDemoCodes = JSON.parse(localStorage.getItem('maf_demo_codes') || '[]');
             const newDemoCodes = currentDemoCodes.filter((c: AccessCode) => c.code !== code.code);
             localStorage.setItem('maf_demo_codes', JSON.stringify(newDemoCodes));
        } catch(e) {}
  }

  if (isSessionLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  if (!currentUser) return <LoginPage onLoginAttempt={handleLogin} />;

  if (isDataLoading) return (
      <div className="flex h-screen items-center justify-center bg-white">
          <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading data...</p>
          </div>
      </div>
  );

  const appData = { items, staff, accessCodes, stores };

  return (
    <div className="bg-background min-h-screen text-text-dark">
      {currentUser.role === 'admin' ? 
          (currentAdminView === 'admin' ? 
            <AdminPage appData={appData} onNavigateToDashboard={() => setCurrentAdminView('dashboard')} onLogout={handleLogout} onAddStaffAndCode={handleAddStaffAndCode} onDeleteCode={handleDeleteCode}/> : 
            <Dashboard appData={appData} currentUser={currentUser} onNavigateToAdmin={() => setCurrentAdminView('admin')} onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />
          ) : 
          <StorePage appData={appData} currentUser={currentUser} onLogout={handleLogout} onAddItem={handleAddItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />
      }
    </div>
  );
};

export default App;
