import * as wecco from "@weccoframework/core"

export interface InputValidator {
    (value?: string): boolean
}

export interface InputOptions {
    id?: string
    type?: "text" | "number" 
    value?: string
    onChange: (value: string) => void
    classes?: string | Array<string>
    validator?: InputValidator | Array<InputValidator>
    validClass?: string
    invalidClass?: string
    isValid?: boolean
}

export const inputField = wecco.define("input-field", (data: InputOptions, context: wecco.RenderContext) => {    
    if (typeof data.isValid === "undefined" && typeof data.value !== "undefined") {
        data.isValid = validate(data)
    }

    const styleClasses = Array.isArray(data.classes) ? data.classes.slice() : [data.classes ?? ""]
    if (typeof data.isValid !== "undefined") {
        styleClasses.push(data.isValid ? (data.validClass ?? "is-valid") : (data.invalidClass ?? "is-invalid"))
    }
    
    const onChange = (e: Event) => {
        data.value = (e.target as HTMLInputElement).value
        if (data.validator) {
            data.isValid = validate(data)
        }
        if (data.isValid) {
            data.onChange(data.value)
        }
        context.requestUpdate()
    }

    return wecco.html`<input type=${data.type ?? "text"} id+omitempty=${data.id} class=${styleClasses.join(" ")} .value=${data.value ?? ""} @blur=${onChange}>`
})

function validate (data: InputOptions): boolean {
    if (data.validator) {
        if (!Array.isArray(data.validator)) {
            return data.validator(data.value)
        }
        return data.validator.reduce((valid, validator) => valid && validator(data.value), true)
    }
    return true
}

export function notEmpty(v?: string): boolean {
    return !!v && v.trim().length > 0
}

