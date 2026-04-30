import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import { ARCHIVE_ROOT } from '$lib/server/archive';

const MIME_TYPES = {
	'.mp3': 'audio/mpeg',
	'.wav': 'audio/wav',
	'.m4a': 'audio/mp4',
	'.aac': 'audio/aac',
	'.ogg': 'audio/ogg',
	'.flac': 'audio/flac'
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	const slug = params.slug ?? '';
	const absolutePath = path.resolve(ARCHIVE_ROOT, slug);
	const relativeToRoot = path.relative(ARCHIVE_ROOT, absolutePath);

	if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
		throw error(403, 'Invalid audio path');
	}

	try {
		const fileStat = await stat(absolutePath);
		const extension = path.extname(absolutePath).toLowerCase();
		const stream = /** @type {ReadableStream<Uint8Array>} */ (
			Readable.toWeb(createReadStream(absolutePath))
		);

		return new Response(stream, {
			headers: {
				'content-length': String(fileStat.size),
				'content-type':
					MIME_TYPES[/** @type {keyof typeof MIME_TYPES} */ (extension)] ?? 'application/octet-stream',
				'cache-control': 'public, max-age=3600'
			}
		});
	} catch {
		throw error(404, 'Audio file not found');
	}
}
