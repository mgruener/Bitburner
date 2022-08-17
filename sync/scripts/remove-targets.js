import {
    getTargetRemovePort,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var targets = ns.args
    var removePort = getTargetRemovePort(ns)
    for (const t of targets) {
        while (!removePort.tryWrite(t)) {
            await ns.sleep(1000)
        }
    }
}