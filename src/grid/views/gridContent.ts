import * as wecco from "@weccoframework/core"
import { Message, PlaceToken, PlaceWall } from "../controller"
import { GameGrid, Token, Wall } from "../models"

const WallSnapSize = 0.2
const GridCellSize = 10

export function gridContent(emit: wecco.MessageEmitter<Message>, model: GameGrid, scale: number): wecco.ElementUpdate {
    let svgElement: SVGElement

    function updateSvgTransform (svg: SVGElement) {
        svg.querySelector("g")?.setAttribute("transform", `translate(10, 10), scale(${scale}, ${scale})`)
    }

    function updateSvg (e: SVGElement) {
        svgElement = e

        window.addEventListener("resize", () => {
            if (!svgElement.isConnected) {
                return
            }
            updateSvgTransform(svgElement)
        })

        updateSvgTransform(svgElement)
    }

    function onSvgClick (e: MouseEvent) {
        const bcr = svgElement.getBoundingClientRect()

        const relX = (e.clientX - bcr.left) / 10 / scale
        const relY = (e.clientY - bcr.top) / 10 / scale

        const targetCol = Math.floor(relX)
        const targetRow = Math.floor(relY)

        if (targetCol < 0 || targetCol >= model.cols || targetRow < 0 || targetRow >= model.rows) {
            return
        }

        const distanceX = relX - targetCol
        const distanceY = relY - targetRow

        console.log(distanceX, distanceY)

        if (distanceX < WallSnapSize) {
            emit(new PlaceWall(targetCol, targetRow, "left", new Wall(model.wallSymbol, model.color)))
            return
        }
        
        if (distanceX > 1 - WallSnapSize) {
            emit(new PlaceWall(targetCol + 1, targetRow, "left", new Wall(model.wallSymbol, model.color)))
            return
        }

        if (distanceY < WallSnapSize) {
            emit(new PlaceWall(targetCol, targetRow, "top", new Wall(model.wallSymbol, model.color)))
            return
        }
        
        if (distanceY > 1 - WallSnapSize) {
            emit(new PlaceWall(targetCol, targetRow + 1, "top", new Wall(model.wallSymbol, model.color)))
            return
        }


        emit(new PlaceToken(targetCol, targetRow, new Token(model.tokenSymbol, model.color)))
    }

    const svgContent = []

    // Tokens
    // Paint tokens first to allow painting the grid and coordinates over the tokens
    for (let col = 0; col < model.cols; col++) {
        for (let row = 0; row < model.rows; row++) {
            const token = model.tokenAt(col, row)
            if (typeof token !== "undefined") {
                const e = createTokenElement(token)
                e.setAttribute("transform", `translate(${(col * 10) + 5} ${(row * 10) + 5})`)
                svgContent.push(e)
            }
        }
    }

    // Grid
    const gridPath = []

    for (let col = 1; col < model.cols; col++) {
        gridPath.push(`M ${(col * 10)} 0 l 0 ${model.rows * 10}`)
    }
    for (let row = 1; row < model.rows; row++) {
        gridPath.push(`M 0 ${(row * 10)} l ${model.cols * 10} 0`)
    }

    svgContent.push(svg`<path d="${gridPath.join(" ")}" class="grid-line"/>`)

    // Walls
    for (let col = 0; col < model.cols; col++) {
        for (let row = 0; row < model.rows; row++) {
            const leftWall = model.wallAt(col, row, "left")
            if (typeof leftWall !== "undefined") {
                svgContent.push(renderWall(leftWall, `translate(${col * 10} ${row * 10}) rotate(90)`))
            }
            const topWall = model.wallAt(col, row, "top")
            if (typeof topWall !== "undefined") {
                svgContent.push(renderWall(topWall, `translate(${col * 10} ${row * 10})`))
            }
        }
    }

    return wecco.html`
    <svg xmlns="http://www.w3.org/2000/svg" id="game-grid" width="${model.cols * GridCellSize * scale}" height="${model.rows * GridCellSize * scale}" @update=${(e: Event) => setTimeout(() => updateSvg(e.target as SVGElement), 1)} @click=${onSvgClick}>
        <g>
            ${svgContent}
        </g>
    </svg>
    ` 
}

const SVGNamespaceURI = "http://www.w3.org/2000/svg"

function svg(literals: TemplateStringsArray, ...placeholders: Array<any>): wecco.ElementUpdate {
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

function createTokenElement (token: Token): SVGElement {
    const e = document.createElementNS(SVGNamespaceURI, "text")
    e.setAttribute("class", `token ${token.color}`)
    e.appendChild(document.createTextNode(token.symbol))
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

    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8"})
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