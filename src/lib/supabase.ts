import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Types for our database schema
export interface User {
	id: string;
	name: string;
	created_at: string;
	ass_count: number;
	role?: 'admin' | 'user';
}

export interface GameState {
	id: string;
	name: string;
	is_unlocked: boolean;
}

export interface Score {
	id: string;
	user_id: string;
	game_type: 'split_g' | 'dart' | 'jv' | 'utslagsfragan';
	raw_value: number;
	created_at: string;
}

export interface LeaderboardEntry {
	id: string;
	name: string;
	total_score: number;
	split_g: number | null;
	dart: number | null;
	jv: number | null;
	utslagsfragan: number | null;
	ass_count: number;
}
