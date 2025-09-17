import React from 'react'
import styles from './MusicPlayer.module.css'

export default function MusicPlayer({ src = null, srcs = [] }) {
	const audioRef = React.useRef(null)
	const [playing, setPlaying] = React.useState(false)
	const [volume, setVolume] = React.useState(0.7)
	const [title, setTitle] = React.useState('')

	const effectiveSrc = React.useMemo(() => {
		if (src) return src
		if (Array.isArray(srcs) && srcs.length > 0) return srcs[0]
		return "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2a4bcda3a8.mp3?filename=romantic-piano-loop-100-bpm-103518.mp3"
	}, [src, srcs])

	const deriveTitle = React.useCallback((url) => {
		try {
			const u = new URL(url, window.location.origin)
			let name = u.searchParams.get('filename') || u.pathname.split('/').pop() || ''
			name = decodeURIComponent(name)
			name = name.replace(/\.[a-z0-9]+$/i, '')
			return name || 'Трек'
		} catch {
			let name = (url || '').split('?')[0].split('/').pop() || ''
			name = decodeURIComponent(name).replace(/\.[a-z0-9]+$/i, '')
			return name || 'Трек'
		}
	}, [])

	React.useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume
		}
	}, [volume])

	React.useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.pause()
		audio.src = effectiveSrc
		audio.load()
		setTitle(deriveTitle(effectiveSrc))
		setPlaying(false)
	}, [effectiveSrc, deriveTitle])

	const toggle = () => {
		const audio = audioRef.current
		if (!audio) return
		if (playing) audio.pause()
		else audio.play()
		setPlaying(!playing)
	}

	const stop = () => {
		const audio = audioRef.current
		if (!audio) return
		audio.pause()
		audio.currentTime = 0
		setPlaying(false)
	}

	return (
		<div className={`${styles.player} card`}>
			<audio ref={audioRef} preload="auto" />
			<div className={styles.equalizer} aria-hidden>
				<span></span><span></span><span></span><span></span>
			</div>
			<div style={{ fontFamily: 'inherit', fontSize: 12, color: '#333' }}>{title}</div>
			<button className={styles.btn} onClick={toggle}>{playing ? '⏸ Пауза' : '▶️ Пуск'}</button>
			<button className={styles.btn} onClick={stop}>⏹ Стоп</button>
			<input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
		</div>
	)
}
