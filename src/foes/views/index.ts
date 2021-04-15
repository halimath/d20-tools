import * as wecco from "@wecco/core"
import { modal, ModalHandle } from "src/common/components/modal"
import { tabs } from "../../common/components/tabs"
import { appShell } from "../../common/components/appShell"
import { Clear, CreateNPC, CreatePC, Message, SelectActiveCharacter, SelectTab } from "../controller"
import { m } from "../i18n"
import { Kind, Model } from "../models"
import { character } from "./components/character"
import { kind } from "./components/kind"

export function root(model: Model, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    let content: wecco.ElementUpdate = ""
    
    if (model.tab === "characters") {
        content = model.characters.map((c, idx) => wecco.html`<div class="col-12" @click=${() => context.emit(new SelectActiveCharacter(idx))}>${character(context, c, idx === model.activeCharacterIndex)}</div>`)
    } else {
        content = model.kinds.map(k => 
            wecco.html`<div class="col-sm-12 col-md-6 col-lg-4">${kind(k, context)}</div>`
        )
    }

    let addCharacterModalHandle: ModalHandle

    const body = wecco.html`
        <div class="topnav">        
            <div class="container">
                <div class="row mt-2">
                    <div class="col-8">
                        <nav class="nav">
                            <a class="nav-link ${model.tab === "characters" ? "active" : ""}" @click=${() => context.emit(new SelectTab("characters"))}>${m("foes.characters")}</a>
                            <a class="nav-link ${model.tab === "kinds" ? "active" : ""}" @click=${() => context.emit(new SelectTab("kinds"))}>${m("foes.kinds")}</a>
                        </nav>
                    </div>
                    <div class="col text-end">
                        <button class="btn btn-large btn-primary" @click=${() => {
                            if (model.tab === "characters") {
                                addCharacterModalHandle.show()
                            } else {
                                // TODO: Implement add kind
                            }
                        }}><i class="material-icons">add</i></button>            

                        ${model.tab !== "characters" ? "" : wecco.html`
                            <button class="btn btn-large btn-outline-danger" @click=${() => context.emit(new Clear())}><i class="material-icons">delete</i></button>
                        `}
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row mt-2">
                ${content}
            </div>
        </div>

        ${addCharacterModal(model.kinds, context, (m: ModalHandle) => {
            addCharacterModalHandle = m
        })}
    `

    return appShell(body)
}

function addCharacterModal(kinds: Array<Kind>, context: wecco.AppContext<Message>, binder: (h: ModalHandle) => void): wecco.ElementUpdate {
    let modalHandle: ModalHandle
    let labelInput: HTMLInputElement
    let iniInput: HTMLInputElement
    let kindSelect: HTMLSelectElement
    let characterType: "pc" | "npc" = "npc"

    const onCreate = () => {
        modalHandle.hide()
        
        const label = labelInput.value
        if (characterType === "npc") {
            const kind = kinds[parseInt(kindSelect.value)]
            context.emit(new CreateNPC(label, kind))
        } else {
            const ini = parseInt(iniInput.value)
            context.emit(new CreatePC(label, ini, 0))
        }
    }

    return modal(wecco.html`
    <div class="mb-2">
        <label for="create-character-label">${m("foes.createCharacter.label")}</label>
        <input type="text" id="create-character-label" placeholder=${m("foes.createCharacter.label")} class="form-control" @update=${(e: Event) => labelInput = e.target as HTMLInputElement}>
    </div>

    ${tabs({
        kind: "pills-fill",
        onTabSelected(_, idx) {
            characterType = idx === 0 ? "npc" : "pc"
        }
    }, {
        label: m("foes.npc"),
        content: wecco.html`
            <div class="mb-2">
                <label for="create-character-kind">${m("foes.createCharacter.kind")}</label>
                <select class="form-select" id="create-character-kind"  @update=${(e: Event) => kindSelect = e.target as HTMLSelectElement}>
                    ${kinds.map((k, idx) => wecco.html`<option value=${idx}>${k.label}</option>`)}
                </select>
            </div>        
        `
    }, {
        label: m("foes.pc"),
        content: wecco.html`
            <div class="mb-2">
                <label for="create-character-ini">${m("foes.ini")}</label>
                <input type="number" id="create-character-ini" class="form-control" @update=${(e: Event) => iniInput = e.target as HTMLInputElement}>
            </div>        
        `})}
`, 
{
    title: m("foes.createCharacter"),
    actions: [
        wecco.html`<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${m("close")}</button>`,
        wecco.html`<button type="button" class="btn btn-primary" @click=${onCreate}>${m("foes.createCharacter")}</button>`,
    ],
    onCreate: m => {modalHandle = m; binder(m)},
})
}

