import GameObject from './GameObject.js'
import plantSpriteImage from './assets/Pixel Adventure 1/Other/plant_grow.png'

export default class Plant extends GameObject {
    constructor(game, x, y, size = 64) {
        // Vi justerar hitboxens höjd först när den är klar
        super(game, x, y - size, size, size) 
        
        this.frameWidth = 64
        this.frameHeight = 64
        
        this.image = new Image()
        this.image.src = plantSpriteImage
        
        
        this.overlap = 14 
        this.growthSpeed = 80 // Pixlar per sekund som den växer uppåt
        
        // --- VÄXANDE LOGIK ---
        this.growthState = 0 // 0=Kruka, 1=Mitten, 2=ToppStam, 3=Huvud
        this.currentSegmentHeight = 0 
        
        this.frameTimer = 0
        this.frameInterval = 100

        // krukan
        this.potFrameIndex = 0
        this.potMaxFrame = 7
        
        // mellan
        this.middleFrame = 10 
        this.upperStemFrame = 11 

        // huvud
        this.headFrameIndex = 12
        this.headMinFrame = 12
        this.headMaxFrame = 15
        
        this.isFullyGrown = false
        this.isPotFinished = false
    }

    update(deltaTime) {
        this.frameTimer += deltaTime

        if (!this.isPotFinished) {
            if (this.frameTimer > this.frameInterval) {
                if (this.potFrameIndex < this.potMaxFrame) {
                    this.potFrameIndex++
                    this.frameTimer = 0
                } else {
                    this.isPotFinished = true
                    this.growthState = 1 
                    this.currentSegmentHeight = 0 
                }
            }
        } 
        
        
        else if (!this.isFullyGrown) {
            this.currentSegmentHeight += this.growthSpeed * (deltaTime / 1000)

            if (this.currentSegmentHeight >= 64) {
                this.currentSegmentHeight = 0 
                this.growthState++ 
                
                if (this.growthState > 3) {
                    this.growthState = 3 
                    this.isFullyGrown = true

                    const totalHeight = (this.width * 4) - (this.overlap * 3)
                    this.y = this.y + this.height - totalHeight
                    this.height = totalHeight
                }
            }
        }

        if (this.isFullyGrown) {
            if (this.frameTimer > this.frameInterval + 100) {
                this.headFrameIndex++
                if (this.headFrameIndex > this.headMaxFrame) {
                    this.headFrameIndex = this.headMinFrame
                }
                this.frameTimer = 0
            }
        }
    }

    isSolid() {
        return this.isFullyGrown
    }
    
    drawFrame(ctx, frameIndex, x, y) {
        this.drawGrowingFrame(ctx, frameIndex, x, y, 64)
    }

    drawGrowingFrame(ctx, frameIndex, x, y, height) {
        const columns = 4
        const col = frameIndex % columns
        const row = Math.floor(frameIndex / columns)

        const sourceX = col * this.frameWidth
        
        const sourceY = row * this.frameHeight
        
        const drawY = y + (64 - height)

        ctx.drawImage(
            this.image,
            sourceX, sourceY, this.frameWidth, height, 
            x, drawY, this.width, height 
        )
    }

    draw(ctx, camera = null) {
        let baseX = this.x
        let baseY = this.y
        
        if (this.isFullyGrown) {
            baseY = this.y + this.height - this.width
        } 
        
        const drawX = camera ? baseX - camera.x : baseX
        const drawY = camera ? baseY - camera.y : baseY
        
        const size = 64

        const stepUp = size - this.overlap

        if (this.image && this.image.complete) {
            
            this.drawFrame(ctx, this.potFrameIndex, drawX, drawY)

            if (this.growthState > 1) { 

                this.drawFrame(ctx, this.middleFrame, drawX, drawY - stepUp)
            } else if (this.growthState === 1) {
                this.drawGrowingFrame(ctx, this.middleFrame, drawX, drawY - stepUp, this.currentSegmentHeight)
            }

            if (this.growthState > 2) {
                this.drawFrame(ctx, this.upperStemFrame, drawX, drawY - (stepUp * 2))
            } else if (this.growthState === 2) {
                this.drawGrowingFrame(ctx, this.upperStemFrame, drawX, drawY - (stepUp * 2), this.currentSegmentHeight)
            }

            if (this.isFullyGrown) {
                this.drawFrame(ctx, this.headFrameIndex, drawX, drawY - (stepUp * 3))
            } else if (this.growthState === 3) {
                this.drawGrowingFrame(ctx, this.headFrameIndex, drawX, drawY - (stepUp * 3), this.currentSegmentHeight)
            }

        // } else {
        //     ctx.fillStyle = 'green'
        //     ctx.fillRect(drawX, drawY, this.width, this.height)
        }
    }
}