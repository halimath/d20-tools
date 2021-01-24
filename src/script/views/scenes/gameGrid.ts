import * as wecco from "@wecco/core"
import { m } from "src/script/utils/i18n"
import { Message, PlaceToken, SelectToken, ShowGameGrid } from "../../controller"
import { GameGrid, Token, TokenColors, TokenSymbols, TokenColor, TokenSymbol } from "../../models"
import { appShell } from "../components/appShell"

const SVGNamespaceURI = "http://www.w3.org/2000/svg"

export function gameGrid(context: wecco.AppContext<Message>, model: GameGrid): wecco.ElementUpdate {
    let svgElement: SVGElement
    const mountSvg = (svg: SVGElement) => {
        window.addEventListener("resize", () => {
            if (!svgElement.isConnected) {
                return
            }
            mountSvg(svgElement)            
        })

        document.addEventListener("keypress", (e: KeyboardEvent) => {
            if (e.key === "+") {
                context.emit(new SelectToken(new Token("cross", model.selectedToken.color)))
                return
            }
            if (e.key === "/") {
                context.emit(new SelectToken(new Token("dashes", model.selectedToken.color)))
                return
            }
            if (e.key === "*") {
                context.emit(new SelectToken(new Token("circle", model.selectedToken.color)))
                return
            }

            const index = e.key.charCodeAt(0) - "1".charCodeAt(0)
            if (index >= 0 && index < TokenColors.length) {
                context.emit(new SelectToken(new Token(model.selectedToken.symbol, TokenColors[index])))
            }
        })

        svgElement = svg
        updateGameGrid(model, svgElement)
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

            console.log(targetCol, targetRow)

            if (targetCol >= model.cols || targetRow >= model.rows) {
                return
            }

            if (typeof model.tokenAt(targetCol, targetRow) === "undefined") {
                context.emit(new PlaceToken(targetCol, targetRow, model.selectedToken))
            } else {
                context.emit(new PlaceToken(targetCol, targetRow))
            }
        })
    }

    const notifyGridSizeChanged = (cols: number, rows: number) => {
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
                    <select class="form-select symbol-selector ${model.selectedToken.symbol}" @change=${(e: InputEvent) => {
                        const selectedSymbol = (e.target as HTMLSelectElement).selectedOptions[0]?.getAttribute("data-symbol") as TokenSymbol ?? "dashes"
                        context.emit(new SelectToken(new Token(selectedSymbol, model.selectedToken.color)))
                    }}>
                        ${TokenSymbols.map((s, idx) => wecco.html`
                            <option ?selected=${s === model.selectedToken.symbol} class="symbol-selector ${s}" data-symbol=${s}>${m("gameGrid.symbol." + s)}</option>
                        `)}                    
                    </select>
                </div>

                <div class="col">
                    <select class="form-select color-selector ${model.selectedToken.color}" @change=${(e: InputEvent) => {
                        const selectedColor = (e.target as HTMLSelectElement).selectedOptions[0]?.getAttribute("data-color") as TokenColor ?? "grey"
                        context.emit(new SelectToken(new Token(model.selectedToken.symbol, selectedColor)))
                    }}>
                        ${TokenColors.map((c, idx) => wecco.html`
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
                    <svg xmlns="http://www.w3.org/2000/svg" @mount=${mountSvg}></svg>
                </div>
            </div>        
        </div>
    `

    return appShell(context, body)
}

function updateGameGrid (model: GameGrid, svg: SVGElement) {
    const windowHeight = window.innerHeight
    svg.style.height = `${windowHeight - svg.getBoundingClientRect().top - 5}px`

    while (svg.childNodes.length > 0) {
        svg.removeChild(svg.childNodes[0])
    }

    const width = svg.getBoundingClientRect().width
    const height = svg.getBoundingClientRect().height

    const rect = document.createElementNS(SVGNamespaceURI, "rect")
    rect.setAttribute("x", "0")
    rect.setAttribute("y", "0")
    rect.setAttribute("width", `${width}`)
    rect.setAttribute("height", `${height}`)
    rect.classList.add("canvas")
    svg.appendChild(rect)

    const cols = model.cols
    const rows = model.rows

    const gridSize = Math.min(width / cols, height / rows)

    const offsetX = (width - gridSize * cols) / 2
    const offsetY = (height - gridSize * rows) / 2

    // Paint tokens first to allow painting the grid and coordinates over the tokens
    for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
            const token = model.tokenAt(col, row)
            if (typeof token !== "undefined") {
                const e = createTokenElement(token)
                e.setAttribute("transform", `translate(${offsetX + col*gridSize} ${offsetY + row*gridSize}) scale(${gridSize/10} ${gridSize/10})`)
                svg.appendChild(e)
            }
        }
    }

    for (let i = 1; i < cols; i++) {
        const line = document.createElementNS(SVGNamespaceURI, "line")
        line.setAttribute("x1", `${offsetX + i * gridSize}`)
        line.setAttribute("y1", `${offsetY}`)
        line.setAttribute("x2", `${offsetX + i * gridSize}`)
        line.setAttribute("y2", `${height - offsetY}`)
        line.classList.add("grid-line")
        svg.appendChild(line)
    }

    for (let i = 1; i < cols + 1; i++) {
        const l = createLlegendElement(i.toString())
        l.setAttribute("transform", `translate(${offsetX + (i-1) * gridSize + gridSize / 2} ${offsetY + 30})`)
        svg.appendChild(l)
    }

    for (let i = 1; i < rows; i++) {
        const line = document.createElementNS(SVGNamespaceURI, "line")
        line.setAttribute("x1", `${offsetX}`)
        line.setAttribute("y1", `${offsetY + i * gridSize}`)
        line.setAttribute("x2", `${width - offsetX}`)
        line.setAttribute("y2", `${offsetY + i * gridSize}`)
        line.classList.add("grid-line")
        svg.appendChild(line)
    }

    for (let i = 1; i < rows + 1; i++) {
        const l = createLlegendElement(String.fromCharCode("A".charCodeAt(0) + (i - 1)))
        l.setAttribute("transform", `translate(${offsetX + 30} ${offsetY + (i - 1) * gridSize + gridSize/2})`)
        svg.appendChild(l)
    }    
}

function createLlegendElement(label: string): SVGElement {
    const g = document.createElementNS(SVGNamespaceURI, "g")

    const circle = document.createElementNS(SVGNamespaceURI, "circle")
    circle.setAttribute("cx", "0")
    circle.setAttribute("cy", "0")
    circle.setAttribute("r", "20")
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