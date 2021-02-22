import { expect } from "chai"

import { Character, DieRoll, Kind, Model, Roll } from "../../../src/foes/models"

describe("models", () => {
    describe("DieRoll", () => {
        describe("toString", () => {
            it("1d20", () => {
                expect(new DieRoll(20).toString()).to.eq("1d20")
            })

            it("2d12", () => {
                expect(new DieRoll(12, 2).toString()).to.eq("2d12")
            })
        })

        describe("roll", () => {
            it("1d20", () => {
                const r = new DieRoll(20)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll()
                    expect(result).to.gte(1)
                    expect(result).to.lte(20)
                }
            })

            it("2d12", () => {
                const r = new DieRoll(12, 2)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll()
                    expect(result).to.gte(2)
                    expect(result).to.lte(24)
                }
            })
        })
    })

    describe("Roll", () => {
        describe("parse", () => {
            it("1d20", () => {
                expect(Roll.parse("1d20")).to.deep.eq(Roll.create(1, 20))
            })

            it("1d20+4", () => {
                expect(Roll.parse("1d20+4")).to.deep.eq(Roll.create(1, 20, 4))
            })

            it("1 d 20 + 4   ", () => {
                expect(Roll.parse("1 d 20 + 4   ")).to.deep.eq(Roll.create(1, 20, 4))
            })

            it("2d12-8", () => {
                expect(Roll.parse("2d12-8")).to.deep.eq(Roll.create(2, 12, -8))
            })
        })

        describe("toString", () => {
            it("1d20+4", () => {
                expect(new Roll(new DieRoll(20), 4).toString()).to.eq("1d20+4")
            })

            it("2d12-3", () => {
                expect(new Roll(new DieRoll(12, 2), -3).toString()).to.eq("2d12-3")
            })
        })

        describe("roll", () => {
            it("1d20+4", () => {
                const r = new Roll(new DieRoll(20), 4)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll().value
                    expect(result).to.gte(5)
                    expect(result).to.lte(24)
                }
            })

            it("2d12-3", () => {
                const r = new Roll(new DieRoll(12, 2), -3)
                for (let i = 0; i < 1000; i++) {
                    const result = r.roll().value
                    expect(result).to.gte(-1)
                    expect(result).to.lte(21)
                }
            })
        })
    })

    describe("Model", () => {
        const kind = new Kind("k1", {
            ac: 0,
            hitDie: Roll.parse("1d10"),
            savingThrows: {
                fortitude: 0,
                reflex: 0,
                will: 0,
            },
            speed: 0,
        })

        const model = new Model([kind], [
            new Character("c1", kind, 8, 7, []),
            new Character("c2", kind, 9, 1, []),
        ])


        describe("toUrlHash", () => {
            it("should generate url hash", () => {
                expect(model.toUrlHash()).to.eq(encodeURIComponent("c1;k1;8;7&c2;k1;9;1"))
            })
        })

        describe("fromUrlString", () => {
            it("should reconstruct model", () => {
                expect(Model.fromUrlHash(encodeURIComponent("c1;k1;8;7&c2;k1;9;1"), [ kind ])).to.deep.eq(model)
            })
        })
    })
})
