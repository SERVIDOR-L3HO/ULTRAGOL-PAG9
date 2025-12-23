// ULTRAJUMPER - Offline Game
class OfflineGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;
        
        // Game variables
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            radius: 12,
            velocityY: 0,
            velocityX: 0,
            gravity: 0.5,
            jumpPower: -15,
            maxVelocity: 15
        };
        
        this.platforms = [];
        this.generatePlatforms();
        
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameStarted = false;
        this.cameraY = 0;
        
        this.keys = {};
        this.setupControls();
        this.gameLoop();
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (!this.gameStarted) {
                    this.gameStarted = true;
                    this.ball.velocityY = this.ball.jumpPower;
                }
            }
            if (e.key === 'p' || e.key === 'P') {
                this.isPaused = !this.isPaused;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mobile touch controls
        document.addEventListener('touchstart', () => {
            if (!this.gameStarted) {
                this.gameStarted = true;
                this.ball.velocityY = this.ball.jumpPower;
            }
        });
    }
    
    generatePlatforms() {
        this.platforms = [];
        for (let i = 0; i < 8; i++) {
            const platformY = i * 80 - 40;
            this.platforms.push({
                x: Math.random() * (this.canvas.width - 80),
                y: platformY,
                width: 80,
                height: 15,
                type: Math.random() > 0.85 ? 'bouncy' : 'normal'
            });
        }
    }
    
    update() {
        if (this.isPaused || !this.gameStarted) return;
        
        // Apply gravity
        this.ball.velocityY += this.ball.gravity;
        
        // Horizontal movement
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.ball.velocityX = -8;
        } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.ball.velocityX = 8;
        } else {
            this.ball.velocityX *= 0.95;
        }
        
        // Cap velocity
        if (this.ball.velocityY > this.ball.maxVelocity) {
            this.ball.velocityY = this.ball.maxVelocity;
        }
        
        // Update position
        this.ball.x += this.ball.velocityX;
        this.ball.y += this.ball.velocityY;
        
        // Wrap around edges
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
        }
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.x = this.canvas.width - this.ball.radius;
        }
        
        // Check platform collisions
        for (let platform of this.platforms) {
            if (this.checkCollision(platform)) {
                if (this.ball.velocityY > 0) {
                    this.ball.y = platform.y - this.ball.radius;
                    this.ball.velocityY = platform.type === 'bouncy' ? -20 : this.ball.jumpPower;
                    this.score += platform.type === 'bouncy' ? 10 : 5;
                }
            }
        }
        
        // Generate new platforms as camera moves up
        if (this.ball.y < this.cameraY + this.canvas.height / 2) {
            const highestPlatform = Math.min(...this.platforms.map(p => p.y));
            for (let i = 0; i < 3; i++) {
                this.platforms.push({
                    x: Math.random() * (this.canvas.width - 80),
                    y: highestPlatform - 80,
                    width: 80,
                    height: 15,
                    type: Math.random() > 0.85 ? 'bouncy' : 'normal'
                });
            }
        }
        
        // Update camera
        if (this.ball.y < this.cameraY + this.canvas.height / 3) {
            this.cameraY = this.ball.y - this.canvas.height / 3;
        }
        
        // Remove off-screen platforms
        this.platforms = this.platforms.filter(p => p.y < this.cameraY + this.canvas.height + 100);
        
        // Game over check
        if (this.ball.y > this.cameraY + this.canvas.height + 100) {
            this.isGameOver = true;
        }
    }
    
    checkCollision(platform) {
        return this.ball.x + this.ball.radius > platform.x &&
               this.ball.x - this.ball.radius < platform.x + platform.width &&
               this.ball.y + this.ball.radius > platform.y &&
               this.ball.y + this.ball.radius < platform.y + platform.height &&
               this.ball.velocityY >= 0;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid background
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.height + 100; i += 50) {
            const y = i - (this.cameraY % 50);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Draw platforms
        for (let platform of this.platforms) {
            const screenY = platform.y - this.cameraY;
            if (screenY > -50 && screenY < this.canvas.height + 50) {
                this.ctx.fillStyle = platform.type === 'bouncy' ? '#333333' : '#000000';
                this.ctx.fillRect(platform.x, screenY, platform.width, platform.height);
                
                if (platform.type === 'bouncy') {
                    this.ctx.fillStyle = '#666666';
                    this.ctx.fillRect(platform.x + 5, screenY + 2, 70, 4);
                }
            }
        }
        
        // Draw ball
        const ballScreenY = this.ball.y - this.cameraY;
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, ballScreenY, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 5, ballScreenY - 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x + 5, ballScreenY - 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw UI
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`SCORE: ${this.score}`, 10, 30);
        
        // Draw height
        const height = Math.max(0, Math.floor((this.canvas.height - this.ball.y + this.cameraY) / 10));
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`HEIGHT: ${height}`, 10, 60);
        
        // Draw instructions
        if (!this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ULTRAJUMPER', this.canvas.width / 2, 150);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press SPACE or TAP to start', this.canvas.width / 2, 250);
            this.ctx.fillText('Arrow Keys or A/D to move', this.canvas.width / 2, 280);
            this.ctx.fillText('Jump on black platforms to survive', this.canvas.width / 2, 310);
            this.ctx.fillText('Dark platforms give extra bounce!', this.canvas.width / 2, 340);
            
            this.ctx.textAlign = 'left';
        }
        
        if (this.isPaused && this.gameStarted) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.textAlign = 'left';
        }
        
        if (this.isGameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, 200);
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, 260);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Refresh the page to play again', this.canvas.width / 2, 310);
            this.ctx.textAlign = 'left';
        }
    }
    
    gameLoop = () => {
        if (!this.isGameOver && this.gameStarted) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

// Detect offline and show game
window.addEventListener('offline', () => {
    showOfflineGame();
});

function showOfflineGame() {
    const modal = document.getElementById('offlineGameModal');
    if (modal) {
        modal.style.display = 'flex';
        if (!window.offlineGameInstance) {
            window.offlineGameInstance = new OfflineGame('offlineGameCanvas');
        }
    }
}

// Auto-show game if offline when page loads
window.addEventListener('load', () => {
    if (!navigator.onLine) {
        setTimeout(showOfflineGame, 500);
    }
});

// Make function globally available
window.showOfflineGame = showOfflineGame;
