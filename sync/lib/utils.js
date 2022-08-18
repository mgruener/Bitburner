/** @param {import("../..").NS } ns */
export function getAllServers(ns) {
	// result is a dict of str => Server
	var knownHosts = {}

	// always start scanning at our "home" server
	var entryPoint = "home"
	var hostsToScan = [entryPoint]

	// While we still have hosts eligible to be scanned
	// iterate over all of them, scan them to get the list
	// of other hosts they "see", then remove already known
	// and duplicate hosts. Make the resulting list the new list
	// of hosts eligible to scan
	ns.disableLog("scan")
	while (hostsToScan.length > 0) {
		var scanCandidates = []
		for (const host of hostsToScan) {
			let server = ns.getServer(host)
			let scanResult = ns.scan(host)
			knownHosts[host] = server
			scanCandidates = scanCandidates.concat(scanResult)
		}

		// create a new list of scan eligible hosts
		// by filtering out all already known and duplicate
		// hosts from the scan candidates
		hostsToScan = []
		for (const candidate of scanCandidates) {
			if (hostsToScan.includes(candidate) || (candidate in knownHosts)) {
				continue
			}
			hostsToScan.push(candidate)
		}
	}
	return knownHosts
}

export function applyFilter(hosts, filter = [], exclude = true, matchAny = true) {
	var results = []
	var hostnames = Object.keys(hosts)
	for (const f of filter) {
		let filterResults = hostnames.filter(name => f(hosts[name]))
		results.push(filterResults)
	}
	var matcher = intersection
	if (matchAny) {
		matcher = union
	}
	var result = {}
	var filtered = matcher(...results)
	if (exclude) {
		filtered = difference(hostnames, filtered)
	}

	for (const name of filtered) {
		result[name] = hosts[name]
	}
	return result
}

export function filter_hostname(regex) {
	var re = new RegExp(sprintf("^%s$", regex))
	return (function (host) {
		return re.test(host.hostname)
	})
}

export function filter_hackingSkill(level) {
	return (function (host) {
		return (level < host.requiredHackingSkill)
	})
}

export function filter_adminRights(adminRightsPresent = true) {
	return (function (host) {
		return (host.hasAdminRights == adminRightsPresent)
	})
}

export function filter_minRam(size) {
	return (function (host) {
		return (host.maxRam >= size)
	})
}

export function ramAvail(host) {
	let reserved = 0
	if (host.hostname == "home") {
		reserved = 32
	}
	return Math.max(host.maxRam - (host.ramUsed + reserved), 0)
}

export function filter_minRamAvailable(size) {
	return (function (host) {
		return (ramAvail(host) >= size)
	})
}

export function filter_canNuke(ns = true) {
	var po = portOpener(ns)
	var maxOpenPortsRequired = po.length
	return (function (host) {
		return (host.numOpenPortsRequired <= maxOpenPortsRequired)
	})
}

export function filter_playerServer(state = true) {
	return (function (host) {
		return (host.purchasedByPlayer == state)
	})
}

export function filter_minMaxMoney(amount = 1) {
	return (function (host) {
		return (host.moneyMax >= amount)
	})
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

export function threadsAvailable(ns, threadSize, onlyFree = true) {
	var adminFilter = filter_adminRights(true)
	var targets = getAllServers(ns)
	var ramFilter = filter_minRamAvailable(threadSize)
	if (!onlyFree) {
		ramFilter = filter_minRam(threadSize)
	}
	targets = applyFilter(targets, [adminFilter, ramFilter], false, false)

	var threads = 0
	for (const name in targets) {
		let target = targets[name]
		let ram = ramAvail(target)
		if (!onlyFree) {
			ram = target.maxRam
		}
		let serverThreads = Math.floor(ram / threadSize)
		threads = threads + serverThreads
	}
	return threads
}

export function getWeakenThreads(ns, server, attacker = server) {
	var threadsAvail = ramAvail(attacker) / 1.75
	var targetAmount = Math.max(server.hackDifficulty - server.minDifficulty, 0)
	var threadsRequired = Math.ceil(targetAmount / ns.weakenAnalyze(1))
	// if the provided attacker has enough compute power to perform the full weaken
	// with one core in one go although it has more than one core, re-calculate the
	// required amount of threads with the proper amount of cpu cores to optimize
	// the resource usage
	if ((threadsAvail >= threadsRequired) && (attacker.cpuCores > 1)) {
		return Math.ceil(targetAmount / ns.weakenAnalyze(attacker.cpuCores))
	}
	return threadsRequired
}

export function getGrowThreads(ns, server, attacker = server) {
	// 1.75GB is the size of the simplest grow script
	var threadsAvail = ramAvail(attacker) / 1.75
	var money = server.moneyAvailable
	// The server is "empty", which means the Bitburner code assumes $1 per thread as basis.
	// See https://steamcommunity.com/app/1812820/discussions/0/5545618081297574632/#c3200369112086161192.
	// Nevertheless, this is only true for the first attacker in a distributed attack,
	// as the game does all its calculations for grow(), weaken() and hack() AFTER the wait time
	// for the call which means in a distributed attack, each attack ending influences the attacks
	// ending after that one even if they were all started under the same conditions
	if (money <= 0) {
		money = threadsAvailable
		// Edge case, if there are more attack threads available than the maximum
		// amount of money on the server. No idea how the game handles that, but lets
		// just assume $1 per thread holds true and return one thread for each dollar
		// we want
		if (threadsAvailable > server.moneyMax) {
			return server.moneyMax
		}
	}
	var growFactor = server.moneyMax / money
	var threadsRequired = Math.ceil(ns.growthAnalyze(server.hostname, growFactor))
	// if the provided attacker has enough compute power to perform the full grow
	// with one core in one go although it has more than one core, re-calculate the
	// required amount of threads with the proper amount of cpu cores to optimize
	// the resource usage
	if ((threadsAvail >= threadsRequired) && (attacker.cpuCores > 1)) {
		return Math.ceil(ns.growthAnalyze(server.hostname, growFactor, attacker.cpuCores))
	}
	return threadsRequired
}

export function getHackThreads(ns, server) {
	var money = server.moneyAvailable
	var hackThreads = Math.ceil(ns.hackAnalyzeThreads(server.hostname, money))
	if (isFinite(hackThreads)) {
		return hackThreads
	}
	return 1
}

export async function deployPayload(ns, name) {
	if (name == "home") {
		return
	}
	const files = [
		"/lib/utils.js",
		"/payload/hack-only.js",
		"/payload/grow-only.js",
		"/payload/weaken-only.js",
		"/payload/share.js",
	]
	await ns.scp(files, name, "home")
}

export function getAdditionalServerInfo(ns, server, attacker = server) {
	var moneyThreshold = server.moneyMax * 0.75
	var securityThreshold = server.minDifficulty + 5
	var result = {
		moneyThreshold: moneyThreshold,
		securityThreshold: securityThreshold,
		weakenThreads: getWeakenThreads(ns, server, attacker),
		growThreads: getGrowThreads(ns, server, attacker),
		hackThreads: getHackThreads(ns, server)
	}
	return result
}

export async function buyServers(ns) {
	const minRam = 8
	let prefix = ns.sprintf("pserv-%d", minRam)
	if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
		return true
	}
	let serverCost = ns.getPurchasedServerCost(minRam)
	while (canAfford(ns, serverCost)) {
		let name = ns.purchaseServer(prefix, minRam);
		await deployPayload(ns, name)
		if (ns.getPurchasedServers().length >= ns.getPurchasedServerLimit()) {
			return true
		}
	}
	return false
}

export async function upgradeServers(ns, ramLimit = 256) {
	var maxServers = ns.getPurchasedServerLimit()
	// someday
	// var ramLimit = ns.getPurchasedServerMaxRam()
	// only start upgrading if we are already at our maximum server count
	if (ns.getPurchasedServers().length < maxServers) {
		return false
	}
	ns.disableLog("getServerMaxRam")

	var servers = {}
	while (!(ramLimit in servers) || (servers[ramLimit].length < maxServers)) {
		servers = {}
		for (const name of ns.getPurchasedServers()) {
			let ram = ns.getServerMaxRam(name)
			if (ram in servers) {
				servers[ram].push(name)
				continue
			}
			servers[ram] = [name]
		}
		let ramSizes = [...Object.keys(servers)].sort((a, b) => a - b)
		let maxRamSize = ramSizes[ramSizes.length - 1]
		let targetRamSize = Math.min(maxRamSize * 2, ramLimit)
		if (servers[maxRamSize].length < maxServers) {
			targetRamSize = maxRamSize
			ramSizes.pop()
		} else if (maxRamSize == ramLimit) {
			return true
		}
		let prefix = ns.sprintf("pserv-%d", targetRamSize)
		for (const size of ramSizes) {
			for (const name of servers[size]) {
				let upgradeCost = ns.getPurchasedServerCost(targetRamSize)
				if (!canAfford(ns, upgradeCost)) {
					// not enough money to further upgrade, stop here
					return false
				}
				ns.killall(name, false)
				ns.deleteServer(name)
				let newName = ns.purchaseServer(prefix, targetRamSize);
				await deployPayload(ns, newName)
			}
		}
	}
	return true
}

export function isRunning(ns, script, args) {
	var procs = ns.ps("home")
	for (const proc of procs) {
		let scriptMatch = false
		let argsMatch = false
		if (proc.filename == script) {
			scriptMatch = true
		}
		argsMatch = arrayEqual(args, proc.args)
	}
}

export function arrayEqual(a, b) {
	if (a.length != b.length) {
		return false
	}
	var _a = [...a].sort()
	var _b = [...b].sort()
	for (var index = 0; index < _a.length; index++) {
		if (_a[index] != _b[index]) {
			return false
		}
	}
	return true
}

export function setMoneyLimit(ns, val) {
	var port = getMoneyLimitPort(ns)
	if (port.empty()) {
		port.write(val)
		return
	}
	port.write(val)
	port.read()
	return
}

export function getMoneyLimit(ns) {
	var port = getMoneyLimitPort(ns)
	if (port.empty()) {
		return 0
	}
	return port.peek()
}

export function myMoney(ns) {
	ns.disableLog("getServerMoneyAvailable")
	return ns.getServerMoneyAvailable("home")
}

export function canAfford(ns, cost) {
	return ((myMoney(ns) - cost) >= getMoneyLimit(ns))
}

export function buyHacknetNodes(ns, nodeLimit) {
	if (ns.hacknet.numNodes() >= nodeLimit) {
		return true
	}
	while (canAfford(ns, ns.hacknet.getPurchaseNodeCost())) {
		ns.hacknet.purchaseNode()
		if (ns.hacknet.numNodes() >= nodeLimit) {
			return true
		}
	}
	return false
}

export function upgradeHacknetNodes(ns, upgrade) {
	var nodeLimit = upgrade["nodeLimit"]
	var resType = upgrade["type"]
	var resLimit = upgrade["limit"]
	var doUpgrade = upgrade["upgradeFunc"]
	var getCosts = upgrade["costFunc"]
	var curNodes = ns.hacknet.numNodes()
	if (curNodes < nodeLimit) {
		return false
	}

	var nodes = {}
	while (!(resLimit in nodes) || (nodes[resLimit].length < nodeLimit)) {
		nodes = {}
		for (var i = 0; i < curNodes; i++) {
			let res = ns.hacknet.getNodeStats(i)[resType]
			if (res in nodes) {
				nodes[res].push(i)
				continue
			}
			nodes[res] = [i]
		}

		let resValues = [...Object.keys(nodes)].sort((a, b) => a - b)
		let maxResValue = resValues[resValues.length - 1]
		let targetResValue = Math.min(maxResValue + 1, resLimit)
		if (nodes[maxResValue].length < nodeLimit) {
			targetResValue = maxResValue
			resValues.pop()
		} else if (maxResValue == resLimit) {
			return true
		}
		for (const val of resValues) {
			for (const i of nodes[val]) {
				while (ns.hacknet.getNodeStats(i)[resType] != targetResValue) {
					var upgradeCost = getCosts(i, 1);
					if (!canAfford(ns, upgradeCost)) {
						// not enough money to further upgrade, stop here
						return false
					}
					doUpgrade(i, 1);
				}
			}
		}
	}
	return true
}

export function getHacknetRamUpgrade(ns, nodeLimit = 8) {
	return {
		"nodeLimit": nodeLimit,
		"limit": 64,
		"type": "ram",
		"costFunc": ns.hacknet.getRamUpgradeCost,
		"upgradeFunc": ns.hacknet.upgradeRam,
	}
}

export function getHacknetLevelUpgrade(ns, nodeLimit = 8) {
	return {
		"nodeLimit": nodeLimit,
		"limit": 200,
		"type": "level",
		"costFunc": ns.hacknet.getLevelUpgradeCost,
		"upgradeFunc": ns.hacknet.upgradeLevel,
	}
}

export function getHacknetCoreUpgrade(ns, nodeLimit = 8) {
	return {
		"nodeLimit": nodeLimit,
		"limit": 16,
		"type": "cores",
		"costFunc": ns.hacknet.getCoreUpgradeCost,
		"upgradeFunc": ns.hacknet.upgradeCore,
	}
}

// set shouldThreads to -1 to automatically determine the number of threads
export async function schedule(ns, script, shouldThreads = 1, args = []) {
	var threads = parseInt(shouldThreads)
	if (threads == 0) {
		ns.tprintf("Failed to schedule '%s': threads must be > 0 or -1, is %d", script, threads)
		return false
	}
	var threadFactor = threads < 0 ? 1 : threads
	var size = ns.getScriptRam(script, "home") * threadFactor
	var hasAdminFilter = filter_adminRights(true)
	var ramFilter = filter_minRamAvailable(size)
	var candidates = applyFilter(getAllServers(ns), [hasAdminFilter, ramFilter], false, false)
	var target = ""
	var targetRamAvail = -1
	for (const name in candidates) {
		let candidateRamAvail = ramAvail(candidates[name])
		if (candidateRamAvail > targetRamAvail) {
			target = name
			targetRamAvail = candidateRamAvail
		}
	}
	if (target == "") {
		return false
	}
	if (target != "home") {
		await ns.scp("/lib/utils.js", target, "home")
		await ns.scp(script, target, "home")
	}
	var maxThreads = Math.floor(targetRamAvail / size)
	var execThreads = threads < 0 ? maxThreads : threads
	return ns.exec(script, target, execThreads, ...args) != 0
}

export function performAttack(ns, attack, target, attackers) {
	var addonInfo = getAdditionalServerInfo(ns, target)
	var requiredThreads = addonInfo[attack["threads"]]
	var waitTime = attack["wait"](target.hostname) + 25
	var attackThreads = 0
	var serverCount = 0
	var scriptRam = ns.getScriptRam(attack["script"])

	ns.disableLog("exec")
	var pids = []
	// this sorts the servers according to the amount of threads required by
	// a single core system (assuming that all attackable systems are single core)...
	var servers = sortObjectBy(attackers, sortByComputePower(requiredThreads))
	// ...lets see if we can reduce the amount of threads required by re-calculating
	// this with the most suitable attacker
	addonInfo = getAdditionalServerInfo(ns, target, servers[0])
	requiredThreads = addonInfo[attack["threads"]]
	for (const server of servers) {
		let serverThreads = Math.floor((ramAvail(server) / scriptRam))
		if (serverThreads > requiredThreads) {
			serverThreads = requiredThreads
		}
		let pid = ns.exec(attack["script"], server.hostname, serverThreads, target.hostname, serverThreads)
		if (pid == 0) {
			ns.tprintf("Error while performing '%s' on %s from %s", attack["type"], target.hostname, server.hostname)
			continue
		}
		pids.push(pid)
		requiredThreads = requiredThreads - serverThreads
		attackThreads = attackThreads + serverThreads
		serverCount++
		if (requiredThreads <= 0) {
			break
		}
	}
	return {
		"waitTime": waitTime,
		"requiredThreads": addonInfo[attack["threads"]],
		"attackThreads": attackThreads,
		"operation": attack["type"],
		"serverCount": serverCount,
		"pids": pids,
	}
}

export function getGrowAttack(ns) {
	return {
		"type": "grow",
		"wait": ns.getGrowTime,
		"threads": "growThreads",
		"script": "/payload/grow-only.js",
	}
}

export function getWeakenAttack(ns) {
	return {
		"type": "weaken",
		"wait": ns.getWeakenTime,
		"threads": "weakenThreads",
		"script": "/payload/weaken-only.js",
	}
}

export function getHackAttack(ns) {
	return {
		"type": "hack",
		"wait": ns.getHackTime,
		"threads": "hackThreads",
		"script": "/payload/hack-only.js",
	}
}

export function getTargetAddPort(ns) {
	return ns.getPortHandle(1)
}

export function getTargetRemovePort(ns) {
	return ns.getPortHandle(2)
}

export function getMoneyLimitPort(ns) {
	return ns.getPortHandle(3)
}

export function sortArrayBy(list, sortFunc) {
	return [...list].sort(sortFunc)
}

export function sortObjectBy(object, sortFunc) {
	return [...Object.values(object)].sort(sortFunc)
}


// the function is called with func(elem[key])
export function sortByFunctionValue(func, key) {
	return (function (x, y) {
		if (func(x[key]) < func(y[key])) {
			return -1
		}
		if (func(x[key]) > func(y[key])) {
			return 1
		}
		return 0
	})
}

export function sortByKey(key) {
	return (function (x, y) {
		if (x[key] < y[key]) {
			return -1
		}
		if (x[key] > y[key]) {
			return 1
		}
		return 0
	})
}

export function sortByComputePower(fullSize) {
	return (function (x, y) {
		let xAvail = ramAvail(x)
		let yAvail = ramAvail(y)
		let xDiff = Math.max(fullSize - xAvail, 0)
		let yDiff = Math.max(fullSize - yAvail, 0)
		if ((xDiff <= 0) && !(yDiff <= 0)) {
			return -1
		}
		if (!(xDiff <= 0) && (yDiff <= 0)) {
			return 1
		}
		if ((xDiff == 0) && (yDiff == 0)) {
			if (x.cpuCores > y.cpuCores) {
				return -1
			}
			if (x.cpuCores < y.cpuCores) {
				return 1
			}
			if (xAvail < yAvail) {
				return -1
			}
			if (xAvail > yAvail) {
				return 1
			}
		}
		if (xAvail > yAvail) {
			return -1
		}
		if (xAvail < yAvail) {
			return 1
		}
		return 0
	})
}