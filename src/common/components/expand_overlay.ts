import * as wecco from "@weccoframework/core"

export interface ExpandOverlayOpts {
    collapsed: wecco.ElementUpdate
    expanded: wecco.ElementUpdate
    isExpanded?: boolean
    position?: Array<number>
}

export const expandOverlay = wecco.define("d20tools-exand_overlay", ({data, requestUpdate}: wecco.RenderContext<ExpandOverlayOpts>) => {
    const toggleState = (e: MouseEvent) => {
        console.log(data)
        data.isExpanded = !data.isExpanded
        data.position = [e.clientX, e.clientY]
        requestUpdate()
    }

    const result = [wecco.html`<a href="#" @click+preventDefault=${toggleState}>${data.collapsed}</a>`]

    if (data.isExpanded) {
        data.position = data.position ?? [100, 100]
        result.push(wecco.html`<div class="expand-overlay shadow border z-3" style="left: ${data.position[0]}px; top: ${data.position[1]}px">${data.expanded}</div>`)
    }
    return result
})
