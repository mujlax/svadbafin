import React from 'react'
import styles from './Badge.module.css'

export default function Badge({ emoji, text }) {
	return (
		<span className={styles.badge}><span>{emoji}</span><span>{text}</span></span>
	)
}
