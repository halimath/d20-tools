import * as wecco from "@wecco/core"
import { m } from "src/script/utils/i18n"
import { ClearGrid, Message, PlaceToken, SelectToken, ShowGameGrid } from "../../controller"
import { GameGrid, Token, TokenColors, TokenSymbols, TokenColor, TokenSymbol, TokenSymbolUrlCharMapping, TokenColorUrlCharMapping } from "../../models"
import { appShell } from "../components/appShell"

const SVGNamespaceURI = "http://www.w3.org/2000/svg"

function svg(literals: TemplateStringsArray, ...placeholders: any[]): wecco.ElementUpdate {
    let s = ""
    for (let i = 0; i < literals.length; i++) {
        s += literals[i]
        if (i < placeholders.length) {
            s += placeholders[i]
        }
    }

    return (host: wecco.UpdateTarget, insertBefore?: Node) => {
        const el = document.createElementNS(SVGNamespaceURI, "svg")
        el.innerHTML = s
        while (el.childNodes.length > 0) {
            host.insertBefore(el.removeChild(el.childNodes[0]), insertBefore ?? null)
        }
    }
}

export function gameGrid(context: wecco.AppContext<Message>, model: GameGrid): wecco.ElementUpdate {
    function notifyGridSizeChanged(cols: number, rows: number) {
        context.emit(new ShowGameGrid(new GameGrid(cols, rows)))
    }

    const body = wecco.html`
        <div class="container game-grid">
            <div class="row mt-4">
                <div class="col input-group">
                    <span class="input-group-text">${m("gameGrid.cols")}</span>
                    <input type="number" min="2" max="30" class="form-control me-2" value=${model.cols} @change=${(e: InputEvent) => {
                        const value = (e.target as HTMLInputElement).value
                        notifyGridSizeChanged(parseInt(value), model.rows)
                    }}>
                </div>
                
                <div class="col input-group">
                    <span class="input-group-text">${m("gameGrid.rows")}</span>
                    <input type="number" min="2" max="30" class="form-control me-2" value=${model.rows} @change=${(e: InputEvent) => {
                        const value = (e.target as HTMLInputElement).value
                        notifyGridSizeChanged(model.cols, parseInt(value))
                    }}>
                </div>

                <div class="col">
                    <div class="btn-group">
                        ${TokenSymbols.map(s => wecco.html`
                            <button 
                                @click=${() => context.emit(new SelectToken(new Token(s, model.selectedToken.color)))} 
                                accesskey=${TokenSymbolUrlCharMapping.get(s)}
                                class="btn ${s === model.selectedToken.symbol ? "btn-secondary" : "btn-outline-secondary"} symbol-selector ${s}">
                                ${tokenSymbolButtonLabel(s)}
                            </button>
                        `)}
                    </div>
                </div>

                <div class="col">
                    <div class="btn-group">
                    ${
                        TokenColors.map(c => wecco.html`
                        <button 
                            @click=${() => context.emit(new SelectToken(new Token(model.selectedToken.symbol, c)))} 
                            accesskey=${TokenColorUrlCharMapping.get(c)}
                            class="btn btn-outline-secondary color-selector ${c} ${c === model.selectedToken.color ? "selected" : ""}">
                            ${m("gameGrid.color." + c)}
                        </button>
                        `)
                    }
                    </div>
                </div>

                <div class="col">
                    <div class="btn-group">
                        <button class="btn btn-outline-primary d-flex justify-content-center align-content-between" @click=${() => {
                            document.body.requestFullscreen()
                        }}><i class="material-icons mr-1">fullscreen</i></button>
                        <button class="btn btn-outline-danger d-flex justify-content-center align-content-between" @click=${() => {
                            context.emit(new ClearGrid())
                        }}><i class="material-icons mr-1">delete</i></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid game-grid">
            <div class="row mt-2">
                <div class="col">
                    ${gridContent(context, model)}
                </div>
            </div>        
        </div>
    `

    return appShell(context, body)
}

function tokenSymbolButtonLabel(s: TokenSymbol): wecco.ElementUpdate {
    if (s === "diamond") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 5 l 4 -4 l 4 4 l -4 4 l -4 -4" class="token grey"/>
            </svg>
        `
    }

    if (s === "square") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 1 l 8 0 l 0 8 l -8 0 l 0 -8" class="token grey"/>
            </svg>
        `
    }

    if (s === "cross") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 1 l 8 8 m -8 0 l 8 -8" class="token grey"/>
            </svg>
        `
    }

    if (s === "lines") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 3 L 3 1 M 1 5 L 5 1 M 1 7 L 7 1 M 1 9 L 9 1 M 3 9 L 9 3 M 5 9 L 9 5 M 7 9 L 9 7" class="token grey"/>
            </svg>
        `
    }

    if (s === "circle") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <circle cx="5" cy="5" r="4" class="token grey"/>
            </svg>
        `
    }

    throw `Missing button definition for ${s}`
}

function gridContent(context: wecco.AppContext<Message>, model: GameGrid): wecco.ElementUpdate {
    function calculateGridSizeAndOffsets (svg: SVGElement): [number, [number, number]] {
        const bcr = svg.getBoundingClientRect()

        const width = bcr.width
        const height = bcr.height
   
        const gridSize = Math.min(width / (model.cols + 1), height / (model.rows + 1))
    
        const offsetX = (width - gridSize * model.cols) / 2
        const offsetY = (height - gridSize * model.rows) / 2

        return [gridSize, [offsetX, offsetY]]
    }

    function updateSvgTransform (svg: SVGElement) {
        const windowHeight = window.innerHeight
        svg.style.height = `${windowHeight - svg.getBoundingClientRect().top - 5}px`
       
        const [gridSize, [offsetX, offsetY]] = calculateGridSizeAndOffsets(svg)
    
        svg.querySelector("g")?.setAttribute("transform", `translate(${offsetX} ${offsetY}), scale(${gridSize / 10} ${gridSize / 10})`)
    }

    function mountSvg (svg: SVGElement) {
        window.addEventListener("resize", () => {
            if (!svg.isConnected) {
                return
            }
            updateSvgTransform(svg)
        })

        svg.addEventListener("click", (e: MouseEvent) => {
            const bcr = svg.getBoundingClientRect()
            const [gridSize, [offsetX, offsetY]] = calculateGridSizeAndOffsets(svg)

            const targetCol = Math.floor((e.clientX - bcr.left - offsetX) / gridSize)
            const targetRow = Math.floor((e.clientY - bcr.top - offsetY) / gridSize)

            if (targetCol < 0 || targetCol >= model.cols || targetRow < 0 || targetRow >= model.rows) {
                return
            }

            if (typeof model.tokenAt(targetCol, targetRow) === "undefined") {
                context.emit(new PlaceToken(targetCol, targetRow, model.selectedToken))
            } else {
                context.emit(new PlaceToken(targetCol, targetRow))
            }
        })

        updateSvgTransform(svg)
    }

    const gridPath = []

    for (let col = 1; col < model.cols; col++) {
        gridPath.push(`M ${(col * 10)} 0 l 0 ${model.rows * 10}`)
    }
    for (let row = 1; row < model.rows; row++) {
        gridPath.push(`M 0 ${(row * 10)} l ${model.cols * 10} 0`)
    }

    const svgContent = []

    // Paint tokens first to allow painting the grid and coordinates over the tokens
    for (let col = 0; col < model.cols; col++) {
        for (let row = 0; row < model.rows; row++) {
            const token = model.tokenAt(col, row)
            if (typeof token !== "undefined") {
                const e = createTokenElement(token)
                e.setAttribute("transform", `translate(${(col * 10)} ${(row * 10)})`)
                svgContent.push(e)
            }
        }
    }

    svgContent.push(svg`<path d="${gridPath.join(" ")}" class="grid-line"/>`)

    for (let i = 1; i < model.cols + 1; i++) {
        const l = createLegendElement(i.toString())
        l.setAttribute("transform", `translate(${i * 10 - 5} -1)`)
        svgContent.push(l)
    }

    for (let i = 1; i < model.rows + 1; i++) {
        const l = createLegendElement(String.fromCharCode("A".charCodeAt(0) + (i - 1)))
        l.setAttribute("transform", `translate(-1 ${i * 10 - 5})`)
        svgContent.push(l)
    }

    svgContent.push(svg`
        <path 
            d="M 0 -4 l ${model.cols * 10} 0 M 0 -5 l 0 2"
            class="ruler-line"/>        
    `)

    for (let c = 2; c <= model.cols; c += 2) {
        svgContent.push(svg`<path d="M ${c * 10} -5 l 0 2" class="ruler-line"/>`)
        svgContent.push(svg`<text x="${c * 10}" y="-2" class="ruler-text">${c * 1.5}m</text>`)
    }

svgContent.push(svg`
        <path 
            d="M -4 0 l 0 ${model.rows * 10} M -5 0 l 2 0"
            class="ruler-line"/>        
    `)

    for (let r = 2; r <= model.rows; r += 2) {
        svgContent.push(svg`<path d="M -5 ${r * 10} l 2 0" class="ruler-line"/>`)
        svgContent.push(svg`<text x="-1.5" y="${r * 10}" class="ruler-text">${r * 1.5}m</text>`)
    }

    return wecco.html`
    <svg xmlns="http://www.w3.org/2000/svg" @mount=${mountSvg}>
        <g>
            ${svgContent}
        </g>
    </svg>
    ` 
}


function createLegendElement(label: string): SVGElement {
    const text = document.createElementNS(SVGNamespaceURI, "text")
    text.setAttribute("x", "0")
    text.setAttribute("y", "0")
    text.appendChild(document.createTextNode(label))        

    text.classList.add("legend")

    return text
}

function createTokenElement (token: Token): SVGElement {
    let e: SVGElement
    if (token.symbol === "circle") {
        e = document.createElementNS(SVGNamespaceURI, "circle")
        e.setAttribute("cx", "5")
        e.setAttribute("cy", "5")
        e.setAttribute("r", "4")
    } else if (token.symbol === "cross") {
        e = document.createElementNS(SVGNamespaceURI, "path")
        e.setAttribute("d", "M 1 1 l 8 8 m -8 0 l 8 -8")
    } else if (token.symbol === "square") {
        e = document.createElementNS(SVGNamespaceURI, "path")
        e.setAttribute("d", "M 1 1 l 8 0 l 0 8 l -8 0 l 0 -8")
    } else if (token.symbol === "diamond") {
        e = document.createElementNS(SVGNamespaceURI, "path")
        e.setAttribute("d", "M 1 5 l 4 -4 l 4 4 l -4 4 l -4 -4")
    
    } else {
        e = document.createElementNS(SVGNamespaceURI, "path")
        e.setAttribute("d", "M 1 3 L 3 1 M 1 5 L 5 1 M 1 7 L 7 1 M 1 9 L 9 1 M 3 9 L 9 3 M 5 9 L 9 5 M 7 9 L 9 7")
    }
    e.classList.add("token")
    e.classList.add(token.symbol)
    e.classList.add(token.color)

    return e
}