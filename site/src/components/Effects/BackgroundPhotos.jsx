import React from 'react'

export default function BackgroundPhotos({ images = [], maxItems = 20 }) {
    const [tiles, setTiles] = React.useState([])
    const [scrollY, setScrollY] = React.useState(0)

    React.useEffect(() => {
        let ticking = false
        const last = { y: 0 }
        const onScroll = () => {
            last.y = window.scrollY || window.pageYOffset || 0
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrollY(last.y)
                    ticking = false
                })
                ticking = true
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    React.useEffect(() => {
        if (!images || images.length === 0) {
            setTiles([])
            return
        }
        const base = [...images]
        for (let i = base.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[base[i], base[j]] = [base[j], base[i]]
        }
        const count = Math.max(1, Math.min(maxItems, 30))
        const picks = Array.from({ length: count }, (_, i) => base[i % base.length])

        // Размещение по сетке с небольшим случайным смещением — без пересечений
        // Чуть разрежаем: создаем сетку больше, чем требуется под количество
        const grid = Math.ceil(Math.sqrt(count * 1.5))
        const cellW = 100 / grid
        const cellH = 100 / grid
        const placed = picks.map((src, idx) => {
            const row = Math.floor(idx / grid)
            const col = idx % grid
            const baseTop = row * cellH + cellH / 2
            const baseLeft = col * cellW + cellW / 2
            const jitterTop = (Math.random() - 0.5) * (cellH * 0.35)
            const jitterLeft = (Math.random() - 0.5) * (cellW * 0.35)
            const top = Math.min(98, Math.max(2, baseTop + jitterTop))
            // Разрешаем небольшое вылезание за края по горизонтали
            const left = Math.min(108, Math.max(-8, baseLeft + jitterLeft))
            const rotate = Math.random() * 30 - 15
            const size = 8 + ((idx % 5) * 2.5) // vw
            const opacity = 0.16 + (idx % 5) * 0.04
            const parallax = 0.06 + Math.random() * 0.16
            return { src, top, left, rotate, size, opacity, parallax }
        })
        setTiles(placed)
    }, [images, maxItems])

    if (tiles.length === 0) return null

    return (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:-1, overflow:'hidden' }}>
            {tiles.map((t, idx) => (
                <img
                    key={`${t.src}-${idx}`}
                    src={t.src}
                    alt="bg"
                    style={{
                        position: 'absolute',
                        top: `${t.top}%`,
                        left: `${t.left}%`,
                        width: `${t.size}vw`,
                        height: 'auto',
                        transform: `translate(-50%, -50%) translateY(${(scrollY * t.parallax).toFixed(1)}px) rotate(${t.rotate}deg)`,
                        filter: 'grayscale(0.5) contrast(0.9)',
                        opacity: t.opacity,
                    }}
                />
            ))}
        </div>
    )
}


