import React from 'react'
import styles from './UsersDirectory.module.css'

export default function UsersDirectory() {
	const [users, setUsers] = React.useState([])
	const [error, setError] = React.useState('')
	React.useEffect(() => {
        const base = import.meta.env.BASE_URL || '/'
        fetch(`${base}users.json`)
			.then((r) => r.json())
			.then((data) => setUsers(Object.keys(data)))
			.catch(() => setError('Не удалось загрузить users.json'))
	}, [])
	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Список персональных страниц</h1>
			<div className={`card ${styles.card}`}>
				{error ? (
					<div>{error}</div>
				) : (
					<div className={styles.list}>
                        {users.map((u) => (
							<div key={u} className={styles.user}>
								<b>{u}</b>
                                <a href={`${import.meta.env.BASE_URL}?u=${encodeURIComponent(u)}`}>Параметр: ?u={u}</a>
                                <a href={`${import.meta.env.BASE_URL}${encodeURIComponent(u)}`}>Путь: /{u}</a>
							</div>
						))}
					</div>
				)}
				<div className={styles.note}>Подсказка: формат ссылок — как через параметр, так и через путь.</div>
			</div>
		</div>
	)
}
