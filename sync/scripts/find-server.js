import {
    findServer
} from "lib/utils.js";

export async function main(ns) {
    var names = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets", "w0r1d_d43m0n"]
    if (ns.args.length > 0) {
        names = ns.args
    }
    for (const name of names) {
        ns.tprintf("%s", findServer(ns, name))
    }
}

