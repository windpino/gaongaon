import { RewardItem, RewardTier, ChildData } from './types';

export const INITIAL_CHILD_DATA: ChildData[] = [{
  profile: {
    id: 'child_1',
    username: 'knight',
    password: '1234',
    name: '꼬마 기사',
    age: 5,
    gender: 'MALE',
    level: 1,
    xp: 0,
    tickets: {
      silver: 0,
      gold: 0
    }
  },
  waterLogs: [],
  poopLogs: [],
  vegetableLogs: [],
  probioticsLogs: [],
  wonRewards: []
}];

export const DEFAULT_REWARDS: RewardItem[] = [
  { id: 'r1', title: '아빠가 마라탕 사주기', tier: RewardTier.COMMON },
  { id: 'r2', title: '엄마가 마탕 사주기', tier: RewardTier.COMMON },
  { id: 'r3', title: '보너스 용돈 1000원 추가', tier: RewardTier.RARE },
  { id: 'r4', title: '보너스 용돈 2000원 추가', tier: RewardTier.LEGENDARY },
  { id: 'r5', title: '30분 놀아주기 쿠폰', tier: RewardTier.RARE },
];

export const LEVEL_TITLES = ['견습 기사', '정예 기사', '성주'];

export const MONSTER_INFO = {
  HARD: { name: '바위 몬스터', description: '딱딱하고 무서운 녀석!', color: 'text-stone-600', bg: 'bg-stone-200' },
  NORMAL: { name: '황금 왕관', description: '최고의 쾌변!', color: 'text-amber-500', bg: 'bg-amber-100' },
  SOFT: { name: '구름 요정', description: '부드럽게 나왔어요.', color: 'text-sky-500', bg: 'bg-sky-100' },
  DIARRHEA: { name: '슬라임 괴물', description: '배가 아파요 ㅠㅠ', color: 'text-green-600', bg: 'bg-green-200' },
};
