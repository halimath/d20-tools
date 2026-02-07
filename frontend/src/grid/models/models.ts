import { m } from "d20-tools/common/i18n"
import { range } from "d20-tools/common/tools"

/** Defines the available colors for use with Tokens. */
export type Color = "grey" | "green" | "blue" | "red" | "orange" | "purple" | "yellow" | "black" | "brown"

/** Provides all available colors to use with Tokens as an Array */
export const Colors: Array<Color> = ["grey", "green", "brown", "blue", "red", "orange", "purple", "yellow", "black",]

/** Maps every Color to a single character used to encode the token color. The resulting relation must be bijective.  */
const ColorUrlCharMapping = new Map<Color, string>()
    .set("grey", "e")
    .set("green", "g")
    .set("blue", "b")
    .set("red", "r")
    .set("orange", "o")
    .set("purple", "p")
    .set("yellow", "y")
    .set("black", "k")
    .set("brown", "w")

function decodeColor(s: string): Color | undefined {
    for (const c of ColorUrlCharMapping.keys()) {
        if (s[0] === ColorUrlCharMapping.get(c)) {
            return c
        }
    }
    return
}

// The base string
type TokenString = "♙♔♕♖♗♘✦●▲▼■◆"

// Recursive type that splits a string into a union of characters
type StringToUnion<S extends string> =
    S extends `${infer First}${infer Rest}`
        ? First | StringToUnion<Rest>
        : never

// The result: a union of all characters
export type TokenSymbol = StringToUnion<TokenString>

/** Provides all available token symbols as an Array */
export const TokenSymbols: Array<TokenSymbol> = "♙♔♕♖♗♘✦●▲▼■◆".split("").map(r => r as TokenSymbol)

/** Maps every TokenSymbol to a single character used to encode the token symbol. The resulting relation must be bijective.  */
const TokenSymbolUrlCharMapping = new Map<TokenSymbol, string>()
    .set("♙", "p")
    .set("♔", "k")
    .set("♕", "q")
    .set("♖", "c")
    .set("♗", "b")
    .set("♘", "k")
    .set("✦", "x")
    .set("●", "o")
    .set("▲", "a")
    .set("▼", "v")
    .set("■", "b")
    .set("◆", "z")

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

        let symbol: TokenSymbol = TokenSymbols[0]

        for (const s of TokenSymbolUrlCharMapping.keys()) {
            if (symbolChar === TokenSymbolUrlCharMapping.get(s)) {
                symbol = s
            }
        }

        const color = decodeColor(colorChar) ?? Colors[0]

        return new Token(symbol, color)
    }

    constructor(public readonly symbol: TokenSymbol, public readonly color: Color) { }

    toUrlHash(): string {
        return (TokenSymbolUrlCharMapping.get(this.symbol) ?? "") + (ColorUrlCharMapping.get(this.color) ?? "")
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

        for (const s of WallSymbolUrlCharMapping.keys()) {
            if (symbolChar === WallSymbolUrlCharMapping.get(s)) {
                symbol = s
            }
        }

        const color = decodeColor(colorChar) ?? Colors[0]

        return new Wall(symbol, color)
    }

    constructor(public readonly symbol: WallSymbol, public readonly color: Color) { }

    toUrlHash(): string {
        return (WallSymbolUrlCharMapping.get(this.symbol) ?? "") + (ColorUrlCharMapping.get(this.color) ?? "")
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
    static fromDescriptor(label: string, descriptor: string, id?: string, lastModified?: Date): GameGrid {
        const [sizeString, backgroundString, tokensString, wallsString] = descriptor.split(":")
        if (!sizeString) {
            throw new Error(`invalid grid descriptor: invalid size string: "${sizeString}"`)
        }
        const [colsString, rowsString] = sizeString.split("x")
        const cols = parseInt(colsString)
        const rows = parseInt(rowsString)
        if (isNaN(cols) || isNaN(rows)) {
            throw new Error(`invalid grid descriptor: invalid size: ${cols}x${rows}`)
        }

        return new GameGrid(cols, rows, label,
            GameGrid.parseBackgroundUrlString(cols, rows, backgroundString),
            GameGrid.parseTokensUrlString(cols, rows, tokensString),
            GameGrid.parseWallsUrlString(cols, rows, wallsString), id, lastModified)
    }

    private static parseTokensUrlString(cols: number, rows: number, tokensString: string): Array<Token | undefined> {
        const tokens: Array<Token | undefined> = [...range(cols * rows)].map(() => void 0)

        let insertIndex = 0

        for (let i = 0; i < tokensString.length; i++) {
            const c = tokensString.charAt(i)
            if (c === "-") {
                const count = parseInt(tokensString.substring(i + 1))
                insertIndex += count
                i += count.toString().length
            } else {
                const token = Token.fromUrlHash(tokensString.substring(i, i + 2))
                const count = parseInt(tokensString.substring(i + 2))
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

    private static parseBackgroundUrlString(cols: number, rows: number, bgString: string): Array<Color | undefined> {
        const bg: Array<Color | undefined> = [...range(cols * rows)].map(() => void 0)

        let insertIndex = 0

        for (let i = 0; i < bgString.length; i++) {
            const c = bgString.charAt(i)
            if (c === "-") {
                const count = parseInt(bgString.substring(i + 1))
                insertIndex += count
                i += count.toString().length
            } else {
                const color = decodeColor(c) ?? Colors[0]
                const count = parseInt(bgString.substring(i + 1))
                i += count.toString().length
                for (let t = 0; t < count; t++) {
                    bg[insertIndex + t] = color
                }
                insertIndex += count
            }

            if (insertIndex >= bg.length) {
                break
            }
        }

        return bg
    }

    private static parseWallsUrlString(cols: number, rows: number, wallsString: string): Array<Wall | undefined> {
        const walls: Array<Wall | undefined> = [...range(cols * rows * 2)].map(() => void 0)

        let insertIndex = 0

        for (let i = 0; i < wallsString.length; i++) {
            const c = wallsString.charAt(i)
            if (c === "-") {
                const count = parseInt(wallsString.substring(i + 1))
                insertIndex += count
                i += count.toString().length
            } else {
                const wall = Wall.fromUrlHash(wallsString.substring(i, i + 2))
                const count = parseInt(wallsString.substring(i + 2))
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

    static createInitial(cols = 30, rows = 20): GameGrid {
        const gg = new GameGrid(cols, rows, randomLabel(), 
            [...range(cols * rows)].map(() => void 0), 
            [...range(cols * rows)].map(() => void 0), 
            [...range(cols * rows * 2)].map(() => void 0))

        return gg
    }

    constructor(
        public readonly cols: number,
        public readonly rows: number,
        public label: string,
        public background: Array<Color | undefined>,
        public tokens: Array<Token | undefined>,
        public walls: Array<Wall | undefined>,
        public id?: string,
        public lastModified?: Date, 
    ) { }

    resize(cols: number, rows: number): GameGrid {
        const tokens = [...range(cols * rows)].map(() => void 0)
        const walls = [...range(cols * rows * 2)].map(() => void 0)

        const result = new GameGrid(cols, rows, this.label, this.background, tokens, walls, this.id)

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

    removeTokenAt(col: number, row: number): GameGrid {
        this.tokens[row * this.cols + col] = undefined
        return this
    }

    wallAt(col: number, row: number, position: WallPosition): Wall | undefined {
        return this.walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)]
    }

    setWallAt(col: number, row: number, position: WallPosition, wall: Wall | undefined): GameGrid {
        this.walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)] = wall
        return this
    }

    removeWallAt(col: number, row: number, position: WallPosition): GameGrid {
        this.walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)] = undefined
        return this
    }

    backgroundAt(col: number, row: number): Color | undefined {
        return this.background[row * this.cols + col]
    }

    setBackgroundAt(col: number, row: number, color: Color): GameGrid {
        this.background[row * this.cols + col] = color
        return this
    }

    removeBackgroundAt(col: number, row: number): GameGrid {
        this.background[row * this.cols + col] = undefined
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

    get descriptor(): string {
        return `${this.cols}x${this.rows}:${this.urlHashBackground()}:${this.urlHashTokens()}:${this.urlHashWalls()}`
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

    private urlHashBackground(): string {
        let result = ""

        let lastSymbol = ""
        let count = 0

        for (const bg of this.background) {
            let symbol = "-"
            if (typeof bg !== "undefined") {
                symbol = ColorUrlCharMapping.get(bg)!
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

export type BackgroundTool = "background"
export type Tool = TokenSymbol | WallSymbol | BackgroundTool

export function isWallSymbol(tool: Tool): tool is WallSymbol {
    return !!WallSymbols.find(w => w === tool)
}

export function isTokenSymbol(tool: Tool): tool is TokenSymbol {
    return !!TokenSymbols.find(w => w === tool)
}

export const DefaultZoomLevel = 5

export type Location = [number, number]

export class Viewer {
    constructor(
        public readonly gameGrid: GameGrid,
        public zoomLevel: number = DefaultZoomLevel,
    ) { }

    decreaseZoom(){
        if (this.zoomLevel === 3) {
            return
        }

        this.zoomLevel--
    }

    increaseZoom(){
        if (this.zoomLevel === 15) {
            return
        }

        this.zoomLevel++
    }    
}

export class Editor extends Viewer {
    constructor(        
        gameGrid: GameGrid,
        zoomLevel: number = DefaultZoomLevel,
        public color: Color = Colors[0],
        public tool: Tool = TokenSymbols[0],
        public lastRemovedToken: Location | undefined = undefined,
        public showShareDialog: boolean = false,
    ) { 
        super(gameGrid, zoomLevel)
    }

    setLastRemovedToken(loc: Location) {
        this.lastRemovedToken = loc
    }

    clearLastRemovedToken(){
        this.lastRemovedToken = undefined
    }

    selectColorAndTool(color: Color, tool: Tool){
        this.color = color
        this.tool = tool
    }
}

export type Model = Viewer | Editor
