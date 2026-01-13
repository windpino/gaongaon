import React, { useState } from 'react';
import { MONSTER_INFO } from '../constants';
import { CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { PoopType as EPoopType, PoopLogEntry } from '../types';

interface Props {
  onAddPoop: (type: EPoopType) => void;
  poopLogs?: PoopLogEntry[];
}

export const PoopLog: React.FC<Props> = ({ onAddPoop, poopLogs = [] }) => {
  const [selectedType, setSelectedType] = useState<EPoopType | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSubmit = () => {
    if (selectedType) {
      onAddPoop(selectedType);
      setSelectedType(null);
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
          <div key={d} className="text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="h-10 bg-transparent" />)}
        {days.map(day => {
          const dateStr = formatYmd(year, month, day);
          const poops = poopLogs.filter(p => p.date === dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <div 
              key={day} 
              className={`h-12 rounded-lg border flex flex-col items-center justify-start pt-0.5 relative overflow-hidden
                ${isToday ? 'border-amber-400 bg-amber-50' : 'border-gray-100 bg-white'}`}
            >
              <span className={`text-[10px] ${isToday ? 'font-bold text-amber-600' : 'text-gray-400'}`}>{day}</span>
              
              <div className="flex flex-wrap justify-center items-center w-full h-full pb-3">
                 {poops.length > 0 ? (
                   <span className="text-sm">
                      {poops[0].type === 'NORMAL' ? '👑' : poops[0].type === 'HARD' ? '🪨' : poops[0].type === 'DIARRHEA' ? '💧' : '☁️'}
                   </span>
                 ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold game-font text-amber-700">
          몬스터 도감 등록
        </h2>
        <p className="text-gray-500 text-sm">
          어떤 몬스터가 나타났나요?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {(Object.keys(MONSTER_INFO) as EPoopType[]).map((type) => {
          const info = MONSTER_INFO[type];
          const isSelected = selectedType === type;
          
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`
                relative p-4 rounded-xl border-4 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-amber-500 bg-white shadow-lg scale-105 z-10' 
                  : 'border-transparent bg-white shadow hover:bg-gray-50'}
              `}
            >
              <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${info.bg}`}>
                <span className="text-2xl" role="img" aria-label={info.name}>
                  {type === 'HARD' && '🪨'}
                  {type === 'NORMAL' && '👑'}
                  {type === 'SOFT' && '☁️'}
                  {type === 'DIARRHEA' && '💧'}
                </span>
              </div>
              <h3 className={`font-bold ${info.color}`}>{info.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{info.description}</p>
              
              {isSelected && (
                <div className="absolute top-2 right-2 text-amber-500">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedType}
        className={`
          w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all
          ${selectedType 
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:scale-105' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
        `}
      >
        {selectedType ? '도감 등록하기!' : '모양을 선택해주세요'}
      </button>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex items-start gap-3 text-sm text-amber-800 w-full">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>매일 배변에 성공하면 <strong>황금 왕관 스티커</strong>를 받을 수 있어요! 3일 연속 성공하면 뽑기권 획득!</p>
      </div>

      {/* Child Calendar View */}
      <div className="w-full mt-6 border-t pt-6">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-600 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-500" />
                나의 기록장
            </h3>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-bold w-12 text-center">
                {currentDate.getMonth() + 1}월
              </span>
              <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded"><ChevronRight className="w-4 h-4" /></button>
            </div>
        </div>
        {renderCalendar()}
      </div>
    </div>
  );
};