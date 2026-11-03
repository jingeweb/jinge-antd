import type { FC } from 'jinge';

export interface Demo {
  id: string;
  title: string;
  description: string;
  render: FC;
  source: string;
}
export interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}
export interface ComponentDoc {
  id: string;
  name: string;
  imports?: string[];
  title: string;
  category: string;
  description: string;
  status: 'ready' | 'planned';
  demos: Demo[];
  api: ApiRow[];
  notes: string[];
}
