
export type DieType = 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export class DieRoll {
    constructor(public readonly dieType: DieType, public readonly result: number) { }
}

export class Model {
    static createInitial(): Model {
        return new Model([3, 4, 6, 8, 10, 12, 20, 100])
    }
    
    constructor(public readonly availableDice: Array<DieType>, public readonly roll?: DieRoll) { }

    rollDie(die: DieType): Model {
        const result = Math.floor(Math.random() * die) + 1
        return new Model(this.availableDice, new DieRoll(die, result))
    }
}
