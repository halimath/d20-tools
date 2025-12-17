import * as wecco from "@weccoframework/core"
import { appShell } from "../../common/components/appShell"
import { m } from "../../common/i18n"
import { Clear, Message, SaveKind, SelectTab, SwitchInitiativeKind } from "../controller"
import { Kind, Model } from "../models"
import { showAddNPCDialog, showAddPCDialog } from "./components/addCharacter"
import { characters } from "./components/character"
import { showEditKindModal } from "./components/editKind"
import { kinds } from "./components/kind"

export function root({model, emit}: wecco.ViewContext<Model, Message>): wecco.ElementUpdate {
    let content: wecco.ElementUpdate = ""
    
    if (model.tab === "characters") {
        content = characters(model, emit)
    } else {
        content = kinds(model.kinds, emit)
    }

    const body = wecco.html`
        <div class="topnav">
            <div class="container">
                <div class="row mt-2">
                    <div class="col-8">
                        <nav class="nav nav-pills">
                            <a href="#" class="nav-link ${model.tab === "characters" ? "active" : ""}" @click=${() => emit(new SelectTab("characters"))}>${m("encounters.characters")}</a>
                            <a href="#" class="nav-link ${model.tab === "kinds" ? "active" : ""}" @click=${() => emit(new SelectTab("kinds"))}>${m("encounters.kinds")}</a>
                        </nav>
                    </div>
                    <div class="col text-end">
                        ${ model.tab === "kinds"
                            ? wecco.html`
                                <button class="btn btn-large" @click=${() => {
                                    showEditKindModal(Kind.empty(), k => emit(new SaveKind(k)))
                                }}><span class="material-icons">add</span></button>`
                            : wecco.html`
                                <button class="btn btn-large" @click=${() => {
                                    showAddPCDialog(emit)
                                }}>${m("encounters.add.pc")}</button>
                                <button class="btn btn-large" ?disabled=${model.kinds.length === 0} @click=${() => {
                                    showAddNPCDialog(model.kinds, emit)
                                }}>${m("encounters.add.npc")}</button>
                                <button class="btn btn-large" @click=${() => emit(new Clear())}><i class="material-icons">delete</i></button>
                                <span class="form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" id="initiative-kind" 
                                        ?checked=${model.initiativeKind === "static"}
                                        @change=${(evt: InputEvent) => {
                                            const t = evt.target as HTMLInputElement
                                            emit(new SwitchInitiativeKind(t.checked ? "static" : "roll"))
                                        }}>
                                    <label class="form-check-label" for="initiative-kind">${m("encounters.staticIni")}</label>
                                </span>
                            `
                        }
                    </div>
                </div>
            </div>
        </div>

        <div class="container">
            <div class="row mt-2">
                ${content}
            </div>
        </div>

    `
    return appShell(body, "encounters")
}

