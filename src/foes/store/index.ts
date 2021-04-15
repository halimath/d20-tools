import { Attack, Character, Damage, Kind, Roll } from "../models"
import { convertCharacter, reconstructCharacter } from "./converter"
import * as dtos from "./dto"

export function loadKinds(): Promise<Array<Kind>> {
    const kinds = [
        new Kind("Scherge m/ Kurzschwert", {
            ac: 14,
            ini: 2,
            speed: 6,
            hitDie: Roll.parse("2d8+2"),
            savingThrows: {
                reflex: 2,
                will: 0,
                fortitude: 1,
            },
            tags: ["Halb-Elf", "mittelgroß"]
        },
            new Attack("vergiftetes Kurzschwert", 3, new Damage("", Roll.parse("1w6+1")), new Damage("Gift (KO)", Roll.parse("1w2"))),
        ),
        new Kind("Scherge m/ l. Armbrust", {
            ac: 14,
            ini: 2,
            speed: 6,
            hitDie: Roll.parse("2d8+2"),
            savingThrows: {
                reflex: 2,
                will: 0,
                fortitude: 1,
            },
            tags: ["Halb-Elf", "mittelgroß"]
        },
            new Attack("Leichte Armbrust", 3, new Damage("", Roll.parse("1w6"))),
        ),
        new Kind("Wolf/Leopard", {
            ac: 14,
            ini: 2,
            speed: 10,
            hitDie: Roll.parse("2d8+4"),
            savingThrows: {
                reflex: 5,
                will: 1,
                fortitude: 5,
            },
            tags: ["Tier", "mittelgroß"]
        },
            new Attack("Biss", 3, new Damage("", Roll.parse("1w6+1"))),
        ),

        new Kind("Zombie", {
            ac: 11,
            ini: -1,
            speed: 6,
            hitDie: Roll.parse("2d8+2"),
            savingThrows: {
                reflex: -1,
                will: 3,
                fortitude: 0,
            },
            tags: ["Halb-Elf", "mittelgroß"]
        },
            new Attack("Hieb", 2, new Damage("", Roll.parse("1w6+1"))),
        ),

        new Kind("Goblin", {
            ac: 15,
            ini: 1,
            speed: 6,
            hitDie: Roll.parse("1d8"),
            savingThrows: {
                reflex: 1,
                will: 0,
                fortitude: 2,
            },
            tags: ["Goblinoid", "klein"]
        },
            new Attack("Morgenstern", 1, new Damage("", Roll.parse("1w8-3"))),
        )
    ]

    return Promise.resolve(kinds)
}

export function saveKinds(kinds: Array<Kind>): Promise<void> {
    console.log(kinds)
    return Promise.resolve()
}

export function loadCharacters(kinds: Array<Kind>): Promise<Array<Character>> {
    const r = sessionStorage.getItem("characters")
    if (!r) {
        return Promise.resolve([])
    }

    try {
        const dtos = JSON.parse(r) as Array<dtos.PC | dtos.NPC>
        return Promise.resolve(dtos.map(dto => reconstructCharacter(dto, kinds)))
    } catch (e) {
        return Promise.reject(e)
    }
}

export function saveCharacters(characters: Array<Character>): Promise<void> {
    sessionStorage.setItem("characters", JSON.stringify(characters.map(convertCharacter)))
    return Promise.resolve()
}