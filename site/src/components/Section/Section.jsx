import React from 'react'
import styles from './Section.module.css'
import Typewriter from '../Typewriter/Typewriter.jsx'

export default function Section({ title, children, ribbon }) {
	return (
		<section className={styles.card}>
			<div className={styles.title}>{title}</div>
			{ribbon && (
				<div className={styles.subtitle}>
					<span className={styles.ribbon}>
						<span className={styles.shapeL} aria-hidden></span>
						<Typewriter text={ribbon} speed={35} startDelay={200} />
						<span className={styles.shapeR} aria-hidden></span>
					</span>
				</div>
			)}
			<div>{children}</div>
		</section>
	)
}
