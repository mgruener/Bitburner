import {
    HacknetServerManager
} from "lib/hacknet.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    ns.tail(ns.getScriptName())
    ns.disableLog("sleep")

    var manager = new HacknetServerManager(ns)
    while (!manager.allCompleted) {
        let nextUpgrade = manager.recommendUpgrade()
        while (manager.canAffordUpgrade(nextUpgrade["upgrade"], nextUpgrade["server"]) && !manager.allCompleted) {
            ns.printf("Buying '%s' upgrade for server '%s'", nextUpgrade["upgrade"], nextUpgrade["server"])
            await manager.buyUpgrade(nextUpgrade["upgrade"], nextUpgrade["server"])
            nextUpgrade = manager.recommendUpgrade()
            await ns.sleep(100)
        }
        await ns.sleep(1000)
    }
}