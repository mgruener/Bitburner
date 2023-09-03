import {
    Gang
} from "lib/gangs.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    ns.disableLog("disableLog")
    var gang = new Gang(ns)

    while (true) {
        await gang.manage()
    }
}