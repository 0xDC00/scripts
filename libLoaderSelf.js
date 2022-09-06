// mobile self attach (self->agentConsole)+loader
setTimeout(main);
function main() {
    if (Java.available === true) {
        Java.perform(() => {
            try {
                Java.use('com.myapp.Agent');
                return exit('Injected, detaching...');
            }
            catch { };
            console.log('Injecting...');
    
            const ByteBuffer = Java.use('java.nio.ByteBuffer');
            const jarr = Java.array('byte', new Uint8Array(getDex()));
            const jbuf = ByteBuffer.wrap(jarr);
    
            // Android 8.0+
            const InMemoryDexClassLoader = Java.use('dalvik.system.InMemoryDexClassLoader');
            const oldLoader = Java.classFactory.loader;
            const newLoader = InMemoryDexClassLoader.$new(jbuf, oldLoader);
            Java.classFactory.loader = newLoader;
            
            usesCleartextTraffic();
    
            const agent = Java.use('com.myapp.Agent');
            agent.$new(globalThis.__mission, globalThis.__pid, globalThis.__srcLang, globalThis.__dstLang);
    
            Java.classFactory.loader = oldLoader;
            // ensure usesCleartextTraffic trigged
            exit('Payload sent, detaching...', 3000);
        });
    }
    else {
        // TODO: iOS
    }
}

/** @return {ArrayBuffer} */
function getDex() {
    const key = Date.now();
    send({
        cmd: 'eval',
        func: 'fs_readFileSync',
        args: ['/apk:/classes.dex'],
        key: key
    });
    let result;
    recv(key, (_, data) => {
        result = data;
    }).wait();
    return result;
}

function exit(msg, timeout = 100) {
    console.log(msg);
    setTimeout(() => {
        send({ cmd: 'detach' });
    }, timeout);
}

// https://gist.github.com/akabe1/3da684903d8e57ec3328432358289b65
function usesCleartextTraffic() {
    console.log('');
    console.log('======');
    console.log('[#] Android Network Security Config bypass [#]');
    console.log('======');

    var ANDROID_VERSION_M = 23;
    var DefaultConfigSource = Java.use("android.security.net.config.ManifestConfigSource$DefaultConfigSource");
    var NetworkSecurityConfig = Java.use("android.security.net.config.NetworkSecurityConfig");
    var ManifestConfigSource = Java.use("android.security.net.config.ManifestConfigSource");
    var NetworkSecurityTrustManager = Java.use("android.security.net.config.NetworkSecurityTrustManager");
    var ApplicationInfo = Java.use("android.content.pm.ApplicationInfo");


    ManifestConfigSource.getConfigSource.implementation = function () {
        console.log("[+] Hooking ManifestConfigSource.getConfigSource() method...");
        /*******************************************************************
        Checks necessary to determine the device API level, possible cases are:
        (a) API <= 25, the DefaultConfigSource() method has the following 2 args
             public DefaultConfigSource(boolean usesCleartextTraffic, int targetSdkVersion)
        (b) API is 26 or 27, the DefaultConfigSource() method has the following 3 args 
             public DefaultConfigSource(boolean usesCleartextTraffic, int targetSdkVersion, int targetSandboxVesrsion)
        (c) API >= 28, the DefaultConfigSource() method has the following 2 args
             public DefaultConfigSource(boolean usesCleartextTraffic, ApplicationInfo info)
        *******************************************************************/
        try {
            if (DefaultConfigSource.$new.argumentTypes.length == 2) {
                // Second arg for DefaultConfigSource in API <= 25 is an int32
                if (DefaultConfigSource.$new.argumentTypes[1].type == 'int32') {
                    console.log("[+] Bypass for API level <= 25");
                    return DefaultConfigSource.$new(true, ANDROID_VERSION_M);
                } else {
                    console.log("[+] Bypass for API level >= 28");
                    var appInfo = ApplicationInfo.$new();
                    // Opportunely sets some params for NetworkSecurityConfig.getDefaultBuilder method
                    appInfo.targetSdkVersion.value = ANDROID_VERSION_M;
                    appInfo.targetSandboxVersion.value = 1;
                    appInfo.PRIVATE_FLAG_INSTANT.value = 0;
                    appInfo.PRIVATE_FLAG_PRIVILEGED.value = 0;
                    //console.log("[+] targetsdk: "+ appInfo.targetSdkVersion.value);
                    return DefaultConfigSource.$new(true, appInfo);
                }
            } else {
                console.log("[+] Bypass for API level 26 or 27");
                //console.log("[+] Found arg type: "+ DefaultConfigSource.$new.argumentTypes[0].type);
                return DefaultConfigSource.$new(true, ANDROID_VERSION_M, 1);
            }
        } catch (err) {
            console.log('[-] Error, something went wrong...');
            console.log(err);
        }
    }
}