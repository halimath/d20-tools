import * as wecco from "@weccoframework/core"
import { ModalHandle } from "../../common/components/modal-deprecated"
import { appShell } from "../../common/components/appShell"
import { Clear, Message, SaveKind, SelectActiveCharacter, SelectTab } from "../controller"
import { m } from "../../common/i18n"
import { Model } from "../models"
import { addCharacterModal } from "./components/addCharacter"
import { character } from "./components/character"
import { editKindModal } from "./components/editKind"
import { kinds } from "./components/kind"

export function root(model: Model, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    let content: wecco.ElementUpdate = ""
    
    if (model.tab === "characters") {
        content = model.characters.map((c, idx) => wecco.html`<div class="col-12" @click=${() => context.emit(new SelectActiveCharacter(idx))}>${character(context, c, idx === model.activeCharacterIndex)}</div>`)
    } else {
        content = wecco.html`<div class="col card">${kinds(model.kinds, context)}</div>`        
    }

    let createModalHandle: ModalHandle
    const modalHandleBinder = (h: ModalHandle) => {
        createModalHandle = h
    }

    const body = wecco.html`
        <div class="topnav">
            <div class="container">
                <div class="row mt-2">
                    <div class="col-8">
                        <nav class="nav nav-pills">
                            <a href="#" class="nav-link ${model.tab === "characters" ? "active" : ""}" @click=${(e: Event) => { e.preventDefault();  context.emit(new SelectTab("characters"))}}>${m("foes.characters")}</a>
                            <a href="#" class="nav-link ${model.tab === "kinds" ? "active" : ""}" @click=${(e: Event) => { e.preventDefault(); context.emit(new SelectTab("kinds"))}    }>${m("foes.kinds")}</a>
                        </nav>
                    </div>
                    <div class="col text-end">
                        <button class="btn btn-large btn-primary" @click=${() => {
                            // if (model.tab === "kinds") {
                            //     updateKindModal(Kind.empty(), k => context.emit(new SaveKind(k)), modalHandleBinder)
                            // }
                            createModalHandle.show()
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

        ${model.tab === "characters" 
            ? addCharacterModal(model.kinds, context, modalHandleBinder)
            : editKindModal(k => context.emit(new SaveKind(k)), modalHandleBinder)
        }
    `

    return appShell(body)
}

