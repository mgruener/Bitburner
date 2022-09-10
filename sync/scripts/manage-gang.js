import {
    Gang
} from "lib/gangs.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var name = ns.args[0]
    var gang = new Gang(ns, name)
    await gang.manage()
}