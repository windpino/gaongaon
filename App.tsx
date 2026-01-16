import React, { useState, useEffect } from 'react';
import { 
  User, Droplet, Calendar, Gift, LogOut, ShieldCheck, Settings, Coins
} from 'lucide-react';
import { 
  ScreenView, ChildData, Gender, ParentProfile, RewardItem, RewardTier, PoopType, DAILY_WATER_GOAL
} from './types';
import { INITIAL_CHILD_DATA, DEFAULT_REWARDS } from './constants';

// --- 서버 연결 부품 ---
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';

// Components
import { LevelBadge } from './components/LevelBadge';
import { WaterQuest } from './components/WaterQuest';
import { PoopLog } from './components/PoopLog';
import { RewardGacha } from './components/RewardGacha';
import { ParentDashboard } from './components/ParentDashboard';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'PARENT_SIGNUP';
type UserType = 'CHILD' | 'PARENT';

export default function App() {
  // 윈도우 전역에서 db 가져오기
  const db = (window as any).firebaseDB || (window as any).db;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Global State
  const [children, setChildren] = useState<ChildData[]>(INITIAL_CHILD_DATA);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [parentRewards, setParentRewards] = useState<RewardItem[]>(DEFAULT_REWARDS);

  // 실시간 데이터 연결
  useEffect(() => {
    if (!db) return;
    
    const unsubChildren = onSnapshot(collection(db, 'children'), (snapshot) => {
      if (!snapshot.empty) {
        // Filter out malformed data to prevent "reading 'id' of undefined" errors
        const validChildren = snapshot.docs
          .map(doc => doc.data() as ChildData)
          .filter(data => data?.profile?.id);
        
        if (validChildren.length > 0) {
            setChildren(validChildren);
        }
      }
    });

    const unsubParents = onSnapshot(collection(db, 'parents'), (snapshot) => {
      if (!snapshot.empty) {
         // Filter out malformed data
        const validParents = snapshot.docs
          .map(doc => doc.data() as ParentProfile)
          .filter(data => data?.id);
          
        setParents(validParents);
      }
    });
    
    // Rewards could also be synced if you have a rewards collection
    // const unsubRewards = onSnapshot(collection(db, 'rewards'), ...);

    return () => { unsubChildren(); unsubParents(); };
  }, [db]);

  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<UserType>('CHILD');
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [currentView, setCurrentView] = useState<ScreenView>('HOME');
  
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupAge, setSignupAge] = useState('');
  const [signupGender, setSignupGender] = useState<Gender>('MALE');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });

  // Safe Access with Optional Chaining
  const activeChild = children.find(c => c?.profile?.id === activeChildId);
  const activeParent = parents.find(p => p?.id === activeParentId);

  // Derived State for Water
  const todayWaterCount = activeChild?.waterLogs.find(w => w.date === todayStr)?.count || 0;

  const handleLogin = () => {
    // Safety check for child login
    const child = children.find(c => c?.profile?.username === loginId && c?.profile?.password === loginPw);
    if (child && child.profile) {
      setActiveChildId(child.profile.id);
      setCurrentUserType('CHILD');
      setIsLoggedIn(true);
      return;
    }

    // Safety check for parent login
    const parent = parents.find(p => p?.username === loginId && p?.password === loginPw);
    if (parent) {
      setActiveParentId(parent.id);
      setCurrentUserType('PARENT');
      setIsLoggedIn(true);
      setCurrentView('PARENT_HUB');
      return;
    }
    alert('아이디 또는 비밀번호가 올바르지 않습니다.');
  };

  const handleSignup = async () => {
    if (!signupName || !signupId || !signupPw) return;
    try {
      if (authMode === 'SIGNUP') {
        const newChild: ChildData = {
          profile: { id: `child_${Date.now()}`, username: signupId, password: signupPw, name: signupName, age: parseInt(signupAge), gender: signupGender, level: 1, xp: 0, tickets: { silver: 0, gold: 0 } },
          waterLogs: [], poopLogs: [], vegetableLogs: [], probioticsLogs: [], wonRewards: []
        };
        // Optimistic update
        setChildren(prev => [...prev, newChild]);
        setActiveChildId(newChild.profile.id);
        setCurrentUserType('CHILD');
        
        if (db) await setDoc(doc(db, 'children', newChild.profile.id), newChild);
      } else {
        const newParent: ParentProfile = { id: `parent_${Date.now()}`, username: signupId, password: signupPw, name: signupName, linkedChildIds: [] };
        // Optimistic update
        setParents(prev => [...prev, newParent]);
        setActiveParentId(newParent.id);
        setCurrentUserType('PARENT');
        setCurrentView('PARENT_HUB');
        
        if (db) await setDoc(doc(db, 'parents', newParent.id), newParent);
      }
      setIsLoggedIn(true);
    } catch (e) { 
        console.error(e);
        alert('가입 중 오류가 발생했습니다.'); 
    }
  };

  // Stub handlers for now (Implement actual logic as needed)
  const handleUpdateWater = () => { console.log('Update Water - Implement Firebase logic'); };
  const handleAddPoop = (type: PoopType) => { console.log('Add Poop - Implement Firebase logic', type); };
  const handleRedeemTicket = () => { console.log('Redeem Ticket - Implement Firebase logic'); };
  const handleParentUpdate = () => { console.log('Parent Update - Implement Firebase logic'); };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 relative">
        <div className="z-10 w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-block p-4 rounded-full bg-slate-800 border-4 border-amber-500 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <ShieldCheck className="w-16 h-16 text-amber-500" />
            </div>
            <h1 className="text-4xl font-bold text-amber-400 mb-2">쾌변의 기사단</h1>
            <p className="text-slate-400 text-[10px] tracking-widest uppercase">Royal Guard of Digestive Health</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-700/50">
            {authMode === 'LOGIN' ? (
              <div className="space-y-4">
                <input type="text" placeholder="아이디" value={loginId} onChange={e => setLoginId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 text-white" />
                <input type="password" placeholder="비밀번호" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full bg-slate-700 border border-slate-600 rounded-xl p-4 text-white" />
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">입장하기</button>
                <div className="pt-4 flex flex-col gap-3 text-center">
                  <p><span className="text-slate-500 text-sm">아직 기사단원이 아닌가요?</span> <button onClick={() => setAuthMode('SIGNUP')} className="text-amber-500 text-sm font-bold ml-2">기사단 가입하기</button></p>
                  <p><span className="text-slate-500 text-sm">보호자이신가요?</span> <button onClick={() => setAuthMode('PARENT_SIGNUP')} className="text-slate-400 text-xs ml-2 font-bold underline">부모님 가입하기</button></p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-center text-amber-400 mb-4">{authMode === 'SIGNUP' ? '기사단 가입신청서' : '보호자 등록 서류'}</h2>
                <input type="text" placeholder="이름" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white text-sm" />
                <input type="text" placeholder="아이디" value={signupId} onChange={e => setSignupId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white text-sm" />
                <input type="password" placeholder="비밀번호" value={signupPw} onChange={e => setSignupPw(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white text-sm" />
                {authMode === 'SIGNUP' && <input type="number" placeholder="나이" value={signupAge} onChange={e => setSignupAge(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white text-sm" />}
                <button onClick={handleSignup} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4 active:scale-95 transition-all">가입 완료</button>
                <button onClick={() => setAuthMode('LOGIN')} className="w-full text-slate-400 text-xs mt-2 text-center underline">뒤로가기</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100">
      <header className="p-4 bg-white border-b flex justify-between items-center max-w-xl w-full mx-auto">
        <div className="flex flex-col"><span className="font-bold text-amber-800 text-xl tracking-tight">쾌변의 기사단</span></div>
        <button onClick={() => setIsLoggedIn(false)} className="p-2 bg-gray-100 rounded-full"><LogOut className="w-4 h-4 text-gray-600"/></button>
      </header>
      
      <main className="flex-1 overflow-y-auto max-w-xl w-full mx-auto p-4 pb-24">
        {currentView === 'HOME' && activeChild && (
          <div className="space-y-6">
            <LevelBadge user={activeChild.profile} />
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setCurrentView('WATER')} className="bg-blue-500 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 font-bold active:scale-95"><Droplet />물 마시기</button>
               <button onClick={() => setCurrentView('POOP')} className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 font-bold active:scale-95"><Calendar />배변 기록</button>
            </div>
          </div>
        )}

        {/* Component Props Fixed to match definitions */}
        {currentView === 'WATER' && activeChild && (
            <WaterQuest 
                currentCount={todayWaterCount} 
                onAddWater={handleUpdateWater} 
            />
        )}
        
        {currentView === 'POOP' && activeChild && (
            <PoopLog 
                poopLogs={activeChild.poopLogs} 
                onAddPoop={handleAddPoop} 
            />
        )}
        
        {currentView === 'GACHA' && activeChild && (
            <RewardGacha 
                user={activeChild.profile} 
                wonRewards={activeChild.wonRewards} 
                parentRewards={parentRewards} 
                onRedeemTicket={handleRedeemTicket} 
            />
        )}
        
        {currentView === 'PARENT_HUB' && activeParent && (
            <ParentDashboard 
                childrenData={children} 
                activeChildId={activeChildId || ''} 
                parentRewards={parentRewards} 
                isParentLoggedIn={true}
                onAddChild={handleParentUpdate}
                onEditChild={handleParentUpdate}
                onDeleteChild={handleParentUpdate}
                onSwitchChild={setActiveChildId}
                onAddRewardItem={handleParentUpdate}
                onEditRewardItem={handleParentUpdate}
                onDeleteRewardItem={handleParentUpdate}
                onRedeemReward={handleParentUpdate}
                onUpdateWater={handleParentUpdate}
                onAddPastPoop={handleParentUpdate}
                onToggleLog={handleParentUpdate}
            />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around h-16 max-w-xl mx-auto w-full z-20">
        <button onClick={() => setCurrentView('HOME')} className={`flex flex-col items-center justify-center w-full ${currentView === 'HOME' ? 'text-amber-600' : 'text-gray-400'}`}><User /><span className="text-xs font-bold">홈</span></button>
        <button onClick={() => setCurrentView('WATER')} className={`flex flex-col items-center justify-center w-full ${currentView === 'WATER' ? 'text-amber-600' : 'text-gray-400'}`}><Droplet /><span className="text-xs font-bold">수분</span></button>
        <button onClick={() => setCurrentView('POOP')} className={`flex flex-col items-center justify-center w-full ${currentView === 'POOP' ? 'text-amber-600' : 'text-gray-400'}`}><Calendar /><span className="text-xs font-bold">도감</span></button>
        <button onClick={() => setCurrentView('GACHA')} className={`flex flex-col items-center justify-center w-full ${currentView === 'GACHA' ? 'text-amber-600' : 'text-gray-400'}`}><Gift /><span className="text-xs font-bold">뽑기</span></button>
        {currentUserType === 'PARENT' && <button onClick={() => setCurrentView('PARENT_HUB')} className={`flex flex-col items-center justify-center w-full ${currentView === 'PARENT_HUB' ? 'text-amber-600' : 'text-gray-400'}`}><Settings /><span className="text-xs font-bold">부모</span></button>}
      </nav>
    </div>
  );
}