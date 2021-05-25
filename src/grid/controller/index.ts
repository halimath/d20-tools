import * as wecco from "@weccoframework/core"
import { GameGrid, GameGridInfo, Model, Token, TokenColor, TokenSymbol, Wall, WallPosition, WallSymbol } from "../models"
import { loadGameGrid, saveGameGrid } from "../store"
import { Browser } from "../../common/browser"

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

export class SelectToken {
    readonly command = "select-token"

    constructor(public readonly color: TokenColor, public readonly tokenSymbol: TokenSymbol, public readonly wallSymbol: WallSymbol) {}
}

export class PlaceToken {
    readonly command = "place-token"

    constructor(public readonly col: number, public readonly row: number, public readonly token?: Token) { }
}

export class PlaceWall {
    readonly command = "place-wall"

    constructor(public readonly col: number, public readonly row: number, public readonly position: WallPosition, public readonly wall: Wall) {}
}

export class ClearGrid {
    readonly command = "clear-grid"
}

export class TogglePresentationMode {
    readonly command = "toggle-presentation-mode"
}

// --

export type Message = LoadGrid | ChangeGrid | UpdateLabel | PlaceToken | PlaceWall | SelectToken | ClearGrid | TogglePresentationMode

export function update(model: Model, message: Message, context: wecco.AppContext<Message>): Model | Promise<Model> {
    const updated = applyUpdate(model, message)
    
    if (updated instanceof Model) {
        if (updated.gameGrid.isEmpty) {
            Browser.urlHash = ""
        } else {
            saveGameGrid(updated.gameGrid)
                .catch(e => {
                    // TODO: Emit error message
                    console.error(e)
                })
            Browser.urlHash = updated.gameGrid.id
        }
    }
    
    return updated
}

function applyUpdate(model: Model, message: Message): Model | Promise<Model> {
    switch (message.command) {
        case "load-grid":
            return loadGameGrid(message.id)
                .then(g => new Model(g, false))

        case "change-grid":
            return new Model(GameGrid.createInitial(message.cols, message.rows), false)

        case "update-label":
            model.gameGrid.setLabel(message.label)
            break

        case "place-token": {
            const t = model.gameGrid.tokenAt(message.col, message.row)
            if (typeof t !== "undefined") {                
                model.gameGrid
                    .setTokenAt(message.col, message.row, undefined)
                    .select(t.color, t.symbol, model.gameGrid.wallSymbol)
            } else {
                model.gameGrid.setTokenAt(message.col, message.row, message.token)
            }

            break                       
        }

        case "place-wall": {
            const w = model.gameGrid.wallAt(message.col, message.row, message.position)
            if (typeof w !== "undefined") {                
                model.gameGrid
                    .setWallAt(message.col, message.row, message.position, undefined)
                    .select(w.color, model.gameGrid.tokenSymbol, w.symbol)
            } else {
                model.gameGrid.setWallAt(message.col, message.row, message.position, message.wall)
            }
            
            break
        }

        case "select-token":
            model.gameGrid.select(message.color, message.tokenSymbol, message.wallSymbol)
            break

        case "clear-grid":
            return new Model(GameGrid.createInitial(model.gameGrid.cols, model.gameGrid.rows), false)

        case "toggle-presentation-mode":
            model.togglePresentationMode()
            break
    }

    return model
}
