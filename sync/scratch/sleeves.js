import {
    SleeveArmy,
} from "lib/sleeves.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var max = 0
    if (ns.args.length > 0) {
        max = ns.args[0]
    }
    const army = new SleeveArmy(ns)
    army.augmentAll()
}