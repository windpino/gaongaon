import React from 'react';
import { UserProfile, XP_THRESHOLDS } from '../types';
import { LEVEL_TITLES } from '../constants';
import { Shield, Star, Crown } from 'lucide-react';

interface Props {
  user: UserProfile;
}

export const LevelBadge: React.FC<Props> = ({ user }) => {
  const getIcon = () => {
    if (user.level === 1) return <Shield className="w-6 h-6 text-gray-100" />;
    if (user.level === 2) return <Star className="w-6 h-6 text-yellow-100" />;
    return <Crown className="w-6 h-6 text-amber-100" />;
  };

  const getBgColor = () => {
    if (user.level === 1) return 'bg-slate-500';
    if (user.level === 2) return 'bg-blue-600';
    return 'bg-amber-600';
  };

  const nextXp = user.level === 1 ? XP_THRESHOLDS.LEVEL_2 : user.level === 2 ? XP_THRESHOLDS.LEVEL_3 : user.xp * 1.5;
  const progress = Math.min((user.xp / nextXp) * 100, 100);

  return (
    <div className={`p-3 rounded-xl shadow-lg ${getBgColor()} text-white flex items-center gap-3 transition-all transform hover:scale-105`}>
      <div className="p-2 bg-white/20 rounded-full">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-end mb-1">
          <span className="font-bold game-font text-lg">{LEVEL_TITLES[user.level - 1]}</span>
          <span className="text-xs opacity-90">LV.{user.level}</span>
        </div>
        <div className="w-full bg-black/20 rounded-full h-2">
          <div 
            className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-right mt-1 opacity-80">{user.xp} / {Math.floor(nextXp)} XP</div>
      </div>
    </div>
  );
};