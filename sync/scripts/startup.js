import {
    portOpener,
    threadsAvailable,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const hackScheduler = "/scripts/multi-target-scheduler.js"
    ns.exec("/scripts/backdoor-worm.js", "home")
    if (!ns.scriptRunning(hackScheduler, "home")) {
        ns.tail(ns.exec(hackScheduler, "home"))
    }

    var portOpenerSeen = portOpener(ns).length
    while (true) {
        var currentPortOpener = portOpener(ns).length
        if (currentPortOpener > portOpenerSeen) {
            ns.exec("/scripts/backdoor-worm.js", "home")
            portOpenerSeen = currentPortOpener
        }

        var player = ns.getPlayer()
        var sleeveCount = ns.sleeve.getNumSleeves()
        var threadsAvail = threadsAvailable(ns, 1.75, false)
        if (sleeveCount >= 1) {
            for (var id = 0; id < sleeveCount; id++) {
                var sleeve = ns.sleeve.getSleeveStats(id)
                var task = ns.sleeve.getTask(id)
                if ((sleeve.shock > 0) && (task.type != "RECOVERY")) {
                    ns.sleeve.setToShockRecovery(id)
                    continue
                }
                if ((sleeve.sync < 100) && (task.type != "SYNCHRO")) {
                    ns.sleeve.setToSynchronize(id)
                }
            }
            if ((player.skills.hacking < 10) && (ns.sleeve.getSleeveStats(0).sync >= 100)) {
                if (!ns.sleeve.setToUniversityCourse(0, "Rothman University", "Study Computer Science")) {
                    ns.print("Failed to send sleeve 0 to study computer science at Rothman University")
                }
            }
            if ((player.skills.hacking >= 10) && (player.factions.includes("Tian Di Hui")) && (ns.sleeve.getSleeveStats(0).sync >= 100)) {
                if (!ns.sleeve.setToFactionWork(0, "Tian Di Hui", "Hacking Contracts")) {
                    ns.print("Failed to send sleeve 0 to do hacking contracts for Tian Di Hui")
                }
            }
        }

        var stages = {
            0: ["joesguns"],
            1500: ["sigma-cosmetics"],
            3000: ["harakiri-sushi", "max-hardware", "zer0"],
            6000: ["phantasy", "iron-gym"],
            15000: ["omega-net", "silver-helix"],
            25000: ["nectar-net", "hong-fang-tea", "neo-net"],
            40000: ["computek", "netlink", "catalyst", "summit-uni"],
            70000: ["rho-construction", "the-hub", "alpha-ent", "snap-fitness", "lexo-corp"]
        }
        for (const stage of Object.keys(stages)) {
            if (threadsAvail >= stage) {
                for (const name of stages[stage]) {
                    var server = ns.getServer(name)
                    if (server.hasAdminRights && (server.hackDifficulty <= player.skills.hacking)) {
                        addTarget(ns, name)
                        await ns.sleep(100)
                    }
                }
            }
        }

        if (threadsAvail >= 100000 && (player.skills.hacking > 2200)) {
            ns.exec("/scripts/add-all-targets.js", "home")
            return
        }
        await ns.sleep(2000)
    }
}

function addTarget(ns, ...names) {
    ns.exec("/scripts/add-targets.js", "home", 1, ...names)
}