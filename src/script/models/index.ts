
export type DieType = 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export class DiceRoller {
    constructor (public readonly availableDice: Array<DieType>, public readonly roll?: DieRoll) {}

    rollDie(die: DieType): DiceRoller {
        const result = Math.floor(Math.random() * die) + 1
        return new DiceRoller(this.availableDice, new DieRoll(die, result))
    }
}

export class DieRoll {
    constructor (public readonly dieType: DieType, public readonly result: number) {}
}

export class GameGrid {
    constructor (public readonly cols: number, public readonly rows: number) {}
}

export type Model = DiceRoller | GameGrid
