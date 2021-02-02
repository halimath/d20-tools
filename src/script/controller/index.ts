import * as wecco from "@wecco/core"
import { DiceRoller, DieType, GameGrid, Model, Token, TokenColor, TokenSymbol, UrlHashDiceRoller, UrlHashGameGrid, Wall, WallPosition, WallSymbol } from "../models"
import { Browser } from "../utils/browser"


// Generic messages

export class Nop {
    readonly command = "nop"
}

// Navigational messages

export class ShowDiceRoller {
    readonly command = "show-dice-roller"
}

export class ShowGameGrid {
    readonly command = "show-game-grid"

    constructor(public readonly gameGrid: GameGrid) { }
}

//  

export class RollDie {
    readonly command = "roll-die"

    constructor(public readonly dieType: DieType) { }
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

export type Message = Nop | ShowDiceRoller | ShowGameGrid | RollDie | PlaceToken | PlaceWall | SelectToken | ClearGrid

export function update(model: Model, message: Message, context: wecco.AppContext<Message>): Model {
    switch (message.command) {
        case "nop":
            console.warn("Got nop message")
            return model

        // --

        case "show-dice-roller":
            Browser.urlHash = UrlHashDiceRoller
            return new DiceRoller([3, 4, 6, 8, 10, 12, 20, 100])

        case "roll-die":
            if (!(model instanceof DiceRoller)) {
                console.error(`inconsistency detected: ${model} is not an instance of DiceRoller`)
                return model
            }
            return model.rollDie(message.dieType)

        // --

        case "show-game-grid":
            model = message.gameGrid
            Browser.urlHash = model.toUrlHash()
            return model

        case "place-token": {
            if (!(model instanceof GameGrid)) {
                console.error(`inconsistency detected: ${model} is not an instance of GameGrid`)
                return model
            }

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
            if (!(model instanceof GameGrid)) {
                console.error(`inconsistency detected: ${model} is not an instance of GameGrid`)
                return model
            }

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
            if (!(model instanceof GameGrid)) {
                console.error(`inconsistency detected: ${model} is not an instance of GameGrid`)
                return model
            }
            return model.select(message.color, message.tokenSymbol, message.wallSymbol)

        case "clear-grid":
            if (!(model instanceof GameGrid)) {
                console.error(`inconsistency detected: ${model} is not an instance of GameGrid`)
                return model
            }
            return GameGrid.createInitial(model.cols, model.rows)
    }
}

export function executeRoute(context: wecco.AppContext<Message>, urlHash: string | null): void {
    if (urlHash?.startsWith(UrlHashGameGrid)) {
        context.emit(new ShowGameGrid(GameGrid.fromUrlHash(urlHash)))
        return
    }
    context.emit(new ShowDiceRoller())
}
