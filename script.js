class Planet {
    constructor(game) {
        this.game = game
        this.x = this.game.width * 0.5
        this.y = this.game.height * 0.5
        this.radius = 80
        this.image = document.getElementById('planet')
    }
    draw(c) {
        c.drawImage(this.image, this.x-100, this.y-100)
        if (this.game.debug) {
            c.beginPath()
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
            c.stroke()
        }
    }
}

class Player {
    constructor(game) {
        this.game = game
        this.x = this.game.width * 0.5
        this.y = this.game.height * 0.5
        this.radius = 40
        this.image = document.getElementById('player')
        this.aim
        this.angle = 0
    }
    draw(c) {
        c.save()
        c.translate(this.x, this.y)
        c.rotate(this.angle)
        c.drawImage(this.image, -this.radius, -this.radius)
        if (this.game.debug) {
            c.beginPath()
            c.arc(0, 0, this.radius, 0, Math.PI * 2)
            c.stroke()
        }
        c.restore()
    }
    update(c) {
        this.draw(c)
        this.aim = this.game.calcAim(this.game.planet, this.game.mouse)
        this.x = this.game.planet.x + (this.game.planet.radius + this.radius) * this.aim[0]
        this.y = this.game.planet.y + (this.game.planet.radius + this.radius) * this.aim[1]
        this.angle = Math.atan2(this.aim[3], this.aim[2])
    }
    shoot() {
        const projectile = this.game.getProjectile()
        if (projectile) {
            projectile.start(
                this.x + this.radius * this.aim[0], 
                this.y + this.radius * this.aim[1], 
                this.aim[0], this.aim[1]
            )
        }
    }
}

class Projectile {
    constructor(game) {
        this.game = game
        this.x
        this.y
        this.radius = 5
        this.speedX = 1
        this.speedY = 1
        this.speedModifier = 5
        this.free = true
    }
    start(x, y, speedX, speedY) {
        this.free = false
        this.x = x
        this.y = y
        this.speedX = speedX * this.speedModifier
        this.speedY = speedY * this.speedModifier
    }
    reset() {
        this.free = true
    }
    draw(c) {
        if (!this.free) {
            c.save()
            c.beginPath()
            c.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
            c.fillStyle = "gold"
            c.fill()
            c.restore()
        }
    }
    update(c) {
        this.draw(c)
        if (!this.free) {
            this.x += this.speedX
            this.y += this.speedY
        }
        // reset if outside the visible game area
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.reset()
        }
    }
}

class Enemy {
    constructor(game) {
        this.game = game
        this.x = 0
        this.y = 0
        this.radius = 40
        this.width = this.radius * 2
        this.height = this.radius * 2
        this.speedX = 0
        this.speedY = 
        this.speedModifier = Math.random() * 0.5 + 0.1
        this.angle = 0
        this.collided = false
        this.free = true
    }
    start() {
        this.free = false
        this.collided = false
        this.frameX = 0
        this.lives = this.maxLives
        this.frameY = Math.floor(Math.random() * 4)
        if (Math.random() < 0.5) {
            this.x = Math.random() * this.game.width
            this.y = Math.random() < 0.5 ? -this.radius : this.game.height + this.radius
        } else {
            this.x = Math.random() < 0.5 ? -this.radius : this.game.width + this.radius
            this.y = Math.random() * this.game.height
        }
        const aim = this.game.calcAim(this, this.game.planet)
        this.speedX = aim[0] * this.speedModifier
        this.speedY = aim[1] * this.speedModifier
        this.angle = Math.atan2(aim[3], aim[2]) + Math.PI * 0.5
    }
    reset() {
        this.free = true
    }
    hit(damage) {
        this.lives -= damage
        if (this.lives >= 1) this.frameX++  
    }
    draw(c) {
        if (!this.free) {
            c.save()
            c.translate(this.x, this.y)
            c.rotate(this.angle)
            c.drawImage(
                this.image, 
                this.frameX * this.width, 
                this.frameY * this.height, 
                this.width, this.height, 
                -this.radius, 
                - this.radius, 
                this.width, this.height
            )
            if (this.game.debug) {
                c.beginPath()
                c.arc(0, 0, this.radius, 0, Math.PI * 2)
                c.stroke()
                c.fillText(this.lives, 0, 0)
            }
            c.restore()
        }
    }
    update(c) {
        this.draw(c)
        if (!this.free) {
            this.x += this.speedX
            this.y += this.speedY
            // check collision enemy / planet
            if (this.game.checkCollision(this, this.game.planet) && this.lives >= 1) {
                this.lives = 0
                this.speedX = 0
                this.speedY = 0
                this.collided = true
                this.game.lives--
            }
            // check collision enemy / player
            if (this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
                this.lives = 0
                this.collided = true
                this.game.lives--
            }
            // check collision enemy / projectiles
            this.game.projectilePool.forEach(projectile => {
                if (!projectile.free && this.game.checkCollision(this, projectile) && this.lives >= 1) {
                    projectile.reset()
                    this.hit(1)
                } 
            })
            // sprite animation
            if (this.lives < 1 && this.game.spriteUpdate) {
                this.frameX++
            }
            if (this.frameX > this.maxFrame) {
                this.reset()
                if (!this.collided && !this.game.gameOver) this.game.score += this.maxLives
            }
        }
    }
}

class Asteroid extends Enemy {
    constructor(game) {
        super(game)
        this.image = document.getElementById('asteroid')
        this.frameX = 0
        this.frameY = Math.floor(Math.random() * 4)
        this.maxFrame = 7
        this.lives = 1
        this.maxLives = this.lives
    } 
}

class Lobstermorph extends Enemy {
    constructor(game) {
        super(game)
        this.image = document.getElementById('lobstermorph')
        this.frameX = 0
        this.frameY = Math.floor(Math.random() * 4)
        this.maxFrame = 14
        this.lives = 8
        this.maxLives = this.lives
    } 
}

class Beetlemorph extends Enemy {
    constructor(game) {
        super(game)
        this.image = document.getElementById('beetlemorph')
        this.frameX = 0
        this.frameY = Math.floor(Math.random() * 4)
        this.maxFrame = 3
        this.lives = 1
        this.maxLives = this.lives
    } 
}

class Rhinomorph extends Enemy {
    constructor(game) {
        super(game)
        this.image = document.getElementById('rhinomorph')
        this.frameX = 0
        this.frameY = Math.floor(Math.random() * 4)
        this.maxFrame = 6
        this.lives = 4
        this.maxLives = this.lives
    } 
}

class Game {
    constructor(canvas) {
        this.canvas = canvas
        this.width = this.canvas.width
        this.height = this.canvas.height
        this.planet = new Planet(this)
        this.player = new Player(this)
        this.debug = false

        this.projectilePool = []
        this.numberOfProjectiles = 20
        this.createProjectilePool()

        this.enemyPool = []
        this.numberOfEnemies = 20
        this.createEnemyPool()
        this.enemyPool[0].start()
        this.enemyTimer = 0
        this.enemyInterval = 1200

        this.spriteUpdate = false
        this.spriteTimer = 0
        this.spriteInterval = 150
        this.score = 0
        this.winningScore = 50
        this.lives = 10

        this.mouse = {
            x: 0,
            y: 0
        }

        // event listeners
        addEventListener('mousemove', e => {
            this.mouse.x = e.offsetX
            this.mouse.y = e.offsetY
        })
        addEventListener('mousedown', e => {
            this.mouse.x = e.offsetX
            this.mouse.y = e.offsetY
            this.player.shoot()
        })
        addEventListener('keyup', e => {
            if (e.key == 'd') this.debug = !this.debug
            else if (e.key == '1') this.player.shoot()
        })
    }
    render(c, d) {
        this.planet.draw(c)
        this.drawStatusText(c)
        this.player.update(c)
        this.projectilePool.forEach(projectile => {
            projectile.update(c)
        })
        this.enemyPool.forEach(enemy => {
            enemy.update(c)
        })
        // periodically activate an enemy
        if (!this.gameOver) {
            if (this.enemyTimer < this.enemyInterval) {
                this.enemyTimer += d
            } else {
                this.enemyTimer = 0
                const enemy = this.getEnemy()
                if (enemy) enemy.start()
            }
        }
        // periodically update sprites
        if (this.spriteTimer < this.spriteInterval) {
            this.spriteTimer += d
            this.spriteUpdate = false
        } else {
            this.spriteTimer = 0
            this.spriteUpdate = true
        }
        // win / lose condition
        if (this.score >= this.winningScore || this.lives < 1) {
            this.gameOver = true
        }
    }
    drawStatusText(c) {
        c.save()
        c.textAlign = 'left'
        c.font = '30px Impact'
        c.fillText('Score: ' + this.score, 20, 30)
        for (let i = 0; i < this.lives; i++) {
            c.fillRect(20 + 15 * i, 60, 10, 30)
        }
        if (this.gameOver) {
            c.textAlign = 'center'
            let mess1
            let mess2
            if (this.score >= this.winningScore) {
                mess1 = 'You WIN!'
                mess2 = 'Your Score is ' + this.score + '!'
            } else {
                mess1 = 'You LOST!'
                mess2 = 'Try Again!'
            }
            c.font = '100px Impact'
            c.fillText(mess1, this.width * 0.5, 200)
            c.font = '50px Impact'
            c.fillText(mess2, this.width * 0.5, 550)
        }
        c.restore()
    }
    calcAim(a, b) {
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.hypot(dx, dy)
        const aimX = dx / distance * -1
        const aimY = dy / distance * -1
        return [ aimX, aimY, dx, dy ]
    }
    checkCollision(a, b) {
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.hypot(dx, dy)
        const sumOfRadii = a.radius + b.radius
        return distance < sumOfRadii
    }
    createProjectilePool() {
        for (let i = 0; i < this.numberOfProjectiles; i++) {
            this.projectilePool.push(new Projectile(this))
        }
    }
    getProjectile() {
        for (let i = 0; i < this.projectilePool.length; i++) {
            if (this.projectilePool[i].free) return this.projectilePool[i]
        }
    }
    createEnemyPool() {
        for (let i = 0; i < this.numberOfEnemies; i++) {
            let randomNumber = Math.random()
            if (randomNumber < 0.25) {
                this.enemyPool.push(new Asteroid(this))
            } else if (randomNumber < 0.5){
                this.enemyPool.push(new Beetlemorph(this))
            } else if (randomNumber < 0.75){
                this.enemyPool.push(new Rhinomorph(this))
            } else {
                this.enemyPool.push(new Lobstermorph(this))
            }
        }
    }
    getEnemy() {
        for (let i = 0; i < this.enemyPool.length; i++) {
            if (this.enemyPool[i].free) return this.enemyPool[i]
        }
    }
}

addEventListener('load', function() {
    const canvas = document.getElementById('canvas1')
    const ctx = canvas.getContext('2d')
    canvas.width = 800
    canvas.height = 800
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'white'
    ctx.lineWidth = 2
    ctx.font = '40px Helvetica'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const game = new Game(canvas)

    let lastTime = 0
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime
        lastTime = timeStamp
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        game.render(ctx, deltaTime)
        requestAnimationFrame(animate)
    }
    animate()
})