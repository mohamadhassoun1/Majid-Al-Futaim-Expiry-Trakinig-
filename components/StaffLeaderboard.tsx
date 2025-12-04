
// components/StaffLeaderboard.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Item, Staff, AccessCode } from '../types';

interface StaffLeaderboardProps {
  allItems: Item[];
  staffList: Staff[];
  accessCodes: AccessCode[];
  stores: { code: string, name: string }[];
}

const StaffLeaderboard: React.FC<StaffLeaderboardProps> = ({ allItems, staffList, accessCodes, stores }) => {
  // Like System State
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLikedHistory, setUserLikedHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load likes from local storage
    try {
        const storedLikes = localStorage.getItem('maf_staff_likes_counts');
        const storedHistory = localStorage.getItem('maf_user_likes_history');
        
        if (storedLikes) setLikes(JSON.parse(storedLikes));
        if (storedHistory) setUserLikedHistory(JSON.parse(storedHistory));
    } catch (e) {
        console.error("Failed to load likes from storage", e);
    }
  }, []);

  const handleLike = (staffId: string) => {
    if (userLikedHistory.includes(staffId)) return; // Prevent multiple likes

    const newCount = (likes[staffId] || 0) + 1;
    const newLikes = { ...likes, [staffId]: newCount };
    const newHistory = [...userLikedHistory, staffId];

    setLikes(newLikes);
    setUserLikedHistory(newHistory);

    // Save to storage
    localStorage.setItem('maf_staff_likes_counts', JSON.stringify(newLikes));
    localStorage.setItem('maf_user_likes_history', JSON.stringify(newHistory));
  };

  const leaderboard = useMemo(() => {
    const allItemsList = allItems;
    const allStaff = staffList;
    
    // Create a map of staff scores
    const staffScores = new Map<string, number>();
    const staffStores = new Map<string, string>();

    // Initialize with 0 for all known staff
    allStaff.forEach(s => {
        staffScores.set(s.staffId, 0);
        staffStores.set(s.staffId, s.storeId);
    });

    // Count items per staff
    allItemsList.forEach(item => {
        if (item.addedByStaffId) {
            const current = staffScores.get(item.addedByStaffId) || 0;
            staffScores.set(item.addedByStaffId, current + 1);
            
            // If we find an item from a staff not in staffList (legacy data), track their store
            if (!staffStores.has(item.addedByStaffId) && item.storeCode) {
                 staffStores.set(item.addedByStaffId, item.storeCode);
            }
        }
    });

    // Convert map to array
    const data = Array.from(staffScores.entries()).map(([staffId, score]) => {
      const storeCode = staffStores.get(staffId) || '';
      const store = stores.find(s => s.code === storeCode);
      const storeName = store ? store.name : (storeCode ? `Store ${storeCode}` : 'Unknown Store');
      
      // Find name from staff list or default to ID
      const staffMember = allStaff.find(s => s.staffId === staffId);
      const name = staffMember ? staffMember.name : staffId;

      return { staffId, name, storeName, score };
    });

    // STRICT FILTER TO REMOVE ADMIN
    const filteredData = data.filter(entry => {
        const lowerName = entry.name.trim().toLowerCase();
        const lowerId = entry.staffId.trim().toLowerCase();
        
        // Filter out by specific IDs or if 'admin' appears in the name
        return (
            lowerId !== 'admin_user' && 
            lowerId !== 'admin' &&
            !lowerName.includes('admin')
        );
    });

    // Sort descending by score
    filteredData.sort((a, b) => b.score - a.score);
    return filteredData;
  }, [allItems, staffList, stores]);

  const handleExportCSV = () => {
    if (leaderboard.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ['Rank', 'Name', 'Staff ID', 'Store Name', 'Items Added', 'Likes'];
    const csvRows = [
      headers.join(','),
      ...leaderboard.map((row, index) => 
        [
          index + 1,
          `"${row.name.replace(/"/g, '""')}"`,
          `"${row.staffId}"`,
          `"${row.storeName.replace(/"/g, '""')}"`,
          row.score,
          likes[row.staffId] || 0
        ].join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'staff_leaderboard.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to generate initials avatar
  const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
  };

  // Helper colors for avatars
  const getAvatarColor = (index: number) => {
      const colors = ['bg-purple-100 text-purple-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-pink-100 text-pink-600'];
      return colors[index % colors.length];
  };

  const topThree = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3);

  const LikeButton = ({ staffId, isLight = false }: { staffId: string, isLight?: boolean }) => {
      const isLiked = userLikedHistory.includes(staffId);
      const count = likes[staffId] || 0;

      return (
        <button 
            onClick={() => handleLike(staffId)}
            disabled={isLiked}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                isLight 
                 ? `text-white bg-white/20 hover:bg-white/30 ${isLiked ? 'opacity-100 ring-2 ring-white' : 'opacity-80'}`
                 : isLiked 
                    ? 'text-primary bg-blue-50' 
                    : 'text-gray-400 hover:text-primary hover:bg-gray-100'
            }`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span className="text-xs font-bold">{count}</span>
        </button>
      );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      
      {/* Top Section - Blue Gradient Background */}
      <div className="bg-gradient-to-b from-[#4481EB] to-[#04BEFE] p-6 pb-12 rounded-b-[2.5rem] shadow-lg relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            <button
                onClick={handleExportCSV}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
            >
                Export CSV
            </button>
        </div>

        {/* Podium Layout */}
        <div className="flex justify-center items-end gap-3 sm:gap-6 min-h-[180px]">
             {/* Rank 2 (Left) */}
             {leaderboard[1] && (
                 <div className="flex flex-col items-center animate-slide-up w-1/3" style={{animationDelay: '0.1s'}}>
                    <div className="relative mb-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#4FD2C2] bg-white flex items-center justify-center overflow-hidden shadow-lg">
                             <span className="text-lg sm:text-xl font-bold text-gray-700">{getInitials(leaderboard[1].name)}</span>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#4FD2C2] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">2</div>
                    </div>
                    <p className="text-white font-semibold text-xs sm:text-sm truncate w-full text-center px-1">{leaderboard[1].name}</p>
                    <p className="text-blue-100 text-xs font-medium mb-1">{leaderboard[1].score} pts</p>
                    <div className="mb-2"><LikeButton staffId={leaderboard[1].staffId} isLight={true} /></div>
                    <div className="h-20 w-full mt-auto rounded-t-lg bg-[#4FD2C2]/40 backdrop-blur-sm"></div>
                 </div>
             )}

             {/* Rank 1 (Center - Elevated) */}
             {leaderboard[0] && (
                 <div className="flex flex-col items-center z-20 -mb-2 animate-slide-up w-1/3">
                    <div className="relative mb-2">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl drop-shadow-md animate-bounce-slow">👑</div>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#FFB950] bg-white flex items-center justify-center overflow-hidden shadow-xl">
                             <span className="text-2xl sm:text-3xl font-bold text-gray-800">{getInitials(leaderboard[0].name)}</span>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FFB950] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">1</div>
                    </div>
                    <p className="text-white font-bold text-sm sm:text-base truncate w-full text-center px-1">{leaderboard[0].name}</p>
                    <p className="text-yellow-100 text-sm font-bold mb-1">{leaderboard[0].score} pts</p>
                    <div className="mb-2"><LikeButton staffId={leaderboard[0].staffId} isLight={true} /></div>
                    <div className="h-32 w-full mt-auto rounded-t-lg bg-[#FFB950]/40 backdrop-blur-sm shadow-lg"></div>
                 </div>
             )}

             {/* Rank 3 (Right) */}
             {leaderboard[2] && (
                 <div className="flex flex-col items-center animate-slide-up w-1/3" style={{animationDelay: '0.2s'}}>
                    <div className="relative mb-2">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#7696F1] bg-white flex items-center justify-center overflow-hidden shadow-lg">
                             <span className="text-lg sm:text-xl font-bold text-gray-700">{getInitials(leaderboard[2].name)}</span>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#7696F1] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">3</div>
                    </div>
                    <p className="text-white font-semibold text-xs sm:text-sm truncate w-full text-center px-1">{leaderboard[2].name}</p>
                    <p className="text-blue-100 text-xs font-medium mb-1">{leaderboard[2].score} pts</p>
                    <div className="mb-2"><LikeButton staffId={leaderboard[2].staffId} isLight={true} /></div>
                    <div className="h-16 w-full mt-auto rounded-t-lg bg-[#7696F1]/40 backdrop-blur-sm"></div>
                 </div>
             )}
        </div>
      </div>

      {/* Bottom List Section */}
      <div className="bg-white flex-grow px-4 pb-4 pt-8 -mt-6 rounded-t-[2rem] z-0 relative overflow-y-auto">
        <div className="space-y-3">
           {restList.length > 0 ? (
               restList.map((entry, idx) => {
                 const rank = idx + 4;
                 return (
                    <div key={entry.staffId} className="flex items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                        <span className="w-6 text-center text-gray-400 font-bold text-sm mr-2">{rank}</span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${getAvatarColor(idx)}`}>
                            {getInitials(entry.name)}
                        </div>
                        <div className="flex-grow min-w-0 mr-2">
                            <p className="text-text-dark font-semibold text-sm truncate">{entry.name}</p>
                            <p className="text-text-light text-xs truncate">{entry.storeName}</p>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                            <div className="flex items-center text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                <span className="text-xs font-bold mr-1">{entry.score}</span>
                                <span className="text-[10px] text-gray-400">items</span>
                            </div>
                            <LikeButton staffId={entry.staffId} />
                        </div>
                    </div>
                 )
               })
           ) : (
             <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">No more staff to display.</p>
             </div>
           )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translate(-50%, -25%); }
            50% { transform: translate(-50%, 0); }
        }
        .animate-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-bounce-slow {
            animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default StaffLeaderboard;
