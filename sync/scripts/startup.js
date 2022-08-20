import {
    portOpener,
    threadsAvailable,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    ns.exec("/scripts/backdoor-worm.js", "home")
    var schedulerPid = ns.exec("/scripts/multi-target-scheduler.js", "home")
    ns.tail(schedulerPid)

    var portOpenerSeen = portOpener(ns).length
    while (true) {
        var currentPortOpener = portOpener(ns).length
        if (currentPortOpener > portOpenerSeen) {
            ns.exec("/scripts/backdoor-worm.js", "home")
            portOpenerSeen = currentPortOpener
        }
        var player = ns.getPlayer()
        if (player.skills.hacking >= 10) {
            addTarget(ns, "joesguns")
        }
        var threadsAvail = threadsAvailable(ns, 1.75, false)
        if (threadsAvail >= 1500) {
            addTarget(ns, "sigma-cosmetics")
        }
        if (threadsAvail >= 3000) {
            addTarget(ns, "harakiri-sushi", "max-hardware", "zer0")

        }
        if (threadsAvail >= 6000) {
            addTarget(ns, "phantasy", "iron-gym")

        }
        if (threadsAvail >= 10000) {
            addTarget(ns, "omega-net", "silver-helix", "crush-fitness")

        }
        if (threadsAvail >= 15000) {
            addTarget(ns, "foodnstuff", "nectar-net", "hong-fang-tea", "neo-net")

        }
        if (threadsAvail >= 1000000) {
            ns.exec("/scripts/add-all-targets.js", "home")
        }
        await ns.sleep(2000)
    }
}

function addTarget(ns, ...names) {
    ns.exec("/scripts/add-targets.js", "home", 1, ...names)
}