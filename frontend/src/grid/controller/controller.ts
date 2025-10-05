import * as wecco from "@weccoframework/core"
import { Browser } from "../../common/browser"
import { Color, Colors, DefaultZoomLevel, GameGrid, Model, Token, TokenSymbols, Tool, Wall, WallPosition } from "../models/models"
import { loadGameGrid, saveGameGrid } from "../store"

export class LoadGrid {
    readonly command = "load-grid"

    constructor(public readonly id: string) {}
}

export class ChangeGrid {
    readonly command = "change-grid"

    constructor(public readonly cols = 20, public readonly rows = 10) {}
}

export class UpdateLabel {
    readonly command = "update-label"

    constructor(public readonly label: string) {}
}

export class SelectTool {
    readonly command = "select-tool"

    constructor(public readonly color: Color, public readonly tool: Tool) {}
}

export class PlaceToken {
    readonly command = "place-token"

    constructor(public readonly col: number, public readonly row: number, public readonly token: Token) { }
}

export class PlaceWall {
    readonly command = "place-wall"

    constructor(public readonly col: number, public readonly row: number, public readonly position: WallPosition, public readonly wall: Wall) {}
}

export class PlaceBackground {
    readonly command = "place-background"

    constructor(public readonly col: number, public readonly row: number, public readonly color: Color) {}
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

// --

export type Message = LoadGrid | ChangeGrid | UpdateLabel | PlaceToken | PlaceWall | PlaceBackground | SelectTool | ClearGrid | IncZoom | DecZoom 

export async function update({model, message}: wecco.UpdaterContext<Model, Message>): Promise<Model> {
    const updated = await applyUpdate(model, message)
    
    if (updated.gameGrid.isEmpty) {
        Browser.urlHash = ""
        return updated
    }
    
    await saveGameGrid(updated.gameGrid)
    Browser.urlHash = `edit:${updated.gameGrid.id}`
    
    return updated
}

async function applyUpdate(model: Model, message: Message): Promise<Model> {
    switch (message.command) {
        case "load-grid":
            return loadGameGrid(message.id)
                .then(g => {
                    return new Model(g, Colors[0], TokenSymbols[0], DefaultZoomLevel)
                })

        case "change-grid":
            return new Model(model.gameGrid.resize(message.cols, message.rows), model.color, model.tool, model.zoomLevel)

        case "update-label":
            model.gameGrid.setLabel(message.label)
            break

        case "place-token": {
            const t = model.gameGrid.tokenAt(message.col, message.row)
            if (typeof t !== "undefined") {                
                model
                    .selectColorAndTool(t.color, t.symbol)
                    .setLastRemovedToken([message.col, message.row])
                    .gameGrid.removeTokenAt(message.col, message.row)
            } else {
                model
                    .clearLastRemovedToken()
                    .gameGrid.setTokenAt(message.col, message.row, message.token)
            }

            break                       
        }

        case "place-wall": {
            const w = model.gameGrid.wallAt(message.col, message.row, message.position)
            if (typeof w !== "undefined") {                
                model
                    .selectColorAndTool(w.color, w.symbol)
                    .gameGrid.removeWallAt(message.col, message.row, message.position)
            } else {
                model.gameGrid.setWallAt(message.col, message.row, message.position, message.wall)
            }
            
            break
        }

        case "place-background": {
            const bg = model.gameGrid.backgroundAt(message.col, message.row)
            if (typeof bg !== "undefined") {                
                model
                    .selectColorAndTool(bg, "background")
                    .gameGrid.removeBackgroundAt(message.col, message.row)
            } else {
                model.gameGrid.setBackgroundAt(message.col, message.row, message.color)
            }
            
            break
        }

        case "select-tool":
            return model
                .selectColorAndTool(message.color, message.tool)
                .clearLastRemovedToken()

        case "clear-grid":
            return new Model(GameGrid.createInitial(model.gameGrid.cols, model.gameGrid.rows), Colors[0], TokenSymbols[0], DefaultZoomLevel)

        case "dec-zoom":
            return model.decreaseZoom()

        case "inc-zoom":
            return model.increaseZoom()
    }

    return model
}
