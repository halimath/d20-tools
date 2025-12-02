import * as wecco from "@weccoframework/core"
import { setLastPathElement } from "../../common/browser"
import { Color, Colors, DefaultZoomLevel, Editor, GameGrid, Model, ScrollPosition, Token, TokenSymbols, Tool, Viewer, Wall, WallPosition } from "../models/models"
import { isAuthenticated } from "d20-tools/common/components/auth"
import { createGrid, loadGrid, updateGrid } from "../api/api"

export class LoadGrid {
    readonly command = "load-grid"

    constructor(public readonly id: string) { }
}

export class ResizeGrid {
    readonly command = "resize-grid"

    constructor(public readonly cols = 20, public readonly rows = 10) { }
}

export class UpdateLabel {
    readonly command = "update-label"

    constructor(public readonly label: string) { }
}

export class SelectTool {
    readonly command = "select-tool"

    constructor(public readonly color: Color, public readonly tool: Tool) { }
}

export class PlaceToken {
    readonly command = "place-token"

    constructor(public readonly col: number, public readonly row: number, public readonly token: Token) { }
}

export class PlaceWall {
    readonly command = "place-wall"

    constructor(public readonly col: number, public readonly row: number, public readonly position: WallPosition, public readonly wall: Wall) { }
}

export class PlaceBackground {
    readonly command = "place-background"

    constructor(public readonly col: number, public readonly row: number, public readonly color: Color) { }
}

export class ClearGrid {
    readonly command = "clear-grid"
}

export class IncZoom {
    readonly command = "inc-zoom"
}

export class DecZoom {
    readonly command = "dec-zoom"
}

export class ScrollTo {
    readonly command = "scroll-to"

    constructor (public readonly position: ScrollPosition) {}
}

export class GridRemoteUpdate {
    readonly command = "grid-remote-update"

    constructor(public readonly grid: GameGrid) {}
}

// --

export type Message = LoadGrid | ResizeGrid | UpdateLabel | PlaceToken | PlaceWall | PlaceBackground 
    | SelectTool | ClearGrid | IncZoom | DecZoom | ScrollTo | GridRemoteUpdate

export async function update({ model, message }: wecco.UpdaterContext<Model, Message>): Promise<Model> {
    const updated = await applyUpdate(model, message)

    if (updated.gameGrid.isEmpty) {
        return updated
    }

    if (!(updated instanceof Editor)) {
        return updated
    }

    if (isAuthenticated()) {    
        if (updated.gameGrid.id) {
            await updateGrid(updated.gameGrid)
        } else  {
            updated.gameGrid.id = await createGrid(updated.gameGrid)
        }
        setLastPathElement(`edit:${updated.gameGrid.id}`)
    } else {
        // Anonymous usage; put the descriptor into the url
        setLastPathElement(updated.gameGrid.descriptor)
    }

    return updated
}

async function applyUpdate(model: Model, message: Message): Promise<Model> {
    switch (message.command) {
        case "load-grid":
            return loadGrid(message.id)
                .then(g => {
                    return new Editor(g, DefaultZoomLevel, new ScrollPosition(0, 0), Colors[0], TokenSymbols[0])
                })

        case "resize-grid":
            if (!(model instanceof Editor)) {
                return model
            }

            return new Editor(model.gameGrid.resize(message.cols, message.rows), model.zoomLevel, model.scrollPosition, model.color, model.tool)

        case "update-label":
            if (!(model instanceof Editor)) {
                return model
            }

            model.gameGrid.setLabel(message.label)
            break

        case "place-token": {
            if (!(model instanceof Editor)) {
                return model
            }

            const t = model.gameGrid.tokenAt(message.col, message.row)
            if (typeof t !== "undefined") {
                model.selectColorAndTool(t.color, t.symbol)
                model.setLastRemovedToken([message.col, message.row])
                model.gameGrid.removeTokenAt(message.col, message.row)
            } else {
                model.clearLastRemovedToken()
                model.gameGrid.setTokenAt(message.col, message.row, message.token)
            }

            break
        }

        case "place-wall": {
            if (!(model instanceof Editor)) {
                return model
            }

            const w = model.gameGrid.wallAt(message.col, message.row, message.position)
            if (typeof w !== "undefined") {
                model.selectColorAndTool(w.color, w.symbol)
                model.gameGrid.removeWallAt(message.col, message.row, message.position)
            } else {
                model.gameGrid.setWallAt(message.col, message.row, message.position, message.wall)
            }

            break
        }

        case "place-background": {
            if (!(model instanceof Editor)) {
                return model
            }

            const bg = model.gameGrid.backgroundAt(message.col, message.row)
            if (typeof bg !== "undefined") {
                model.selectColorAndTool(bg, "background")
                model.gameGrid.removeBackgroundAt(message.col, message.row)
            } else {
                model.gameGrid.setBackgroundAt(message.col, message.row, message.color)
            }

            break
        }

        case "select-tool":
            if (!(model instanceof Editor)) {
                return model
            }

            model.selectColorAndTool(message.color, message.tool)
            model.clearLastRemovedToken()
            return model

        case "clear-grid":
            if (!(model instanceof Editor)) {
                return model
            }

            return new Editor(GameGrid.createInitial(model.gameGrid.cols, model.gameGrid.rows), DefaultZoomLevel, new ScrollPosition(0, 0), Colors[0], TokenSymbols[0])

        case "dec-zoom":
            model.decreaseZoom()
            return model

        case "inc-zoom":
            model.increaseZoom()
            return model

        case "scroll-to":
            model.scrollPosition = message.position
            return model

        case "grid-remote-update":
            if (!(model instanceof Viewer)) {
                return model
            }
            console.log(`Updating viewed grid on remote update`)
            return new Viewer(message.grid, model.zoomLevel)
    }

    return model
}
