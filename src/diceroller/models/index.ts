
export type DieType = 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export class DieRoll {
    constructor(public readonly dieType: DieType, public readonly result: number) { }
}

export class Model {
    static createInitial(): Model {
        return new Model([3, 4, 6, 8, 10, 12, 20, 100])
    }
    
    constructor(public readonly availableDice: Array<DieType>, public readonly history: Array<DieRoll> = [], public readonly roll?: DieRoll) { }

    rollDie(die: DieType): Model {
        const roll = new DieRoll(die, Math.floor(Math.random() * die) + 1)
        return new Model(this.availableDice, [roll].concat(this.history) , roll)
    }
}
