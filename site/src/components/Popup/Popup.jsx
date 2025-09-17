import React from 'react'
import styles from './Popup.module.css'

export default function Popup() {
	const [visible, setVisible] = React.useState(true)
	React.useEffect(() => {
		const t = setTimeout(() => setVisible(true), 2000)
		return () => clearTimeout(t)
	}, [])
	if (!visible) return null
	return (
		<div className={styles.popup}>
			<div className={styles.titlebar}>
				<span>Важное системное сообщение</span>
				<span className={styles.close} onClick={() => setVisible(false)}>X</span>
			</div>
			<div>Ваш компьютер слишком счастлив. Предлагается срочно явиться на свадьбу для балансировки кармы.</div>
		</div>
	)
}
