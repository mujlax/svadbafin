import React from 'react'

export default function FallingStars() {
	const [stars, setStars] = React.useState([])
	React.useEffect(() => {
		const interval = setInterval(() => {
			const id = Math.random().toString(36).slice(2)
			const x = Math.random() * window.innerWidth
			const delay = Math.random() * 1500
			const star = { id, x, delay }
			setStars((prev) => [...prev.slice(-40), star])
			setTimeout(() => {
				setStars((prev) => prev.filter((s) => s.id !== id))
			}, 2400 + delay)
		}, 700)
		return () => clearInterval(interval)
	}, [])
	return (
		<div className="falling-stars">
			{stars.map((s) => (
				<div key={s.id} className="falling-star" style={{ left: s.x + 'px', top: '-10px', animationDelay: s.delay + 'ms' }} />
			))}
		</div>
	)
}
