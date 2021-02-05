import * as wecco from "@wecco/core"
import { GameGrid, Model, Token, TokenColor, TokenSymbol, Wall, WallPosition, WallSymbol } from "../models"
import { Browser } from "../utils/browser"

export class ChangeGrid {
    readonly command = "change-grid"

    constructor(public readonly cols = 20, public readonly rows = 10) {}
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

// --

export type Message = ChangeGrid | PlaceToken | PlaceWall | SelectToken | ClearGrid

export function update(model: Model, message: Message, context: wecco.AppContext<Message>): Model {
    switch (message.command) {
        case "change-grid":
            return GameGrid.createInitial(message.cols, message.rows)

        case "place-token": {
            const t = model.tokenAt(message.col, message.row)
            if (typeof t !== "undefined") {                
                model = model
                    .setTokenAt(message.col, message.row, undefined)
                    .select(t.color, t.symbol, model.wallSymbol)
            } else {
                model = model.setTokenAt(message.col, message.row, message.token)
            }
            
            Browser.urlHash = model.toUrlHash()
            
            return model
        }

        case "place-wall": {
            const w = model.wallAt(message.col, message.row, message.position)
            if (typeof w !== "undefined") {                
                model = model
                    .setWallAt(message.col, message.row, message.position, undefined)
                    .select(w.color, model.tokenSymbol, w.symbol)
            } else {
                model = model
                    .setWallAt(message.col, message.row, message.position, message.wall)
            }
            
            Browser.urlHash = model.toUrlHash()
            
            return model
        }

        case "select-token":
            return model.select(message.color, message.tokenSymbol, message.wallSymbol)

        case "clear-grid":
            return GameGrid.createInitial(model.cols, model.rows)
    }
}
