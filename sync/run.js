import { schedule } from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    if (!await schedule(ns, ...ns.args)) {
        ns.print("Failed to execute '%s'", ns.args[0])
    }
}