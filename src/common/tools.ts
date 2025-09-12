
export function* range(max: number): Generator<number, void, unknown> {
    for (let i = 0; i < max; i++) {
        yield i
    } 
}
