export type ScreenView = 'HOME' | 'WATER' | 'POOP' | 'GACHA' | 'PARENTS' | 'PARENT_HUB';

export enum PoopType {
  HARD = 'HARD',     // Rock Monster
  NORMAL = 'NORMAL', // Golden Crown
  SOFT = 'SOFT',     // Cloud Fairy
  DIARRHEA = 'DIARRHEA' // Slime Monster
}

export enum RewardTier {
  COMMON = 'COMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY'
}

export interface PoopLogEntry {
  id: string;
  date: string; // ISO Date string
  timestamp: number;
  type: PoopType;
  note?: string;
}

export interface WaterLogEntry {
  date: string; // YYYY-MM-DD
  count: number; // Number of "bombs" (cups) drunk
}

export interface SimpleLogEntry {
  date: string;
  isDone: boolean;
}

export interface Reward {
  id: string;
  title: string;
  tier: RewardTier;
  isRedeemed: boolean;
  dateWon?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  tier: RewardTier;
}

export type Gender = 'MALE' | 'FEMALE';

export interface UserProfile {
  id: string;
  username: string; // Login ID
  password: string; // Login PW
  name: string;
  age: number;
  gender: Gender;
  level: number; // 1: Apprentice, 2: Elite, 3: Lord
  xp: number;
  tickets: {
    silver: number;
    gold: number;
  };
}

export interface ParentProfile {
  id: string;
  username: string;
  password: string;
  name: string;
  linkedChildIds: string[]; // List of Child IDs linked to this parent
}

export interface ChildData {
  profile: UserProfile;
  waterLogs: WaterLogEntry[];
  poopLogs: PoopLogEntry[];
  vegetableLogs: SimpleLogEntry[]; // New: Vegetable eating log
  probioticsLogs: SimpleLogEntry[]; // New: Probiotics eating log
  wonRewards: Reward[];
}

export const XP_THRESHOLDS = {
  LEVEL_2: 100,
  LEVEL_3: 300
};

export const DAILY_WATER_GOAL = 6;
