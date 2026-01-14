import React, { useState, useEffect } from 'react';
import { 
  User, Droplet, Calendar, Gift, Settings, ChevronDown, Lock, UserPlus, LogOut, ShieldCheck, Carrot, Pill, Users, Link, Coins
} from 'lucide-react';
import { 
  ScreenView, ChildData, WaterLogEntry, PoopLogEntry, 
  Reward, RewardItem, PoopType, DAILY_WATER_GOAL, Gender, RewardTier, ParentProfile, XP_THRESHOLDS
} from './types';
import { INITIAL_CHILD_DATA, DEFAULT_REWARDS } from './constants';
import { getKnightMission } from './services/geminiService';

// Components
import { LevelBadge } from './components/LevelBadge';
import { WaterQuest } from './components/WaterQuest';
import { PoopLog } from './components/PoopLog';
import { RewardGacha } from './components/RewardGacha';
import { ParentDashboard } from './components/ParentDashboard';

// --- 구글 서버 연결 부품 추가 ---

import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
const db = (window as any).db;

type AuthMode = 'LOGIN' | 'SIGNUP' | 'PARENT_SIGNUP';
type UserType = 'CHILD' | 'PARENT';

export default function App() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// Global State (서버 연동용으로 교체)
  const [children, setChildren] = useState<ChildData[]>(INITIAL_CHILD_DATA);
  const [parents, setParents] = useState<ParentProfile[]>([]);

  // 서버 데이터 실시간 연결
  useEffect(() => {
    if (!db) return;
    
    const unsubChildren = onSnapshot(collection(db, 'children'), (snapshot) => {
      if (!snapshot.empty) {
        setChildren(snapshot.docs.map(doc => doc.data() as ChildData));
      }
    });
    
    const unsubParents = onSnapshot(collection(db, 'parents'), (snapshot) => {
      if (!snapshot.empty) {
        setParents(snapshot.docs.map(doc => doc.data() as ParentProfile));
      }
    });

    return () => { unsubChildren(); unsubParents(); };
  }, []);

  // [중요] 기존에 중복으로 있던 useEffect나 useState 코드가 있다면 모두 지워주세요.  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<UserType>('CHILD');
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  
  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  
  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupGender, setSignupGender] = useState<Gender>('MALE');
  
  // Link Child Form
  const [linkChildId, setLinkChildId] = useState('');

  // App View State
  const [currentView, setCurrentView] = useState<ScreenView>('HOME');
  const [parentRewards, setParentRewards] = useState<RewardItem[]>(() => {
    const saved = localStorage.getItem('knight_rewards_data');
    return saved ? JSON.parse(saved) : DEFAULT_REWARDS;
  });
  const [dailyMessage, setDailyMessage] = useState<string>("기사님! 오늘도 건강한 하루 되세요!");
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('knight_children_data', JSON.stringify(children));
  }, [children]);

  useEffect(() => {
    localStorage.setItem('knight_parents_data', JSON.stringify(parents));
  }, [parents]);

  useEffect(() => {
    localStorage.setItem('knight_rewards_data', JSON.stringify(parentRewards));
  }, [parentRewards]);

  // Computed - Active Child/Parent Helpers
  const activeChild = children.find(c => c.profile.id === activeChildId);
  const activeParent = parents.find(p => p.id === activeParentId);

  // Effects
  useEffect(() => {
    // Generate daily mission on mount or active child change
    if (activeChild && currentUserType === 'CHILD') {
       const fetchMission = async () => {
          // Mock streak calculation
          const streak = 2; 
          const msg = await getKnightMission(activeChild.profile.level, streak);
          setDailyMessage(msg);
       };
       fetchMission();
    }
  }, [activeChildId, currentUserType]);

  // Toast Helper
  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => {
        setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Helper: Calculate Level and XP
  const calculateLevelAndXp = (currentLevel: number, currentXp: number, addedXp: number) => {
      let newLevel = currentLevel;
      let newXp = currentXp + addedXp;

      // Level Up Logic
      if (newLevel === 1 && newXp >= XP_THRESHOLDS.LEVEL_2) {
          newLevel = 2;
          newXp -= XP_THRESHOLDS.LEVEL_2;
      } else if (newLevel === 2 && newXp >= XP_THRESHOLDS.LEVEL_3) {
          newLevel = 3;
          newXp -= XP_THRESHOLDS.LEVEL_3;
      }

      // Level Down Logic (If XP becomes negative)
      if (newXp < 0) {
          if (newLevel > 1) {
              newLevel -= 1;
              const prevThreshold = newLevel === 1 ? XP_THRESHOLDS.LEVEL_2 : XP_THRESHOLDS.LEVEL_3;
              newXp = prevThreshold + newXp;
          } else {
              newXp = 0; // Cap at 0 for Level 1
          }
      }

      return { newLevel, newXp };
  };

  // Auth Handlers
  const handleLogin = () => {
    // Try Child Login
    const child = children.find(c => c.profile.username === loginId && c.profile.password === loginPw);
    if (child) {
      setActiveChildId(child.profile.id);
      setCurrentUserType('CHILD');
      setIsLoggedIn(true);
      setLoginId('');
      setLoginPw('');
      return;
    }

    // Try Parent Login
    const parent = parents.find(p => p.username === loginId && p.password === loginPw);
    if (parent) {
      setActiveParentId(parent.id);
      setCurrentUserType('PARENT');
      setIsLoggedIn(true);
      setLoginId('');
      setLoginPw('');
      setCurrentView('PARENT_HUB');
      return;
    }

    alert('아이디 또는 비밀번호가 올바르지 않습니다.');
  };

  const handleSignup = () => {
    if (!signupName || !signupId || !signupPw) {
      alert('모든 정보를 입력해주세요.');
      return;
    }
    
    // Check ID Uniqueness
    if (children.some(c => c.profile.username === signupId) || parents.some(p => p.username === signupId)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    if (authMode === 'SIGNUP') { // Child Signup
        if (!signupAge) { alert('나이를 입력해주세요.'); return; }
        
        const newChild: ChildData = {
            profile: {
                id: `child_${Date.now()}`,
                username: signupId,
                password: signupPw,
                name: signupName,
                age: parseInt(signupAge),
                gender: signupGender,
                level: 1,
                xp: 0,
                tickets: { silver: 0, gold: 0 }
            },
            waterLogs: [],
            poopLogs: [],
            vegetableLogs: [],
            probioticsLogs: [],
            wonRewards: []
        };
        setChildren(prev => [...prev, newChild]);
        setActiveChildId(newChild.profile.id);
        setCurrentUserType('CHILD');
    } else { // Parent Signup
        const newParent: ParentProfile = {
            id: `parent_${Date.now()}`,
            username: signupId,
            password: signupPw,
            name: signupName,
            linkedChildIds: []
        };
        setParents(prev => [...prev, newParent]);
        setActiveParentId(newParent.id);
        setCurrentUserType('PARENT');
        setCurrentView('PARENT_HUB');
    }

    setIsLoggedIn(true);
    // Reset Form
    setSignupName('');
    setSignupId('');
    setSignupPw('');
    setSignupAge('');
    setSignupGender('MALE');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveChildId(null);
    setActiveParentId(null);
    setAuthMode('LOGIN');
    setCurrentView('HOME');
  };

  // State Updates Helpers
  const updateActiveChild = (updater: (child: ChildData) => ChildData) => {
    setChildren(prev => {
        const newChildren = [...prev];
        const idx = newChildren.findIndex(c => c.profile.id === activeChildId);
        if (idx >= 0) {
            newChildren[idx] = updater(newChildren[idx]);
        }
        return newChildren;
    });
  };

  const updateChildById = (id: string, updater: (child: ChildData) => ChildData) => {
    setChildren(prev => {
        const newChildren = [...prev];
        const idx = newChildren.findIndex(c => c.profile.id === id);
        if (idx >= 0) {
            newChildren[idx] = updater(newChildren[idx]);
        }
        return newChildren;
    });
  };

  // --- Parent Logic ---
  const handleLinkChild = () => {
      if (!activeParentId) return;
      const childToLink = children.find(c => c.profile.username === linkChildId);
      
      if (!childToLink) {
          alert('해당 아이디를 가진 자녀를 찾을 수 없습니다.');
          return;
      }

      setParents(prev => prev.map(p => {
          if (p.id === activeParentId) {
              if (p.linkedChildIds.includes(childToLink.profile.id)) {
                  alert('이미 연동된 자녀입니다.');
                  return p;
              }
              return { ...p, linkedChildIds: [...p.linkedChildIds, childToLink.profile.id] };
          }
          return p;
      }));
      setLinkChildId('');
      alert(`${childToLink.profile.name} 기사님이 연동되었습니다!`);
  };

  // --- Child Logic ---
  const handleAddChild = (name: string, age: number, gender: Gender) => {
    const newChild: ChildData = {
        profile: {
            id: `child_${Date.now()}`,
            username: `user_${Date.now()}`, 
            password: '123',
            name,
            age,
            gender,
            level: 1,
            xp: 0,
            tickets: { silver: 0, gold: 0 }
        },
        waterLogs: [],
        poopLogs: [],
        vegetableLogs: [],
        probioticsLogs: [],
        wonRewards: []
    };
    setChildren(prev => [...prev, newChild]);
  };

  const handleEditChild = (id: string, name: string, age: number, gender: Gender) => {
    updateChildById(id, child => ({
      ...child,
      profile: {
        ...child.profile,
        name,
        age,
        gender
      }
    }));
  };

  const handleDeleteChild = (id: string) => {
     setChildren(prev => {
       const newChildren = prev.filter(c => c.profile.id !== id);
       return newChildren;
     });
     // Also remove from parent links
     setParents(prev => prev.map(p => ({
         ...p,
         linkedChildIds: p.linkedChildIds.filter(cid => cid !== id)
     })));

     if (id === activeChildId) {
        if (currentUserType === 'CHILD') handleLogout();
        else setActiveChildId(null);
     }
  };

  const handleEditRewardItem = (id: string, title: string, tier: RewardTier) => {
    setParentRewards(prev => prev.map(item => item.id === id ? { ...item, title, tier } : item));
  };

  const handleUpdateWater = (date: string, count: number) => {
    const targetChildId = activeChildId;
    if (!targetChildId) return;

    updateChildById(targetChildId, child => {
        const newLogs = [...child.waterLogs];
        const index = newLogs.findIndex(w => w.date === date);
        const prevCount = index >= 0 ? newLogs[index].count : 0;

        if (index >= 0) {
            if (count === 0) newLogs.splice(index, 1);
            else newLogs[index].count = count;
        } else if (count > 0) {
            newLogs.push({ date: date, count });
        }
        
        // XP Calculation: Allow XP gain/loss for ANY date
        let addedXp = 0;
        if (count > prevCount) {
            // Added water
            addedXp = count === DAILY_WATER_GOAL ? 20 : 5;
        } else if (count < prevCount) {
             // Removed water (Undo)
            addedXp = prevCount === DAILY_WATER_GOAL ? -20 : -5;
        }

        const { newLevel, newXp } = calculateLevelAndXp(child.profile.level, child.profile.xp, addedXp);

        return {
            ...child,
            waterLogs: newLogs,
            profile: { ...child.profile, xp: newXp, level: newLevel }
        };
    });
  };

  // Modified to accept specific date and support Parent dashboard logging with XP support
  const handleToggleLog = (date: string, type: 'VEGGIE' | 'PROBIOTICS') => {
      if (!activeChildId) return;
      
      updateChildById(activeChildId, child => {
          const currentLogs = type === 'VEGGIE' 
             ? (child.vegetableLogs || []) 
             : (child.probioticsLogs || []);
          
          const existingEntry = currentLogs.find(l => l.date === date);
          
          let newLogs;
          let addedXp = 0;

          if (existingEntry && existingEntry.isDone) {
              // Toggle Off (Undo)
              newLogs = currentLogs.filter(l => l.date !== date);
              addedXp = -30; // Deduct XP if undone
          } else {
              // Toggle On
              newLogs = [...currentLogs.filter(l => l.date !== date), { date: date, isDone: true }];
              addedXp = 30; // 30 XP for healthy habit (Applied to any date now)
          }

          const { newLevel, newXp } = calculateLevelAndXp(child.profile.level, child.profile.xp, addedXp);

          return {
              ...child,
              [type === 'VEGGIE' ? 'vegetableLogs' : 'probioticsLogs']: newLogs,
              profile: { ...child.profile, xp: newXp, level: newLevel }
          };
      });
  };

  const handleAddWater = () => {
     const todayWaterCount = activeChild?.waterLogs.find(w => w.date === todayStr)?.count || 0;
     if (todayWaterCount < DAILY_WATER_GOAL) {
       handleUpdateWater(todayStr, todayWaterCount + 1);
     }
  };

  const handleAddPastPoop = (date: string, type: PoopType) => {
    if (!activeChildId) return;
    updateChildById(activeChildId, child => {
        const newEntry: PoopLogEntry = {
            id: Date.now().toString(),
            date: date,
            timestamp: new Date(date).getTime() + 12 * 60 * 60 * 1000,
            type
        };
        const newLogs = [...child.poopLogs, newEntry];
        
        let newTickets = { ...child.profile.tickets };

        // XP for Poop (Applied to any date now)
        const addedXp = 50;

        // Bonus Tickets check (keep simplified, assume 3rd poop always gives ticket if recorded)
        if ((newLogs.length) % 3 === 0) {
             newTickets.silver += 1;
             // Only alert if we are in Child Mode or it's Today
             if (currentUserType === 'CHILD' || date === todayStr) {
                setTimeout(() => showToast('뽑기권을 획득했어요!'), 0);
             }
        }
        
        const { newLevel, newXp } = calculateLevelAndXp(child.profile.level, child.profile.xp, addedXp);

        return {
            ...child,
            poopLogs: newLogs,
            profile: { ...child.profile, xp: newXp, level: newLevel, tickets: newTickets }
        };
    });
  };

  const handleAddPoop = (type: PoopType) => {
    handleAddPastPoop(todayStr, type);
    setCurrentView('HOME'); 
  };

  const handleRedeemTicket = (ticketType: 'silver' | 'gold', rewardItem: RewardItem) => {
    updateActiveChild(child => ({
        ...child,
        profile: {
            ...child.profile,
            tickets: {
                ...child.profile.tickets,
                [ticketType]: child.profile.tickets[ticketType] - 1
            }
        },
        wonRewards: [
            ...child.wonRewards,
            { 
              ...rewardItem, 
              id: `won_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              isRedeemed: false, 
              dateWon: new Date().toISOString() 
            }
        ]
    }));
  };

  const handleMarkRewardRedeemed = (id: string) => {
    if (!activeChildId) return;
    updateChildById(activeChildId, child => ({
        ...child,
        wonRewards: child.wonRewards.map(r => r.id === id ? { ...r, isRedeemed: true } : r)
    }));
  };

  const handleSwitchChild = (id: string) => {
      setActiveChildId(id);
  };

  // Render Helpers
  const NavButton = ({ view, icon: Icon, label }: { view: ScreenView, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${currentView === view ? 'text-amber-600' : 'text-gray-400'}`}
    >
      <Icon className={`w-6 h-6 mb-1 ${currentView === view ? 'scale-110' : ''}`} />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );

  // --- Auth Screens ---
  if (!isLoggedIn) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 relative overflow-hidden">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             
             <div className="z-10 w-full max-w-md">
                 <div className="text-center mb-10">
                    <div className="inline-block p-4 rounded-full bg-slate-800 border-4 border-amber-500 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                        <ShieldCheck className="w-16 h-16 text-amber-500" />
                    </div>
                    <h1 className="text-4xl font-bold game-font text-amber-400 mb-2">쾌변의 기사단</h1>
                    <p className="text-slate-400">용감한 기사들이여, 건강을 지켜라!</p>
                 </div>

                 {authMode === 'LOGIN' ? (
                     <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
                         <h2 className="text-2xl font-bold mb-6 text-center game-font">로그인</h2>
                         <div className="space-y-4">
                             <input 
                                type="text" 
                                placeholder="아이디" 
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition"
                             />
                             <input 
                                type="password" 
                                placeholder="비밀번호" 
                                value={loginPw}
                                onChange={(e) => setLoginPw(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 text-white focus:border-amber-500 focus:outline-none transition"
                             />
                             <button 
                                onClick={handleLogin}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:from-amber-400 hover:to-orange-500 transition active:scale-95"
                             >
                                 입장하기
                             </button>
                         </div>
                         <div className="mt-6 flex flex-col gap-3 text-center">
                             <div>
                                <span className="text-slate-500 text-sm">아직 기사단원이 아닌가요?</span>
                                <button 
                                    onClick={() => setAuthMode('SIGNUP')}
                                    className="text-amber-500 font-bold text-sm ml-2 hover:underline"
                                >
                                    기사단 가입하기
                                </button>
                             </div>
                             <div className="border-t border-slate-700 pt-3">
                                <span className="text-slate-500 text-sm">보호자이신가요?</span>
                                <button 
                                    onClick={() => setAuthMode('PARENT_SIGNUP')}
                                    className="text-amber-500 font-bold text-sm ml-2 hover:underline"
                                >
                                    부모님 가입하기
                                </button>
                             </div>
                         </div>
                     </div>
                 ) : (
                    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-center game-font">
                                {authMode === 'SIGNUP' ? '기사단 가입신청서' : '부모님 가입하기'}
                            </h2>
                            <button onClick={() => setAuthMode('LOGIN')} className="text-slate-400 hover:text-white text-sm">뒤로가기</button>
                        </div>
                        
                        <div className="space-y-3">
                            <input 
                               type="text" 
                               placeholder={authMode === 'SIGNUP' ? "이름 (캐릭터명)" : "이름"} 
                               value={signupName}
                               onChange={(e) => setSignupName(e.target.value)}
                               className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-sm"
                            />
                            <input 
                               type="text" 
                               placeholder="희망 아이디" 
                               value={signupId}
                               onChange={(e) => setSignupId(e.target.value)}
                               className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-sm"
                            />
                            <input 
                               type="password" 
                               placeholder="비밀번호" 
                               value={signupPw}
                               onChange={(e) => setSignupPw(e.target.value)}
                               className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-sm"
                            />
                            
                            {authMode === 'SIGNUP' && (
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    placeholder="나이" 
                                    value={signupAge}
                                    onChange={(e) => setSignupAge(e.target.value)}
                                    className="w-1/3 bg-slate-700 border border-slate-600 rounded-xl p-3 text-white focus:border-amber-500 focus:outline-none text-sm"
                                />
                                <div className="flex flex-1 gap-2 bg-slate-700 p-1 rounded-xl border border-slate-600">
                                    <button 
                                        onClick={() => setSignupGender('MALE')}
                                        className={`flex-1 rounded-lg text-xs font-bold transition ${signupGender === 'MALE' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                    >남자</button>
                                    <button 
                                        onClick={() => setSignupGender('FEMALE')}
                                        className={`flex-1 rounded-lg text-xs font-bold transition ${signupGender === 'FEMALE' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}
                                    >여자</button>
                                </div>
                            </div>
                            )}

                            <button 
                               onClick={handleSignup}
                               className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-500 transition active:scale-95 mt-4"
                            >
                                가입 완료
                            </button>
                        </div>
                    </div>
                 )}
             </div>
          </div>
      );
  }

  // --- Parent Hub View ---
  if (isLoggedIn && currentUserType === 'PARENT' && currentView === 'PARENT_HUB') {
      return (
        <div className="h-screen w-full flex flex-col bg-slate-100">
             <header className="p-4 bg-slate-800 text-white shadow-md flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <Settings className="w-5 h-5" />
                     <h1 className="text-xl font-bold game-font">부모님 자녀 관리</h1>
                 </div>
                 <button onClick={handleLogout} className="text-sm text-slate-300 hover:text-white">로그아웃</button>
             </header>

             <main className="flex-1 overflow-y-auto p-6 max-w-xl w-full mx-auto">
                 <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                         <Link className="w-5 h-5 text-blue-500" /> 자녀 ID 연동하기
                     </h2>
                     <div className="flex gap-2">
                         <input 
                            type="text"
                            placeholder="자녀 아이디 입력" 
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
                            value={linkChildId}
                            onChange={(e) => setLinkChildId(e.target.value)}
                         />
                         <button 
                            onClick={handleLinkChild}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 whitespace-nowrap"
                         >
                             연동
                         </button>
                     </div>
                     <p className="text-xs text-gray-400 mt-2">* 자녀가 생성한 아이디를 입력하여 데이터를 불러오세요.</p>
                 </div>

                 <h3 className="font-bold text-slate-600 mb-3 flex items-center gap-2">
                     <Users className="w-4 h-4" /> 연동된 자녀 목록
                 </h3>
                 
                 <div className="grid gap-3">
                     {activeParent?.linkedChildIds.length === 0 ? (
                         <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                             연동된 자녀가 없습니다.
                         </div>
                     ) : (
                         activeParent?.linkedChildIds.map(childId => {
                             const child = children.find(c => c.profile.id === childId);
                             if (!child) return null;
                             return (
                                 <button 
                                    key={childId}
                                    onClick={() => {
                                        setActiveChildId(childId);
                                        setCurrentView('PARENTS');
                                    }}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-amber-500 transition-all text-left flex items-center justify-between group"
                                 >
                                     <div className="flex items-center gap-4">
                                         <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${child.profile.gender === 'MALE' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                                             {child.profile.name[0]}
                                         </div>
                                         <div>
                                             <div className="font-bold text-slate-800 text-lg">{child.profile.name}</div>
                                             <div className="text-xs text-slate-500">LV.{child.profile.level} • {child.profile.username}</div>
                                         </div>
                                     </div>
                                     <div className="text-gray-300 group-hover:text-amber-500">
                                         <Settings className="w-6 h-6" />
                                     </div>
                                 </button>
                             );
                         })
                     )}
                 </div>
             </main>
        </div>
      );
  }

  // --- Main App (Child View & Parent Detail View) ---
  
  // Safe check if active child is deleted
  if (!activeChild && currentUserType === 'CHILD') {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-100">
             <div className="text-center">
                 <p className="mb-4 text-gray-600">선택된 기사단원 정보가 없습니다.</p>
                 <button onClick={handleLogout} className="bg-slate-800 text-white px-6 py-2 rounded-lg">로그인 화면으로</button>
             </div>
        </div>
      );
  }

  // If Parent is viewing a specific child dashboard
  if (currentUserType === 'PARENT' && currentView === 'PARENTS' && activeChild) {
      return (
          <div className="h-screen w-full bg-slate-100">
               <ParentDashboard 
                childrenData={children}
                activeChildId={activeChildId!}
                parentRewards={parentRewards}
                isParentLoggedIn={true}
                onBackToHub={() => setCurrentView('PARENT_HUB')}
                onAddChild={handleAddChild}
                onEditChild={handleEditChild}
                onDeleteChild={handleDeleteChild}
                onSwitchChild={handleSwitchChild}
                onAddRewardItem={(item) => setParentRewards([...parentRewards, item])}
                onEditRewardItem={handleEditRewardItem}
                onDeleteRewardItem={(id) => setParentRewards(parentRewards.filter(p => p.id !== id))}
                onRedeemReward={handleMarkRewardRedeemed}
                onUpdateWater={handleUpdateWater}
                onAddPastPoop={handleAddPastPoop}
                onToggleLog={handleToggleLog}
              />
          </div>
      );
  }

  // --- Child Dashboard View ---
  const { profile: user, waterLogs: waterLog, poopLogs: poopLog, wonRewards, vegetableLogs, probioticsLogs } = activeChild!;
  const todayWaterCount = waterLog.find(w => w.date === todayStr)?.count || 0;
  const isVeggieDone = vegetableLogs?.find(l => l.date === todayStr)?.isDone || false;
  const isProbioticsDone = probioticsLogs?.find(l => l.date === todayStr)?.isDone || false;

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100">
      
      {/* Header */}
      <header className="p-4 shadow-md z-10 bg-white relative">
        <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className={`rounded-full p-1 border-2 ${user.gender === 'MALE' ? 'bg-blue-500 border-blue-600' : 'bg-pink-500 border-pink-600'}`}>
                    <User className="text-white w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold game-font text-lg text-amber-800 leading-none">
                        쾌변의 기사단
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                        {user.name} 기사님
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                    LV.{user.level}
                </div>
                <button 
                    onClick={handleLogout} 
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600"
                    title="로그아웃"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative max-w-xl w-full mx-auto bg-white shadow-xl sm:my-4 sm:rounded-2xl">
        
        {currentView === 'HOME' && (
          <div className="p-4 space-y-6 animate-fade-in">
             <LevelBadge user={user} />
             
             <div className="p-4 rounded-xl shadow-inner text-center bg-amber-50 text-amber-800">
                <p className="font-bold">📢 {dailyMessage}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setCurrentView('WATER')} className="bg-blue-500 hover:bg-blue-600 text-white p-6 rounded-2xl shadow-lg transform transition active:scale-95 flex flex-col items-center">
                   <Droplet className="w-10 h-10 mb-2" />
                   <span className="font-bold text-lg">물 마시기</span>
                   <span className="text-sm opacity-80 mt-1">{todayWaterCount}/{DAILY_WATER_GOAL} 완료 (25ml)</span>
                </button>

                <button onClick={() => setCurrentView('POOP')} className="bg-amber-500 hover:bg-amber-600 text-white p-6 rounded-2xl shadow-lg transform transition active:scale-95 flex flex-col items-center">
                   <Calendar className="w-10 h-10 mb-2" />
                   <span className="font-bold text-lg">배변 기록</span>
                   <span className="text-sm opacity-80 mt-1">오늘 기록하기</span>
                </button>
             </div>

             {/* Side Quests */}
             <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => handleToggleLog(todayStr, 'VEGGIE')}
                    className={`p-4 rounded-2xl shadow-md border-2 transition-all flex items-center gap-3 ${isVeggieDone ? 'bg-green-100 border-green-500' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                 >
                     <div className={`p-2 rounded-full ${isVeggieDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <Carrot className="w-6 h-6" />
                     </div>
                     <div className="text-left">
                         <div className={`font-bold text-sm ${isVeggieDone ? 'text-green-700' : 'text-gray-600'}`}>야채 먹기</div>
                         <div className="text-xs text-gray-400">{isVeggieDone ? '완료!' : '1회'}</div>
                     </div>
                 </button>

                 <button 
                    onClick={() => handleToggleLog(todayStr, 'PROBIOTICS')}
                    className={`p-4 rounded-2xl shadow-md border-2 transition-all flex items-center gap-3 ${isProbioticsDone ? 'bg-pink-100 border-pink-500' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                 >
                     <div className={`p-2 rounded-full ${isProbioticsDone ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <Pill className="w-6 h-6" />
                     </div>
                     <div className="text-left">
                         <div className={`font-bold text-sm ${isProbioticsDone ? 'text-pink-700' : 'text-gray-600'}`}>유산균</div>
                         <div className="text-xs text-gray-400">{isProbioticsDone ? '완료!' : '1회'}</div>
                     </div>
                 </button>
             </div>

             <button onClick={() => setCurrentView('GACHA')} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                   <Gift className="w-8 h-8" />
                   <div className="text-left">
                      <div className="font-bold text-lg">보상 뽑기</div>
                      <div className="text-xs opacity-90">티켓: 실버 {user.tickets.silver} / 골드 {user.tickets.gold}</div>
                   </div>
                </div>
                <div className="text-2xl">👉</div>
             </button>
          </div>
        )}

        {currentView === 'WATER' && (
          <WaterQuest 
            currentCount={todayWaterCount} 
            onAddWater={handleAddWater}
          />
        )}

        {currentView === 'POOP' && (
          <PoopLog 
            onAddPoop={handleAddPoop}
            poopLogs={poopLog}
          />
        )}

        {currentView === 'GACHA' && (
          <RewardGacha 
            user={user}
            wonRewards={wonRewards}
            parentRewards={parentRewards}
            onRedeemTicket={handleRedeemTicket}
          />
        )}

        {currentView === 'PARENTS' && (
          <ParentDashboard 
            childrenData={children}
            activeChildId={activeChildId!}
            parentRewards={parentRewards}
            isParentLoggedIn={false}
            onAddChild={handleAddChild}
            onEditChild={handleEditChild}
            onDeleteChild={handleDeleteChild}
            onSwitchChild={handleSwitchChild}
            onAddRewardItem={(item) => setParentRewards([...parentRewards, item])}
            onEditRewardItem={handleEditRewardItem}
            onDeleteRewardItem={(id) => setParentRewards(parentRewards.filter(p => p.id !== id))}
            onRedeemReward={handleMarkRewardRedeemed}
            onUpdateWater={handleUpdateWater}
            onAddPastPoop={handleAddPastPoop}
            onToggleLog={handleToggleLog}
          />
        )}

      </main>
      
      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
           <div className="animate-bounce-in pointer-events-auto bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700">
              <div className="bg-yellow-400 p-1.5 rounded-full shadow-lg shadow-yellow-400/50">
                  <Coins className="w-5 h-5 text-yellow-700" fill="currentColor" />
              </div>
              <span className="font-bold text-sm">{toast.message}</span>
           </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 pb-safe z-20 max-w-xl w-full mx-auto">
        <div className="flex justify-around items-center h-16">
          <NavButton view="HOME" icon={User} label="홈" />
          <NavButton view="WATER" icon={Droplet} label="수분" />
          <NavButton view="POOP" icon={Calendar} label="도감" />
          <NavButton view="GACHA" icon={Gift} label="뽑기" />
          {/* Hide PARENTS menu for CHILD users */}
          {currentUserType === 'PARENT' && <NavButton view="PARENTS" icon={Settings} label="부모님" />}
        </div>
      </nav>

    </div>
  );
}