// ==UserScript==
// @name         AIO
// @version      
// @author       
// @description  Run or Attach (anywhere)
// ==/UserScript==
(function() {
    // signature: Should only be valid for target
    const VNs = [
        {
            title: 'Chaos;Child',
            script: './PC_Steam_MAGES_Chaos;Child.js',
            signature: '0000 6300 6800 6100 6F00 7300 6300 6800 6900 6C00 6400 0000' // L"chaoschild\0"
        },
        {
            title: 'YU-NO: A girl who chants love at the bound of this world',
            script: './PC_Steam_MAGES_YUNO.js',
            signature: '0000 7900 7500 6E00 6F00 0000' // L"yuno\0"
        },
        {
            title: 'ROBOTICS;NOTES ELITE',
            script: './PC_Steam_MAGES_Robotics;Notes-ELITE.js',
            signature: '0000 7200 6F00 6200 6F00 7400 6900 6300 7300 6E00 6F00 7400 6500 7300 6500 0000' // L"roboticsnotese\0"
        },
        {
            title: 'ROBOTICS;NOTES DaSH',
            script: './PC_Steam_MAGES_Robotics;Notes-DaSH.js',
            signature: '0000 7200 6F00 6200 6F00 7400 6900 6300 7300 6E00 6F00 7400 6500 7300 6400 0000' // L"roboticsnotesd\0"
        },
        {
            title: 'STEINS;GATE',
            script: './PC_Steam_MAGES_Steins;Gate.js',
            signature: '0000 5300 7400 6500 6900 6E00 7300 3B00 4700 6100 7400 6500 0000' // L"Steins;Gate\0"
        },
        {
            title: 'STEINS;GATE ELITE',
            script: './PC_Steam_MAGES_Steins;Gate-Elite.js',
            signature: '0000 7300 7400 6500 6900 6E00 7300 6700 6100 7400 6500 6500 0000' // L"steinsgatee\0"
        },
        {
            title: 'STEINS;GATE 0',
            script: './PC_Steam_MAGES_Steins;Gate-0.js',
            signature: '0000 7300 7400 6500 6900 6E00 7300 6700 6100 7400 6500 3000 0000' // L"steinsgate0\0"
        },
        {
            title: 'STEINS;GATE Linear Bounded Phenogram',
            script: './PC_Steam_MAGES_YUNO.js',  // TODO
            signature: '0000 5300 4700 5F00 5000 6800 6500 6E00 6F00 6700 7200 6100 6D00 0000' // L"SG_Phenogram\0"
        },
        {
            title: "STEINS;GATE My Darling's Embrace",
            script: './PC_Steam_MAGES_YUNO.js',  // TODO
            signature: '0000 5300 4700 5F00 4400 6100 7200 6C00 6900 6E00 6700 0000' // L"SG_Darling\0"
        },
        {
            title: 'PSP [NPJH50505] Fate/EXTRA CCC',
            script: './PSP_NPJH50505_Fate-EXTRA-CCC.js',
            signature: '4E504A48 35303530 35000000 55534552 49440000', // NPJH50505\0\0\0USERID\0\0
            full: true
        }
    ];

    global.__e = Process.enumerateModules()[0];
    const ranges = Process.enumerateRanges({ protection: 'rw-', coalesce: true });
    for (const vn of VNs) {
        if (vn.signature !== undefined) {
            if (vn.full === undefined) {
                const results = Memory.scanSync(__e.base, __e.size, vn.signature);
                if (results.length !== 0) {
                    console.log('Detect: ' + vn.title);
                    console.log('Script: ' + vn.script);
                    require(vn.script);
                    return;
                }
            }
            else {
                console.log('Full scan (very slow)');
                for (const range of ranges) {
                    try
                    {
                        const results = Memory.scanSync(range.base, range.size, vn.signature);
                        if (results.length !== 0) {
                            console.log('Detect: ' + vn.title);
                            console.log('Script: ' + vn.script);
                            require(vn.script);
                            return;
                        }
                    }
                    catch {}
                }
            }
            
        }
        
    }

    console.log('NOT SUPPORTED!');
})();