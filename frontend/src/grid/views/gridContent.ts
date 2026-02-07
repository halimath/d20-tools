import * as wecco from "@weccoframework/core"
import { Message, PlaceBackground, PlaceToken, PlaceWall } from "../controller/controller"
import { Color, Editor, isTokenSymbol, Model, Token, Wall, WallSymbol } from "../models/models"

const WallSnapSize = 0.4
const GridCellSize = 10

// Color mappings from CSS
const tokenColors: Record<Color, string> = {
    "grey": "#aaa",
    "green": "#02551d",
    "blue": "#001f75",
    "red": "#900018",
    "orange": "#c54f00",
    "purple": "#750075",
    "yellow": "#b8a500",
    "black": "#222",
    "brown": "#5d2a00"
}

const backgroundColors: Record<Color, string> = {
    "grey": "#b1b1b1",
    "green": "#739f81",
    "blue": "#7091ec",
    "red": "#c88c96",
    "orange": "#eea366",
    "purple": "#cd7ecd",
    "yellow": "#e6e0a5",
    "black": "#c5c5c5",
    "brown": "#b07d5b"
}

function lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16)
    const r = Math.min(255, (num >> 16) + percent * 255)
    const g = Math.min(255, ((num >> 8) & 0x00FF) + percent * 255)
    const b = Math.min(255, (num & 0x0000FF) + percent * 255)
    return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`
}

export function gridContent(emit: wecco.MessageEmitter<Message>, model: Model): wecco.ElementUpdate {
    let canvasElement: HTMLCanvasElement
    let resizeHandler: (() => void) | null = null
    let hoverTarget: HoverTarget | null = null

    function drawCanvas(canvas: HTMLCanvasElement) {
        canvasElement = canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const baseWidth = model.gameGrid.cols * GridCellSize
        const baseHeight = model.gameGrid.rows * GridCellSize
        const scaledWidth = baseWidth * model.zoomLevel
        const scaledHeight = baseHeight * model.zoomLevel

        // Set canvas size
        canvas.width = scaledWidth
        canvas.height = scaledHeight
        canvas.style.width = `${scaledWidth}px`
        canvas.style.height = `${scaledHeight}px`

        // Scale context for zoom
        ctx.save()
        ctx.scale(model.zoomLevel, model.zoomLevel)

        // Clear canvas with background color
        ctx.fillStyle = "#f8f8f8" // $light-grey
        ctx.fillRect(0, 0, baseWidth, baseHeight)

        // Draw backgrounds
        for (let col = 0; col < model.gameGrid.cols; col++) {
            for (let row = 0; row < model.gameGrid.rows; row++) {
                const bgColor = model.gameGrid.backgroundAt(col, row)
                if (typeof bgColor !== "undefined") {
                    drawBackground(ctx, col, row, bgColor)
                }
            }
        }

        // Draw tokens
        for (let col = 0; col < model.gameGrid.cols; col++) {
            for (let row = 0; row < model.gameGrid.rows; row++) {
                const token = model.gameGrid.tokenAt(col, row)
                if (typeof token !== "undefined") {
                    drawToken(ctx, col, row, token)
                }
            }
        }

        // Draw walls
        for (let col = 0; col < model.gameGrid.cols; col++) {
            for (let row = 0; row < model.gameGrid.rows; row++) {
                const leftWall = model.gameGrid.wallAt(col, row, "left")
                if (typeof leftWall !== "undefined") {
                    drawWall(ctx, col, row, "left", leftWall)
                }
                const topWall = model.gameGrid.wallAt(col, row, "top")
                if (typeof topWall !== "undefined") {
                    drawWall(ctx, col, row, "top", topWall)
                }
            }
        }

        // Draw hover preview for editors
        if (model instanceof Editor && hoverTarget) {
            ctx.save()
            ctx.globalAlpha = 0.55
            if (hoverTarget.kind === "cell") {
                if (isTokenSymbol(model.tool)) {
                    drawToken(ctx, hoverTarget.col, hoverTarget.row, new Token(model.tool, model.color))
                } else if (model.tool === "background") {
                    drawBackground(ctx, hoverTarget.col, hoverTarget.row, model.color)
                }
            } else if (!isTokenSymbol(model.tool) && model.tool !== "background") {
                const wallSymbol = model.tool as WallSymbol
                drawWall(ctx, hoverTarget.col, hoverTarget.row, hoverTarget.position, new Wall(wallSymbol, model.color))
            }
            ctx.restore()
        }

        // Draw grid lines
        ctx.strokeStyle = "black"
        ctx.lineWidth = 0.1
        for (let col = 1; col < model.gameGrid.cols; col++) {
            ctx.beginPath()
            ctx.moveTo(col * GridCellSize, 0)
            ctx.lineTo(col * GridCellSize, baseHeight)
            ctx.stroke()
        }
        for (let row = 1; row < model.gameGrid.rows; row++) {
            ctx.beginPath()
            ctx.moveTo(0, row * GridCellSize)
            ctx.lineTo(baseWidth, row * GridCellSize)
            ctx.stroke()
        }

        // Draw distance meter if needed
        if (model instanceof Editor && model.lastRemovedToken) {
            drawDistanceMeter(ctx, model.lastRemovedToken[0], model.lastRemovedToken[1])
        }

        ctx.restore()
    }

    function updateCanvas(canvas: HTMLCanvasElement) {
        // Remove old resize handler if it exists
        if (resizeHandler) {
            window.removeEventListener("resize", resizeHandler)
            resizeHandler = null
        }

        // Draw the canvas
        drawCanvas(canvas)

        // Add new resize handler
        resizeHandler = () => {
            if (!canvasElement || !canvasElement.isConnected) {
                if (resizeHandler) {
                    window.removeEventListener("resize", resizeHandler)
                    resizeHandler = null
                }
                return
            }
            drawCanvas(canvasElement)
        }
        window.addEventListener("resize", resizeHandler)
    }

    function onCanvasClick(e: MouseEvent) {
        if (!(model instanceof Editor)) {
            return
        }

        const canvas = e.target as HTMLCanvasElement
        if (!canvas) {
            return
        }

        const bcr = canvas.getBoundingClientRect()
        const relX = (e.clientX - bcr.left) / GridCellSize / model.zoomLevel
        const relY = (e.clientY - bcr.top) / GridCellSize / model.zoomLevel

        const targetCol = Math.floor(relX)
        const targetRow = Math.floor(relY)

        if (targetCol < 0 || targetCol >= model.gameGrid.cols || targetRow < 0 || targetRow >= model.gameGrid.rows) {
            return
        }

        // check if currently selected tool is a token
        if (isTokenSymbol(model.tool)) {
            emit(new PlaceToken(targetCol, targetRow, new Token(model.tool, model.color)))
            return
        }

        if (model.tool === "background") {
            emit(new PlaceBackground(targetCol, targetRow, model.color))
            return
        }

        // If we reach this point, the currently selected tool is a wall.
        const distanceX = relX - targetCol
        const distanceY = relY - targetRow

        const wallSymbol = model.tool as WallSymbol

        if (distanceX < WallSnapSize) {
            emit(new PlaceWall(targetCol, targetRow, "left", new Wall(wallSymbol, model.color)))
            return
        }

        if (distanceX > 1 - WallSnapSize) {
            emit(new PlaceWall(targetCol + 1, targetRow, "left", new Wall(wallSymbol, model.color)))
            return
        }

        if (distanceY < WallSnapSize) {
            emit(new PlaceWall(targetCol, targetRow, "top", new Wall(wallSymbol, model.color)))
            return
        }

        if (distanceY > 1 - WallSnapSize) {
            emit(new PlaceWall(targetCol, targetRow + 1, "top", new Wall(wallSymbol, model.color)))
            return
        }
    }

    function updateHoverTarget(nextTarget: HoverTarget | null) {
        if (hoverTarget?.kind === nextTarget?.kind &&
            hoverTarget?.col === nextTarget?.col &&
            hoverTarget?.row === nextTarget?.row &&
            (hoverTarget?.kind !== "wall" || hoverTarget?.position === (nextTarget as WallHoverTarget | null)?.position)) {
            return
        }

        hoverTarget = nextTarget

        if (canvasElement && canvasElement.isConnected) {
            drawCanvas(canvasElement)
        }
    }

    function onCanvasHover(e: MouseEvent) {
        if (!(model instanceof Editor)) {
            return
        }

        const canvas = e.target as HTMLCanvasElement
        if (!canvas) {
            return
        }

        const bcr = canvas.getBoundingClientRect()
        const relX = (e.clientX - bcr.left) / GridCellSize / model.zoomLevel
        const relY = (e.clientY - bcr.top) / GridCellSize / model.zoomLevel

        const targetCol = Math.floor(relX)
        const targetRow = Math.floor(relY)

        if (targetCol < 0 || targetCol >= model.gameGrid.cols || targetRow < 0 || targetRow >= model.gameGrid.rows) {
            updateHoverTarget(null)
            return
        }

        if (isTokenSymbol(model.tool) || model.tool === "background") {
            updateHoverTarget({ kind: "cell", col: targetCol, row: targetRow })
            return
        }

        const distanceX = relX - targetCol
        const distanceY = relY - targetRow

        if (distanceX < WallSnapSize) {
            updateHoverTarget({ kind: "wall", col: targetCol, row: targetRow, position: "left" })
            return
        }

        if (distanceX > 1 - WallSnapSize) {
            updateHoverTarget({ kind: "wall", col: targetCol + 1, row: targetRow, position: "left" })
            return
        }

        if (distanceY < WallSnapSize) {
            updateHoverTarget({ kind: "wall", col: targetCol, row: targetRow, position: "top" })
            return
        }

        if (distanceY > 1 - WallSnapSize) {
            updateHoverTarget({ kind: "wall", col: targetCol, row: targetRow + 1, position: "top" })
            return
        }

        updateHoverTarget(null)
    }

    function onCanvasLeave() {
        updateHoverTarget(null)
    }

    return wecco.html`
    <canvas id="game-grid" @updateend=${(e: Event) => setTimeout(() => updateCanvas(e.target as HTMLCanvasElement), 1)} @click=${onCanvasClick} @mousemove=${onCanvasHover} @mouseleave=${onCanvasLeave}></canvas>
    `
}

type CellHoverTarget = { kind: "cell", col: number, row: number }
type WallHoverTarget = { kind: "wall", col: number, row: number, position: "left" | "top" }
type HoverTarget = CellHoverTarget | WallHoverTarget

function drawBackground(ctx: CanvasRenderingContext2D, col: number, row: number, color: Color) {
    const x = col * GridCellSize
    const y = row * GridCellSize
    const bgColor = backgroundColors[color]
    const lightBgColor = lightenColor(bgColor, 0.1)

    // Fill background
    ctx.fillStyle = lightBgColor
    ctx.strokeStyle = lightBgColor
    ctx.lineWidth = 1
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.fillRect(x, y, GridCellSize, GridCellSize)

    // Draw diagonal pattern (matching SVG pattern)
    ctx.strokeStyle = lightBgColor
    ctx.beginPath()
    ctx.moveTo(x + 2, y + 3)
    ctx.lineTo(x + 3, y + 2)
    ctx.moveTo(x + 2, y + 5)
    ctx.lineTo(x + 5, y + 2)
    ctx.moveTo(x + 2, y + 7)
    ctx.lineTo(x + 7, y + 2)
    ctx.moveTo(x + 3, y + 8)
    ctx.lineTo(x + 8, y + 3)
    ctx.moveTo(x + 5, y + 8)
    ctx.lineTo(x + 8, y + 5)
    ctx.moveTo(x + 7, y + 8)
    ctx.lineTo(x + 8, y + 7)
    ctx.stroke()
}

function drawToken(ctx: CanvasRenderingContext2D, col: number, row: number, token: Token) {
    const x = col * GridCellSize + 5
    const y = row * GridCellSize + 5.5
    const tokenColor = tokenColors[token.color]
    const lightTokenColor = lightenColor(tokenColor, 0.15)

    ctx.font = "10px system-ui, Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.lineWidth = 0.3

    // Draw stroke
    ctx.strokeStyle = tokenColor
    ctx.strokeText(token.symbol, x, y)

    // Draw fill
    ctx.fillStyle = lightTokenColor
    ctx.fillText(token.symbol, x, y)
}

function drawWall(ctx: CanvasRenderingContext2D, col: number, row: number, position: "left" | "top", wall: Wall) {
    const x = col * GridCellSize
    const y = row * GridCellSize
    const wallColor = tokenColors[wall.color]

    ctx.strokeStyle = wallColor
    ctx.lineWidth = 1.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (position === "top") {
        switch (wall.symbol) {
            case "door":
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x + 2, y)
                ctx.moveTo(x + 8, y)
                ctx.lineTo(x + 10, y)
                ctx.stroke()
                break
            case "wall":
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x + 10, y)
                ctx.stroke()
                break
            case "window":
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x + 1, y)
                ctx.moveTo(x + 3, y)
                ctx.lineTo(x + 4, y)
                ctx.moveTo(x + 6, y)
                ctx.lineTo(x + 7, y)
                ctx.moveTo(x + 9, y)
                ctx.lineTo(x + 10, y)
                ctx.stroke()
                break
        }
    } else { // left
        switch (wall.symbol) {
            case "door":
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x, y + 2)
                ctx.moveTo(x, y + 8)
                ctx.lineTo(x, y + 10)
                ctx.stroke()
                break
            case "wall":
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x, y + 10)
                ctx.stroke()
                break
            case "window":
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(x, y + 1)
                ctx.moveTo(x, y + 3)
                ctx.lineTo(x, y + 4)
                ctx.moveTo(x, y + 6)
                ctx.lineTo(x, y + 7)
                ctx.moveTo(x, y + 9)
                ctx.lineTo(x, y + 10)
                ctx.stroke()
                break
        }
    }
}

function drawDistanceMeter(ctx: CanvasRenderingContext2D, col: number, row: number) {
    const startX = (col - 6) * GridCellSize
    const startY = row * GridCellSize

    ctx.strokeStyle = "#0078a7"
    ctx.fillStyle = "rgba(101, 190, 225, 0.1)"
    ctx.lineWidth = 1.0
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.setLineDash([6, 2])

    // Draw outer shape - tracing the SVG path exactly
    ctx.beginPath()
    let x = startX
    let y = startY
    ctx.moveTo(x, y)
    
    // v -10 h 10 v -10 h 10 v -20 h 20 v -10 h 10 v -10 h 10
    y -= 10; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    y -= 10; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    y -= 20; ctx.lineTo(x, y)
    x += 20; ctx.lineTo(x, y)
    y -= 10; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    y -= 10; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    
    // h 20
    x += 20; ctx.lineTo(x, y)
    
    // v 10 h 10 v 10 h 20 v 20 h 10 v 10 h 10 v 10
    y += 10; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    y += 10; ctx.lineTo(x, y)
    x += 20; ctx.lineTo(x, y)
    y += 20; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    y += 10; ctx.lineTo(x, y)
    x += 10; ctx.lineTo(x, y)
    y += 10; ctx.lineTo(x, y)
    
    // v 10 (redundant but in original)
    y += 10; ctx.lineTo(x, y)
    
    // v 10 h -10 v 10 h -10 v 20 h -20 v 10 h -10 v 10 h -10
    y += 10; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    y += 10; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    y += 20; ctx.lineTo(x, y)
    x -= 20; ctx.lineTo(x, y)
    y += 10; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    y += 10; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    
    // h -20
    x -= 20; ctx.lineTo(x, y)
    
    // v -10 h -10 v -10 h -20 v -20 h -10 v -10 h -10 v -20
    y -= 10; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    y -= 10; ctx.lineTo(x, y)
    x -= 20; ctx.lineTo(x, y)
    y -= 20; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    y -= 10; ctx.lineTo(x, y)
    x -= 10; ctx.lineTo(x, y)
    y -= 20; ctx.lineTo(x, y)
    
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Draw center square
    ctx.setLineDash([])
    ctx.lineWidth = 1.5
    ctx.fillStyle = "transparent"
    ctx.strokeStyle = "#0078a7"
    ctx.beginPath()
    ctx.rect(col * GridCellSize, row * GridCellSize, GridCellSize, GridCellSize)
    ctx.stroke()
}

export function downloadGridAsPNG(): void {
    const canvas = document.querySelector("#game-grid") as HTMLCanvasElement
    if (!canvas) {
        return
    }

    const pngUrl = canvas.toDataURL("image/png")
    const el = document.createElement("a")
    el.setAttribute("href", pngUrl)
    el.setAttribute("download", "gamegrid.png")
    el.style.display = "none"
    document.body.appendChild(el)
    el.click()
    document.body.removeChild(el)
}
