import React from 'react'

export default function CursorStars() {
	const [stars, setStars] = React.useState([])
	React.useEffect(() => {
		const onMove = (e) => {
			const id = Math.random().toString(36).slice(2)
			const star = { id, x: e.clientX, y: e.clientY }
			setStars((prev) => [...prev.slice(-30), star])
			setTimeout(() => {
				setStars((prev) => prev.filter((s) => s.id !== id))
			}, 800)
		}
		window.addEventListener('mousemove', onMove)
		return () => window.removeEventListener('mousemove', onMove)
	}, [])
	return (
		<div className="cursor-stars">
			{stars.map((s) => (
				<div key={s.id} className="cursor-star" style={{ left: s.x + 'px', top: s.y + 'px' }} />
			))}
		</div>
	)
}
