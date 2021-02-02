
export type DieType = 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export const UrlHashDiceRoller = "diceroller"

export class DiceRoller {
    constructor(public readonly availableDice: Array<DieType>, public readonly roll?: DieRoll) { }

    rollDie(die: DieType): DiceRoller {
        const result = Math.floor(Math.random() * die) + 1
        return new DiceRoller(this.availableDice, new DieRoll(die, result))
    }
}

export class DieRoll {
    constructor(public readonly dieType: DieType, public readonly result: number) { }
}

// --

export const UrlHashGameGrid = "gamegrid"

export type TokenColor = "grey" | "green" | "blue" | "red" | "orange" | "purple" | "yellow" | "black" | "brown"

export const TokenColors: Array<TokenColor> = ["grey", "green", "blue", "red", "orange", "purple", "yellow", "black", "brown"]

export type TokenSymbol = "circle" | "cross" | "square" | "diamond" | "lines"

export const TokenSymbols: Array<TokenSymbol> = ["circle", "cross", "square", "diamond", "lines"]

export const TokenSymbolUrlCharMapping = new Map<TokenSymbol, string>()
    .set("circle", "c")
    .set("cross", "x")
    .set("lines", "l")
    .set("square", "s")
    .set("diamond", "d")

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

export type WallPosition = "left" | "top"

export const WallPositions: Array<WallPosition> = ["left", "top"]

export type WallSymbol = "wall" | "door" | "window"

export const WallSymbols: Array<WallSymbol> = ["wall", "door", "window"]

export const WallSymbolUrlCharMapping = new Map<WallSymbol, string>()
    .set("wall", "l")
    .set("door", "d")
    .set("window", "w")

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

export class GameGrid {
    static fromUrlHash(hash: string): GameGrid {
        const [sizeString, tokensString, wallsString] = hash.substr(UrlHashGameGrid.length + 1).split("/")
        if (!sizeString) {
            return GameGrid.createInitial()
        }
        const [colsString, rowsString] = sizeString.split(":")
        const cols = parseInt(colsString)
        const rows = parseInt(rowsString)
        if (isNaN(cols) || isNaN(rows)) {
            return GameGrid.createInitial()
        }

        return new GameGrid(cols, rows, GameGrid.parseTokensUrlString(cols, rows, tokensString), GameGrid.parseWallsUrlString(cols, rows, wallsString), "grey", "lines", "wall")    
    }

    private static parseTokensUrlString(cols: number, rows: number, tokensString: string): Array<Token | undefined> {
        const tokens: Array<Token | undefined> = Array.apply(null, { length: cols * rows })

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
        const walls: Array<Wall | undefined> = Array.apply(null, { length: cols * rows * 2})

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
        return new GameGrid(cols, rows, Array.apply(null, { length: cols * rows }), Array.apply(null, { length: cols * rows * 2 }), "grey", "lines", "wall")
    }

    constructor(
        public readonly cols: number = 10,
        public readonly rows: number = 8,
        public readonly tokens: Array<Token | undefined>,
        public readonly walls: Array<Wall | undefined>,
        public readonly color: TokenColor,
        public readonly tokenSymbol: TokenSymbol,
        public readonly wallSymbol: WallSymbol,
    ) { }

    tokenAt(col: number, row: number): Token | undefined {
        return this.tokens[row * this.cols + col]
    }

    setTokenAt(col: number, row: number, token: Token | undefined): GameGrid {
        const tokens = this.tokens.slice()
        tokens[row * this.cols + col] = token
        return new GameGrid(this.cols, this.rows, tokens, this.walls, this.color, this.tokenSymbol, this.wallSymbol)
    }

    wallAt(col: number, row: number, position: WallPosition): Wall | undefined {
        return this.walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)]
    }

    setWallAt(col: number, row: number, position: WallPosition, wall: Wall | undefined): GameGrid {
        const walls = this.walls.slice()
        walls[row * this.cols * 2 + col * 2 + (position === "top" ? 1 : 0)] = wall
        return new GameGrid(this.cols, this.rows, this.tokens, walls, this.color, this.tokenSymbol, this.wallSymbol)
    }

    select(color: TokenColor, tokenSymbol: TokenSymbol, wallSymbol: WallSymbol): GameGrid {
        return new GameGrid(this.cols, this.rows, this.tokens, this.walls, color, tokenSymbol, wallSymbol)
    }

    toUrlHash(): string {
        return `${UrlHashGameGrid}/${this.cols}:${this.rows}/${this.urlHashTokens()}/${this.urlHashWalls()}`
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

// --

export type Model = DiceRoller | GameGrid
