import { range } from "../../common/tools"

export type DieType = 2 | 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export const DieTypes: Array<DieType> = [2, 3, 4, 6, 8, 10, 12, 20, 100]

export class DieRoll {
    constructor (public readonly dieType: DieType, public readonly amount = 1) {}

    roll(): number {
        return [...range(this.amount)].reduce(p => p + Math.floor(Math.random() * this.dieType) + 1, 0)
    }

    toString(): string {
        return `${this.amount}d${this.dieType}`
    }
}

export class RollResult {
    constructor (public readonly dieResult: number, public readonly modifier: number) {}

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

export class HitDamage {
    constructor (public readonly label: string, public readonly result: RollResult) {}
}

export class Hit {
    constructor (public readonly ac: RollResult, public readonly damage: Array<HitDamage>) {}
}

export class Damage {
    constructor (public readonly label: string, public readonly damage: Roll) {}

    roll(): HitDamage {
        return new HitDamage(this.label, this.damage.roll())
    }
}

export class Attack {
    public readonly roll: Roll
    public readonly damage: Array<Damage>

    constructor(public readonly label: string, public readonly mod: number, ...damage: Array<Damage>) { 
        this.roll = new Roll(new DieRoll(20), this.mod)
        this.damage = damage
    }

    execute(): Hit {
        return new Hit(this.roll.roll(), this.damage.map(d => d.roll()))
    }
}

export type SavingThrow = "will" | "reflex" | "fortitude"

export type SavingThrows<T> = Record<SavingThrow, T>

export interface KindOptions {
    ac: number
    speed: number
    savingThrows: SavingThrows<number>
    hitDie: Roll
    tags?: Array<string>
    attacks?: Array<Attack>
}

export class Kind {
    public readonly speed: number 
    public readonly ac: number
    public readonly hitDie: Roll
    public readonly savingThrows: SavingThrows<number>
    public readonly tags: Array<string>
    public readonly attacks: Array<Attack>

    constructor (    
        public readonly label: string,
        options: KindOptions,
        ...attacks: Array<Attack>
    ) {
        this.speed = options.speed
        this.ac = options.ac
        this.hitDie = options.hitDie
        this.savingThrows = {
            will: options.savingThrows.will,
            reflex: options.savingThrows.reflex,
            fortitude: options.savingThrows.fortitude,
        }
        this.tags = options.tags ?? []
        this.attacks = (options.attacks ?? []).concat(attacks)
    }
}

export class Character {
    static create (label: string, kind: Kind): Character {
        const hitpoints = kind.hitDie.roll().value

        return new Character(label, kind, hitpoints, hitpoints, kind.attacks.map(a => [a, undefined]), 
            Object.keys(kind.savingThrows).reduce((obj: any, st: any) => {
                obj[st] = undefined
                return obj
            }, {}) as unknown as Record<SavingThrow, RollResult | undefined>
        )
    }    

    constructor(
        public readonly label: string, 
        public readonly kind: Kind, 
        public readonly hitpoints: number, 
        public readonly currentHitpoints: number,
        public readonly attacks: Array<[Attack, Hit | undefined]>,
        public readonly savingThrows: SavingThrows<RollResult | undefined>,
    ) { }
    
    get isDead(): boolean {
        return this.currentHitpoints <= 0
    }

    rollSavingThrow(savingThrow: SavingThrow): Character {
        const savingThrows = Object.assign({}, this.savingThrows)
        savingThrows[savingThrow] = Roll.create(1, 20, this.kind.savingThrows[savingThrow]).roll()

        return new Character(this.label, this.kind, this.hitpoints, this.currentHitpoints, this.attacks, savingThrows)
    }

    performAttack(attack: Attack): Character {
        const idx = this.attacks.findIndex(a => a[0] === attack)
        if (idx < 0) {
            throw `invalid attack: ${this} ${attack}`
        }
        let attacks = this.attacks.slice(0, idx)
        attacks.push([attack, attack.execute()])
        attacks = attacks.concat(this.attacks.slice(idx + 1))

        return new Character(this.label, this.kind, this.hitpoints, this.currentHitpoints, attacks, this.savingThrows)
    }
    
    updateCurrentHitPoints (delta: number): Character {
        return new Character(this.label, this.kind, this.hitpoints, this.currentHitpoints + delta, this.attacks, this.savingThrows)
    }

    toUrlHash(): string {
        return [this.label, this.kind.label, this.hitpoints, this.currentHitpoints].join(";")
    }
}

export type Tab = "characters" | "kinds"

export class Model {
    static fromUrlHash(urlHash: string, kinds: Array<Kind>): Model {
        return new Model(kinds, 
            decodeURIComponent(urlHash).split("&")
                .map(characterHash => {
                    const [label, kindLabel, hitpointsStr, currentHitpointsStr] = characterHash.split(";")
                    if (kindLabel === "") {
                        return null
                    }
                    
                    const hitpoints = parseInt(hitpointsStr)
                    if (isNaN(hitpoints)) {
                        return null
                    }

                    const currentHitpoints = parseInt(currentHitpointsStr)
                    if (isNaN(currentHitpoints)) {
                        return null
                    }

                    const kind = kinds.find(k => k.label === kindLabel)
                    if (!kind) {
                        return null
                    }

                    return new Character(label, kind, hitpoints, currentHitpoints, kind.attacks.map(a => [a, undefined]),
                    Object.keys(kind.savingThrows).reduce((obj: any, st: any) => {
                        obj[st] = undefined
                        return obj
                    }, {}) as unknown as Record<SavingThrow, RollResult | undefined>
                )
        
                })
                .filter(c => c !== null) as Array<Character>
        )
    }

    constructor(        
        public readonly kinds: Array<Kind>,
        public readonly characters: Array<Character>,
        public readonly tab: Tab = "characters",
    ) {}

    toUrlHash(): string {
        return encodeURIComponent(this.characters.map(c => c.toUrlHash()).join("&"))
    }    

    createCharacter(label: string, kind: Kind): Model {
        const characters = this.characters.slice()
        characters.push(Character.create(label, kind))
        
        return new Model(this.kinds, characters)
    }

    removeCharacter(character: Character): Model {
        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }
        const characters = this.characters.slice()
        characters.splice(idx, 1)
        
        return new Model(this.kinds, characters, this.tab)
    }

    rollSavingThrow(character: Character, savingThrow: SavingThrow): Model {
        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }

        let characters = this.characters.slice(0, idx)
        characters.push(character.rollSavingThrow(savingThrow))
        characters = characters.concat(this.characters.slice(idx + 1))

        return new Model(this.kinds, characters, this.tab)

    }

    performAttach(character: Character, attack: Attack): Model {
        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }

        let characters = this.characters.slice(0, idx)
        characters.push(character.performAttack(attack))
        characters = characters.concat(this.characters.slice(idx + 1))

        return new Model(this.kinds, characters, this.tab)
    }
    
    updateCurrentHitPoints(character: Character, delta: number): Model {
        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }

        let characters = this.characters.slice(0, idx)
        characters.push(character.updateCurrentHitPoints(delta))
        characters = characters.concat(this.characters.slice(idx + 1))

        return new Model(this.kinds, characters, this.tab)
    }
}
