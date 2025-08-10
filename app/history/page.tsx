



import Link from 'next/link';
import { fetchRecentSearchHistory } from '../../lib/searchHistory';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
	const { items, error } = await fetchRecentSearchHistory();

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
			{/* Header (copied from main page) */}
			<header className="border-b-4 border-black bg-white/90 backdrop-blur-sm">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
							<div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
								<span className="text-white text-lg sm:text-xl font-bold">🎵</span>
							</div>
							<Link href="/" className="text-lg sm:text-2xl font-black text-black truncate hover:underline focus:underline">
								Song2Meaning
							</Link>
						</div>
						<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
							{/* History Button */}
							<Link
								href="/history"
								className="bg-purple-600 hover:bg-purple-700 border-2 border-black px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 flex items-center gap-1 sm:gap-2 text-white font-bold"
								title="View your recent searches"
							>
								<svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span className="text-xs sm:text-sm hidden min-[480px]:inline">History</span>
							</Link>
							{/* GitHub Link */}
							<a
								href="https://github.com/4regab/song2meaning"
								target="_blank"
								rel="noopener noreferrer"
								className="bg-gray-900 hover:bg-gray-800 border-2 border-black px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all duration-150 flex items-center gap-1 sm:gap-2"
								title="View source code on GitHub"
							>
								<svg className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
								{/* Removed 'GitHub' text, icon only */}
							</a>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-3xl mx-auto px-4 py-10">
				<h1 className="text-3xl font-black text-black mb-6">Recent Searches</h1>
				{error && (
					<div className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-6">
						<p className="text-red-800 font-bold">{error}</p>
					</div>
				)}
				{items.length === 0 && !error && (
					<div className="bg-white border-2 border-black rounded-lg p-6 text-center text-gray-600 font-medium">
						No searches found yet.
					</div>
				)}
				<ul className="space-y-4">
					{items.map((item) => (
						<li key={item.id} className="bg-white border-2 border-black rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							<div>
								<div className="font-bold text-lg text-purple-800">{item.artist} - {item.title}</div>
								<div className="text-gray-500 text-xs mt-1">{new Date(item.created_at).toLocaleString()}</div>
							</div>
							<Link href={`/share/${item.share_id}`} className="mt-2 sm:mt-0 inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150">View Analysis</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
