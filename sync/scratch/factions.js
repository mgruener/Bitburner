import { TheBlackHand } from "lib/factions.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const blackhand = new TheBlackHand(ns)
    //csec.increaseReputation()
    await blackhand.fullfillRequirements()
    blackhand.connect()
}