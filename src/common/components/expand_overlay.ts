import * as wecco from "@weccoframework/core"

export interface ExpandOverlayOpts {
    collapsed: wecco.ElementUpdate
    expanded: wecco.ElementUpdate
    isExpanded?: boolean
    position?: Array<number>
}

export const expandOverlay = wecco.define<ExpandOverlayOpts>("d20tools-exand_overlay", ({data, requestUpdate}) => {
    const toggleState = (e: MouseEvent) => {
        data.isExpanded = !data.isExpanded
        data.position = [e.clientX, e.clientY]
        requestUpdate()
    }

    if (!data.isExpanded) {
        return wecco.html`<a href="#" @click+preventDefault+stopPropagation=${toggleState}>${data.collapsed}</a>`
    }

    data.position = data.position ?? [100, 100]
    return wecco.html`${data.collapsed}<div class="expand-overlay shadow border z-3" style="left: ${data.position[0]}px; top: ${data.position[1]}px">${data.expanded}</div>`
})
