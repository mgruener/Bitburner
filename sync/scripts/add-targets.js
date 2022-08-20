import {
    getTargetAddPort,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var targets = ns.args
    var addPort = getTargetAddPort(ns)
    for (const t of targets) {
        if (!ns.serverExists(t)) {
            ns.tprintf("Server does not exist: %s", t)
        }
        while (!addPort.tryWrite(t)) {
            await ns.sleep(1000)
        }
    }
}