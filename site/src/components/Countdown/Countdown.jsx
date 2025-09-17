import React from 'react'
import styles from './Countdown.module.css'

const TARGET_ISO = '2025-10-18T17:00:00+03:00'

function pad(n) { return String(n).padStart(2, '0') }

export default function Countdown() {
	const [left, setLeft] = React.useState({ d: 0, h: 0, m: 0, s: 0 })
	const [done, setDone] = React.useState(false)

	React.useEffect(() => {
		const target = new Date(TARGET_ISO).getTime()
		const tick = () => {
			const now = Date.now()
			let diff = Math.max(0, Math.floor((target - now) / 1000))
			if (diff <= 0) {
				setDone(true)
				setLeft({ d: 0, h: 0, m: 0, s: 0 })
				return
			}
			const d = Math.floor(diff / 86400); diff -= d * 86400
			const h = Math.floor(diff / 3600); diff -= h * 3600
			const m = Math.floor(diff / 60); diff -= m * 60
			const s = diff
			setLeft({ d, h, m, s })
		}
		tick()
		const id = setInterval(tick, 1000)
		return () => clearInterval(id)
	}, [])

	if (done) return (
		<div className={styles.wrap}>
			<div className={styles.title}>Сегодня тот самый день! 💍</div>
		</div>
	)

	return (
		<div className={styles.wrap}>
			<div className={styles.title}>До события осталось</div>
			<div className={styles.row}>
				<div className={styles.cell}><span>{left.d}</span><label>дней</label></div>
				<div className={styles.cell}><span>{pad(left.h)}</span><label>часов</label></div>
				<div className={styles.cell}><span>{pad(left.m)}</span><label>мин</label></div>
				<div className={styles.cell}><span>{pad(left.s)}</span><label>сек</label></div>
			</div>
		</div>
	)
}
