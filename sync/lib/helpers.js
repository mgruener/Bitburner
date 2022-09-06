/** @param {import("../..").NS } ns */
export function hasFormulas(ns) {
    return ns.fileExists("Formulas.exe", "home")
}

export function portOpener(ns) {
    var portOpener = []
    if (ns.fileExists("BruteSSH.exe", "home")) {
        portOpener.push({ "func": ns.brutessh, "check": (s) => !s.sshPortOpen })
    }

    if (ns.fileExists("FTPCrack.exe", "home")) {
        portOpener.push({ "func": ns.ftpcrack, "check": (s) => !s.ftpPortOpen })
    }

    if (ns.fileExists("relaySMTP.exe", "home")) {
        portOpener.push({ "func": ns.relaysmtp, "check": (s) => !s.smtpPortOpen })
    }

    if (ns.fileExists("HTTPWorm.exe", "home")) {
        portOpener.push({ "func": ns.httpworm, "check": (s) => !s.httpPortOpen })
    }

    if (ns.fileExists("SQLInject.exe", "home")) {
        portOpener.push({ "func": ns.sqlinject, "check": (s) => !s.sqlPortOpen })
    }
    return portOpener
}

export function union(...lists) {
    return [...(new Set(lists.flat()))]
}

export function unique(...lists) {
    return lists.flat().filter((v, i, a) => a.indexOf(v) === a.lastIndexOf(v))
}

export function intersection(...lists) {
    var input = [...lists]
    var result = input.shift()
    for (const l of input) {
        result = result.filter(x => l.includes(x))

    }
    return [...(new Set(result))]
}

export function difference(...lists) {
    var input = [...lists]
    var result = input.shift()
    for (const l of input) {
        result = result.filter(x => !l.includes(x))
    }
    return [...(new Set(result))]
}