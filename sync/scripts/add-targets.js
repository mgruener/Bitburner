import {
    getTargetAddPort,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var targets = ns.args
    var addPort = getTargetAddPort(ns)
    for (const t of targets) {
        while (!addPort.tryWrite(t)) {
            await ns.sleep(1000)
        }
    }
}