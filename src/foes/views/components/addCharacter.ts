import * as wecco from "@weccoframework/core"
import { select } from "src/common/components/forms/select"
import { inputField, notEmpty } from "../../../common/components/forms/input"
import { modal, ModalHandleBinder } from "../../../common/components/modal"
import { tabs } from "../../../common/components/tabs"
import { CreateNPC, CreatePC, Message } from "../../controller"
import { m } from "../../../common/i18n"
import { Kind } from "../../models"

export function addCharacterModal(kinds: Array<Kind>, context: wecco.AppContext<Message>, binder: ModalHandleBinder): wecco.ElementUpdate {
    let label: string
    let kindIndex = 0
    let ini = 0
    let characterType: "pc" | "npc" = "npc"

    const onCreate = () => {
        if (characterType === "npc") {
            const kind = kinds[kindIndex]
            console.log(kind, kindIndex)
            context.emit(new CreateNPC(label, kind))
        } else {
            context.emit(new CreatePC(label, ini, 0))
        }
    }

    return modal(wecco.html`
        <div class="modal-header">
            <h5 class="modal-title">${m("foes.createCharacter")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class="mb-2">
                <label for="create-character-label">${m("foes.label")}</label>
                ${inputField({
                    id: "create-character-label",
                    validator: notEmpty,
                    onChange: l => label = l,
                    classes: "form-control",
                })}
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
                        <label for="create-character-kind">${m("foes.kind")}</label>
                        ${select({
                            options: kinds.map(k => k.label),
                            onChange: (k) => kindIndex = k,
                            classes: "form-select",
                            id: "create-character-kind",
                        })}
                    </div>
                `
            }, {
                label: m("foes.pc"),
                content: wecco.html`
                    <div class="mb-2">
                        <label for="create-character-ini">${m("foes.ini")}</label>
                        ${inputField({
                            type: "number",
                            id: "create-character-ini",
                            classes: "form-control",
                            validator: notEmpty,
                            onChange: i => ini = parseInt(i),
                        })}
                    </div>       
                `})}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${m("close")}</button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click=${onCreate}>${m("foes.createCharacter")}</button>
        </div>
`, 
{
    binder: binder,
})
}

