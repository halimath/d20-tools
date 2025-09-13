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

export function root({model, emit}: wecco.ViewContext<Model, Message>): wecco.ElementUpdate {
    let content: wecco.ElementUpdate = ""
    
    if (model.tab === "characters") {
        content = model.characters.map((c, idx) => wecco.html`<div class="col-12" @click=${() => emit(new SelectActiveCharacter(idx))}>${character(emit, c, idx === model.activeCharacterIndex)}</div>`)
    } else {
        content = wecco.html`<div class="col card">${kinds(model.kinds, emit)}</div>`        
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
                            <a class="nav-link ${model.tab === "characters" ? "active" : ""}" @click=${() => emit(new SelectTab("characters"))}>${m("foes.characters")}</a>
                            <a class="nav-link ${model.tab === "kinds" ? "active" : ""}" @click=${() => emit(new SelectTab("kinds"))}>${m("foes.kinds")}</a>
                        </nav>
                    </div>
                    <div class="col text-end">
                        <button class="btn btn-large btn-primary" @click=${() => {
                            // if (model.tab === "kinds") {
                            //     updateKindModal(Kind.empty(), k => emit(new SaveKind(k)), modalHandleBinder)
                            // }
                            createModalHandle.show()
                        }}><i class="material-icons">add</i></button>            

                        ${model.tab !== "characters" ? "" : wecco.html`
                            <button class="btn btn-large btn-outline-danger" @click=${() => emit(new Clear())}><i class="material-icons">delete</i></button>
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
            ? addCharacterModal(model.kinds, emit, modalHandleBinder)
            : editKindModal(k => emit(new SaveKind(k)), modalHandleBinder)
        }
    `

    return appShell(body)
}

