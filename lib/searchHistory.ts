
import { createServerComponentClient } from './supabase';

export interface SongAnalysisHistoryItem {
	id: string;
	share_id: string;
	artist: string;
	title: string;
	created_at: string;
}

/**
 * Fetch recent song analysis history (limit 50, newest first)
 */
export async function fetchRecentSearchHistory(): Promise<{ items: SongAnalysisHistoryItem[]; error?: string }> {
	try {
		const supabase = await createServerComponentClient();
		const { data, error } = await supabase
			.from('song_analyses')
			.select('id, share_id, artist, title, created_at')
			.order('created_at', { ascending: false })
			.limit(50);
		if (error) {
			return { items: [], error: error.message };
		}
		return { items: data || [] };
	} catch (e: any) {
		return { items: [], error: e?.message || 'Failed to load history.' };
	}
}
