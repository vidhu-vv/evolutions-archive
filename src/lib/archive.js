import { episodeOverrides } from '$lib/episode-overrides';

/**
 * @typedef {object} Episode
 * @property {string} id
 * @property {string} title
 * @property {string | null} airDate
 * @property {string | null} episodeLabel
 * @property {string} folder
 * @property {string} size
 * @property {string} filename
 * @property {string} src
 * @property {'local' | 'cloudflare'} source
 * @property {number | null} seasonNumber
 * @property {number | null} episodeNumber
 */

/**
 * @typedef {object} RemoteManifestEpisode
 * @property {string=} key
 * @property {string=} file
 * @property {string=} filename
 * @property {string=} path
 * @property {string=} url
 * @property {string=} size
 * @property {string=} title
 */

/** @param {string} value */
function titleCase(value) {
	return value
		.split(' ')
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/** @param {string} input */
function normalizeSlashes(input) {
	return input.replace(/\\/g, '/');
}

/** @param {string} input */
function basename(input) {
	return normalizeSlashes(input).split('/').pop() ?? input;
}

/** @param {string} input */
function dirname(input) {
	const normalized = normalizeSlashes(input);
	const parts = normalized.split('/');
	parts.pop();
	return parts.length ? parts.join('/') : '.';
}

/** @param {string} input */
function extname(input) {
	const file = basename(input);
	const dotIndex = file.lastIndexOf('.');
	return dotIndex >= 0 ? file.slice(dotIndex) : '';
}

/** @param {string} year
 * @param {string} month
 * @param {string} day
 */
function formatDateFromParts(year, month, day) {
	const parsed = new Date(`${year}-${month}-${day}T12:00:00`);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/** @param {string} relativePath */
function parseEpisodeName(relativePath) {
	const ext = extname(relativePath);
	const baseName = basename(relativePath).slice(0, basename(relativePath).length - ext.length);
	const normalized = baseName
		.replace(/[_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	const dateMatch = normalized.match(/(20\d{2})[-_. ](0[1-9]|1[0-2])[-_. ]([0-2]\d|3[01])/);
	const episodeMatch = normalized.match(/(?:episode|ep)[^\d]*(\d{1,3})/i);
	const compactSeasonEpisodeMatch = normalized.match(
		/(?:^|[^a-z0-9])(?:evs?|evolutions?)?\s*s(?:eason)?\s*(\d{1,2})\s*e(?:p(?:isode)?)?\s*(\d{1,3})(?:[^a-z0-9]|$)/i
	) ?? normalized.match(/^(?:evs?|evolutions?)\s*(\d{1,2})\s*e\s*(\d{1,3})$/i);

	let title = normalized;
	let airDate = null;
	let episodeLabel = episodeMatch ? `Episode ${episodeMatch[1]}` : null;
	let seasonNumber = null;
	let episodeNumber = episodeMatch ? Number(episodeMatch[1]) : null;

	if (dateMatch) {
		const [matched, year, month, day] = dateMatch;
		airDate = formatDateFromParts(year, month, day);
		title = title.replace(matched, '').replace(/^[\s\-_:]+|[\s\-_:]+$/g, '');
	}

	if (compactSeasonEpisodeMatch) {
		const [, parsedSeasonNumber, parsedEpisodeNumber] = compactSeasonEpisodeMatch;
		seasonNumber = Number(parsedSeasonNumber);
		episodeNumber = Number(parsedEpisodeNumber);
		title = `Season ${parsedSeasonNumber}, Episode ${parsedEpisodeNumber}`;
		episodeLabel = `S${parsedSeasonNumber}E${parsedEpisodeNumber}`;
	}

	title = title.replace(/evolutions!?/gi, '').replace(/dj vee/gi, '').replace(/^[\s\-_:]+|[\s\-_:]+$/g, '');
	title = titleCase(title || 'Untitled Broadcast');

	return {
		title,
		airDate,
		episodeLabel,
		seasonNumber,
		episodeNumber
	};
}

/** @param {string} relativePath
 * @param {string} src
 * @param {string | null | undefined} size
 * @param {string | null | undefined} explicitTitle
 * @returns {Episode}
 */
function buildEpisode(relativePath, src, size, explicitTitle) {
	const parsed = parseEpisodeName(relativePath);
	const relativeDirname = dirname(relativePath);
	const folderName = relativeDirname === '.' ? 'Main Archive' : relativeDirname;
	const overrideTitle =
		explicitTitle?.trim() ||
		episodeOverrides[relativePath]?.trim() ||
		episodeOverrides[basename(relativePath)]?.trim() ||
		null;

	return {
		id: relativePath,
		title: overrideTitle ?? parsed.title,
		airDate: parsed.airDate,
		episodeLabel: parsed.episodeLabel,
		folder: folderName,
		size: size ?? 'Streaming',
		filename: basename(relativePath),
		src,
		source: src.startsWith('http') ? 'cloudflare' : 'local',
		seasonNumber: parsed.seasonNumber,
		episodeNumber: parsed.episodeNumber
	};
}

/** @param {Episode} a
 * @param {Episode} b
 */
export function compareEpisodes(a, b) {
	const aHasSeasonEpisode = a.seasonNumber !== null && a.episodeNumber !== null;
	const bHasSeasonEpisode = b.seasonNumber !== null && b.episodeNumber !== null;

	if (aHasSeasonEpisode && bHasSeasonEpisode) {
		if (a.seasonNumber !== b.seasonNumber) {
			return /** @type {number} */ (b.seasonNumber) - /** @type {number} */ (a.seasonNumber);
		}

		if (a.episodeNumber !== b.episodeNumber) {
			return /** @type {number} */ (b.episodeNumber) - /** @type {number} */ (a.episodeNumber);
		}
	}

	if (aHasSeasonEpisode !== bHasSeasonEpisode) {
		return aHasSeasonEpisode ? -1 : 1;
	}

	return b.filename.localeCompare(a.filename, undefined, { numeric: true, sensitivity: 'base' });
}

/** @param {string} input */
function toDisplayPath(input) {
	return input.replace(/^\/+/, '').trim();
}

/** @param {string} base
 * @param {string} key
 */
function joinUrl(base, key) {
	return `${base.replace(/\/+$/, '')}/${key.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * @param {RemoteManifestEpisode[] | { episodes?: RemoteManifestEpisode[] }} manifest
 * @param {string | undefined} bucketBaseUrl
 * @returns {Episode[]}
 */
export function normalizeRemoteManifest(manifest, bucketBaseUrl) {
	const entries = Array.isArray(manifest) ? manifest : manifest.episodes ?? [];

	/** @type {Episode[]} */
	const episodes = [];

	for (const entry of entries) {
		const relativePath = toDisplayPath(entry.key ?? entry.file ?? entry.filename ?? entry.path ?? '');
		if (!relativePath) continue;

		const url = entry.url ?? (bucketBaseUrl ? joinUrl(bucketBaseUrl, relativePath) : null);
		if (!url) continue;

		episodes.push(buildEpisode(relativePath, url, entry.size, entry.title));
	}

	return episodes.sort(compareEpisodes);
}

/**
 * @param {typeof fetch} fetcher
 * @param {string | null | undefined} manifestUrl
 * @param {string | null | undefined} bucketBaseUrl
 * @returns {Promise<Episode[]>}
 */
export async function loadArchiveFromManifest(fetcher, manifestUrl, bucketBaseUrl) {
	if (!manifestUrl) {
		return [];
	}

	let response;
	try {
		response = await fetcher(manifestUrl);
	} catch {
		return [];
	}

	if (!response.ok) {
		return [];
	}

	try {
		/** @type {RemoteManifestEpisode[] | { episodes?: RemoteManifestEpisode[] }} */
		const manifest = await response.json();
		return normalizeRemoteManifest(manifest, bucketBaseUrl ?? undefined);
	} catch {
		return [];
	}
}
