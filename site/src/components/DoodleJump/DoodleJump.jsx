import React from 'react'
import styles from './DoodleJump.module.css'

const DEFAULT_WIDTH = 640
const DEFAULT_HEIGHT = 220

function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v))
}

// Stage themes cycling every 5000px
const STAGE_THEMES = [
	{ bg: '#f7f7ff', grid: 'rgba(0,0,0,0.06)', platform: '#2dd4bf', platformStroke: '#0f766e', enemy: '#ef4444', enemyStroke: '#991b1b' },
	{ bg: '#fff7ed', grid: 'rgba(0,0,0,0.06)', platform: '#f59e0b', platformStroke: '#b45309', enemy: '#1d4ed8', enemyStroke: '#1e3a8a' },
	{ bg: '#f0f9ff', grid: 'rgba(0,0,0,0.06)', platform: '#38bdf8', platformStroke: '#0369a1', enemy: '#f43f5e', enemyStroke: '#9f1239' },
	{ bg: '#fdf2f8', grid: 'rgba(0,0,0,0.06)', platform: '#f472b6', platformStroke: '#9d174d', enemy: '#10b981', enemyStroke: '#065f46' },
]

const STAGE_EMOJIS = ['🐸','🐼','🦄','🐲','👽','🦊','🐧']
const STAGE_ENEMY_EMOJIS = ['👾','🦇','👹','🛰️','🧟','🦈']

const TIPS_BY_THRESHOLD = {
	10000: 'В этой серии фильмов всего 5 частей, а 2 последние - на 1ю часть и 2ю часть',
	20000: 'Опечатка, вместо киноактер - киноперсонаж',
	30000: 'Круто! Секретное слово: Лазанья!',
	100000: 'Валентин'
}

export default function DoodleJump({ width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, emoji = '🧑\u200D🚀' }) {
	const canvasRef = React.useRef(null)
	const containerRef = React.useRef(null)
	const startedRef = React.useRef(false)
	const [started, setStarted] = React.useState(false)
	const [runId, setRunId] = React.useState(0)
	const [gameOver, setGameOver] = React.useState(false)
	const [tipsToShow, setTipsToShow] = React.useState([])
	const activateSlowRef = React.useRef(() => {})
	const heldEffectRef = React.useRef(null)
	const [heldEffectUI, setHeldEffectUI] = React.useState(null)
	const [unlockedThresholds, setUnlockedThresholds] = React.useState([])
	const [highScore, setHighScore] = React.useState(0)
	const highScoreRef = React.useRef(0)
    const [currency, setCurrency] = React.useState(0)
	const [shop, setShop] = React.useState({ shield: false, bomb: false, slow: false, boostLevel: 0, boostUnlimited: false })
	const [resetClicks, setResetClicks] = React.useState(0)
	const resetTimerRef = React.useRef(null)

	React.useEffect(() => {
		try {
			const raw = localStorage.getItem('dj_tips_unlocked')
			const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
			setUnlockedThresholds(arr)
		} catch {}
		try {
			const hs = parseInt(localStorage.getItem('dj_high_score') || '0', 10) || 0
			setHighScore(hs)
			highScoreRef.current = hs
		} catch {}
		try {
			const cur = parseInt(localStorage.getItem('dj_currency') || '0', 10) || 0
			setCurrency(cur)
		} catch {}
        try {
            const rawShop = localStorage.getItem('dj_shop')
            const s = rawShop ? JSON.parse(rawShop) : { shield:false, bomb:false, slow:false, boostLevel:0, boost:false, boostUnlimited:false }
            const boostLevel = Number(s.boostLevel || (s.boost ? 1 : 0) || 0)
            const boostUnlimited = !!s.boostUnlimited
            setShop({ shield: !!s.shield, bomb: !!s.bomb, slow: !!s.slow, boostLevel: Math.max(0, boostLevel), boostUnlimited })
        } catch {}
	}, [runId, started])

	React.useEffect(() => {
		highScoreRef.current = highScore
	}, [highScore])

	React.useEffect(() => {
		if (!started) return
		const canvas = canvasRef.current
		if (!canvas) return

		const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
		const ctx = canvas.getContext('2d')

		let viewWidth = width
		let viewHeight = height

		const resize = () => {
			const cw = containerRef.current?.clientWidth || width
			viewWidth = cw
			viewHeight = containerRef.current?.clientHeight || window.innerHeight || height
			canvas.width = Math.floor(viewWidth * dpr)
			canvas.height = Math.floor(viewHeight * dpr)
			canvas.style.width = viewWidth + 'px'
			canvas.style.height = viewHeight + 'px'
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
		}

		resize()
		window.addEventListener('resize', resize)

		// Game state
		const gravity = 0.06
		const jumpVelocity = -4.5
		const moveSpeed = 3.2

		const player = {
			x: viewWidth * 0.5,
			y: viewHeight - 40,
			vx: 0,
			vy: 0,
			r: 14,
		}

		const keys = { left: false, right: false }

		const handleKey = (e, down) => {
			if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = down
			if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = down
		}

		const onKeyDown = (e) => handleKey(e, true)
		const onKeyUp = (e) => handleKey(e, false)
		window.addEventListener('keydown', onKeyDown)
		window.addEventListener('keyup', onKeyUp)

		// Touch controls
		const prevent = (e) => { e.preventDefault() }
		const leftZone = containerRef.current?.querySelector('[data-btn="left"]')
		const rightZone = containerRef.current?.querySelector('[data-btn="right"]')
		const onLeftDown = (e) => { keys.left = true; keys.right = false; e.preventDefault() }
		const onLeftUp = (e) => { keys.left = false; e.preventDefault() }
		const onRightDown = (e) => { keys.right = true; keys.left = false; e.preventDefault() }
		const onRightUp = (e) => { keys.right = false; e.preventDefault() }
		leftZone?.addEventListener('touchstart', onLeftDown, { passive: false })
		leftZone?.addEventListener('touchend', onLeftUp, { passive: false })
		leftZone?.addEventListener('touchcancel', onLeftUp, { passive: false })
		rightZone?.addEventListener('touchstart', onRightDown, { passive: false })
		rightZone?.addEventListener('touchend', onRightUp, { passive: false })
		rightZone?.addEventListener('touchcancel', onRightUp, { passive: false })

		// provide slow activation to JSX button via ref
		activateSlowRef.current = () => { if (heldEffectRef.current === 'slow') { slowMs = 3000; heldEffectRef.current = null; setHeldEffectUI(null) } }
		containerRef.current?.addEventListener('touchmove', prevent, { passive: false })

		// Platforms
		const platforms = []
		let platformMinWidth = 56
		let platformMaxWidth = 120
		const platformHeight = 8
		// Camera Y must be available for gap computation below
		let cameraY = 0

		// Enemies (increasing difficulty every 1000px)
		const enemies = []
		let lastSpawnTier = -1

		// Stage / effects & bonuses
		let lastStageTier = -1
		let shieldMs = 0
		let slowMs = 0
		let explosionMs = 0
		let endTriggered = false

		// Powerups
		const powerups = [] // {x,y,w,h,type:'shield'|'bomb'|'slow'}

		function stageForClimb(px) { return Math.floor(Math.max(0, px) / 5000) }

		function desiredEnemyCountForTier(tier) {
			// Base enemies grow with 1000-tier within a 5k stage, but reset each 5k
			const stage = stageForClimb(-cameraY)
			const withinStageTier = Math.floor(Math.max(0, -cameraY - stage * 5000) / 1000)
			return Math.min(Math.max(0, withinStageTier), 6)
		}

		function spawnEnemy() {
			const stage = stageForClimb(-cameraY)
			const kind = stage % 4 // rotate behaviors
			const baseTier = Math.floor(Math.max(0, -cameraY) / 1000)
			const speed = 0.6 + baseTier * 0.2
			let x = 0, y = 0, vx = 0, vy = 0, w = 20, h = 20, meta = {}
			switch (kind) {
				case 0: {
					// Classic falling drones, small
					w = h = 18 + Math.random() * 8
					const fromTop = Math.random() < 0.5
					y = fromTop ? cameraY - (120 + Math.random() * 220) : cameraY + viewHeight + (120 + Math.random() * 220)
					x = Math.random() * Math.max(1, viewWidth - w)
					vy = fromTop ? (0.35 + baseTier * 0.1) : -(0.35 + baseTier * 0.1)
					vx = (Math.random() < 0.5 ? -1 : 1) * speed
					break
				}
				case 1: {
					// Horizontal zig-zag: большие, тяжелые
					w = h = 28 + Math.random() * 10
					y = cameraY - (60 + Math.random() * 120)
					x = Math.random() < 0.5 ? -w - 8 : viewWidth + 8
					vx = x < 0 ? speed * 1.2 : -speed * 1.2
					vy = 0
					meta = { zigAmp: 18 + Math.random() * 18, zigPhase: Math.random() * Math.PI * 2 }
					break
				}
				case 2: {
					// Homing floaters: медленные, слегка преследуют по X
					w = h = 22
					y = cameraY - (140 + Math.random() * 300)
					x = Math.random() * Math.max(1, viewWidth - w)
					vy = 0.25 + baseTier * 0.08
					vx = 0
					meta = { homing: 0.02 + baseTier * 0.002 }
					break
				}
				default: {
					// Bouncers: прыгают по вертикали волнами
					w = h = 20
					x = Math.random() * Math.max(1, viewWidth - w)
					y = cameraY + viewHeight + (120 + Math.random() * 180)
					vy = -(0.6 + baseTier * 0.1)
					vx = (Math.random() < 0.5 ? -1 : 1) * (speed * 0.7)
					meta = { bounce: 0.96 }
				}
			}
			enemies.push({ x, y, w, h, vx, vy, meta, kind })
		}

		function ensureEnemies() {
			const tier = Math.floor(Math.max(0, -cameraY) / 1000)
			if (tier !== lastSpawnTier) {
				lastSpawnTier = tier
				const want = desiredEnemyCountForTier(tier)
				while (enemies.length < want) spawnEnemy()
				if (enemies.length > want) enemies.length = want
			}
		}

		function getMaxReachPx() {
			// Maximum upward travel for current physics (s = v^2 / (2g))
			const v = Math.abs(jumpVelocity)
			return (v * v) / (2 * gravity)
		}

		function getTargetGap() {
			// Base gap from current physics
			const reach = getMaxReachPx()
			const baseGap = clamp(reach * 0.55, 22, 90)
			// Tiered difficulty: every 1000px climbed density drops significantly
			const climbed = Math.max(0, -cameraY)
			const tier = Math.floor(climbed / 1000)
			const tierScale = Math.min(Math.pow(1.6, tier), 4.0)
			// Never exceed safe fraction of the actual max reach so platforms remain reachable
			const proposed = baseGap * tierScale
			const safeCap = reach * 0.8
			return Math.min(proposed, safeCap)
		}

		function recomputePlatformWidthRange() {
			// Keep widths proportional to screen width so difficulty stays similar on phones
			// Make platforms a bit smaller: 14%..26% of view width
			const minByPercent = viewWidth * 0.14
			const maxByPercent = viewWidth * 0.26
			platformMinWidth = clamp(minByPercent, 36, 90)
			platformMaxWidth = clamp(maxByPercent, 64, 140)
			if (platformMaxWidth < platformMinWidth + 24) platformMaxWidth = platformMinWidth + 24
		}

		recomputePlatformWidthRange()

		function resetPlatforms() {
			platforms.length = 0
			let y = viewHeight - 20
			while (y > -viewHeight * 2) {
				const w = platformMinWidth + Math.random() * (platformMaxWidth - platformMinWidth)
				const x = Math.random() * (viewWidth - w)
                const boostedChance = shop.boostLevel > 0 ? Math.min(0.01 + shop.boostLevel * 0.005, 0.06) : 0.0
                const boosted = Math.random() < boostedChance
				platforms.push({ x, y, w, h: platformHeight, boosted })
				const gap = getTargetGap()
				y -= gap + Math.random() * (gap * 0.3)
				// chance to place powerup on platform
				if (Math.random() < 0.03) {
					const r = Math.random()
					const candidates = [shop.shield && 'shield', shop.bomb && 'bomb', shop.slow && 'slow'].filter(Boolean)
					if (candidates.length) {
						const type = candidates[Math.floor(Math.random() * candidates.length)]
					const px = x + 8 + Math.random() * Math.max(2, w - 16)
					powerups.push({ x: px, y: y + gap - 10, w: 14, h: 14, type })
					}
				}
			}
		}

		function placePlayerOnPlatform() {
			// Найти самую нижнюю видимую платформу и поставить игрока на неё
			let best = null
			for (let i = 0; i < platforms.length; i++) {
				const p = platforms[i]
				if (p.y <= viewHeight - 8) {
					if (!best || p.y > best.y) best = p
				}
			}
			if (!best && platforms.length) best = platforms[0]
			if (best) {
				const margin = 6
				const minX = best.x + margin
				const maxX = best.x + best.w - margin
				player.x = clamp(viewWidth * 0.5, minX, maxX)
				player.y = best.y - player.r
				player.vx = 0
				player.vy = 0
			}
		}

		resetPlatforms()
		placePlayerOnPlatform()

		let running = true
		let lastTs = 0
		let bestScore = 0
		let trollTriggered = false
		let trollMs = 0
		let shakeMs = 0
		let lastTrollBurst = 0

		function sampleBoostMultiplier() {
			const p = Math.random()
			if (p < 0.05) return 4
			const q = Math.pow(Math.random(), 1.8) // bias к меньшим значениям
			return 1.5 + q * (3.5 - 1.5)
		}

		function update(dt) {
			// Controls (support troll inverted)
			const inverted = trollMs > 0
			const wantLeft = inverted ? keys.right : keys.left
			const wantRight = inverted ? keys.left : keys.right
			const moveVX = (wantLeft ? -moveSpeed : 0) + (wantRight ? moveSpeed : 0)
			player.vx = moveVX
			player.x += player.vx
			player.vy += gravity * (trollMs > 0 ? 1.25 : 1)
			player.y += player.vy

			// Wrap horizontally
			if (player.x < -20) player.x = viewWidth + 20
			if (player.x > viewWidth + 20) player.x = -20

			// Collisions (only when falling)
			if (player.vy > 0) {
				for (let i = 0; i < platforms.length; i++) {
					const p = platforms[i]
					if (
						player.x > p.x - 10 &&
						player.x < p.x + p.w + 10 &&
						player.y + player.r > p.y - 6 &&
						player.y + player.r < p.y + 6
					) {
						if (p.boosted) {
							const mult = sampleBoostMultiplier()
							player.vy = jumpVelocity * mult
							shieldMs = Math.max(shieldMs, 2000)
						} else {
							player.vy = jumpVelocity
						}
						break
					}
				}
			}

			// Camera follows upward progression
			cameraY = Math.min(cameraY, player.y - viewHeight * 0.45)
			bestScore = Math.min(bestScore, cameraY)

			// Effects progression (every 5000)
			const climbedNow = Math.max(0, -cameraY)
			const stageTier = Math.floor(climbedNow / 5000)
			if (stageTier > lastStageTier) {
				lastStageTier = stageTier
				// grant short shield upon stage change
				shieldMs = Math.max(shieldMs, 3000)
			}

			// TROLL event when reaching 40k (temporary; was 100k)
			if (!trollTriggered && climbedNow >= 100000) {
				trollTriggered = true
				trollMs = 6000
				shakeMs = 6000
				explosionMs = 600
                // immediate enemy burst
                for (let i = 0; i < 12; i++) spawnEnemy()
                // unlock unlimited boost purchases and notify in-game
                try {
                    const rawShop = localStorage.getItem('dj_shop')
                    const s = rawShop ? JSON.parse(rawShop) : {}
                    s.boostUnlimited = true
                    localStorage.setItem('dj_shop', JSON.stringify(s))
                } catch {}
                try { setShop((prev) => ({ ...prev, boostUnlimited: true })) } catch {}
                // in-game toast: show centered banner for a few seconds
                toastText = '⚡ Теперь буст‑платформы можно прокачивать без лимита!'
                toastMs = 4500
			}

			// Recycle platforms when they go below the view
			for (let i = 0; i < platforms.length; i++) {
				const p = platforms[i]
				if (p.y - cameraY > viewHeight + 20) {
					// Move to top
					const gap = getTargetGap()
					p.y -= viewHeight + gap + Math.random() * (gap * 0.3)
					// width should respect current screen width
					recomputePlatformWidthRange()
					p.w = platformMinWidth + Math.random() * (platformMaxWidth - platformMinWidth)
					p.x = Math.random() * (viewWidth - p.w)
                    p.boosted = Math.random() < (shop.boostLevel > 0 ? Math.min(0.01 + shop.boostLevel * 0.005, 0.06) : 0.0)
					// small chance to add powerup on recycled platform
					if (Math.random() < 0.025) {
						const r = Math.random()
						const candidates = [shop.shield && 'shield', shop.bomb && 'bomb', shop.slow && 'slow'].filter(Boolean)
						if (candidates.length) {
							const type = candidates[Math.floor(Math.random() * candidates.length)]
						const px = p.x + 8 + Math.random() * Math.max(2, p.w - 16)
						powerups.push({ x: px, y: p.y - 10, w: 14, h: 14, type })
						}
					}
				}
			}

			// Platform jitter during troll
			if (trollMs > 0) {
				for (let i = 0; i < platforms.length; i++) {
					const p = platforms[i]
					p.x = clamp(p.x + (Math.random() - 0.5) * 2.0, 0, Math.max(0, viewWidth - p.w))
				}
			}

			// Enemies: spawn/ensure per tier, move, bounce, recycle
			ensureEnemies()
			// Troll burst spawns
			if (trollMs > 0) {
				lastTrollBurst += dt
				if (enemies.length < 40 && lastTrollBurst > 180) {
					for (let i = 0; i < 8; i++) spawnEnemy()
					lastTrollBurst = 0
				}
			}
			const isSlowed = slowMs > 0
			for (let i = 0; i < enemies.length; i++) {
				const e = enemies[i]
				// Behavior by kind (paused while slow is active)
				if (!isSlowed && e.kind === 1 && e.meta) {
					// zig-zag по синусу
					const t = lastTs * 0.005 + e.meta.zigPhase
					e.y += Math.sin(t) * (e.meta.zigAmp * 0.2)
				}
				if (!isSlowed && e.kind === 2 && e.meta) {
					// лёгкое наведение по X
					const toPlayer = player.x - (e.x + e.w / 2)
					e.vx += clamp(toPlayer * e.meta.homing, -0.25, 0.25)
					e.vx = clamp(e.vx, -1.6, 1.6)
				}
				if (!isSlowed) {
					e.x += e.vx
					e.y += e.vy
				}
				// Границы: отражать только при движении изнутри наружу,
				// а при входе снаружи оставить направление внутрь
				if (e.x < 0) {
					e.x = 0
					if (e.vx < 0) e.vx = -e.vx
				}
				if (e.x + e.w > viewWidth) {
					e.x = viewWidth - e.w
					if (e.vx > 0) e.vx = -e.vx
				}
				// recycle when far outside view (top/bottom)
				if (e.y - cameraY < -160 || e.y - cameraY > viewHeight + 160) {
					// re-spawn offscreen vertically
					const stage = stageForClimb(-cameraY)
					const fromTop = Math.random() < 0.5
					e.y = fromTop ? cameraY - (120 + Math.random() * 240) : cameraY + viewHeight + (120 + Math.random() * 240)
					e.x = Math.random() * Math.max(1, viewWidth - e.w)
					if (e.kind === 0) e.vy = fromTop ? (0.35) : -(0.35)
					if (e.kind === 3) e.vy = fromTop ? (0.6) : -(0.6)
				}
			}

			// Powerups update and pickups
			for (let i = powerups.length - 1; i >= 0; i--) {
				const pu = powerups[i]
				// remove if far below
				if (pu.y - cameraY > viewHeight + 40) { powerups.splice(i, 1); continue }
				// pickup check (circle vs rect)
				const cx = clamp(player.x, pu.x, pu.x + pu.w)
				const cy = clamp(player.y, pu.y, pu.y + pu.h)
				const dx = player.x - cx
				const dy = player.y - cy
				if (dx * dx + dy * dy <= player.r * player.r) {
					if (pu.type === 'shield' || pu.type === 'bomb' || pu.type === 'slow') {
						// держим только один эффект — новый заменяет старый
						heldEffectRef.current = pu.type
						setHeldEffectUI(heldEffectRef.current)
					}
					powerups.splice(i, 1)
				}
			}

			// Tick effects timers
			shieldMs = Math.max(0, shieldMs - dt)
			slowMs = Math.max(0, slowMs - dt)
			explosionMs = Math.max(0, explosionMs - dt)
			trollMs = Math.max(0, trollMs - dt)
			shakeMs = Math.max(0, shakeMs - dt)

			// Enemy collisions
			for (let i = 0; i < enemies.length; i++) {
				const e = enemies[i]
				const cx = clamp(player.x, e.x, e.x + e.w)
				const cy = clamp(player.y, e.y, e.y + e.h)
				const dx = player.x - cx
				const dy = (player.y) - cy
				const dist2 = dx * dx + dy * dy
				if (dist2 <= player.r * player.r) {
					// If coming from above, bounce; otherwise, reset run (fail)
					if (player.vy > 0 && player.y < e.y) {
						player.vy = jumpVelocity
					} else {
						// Активация удерживаемого эффекта при столкновении
					if (heldEffectRef.current === 'bomb') {
							// взрыв
							enemies.length = 0
						heldEffectRef.current = null
						setHeldEffectUI(null)
							explosionMs = 400
							player.vy = jumpVelocity
							continue
						}
						if (shieldMs > 0) { player.vy = jumpVelocity; continue }
					if (heldEffectRef.current === 'shield') {
							shieldMs = 3000
						heldEffectRef.current = null
						setHeldEffectUI(null)
							player.vy = jumpVelocity
							continue
						}
						endRun()
						break
					}
				}
			}

			function endRun() {
				if (endTriggered) return
				endTriggered = true
				running = false
				// Compute score and unlock tips
				const climbed = Math.round(Math.max(0, -bestScore))
				// add currency = climbed
				try {
					const cur = parseInt(localStorage.getItem('dj_currency') || '0', 10) || 0
					const next = cur + climbed
					localStorage.setItem('dj_currency', String(next))
					setCurrency(next)
				} catch {}
				// high score update
				if (climbed > highScoreRef.current) {
					try { localStorage.setItem('dj_high_score', String(climbed)) } catch {}
					setHighScore(climbed)
				}
				const thresholds = [10000, 20000, 30000]
				let unlocked = []
				try {
					const raw = localStorage.getItem('dj_tips_unlocked')
					unlocked = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []
				} catch { unlocked = [] }
				const newly = []
				for (let i = 0; i < thresholds.length; i++) {
					const th = thresholds[i]
					if (climbed >= th && !unlocked.includes(th)) newly.push(th)
				}
				if (newly.length) {
					const next = Array.from(new Set(unlocked.concat(newly)))
					try { localStorage.setItem('dj_tips_unlocked', JSON.stringify(next)) } catch {}
					const all = next.map((t) => TIPS_BY_THRESHOLD[t]).filter(Boolean)
					setUnlockedThresholds(next)
					setTipsToShow(all)
				} else {
					const all = unlocked.map((t) => TIPS_BY_THRESHOLD[t]).filter(Boolean)
					setTipsToShow(all)
				}
				// Show thresholds info on game over
				// Append small line telling when next tips unlock
				const nextThreshold = thresholds.find((t) => climbed < t)
				if (nextThreshold) {
					setTipsToShow((prev) => prev.concat([`Следующая подсказка откроется на ${nextThreshold / 1000}k.`]))
				}
				setGameOver(true)
			}

			// Reset if fell below
			if (player.y - cameraY > viewHeight + 60) {
				endRun()
			}
		}

		function draw() {
			ctx.clearRect(0, 0, viewWidth, viewHeight)
			// Screen shake during troll
			if (shakeMs > 0) {
				const amp = Math.min(12, 4 + (shakeMs / 1000) * 4)
				const ox = (Math.random() - 0.5) * amp
				const oy = (Math.random() - 0.5) * amp
				ctx.save()
				ctx.translate(ox, oy)
				// draw below...
				var withShake = true
			} else {
				var withShake = false
			}

			// Theme by stage
			const stageTier = Math.floor(Math.max(0, -cameraY) / 5000)
			const theme = STAGE_THEMES[stageTier % STAGE_THEMES.length]
			const stageEmoji = STAGE_EMOJIS[stageTier % STAGE_EMOJIS.length] || emoji

			// Background grid
			ctx.fillStyle = theme.bg
			ctx.fillRect(0, 0, viewWidth, viewHeight)
			ctx.strokeStyle = theme.grid
			ctx.lineWidth = 1
			for (let y = -((cameraY % 20) + 20); y < viewHeight; y += 20) {
				ctx.beginPath()
				ctx.moveTo(0, y)
				ctx.lineTo(viewWidth, y)
				ctx.stroke()
			}

			// Platforms
			ctx.fillStyle = theme.platform
			ctx.strokeStyle = theme.platformStroke
			for (let i = 0; i < platforms.length; i++) {
				const p = platforms[i]
				const py = p.y - cameraY
				if (py < -20 || py > viewHeight + 20) continue
				if (p.boosted) {
					// визуально выделим буст-платформы
					ctx.save()
					ctx.fillStyle = '#a3e635'
					ctx.strokeStyle = '#4d7c0f'
					ctx.fillRect(p.x, py, p.w, p.h)
					ctx.strokeRect(p.x + 0.5, py + 0.5, p.w - 1, p.h - 1)
					ctx.restore()
				} else {
					ctx.fillRect(p.x, py, p.w, p.h)
					ctx.strokeRect(p.x + 0.5, py + 0.5, p.w - 1, p.h - 1)
				}
			}

			// Enemies
			ctx.fillStyle = theme.enemy
			ctx.strokeStyle = theme.enemyStroke
			for (let i = 0; i < enemies.length; i++) {
				const e = enemies[i]
				const ey = e.y - cameraY
				if (ey < -30 || ey > viewHeight + 30) continue
				ctx.fillRect(e.x, ey, e.w, e.h)
				ctx.strokeRect(e.x + 0.5, ey + 0.5, e.w - 1, e.h - 1)
				// optional emoji overlay
				ctx.font = '16px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'middle'
				const enemyEmoji = STAGE_ENEMY_EMOJIS[stageTier % STAGE_ENEMY_EMOJIS.length] || '👾'
				ctx.fillText(enemyEmoji, e.x + e.w / 2, ey + e.h / 2)
			}

			// Powerups
			for (let i = 0; i < powerups.length; i++) {
				const p = powerups[i]
				const py = p.y - cameraY
				if (py < -20 || py > viewHeight + 20) continue
				ctx.font = '16px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'middle'
				const icon = p.type === 'shield' ? '🛡️' : (p.type === 'bomb' ? '💣' : '⏳')
				ctx.fillText(icon, p.x + p.w / 2, py + p.h / 2)
			}

			// Player (emoji)
			ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
			ctx.textAlign = 'center'
			ctx.textBaseline = 'middle'
			ctx.save()
			ctx.translate(clamp(player.x, -50, viewWidth + 50), player.y - cameraY)
			ctx.rotate(clamp(player.vx, -3, 3) * 0.05)
			ctx.fillText(stageEmoji, 0, 0)
			// Shield indicator on emoji
			if (shieldMs > 0 || heldEffectRef.current === 'shield') {
				ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
				ctx.fillText('🛡️', 14, -14)
			}
			ctx.restore()

			// HUD with background pills to prevent overflow
			const score = Math.round(Math.max(0, -bestScore))
			const pad = 6
			const pillH = 24
			// Left pill: score
			ctx.font = 'bold 16px ui-monospace, SFMono-Regular, Menlo, monospace'
			let text = `↑ ${score} м`
			let tw = ctx.measureText(text).width
			ctx.fillStyle = 'rgba(255,255,255,0.85)'
			ctx.strokeStyle = 'rgba(0,0,0,0.15)'
			ctx.lineWidth = 1
			ctx.fillRect(6, 6, tw + pad * 2, pillH)
			ctx.strokeRect(6 + 0.5, 6 + 0.5, tw + pad * 2 - 1, pillH - 1)
			ctx.fillStyle = '#111'
			ctx.textAlign = 'left'
			ctx.textBaseline = 'middle'
			ctx.fillText(text, 6 + pad, 6 + pillH / 2)
			// Item slot (shows active shield OR held shield/bomb when inactive)
			{
				const sx = 12 + tw + pad * 2
				const sw = 34
				let slotIcon = null
				if (shieldMs > 0) slotIcon = '🛡️'
				else if (heldEffectRef.current === 'shield') slotIcon = '🛡️'
				else if (heldEffectRef.current === 'bomb') slotIcon = '💣'
				if (slotIcon) {
					ctx.fillStyle = 'rgba(255,255,255,0.9)'
					ctx.strokeStyle = 'rgba(0,0,0,0.15)'
					ctx.fillRect(sx, 6, sw, pillH)
					ctx.strokeRect(sx + 0.5, 6 + 0.5, sw - 1, pillH - 1)
					ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
					ctx.textAlign = 'center'
					ctx.fillStyle = '#111'
					ctx.fillText(slotIcon, sx + sw / 2, 6 + pillH / 2)
				}
			}

			// Right pill: controls + held effect indicator
			text = '← A / D →'
			tw = ctx.measureText(text).width
			const rx = Math.max(6, viewWidth - (tw + pad * 2) - 6)
			ctx.fillStyle = 'rgba(255,255,255,0.85)'
			ctx.strokeStyle = 'rgba(0,0,0,0.15)'
			ctx.fillRect(rx, 6, tw + pad * 2, pillH)
			ctx.strokeRect(rx + 0.5, 6 + 0.5, tw + pad * 2 - 1, pillH - 1)
			ctx.fillStyle = '#111'
			ctx.textAlign = 'left'
			ctx.fillText(text, rx + pad, 6 + pillH / 2)
			// heldEffect icon is now shown in the left slot; no separate icon here

			// Explosion flash
			if (explosionMs > 0 || trollMs > 0) {
				const alpha = Math.min(0.6, explosionMs / 400)
				ctx.fillStyle = `rgba(255,200,0,${alpha})`
				ctx.fillRect(0, 0, viewWidth, viewHeight)
			}
			if (withShake) ctx.restore()

			// Toast
			if (typeof toastMs !== 'undefined' && toastMs > 0) {
				const msg = toastText || ''
				if (msg) {
					ctx.font = 'bold 14px ui-monospace, SFMono-Regular, Menlo, monospace'
					const padX = 10, padY = 6
					const tw = ctx.measureText(msg).width
					const bx = (viewWidth - (tw + padX * 2)) / 2
					const by = 24
					ctx.fillStyle = 'rgba(255,255,255,0.95)'
					ctx.strokeStyle = 'rgba(0,0,0,0.2)'
					ctx.fillRect(bx, by, tw + padX * 2, 28)
					ctx.strokeRect(bx + 0.5, by + 0.5, tw + padX * 2 - 1, 27)
					ctx.fillStyle = '#111'
					ctx.textAlign = 'left'
					ctx.textBaseline = 'middle'
					ctx.fillText(msg, bx + padX, by + 14)
				}
			}
		}

		function frame(ts) {
			if (!running) return
			const dt = Math.min(33, ts - lastTs)
			lastTs = ts
			update(dt)
			draw()
			requestAnimationFrame(frame)
		}

		requestAnimationFrame(frame)

		return () => {
			running = false
			window.removeEventListener('resize', resize)
			window.removeEventListener('keydown', onKeyDown)
			window.removeEventListener('keyup', onKeyUp)
			leftZone?.removeEventListener('touchstart', onLeftDown)
			leftZone?.removeEventListener('touchend', onLeftUp)
			leftZone?.removeEventListener('touchcancel', onLeftUp)
			rightZone?.removeEventListener('touchstart', onRightDown)
			rightZone?.removeEventListener('touchend', onRightUp)
			rightZone?.removeEventListener('touchcancel', onRightUp)
			containerRef.current?.removeEventListener('touchmove', prevent)
		}
	}, [width, height, emoji, started])

	const handleStart = async () => {
		if (startedRef.current) return
		startedRef.current = true
		const el = containerRef.current
		try {
			if (el && el.requestFullscreen) {
				await el.requestFullscreen()
			}
		} catch {}
		setStarted(true)
	}

	return (
		<div
			ref={containerRef}
			className={started ? `${styles.wrapper} ${styles.fullscreen}` : styles.wrapper}
			style={{ height: started ? '100vh' : height }}
		>
			<canvas ref={canvasRef} className={styles.canvas} />
			{!started && (
				<div className={styles.overlay}>
					<div style={{ display:'grid', gap:8, placeItems:'center' }}>
						{highScore > 0 && (
							<div style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:14 }}>
								Рекорд: {highScore} м
							</div>
						)}
						{unlockedThresholds.length > 0 && (
							<div style={{ maxWidth:560 }}>
								<div className={styles.tipsTitle}>Открытые подсказки</div>
								<ul className={styles.tipsList}>
									{unlockedThresholds.map((t) => (
										<li key={t}>{TIPS_BY_THRESHOLD[t]}</li>
									))}
								</ul>
							</div>
						)}
						<button className={styles.startBtn} onClick={handleStart}>Играть</button>
						<div className={styles.hint}>Наклоняйся стрелками или кнопками снизу</div>
					</div>
				</div>
			)}
			{started && (
				<div className={styles.controls}>
					<button className={styles.btn} data-btn="left">←</button>
					<button className={`${styles.btn} ${styles.btnSmall}`} onClick={() => activateSlowRef.current()} disabled={heldEffectUI !== 'slow'}>⏳</button>
					<button className={styles.btn} data-btn="right">→</button>
				</div>
			)}
			{gameOver && (
				<div className={styles.tipsOverlay}>
					<div className={styles.tipsCard}>
						<div className={styles.tipsTitle}>Магазин и подсказки</div>
						<div style={{ display:'grid', gap:10 }}>
							<div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
							<div style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:14 }}>💎 {currency}</div>
							</div>
							<div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
								<button className={styles.startBtn} disabled={shop.shield} onClick={() => {
								const cost = 10000; if (shop.shield || currency < cost) return
								const next = currency - cost; setCurrency(next); try { localStorage.setItem('dj_currency', String(next)) } catch {}
								const ns = { ...shop, shield: true }; setShop(ns); try { localStorage.setItem('dj_shop', JSON.stringify(ns)) } catch {}
							}}>🛡️ 10k</button>
								<button className={styles.startBtn} disabled={shop.bomb} onClick={() => {
								const cost = 10000; if (shop.bomb || currency < cost) return
								const next = currency - cost; setCurrency(next); try { localStorage.setItem('dj_currency', String(next)) } catch {}
								const ns = { ...shop, bomb: true }; setShop(ns); try { localStorage.setItem('dj_shop', JSON.stringify(ns)) } catch {}
							}}>💣 10k</button>
								<button className={styles.startBtn} disabled={shop.slow} onClick={() => {
								const cost = 10000; if (shop.slow || currency < cost) return
								const next = currency - cost; setCurrency(next); try { localStorage.setItem('dj_currency', String(next)) } catch {}
								const ns = { ...shop, slow: true }; setShop(ns); try { localStorage.setItem('dj_shop', JSON.stringify(ns)) } catch {}
							}}>⏳ 10k</button>
                            <button className={styles.startBtn} disabled={!shop.boostUnlimited && shop.boostLevel >= 10} onClick={() => {
                            const cost = 10000; if ((!shop.boostUnlimited && shop.boostLevel >= 10) || currency < cost) return
                            const next = currency - cost; setCurrency(next); try { localStorage.setItem('dj_currency', String(next)) } catch {}
                            const ns = { ...shop, boostLevel: Math.min(10, (shop.boostLevel || 0) + 1) }; setShop(ns); try { localStorage.setItem('dj_shop', JSON.stringify(ns)) } catch {}
                        }}>⚡ 10k (буст‑платформы {shop.boostLevel}/10)</button>
                            </div>
                            <div style={{ fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:12, opacity:.8, textAlign:'center' }}>
                                Шанс буст‑платформ: {Math.round((shop.boostLevel > 0 ? Math.min(0.01 + shop.boostLevel * 0.005, 0.06) : 0) * 100)}%
                                {shop.boostUnlimited ? ' (без лимита)' : ''}
                            </div>
                            
						</div>
                        <div style={{ position:'relative', height:40, marginTop:8 }}>
                            <button className={styles.startBtn} style={{ position:'absolute', left:0, bottom:0, padding:'6px 10px', fontSize:12, background:'#ffecec' }} onClick={() => {
                                if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
                                setResetClicks((c) => {
                                    const n = c + 1
                                    if (n >= 5) {
                                        try {
                                            localStorage.removeItem('dj_currency')
                                            localStorage.removeItem('dj_shop')
                                            localStorage.removeItem('dj_high_score')
                                            localStorage.removeItem('dj_tips_unlocked')
                                        } catch {}
                                        setCurrency(0)
                                        setShop({ shield:false, bomb:false, slow:false, boostLevel:0, boostUnlimited:false })
                                        setHighScore(0)
                                        setUnlockedThresholds([])
                                        setTipsToShow([])
                                        return 0
                                    }
                                    resetTimerRef.current = setTimeout(() => setResetClicks(0), 1500)
                                    return n
                                })
                            }}>сброс</button>
                            <div className={styles.tipsActions} style={{ position:'absolute', right:0, bottom:0, marginTop:0 }}>
                                <button className={styles.startBtn} onClick={() => { setGameOver(false); setStarted(false); setRunId((v) => v + 1); startedRef.current = false }}>Играть</button>
                            </div>
                        </div>
						{tipsToShow.length ? (
							<ul className={styles.tipsList}>
								{tipsToShow.map((t, i) => (
									<li key={i}>{t}</li>
								))}
							</ul>
						) : (
							<div style={{ fontSize: 14 }}>Новых подсказок нет. Попробуй подняться выше!</div>
						)}
                        
					</div>
				</div>
			)}
		</div>
	)
}


