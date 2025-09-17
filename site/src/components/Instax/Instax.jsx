import React from 'react'
import styles from './Instax.module.css'

export default function Instax({ photos = [], cameraSrc = (import.meta?.env?.BASE_URL || '/') + 'photos/default/camera/instax.png', title = 'Секретный Instax — нажми, чтобы проявить кадр' }) {
	const [remaining, setRemaining] = React.useState(photos)
	const [displayed, setDisplayed] = React.useState([])
	const [popped, setPopped] = React.useState(null)
	const [animKey, setAnimKey] = React.useState(0)
	const [flash, setFlash] = React.useState(false)
	const [outOfFilm, setOutOfFilm] = React.useState(false)
	const shotRef = React.useRef(null)

	// синхронизация, когда список фото приходит асинхронно
	React.useEffect(() => {
		setRemaining(photos || [])
		setDisplayed([])
		setPopped(null)
		setOutOfFilm(false)
	}, [photos])

	const onShoot = () => {
		// если фото ещё не подгрузились — игнорируем клики
		if (!photos || photos.length === 0) return
		if (outOfFilm) return
		// вспышка на каждый кадр
		setFlash(true)
		setTimeout(() => setFlash(false), 360)
		// звук затвора
		try {
			if (shotRef.current) {
				shotRef.current.currentTime = 0
				shotRef.current.play()
			}
		} catch (e) {}

		let nextRemaining = remaining
		// 1) если есть уже выезженная карточка — переносим её вниз (на этой же нажатии)
		if (popped) {
			setDisplayed((prev) => [popped, ...prev])
			setPopped(null)
		}

		// 2) пробуем показать новую, если остались
		if (!nextRemaining || nextRemaining.length === 0) {
			// если уже всё выдано (и сейчас ничего не попим), покажем сообщение на следующем клике
			setOutOfFilm(displayed.length >= photos.length && !popped)
			return
		}
		const idx = Math.floor(Math.random() * nextRemaining.length)
		const src = nextRemaining[idx]
		setPopped(src)
		setAnimKey((k) => k + 1)
		// удаляем выбранное из очереди
		setRemaining((prev) => (prev ? prev.filter((_, i) => i !== idx) : []))
	}

	return (
		<div className={styles.wrap}>
            
			<audio ref={shotRef} src={(import.meta?.env?.BASE_URL || '/') + 'photos/default/sound_instax/sound_shot.mp3'} preload="auto" />
			<div className={styles.title}>
				{title}
				<span className={styles.hintTop}>Нажми сюда 👉</span>
			</div>
			<div className={styles.cameraZone} onClick={onShoot}>
				{flash && <div className={styles.flash} aria-hidden></div>}
				<img src={cameraSrc} alt="instax" className={styles.camera} />
				<div className={styles.slot}>
					{popped && (
						<img key={animKey} src={popped} alt="instax-pop" className={styles.printPop} />
					)}
				</div>
			</div>
            {outOfFilm && (
				<div className={styles.empty}>
					<p>Картриджи закончились! Фотоаппарат просит подкормки</p>
					<a className={styles.buyBtn} href="https://www.ozon.ru/product/kartridzh-instax-mini-100-snimkov-1649402184/?at=r2t4Er2Xqh0N3nBxuvAr88KI2KLQA8S0n6WG1ug917kk" target="_blank" rel="noreferrer">Дуреем с этой прикормки</a>
				</div>
			)}
			<div className={styles.shelf}>
				{displayed.map((src, i) => (
					<img key={i} src={src} alt={`instax-shelf-${i}`} className={styles.plain} />
				))}
			</div>
			
		</div>
	)
}
