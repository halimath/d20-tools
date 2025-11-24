import { GameGrid } from "../models/models";

interface DTO {
    label: string
    descriptor: string
    id: string
    lastModified: string
}

export async function createGrid(g: GameGrid): Promise<string> {
    const dto = {
        label: g.label,
        descriptor: g.descriptor,
    }

    const response = await fetch("/api/grid/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Failed to create grid: ${response.statusText}`);
    }

    const id = await response.text();
    return id;
}

export async function updateGrid(g: GameGrid): Promise<void> {
    if (!g.id) {
        throw new Error("GameGrid does not have an id; refusing to update")
    }

    const dto = {
        label: g.label,
        descriptor: g.descriptor,
    }

    const response = await fetch(`/api/grid/${g.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
    });

    if (!response.ok) {
        throw new Error(`Failed to update grid ${g.id}: ${response.statusText}`);
    }
}

export async function loadGrid (id: string): Promise<GameGrid> {
    const res = await fetch(`/api/grid/${id}`)
    if (!res.ok) {
        throw new Error(`failed to load grid with id ${id}: ${res.statusText}`)
    }
    const dto = await res.json()
    return GameGrid.fromDescriptor(dto.label, dto.descriptor, id, new Date(dto.lastModified))
}

export type GridUpdateCallback = (grid: GameGrid) => void

export class Subsciption {
    constructor(private readonly eventSource: EventSource) {}

    cancel() {
        this.eventSource.close()
    }
}

export function subscribeForGrid(id: string, callback: GridUpdateCallback): Subsciption {
    console.log("Subscribing for grid", id)
    const subEventSrc = new EventSource(`/api/grid/${id}/subscribe`)

    subEventSrc.onerror = (err) => {
        console.error("EventSource failed:", err)
    }

    subEventSrc.onmessage = (event) => {
        try {
            console.log("Got gridupdate event", event)
            const dto = JSON.parse(event.data)
            callback(GameGrid.fromDescriptor(dto.label, dto.descriptor, dto.id))
        } catch (e) {
            console.error("error handling gridupdate event", e)
        }    
    }

    return new Subsciption(subEventSrc)
}

export async function loadGridIndex(): Promise<Array<GameGrid>> {
    console.log("Loading grid index")
    const res = await fetch("/api/grid/")
    if (!res.ok) {
        throw new Error(`failed to load grid index: ${res.statusText}`)
    }
    return(await res.json() as Array<DTO>).map(dto => GameGrid.fromDescriptor(dto.label, dto.descriptor, dto.id, new Date(dto.lastModified)))

}