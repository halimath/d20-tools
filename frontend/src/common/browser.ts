
/**
 * @deprecated
 */
export function urlHash(): string {
    if (!document.location.hash) {
        return ""
    }

    return document.location.hash.substr(1)
}

/**
 * @deprecated
 */
export function setUrlHash(hash: string) {
    let url = document.location.pathname
    if (hash) {
        url += "#" + hash
    }
    window.history.replaceState(null, "", url)
}

export function lastPathElement(): string {
    const elements = document.location.pathname.split("/")
    if (elements.length === 0) {
        return document.location.pathname
    }
    return elements[elements.length - 1]
}

export function setLastPathElement(pathElement: string) {
    const elements = document.location.pathname.split("/")
    if (elements.length === 0) {
        history.replaceState(null, "", pathElement)
        return
    }

    elements[elements.length - 1] = pathElement
    history.replaceState(null, "", elements.join("/"))
}