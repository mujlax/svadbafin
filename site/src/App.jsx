import React from 'react'
import HeaderMarquee from './components/HeaderMarquee/HeaderMarquee.jsx'
import MusicPlayer from './components/MusicPlayer/MusicPlayer.jsx'
import Section from './components/Section/Section.jsx'
import Badge from './components/Badge/Badge.jsx'
import Carousel from './components/Carousel/Carousel.jsx'
import Popup from './components/Popup/Popup.jsx'
import CursorStars from './components/Effects/CursorStars.jsx'
import FallingStars from './components/Effects/FallingStars.jsx'
import BackgroundPhotos from './components/Effects/BackgroundPhotos.jsx'
import UsersDirectory from './components/UsersDirectory/UsersDirectory.jsx'
import Instax from './components/Instax/Instax.jsx'
import Countdown from './components/Countdown/Countdown.jsx'
import DoodleJump from './components/DoodleJump/DoodleJump.jsx'
import styles from './App.module.css'

const IMAGES = [
	'https://i.imgur.com/6rLwW.gif',
	'https://i.imgur.com/8sJg5.gif',
	'https://i.imgur.com/6D8DT.jpg',
	'https://i.imgur.com/1t8cY.gif',
	'https://i.imgur.com/2X1aU.jpg',
	'https://i.imgur.com/1RMJ9.gif',
	'https://i.imgur.com/5gxGm.jpg',
	'https://i.imgur.com/Q6q4y.gif',
	'https://i.imgur.com/5wY1Q.jpg',
	'https://i.imgur.com/0lIYt0W.gif',
	'https://i.imgur.com/1YcQp8E.gif',
	'https://i.imgur.com/Gd2mW0q.gif',
	'https://i.imgur.com/2s6yJx8.jpeg',
	'https://i.imgur.com/5B3b2sU.gif',
	'https://i.imgur.com/9c8z8dB.jpeg',
	'https://i.imgur.com/0oM7xgR.gif',
	'https://i.imgur.com/6oVdB1N.jpeg',
	'https://i.imgur.com/PH6Q9vM.gif',
	'https://i.imgur.com/RyU1y2S.jpeg',
	'https://i.imgur.com/4r3mD0k.gif',
]

const DUPLICATED_IMAGES = [...IMAGES, ...IMAGES, ...IMAGES]

function useUserConfig() {
	const [config, setConfig] = React.useState(null)
	const [userId, setUserId] = React.useState('default')
	const [isRoot, setIsRoot] = React.useState(true)
	const [photosManifest, setPhotosManifest] = React.useState(null)

    React.useEffect(() => {
        const url = new URL(window.location.href)
        const qUser = url.searchParams.get('u')
        const baseUrl = ((import.meta.env.BASE_URL || '/')).replace(/\/$/, '/')
		let path = window.location.pathname
		if (baseUrl && path.startsWith(baseUrl)) path = path.slice(baseUrl.length)
		path = path.replace(/^\//, '')
		if (path === '' || path === 'index.html') path = null
		const candidate = qUser || path || 'default'
		setIsRoot(!qUser && !path)
        const base = (import.meta.env.BASE_URL || '/')
        Promise.all([
            fetch(base + 'users.json').then((r) => r.json()),
            fetch(base + 'photos-manifest.json').then((r) => r.json()).catch(() => ({})),
        ]).then(([users, manifestRaw]) => {
            const addBase = (p) => (p ? (base + String(p).replace(/^\//, '')) : p)
            const manifest = { ...manifestRaw }
            if (manifest.carousels) manifest.carousels = manifest.carousels.map(addBase)
            if (manifest.podvorye) manifest.podvorye = manifest.podvorye.map(addBase)
            if (manifest.instax) manifest.instax = manifest.instax.map(addBase)
            if (manifest.bg_photo) manifest.bg_photo = manifest.bg_photo.map(addBase)
            Object.keys(manifest).forEach((k) => {
                if (['carousels','podvorye','instax'].includes(k)) return
                const u = manifest[k]
                if (u && typeof u === 'object') {
                    if (u.root) u.root = u.root.map(addBase)
                    if (u.carousel) u.carousel = u.carousel.map(addBase)
                    if (u.music) u.music = u.music.map(addBase)
                }
            })
			const uid = users[candidate] ? candidate : 'default'
			setUserId(uid)
			setConfig(users[uid])
            setPhotosManifest(manifest)
		}).catch(() => {
			setUserId('default')
			setConfig(null)
			setPhotosManifest(null)
		})
	}, [])

	return { userId, config, isRoot, photosManifest }
}

export default function App() {
	const { userId, config, isRoot, photosManifest } = useUserConfig()

	// Reveal DoodleJump only after 18.10.2025 15:30 MSK (12:30 UTC), or if forced via secret button
	const [forceDJ, setForceDJ] = React.useState(false)
	React.useEffect(() => {
		try { if (localStorage.getItem('dj_dev_show_game') === '1') setForceDJ(true) } catch {}
	}, [])
	const revealAtUtc = Date.parse('2025-10-18T12:30:00Z')
	const showDJ = forceDJ || (Date.now() >= revealAtUtc)

	if (isRoot) {
		return (
			<>
				<HeaderMarquee />
				<UsersDirectory />
				<Popup />
			</>
		)
	}

	const badges = config?.badges || [
		{ emoji: '💿', text: 'Best of 2003' },
		{ emoji: '🧃', text: 'Компот бесплатно' },
		{ emoji: '🐈', text: 'Кот одобряет' },
	]
	const ribbonTop = config?.ribbon || 'Ты приглашён(а)!'
	const manifestUser = photosManifest?.[userId]
	const userMusic = manifestUser?.music || []
	const sharedCarousels = photosManifest?.carousels || []
	const podvorye = photosManifest?.podvorye || []
	const instaxPhotos = photosManifest?.instax || []
	const half = Math.ceil(sharedCarousels.length / 2)
	const carousel1 = sharedCarousels.length ? sharedCarousels.slice(0, half) : DUPLICATED_IMAGES
	const carousel3 = sharedCarousels.length ? sharedCarousels.slice(half) : DUPLICATED_IMAGES
	const carousel2 = (manifestUser?.carousel && manifestUser.carousel.length > 0)
		? manifestUser.carousel
		: DUPLICATED_IMAGES

	const ymapsUrl = 'https://yandex.ru/maps/?pt=39.898433,57.561213&z=17&l=map' // lon,lat
	const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSczgis13XBRbW9Wff13O9fTvdWUV438bqgDCttDuPqhXZn7qg/viewform?embedded=true'

	return (
			<>
				<CursorStars />
				<FallingStars />
				<BackgroundPhotos images={photosManifest?.bg_photo || []} />
			<HeaderMarquee />
			{showDJ && <DoodleJump height={220} emoji={'🐸'} />}
				<div className={styles.container}>
				<Section title={`Свадьба века: Денис ❤︎ Аня${userId !== 'default' ? '  '  : ''}`} ribbon={ribbonTop}>
					<p>
						Добро пожаловать в наше ретро-приглашение! Здесь всё по канонам: <b>гифки, блёстки, маркуй</b> и лучший дизайн от племянника системного администратора.
						Пожалуйста, не выключайте компьютер во время загрузки любви.
					</p>
					<div className={styles.badges}>
						{badges.map((b, i) => (
							<Badge key={i} emoji={b.emoji} text={b.text} />
						))}
					</div>
				</Section>

				<Countdown />

				<MusicPlayer src={userMusic.length ? null : null} srcs={userMusic} />

				<Section title="Когда и где" ribbon="секретная локация раскрыта">
					<p><b>Дата:</b> 18.10.2025, 16:00 по московскому часу.</p>
					<p><b>Адрес:</b> Ярославское Подворье —
						<a href={ymapsUrl} target="_blank" rel="noreferrer"> открыть в Яндекс.Картах</a>, сайт: <a href={'https://yarpodvorie.ru'} target="_blank" rel="noreferrer">yarpodvorie.ru</a>
					</p>
					{podvorye.length > 0 && (
						<>
							<div style={{ height: 12 }} />
							<Carousel images={podvorye} duration={26000} height={180} />
						</>
					)}
				</Section>

				<Section title="Галерея воспоминаний" ribbon="карусель завезли">
					<Carousel images={carousel1} duration={35000} height={160} />
					<div style={{ height: 12 }} />
					<Carousel images={carousel2} duration={28000} reverse height={180} />
					<div style={{ height: 12 }} />
					<Carousel images={carousel3} duration={46000} height={200} />
					<div style={{ height: 16 }} />
					<Instax photos={instaxPhotos} cameraSrc={(import.meta.env.BASE_URL || '/') + 'photos/default/camera/instax.png'} />
				</Section>

				<Section title="Программа" ribbon="без очереди">
					<ul>
						<li>16:00 — сбор гостей и настройка Wi‑Fi с паролем "123456"</li>
						<li>17:00 — салаты, тосты, танцы под «Руки Вверх!»</li>
						<li>18:30 — похищение невесты бандой мексиканцев</li>
						<li>21:00 — взрываем торт, режем салют</li>
						<li>22:00 — финальная дискотэка</li>
					</ul>
				</Section>

				<Section title="Дресс-код" ribbon="шик и лампасы">
					<p>Дресс-код: Белый с ног до головы — это эксклюзивный VIP-абонемент только для невесты. Остальным — спасибо за понимание и за то, что вы не перепутаете нас на фотографиях.</p>
<p>Черный — всегда стильно, всегда в тему. Вечная классика: от «маленького черного платья» до «большого черного костюма».</p> <p>Черный и белый микс — как шахматы: строго, стильно, драматично.</p>	

<p>Шоколад (тёмно-коричневый) — можно. Но не грызть.</p>

<p>Бежевый — нежно, как капучино утром после танцев. </p>
				</Section>

				<Section title="Заполните анкету">
					<div className="card" style={{ display:'grid', gap:12 }}>
						<div style={{ display:'flex', justifyContent:'flex-end' }}>
							<a href={formUrl.replace('?embedded=true','')} target="_blank" rel="noreferrer" style={{
								fontFamily: 'Press Start 2P, monospace',
								fontSize: 12,
								padding: '8px 12px',
								border: '2px solid #dcdcdc',
								background: '#fff',
								textDecoration: 'none',
								color: '#0f0f0f',
								boxShadow: '0 2px 0 #000, 0 0 0 2px rgba(255,62,166,.25)'
							}}>Открыть в новой вкладке</a>
						</div>
						<iframe src={formUrl} width="100%" height="680" frameBorder="0" marginHeight="0" marginWidth="0">Loading…</iframe>
					</div>
				</Section>

				

				<div className={styles.footer}>
					<p>Сделано с любовью и ICQ цветочками. Если что-то мигает — это счастье.</p>
					<p>© 2003—2026, все права защищены ковром.</p>
				</div>
			</div>
			{/* Secret debug button to force-show the game */}
			<button onClick={() => { try { localStorage.setItem('dj_dev_show_game','1') } catch {}; setForceDJ(true) }} title="." aria-label="." style={{ position:'fixed', left:6, bottom:6, width:50, height:50, opacity:.05, border:'1px solid transparent', background:'#000', padding:0 }} />
			<Popup />
		</>
	)
}
