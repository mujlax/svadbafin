import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const photosDir = path.join(publicDir, 'photos')
const outFile = path.join(publicDir, 'photos-manifest.json')

function isMedia(file) {
	const lower = file.toLowerCase()
	const exts = [
		'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif',
		'.mp4', '.webm', '.ogv',
		'.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac'
	]
	return exts.some(ext => lower.endsWith(ext))
}

async function listMedia(dirRel) {
	const dirAbs = path.join(publicDir, dirRel)
	try {
		const files = await fs.readdir(dirAbs)
		return files.filter(isMedia).map(f => `/${dirRel}/${f}`)
	} catch {
		return []
	}
}

async function main() {
	try {
		const users = await fs.readdir(photosDir)
		const result = {}
		for (const user of users) {
			const userPath = path.join(photosDir, user)
			const stat = await fs.stat(userPath)
			if (!stat.isDirectory()) continue
			const rootMedia = await listMedia(`photos/${user}`)
			const carouselMedia = await listMedia(`photos/${user}/carousel`)
			const musicMedia = await listMedia(`photos/${user}/music`)
			result[user] = { root: rootMedia, carousel: carouselMedia, music: musicMedia }
		}
		// Shared carousels for all users
		result.carousels = await listMedia('photos/default/carousels')
		// Podvorye location media (images or videos)
		result.podvorye = await listMedia('photos/default/podvorye')
		// Instax photos
		result.instax = await listMedia('photos/default/instax_photo')
		// Background photos
		result.bg_photo = await listMedia('photos/default/bg_photo')
		await fs.writeFile(outFile, JSON.stringify(result, null, 2), 'utf8')
		console.log(`Wrote ${outFile}`)
	} catch (e) {
		console.error('Error generating photos manifest:', e)
		process.exit(1)
	}
}

main()
