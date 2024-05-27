globalThis.gameVer = null;
const ns = require('./libRyujinx.js');

const scripts = Agent.getScripts();

ns.onBoot((info) => {
    console.log("\r\n\x1b[1;32m---Nintendo Switch Text Hooker---\x1B[0m\r\n");
    console.log('Target: ' + info.titleId);

    globalThis.gameVer = null; // reset
    const script = findScriptByTitleId(info.titleId);
    if (script) {
        console.log("\x1B[32mFound script: " + script.name + '\x1b[0m');
        Agent.setTargetID(script.fullPath); // WS exSTATic, sessionStorage
        require(script.fullPath);
        return;
    }

    console.warn("Script not found, perform pattern scan...");
    const nss = getPatternScripts();
    for (let i = 0; i < nss.length; i++) {
        const script = nss[i];
        console.log('- ' + script.name);
        const hook = require(script.fullPath)(info.modules);
        if (hook) {
            ns.setHook(hook, null);
        }
    }

    if (ns.count() === 0) {
        console.error("Error: No hook found!");
    }
});

function findScriptByTitleId(titleId) { return scripts.find(v => v.name.includes(titleId)); }
function getPatternScripts() { return scripts.filter(v => v.name.startsWith('libNS') === true); }