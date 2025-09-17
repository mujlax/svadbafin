import React from 'react'
import styles from './Typewriter.module.css'

export default function Typewriter({ text, speed = 40, startDelay = 200, showCursor = true }) {
	const [output, setOutput] = React.useState('')
	React.useEffect(() => {
		let index = 0
		let raf
		const start = setTimeout(() => {
			const step = () => {
				index += 1
				setOutput(text.slice(0, index))
				if (index < text.length) {
					raf = setTimeout(step, speed)
				}
			}
			step()
		}, startDelay)
		return () => {
			clearTimeout(start)
			clearTimeout(raf)
		}
	}, [text, speed, startDelay])
	return (
		<span className={styles.wrap}>
			{output}
			{showCursor && <span className={styles.cursor}>▌</span>}
		</span>
	)
}
