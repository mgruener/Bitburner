import { isRunning } from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const script = "/scripts/single-target-scheduler.js"
    for (const target of ns.args) {
        if (isRunning(ns, script, [target])) {
            continue
        }
        let pid = ns.exec(script, "home", 1, target)
        if (pid == 0) {
            ns.tprintf("Failed to launch for target %s", target)
        }
    }
}