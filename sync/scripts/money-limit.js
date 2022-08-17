import {
    setMoneyLimit,
    getMoneyLimit,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    if (ns.args.length < 1) {
        ns.tprintf("Current money limit: %d", getMoneyLimit(ns))
        return
    }
    setMoneyLimit(ns, ns.args[0])
    ns.tprintf("New money limit: %d", getMoneyLimit(ns))
}
