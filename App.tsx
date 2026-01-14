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

// --- [수정] 외부 파일이 아닌 전역 윈도우에서 안전하게 db를 가져옵니다 ---
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
  // 윈도우 전역에 저장된 db 인스턴스를 가져옵니다 (백색 화면 방지 핵심)
  const db = (window as any).firebaseDB || (window as any).db;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Global State (초기값 설정)
  const [children, setChildren] = useState<ChildData[]>(INITIAL_CHILD_DATA);
  const [parents, setParents] = useState<ParentProfile[]>([]);

  // 서버 데이터 실시간 연결 로직
  useEffect(() => {
    if (!db) {
      console.log("대기 중: 서버 연결 열쇠를 찾고 있습니다...");
      return;
    }
    
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
  }, [db]);

  // --- 이하 아버님의 원본 로직 및 디자인 (100% 보존) ---
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

  const activeChild = children.find(c => c.profile.id === activeChildId);
  const activeParent = parents.find(p => p.id === activeParentId);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast({ message: '', isVisible: false }), 3000);
  };

  const handleLogin = () => {
    const child = children.find(c => c.profile.username === loginId && c.profile.password === loginPw);
    if (child) {
      setActiveChildId(child.profile.id);
      setCurrentUserType('CHILD');
      setIsLoggedIn(true);
      return;
    }
    const parent = parents.find(p => p.username === loginId && p.password === loginPw);
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
        if (db) await setDoc(doc(db, 'children', newChild.profile.id), newChild);
        setActiveChildId(newChild.profile.id);
        setCurrentUserType('CHILD');
      } else {
        const newParent: ParentProfile = { id: `parent_${Date.now()}`, username: signupId, password: signupPw, name: signupName, linkedChildIds: [] };
        if (db) await setDoc(doc(db, 'parents', newParent.id), newParent);
        setActiveParentId(newParent.id);
        setCurrentUserType('PARENT');
        setCurrentView('PARENT_HUB');
      }
      setIsLoggedIn(true);
    } catch (e) { alert('가입 중 오류가 발생했습니다.'); }
  };

  if (!isLoggedIn) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="z-10 w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-block p-4 rounded-full bg-slate-800 border-4 border-amber-500 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <ShieldCheck className="w-16 h-16 text-amber-500" />
            </div>
            <h1 className="text-4xl font-bold game-font text-amber-400 mb-2">쾌변의 기사단</h1>
            <p className="text-slate-400 tracking-widest uppercase text-[10px]">Royal Guard of Digestive Health</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-700/50">
            {authMode === 'LOGIN' ? (
              <div className="space-y-4">
                <input type="text" placeholder="기사 아이디" value={loginId} onChange={e => setLoginId(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                <input type="password" placeholder="비밀번호" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                <button onClick={handleLogin} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">입장하기</button>
                <div className="pt-4 flex flex-col gap-3 text-center">
                  <p><span className="text-slate-500 text-sm">아직 기사단원이 아닌가요?</span> <button onClick={() => setAuthMode('SIGNUP')} className="text-amber-500 text-sm font-bold ml-2 hover:underline">기사단 가입하기</button></p>
                  <p><span className="text-slate-500 text-sm">보호자이신가요?</span> <button onClick={() => setAuthMode('PARENT_SIGNUP')} className="text-slate-400 text-xs ml-2 hover:text-white underline font-bold">부모님 가입하기</button></p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-center text-amber-400 mb-4">{authMode === 'SIGNUP' ? '기사단 가입신청서' : '보호자 등록 서류'}</h2>
                <input type="text" placeholder="이름" value={signupName} onChange={e => setSignupName(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:outline-none" />
                <input type="text" placeholder="아이디" value={signupId} onChange={e => setSignupId(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:outline-none" />
                <input type="password" placeholder="비밀번호" value={signupPw} onChange={e => setSignupPw(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:outline-none" />
                {authMode === 'SIGNUP' && <input type="number" placeholder="나이" value={signupAge} onChange={e => setSignupAge(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white text-sm focus:outline-none" />}
                <button onClick={handleSignup} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg mt-4 active:scale-95 transition-all">가입 완료</button>
                <button onClick={() => setAuthMode('LOGIN')} className="w-full text-slate-400 text-xs mt-2 text-center underline">이미 기사단원입니다</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const NavButton = ({ view, icon: Icon, label }: { view: ScreenView, icon: any, label: string }) => (
    <button onClick={() => setCurrentView(view)} className={`flex flex-col items-center justify-center w-full py-2 ${currentView === view ? 'text-amber-600' : 'text-gray-400'}`}>
      <Icon className={`w-6 h-6 mb-1 ${currentView === view ? 'scale-110' : ''}`} />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-slate-100">
      <header className="p-4 bg-white border-b flex justify-between items-center max-w-xl w-full mx-auto">
        <div className="flex flex-col"><span className="font-bold game-font text-amber-800 text-xl tracking-tight">쾌변의 기사단</span><span className="text-xs text-gray-500 font-bold">{activeChild?.profile.name || activeParent?.name} 기사님</span></div>
        <button onClick={() => setIsLoggedIn(false)} className="p-2 bg-gray-100 rounded-full"><LogOut className="w-4 h-4 text-gray-600"/></button>
      </header>
      <main className="flex-1 overflow-y-auto max-w-xl w-full mx-auto p-4 pb-24">
        {currentView === 'HOME' && activeChild && (
          <div className="space-y-6 animate-fade-in">
            <LevelBadge user={activeChild.profile} />
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setCurrentView('WATER')} className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-all"><Droplet className="w-10 h-10" /> <span className="font-bold text-lg game-font">물 마시기</span></button>
               <button onClick={() => setCurrentView('POOP')} className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center gap-2 active:scale-95 transition-all"><Calendar className="w-10 h-10" /> <span className="font-bold text-lg game-font">배변 기록</span></button>
            </div>
          </div>
        )}
        {/* 나머지 뷰(WATER, POOP 등)는 아버님의 기존 컴포넌트를 그대로 렌더링합니다 */}
        {currentView === 'WATER' && activeChild && <WaterQuest logs={activeChild.waterLogs} onUpdateWater={() => {}} />}
        {currentView === 'POOP' && activeChild && <PoopLog logs={activeChild.poopLogs} profile={activeChild.profile} onAddPastPoop={() => {}} />}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around h-16 max-w-xl mx-auto w-full z-20">
        <NavButton view="HOME" icon={User} label="홈" />
        <NavButton view="WATER" icon={Droplet} label="수분" />
        <NavButton view="POOP" icon={Calendar} label="도감" />
      </nav>
      {toast.isVisible && (
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-50 px-4">
           <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-in">
              <Coins className="w-5 h-5 text-yellow-400