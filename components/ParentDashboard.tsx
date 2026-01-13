import React, { useState } from 'react';
import { UserProfile, PoopLogEntry, WaterLogEntry, Reward, RewardItem, RewardTier, PoopType, DAILY_WATER_GOAL, ChildData, Gender } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BrainCircuit, Lock, Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Droplet, UserPlus, Users, Pencil, Save, RotateCcw, Gift, ArrowLeft, Carrot, Pill, Minus } from 'lucide-react';
import { MONSTER_INFO } from '../constants';

interface Props {
  childrenData: ChildData[];
  activeChildId: string;
  parentRewards: RewardItem[];
  isParentLoggedIn: boolean; // New prop to check context
  onBackToHub?: () => void; // New prop to go back to parent hub
  onAddChild: (name: string, age: number, gender: Gender) => void;
  onEditChild: (id: string, name: string, age: number, gender: Gender) => void;
  onDeleteChild: (id: string) => void;
  onSwitchChild: (id: string) => void;
  onAddRewardItem: (item: RewardItem) => void;
  onEditRewardItem: (id: string, title: string, tier: RewardTier) => void;
  onDeleteRewardItem: (id: string) => void;
  onRedeemReward: (id: string) => void;
  onUpdateWater: (date: string, count: number) => void;
  onAddPastPoop: (date: string, type: PoopType) => void;
  onToggleLog?: (date: string, type: 'VEGGIE' | 'PROBIOTICS') => void;
}

export const ParentDashboard: React.FC<Props> = ({ 
  childrenData, activeChildId, parentRewards, isParentLoggedIn, onBackToHub,
  onAddChild, onEditChild, onDeleteChild, onSwitchChild,
  onAddRewardItem, onEditRewardItem, onDeleteRewardItem, onRedeemReward,
  onUpdateWater, onAddPastPoop, onToggleLog
}) => {
  const [isUnlocked, setIsUnlocked] = useState(isParentLoggedIn); // Auto unlock if parent logged in
  const [pin, setPin] = useState('');
  
  // Reward Management State
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardTier, setNewRewardTier] = useState<RewardTier>(RewardTier.COMMON);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  
  // Child Management State
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childFormName, setChildFormName] = useState('');
  const [childFormAge, setChildFormAge] = useState<string>('');
  const [childFormGender, setChildFormGender] = useState<Gender>('MALE');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Derived Data for Active Child
  const activeChild = childrenData.find(c => c.profile.id === activeChildId) || childrenData[0];
  const { profile: user, poopLogs, waterLogs, vegetableLogs, probioticsLogs, wonRewards: rewards } = activeChild;

  const handleUnlock = () => {
    if (pin === '0000') setIsUnlocked(true);
    else alert('비밀번호가 틀렸습니다 (Hint: 0000)');
  };

  const handleAddOrEditReward = () => {
    if (!newRewardTitle.trim()) return;
    
    if (editingRewardId) {
       onEditRewardItem(editingRewardId, newRewardTitle, newRewardTier);
       setEditingRewardId(null);
    } else {
       const newItem: RewardItem = {
         id: Date.now().toString(),
         title: newRewardTitle,
         tier: newRewardTier
       };
       onAddRewardItem(newItem);
    }
    setNewRewardTitle('');
    setNewRewardTier(RewardTier.COMMON);
  };

  const handleEditRewardClick = (item: RewardItem) => {
    setEditingRewardId(item.id);
    setNewRewardTitle(item.title);
    setNewRewardTier(item.tier);
  };

  const handleCancelEditReward = () => {
    setEditingRewardId(null);
    setNewRewardTitle('');
    setNewRewardTier(RewardTier.COMMON);
  };

  const openAddChildModal = () => {
    setEditingChildId(null);
    setChildFormName('');
    setChildFormAge('');
    setChildFormGender('MALE');
    setIsChildModalOpen(true);
  };

  const openEditChildModal = (child: UserProfile) => {
    setEditingChildId(child.id);
    setChildFormName(child.name);
    setChildFormAge(child.age.toString());
    setChildFormGender(child.gender);
    setIsChildModalOpen(true);
  };

  const handleSaveChild = () => {
    if (!childFormName || !childFormAge) return;

    if (editingChildId) {
      onEditChild(editingChildId, childFormName, parseInt(childFormAge), childFormGender);
    } else {
      onAddChild(childFormName, parseInt(childFormAge), childFormGender);
    }
    setIsChildModalOpen(false);
  };

  const handleDeleteChildWrapper = (id: string) => {
    if (childrenData.length <= 1) {
      alert("최소 한 명의 자녀는 있어야 합니다.");
      return;
    }
    if (confirm("정말 이 자녀의 데이터를 삭제하시겠습니까? 복구할 수 없습니다.")) {
      onDeleteChild(id);
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDay, year, month };
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const formatYmd = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDay, year, month } = getDaysInMonth(currentDate);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-1 text-center">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} className="text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="h-14 bg-transparent" />)}
        {days.map(day => {
          const dateStr = formatYmd(year, month, day);
          const water = waterLogs.find(w => w.date === dateStr)?.count || 0;
          const poops = poopLogs.filter(p => p.date === dateStr);
          const veggie = vegetableLogs?.find(v => v.date === dateStr)?.isDone;
          const probiotics = probioticsLogs?.find(p => p.date === dateStr)?.isDone;
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <button 
              key={day} 
              onClick={() => setSelectedDate(dateStr)}
              className={`h-16 rounded-lg border flex flex-col items-center justify-start pt-1 gap-1 relative overflow-hidden transition-all
                ${isToday ? 'border-amber-500 bg-amber-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
            >
              <span className={`text-xs ${isToday ? 'font-bold text-amber-600' : 'text-gray-600'}`}>{day}</span>
              
              <div className="flex gap-1 flex-wrap justify-center px-1 w-full">
                 {/* Water Indicator */}
                 {water > 0 && (
                   <div className="flex items-center justify-center bg-blue-100 rounded-full w-3 h-3" title={`Water: ${water}`}>
                     <div className="text-[7px] font-bold text-blue-600">{water}</div>
                   </div>
                 )}
                 {/* Poop Indicators */}
                 {poops.map((p, idx) => (
                   <div key={idx} className="text-[10px]" title={p.type}>
                     {p.type === PoopType.NORMAL ? '👑' : p.type === PoopType.HARD ? '🪨' : p.type === PoopType.DIARRHEA ? '💧' : '☁️'}
                   </div>
                 ))}
                 {/* Veggie & Probiotics */}
                 {veggie && <span className="text-[8px]">🥕</span>}
                 {probiotics && <span className="text-[8px]">💊</span>}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Render Daily Detail Modal
  const renderDetailModal = () => {
    if (!selectedDate) return null;
    
    const water = waterLogs.find(w => w.date === selectedDate)?.count || 0;
    const isVeggieDone = vegetableLogs?.find(v => v.date === selectedDate)?.isDone || false;
    const isProbioticsDone = probioticsLogs?.find(p => p.date === selectedDate)?.isDone || false;
    const dailyPoops = poopLogs.filter(p => p.date === selectedDate);

    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in border border-slate-200">
           <div className="flex justify-between items-center mb-6 border-b pb-4">
             <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-500" />
                {selectedDate} 기록
             </h3>
             <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-slate-600">
               <X className="w-6 h-6" />
             </button>
           </div>

           <div className="space-y-6">
              {/* Water */}
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full"><Droplet className="w-5 h-5 text-blue-500" /></div>
                    <span className="font-bold text-slate-700">물 마시기</span>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                    <button 
                      onClick={() => onUpdateWater(selectedDate, Math.max(0, water - 1))}
                      className="p-2 hover:bg-slate-200 rounded-md text-slate-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold w-6 text-center text-blue-600">{water}</span>
                    <button 
                      onClick={() => onUpdateWater(selectedDate, Math.min(DAILY_WATER_GOAL, water + 1))}
                      className="p-2 hover:bg-slate-200 rounded-md text-slate-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              {/* Veggie */}
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full"><Carrot className="w-5 h-5 text-green-600" /></div>
                    <span className="font-bold text-slate-700">야채 먹기</span>
                 </div>
                 <button 
                    onClick={() => onToggleLog && onToggleLog(selectedDate, 'VEGGIE')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isVeggieDone ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                 >
                    {isVeggieDone ? '완료' : '미완료'}
                 </button>
              </div>

              {/* Probiotics */}
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-full"><Pill className="w-5 h-5 text-pink-500" /></div>
                    <span className="font-bold text-slate-700">유산균</span>
                 </div>
                 <button 
                    onClick={() => onToggleLog && onToggleLog(selectedDate, 'PROBIOTICS')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${isProbioticsDone ? 'bg-pink-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                 >
                    {isProbioticsDone ? '완료' : '미완료'}
                 </button>
              </div>

              {/* Poop */}
              <div className="border-t pt-4">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="bg-amber-100 p-2 rounded-full"><Users className="w-5 h-5 text-amber-600" /></div>
                    <span className="font-bold text-slate-700">배변 기록 추가</span>
                 </div>
                 
                 {/* Existing Poops */}
                 <div className="flex flex-wrap gap-2 mb-4">
                    {dailyPoops.length === 0 ? <span className="text-xs text-gray-400 pl-2">기록 없음</span> : 
                      dailyPoops.map((p, idx) => (
                        <div key={idx} className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1">
                           {p.type === PoopType.NORMAL ? '👑' : p.type === PoopType.HARD ? '🪨' : p.type === PoopType.DIARRHEA ? '💧' : '☁️'}
                           {MONSTER_INFO[p.type].name}
                        </div>
                      ))
                    }
                 </div>

                 {/* Add Buttons */}
                 <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(MONSTER_INFO) as PoopType[]).map(type => (
                       <button
                         key={type}
                         onClick={() => onAddPastPoop(selectedDate, type)}
                         className="flex flex-col items-center p-2 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 transition-all"
                       >
                         <span className="text-xl mb-1">
                            {type === 'HARD' && '🪨'}
                            {type === 'NORMAL' && '👑'}
                            {type === 'SOFT' && '☁️'}
                            {type === 'DIARRHEA' && '💧'}
                         </span>
                         <span className="text-[10px] text-gray-500">{MONSTER_INFO[type].name.split(' ')[0]}</span>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  // Chart Data
  const getChartData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const water = waterLogs.find(w => w.date === dateStr)?.count || 0;
      const poop = poopLogs.filter(p => p.date === dateStr).length;
      const veggie = vegetableLogs?.find(v => v.date === dateStr)?.isDone ? 1 : 0;
      data.push({ name: `${d.getMonth() + 1}/${d.getDate()}`, water, poop, veggie });
    }
    return data;
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <Lock className="w-16 h-16 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-600">부모님 전용 페이지</h2>
        <p className="text-sm text-gray-500">접속하려면 비밀번호를 입력하세요.</p>
        <div className="flex gap-2">
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="border-2 border-slate-600 bg-slate-800 text-white rounded-lg px-4 py-2 w-32 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="PIN"
            maxLength={4}
          />
          <button 
            onClick={handleUnlock}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg font-bold"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-8 animate-fade-in overflow-y-auto h-full relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            {isParentLoggedIn && onBackToHub && (
                <button onClick={onBackToHub} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
            )}
            <h2 className="text-2xl font-bold game-font text-slate-800">
                {isParentLoggedIn ? `${user.name} 관리` : '부모님 대시보드'}
            </h2>
        </div>
        {!isParentLoggedIn && (
            <button onClick={() => setIsUnlocked(false)} className="text-sm text-gray-500 underline">잠그기</button>
        )}
      </div>

      {/* Child Management Section (Only if not in Parent Mode, or maybe allow switching here too? Let's hide if Parent Mode to avoid confusion, parent hub handles switching) */}
      {!isParentLoggedIn && (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700">
                <Users className="w-5 h-5 text-slate-500" />
                자녀 관리
            </h3>
            <button 
                onClick={openAddChildModal}
                className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-slate-900 shadow-md"
            >
                <UserPlus className="w-3 h-3" /> 추가
            </button>
         </div>

         <div className="space-y-3">
            {childrenData.map(child => (
                <div 
                    key={child.profile.id}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        child.profile.id === activeChildId 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-100 bg-white'
                    }`}
                >
                    <button 
                        onClick={() => onSwitchChild(child.profile.id)}
                        className="flex items-center gap-3 flex-1"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                            child.profile.gender === 'MALE' ? 'bg-blue-400' : 'bg-pink-400'
                        }`}>
                            {child.profile.name[0]}
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                {child.profile.name}
                                {child.profile.id === activeChildId && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 rounded-full">Active</span>}
                            </div>
                            <div className="text-xs text-slate-500">
                                <span className="font-bold text-purple-600 mr-2">ID: {child.profile.username}</span>
                                LV.{child.profile.level} ({child.profile.age}세)
                            </div>
                        </div>
                    </button>
                    
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                        <button 
                            onClick={() => openEditChildModal(child.profile)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDeleteChildWrapper(child.profile.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
         </div>
      </div>
      )}

      {/* Add/Edit Child Modal */}
      {isChildModalOpen && (
         <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
             <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in border border-slate-700">
                 <div className="flex justify-between items-center mb-6">
                     <h4 className="font-bold text-lg text-white flex items-center gap-2">
                        {editingChildId ? <Pencil className="w-5 h-5 text-amber-400" /> : <UserPlus className="w-5 h-5 text-green-400" />}
                        {editingChildId ? '자녀 정보 수정' : '새로운 기사단원 등록'}
                     </h4>
                     <button onClick={() => setIsChildModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                     <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">이름 (캐릭터명)</label>
                         <input 
                            type="text" 
                            placeholder="예: 용감한 기사" 
                            value={childFormName}
                            onChange={(e) => setChildFormName(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-xl focus:outline-none focus:border-amber-500 placeholder-slate-500"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">나이</label>
                         <input 
                            type="number" 
                            placeholder="나이를 입력하세요" 
                            value={childFormAge}
                            onChange={(e) => setChildFormAge(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 text-white p-3 rounded-xl focus:outline-none focus:border-amber-500 placeholder-slate-500"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">성별</label>
                         <div className="flex gap-3">
                             <button 
                                onClick={() => setChildFormGender('MALE')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${childFormGender === 'MALE' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-700 border-slate-700 text-slate-400'}`}
                             >
                                 남자
                             </button>
                             <button 
                                onClick={() => setChildFormGender('FEMALE')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${childFormGender === 'FEMALE' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'bg-slate-700 border-slate-700 text-slate-400'}`}
                             >
                                 여자
                             </button>
                         </div>
                     </div>
                 </div>

                 <button 
                    onClick={handleSaveChild}
                    disabled={!childFormName || !childFormAge}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2
                        ${!childFormName || !childFormAge ? 'bg-slate-600 cursor-not-allowed text-slate-400' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'}`}
                 >
                     <Save className="w-5 h-5" />
                     {editingChildId ? '수정 완료' : '등록하기'}
                 </button>
             </div>
         </div>
      )}

      {/* Rewards Settings */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center gap-2">
           <Gift className="w-5 h-5 text-purple-500" />
           포상 목록 관리
         </h3>
         
         <div className="flex flex-col gap-3 mb-4 bg-gray-50 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-gray-400 mb-1">
               {editingRewardId ? '포상 수정하기' : '새로운 포상 추가'}
            </h4>
            <input 
              type="text" 
              placeholder="예: 주말에 치킨 시켜주기" 
              className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg text-sm w-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={newRewardTitle}
              onChange={(e) => setNewRewardTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <select 
                className="bg-slate-700 border border-slate-600 text-white p-3 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newRewardTier}
                onChange={(e) => setNewRewardTier(e.target.value as RewardTier)}
              >
                <option value={RewardTier.COMMON}>일반</option>
                <option value={RewardTier.RARE}>희귀</option>
                <option value={RewardTier.LEGENDARY}>전설</option>
              </select>
              
              {editingRewardId && (
                <button 
                  onClick={handleCancelEditReward}
                  className="bg-slate-500 text-white px-4 rounded-lg flex items-center justify-center hover:bg-slate-600"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              <button 
                onClick={handleAddOrEditReward}
                className="bg-purple-600 text-white px-4 rounded-lg flex items-center justify-center hover:bg-purple-700 shadow-md min-w-[3rem]"
              >
                {editingRewardId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>
         </div>

         <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {parentRewards.map(item => (
              <li key={item.id} className="flex justify-between items-center text-sm p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3">
                   <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                     item.tier === RewardTier.LEGENDARY ? 'bg-yellow-500 shadow-yellow-200 shadow' : 
                     item.tier === RewardTier.RARE ? 'bg-blue-500 shadow-blue-200 shadow' : 'bg-gray-400'
                   }`}></span>
                   <span className="font-medium text-gray-700">{item.title}</span>
                </div>
                <div className="flex items-center gap-1">
                   <button 
                     onClick={() => handleEditRewardClick(item)} 
                     className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                   >
                     <Pencil className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => onDeleteRewardItem(item.id)} 
                     className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </li>
            ))}
         </ul>
      </div>

      {/* Calendar Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-lg flex items-center gap-2">
             <CalendarIcon className="w-5 h-5 text-amber-500" />
             건강 캘린더
           </h3>
           <div className="flex items-center gap-2">
              <button onClick={() => changeMonth(-1)} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button>
              <span className="font-bold text-sm">
                {currentDate.getFullYear()}.{currentDate.getMonth() + 1}
              </span>
              <button onClick={() => changeMonth(1)} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button>
           </div>
         </div>
         {renderCalendar()}
         <p className="text-xs text-gray-400 mt-2 text-center">날짜를 클릭하여 기록을 수정할 수 있습니다.</p>
      </div>

      {/* Analytics Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-500" />
          주간 건강 리포트
        </h3>
        
        <div className="h-48 w-full mb-4">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={getChartData()}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" tick={{fontSize: 10}} />
               <YAxis hide />
               <Tooltip />
               <Legend wrapperStyle={{fontSize: '10px'}} />
               <Bar dataKey="water" name="물 (잔)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
               <Bar dataKey="poop" name="배변 (회)" fill="#d97706" radius={[4, 4, 0, 0]} />
               <Bar dataKey="veggie" name="야채 (성공)" fill="#22c55e" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Won Rewards */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4 text-green-700">지급 대기중인 포상</h3>
        <div className="space-y-2">
           {rewards.filter(r => !r.isRedeemed).length === 0 ? (
             <p className="text-gray-400 text-sm text-center py-4">아직 당첨된 포상이 없습니다.</p>
           ) : (
             rewards.filter(r => !r.isRedeemed).map(reward => (
               <div key={reward.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                 <div>
                   <span className="text-xs font-bold text-green-600 bg-green-200 px-2 py-0.5 rounded mr-2">
                     {reward.tier}
                   </span>
                   <span className="font-medium text-gray-800">{reward.title}</span>
                 </div>
                 <button 
                   onClick={() => onRedeemReward(reward.id)}
                   className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                 >
                   지급 완료
                 </button>
               </div>
             ))
           )}
        </div>
      </div>

      {/* Detail Modal for Selected Date */}
      {renderDetailModal()}

    </div>
  );
};