import { m } from "d20-tools/common/i18n"
import { range } from "src/common/tools"

/** Defines the available colors for use with Tokens. */
export type TokenColor = "grey" | "green" | "blue" | "red" | "orange" | "purple" | "yellow" | "black" | "brown"

/** Provides all available colors to use with Tokens as an Array */
export const TokenColors: Array<TokenColor> = ["grey", "green", "blue", "red", "orange", "purple", "yellow", "black", "brown"]

/** Defines the available token symbols. */
export type TokenSymbol = "circle" | "cross" | "square" | "diamond" | "lines"

/** Provides all available token symbols as an Array */
export const TokenSymbols: Array<TokenSymbol> = ["circle", "cross", "square", "diamond", "lines"]

/** Maps every TokenSymbol to a single character used to encode the token symbol. The resulting relation must be bijective.  */
export const TokenSymbolUrlCharMapping = new Map<TokenSymbol, string>()
    .set("circle", "c")
    .set("cross", "x")
    .set("lines", "l")
    .set("square", "s")
    .set("diamond", "d")

/** Maps every TokenColor to a single character used to encode the token color. The resulting relation must be bijective.  */
export const TokenColorUrlCharMapping = new Map<TokenColor, string>()
    .set("grey", "e")
    .set("green", "g")
    .set("blue", "b")
    .set("red", "r")
    .set("orange", "o")
    .set("purple", "p")
    .set("yellow", "y")
    .set("black", "k")
    .set("brown", "w")

/**
 * Defines a single token placed on the game grid. A token is a marker
 * that occupies a single grid cell. A grid cell may contain at most
 * one token.
 * 
 * A token consists of a color and a symbol.
 */
export class Token {
    static fromUrlHash(hash: string): Token | undefined {
        if (hash.length !== 2) {
            console.log(`Invalid token url hash: ${hash}`)
            return undefined
        }

        const [symbolChar, colorChar] = hash.split("")

        let symbol: TokenSymbol = "lines"
        let color: TokenColor = "grey"

        for (const s of TokenSymbolUrlCharMapping.keys()) {
            if (symbolChar === TokenSymbolUrlCharMapping.get(s)) {
                symbol = s
            }
        }

        for (const c of TokenColorUrlCharMapping.keys()) {
            if (colorChar === TokenColorUrlCharMapping.get(c)) {
                color = c
            }
        }

        return new Token(symbol, color)
    }

    constructor(public readonly symbol: TokenSymbol, public readonly color: TokenColor) { }

    toUrlHash(): string {
        return (TokenSymbolUrlCharMapping.get(this.symbol) ?? "") + (TokenColorUrlCharMapping.get(this.color) ?? "")
    }
}

/** Defines the valid positions of a wall. */
export type WallPosition = "left" | "top"

/** Provides an array containing all available wall positions. */
export const WallPositions: Array<WallPosition> = ["left", "top"]

/** Defines the symbols (i.e kinds) of a wall. */
export type WallSymbol = "wall" | "door" | "window"

/** Provides an array containing all available wall positions. */
export const WallSymbols: Array<WallSymbol> = ["wall", "door", "window"]

/** Maps every wall symbol to a single character. The resulting relation must be bijective. */
export const WallSymbolUrlCharMapping = new Map<WallSymbol, string>()
    .set("wall", "l")
    .set("door", "d")
    .set("window", "w")

/**
 * A single wall placed on the grid. A wall is placed on a single cell
 * but carries a position which places the wall either on the left or
 * on the top edge of the cell.
 * 
 * A wall also has a symbol and a color. The walls choose from the
 * same color set as the Tokens.
 */
export class Wall {
    static fromUrlHash(hash: string): Wall | undefined {
        if (hash.length !== 2) {
            console.log(`Invalid wall url hash: ${hash}`)
            return undefined
        }

        const [symbolChar, colorChar] = hash.split("")

        let symbol: WallSymbol = "wall"
        let color: TokenColor = "grey"

        for (const s of WallSymbolUrlCharMapping.keys()) {
            if (symbolChar === WallSymbolUrlCharMapping.get(s)) {
                symbol = s
            }
        }

        for (const c of TokenColorUrlCharMapping.keys()) {
            if (colorChar === TokenColorUrlCharMapping.get(c)) {
                color = c
            }
        }

        return new Wall(symbol, color)
    }

    constructor(public readonly symbol: WallSymbol, public readonly color: TokenColor) { }

    toUrlHash(): string {
        return (WallSymbolUrlCharMapping.get(this.symbol) ?? "") + (TokenColorUrlCharMapping.get(this.color) ?? "")
    }
}

function randomLabel(): string {
    const index = Math.floor(Math.random() * 10);
    return m(`gameGrid.title.placeholder.${index}`)
}

/**
 * GrameGrid defines a grid with contained Tokens and Walls.
 */
export class GameGrid {
    static fromDescriptor(id: string, label: string, descriptor: string): GameGrid {
        const [sizeString, tokensString, wallsString] = descriptor.split("/")
        if (!sizeString) {
            throw new Error(`invalid grid descriptor: invalid size string: "${sizeString}"`)
        }
        const [colsString, rowsString] = sizeString.split(":")
        const cols = parseInt(colsString)
        const rows = parseInt(rowsString)
        if (isNaN(cols) || isNaN(rows)) {
            throw new Error(`invalid grid descriptor: invalid size: ${cols}x${rows}`)
        }

        return new GameGrid(id, cols, rows, label, GameGrid.parseTokensUrlString(cols, rows, tokensString), GameGrid.parseWallsUrlString(cols, rows, wallsString), "grey", "lines", "wall")    
    }

    private static parseTokensUrlString(cols: number, rows: number, tokensString: string): Array<Token | undefined> {
        const tokens: Array<Token | undefined> = [...range(cols * rows)].map(() => void 0)

        let insertIndex = 0

        for (let i = 0; i < tokensString.length; i++) {
            const c = tokensString.charAt(i)
            if (c === "-") {
                const count = parseInt(tokensString.substr(i + 1))
                insertIndex += count
                i += count.toString().length
            } else {
                const token = Token.fromUrlHash(tokensString.substr(i, 2))
                const count = parseInt(tokensString.substr(i + 2))
                i += count.toString().length + 1
                for (let t = 0; t < count; t++) {
                    tokens[insertIndex + t] = token
                }
                insertIndex += count
            }

            if (insertIndex >= tokens.length) {
                break
            }
        }

        return tokens
    }

    private static parseWallsUrlString(cols: number, rows: number, wallsString: string): Array<Wall | undefined> {
        const walls: Array<Wall | undefined> = [...range(cols * rows * 2)].map(() => void 0)

        let insertIndex = 0

        for (let i = 0; i < wallsString.length; i++) {
            const c = wallsString.charAt(i)
            if (c === "-") {
                const count = parseInt(wallsString.substr(i + 1))
                insertIndex += count
                i += count.toString().length
            } else {
                const wall = Wall.fromUrlHash(wallsString.substr(i, 2))
                const count = parseInt(wallsString.substr(i + 2))
                i += count.toString().length + 1
                for (let t = 0; t < count; t++) {
                    walls[insertIndex + t] = wall
                }
                insertIndex += count
            }

            if (insertIndex >= walls.length) {
                break
            }
        }

        return walls
    }

    static createInitial(cols = 20, rows = 10): GameGrid {
        return new GameGrid(createId(), cols, rows, randomLabel(), [...range(cols * rows)].map(() => void 0), [...range(cols * rows * 2)].map(() => void 0), "grey", "lines", "wall")
    }

    constructor(
        public readonly id: string,
        public readonly cols: number,
        public readonly rows: number,
        public label: string,
        public tokens: Array<Token | undefined>,
        public walls: Array<Wall | undefined>,
        public color: TokenColor,
        public tokenSymbol: TokenSymbol,
        public wallSymbol: WallSymbol,
    ) { }

    resize(cols: number, rows: number): GameGrid {
        const tokens = [...range(cols * rows)].map(() => void 0)
        const walls = [...range(cols * rows * 2)].map(() => void 0)

        const result = new GameGrid(this.id, cols, rows, this.label, tokens, walls, this.color, this.tokenSymbol, this.wallSymbol)

        for (let c = 0; c < Math.min(this.cols, cols); c++) {
            for (let r = 0; r < Math.min(this.rows, rows); r++) {
                result.setTokenAt(c, r, this.tokenAt(c, r))
                for (const wp of WallPositions) {
                    result.setWallAt(c, r, wp, this.wallAt(c, r, wp))
                }
            }
        }

        return result
    }

    tokenAt(col: number, row: number): Token | undefined {
        return this.tokens[row * this.cols + col]
    }

    setTokenAt(col: number, row: number, token: Token | undefined): GameGrid {
        this.tokens[row * this.cols + col] = token
        return this
    }

    wallAt(col: number, row: number, position: WallPosition): Wall | undefined {
        return this.walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)]
    }

    setWallAt(col: number, row: number, position: WallPosition, wall: Wall | undefined): GameGrid {
        this.walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)] = wall
        return this
    }

    select(color: TokenColor, tokenSymbol: TokenSymbol, wallSymbol: WallSymbol): GameGrid {
        this.color = color
        this.tokenSymbol = tokenSymbol
        this.wallSymbol = wallSymbol
        return this
    }

    setLabel(label: string): GameGrid {
        this.label = label
        return this
    }

    get isEmpty(): boolean {
        for (const token of this.tokens) {
            if (typeof token !== "undefined") {
                return false
            }
        }
        for (const wall of this.walls) {
            if (typeof wall !== "undefined") {
                return false
            }
        }
        return true
    }

    get descriptor (): string {
        return `${this.cols}:${this.rows}/${this.urlHashTokens()}/${this.urlHashWalls()}`
    }

    private urlHashWalls(): string {
        let result = ""

        let lastSymbol = ""
        let count = 0

        for (const wall of this.walls) {
            let symbol = "-"
            if (typeof wall !== "undefined") {
                symbol = wall.toUrlHash()
            }
            if (lastSymbol === "") {
                lastSymbol = symbol
                count = 1
            } else if (symbol === lastSymbol) {
                count++
            } else {
                result += lastSymbol + count.toString()
                lastSymbol = symbol
                count = 1
            }
        }

        if (count > 0) {
            result += lastSymbol + count.toString()
        }

        return result
    }

    private urlHashTokens(): string {
        let result = ""

        let lastSymbol = ""
        let count = 0

        for (const token of this.tokens) {
            let symbol = "-"
            if (typeof token !== "undefined") {
                symbol = token.toUrlHash()
            }
            if (lastSymbol === "") {
                lastSymbol = symbol
                count = 1
            } else if (symbol === lastSymbol) {
                count++
            } else {
                result += lastSymbol + count.toString()
                lastSymbol = symbol
                count = 1
            }
        }

        if (count > 0) {
            result += lastSymbol + count.toString()
        }

        return result
    }
}

export class Model {
    constructor (public readonly gameGrid: GameGrid) {}
}

// --

export function createId (): string {
    // TODO: Find a real Implement
    return (new Date().getTime() * Math.random()).toString(32).split(".")[0]
}

// --

export class GameGridInfo {
    constructor (public readonly id: string, public readonly lastUpdate: Date, public readonly label: string, public readonly dimension: string) {}
}
