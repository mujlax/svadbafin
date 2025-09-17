import React from 'react'
import styles from './Carousel.module.css'

export default function Carousel({ images, duration = 30000, reverse = false, height = 180, speedPxPerSec }) {
	const trackRef = React.useRef(null)
	const cycleWidthRef = React.useRef(0)
	const rafRef = React.useRef(0)
	const prevTimeRef = React.useRef(0)
	const posRef = React.useRef(0)

	const computedSpeed = React.useMemo(() => speedPxPerSec ?? null, [speedPxPerSec])

	const isVideo = (src) => /\.(mp4|webm|ogv)$/i.test(src)

	const measure = React.useCallback(() => {
		const track = trackRef.current
		if (!track) return
		// Ширина одного цикла = сумма ширин первого набора медиа
		let cycle = 0
		const children = Array.from(track.children)
		const setSize = images.length
		for (let i = 0; i < setSize && i < children.length; i += 1) {
			cycle += children[i].getBoundingClientRect().width + 8 /* gap */
		}
		if (cycle > 0) cycle -= 8
		cycleWidthRef.current = Math.max(1, cycle)
		posRef.current = reverse ? (cycleWidthRef.current - 1) : 0
	}, [images, reverse])

	React.useEffect(() => {
		measure()
		const onResize = () => measure()
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [measure])

	React.useEffect(() => {
		const track = trackRef.current
		if (!track) return
		let running = true
		const loop = (t) => {
			if (!running) return
			if (!prevTimeRef.current) prevTimeRef.current = t
			const dt = (t - prevTimeRef.current) / 1000
			prevTimeRef.current = t
			const cycle = cycleWidthRef.current
			if (cycle <= 1) {
				rafRef.current = requestAnimationFrame(loop)
				return
			}
			let speed = computedSpeed
			if (!speed) {
				const durSec = Math.max(0.001, duration / 1000)
				speed = cycle / durSec
			}
			const dir = reverse ? -1 : 1
			posRef.current = (posRef.current + dir * speed * dt) % cycle
			if (posRef.current < 0) posRef.current += cycle
			track.style.transform = `translateX(${-posRef.current}px)`
			rafRef.current = requestAnimationFrame(loop)
		}
		rafRef.current = requestAnimationFrame(loop)
		return () => {
			cancelAnimationFrame(rafRef.current)
			prevTimeRef.current = 0
		}
	}, [duration, reverse, computedSpeed, images])

	const repeated = React.useMemo(() => {
		const out = []
		for (let r = 0; r < 3; r += 1) {
			for (let i = 0; i < images.length; i += 1) {
				const src = images[i]
				out.push({ key: `${r}-${i}`, src })
			}
		}
		return out
	}, [images])

	return (
		<div className={styles.viewport} style={{ height: height + 16 }}>
			<div className={styles.track} ref={trackRef}>
				{repeated.map((it, idx) => (
					isVideo(it.src) ? (
						<video key={it.key} src={it.src} className={styles.media} style={{ height }} autoPlay muted loop playsInline />
					) : (
						<img src={it.src} alt={`nostalgia-${idx}`} key={it.key} style={{ height }} />
					)
				))}
			</div>
		</div>
	)
}
