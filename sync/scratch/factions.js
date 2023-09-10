import { NWO } from "lib/factions.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const nwo = new NWO(ns)
    //csec.increaseReputation()
    await nwo.fullfillRequirements()
}