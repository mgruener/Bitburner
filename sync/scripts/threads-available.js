import { threadsAvailable } from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var threadSize = 0.15 + 1.6
    let systemThreads = threadsAvailable(ns, threadSize, false)
    let idleThreads = threadsAvailable(ns, threadSize, true)
    ns.tprintf("==> Attack threads: %d (idle); %d (available)", idleThreads, systemThreads)
}