import * as wecco from "@weccoframework/core"
import { select } from "d20-tools/common/components/forms/select"
import { inputField, notEmpty } from "d20-tools/common/components/forms/input"
import { modal } from "d20-tools/common/components/modal"
import { tabs } from "d20-tools/common/components/tabs"
import { CreateNPC, CreatePC, Message } from "../../controller"
import { m } from "d20-tools/common/i18n"
import { Kind } from "../../models"

interface AddPCDialogData {
    label?: string
    ini?: number
    emit: wecco.MessageEmitter<Message>
}

const AddPCDialog = wecco.define<AddPCDialogData>("add-pc", ({ data }) => {
    const onCreate = () => {
        data.emit(new CreatePC(data.label ?? "", data.ini ?? 0))
    }
    return wecco.html`
        <div class="modal-header">
            <h5 class="modal-title">${m("foes.add.pc")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
            <div class="mb-2">
                <label for="create-character-label">${m("foes.label")}</label>
                ${inputField({
        id: "create-character-label",
        validator: notEmpty,
        onChange: l => data.label = l,
        classes: "form-control",
    })}
            </div>

            <div class="mb-2">
                <label for="create-character-ini">${m("foes.ini")}</label>
                ${inputField({
        type: "number",
        id: "create-character-ini",
        classes: "form-control",
        validator: notEmpty,
        onChange: i => data.ini = parseInt(i),
    })}
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${m("close")}</button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click=${onCreate}>${m("save")}</button>
        </div>    
    `
})

export function showAddPCDialog(emit: wecco.MessageEmitter<Message>): void {
    modal(AddPCDialog({ emit }), {
        show: true,
    })
}

// --

interface AddNPCDialogData {
    label?: string
    kind?: Kind
    kinds: Array<Kind>
    emit: wecco.MessageEmitter<Message>
}

const AddNPCDialog = wecco.define<AddNPCDialogData>("add-npc", ({ data }) => {
    const onCreate = () => {
        data.emit(new CreateNPC(data.label ?? "", data.kind ?? data.kinds[0]))
    }

    return wecco.html`
        <div class="modal-header">
            <h5 class="modal-title">${m("foes.add.npc")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class="mb-2">
                <label for="create-character-label">${m("foes.label")}</label>
                ${inputField({
                    id: "create-character-label",
                    validator: notEmpty,
                    onChange: l => data.label = l,
                    classes: "form-control",
                })}
            </div>

            <div class="mb-2">
                <label for="create-character-kind">${m("foes.kind")}</label>
                ${select({
                    options: data.kinds.map(k => k.label),
                    onChange: (k) => data.kind = data.kinds[k],
                    classes: "form-select",
                    id: "create-character-kind",
                })}
            </div>                
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${m("close")}</button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click=${onCreate}>${m("save")}</button>
        </div>
    `
})

export function showAddNPCDialog(kinds: Array<Kind>, emit: wecco.MessageEmitter<Message>) {
        modal(AddNPCDialog({ kinds, emit }), {
        show: true,
    })
}

