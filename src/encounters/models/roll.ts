import { range } from "d20-tools/common/tools"

export type DieType = 2 | 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export const DieTypes: Array<DieType> = [2, 3, 4, 6, 8, 10, 12, 20, 100]

export class DieRoll {
    constructor(public readonly dieType: DieType, public readonly amount = 1) { }

    roll(): number {
        return [...range(this.amount)].reduce(p => p + Math.floor(Math.random() * this.dieType) + 1, 0)
    }

    toString(): string {
        return `${this.amount}d${this.dieType}`
    }
}

export class RollResult {
    constructor(public readonly dieResult: number, public readonly modifier: number) { }

    get value(): number {
        return this.dieResult + this.modifier
    }
}

export class Roll {
    static parse(expr: string): Roll {
        expr = expr.replace(/\s*/g, "")
        const matches = /^(\d+)[dw](\d+)([+-]\d+)?$/.exec(expr)
        if (!matches) {
            throw `invalid expression: ${expr}`
        }

        const amount = parseInt(matches[1])
        const die = parseInt(matches[2]) as DieType
        const modifier = parseInt(matches[3] ?? "0")

        if (DieTypes.indexOf(die) < 0) {
            throw `invalid expression: ${expr}`
        }

        return Roll.create(amount, die, modifier)
    }

    static create(dieAmount: number, dieType: DieType, modifier = 0): Roll {
        return new Roll(new DieRoll(dieType, dieAmount), modifier)
    }

    constructor(public readonly die: DieRoll | undefined, public readonly modifier: number = 0) { }

    roll(): RollResult {
        if (typeof this.die === "undefined") {
            return new RollResult(0, this.modifier)
        }

        return new RollResult(this.die.roll(), this.modifier)
    }

    toString(): string {
        if (typeof this.die === "undefined") {
            return this.modifier.toString()
        }

        const s = this.die.toString()

        if (this.modifier === 0) {
            return s
        }

        if (this.modifier < 0) {
            return s + this.modifier
        }

        return `${s}+${this.modifier}`
    }
}
