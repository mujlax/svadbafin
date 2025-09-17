/* global React, ReactDOM */

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
	// Дополнительные мемные гифки/картинки
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
];

const DUPLICATED_IMAGES = [...IMAGES, ...IMAGES, ...IMAGES];

function HeaderMarquee() {
	return (
		<div className="header-marquee">
			<marquee behavior="scroll" direction="left" scrollamount="8">
				💘 ВАЖНО: СВАДЬБА СТОЛЕТИЯ! 💍 ТОРЖЕСТВО ЛЮБВИ И ПЕЛЬМЕНЕЙ 🥟 2003 EDITION ✨ МОДЕМ ПИЩИТ, СЕРДЦЕ СТУЧИТ, А ТЫ ПРИХОДИ! 💖
			</marquee>
		</div>
	);
}

function Badge({ emoji, text }) {
	return (
		<span className="badge"><span>{emoji}</span><span>{text}</span></span>
	);
}

function Carousel({ images, duration = 30000, reverse = false, height = 180 }) {
	return (
		<div className={`carousel${reverse ? ' reverse' : ''}`} style={{"--dur": `${duration}ms`}}>
			<div className="carousel-track" style={{ animationDuration: `${duration}ms` }}>
				{images.map((src, idx) => (
					<img src={src} alt={`nostalgia-${idx}`} key={idx} style={{ height }} />
				))}
				{images.map((src, idx) => (
					<img src={src} alt={`nostalgia-dup-${idx}`} key={`d-${idx}`} style={{ height }} />
				))}
			</div>
		</div>
	);
}

function MusicPlayer() {
	const audioRef = React.useRef(null);
	const [playing, setPlaying] = React.useState(false);
	const [volume, setVolume] = React.useState(0.7);

	React.useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume]);

	const toggle = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (playing) {
			audio.pause();
		} else {
			audio.play();
		}
		setPlaying(!playing);
	};

	const stop = () => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.pause();
		audio.currentTime = 0;
		setPlaying(false);
	};

	return (
		<div className="music-player card">
			<audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_2a4bcda3a8.mp3?filename=romantic-piano-loop-100-bpm-103518.mp3" preload="auto" />
			<div className="equalizer" aria-hidden>
				<span></span><span></span><span></span><span></span>
			</div>
			<button className="btn" onClick={toggle}>{playing ? '⏸ Пауза' : '▶️ Пуск'}</button>
			<button className="btn" onClick={stop}>⏹ Стоп</button>
			<input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
		</div>
	);
}

function Popup() {
	const [visible, setVisible] = React.useState(true);
	React.useEffect(() => {
		const t = setTimeout(() => setVisible(true), 2000);
		return () => clearTimeout(t);
	}, []);
	if (!visible) return null;
	return (
		<div className="popup">
			<div className="titlebar">
				<span>Важное системное сообщение</span>
				<span className="close" onClick={() => setVisible(false)}>X</span>
			</div>
			<div>Ваш компьютер слишком счастлив. Предлагается срочно явиться на свадьбу для балансировки кармы.</div>
		</div>
	);
}

function RSVPForm() {
	const [name, setName] = React.useState('');
	const [choice, setChoice] = React.useState('иду');
	const [msg, setMsg] = React.useState('');
	const [sent, setSent] = React.useState(false);

	const submit = (e) => {
		e.preventDefault();
		setSent(true);
	};

	if (sent) {
		return (
			<div className="card">
				<div className="title">Спасибо! ✅</div>
				<p>Ваш ответ принят. Наш модем уже отправил его по проводам! 📡</p>
			</div>
		);
	}

	return (
		<form className="card rsvp" onSubmit={submit}>
			<div className="title">RSVP (очень серьёзно)</div>
			<input placeholder="Ваше гордое имя" value={name} onChange={(e) => setName(e.target.value)} required />
			<select value={choice} onChange={(e) => setChoice(e.target.value)}>
				<option value="иду">Я иду! Возьму дискету</option>
				<option value="думаю">Думаю, модем занят</option>
				<option value="не могу">Не могу, танцую лезгинку</option>
			</select>
			<textarea placeholder="Пожелания, любимые салаты и размеры тарелок" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
			<button className="btn">Отправить по dial-up ✉️</button>
		</form>
	);
}

function Section({ title, children, ribbon }) {
	return (
		<section className="card">
			<div className="title">{title}</div>
			{ribbon && <div className="subtitle"><span className="ribbon">{ribbon}</span></div>}
			<div>{children}</div>
		</section>
	);
}

function CursorStars() {
	const [stars, setStars] = React.useState([]);
	React.useEffect(() => {
		const onMove = (e) => {
			const id = Math.random().toString(36).slice(2);
			const star = { id, x: e.clientX, y: e.clientY };
			setStars((prev) => [...prev.slice(-30), star]);
			setTimeout(() => {
				setStars((prev) => prev.filter((s) => s.id !== id));
			}, 800);
		};
		window.addEventListener('mousemove', onMove);
		return () => window.removeEventListener('mousemove', onMove);
	}, []);
	return (
		<div className="cursor-stars">
			{stars.map((s) => (
				<div key={s.id} className="cursor-star" style={{ left: s.x + 'px', top: s.y + 'px' }} />
			))}
		</div>
	);
}

function FallingStars() {
	const [stars, setStars] = React.useState([]);
	React.useEffect(() => {
		const interval = setInterval(() => {
			const id = Math.random().toString(36).slice(2);
			const x = Math.random() * window.innerWidth;
			const delay = Math.random() * 1500;
			const star = { id, x, delay };
			setStars((prev) => [...prev.slice(-40), star]);
			setTimeout(() => {
				setStars((prev) => prev.filter((s) => s.id !== id));
			}, 2400 + delay);
		}, 700);
		return () => clearInterval(interval);
	}, []);
	return (
		<div className="falling-stars">
			{stars.map((s) => (
				<div key={s.id} className="falling-star" style={{ left: s.x + 'px', top: '-10px', animationDelay: s.delay + 'ms' }} />
			))}
		</div>
	);
}

function App() {
	return (
		<React.Fragment>
			<div className="sparkles"></div>
			<CursorStars />
			<FallingStars />
			<HeaderMarquee />
			<div className="container">
				<Section title="Свадьба века: Денис ❤︎ ..." ribbon="Ты приглашён(а)!">
					<p>
						Добро пожаловать в наше ретро-приглашение! Здесь всё по канонам: <b>гифки, блёстки, маркуй</b> и лучший дизайн от племянника системного администратора.
						Пожалуйста, не выключайте компьютер во время загрузки любви.
					</p>
					<div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
						<Badge emoji="💿" text="Best of 2003" />
						<Badge emoji="🧃" text="Компот бесплатно" />
						<Badge emoji="🐈" text="Кот одобряет" />
					</div>
				</Section>

				<MusicPlayer />

				<Section title="Когда и где" ribbon="секретная локация раскрыта">
					<p><b>Дата:</b> 02.02.2026, 14:00 по московскому часу (по чайнику).</p>
					<p><b>Адрес:</b> Дом культуры "Романс и Пельмень", вход через ковёр.</p>
					<p>Кодовое слово на входе: <i>"ICQ 459-200-HEART"</i> ✨</p>
				</Section>

				<Section title="Галерея воспоминаний" ribbon="карусель завезли">
					<Carousel images={DUPLICATED_IMAGES} duration={35000} height={160} />
					<div style={{ height: 12 }}></div>
					<Carousel images={DUPLICATED_IMAGES} duration={28000} reverse height={180} />
					<div style={{ height: 12 }}></div>
					<Carousel images={DUPLICATED_IMAGES} duration={46000} height={200} />
					<div className="gallery-grid" style={{ marginTop: 12 }}>
						{DUPLICATED_IMAGES.map((src, i) => (
							<img key={i} src={src} alt={`grid-${i}`} />
						))}
					</div>
				</Section>

				<Section title="Программа" ribbon="без очереди">
					<ul>
						<li>14:00 — сбор гостей и настройка Wi‑Fi с паролем "123456"</li>
						<li>15:00 — торжественная церемония под рингтон Nokia</li>
						<li>16:00 — салаты, тосты, танцы под «Руки Вверх!»</li>
						<li>18:00 — фотосессия на фоне ковра</li>
						<li>20:00 — дискотека, конкурс «кто громче пищит модемом»</li>
					</ul>
				</Section>

				<Section title="Дресс-код" ribbon="шик и лампасы">
					<p>Стиль: Россия 90‑е/2000‑е. Кепки, лампасы, блёстки, барс и леопард. Допускается треники с туфлями — дизайнеры подтвердили.</p>
				</Section>

				<RSVPForm />

				<div className="footer">
					<p>Сделано с любовью и ICQ цветочками. Если что-то мигает — это счастье.</p>
					<p>© 2003—2026, все права защищены ковром.</p>
				</div>
			</div>
			<Popup />
		</React.Fragment>
	);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
