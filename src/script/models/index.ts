
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

export type TokenSymbol = "circle" | "cross" | "dashes"

export const TokenSymbols: Array<TokenSymbol> = ["circle", "cross", "dashes"]

export const TokenSymbolUrlCharMapping = new Map<TokenSymbol, string>()
    .set("circle", "c")
    .set("cross", "x")
    .set("dashes", "d")

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

        let symbol: TokenSymbol = "dashes"
        let color: TokenColor = "grey"

        for (let s of TokenSymbolUrlCharMapping.keys()) {
            if (symbolChar === TokenSymbolUrlCharMapping.get(s)) {
                symbol = s
            }
        }

        for (let c of TokenColorUrlCharMapping.keys()) {
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

export class GameGrid {
    static fromUrlHash(hash: string): GameGrid {
        const [_, colsString, rowsString, tokensString] = hash.split(":")
        const cols = parseInt(colsString)
        const rows = parseInt(rowsString)
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

        return new GameGrid(cols, rows, new Token("dashes", "grey"), tokens)
    }

    readonly tokens: Array<Token | undefined>

    constructor(public readonly cols: number = 10, public readonly rows: number = 8, public readonly selectedToken: Token = new Token("dashes", "grey"), tokens?: Array<Token | undefined>) {
        if (typeof tokens === "undefined") {
            this.tokens = Array.apply(null, { length: cols * rows })
        } else {
            this.tokens = tokens.slice()
        }
    }

    tokenAt(col: number, row: number): Token | undefined {
        return this.tokens[row * this.cols + col]
    }

    setTokenAt(col: number, row: number, token: Token | undefined): GameGrid {
        const copy = new GameGrid(this.cols, this.rows, this.selectedToken, this.tokens)
        copy.tokens[row * this.cols + col] = token
        return copy
    }

    toUrlHash(): string {
        let result = ""

        let lastSymbol = ""
        let count = 0

        for (let token of this.tokens) {
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

        return `${UrlHashGameGrid}:${this.cols}:${this.rows}:${result}`
    }
}

// --

export type Model = DiceRoller | GameGrid
