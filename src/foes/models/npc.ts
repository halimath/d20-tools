import { Character } from "./character"
import { DieRoll, Roll, RollResult } from "./roll"

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

export type SavingThrow = "str" | "dex" | "con" | "int" | "wis" | "cha"

export const SavingThrowKeys: Array<SavingThrow> = ["str", "dex", "con", "int", "wis", "cha"]

export type SavingThrows<T> = Record<SavingThrow, T>

export interface KindOptions {
    ac: number
    ini: number
    speed: number
    savingThrows: SavingThrows<number>
    hitDie: Roll
    tags?: Array<string>
    attacks?: Array<Attack>
}

export class Kind {
    static empty(): Kind {
        return new Kind("", {
            speed: 6,
            ac: 10,
            ini: 0,
            hitDie: Roll.parse("1d4"),
            savingThrows: {
                str: 0,
                dex: 0,
                con: 0,
                int: 0,
                wis: 0,
                cha: 0,
            },
        })
    }

    public readonly speed: number 
    public readonly ac: number
    public readonly ini: number
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
        this.ini = options.ini
        this.ac = options.ac
        this.hitDie = options.hitDie
        this.savingThrows = {
            str: options.savingThrows.str,
            dex: options.savingThrows.dex,
            con: options.savingThrows.con,
            int: options.savingThrows.int,
            wis: options.savingThrows.wis,
            cha: options.savingThrows.cha,
        }
        this.tags = options.tags ?? []
        this.attacks = (options.attacks ?? []).concat(attacks)
    }

    rollIni(): RollResult {
        return new Roll(new DieRoll(20), this.ini).roll()
    }
}

export class NPC implements Character {
    static create (label: string, kind: Kind, hitpoints?: number, currentHitpoints?: number, ini?: RollResult): NPC {
        const hp = hitpoints ?? kind.hitDie.roll().value

        return new NPC(label, kind, ini ?? kind.rollIni(), hp, currentHitpoints ?? hp, kind.attacks.map(a => [a, undefined]), 
            Object.keys(kind.savingThrows).reduce((obj: any, st: any) => {
                obj[st] = undefined
                return obj
            }, {}) as unknown as Record<SavingThrow, RollResult | undefined>
        )
    }    

    constructor(
        public readonly label: string, 
        public readonly kind: Kind, 
        public readonly ini: RollResult,
        public readonly hitpoints: number, 
        public readonly currentHitpoints: number,
        public readonly attacks: Array<[Attack, Hit | undefined]>,
        public readonly savingThrows: SavingThrows<RollResult | undefined>,
    ) { }
    
    get isDead(): boolean {
        return this.currentHitpoints <= 0
    }

    rollSavingThrow(savingThrow: SavingThrow): NPC {
        const savingThrows: SavingThrows<RollResult | undefined> = {
            str: undefined,
            dex: undefined,
            con: undefined,
            int: undefined,
            wis: undefined,
            cha: undefined,
        }
        savingThrows[savingThrow] = Roll.create(1, 20, this.kind.savingThrows[savingThrow]).roll()

        return new NPC(this.label, this.kind, this.ini, this.hitpoints, this.currentHitpoints, this.attacks, savingThrows)
    }

    performAttack(attack: Attack): NPC {
        const idx = this.attacks.findIndex(a => a[0] === attack)
        if (idx < 0) {
            throw `invalid attack: ${this} ${attack}`
        }
        let attacks = this.attacks.slice(0, idx)
        attacks.push([attack, attack.execute()])
        attacks = attacks.concat(this.attacks.slice(idx + 1))

        return new NPC(this.label, this.kind, this.ini, this.hitpoints, this.currentHitpoints, attacks, this.savingThrows)
    }
    
    updateCurrentHitPoints (delta: number): NPC {
        return new NPC(this.label, this.kind, this.ini, this.hitpoints, this.currentHitpoints + delta, this.attacks, this.savingThrows)
    }

    toUrlHash(): string {
        return [this.label, this.kind.label, this.hitpoints, this.currentHitpoints].join(";")
    }

    toJSON(): Record<string, unknown> {
        return {
            "type": "npc",
            "label": this.label,
            "kind": this.kind.label,
            "hp": this.hitpoints,
            "chp": this.currentHitpoints,
            "ini": this.ini,
        }
    }
}
