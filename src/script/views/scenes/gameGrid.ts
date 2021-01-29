import * as wecco from "@wecco/core"
import { m } from "src/script/utils/i18n"
import { Message, PlaceToken, SelectToken, ShowGameGrid } from "../../controller"
import { GameGrid, Token, TokenColors, TokenSymbols, TokenColor, TokenSymbol } from "../../models"
import { appShell } from "../components/appShell"

const SVGNamespaceURI = "http://www.w3.org/2000/svg"

function svg(literals: TemplateStringsArray, ...placeholders: string[]): wecco.ElementUpdate {
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
    const updateSvgTransform = (svg: SVGElement) => {
        const windowHeight = window.innerHeight
        svg.style.height = `${windowHeight - svg.getBoundingClientRect().top - 5}px`
       
        const width = svg.getBoundingClientRect().width
        const height = svg.getBoundingClientRect().height
   
        const gridSize = Math.min(width / model.cols, height / model.rows)
    
        const offsetX = (width - gridSize * model.cols) / 2
        const offsetY = (height - gridSize * model.rows) / 2
    
        svg.querySelector("g")?.setAttribute("transform", `translate(${offsetX} ${offsetY}), scale(${gridSize / 10} ${gridSize / 10})`)
    }

    const mountSvg = (svg: SVGElement) => {
        window.addEventListener("resize", () => {
            if (!svg.isConnected) {
                return
            }
            updateSvgTransform(svg)
        })

        svg.addEventListener("click", (e: MouseEvent) => {
            const bcr = svg.getBoundingClientRect()
            const width = bcr.width
            const height = bcr.height

            const cols = model.cols
            const rows = model.rows
        
            const gridSize = Math.min(width / cols, height / rows)
        
            const offsetX = (width - gridSize * cols) / 2
            const offsetY = (height - gridSize * rows) / 2

            const targetCol = Math.floor((e.clientX - bcr.left - offsetX) / gridSize)
            const targetRow = Math.floor((e.clientY - bcr.top - offsetY) / gridSize)

            if (targetCol >= model.cols || targetRow >= model.rows) {
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

    const notifyGridSizeChanged = (cols: number, rows: number) => {
        context.emit(new ShowGameGrid(new GameGrid(cols, rows)))
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
        l.setAttribute("transform", `translate(${i * 10 - 5} 2)`)
        svgContent.push(l)
    }

    for (let i = 1; i < model.rows + 1; i++) {
        const l = createLegendElement(String.fromCharCode("A".charCodeAt(0) + (i - 1)))
        l.setAttribute("transform", `translate(2 ${i * 10 - 5})`)
        svgContent.push(l)
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
                    <select class="form-select symbol-selector ${model.selectedToken.symbol}" @change=${(e: InputEvent) => {
                        const selectedSymbol = (e.target as HTMLSelectElement).selectedOptions[0]?.getAttribute("data-symbol") as TokenSymbol ?? "dashes"
                        context.emit(new SelectToken(new Token(selectedSymbol, model.selectedToken.color)))
                    }}>
                        ${TokenSymbols.map(s => wecco.html`
                            <option ?selected=${s === model.selectedToken.symbol} class="symbol-selector ${s}" data-symbol=${s}>${m("gameGrid.symbol." + s)}</option>
                        `)}                    
                    </select>
                </div>

                <div class="col">
                    <select class="form-select color-selector ${model.selectedToken.color}" @change=${(e: InputEvent) => {
                        const selectedColor = (e.target as HTMLSelectElement).selectedOptions[0]?.getAttribute("data-color") as TokenColor ?? "grey"
                        context.emit(new SelectToken(new Token(model.selectedToken.symbol, selectedColor)))
                    }}>
                        ${TokenColors.map(c => wecco.html`
                            <option ?selected=${c === model.selectedToken.color} class="color-selector ${c}" data-color=${c}>${m("gameGrid.color." + c)}</option>
                        `)}                    
                    </select>
                </div>

                <div class="col">
                    <button class="btn btn-primary d-flex justify-content-center align-content-between" @click=${() => {
                        document.body.requestFullscreen()
                    }}><i class="material-icons mr-1">fullscreen</i></button>
                </div>
            </div>
        </div>
        <div class="container-fluid game-grid">
            <div class="row mt-2">
                <div class="col">
                    <svg xmlns="http://www.w3.org/2000/svg" @mount=${mountSvg}>
                        <g>
                            ${svgContent}
                        </g>
                    </svg>
                </div>
            </div>        
        </div>
    `

    return appShell(context, body)
}

function createLegendElement(label: string): SVGElement {
    const g = document.createElementNS(SVGNamespaceURI, "g")

    const circle = document.createElementNS(SVGNamespaceURI, "circle")
    circle.setAttribute("cx", "0")
    circle.setAttribute("cy", "0")
    circle.setAttribute("r", "1.5")
    g.appendChild(circle)

    const text = document.createElementNS(SVGNamespaceURI, "text")
    text.setAttribute("x", "0")
    text.setAttribute("y", "0")
    text.appendChild(document.createTextNode(label))        
    g.appendChild(text)

    g.classList.add("legend")

    return g
}

function createTokenElement (token: Token): SVGElement {
    let e: SVGElement
    if (token.symbol === "circle") {
        e = document.createElementNS(SVGNamespaceURI, "circle")
        e.setAttribute("cx", "5")
        e.setAttribute("cy", "5")
        e.setAttribute("r", "4")
    } else if (token.symbol == "cross") {
        e = document.createElementNS(SVGNamespaceURI, "path")
        e.setAttribute("d", "M 1 1 l 8 8 m -8 0 l 8 -8")
    } else {
        e = document.createElementNS(SVGNamespaceURI, "path")
        e.setAttribute("d", "M 1 3 L 3 1 M 1 5 L 5 1 M 1 7 L 7 1 M 1 9 L 9 1 M 3 9 L 9 3 M 5 9 L 9 5 M 7 9 L 9 7")
    }
    e.classList.add("token")
    e.classList.add(token.symbol)
    e.classList.add(token.color)

    return e
}