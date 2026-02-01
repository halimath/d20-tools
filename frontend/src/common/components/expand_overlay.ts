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

    const onUpdateEnd = (evt: CustomEvent) => {
        const elm = evt.target as HTMLElement
        elm.style.left = data.position![0] + "px" 
        elm.style.top = data.position![1] + "px"
    }

    return wecco.html`${data.collapsed}<div class="expand-overlay shadow border z-3" @updateEnd=${onUpdateEnd}>${data.expanded}</div>`
})
