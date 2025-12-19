import * as wecco from "@weccoframework/core"
import { Message, PlaceBackground, PlaceToken, PlaceWall } from "../controller/controller"
import { Color, Editor, isTokenSymbol, Model, Token, Wall, WallSymbol } from "../models/models"

const WallSnapSize = 0.4
const GridCellSize = 10

export function gridContent(emit: wecco.MessageEmitter<Message>, model: Model): wecco.ElementUpdate {
    let svgElement: SVGElement

    function updateSvgTransform(svg: SVGElement) {
        svg.querySelector("g")?.setAttribute("transform", `scale(${model.zoomLevel}, ${model.zoomLevel})`)
    }

    function updateSvg(e: SVGElement) {
        svgElement = e

        window.addEventListener("resize", () => {
            if (!svgElement.isConnected) {
                return
            }
            updateSvgTransform(svgElement)
        })

        updateSvgTransform(svgElement)
    }

    function onSvgClick(e: MouseEvent) {
        if (!(model instanceof Editor)) {
            return
        }

        // Calculate the target (=clicked) grid cell by calculating the coordinates
        // based on the mouse event's x/y coordinates and the relative positioning
        // of the svg element, which is read from the bounding box.
        // Note that the bounding box' left and top values also compensate for
        // any inner scrolling from overflow: auto.
        const bcr = svgElement.getBoundingClientRect()

        const relX = (e.clientX - bcr.left) / 10 / model.zoomLevel
        const relY = (e.clientY - bcr.top) / 10 / model.zoomLevel

        const targetCol = Math.floor(relX)
        const targetRow = Math.floor(relY)

        if (targetCol < 0 || targetCol >= model.gameGrid.cols || targetRow < 0 || targetRow >= model.gameGrid.rows) {
            return
        }

        // check if currently selected tool is a token
        if (isTokenSymbol(model.tool)) {
            // if yes, either place or remove a token
            emit(new PlaceToken(targetCol, targetRow, new Token(model.tool, model.color)))
            // and we're done here
            return
        }

        if (model.tool === "background") {
            // If selected tool is background, just place the currently selected color as the background
            emit(new PlaceBackground(targetCol, targetRow, model.color))
            return
        }

        // If we reach this point, the currently selected tool is a wall.
        // Determine which direction of the wall should be used by looking
        // at the distance to both x and y grid lanes.
        const distanceX = relX - targetCol
        const distanceY = relY - targetRow

        const wallSymbol = model.tool as WallSymbol

        // Determine where to place the wall by looking at all four sides taking
        // WallSnapSize into account.
        
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

    const svgContent = []

    // Backgrounds
    for (let col = 0; col < model.gameGrid.cols; col++) {
        for (let row = 0; row < model.gameGrid.rows; row++) {
            const bgColor = model.gameGrid.backgroundAt(col, row)
            if (typeof bgColor === "undefined") {
                continue
            }

            const e = createBackgroundElement(bgColor);
            e.setAttribute("transform", `translate(${(col * 10)} ${(row * 10)})`)

            svgContent.push(e);
        }
    }

    // Tokens
    // Paint tokens first to allow painting the grid and coordinates over the tokens
    for (let col = 0; col < model.gameGrid.cols; col++) {
        for (let row = 0; row < model.gameGrid.rows; row++) {
            const token = model.gameGrid.tokenAt(col, row)
            if (typeof token !== "undefined") {
                const e = createTokenElement(token)
                e.setAttribute("transform", `translate(${(col * 10) + 5} ${(row * 10) + 5.5})`)
                svgContent.push(e)
            }
        }
    }

    // Walls
    for (let col = 0; col < model.gameGrid.cols; col++) {
        for (let row = 0; row < model.gameGrid.rows; row++) {
            const leftWall = model.gameGrid.wallAt(col, row, "left")
            if (typeof leftWall !== "undefined") {
                svgContent.push(renderWall(leftWall, `translate(${col * 10} ${row * 10}) rotate(90)`))
            }
            const topWall = model.gameGrid.wallAt(col, row, "top")
            if (typeof topWall !== "undefined") {
                svgContent.push(renderWall(topWall, `translate(${col * 10} ${row * 10})`))
            }
        }
    }

    // Grid
    const gridPath = []

    for (let col = 1; col < model.gameGrid.cols; col++) {
        gridPath.push(`M ${(col * 10)} 0 l 0 ${model.gameGrid.rows * 10}`)
    }
    for (let row = 1; row < model.gameGrid.rows; row++) {
        gridPath.push(`M 0 ${(row * 10)} l ${model.gameGrid.cols * 10} 0`)
    }

    svgContent.push(svg`<path d="${gridPath.join(" ")}" class="grid-line"/>`)    

    if (model instanceof Editor && model.lastRemovedToken) {
        svgContent.push(svg`
         <path d="M ${(model.lastRemovedToken[0] - 6) * 10} ${model.lastRemovedToken[1] * 10} 
            v -10 h 10 v -10 h 10 v -20 h 20 v -10 h 10 v -10 h 10
            h 20 
            v 10 h 10 v 10 h 20 v 20 h 10 v 10 h 10 v 10
            v 10
            v 10 h -10 v 10 h -10 v 20 h -20 v 10 h -10 v 10 h -10
            h -20
            v -10 h -10 v -10 h -20 v -20 h -10 v -10 h -10 v -20
            Z" class="distance-meter"/>
         <path d="M ${model.lastRemovedToken[0] * 10} ${model.lastRemovedToken[1] * 10} h 10 v 10 h -10 z" class="distance-meter center"/>
        `)
    }

    return wecco.html`
    <svg xmlns="http://www.w3.org/2000/svg" id="game-grid" width="${model.gameGrid.cols * GridCellSize * model.zoomLevel}" height="${model.gameGrid.rows * GridCellSize * model.zoomLevel}" @updateend=${(e: Event) => setTimeout(() => updateSvg(e.target as SVGElement), 1)} @click=${onSvgClick}>
        <g>
            ${svgContent}
        </g>
    </svg>
    `
}

const SVGNamespaceURI = "http://www.w3.org/2000/svg"

function svg(literals: TemplateStringsArray, ...placeholders: Array<unknown>): wecco.ElementUpdate {
    let src = ""
    for (let i = 0; i < literals.length; i++) {
        src += literals[i]
        if (i < placeholders.length) {
            src += placeholders[i]
        }
    }

    return (host: wecco.UpdateTarget, insertBefore?: Node) => {
        const el = document.createElementNS(SVGNamespaceURI, "svg")
        el.innerHTML = src
        while (el.childNodes.length > 0) {
            host.insertBefore(el.removeChild(el.childNodes[0]), insertBefore ?? null)
        }
    }
}

function renderWall(wall: Wall, transform: string): wecco.ElementUpdate {
    let path: string
    switch (wall.symbol) {
        case "door":
            path = "M 0 0 L 2 0 M 10 0 l -2 0"
            break
        case "wall":
            path = "M 0 0 L 10 0"
            break
        case "window":
            path = "M 0 0 l 1 0 m 2 0 l 1 0 m 2 0 l 1 0 m 2 0 l 1 0"
            break
    }
    return svg`<path d="${path}" class="wall ${wall.color}" transform="${transform}"/>`
}

function createTokenElement(token: Token): SVGElement {
    const e = document.createElementNS(SVGNamespaceURI, "text")
    e.setAttribute("class", `token ${token.color}`)
    e.appendChild(document.createTextNode(token.symbol))
    return e
}

function createBackgroundElement(color: Color): SVGElement {
    const e = document.createElementNS(SVGNamespaceURI, "use")
    e.setAttribute("width", "10")
    e.setAttribute("height", "10")
    e.setAttribute("href", "#background")
    e.classList.add("background")
    e.classList.add(color)

    return e
}

export function downloadGridAsPNG(): void {
    const defs = document.querySelector("#svg-defs")?.innerHTML ?? ""
    const svg = document.querySelector("#game-grid")
    let src = svg?.outerHTML ?? ""
    let styleRules = ""

    const styleSheet = Array.from(document.styleSheets).find(s => s?.href?.match(/^.*grid.*$/))
    if (styleSheet) {
        styleRules = Array.from(styleSheet.cssRules).map(r => r.cssText).join("\n")
    }

    src = src.replace(/^\s*(<svg[^>]*?>)(.*)$/mi, `$1<style>${styleRules}</style><defs>${defs}</defs>$2`)

    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" })
    const dataUrl = URL.createObjectURL(blob)

    const canvas = document.createElement("canvas")
    canvas.width = svg?.getBoundingClientRect().width ?? 0
    canvas.height = svg?.getBoundingClientRect().height ?? 0
    const ctx = canvas.getContext("2d")

    const img = new Image()
    img.onload = function () {
        ctx?.drawImage(img, 0, 0)
        URL.revokeObjectURL(dataUrl)
        const pngUrl = canvas.toDataURL()
        const el = document.createElement("a");
        el.setAttribute("href", pngUrl)
        el.setAttribute("download", "gamegrid.png")
        el.style.display = "none"
        document.body.appendChild(el)
        el.click()
        document.body.removeChild(el)
    }
    img.src = dataUrl
}