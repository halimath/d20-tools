import {expect, describe, test} from "@jest/globals"

import { DieRoll, Roll } from "d20-tools/encounters/models/index"

describe("models", () => {
    describe("DieRoll", () => {
        describe("toString", () => {
            test("1d20", () => {
                expect(new DieRoll(20).toString()).toStrictEqual("1d20")
            })

            test("2d12", () => {
                expect(new DieRoll(12, 2).toString()).toStrictEqual("2d12")
            })
        })

        describe("roll", () => {
            test("1d20", () => {
                const r = new DieRoll(20)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll()
                    expect(result).toBeGreaterThanOrEqual(1)
                    expect(result).toBeLessThanOrEqual(20)
                }
            })

            test("2d12", () => {
                const r = new DieRoll(12, 2)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll()
                    expect(result).toBeGreaterThanOrEqual(2)
                    expect(result).toBeLessThanOrEqual(24)
                }
            })
        })
    })

    describe("Roll", () => {
        describe("parse", () => {
            test("1d20", () => {
                expect(Roll.parse("1d20")).toStrictEqual(Roll.create(1, 20))
            })

            test("1d20+4", () => {
                expect(Roll.parse("1d20+4")).toStrictEqual(Roll.create(1, 20, 4))
            })

            test("1 d 20 + 4   ", () => {
                expect(Roll.parse("1 d 20 + 4   ")).toStrictEqual(Roll.create(1, 20, 4))
            })

            test("2d12-8", () => {
                expect(Roll.parse("2d12-8")).toStrictEqual(Roll.create(2, 12, -8))
            })
        })

        describe("toString", () => {
            test("1d20+4", () => {
                expect(new Roll(new DieRoll(20), 4).toString()).toStrictEqual("1d20+4")
            })

            test("2d12-3", () => {
                expect(new Roll(new DieRoll(12, 2), -3).toString()).toStrictEqual("2d12-3")
            })
        })

        describe("roll", () => {
            test("1d20+4", () => {
                const r = new Roll(new DieRoll(20), 4)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll().value
                    expect(result).toBeGreaterThanOrEqual(5)
                    expect(result).toBeLessThanOrEqual(24)
                }
            })

            test("2d12-3", () => {
                const r = new Roll(new DieRoll(12, 2), -3)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll().value
                    expect(result).toBeGreaterThanOrEqual(-1)
                    expect(result).toBeLessThanOrEqual(21)
                }
            })
        })
    })
})
