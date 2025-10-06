import * as wecco from "@weccoframework/core"
import { expandOverlay } from "d20-tools/common/components/expand_overlay"
import { appShell } from "../../common/components/appShell"
import { m } from "../../common/i18n"
import { ChangeGrid, ClearGrid, DecZoom, IncZoom, Message, SelectTool, UpdateLabel } from "../controller/controller"
import { Colors, isWallSymbol, Model, TokenSymbols, WallSymbol, WallSymbols } from "../models/models"
import { showLoadDialog } from "./dialogs/loadgrid"
import { showShareDialog } from "./dialogs/shrare"
import { downloadGridAsPNG, gridContent } from "./gridContent"

export function root({model, emit}: wecco.ViewContext<Model, Message>): wecco.ElementUpdate {
    function notifyGridSizeChanged(cols: number, rows: number) {
        emit(new ChangeGrid(cols, rows))
    }

    const body = wecco.html`
        <div class="topnav">
            <div class="container-fluid">
                <div class="mt-4 d-flex flex-row">
                    <div class="flex-grow-1 me-2">
                        <input type="text" class="form-control" placeholder="Label" .value=${model.gameGrid.label} @change=${(e: InputEvent) => emit(new UpdateLabel((e.target as HTMLInputElement).value.trim()))}>
                    </div>

                    <div class="me-2">
                        <div class="input-group">
                            <input type="number" min="2" max="90" class="form-control col-5" value=${model.gameGrid.cols} @change=${(e: InputEvent) => {
                                const value = (e.target as HTMLInputElement).value
                                notifyGridSizeChanged(parseInt(value), model.gameGrid.rows)
                            }}>
                            <span class="input-group-text col-2">x</span>
                            <input type="number" min="2" max="90" class="form-control col-5" value=${model.gameGrid.rows} @change=${(e: InputEvent) => {
                                const value = (e.target as HTMLInputElement).value
                                notifyGridSizeChanged(model.gameGrid.cols, parseInt(value))
                            }}>
                        </div>
                    </div>

                    <div class="me-2">
                        ${expandOverlay({
                            expanded: wecco.html`
                                <div class="btn-toolbar flex-nowrap">
                                    <div class="btn-group">
                                        ${TokenSymbols.map(s => wecco.html`
                                            <button 
                                                @click=${() => emit(new SelectTool(model.color, s))} 
                                                class="btn ${s === model.tool ? "btn-secondary" : "btn-outline-secondary"} symbol-selector ${s}">
                                                ${s}
                                            </button>
                                        `)}
                                    </div>

                                    <div class="btn-group ms-1">
                                        ${WallSymbols.map(s => wecco.html`
                                            <button 
                                                @click=${() => emit(new SelectTool(model.color, s))} 
                                                class="btn ${s === model.tool ? "btn-secondary" : "btn-outline-secondary"} symbol-selector ${s}">
                                                ${wallSymbolButtonLabel(s)}
                                            </button>
                                        `)}
                                    </div>

                                    <div class="btn-group ms-1">
                                        <button 
                                                @click=${() => emit(new SelectTool(model.color, "background"))} 
                                                class="btn ${model.tool === "background" ? "btn-secondary" : "btn-outline-secondary"} symbol-selector background">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10">
                                                    <use href="#background" class="token wall-symbol"/>
                                                </svg>
                                            </button>
                                    </div>
                                </div>`,
                                collapsed: wecco.html`<div class="btn btn-outline-secondary symbol-selector selected">
                                    ${
                                        model.tool === "background"
                                        ? wecco.html`<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 10 10"><use href="#background" class="token wall-symbol"/></svg>`
                                        : isWallSymbol(model.tool)
                                            ? wallSymbolButtonLabel(model.tool)
                                            : model.tool
                                    }

                                </div>`
                            })}
                            ${expandOverlay({
                                expanded: wecco.html`
                                    <div class="btn-group ms-1">
                                    ${
                                        Colors.map(c => wecco.html`
                                        <button 
                                            @click=${() => emit(new SelectTool(c, model.tool))} 
                                            class="btn btn-outline-secondary color-selector ${c} ${c === model.color ? "selected" : ""}"
                                            aria-label="${m("gameGrid.color." + c)}">
                                            &nbsp;x&nbsp;
                                        </button>
                                        `)
                                    }
                                    </div>                                
                                `,
                                collapsed: wecco.html`
                                    <div class="btn btn-outline-secondary color-selector ${model.color} selected">&nbsp;&nbsp;&nbsp;</div>
                                `
                            })}
                        </div>                        

                        <div>
                            <div class="btn-group">
                                <button class="btn btn-outline-secondary" @click=${() => emit(new DecZoom())}><i class="material-icons mr-1">zoom_out</i></button>
                                <button class="btn btn-outline-secondary" @click=${() => emit(new IncZoom())}><i class="material-icons mr-1">zoom_in</i></button>
                                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="material-icons">more_horiz</i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" @click=${downloadGridAsPNG}><i class="material-icons mr-1">downloading</i> ${m("gameGrid.actions.download")}</a></li>
                                    <li><a class="dropdown-item" @click=${() => showShareDialog(model.gameGrid)}><i class="material-icons mr-1">link</i> ${m("gameGrid.actions.share")}</a></li>
                                    <li><a class="dropdown-item" @click=${() => emit(new ClearGrid())}><i class="material-icons" >delete</i> ${m("gameGrid.actions.delete")}</a></li>
                                    <li><a class="dropdown-item" @click=${showLoadDialog.bind(null, emit)}><i class="material-icons mr-1">file_open</i> ${m("gameGrid.actions.load")}</a></li>
                                </ul>
                            </div>                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid-wrapper">
            ${gridContent(emit, model)}
        </div>
    `

    return appShell(body, "grid")
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
