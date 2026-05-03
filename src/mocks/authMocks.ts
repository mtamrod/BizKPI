import type { Company, User } from '@/types';

export const MOCK_CREDENTIALS = {
  email: 'demo@bizkpi.com',
  password: 'BizKPI2024',
} as const;

export const MOCK_USER: User = {
  id: 'usr_001',
  name: 'Alex Martínez',
  email: 'demo@bizkpi.com',
  role: 'admin',
  avatarColor: '#7C3AED',
};

export const MOCK_COMPANIES: Company[] = [
  { id: 'co_001', name: 'TechCorp S.L.',    sector: 'B2B SaaS',    location: 'Madrid',    accentColor: '#7C3AED' },
  { id: 'co_002', name: 'Startup Hub',      sector: 'Aceleradora', location: 'Barcelona', accentColor: '#10B981' },
  { id: 'co_003', name: 'Retail Plus',      sector: 'Retail',      location: 'Valencia',  accentColor: '#F59E0B' },
];

export const MOCK_TOKEN = 'mock_jwt_bizkpi_v1';
