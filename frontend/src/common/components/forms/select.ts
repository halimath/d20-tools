import * as wecco from "@weccoframework/core"

export interface SelectOptions {
    onChange: (index: number) => void
    options: Array<wecco.ElementUpdate>
    id?: string
    selectedIndex?: number
    classes?: string | Array<string>
}

export const select = wecco.define("select-field", ({data}: wecco.RenderContext<SelectOptions>) => {
    const styleClasses = Array.isArray(data.classes) ? data.classes.join(" ") : (data.classes ?? "")

    return wecco.html`
        <select id+omitempty=${data.id} class=${styleClasses} @change=${(e: Event) => data.onChange((e.target as HTMLSelectElement).selectedIndex)}>
            ${data.options.map(o => wecco.html`<option>${o}</option>`)}
        </select>
    `
})