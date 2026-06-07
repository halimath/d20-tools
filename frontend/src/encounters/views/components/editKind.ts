import * as wecco from "@weccoframework/core"
import { inputField, notEmpty } from "d20-tools/common/components/forms/input"
import { modal } from "d20-tools/common/components/modal"
import { m } from "d20-tools/common/i18n"
import { Attack, AttributeKeys, Damage, Kind, Roll } from "../../models"

export interface SaveHandler {
    (k: Kind): void
}

let editKindDialogIndex = 0

export function showEditKindModal (kind: Kind, saveHandler: SaveHandler): void {
    const editorData: KindEditorData = {
        idPrefix: `edit-kind-${editKindDialogIndex++}-`,
        kind: kind,
        editForm: {
            label: kind?.label,
            ac: kind?.ac.toString(),
            hitDie: kind?.hitDie.toString(),
            speed: kind?.speed.toString(),
            challengeRate: kind?.challengeRate?.toString() ?? "1",
            xp: kind?.xp?.toString() ?? "200",
            str: kind?.attributes.str.toString(),
            dex: kind?.attributes.dex.toString(),
            con: kind?.attributes.con.toString(),
            int: kind?.attributes.int.toString(),
            wis: kind?.attributes.wis.toString(),
            cha: kind?.attributes.cha.toString(),
        },
        attacks: kind?.attacks.map(a => {
            return {
                label: a.label,
                mod: a.mod.toString(),
                damage: a.damage[0].damage.toString(),
            }
        }) ?? [],
        onSave: saveHandler,
    }

    modal(kindEditor(editorData), {
        size: "lg",
        show: true,
    })    
}

interface AttackData {
    label?: string
    mod?: string
    damage?: string
}

interface EditFormData {
    label?: string
    ac?: string
    speed?: string
    challengeRate?: string
    xp?: string
    hitDie?: string
    str?: string    
    dex?: string    
    con?: string    
    int?: string    
    wis?: string    
    cha?: string    
}

interface KindEditorData {
    idPrefix: string
    kind?: Kind
    editForm?: EditFormData
    attacks?: Array<AttackData>
    onSave: (kind: Kind) => void
}

const kindEditor = wecco.define("kind-editor", ({data, requestUpdate}: wecco.RenderContext<KindEditorData>) => {
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
                hitDie: Roll.parse(data.editForm!.hitDie!),
                speed: parseInt(data.editForm!.speed!),
                challengeRate: parseFloat(data.editForm!.challengeRate!),
                xp: parseInt(data.editForm!.xp!),
                attributes: {
                    str: parseInt(data.editForm!.str!),
                    dex: parseInt(data.editForm!.dex!),
                    con: parseInt(data.editForm!.con!),
                    int: parseInt(data.editForm!.int!),
                    wis: parseInt(data.editForm!.wis!),
                    cha: parseInt(data.editForm!.cha!),
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
            <h5 class="modal-title">${m("encounters.edit.title")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                <span class="material-icons">close</span>
            </button>
        </div>
        <div class="modal-body">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col">
                        <label for="${data.idPrefix}label">${m("encounters.label")}</label>
                        ${inputField({
                            id: `${data.idPrefix}label`,
                            value: data.editForm.label,
                            classes: "form-control",
                            onChange: bindEditFormAttribute("label"),
                            validator: notEmpty,
                        })}
                    </div>
                    <div class="col-2">
                        <label for="${data.idPrefix}challengeRate">${m("encounters.cr")}</label>
                        ${inputField({
                            type: "number",
                            id: `${data.idPrefix}challengeRate`,
                            value: data.editForm.challengeRate,
                            classes: "form-control",
                            onChange: bindEditFormAttribute("challengeRate"),
                            validator: notEmpty,
                        })}                                
                    </div>
                    <div class="col-2">
                        <label for="${data.idPrefix}xp">${m("encounters.xp")}</label>
                        ${inputField({
                            type: "number",
                            id: `${data.idPrefix}xp`,
                            value: data.editForm.xp,
                            classes: "form-control",
                            onChange: bindEditFormAttribute("xp"),
                            validator: notEmpty,
                        })}                                
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col">
                        <label for="${data.idPrefix}ac">${m("encounters.ac")}</label>
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
                        <label for="${data.idPrefix}speed">${m("encounters.speed")}</label>
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
                        <label for="${data.idPrefix}hp">${m("encounters.hp")}</label>
                        ${inputField({
                            id: `${data.idPrefix}hp`,
                            value: data.editForm.hitDie,
                            classes: "form-control",
                            onChange: bindEditFormAttribute("hitDie"),
                            validator: [notEmpty, rollValidator]
                        })}
                    </div>        
                </div>

                <h5>${m("encounters.attributes")}</h5>
                <div class="row mb-2">
                    ${
                        AttributeKeys.map(st => wecco.html`
                            <div class="col">
                                <label for="${data.idPrefix}${st}">${m(`encounters.attribute.${st}`)}</label>
                                ${inputField({
                                    type: "number",
                                    id: `${data.idPrefix}${st}`,
                                    value: data.editForm ? data.editForm[st] : "",
                                    classes: "form-control",
                                    onChange: bindEditFormAttribute(st),
                                    validator: notEmpty,
                                })}                                
                            </div>
                        `)
                    }
                </div>

                <div class="mb-2">
                    <h5>${m("encounters.attacks")}</h5>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>${m("encounters.attack")}</th>
                                <th>${m("encounters.modifier")}</th>
                                <th>${m("encounters.damage")}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.attacks?.map((a, idx) => attackRow(data.attacks!, a, idx, requestUpdate))}
                        </tbody>
                    </table>
                    <div class="text-end">
                        <button class="btn btn-link" @click=${() => { data.attacks?.push({}); requestUpdate() }}><i class="material-icons">add</i></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${m("close")}</button>
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click=${onCreate}>${m("encounters.edit.save")}</button>
        </div>
    `
})

function attackRow(attacks: Array<AttackData>, attack: AttackData, idx: number, requestUpdate: () => void): wecco.ElementUpdate {
    const bindField = (name: keyof AttackData) => 
        (value: string) => attacks[idx][name] = value
    
    return wecco.html`
        <tr>
            <td>${inputField({value: attack.label, classes: "form-control", onChange: bindField("label"), validator: notEmpty})}</td>
            <td>${inputField({value: attack.mod, type: "number", classes: "form-control", onChange: bindField("mod"), validator: notEmpty})}</td>
            <td>${inputField({value: attack.damage, classes: "form-control", onChange: bindField("damage"), validator: [notEmpty, rollValidator]})}</td>
            <td><button class="btn btn-link" @click=${() => { attacks.splice(idx, 1); requestUpdate()}}><i class="material-icons">delete</i></button></td>
        </tr>
    `
}

const rollValidator = (v: string) => {
    try {
        Roll.parse(v)
        return true                        
    } catch {
        return false
    }
}
