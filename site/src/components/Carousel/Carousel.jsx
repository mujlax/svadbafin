import React from 'react'
import { createPortal } from 'react-dom'
import styles from './Carousel.module.css'

export default function Carousel({ images, duration = 30000, reverse = false, height = 180, speedPxPerSec }) {
	const trackRef = React.useRef(null)
	const cycleWidthRef = React.useRef(0)
	const rafRef = React.useRef(0)
	const prevTimeRef = React.useRef(0)
	const posRef = React.useRef(0)
    // Фиксированная скорость для каждого экземпляра карусели (слегка случайная)
    const fixedSpeedRef = React.useRef(null)
    const [lightbox, setLightbox] = React.useState({ src: '', isVideo: false })
    const REPEATS = 8 // чем больше, тем длиннее цикл до «сброса»

	const computedSpeed = React.useMemo(() => speedPxPerSec ?? null, [speedPxPerSec])

	// Инициализируем фиксированную скорость однажды на экземпляр
	if (fixedSpeedRef.current == null) {
		// В пределах 28..48 пикс/сек для лёгкой вариативности
		fixedSpeedRef.current = 28 + Math.random() * 20
	}

    const isVideo = (src) => /\.(mp4|webm|ogv)$/i.test(src)

    const measure = React.useCallback(() => {
		const track = trackRef.current
		if (!track) return
		// Ширина одного цикла = сумма ширин первого набора медиа
		let cycle = 0
		const children = Array.from(track.children)
        const setSize = Math.min(children.length, images.length * REPEATS)
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
			// Фиксированная скорость: либо из пропса, либо заранее выбранная для экземпляра
			let speed = computedSpeed ?? fixedSpeedRef.current
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

	// Закрытие модалки по ESC
    React.useEffect(() => {
		const onKey = (e) => {
            if (e.key === 'Escape') setLightbox({ src: '', isVideo: false })
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [])

const repeated = React.useMemo(() => {
    const base = [...images]
    for (let i = base.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[base[i], base[j]] = [base[j], base[i]]
    }
    const out = []
    for (let r = 0; r < REPEATS; r += 1) {
        for (let i = 0; i < base.length; i += 1) {
            const src = base[i]
            out.push({ key: `${r}-${i}-${src}`, src })
        }
    }
    return out
}, [images])

	return (
		<div className={styles.viewport} style={{ height: height + 16 }}>
			<div className={styles.track} ref={trackRef}>
				{repeated.map((it, idx) => (
					isVideo(it.src) ? (
                    <video key={it.key} className={styles.media} style={{ height, cursor: 'zoom-in' }} autoPlay muted loop playsInline preload="metadata" onClick={() => setLightbox({ src: it.src, isVideo: true })}>
                        <source src={it.src} type="video/mp4" />
                    </video>
					) : (
                    <img src={it.src} alt={`nostalgia-${idx}`} key={it.key} style={{ height, cursor: 'zoom-in' }} onClick={() => setLightbox({ src: it.src, isVideo: false })} />
					)
				))}
                {lightbox.src && createPortal(
                    <div className={styles.lightbox} onClick={() => setLightbox({ src: '', isVideo: false })}>
                        {lightbox.isVideo ? (
                            <video className={styles.lightboxMedia} controls autoPlay playsInline onClick={(e) => e.stopPropagation()}>
                                <source src={lightbox.src} type="video/mp4" />
                            </video>
                        ) : (
                            <img className={styles.lightboxMedia} src={lightbox.src} alt="preview" onClick={(e) => e.stopPropagation()} />
                        )}
                        <button className={styles.lightboxClose} onClick={() => setLightbox({ src: '', isVideo: false })} aria-label="Закрыть">×</button>
					</div>,
					document.body
				)}
			</div>
		</div>
	)
}
