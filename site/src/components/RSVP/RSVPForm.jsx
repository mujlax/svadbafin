import React from 'react'
import styles from './RSVPForm.module.css'

export default function RSVPForm() {
	const [name, setName] = React.useState('')
	const [choice, setChoice] = React.useState('иду')
	const [msg, setMsg] = React.useState('')
	const [sent, setSent] = React.useState(false)

	const submit = (e) => {
		e.preventDefault()
		setSent(true)
	}

	if (sent) {
		return (
			<div className="card">
				<div className="title">Спасибо! ✅</div>
				<p>Ваш ответ принят. Наш модем уже отправил его по проводам! 📡</p>
			</div>
		)
	}

	return (
		<form className={`card ${styles.rsvp}`} onSubmit={submit}>
			<div className="title">RSVP (очень серьёзно)</div>
			<input placeholder="Ваше гордое имя" value={name} onChange={(e) => setName(e.target.value)} required />
			<select value={choice} onChange={(e) => setChoice(e.target.value)}>
				<option value="иду">Я иду! Возьму дискету</option>
				<option value="думаю">Думаю, модем занят</option>
				<option value="не могу">Не могу, танцую лезгинку</option>
			</select>
			<textarea placeholder="Пожелания, любимые салаты и размеры тарелок" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
			<button className={styles.btn}>Отправить по dial-up ✉️</button>
		</form>
	)
}
