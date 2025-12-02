import * as wecco from "@weccoframework/core"
import { expandOverlay } from "d20-tools/common/components/expand_overlay"
import { appShell } from "../../common/components/appShell"
import { m } from "../../common/i18n"
import { ResizeGrid, ClearGrid, DecZoom, IncZoom, Message, SelectTool, UpdateLabel, ScrollTo } from "../controller/controller"
import { Colors, Editor, isWallSymbol, Model, ScrollPosition, TokenSymbols, Viewer, WallSymbol, WallSymbols } from "../models/models"
import { showLoadDialog } from "./dialogs/loadgrid"
import { showShareDialog } from "./dialogs/shrare"
import { downloadGridAsPNG, gridContent } from "./gridContent"
import { isAuthenticated } from "d20-tools/common/components/auth"
import { isSafari } from "d20-tools/common/browser"

export function root({model, emit}: wecco.ViewContext<Model, Message>): wecco.ElementUpdate {
    let body: wecco.ElementUpdate

    if (model instanceof Editor) {
        body = editor(model, emit)
    } else {
        body = viewer(model, emit)
    }

    return appShell(body, "grid")
}

function viewer(model: Viewer, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    return wecco.html`
        <div class="topnav">
            <div class="container-fluid">
                <div class="mt-4 d-flex flex-row">
                    <div class="flex-grow-1 me-2">
                        <h1>${model.gameGrid.label}</h1>
                    </div>

                    <div class="me-2">
                        <div>
                            <div class="btn-group">
                                ${zoomActions(emit)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        ${gridWithWrapper(model, emit)}
    `
}

function gridWithWrapper(model: Editor | Viewer, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    const onScrollEnd = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        console.log("on scrollend", e)

        const t = e.target! as HTMLElement
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((t as any).programmaticScroll) {
            console.log("not handling scroll event as scrolling is programmatic");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (t as any).programmaticScroll = false
            return
        }

        console.log("handling scroll event");
        emit(new ScrollTo(new ScrollPosition(t.scrollTop, t.scrollLeft)))
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let onScroll = (e:Event) => {}

    if (isSafari()) {
        console.log("safari detected: polyfilling scrollend")
        // polyfill the scrollend event
        let timer: number

        onScroll = (e:Event) => {
            clearTimeout(timer)
            timer = setTimeout(() => e.target?.dispatchEvent(new Event("scrollend")), 120)
        }
    }

    return wecco.html`
        <div class="grid-wrapper" @scrollend=${onScrollEnd} @scroll=${onScroll} @update=${(e: Event) => {
            if (model.scrollPosition.isZero) {
                return
            }

            console.log("grid updated; scrolling to last position")
            requestAnimationFrame(() => {
                const t = e.target! as HTMLElement
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (t as any).programmaticScroll = true                
                t.scrollTo({
                    ...model.scrollPosition,
                    behavior: "instant",
                })
            })
        }}>
            ${gridContent(emit, model)}
        </div>    
    `
}

function editor(model: Editor, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    function notifyGridSizeChanged(cols: number, rows: number) {
        emit(new ResizeGrid(cols, rows))
    }

    return wecco.html`
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
                                ${zoomActions(emit)}
                                ${actionsMenu(model, emit)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        ${gridWithWrapper(model, emit)}
    `
}

function zoomActions(emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    return wecco.html`
        <button class="btn" @click=${() => emit(new DecZoom())}><i class="material-icons mr-1">zoom_out</i></button>
        <button class="btn" @click=${() => emit(new IncZoom())}><i class="material-icons mr-1">zoom_in</i></button>    
    `
}

function actionsMenu(model: Model, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    let actions = [
        wecco.html`<button class="btn" @click=${() => emit(new ClearGrid())} title=${m("gameGrid.actions.delete")}><span class="material-icons">add</span></button>`,
        wecco.html`<button class="btn" @click=${downloadGridAsPNG} title=${m("gameGrid.actions.download")}><span class="material-icons mr-1">image</span></button>`
    ]
    
    if (isAuthenticated()) {
        actions = actions.concat(
            wecco.html`<button class="btn" @click=${() => showShareDialog(model.gameGrid)} title=${m("gameGrid.actions.share")}><span class="material-icons mr-1">share</span></button>`,
            wecco.html`<button class="btn" @click=${showLoadDialog.bind(null, emit)} title=${m("gameGrid.actions.load")}><span class="material-icons mr-1">file_open</span></button>`,
        )
    }

    return actions
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
