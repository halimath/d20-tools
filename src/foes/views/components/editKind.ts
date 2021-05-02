import * as wecco from "@weccoframework/core"
import { inputField, notEmpty } from "../../../common/components/forms/input"
import { modal, ModalHandle, ModalHandleBinder } from "../../../common/components/modal"
import { m } from "../../../common/i18n"
import { Attack, Damage, Kind, Roll } from "../../models"

export interface SaveHandler {
    (k: Kind): void
}

let editKindDialogIndex = 0

export function editKindModal (saveHandler: SaveHandler, binder: ModalHandleBinder, kind?: Kind): wecco.ElementUpdate {
    let modalHandle: ModalHandle

    const editorData: KindEditorData = {
        idPrefix: `edit-kind-${editKindDialogIndex++}-`,
        kind: kind,
        editForm: {
            label: kind?.label,
            tags: kind?.tags.join(", "),
            ac: kind?.ac.toString(),
            hitDie: kind?.hitDie.toString(),
            ini: kind?.ini.toString(),
            speed: kind?.speed.toString(),
            reflex: kind?.savingThrows.reflex.toString(),
            will: kind?.savingThrows.will.toString(),
            fortitude: kind?.savingThrows.fortitude.toString(),
        },
        attacks: kind?.attacks.map(a => {
            return {
                label: a.label,
                mod: a.mod.toString(),
                damage: a.damage[0].damage.toString(),
            }
        }) ?? [],
        modalBinder: binder,
        onSave: k => { modalHandle.hide(); saveHandler(k) },
    }

    return modal(kindEditor(editorData), {
        size: "lg",
        binder: (h: ModalHandle) => { modalHandle = h; binder(h)},
    })    
}

interface AttackData {
    label?: string
    mod?: string
    damage?: string
}

interface EditFormData {
    label?: string
    tags?: string
    ini?: string
    ac?: string
    speed?: string
    hitDie?: string
    reflex?: string
    will?: string
    fortitude?: string    
}

interface KindEditorData {
    idPrefix: string
    kind?: Kind
    editForm?: EditFormData
    attacks?: Array<AttackData>
    onSave: (kind: Kind) => void
    modalBinder?: ModalHandleBinder
}

const kindEditor = wecco.define("kind-editor", (data: KindEditorData, context: wecco.RenderContext) => {
    // eslint-disable @typescript-eslint/no-non-null-assertion
    data.editForm = data.editForm ?? {}
    data.attacks = data.attacks ?? []

    function bindEditFormAttribute(name: keyof EditFormData) {
        return (v: string) => {
            data.editForm![name] = v
            // context.requestUpdate()
        }
    }

    const onCreate = () => {
        try {
            const kind = new Kind(data.editForm!.label!, {
                ac: parseInt(data.editForm!.ac!),
                ini: parseInt(data.editForm!.ini!),
                hitDie: Roll.parse(data.editForm!.hitDie!),
                speed: parseInt(data.editForm!.speed!),
                tags: data.editForm!.tags?.split(", "),
                savingThrows: {
                    reflex: parseInt(data.editForm!.reflex!),
                    will: parseInt(data.editForm!.will!),
                    fortitude: parseInt(data.editForm!.fortitude!),
                }
            }, ...data.attacks?.map(a => new Attack(a.label ?? "", parseInt(a.mod ?? "0"), new Damage("", Roll.parse(a.damage ?? "")))) ?? []
            )
            data.onSave(kind)           
        } catch (err) {
            console.log(err)
        }
    }    

    return wecco.html`
        <div class="modal-header">
            <h5 class="modal-title">${m("foes.edit.title")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class="mb-2">
                <label for="${data.idPrefix}label">${m("foes.label")}</label>
                ${inputField({
                    id: `${data.idPrefix}label`,
                    value: data.editForm.label,
                    classes: "form-control",
                    onChange: bindEditFormAttribute("label"),
                    validator: notEmpty,
                })}
            </div>
            <div class="mb-2">
                <label for="${data.idPrefix}tags">${m("foes.tags")}</label>
                ${inputField({
                    id: `${data.idPrefix}tags`,
                    value: data.editForm.tags,
                    classes: "form-control",
                    onChange: bindEditFormAttribute("tags"),
                })}
            </div>
            
            <div class="row mb-2">
                <div class="col">
                    <label for="${data.idPrefix}ini">${m("foes.ini")}</label>
                    ${inputField({
                        type: "number",
                        id: `${data.idPrefix}ini`,
                        value: data.editForm.ini,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("ini"),
                        validator: notEmpty,
                    })}                                
                </div>
                <div class="col">
                    <label for="${data.idPrefix}ac">${m("foes.ac")}</label>
                    ${inputField({
                        type: "number",
                        id: `${data.idPrefix}ac`,
                        value: data.editForm.ac,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("ac"),
                        validator: notEmpty,
                    })}                                
                </div>
                <div class="col">
                    <label for="${data.idPrefix}speed">${m("foes.speed")}</label>
                    ${inputField({
                        type: "number",
                        id: `${data.idPrefix}speed`,
                        value: data.editForm.speed,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("speed"),
                        validator: notEmpty,
                    })}                                

                </div>        
                <div class="col">
                    <label for="${data.idPrefix}hp">${m("foes.hp")}</label>
                    ${inputField({
                        id: `${data.idPrefix}hp`,
                        value: data.editForm.hitDie,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("hitDie"),
                        validator: [notEmpty, rollValidator]
                    })}
                </div>        
            </div>

            <div class="row mb-2">
                <div class="col">
                    <label for="${data.idPrefix}reflex">${m("foes.savingthrow.reflex")}</label>
                    ${inputField({
                        type: "number",
                        id: `${data.idPrefix}reflex`,
                        value: data.editForm.reflex,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("reflex"),
                        validator: notEmpty,
                    })}                                
                </div>
                <div class="col">
                    <label for="${data.idPrefix}will">${m("foes.savingthrow.will")}</label>
                    ${inputField({
                        type: "number",
                        id: `${data.idPrefix}will`,
                        value: data.editForm.will,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("will"),
                        validator: notEmpty,
                    })}                                
                </div>
                <div class="col">
                    <label for="${data.idPrefix}fortitude">${m("foes.savingthrow.fortitude")}</label>
                    ${inputField({
                        type: "number",
                        id: `${data.idPrefix}fortitude`,
                        value: data.editForm.fortitude,
                        classes: "form-control",
                        onChange: bindEditFormAttribute("fortitude"),
                        validator: notEmpty,
                    })}
                </div>
            </div>

            <div class="mb-2">
                <h6>${m("foes.attacks")}</h6>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>${m("foes.attack")}</th>
                            <th>${m("foes.modifier")}</th>
                            <th>${m("foes.damage")}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.attacks?.map((a, idx) => attackRow(data.attacks!, a, idx, context))}
                    </tbody>
                </table>
                <div class="text-end">
                    <button class="btn btn-link" @click=${() => { data.attacks?.push({}); context.requestUpdate() }}><i class="material-icons">add</i></button>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${m("close")}</button>
            <button type="button" class="btn btn-primary" @click=${onCreate}>${m("foes.edit.save")}</button>
        </div>
    `
})

function attackRow(attacks: Array<AttackData>, attack: AttackData, idx: number, context: wecco.RenderContext): wecco.ElementUpdate {
    const bindField = (name: keyof AttackData) => 
        (value: string) => attacks[idx][name] = value
    
    return wecco.html`
        <tr>
            <td>${inputField({value: attack.label, classes: "form-control", onChange: bindField("label"), validator: notEmpty})}</td>
            <td>${inputField({value: attack.mod, type: "number", classes: "form-control", onChange: bindField("mod"), validator: notEmpty})}</td>
            <td>${inputField({value: attack.damage, classes: "form-control", onChange: bindField("damage"), validator: [notEmpty, rollValidator]})}</td>
            <td><button class="btn btn-link" @click=${() => { attacks.splice(idx, 1); context.requestUpdate()}}><i class="material-icons">delete</i></button></td>
        </tr>
    `
}

const rollValidator = (v: string) => {
    try {
        Roll.parse(v)
        return true                        
    } catch (e) {
        return false
    }
}