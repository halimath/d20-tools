import * as wecco from "@weccoframework/core"

export interface Tab {
    label: wecco.ElementUpdate
    content: wecco.ElementUpdate
}

export interface Options {
    kind: "nav" | "tabs" | "pills" | "pills-fill"
    onTabSelected: (tab: Tab, index: number) => void
}

export function tabs (opts: Partial<Options>, ...tabs: Array<Tab>): wecco.ElementUpdate
export function tabs (...tabs: Array<Tab>): wecco.ElementUpdate

export function tabs (optsOrTab: Partial<Options> | Tab, ...remainingTabs: Array<Tab>): wecco.ElementUpdate {
    let opts: Options
    let tabs: Array<Tab> = []

    if (isOptions(optsOrTab)) {
        opts = {
            kind: optsOrTab.kind ?? "nav",
            onTabSelected: optsOrTab.onTabSelected ?? (() => void null),
        }
    } else {
        opts = {
            kind: "nav",
            onTabSelected: (() => void null),
        }
        tabs.push(optsOrTab as Tab)
    }

    tabs = tabs.concat(remainingTabs)

    let styleClasses: string
    switch (opts.kind) {
        case "tabs":
            styleClasses = "nav-tabs"
            break
        case "pills":
            styleClasses = "nav-pills"
            break
        case "pills-fill":
            styleClasses = "nav-pills nav-fill"
            break
        default:
            styleClasses = ""
            break
    }

    const tabLinks: Array<HTMLAnchorElement> = []
    const contentWrappers: Array<HTMLElement> = []

    const selectIndex = (idx: number) => {
        for (let i = 0; i < tabLinks.length; i++) {
            if (i === idx) {
                tabLinks[i].classList.add("active")
                contentWrappers[i].classList.remove("d-none")
            } else {
                tabLinks[i].classList.remove("active")
                contentWrappers[i].classList.add("d-none")
            }
        }
        opts.onTabSelected(tabs[idx], idx)
    } 

    return wecco.html`
        <ul class="nav ${styleClasses}">
            ${tabs.map((t, idx) => wecco.html`<li class="nav-item"><a href="#" class="nav-link ${idx === 0 ? "active" : ""}" @click=${selectIndex.bind(null, idx)} @update=${(e: Event) => tabLinks[idx] = e.target as HTMLAnchorElement}>${t.label}</a></li>`)}
        </ul>
        ${tabs.map((t, idx) => wecco.html`<div class="${idx === 0 ? "" : "d-none"}" @update=${(e: Event) => contentWrappers[idx] = e.target as HTMLElement}>${t.content}</div>`)}
    `
}

function isOptions (optsOrTab: Partial<Options> | Tab): optsOrTab is Partial<Options> {
    return (!("label" in optsOrTab))
}

