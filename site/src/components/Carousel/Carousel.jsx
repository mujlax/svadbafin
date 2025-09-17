import React from 'react'
import { createPortal } from 'react-dom'
import styles from './Carousel.module.css'

export default function Carousel({ images, duration = 30000, reverse = false, height = 180, speedPxPerSec }) {
	const trackRef = React.useRef(null)
	const cycleWidthRef = React.useRef(0)
	const rafRef = React.useRef(0)
	const prevTimeRef = React.useRef(0)
	const posRef = React.useRef(0)
    const isDraggingRef = React.useRef(false)
    const dragStartXRef = React.useRef(0)
    const dragStartPosRef = React.useRef(0)
    const didDragRef = React.useRef(false)
    const dragActivatedRef = React.useRef(false)
    const [isDraggingUi, setIsDraggingUi] = React.useState(false)
    const DRAG_THRESHOLD_PX = 14
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
		// Берём ширину только ПЕРВОГО набора изображений (без повторов),
		// чтобы сброс происходил после показа всех уникальных фото один раз.
		const setSize = Math.min(children.length, images.length)
		for (let i = 0; i < setSize && i < children.length; i += 1) {
			const w = children[i].getBoundingClientRect().width
			if (w) cycle += w + 8 /* gap */
		}
		if (cycle > 0) cycle -= 8
		// Если медиа ещё не отрисованы и ширина 0 — не затираем валидное значение
		if (cycle > 0) {
			cycleWidthRef.current = Math.max(1, cycle)
			posRef.current = reverse ? (cycleWidthRef.current - 1) : 0
		}
    }, [images, reverse])

	React.useEffect(() => {
		measure()
		const onResize = () => measure()
		window.addEventListener('resize', onResize)
		// Пересчёт после загрузки изображений/видео
		const track = trackRef.current
		const media = track ? Array.from(track.querySelectorAll('img, video')) : []
		const imgHandlers = []
		media.forEach((el) => {
			if (el.tagName === 'IMG') {
				const handler = () => measure()
				el.addEventListener('load', handler)
				imgHandlers.push([el, handler])
			} else if (el.tagName === 'VIDEO') {
				const handler = () => measure()
				el.addEventListener('loadedmetadata', handler)
				imgHandlers.push([el, handler])
			}
		})
		// Наблюдаем изменения размеров контейнера и детей
		let resizeObs
		if (window.ResizeObserver && track) {
			resizeObs = new ResizeObserver(() => measure())
			resizeObs.observe(track)
			Array.from(track.children).forEach((child) => resizeObs.observe(child))
		}
		return () => {
			window.removeEventListener('resize', onResize)
			imgHandlers.forEach(([el, h]) => {
				el.removeEventListener('load', h)
				el.removeEventListener('loadedmetadata', h)
			})
			if (resizeObs) resizeObs.disconnect()
		}
	}, [measure, images])

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
			// Во время перетаскивания отключаем авто-прокрутку
			if (!isDraggingRef.current) {
				posRef.current = (posRef.current + dir * speed * dt) % cycle
				if (posRef.current < 0) posRef.current += cycle
			}
			track.style.transform = `translateX(${-posRef.current}px)`
			rafRef.current = requestAnimationFrame(loop)
		}
		rafRef.current = requestAnimationFrame(loop)
		return () => {
			cancelAnimationFrame(rafRef.current)
			prevTimeRef.current = 0
		}
	}, [duration, reverse, computedSpeed, images])

    // Обработчики перетаскивания/свайпа
    const onPointerDown = React.useCallback((e) => {
        // Не начинаем перетаскивание, если открыт лайтбокс
        if (lightbox.src) return
        if (e.button !== 0 && e.pointerType === 'mouse') return
        const cycle = cycleWidthRef.current
        if (cycle <= 1) return
        isDraggingRef.current = true
        didDragRef.current = false
        dragActivatedRef.current = false
        dragStartXRef.current = e.clientX
        dragStartPosRef.current = posRef.current
        setIsDraggingUi(false)
    }, [])

    const onPointerMove = React.useCallback((e) => {
        if (!isDraggingRef.current) return
        const cycle = cycleWidthRef.current
        if (cycle <= 1) return
        const dx = e.clientX - dragStartXRef.current
        if (!dragActivatedRef.current) {
            if (Math.abs(dx) >= DRAG_THRESHOLD_PX) {
                dragActivatedRef.current = true
                didDragRef.current = true
                setIsDraggingUi(true)
                e.currentTarget.setPointerCapture?.(e.pointerId)
            } else {
                // игнорируем мелкие дрожания пальца/мыши
                return
            }
        }
        let next = (dragStartPosRef.current - dx) % cycle
        if (next < 0) next += cycle
        posRef.current = next
        const track = trackRef.current
        if (track) track.style.transform = `translateX(${-posRef.current}px)`
        e.preventDefault()
    }, [])

    const onPointerUp = React.useCallback((e) => {
        if (!isDraggingRef.current) return
        isDraggingRef.current = false
        setIsDraggingUi(false)
        dragActivatedRef.current = false
        e.preventDefault()
    }, [])

    // Гасим клик, если до этого было перетаскивание, чтобы не открывался лайтбокс случайно
    const onClickCapture = React.useCallback((e) => {
        if (!didDragRef.current) return
        didDragRef.current = false
        e.preventDefault()
        e.stopPropagation()
    }, [])

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
		<div className={styles.viewport} style={{ height: height + 16 }}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
			onClickCapture={onClickCapture}
			onDragStart={(e) => e.preventDefault()}
			data-dragging={isDraggingUi ? '1' : '0'}
		>
			<div className={styles.track} ref={trackRef}>
				{repeated.map((it, idx) => (
					isVideo(it.src) ? (
					<video key={it.key} className={styles.media} style={{ height, cursor: 'zoom-in' }} autoPlay muted loop playsInline preload="metadata" onClick={() => setLightbox({ src: it.src, isVideo: true })} draggable={false} onDragStart={(e) => e.preventDefault()}>
                        <source src={it.src} type="video/mp4" />
                    </video>
					) : (
					<img src={it.src} alt={`nostalgia-${idx}`} key={it.key} style={{ height, cursor: 'zoom-in' }} onClick={() => setLightbox({ src: it.src, isVideo: false })} draggable={false} onDragStart={(e) => e.preventDefault()} />
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
