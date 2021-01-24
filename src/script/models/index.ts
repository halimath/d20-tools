
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

const tokenSymbolUrlCharMapping = new Map<TokenSymbol, string>()
    .set("circle", "c")
    .set("cross", "x")
    .set("dashes", "d")

const tokenColorUrlCharMapping = new Map<TokenColor, string>()
    .set("grey", "e")
    .set("green", "g")
    .set("blue", "b")
    .set("red", "r")
    .set("orange", "o")
    .set("purple", "p")
    .set("yellow", "y")
    .set("black", "b")
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

        for (let s of tokenSymbolUrlCharMapping.keys()) {
            if (symbolChar === tokenSymbolUrlCharMapping.get(s)) {
                symbol = s
            }
        }

        for (let c of tokenColorUrlCharMapping.keys()) {
            if (colorChar === tokenColorUrlCharMapping.get(c)) {
                color = c
            }
        }

        return new Token(symbol, color)
    }

    constructor(public readonly symbol: TokenSymbol, public readonly color: TokenColor) { }

    toUrlHash(): string {
        return (tokenSymbolUrlCharMapping.get(this.symbol) ?? "") + (tokenColorUrlCharMapping.get(this.color) ?? "")
    }    
}

export class GameGrid {
    static fromUrlHash(hash: string): GameGrid {
        const [_, colsString, rowsString, tokensString] = hash.split(":")
        const cols = parseInt(colsString)
        const rows = parseInt(rowsString)
        const tokens: Array<Token | undefined> = Array.apply(null, {length: cols * rows})

        let insertIndex = 0

        for (let i = 0; i < tokensString.length; i++) {            
            const c = tokensString.charAt(i)
            if (c === "-") {
                const count = parseInt(tokensString.substr(i + 1))
                insertIndex += count
                i += count.toString().length
            } else {
                tokens[insertIndex] = Token.fromUrlHash(tokensString.substr(i, 2))
                insertIndex++
                i++
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
        let tokensString = ""
        let emptyCount = 0
        for (let token of this.tokens) {
            if (typeof token === "undefined") {
                emptyCount++
                continue
            }

            if (emptyCount > 0) {
                tokensString += `-${emptyCount}`
                emptyCount = 0
            }

            tokensString += token.toUrlHash()
        }

        if (emptyCount > 0) {
            tokensString += `-${emptyCount}`
        }

        return `${UrlHashGameGrid}:${this.cols}:${this.rows}:${tokensString}`
    }
}

// --

export type Model = DiceRoller | GameGrid
