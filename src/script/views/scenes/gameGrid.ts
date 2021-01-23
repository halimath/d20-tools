import * as wecco from "@wecco/core"
import { Message, ShowGameGrid } from "../../controller"
import { GameGrid } from "../../models"
import { appShell } from "../components/appShell"

const SVGNamespaceURI = "http://www.w3.org/2000/svg"

export function gameGrid(context: wecco.AppContext<Message>, model: GameGrid): wecco.ElementUpdate {
    let svgElement: SVGElement
    const paintGrid = (svg: SVGElement) => {
        window.addEventListener("resize", () => {
            if (!svgElement.isConnected) {
                return
            }
            paintGrid(svgElement)            
        })
        svgElement = svg
        updateGameGrid(model, svgElement)
    }

    const updateGridSize = (cols: number, rows: number) => {
        context.emit(new ShowGameGrid(cols, rows))
    }

    const body = wecco.html`
        <div class="container game-grid">
            <div class="row mt-4">
                <div class="col input-group">
                    <span class="input-group-text">Cols</span>
                    <input type="number" min="2" max="30" class="form-control me-2" value=${model.cols} @change=${(e: InputEvent) => {
                        const value = (e.target as HTMLInputElement).value
                        updateGridSize(parseInt(value), model.rows)
                    }}>
                </div>
                <div class="col input-group">
                    <span class="input-group-text">Rows</span>
                    <input type="number" min="2" max="30" class="form-control me-2" value=${model.rows} @change=${(e: InputEvent) => {
                        const value = (e.target as HTMLInputElement).value
                        updateGridSize(model.cols, parseInt(value))
                    }}>
                </div>
                <div class="col">
                    <button class="btn btn-primary d-flex justify-content-center align-content-between" @click=${() => {
                        svgElement.requestFullscreen()
                    }}><i class="material-icons mr-1">fullscreen</i></button>
                </div>
            </div>
        </div>
        <div class="container-fluid game-grid">
            <div class="row mt-2">
                <div class="col">
                    <svg xmlns="http://www.w3.org/2000/svg" @mount=${paintGrid}></svg>
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
    svg.appendChild(rect)

    const cols = model.cols
    const rows = model.rows

    const gridSize = Math.min(width / cols, height / rows)

    const offsetX = (width - gridSize * cols) / 2
    const offsetY = (height - gridSize * rows) / 2

    for (let i = 1; i < cols; i++) {
        const line = document.createElementNS(SVGNamespaceURI, "line")
        line.setAttribute("x1", `${offsetX + i * gridSize}`)
        line.setAttribute("y1", `${offsetY}`)
        line.setAttribute("x2", `${offsetX + i * gridSize}`)
        line.setAttribute("y2", `${height - offsetY}`)
        svg.appendChild(line)
    }

    for (let i = 1; i < cols + 1; i++) {
        const text = document.createElementNS(SVGNamespaceURI, "text")
        text.setAttribute("x", `${offsetX + (i - 1) * gridSize + gridSize / 2}`)
        text.setAttribute("y", `${offsetY + gridSize / 5}`)
        text.appendChild(document.createTextNode(`${i}`))
        svg.appendChild(text)
    }

    for (let i = 1; i < rows; i++) {
        const line = document.createElementNS(SVGNamespaceURI, "line")
        line.setAttribute("x1", `${offsetX}`)
        line.setAttribute("y1", `${offsetY + i * gridSize}`)
        line.setAttribute("x2", `${width - offsetX}`)
        line.setAttribute("y2", `${offsetY + i * gridSize}`)
        svg.appendChild(line)
    }

    for (let i = 1; i < rows + 1; i++) {
        const text = document.createElementNS(SVGNamespaceURI, "text")
        text.setAttribute("x", `${offsetX}`)
        text.setAttribute("y", `${offsetY + gridSize / 2 + (i - 1) * gridSize}`)
        text.appendChild(document.createTextNode(String.fromCharCode("A".charCodeAt(0) + (i - 1))))
        svg.appendChild(text)
    }
}