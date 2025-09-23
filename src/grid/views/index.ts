import * as wecco from "@weccoframework/core"
import { appShell } from "../../common/components/appShell"
import { m } from "../../common/i18n"
import { ChangeGrid, ClearGrid, DecZoom, IncZoom, Message, SelectToken, UpdateLabel } from "../controller"
import { Model, TokenColors, TokenColorUrlCharMapping, TokenSymbol, TokenSymbols, TokenSymbolUrlCharMapping, WallSymbol, WallSymbols } from "../models"
import { downloadGridAsPNG, gridContent } from "./gridContent"
import { showLoadDialog } from "./dialogs/loadgrid"
import { showShareDialog } from "./dialogs/shrare"

export function root({model, emit}: wecco.ViewContext<Model, Message>): wecco.ElementUpdate {
    function notifyGridSizeChanged(cols: number, rows: number) {
        emit(new ChangeGrid(cols, rows))
    }

    const body = wecco.html`
        <div class="topnav">
            <div class="container">
                <div class="row mt-4 justify-content-center">
                    <div class="col-4">
                        <input type="text" class="form-control" placeholder="Label" .value=${model.gameGrid.label} @change=${(e: InputEvent) => emit(new UpdateLabel((e.target as HTMLInputElement).value.trim()))}>
                    </div>
                    
                    <div class="col-2">
                        <div class="input-group">
                            <input type="number" min="2" max="90" class="form-control" value=${model.gameGrid.cols} @change=${(e: InputEvent) => {
                                const value = (e.target as HTMLInputElement).value
                                notifyGridSizeChanged(parseInt(value), model.gameGrid.rows)
                            }}>
                            <span class="input-group-text">x</span>
                            <input type="number" min="2" max="90" class="form-control" value=${model.gameGrid.rows} @change=${(e: InputEvent) => {
                                const value = (e.target as HTMLInputElement).value
                                notifyGridSizeChanged(model.gameGrid.cols, parseInt(value))
                            }}>
                        </div>
                    </div>

                    <div class="col-2">
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary" @click=${() => emit(new DecZoom())}><i class="material-icons mr-1">zoom_out</i></button>
                            <button class="btn btn-outline-secondary" @click=${() => emit(new IncZoom())}><i class="material-icons mr-1">zoom_in</i></button>
                            <button class="btn btn-outline-secondary" @click=${downloadGridAsPNG}><i class="material-icons mr-1">image</i></button>
                            <button class="btn btn-outline-secondary" @click=${() => showShareDialog(model.gameGrid)}><i class="material-icons mr-1">link</i></button>
                            <button class="btn btn-outline-danger"><i class="material-icons" @click=${() => emit(new ClearGrid())}>delete</i></button>
                            <button class="btn btn-outline-primary"><i class="material-icons mr-1" @click=${showLoadDialog.bind(null, emit)}>more_horiz</i></button>
                        </div>
                    </div>
                </div>                

                <div class="row mt-2 justify-content-center">
                    <div class="col-11 d-flex justify-content-center">
                        <div class="btn-toolbar">
                            <div class="btn-group">
                                ${TokenSymbols.map(s => wecco.html`
                                    <button 
                                        @click=${() => emit(new SelectToken(model.gameGrid.color, s, model.gameGrid.wallSymbol))} 
                                        accesskey=${TokenSymbolUrlCharMapping.get(s)}
                                        class="btn ${s === model.gameGrid.tokenSymbol ? "btn-secondary" : "btn-outline-secondary"} symbol-selector ${s}">
                                        ${s}
                                    </button>
                                `)}
                            </div>

                            <div class="btn-group ms-1">
                                ${WallSymbols.map(s => wecco.html`
                                    <button 
                                        @click=${() => emit(new SelectToken(model.gameGrid.color, model.gameGrid.tokenSymbol, s))} 
                                        class="btn ${s === model.gameGrid.wallSymbol ? "btn-secondary" : "btn-outline-secondary"} symbol-selector ${s}">
                                        ${wallSymbolButtonLabel(s)}
                                    </button>
                                `)}
                            </div>

                            <div class="btn-group ms-1">
                            ${
                                TokenColors.map(c => wecco.html`
                                <button 
                                    @click=${() => emit(new SelectToken(c, model.gameGrid.tokenSymbol, model.gameGrid.wallSymbol))} 
                                    accesskey=${TokenColorUrlCharMapping.get(c)}
                                    class="btn btn-outline-secondary color-selector ${c} ${c === model.gameGrid.color ? "selected" : ""}"
                                    aria-label="${m("gameGrid.color." + c)}">
                                    &nbsp;x&nbsp;
                                </button>
                                `)
                            }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid-wrapper">
            ${gridContent(emit, model.gameGrid, model.zoomLevel)}
        </div>
    `

    return appShell(body)
}

function wallSymbolButtonLabel(s: WallSymbol): wecco.ElementUpdate {
    if (s === "wall") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 1 l 8 0 M 1 3 l 8 0 M 1 5 l 8 0 M 1 7 l 8 0 M 3 3 l 0 2 M 7 3 l 0 2 M 5 5 l 0 2 M 5 1 l 0 2" class="wall-symbol"/>
            </svg>
        `
    }

    if (s === "door") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 8 l 0 -8 l 6 0 l 0 8 l -6 0 m 6 0 l -4 -2 l 0 -6" class="wall-symbol"/>
            </svg>
        `
    }

    if (s === "window") {
        return wecco.html`
            <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                <path d="M 1 1 l 0 8 l 8 0 l 0 -8 l -8 0 M 1 9 l 3 -2 l 0 -6 M 9 9 l -3 -2 l 0 -6" class="wall-symbol"/>
            </svg>
        `
    }

    return s
}

// function tokenSymbolButtonLabel(s: TokenSymbol): wecco.ElementUpdate {
//     if (s === "diamond") {
//         return wecco.html`
//             <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
//                 <use href="#token-diamond" class="token wall-symbol"/>
//             </svg>
//         `
//     }

//     if (s === "square") {
//         return wecco.html`
//             <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
//                 <use href="#token-square" class="token wall-symbol"/>
//             </svg>
//         `
//     }

//     if (s === "cross") {
//         return wecco.html`
//             <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
//                 <use href="#token-cross" class="token wall-symbol"/>
//             </svg>
//         `
//     }

//     if (s === "lines") {
//         return wecco.html`
//             <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
//                 <use href="#token-lines" class="token wall-symbol"/>
//             </svg>
//         `
//     }

//     if (s === "circle") {
//         return wecco.html`
//             <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
//                 <use href="#token-circle" class="token wall-symbol"/>
//             </svg>
//         `
//     }

//     throw `Missing button definition for ${s}`
// }

