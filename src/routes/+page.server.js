import { loadArchive } from '$lib/server/archive';
import { env } from '$env/dynamic/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	const episodes = await loadArchive(fetch);
	const usesCloudflare = Boolean(env.ARCHIVE_MANIFEST_URL || env.ARCHIVE_BUCKET_URL);

	return {
		episodes,
		stats: {
			totalEpisodes: episodes.length,
			folders: new Set(episodes.map((episode) => episode.folder)).size
		},
		source: usesCloudflare ? 'Cloudflare Archive' : 'Local Archive',
		manifestHint: env.ARCHIVE_MANIFEST_URL || env.ARCHIVE_BUCKET_URL || null
	};
}
