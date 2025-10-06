import { Character, Kind } from "../models"
import { convertCharacter, convertKind, reconstructCharacter, reconstructKind } from "./converter"
import * as dtos from "./dto"

export function loadKinds(): Promise<Array<Kind>> {
    const r = localStorage.getItem("kinds")
    if (!r) {
        return Promise.resolve([])
    }

    try {
        const dtos = JSON.parse(r) as Array<dtos.Kind>
        return Promise.resolve(dtos.map(reconstructKind))
    } catch (e) {
        return Promise.reject(e)
    }
}

export function saveKinds(kinds: Array<Kind>): Promise<void> {
    localStorage.setItem("kinds", JSON.stringify(kinds.map(convertKind)))
    return Promise.resolve()
}

export function loadCharacters(kinds: Array<Kind>): Promise<Array<Character>> {
    const r = localStorage.getItem("characters")
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
    localStorage.setItem("characters", JSON.stringify(characters.map(convertCharacter)))
    return Promise.resolve()
}