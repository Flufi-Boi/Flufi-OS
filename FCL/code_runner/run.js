
const fs = require('fs');

const path = process.argv[2].split("\\");
path.pop();

function error(...text) {
    console.error(...text);
    process.exit();
}

function drawStructure(name, structure) {
    const indent = (txt,amt) => " ".repeat(amt * 2) + txt;
    const indentLines = (txt,amt) => txt.split("\n").filter(l => !!l).map(l => indent(l,amt)).join("\n");
    const addBeforeLines = (txt, prefix) => txt.split("\n").filter(l => !!l).map(l => prefix + l).join("\n")

    function drawTreeItems(structure) {
        const pairs = Object.entries(structure);
        let txt = "";
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const last = i != pairs.length - 1;
            txt += `${last ? "├" : "└"}─ ${pair[0]}\n`;
            if (pair[1] != null && last)
                txt += addBeforeLines(indentLines(drawTreeItems(pair[1]),1),"│") + "\n";
            if (pair[1] != null && !last)
                txt += indentLines(drawTreeItems(pair[1]),1.5) + "\n";
        }
        return txt;
    }
    return `${name}\n${indentLines(drawTreeItems(structure),1)}`;
}

const FSF = {
    settings: {}, // {"mySetting": "string", "myOtherSetting": "bool"} and such, types being string, bool, number, path, the type can also be an array of types
    utils: {
        split(t,r,i,$){t=(t=t??"").trim();let e=[],n="",u=0,c=0,o=0,s=0,_=!1,l=!1,h=!1,m={bracket:["(",")"],curly:["{","}"],square:["[","]"],arrow:["<",">"]}[r]??["",""],f=m[0],p=m[1],a="string"==typeof r?1===r.length?r:"":r,g=["+","-","*","/","^","%","."];for(let w=0;w<t.length;w++){let y=t[w];if("\\"==y){n+=y+t[w+1],w++;continue}"'"!=y||l||h||(_=!_),'"'!=y||_||h||(l=!l),"`"!=y||_||l||(h=!h);let b=_||l||h;if(b){n+=y;continue}if("("===y&&u++,")"===y&&u--,"{"===y&&c++,"}"===y&&c--,"["===y&&o++,"]"===y&&o--,"<"===y&&("arrow"==r||$)&&s++,">"===y&&("arrow"==r||$)&&s--,y===f&&u==("bracket"==r?1:0)&&c==("curly"==r?1:0)&&o==("square"==r?1:0)&&s==("arrow"==r?1:0)){n.trim()&&e.push(n.trim()),t[w+1]!=p||e[e.length-1]?n=")":e.push(""),n=f;continue}if(y===p&&0==u&&0==c&&0==o&&0==s){(n+=p).trim()&&e.push(n.trim()),n="";continue}if(i&&"}"===y&&!g.includes(t[w+1])&&0==u&&0==c&&0==o&&0==s){n+=y,e.push(n.trim()),n="";continue}if(a.includes(y)&&0==u&&0==c&&0==o&&0==s){n.trim()&&e.push(n.trim()),e.push(y),n="";continue}n+=y}return n.trim()&&e.push(n.trim()),e},
        format: (text) => text.trim().replace("\n","\\n"),
        unExcape(n){let e="";for(let t=0;t<n.length;t++){let i=n[t];if("\\"==i){let l=n[t+1];if("n"===l){e+="\n",t++;continue}e+=l,t++;continue}e+=i}return e},
        removeComments(e){let n="",t=!1,_=!1,o=!1,i=!1,l=!1;for(let f=0;f<e.length;f++){let r=e[f],u=e[f+1];if("\\"==r){n+=r+e[f+1],f++;continue}"'"!=r||i||l||(o=!o),'"'!=r||o||l||(i=!i),"`"!=r||o||i||(l=!l);let c=o||i||l;if(r+u!="//"||_||c||(t=!0),r+u!="/*"||t||c||(_=!0),r+u=="*/"&&!t&&!c){_=!1,f++;continue}"\n"==r&&(t=!1),t||_||(n+=r)}return n},
        error: error.bind(null, "[fsf]") // error: (...text) => throw Error(text.join(" "))
    },

    parseValue(code) {
        code = code.trim();

        /* path */ {
            const fileTypes = this.utils.split(code,".");
            const everyOther = arr => arr.reduce((acc,item,i) => {i % 2 == 0 ? acc.push(item) : null;return acc},[]);
            const everyFollowsRegex = (arr, regex) => arr.reduce((acc,i) => acc && regex.test(i), true)
            if (fileTypes.length >= 3 && everyFollowsRegex(everyOther(fileTypes.slice(2)), /^[A-Za-z0-9_]+$/)) {
                const path = this.utils.split(fileTypes[0], "/");
                const file = path.pop(); path.pop();
                if (/^[A-Za-z0-9_]+$/.test(file) && everyFollowsRegex(everyOther(path), /^[A-Za-z0-9_ ]+$/))
                    return {
                        "type": "path",
                        "data": code
                    }
            }
        }

        /* number */ {
            if (/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(code))
                return {
                    "type": "number",
                    "data": Number(code)
                }
        }

        /* string */ {
            if (["'","\"","`"].reduce((acc,p) => acc || (code[0] === p && code[code.length-1] === p),false)) {
                return {
                    "type": "string",
                    "data": this.utils.unExcape(code.slice(1,-1))
                }
            }
        }

        /* bool */ {
            const table = {
                "true": true,
                "false": false
            }
            if (Object.keys(table).includes(code))
                return {
                    "type": "bool",
                    "data": table[code]
                }
        }

        this.utils.error(`unknown value syntax: ${this.utils.format(code)}`);
    },

    parse(code) {
        let out = {};

        code = this.utils.removeComments(code);

        const elements = this.utils.split(code, ";").filter(t => t !== ";");
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];

            const tokens = this.utils.split(element, ":");
            if (tokens.length == 3 && /^[A-Za-z0-9_]+$/.test(tokens[0]) && tokens[1] === ":") {
                const setting = this.settings[tokens[0]];
                if (!setting) {
                    const settingPairs = Object.entries(this.settings);
                    this.utils.error(`unknown setting ${tokens[0]}, available settings:\n${settingPairs.map((p,i) => `  ${i == settingPairs.length-1 ? "└" : "│"}─ ${p[0]} (${Array.isArray(p[1]["type"]) ? p[1]["type"].join(" or ") : p[1]["type"]})${p[1]["desc"] != null ? `\n  ${i == settingPairs.length-1 ? " " : "│"}  └─ ${p[1]["desc"]}` : ""}`).join("\n")}`);
                }
                const settingType = setting["type"];
                const value = this.parseValue(tokens[2]);
                if (Array.isArray(settingType) ? !settingType.includes(value["type"]) : value["type"] !== settingType)
                    this.utilserror(`wanted ${this.settings[tokens[0]]} for ${tokens[0]} but got ${value["type"]}`);
                else
                    out[tokens[0]] = value["data"];
                continue;
            }

            this.utils.error(`unknown setting syntax: ${this.utils.format(element)}`);
        }

        return out;
    }
}

FSF.settings = {
    "main": { "type": "path", "desc": "the main file to start compilation from" },
    "export": { "type": "path", "desc": "the file path to export the compiled fbl to" },

    "shareVariables": { "type": "bool", "desc": "a compiler setting for variables outside forever loops" },
    "legacyNotEqual": { "type": "bool", "desc": "disables the use of the neql command" },
    "unsafe": { "type": "bool", "desc": "removes runtime type checks" },
    "noComp": { "type": "bool", "desc": "doesnt compile the scripts, useful for large projects and updating modules" },
    "allComp": { "type": "bool", "desc": "force it to compile every module" },
    "elemDebug": { "type": "bool", "desc": "adds a comment for every element" },
}

let config = null;
let projectPath;
for (let i = path.length-1; i > 0; i--) {
    const element = path[i];
    if (element == "src" || element == "modules") {
        projectPath = path.slice(0,i).join("/");
        if (fs.existsSync(projectPath + "\\fclconfig.fsf")) {
            config = FSF.parse(fs.readFileSync(projectPath + "\\fclconfig.fsf", 'utf8'));
            config["projectPath"] = projectPath;
        }
        break;
    }
}

let doModules = true;

const flags = {
    "noExport": {
        "func": function() {
            config["export"] = null;
        },
        "desc": "prints the compiled output instead of putting it into the export file"
    },
    "noModules": {
        "func": function() {
            doModules = false;
        },
        "desc": "disables compilation of modules"
    }
}
const args = process.argv.slice(3);
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.slice(0,2) == "--") {
        if (Object.keys(flags).includes(arg.slice(2)))
            flags[arg.slice(2)]["func"]();
        else {
            const flagPairs = Object.entries(flags);
            error(`unknown flag ${arg.slice(2)}, available flags:\n${flagPairs.map((p,i) => `  ${i == flagPairs.length-1 ? "└" : "│"}─ ${p[0]}: ${p[1]["desc"] != null ? `\n  ${i == flagPairs.length-1 ? " " : "│"}  └─ ${p[1]["desc"]}` : ""}`).join("\n")}`);
        }
        continue;
    }
    error(`unknown argument ${arg}`);
}

if (config && config["main"] && config["projectPath"]) {
    const code = fs.readFileSync(config["projectPath"] + "/" + config["main"], 'utf8');
    const compiler = fs.readFileSync("D:/Flufi-OS/FCL/node/fbl.js", 'utf8').split("// NODE JS")[0];
    
    const getParent = (path) => path.split("/").slice(0,-1).join("/");

    const exportPath = config["projectPath"] + "/" + config["export"];
    const exportFolder = getParent(exportPath);

    console.time("in");
    console.log("starting compilation...");
    console.log("");
    
    const startm = performance.now();
    let out;
    if (fs.existsSync(exportPath))
        out = fs.readFileSync(exportPath);
    if (!config["noComp"] || !out) {
        out = eval(compiler + `;
        console.time("parsing (main)");
        const script = new Script(${JSON.stringify(code)});
        console.timeEnd("parsing (main)");
        const context = new CompileContext();

        context.sharesVariables = ${config["shareVariables"] ?? false};
        context.neqlSupport = ${!(config["legacyNotEqual"] ?? false)};
        context.unsafe = ${config["unsafe"] ?? false};
        context.elementDebug = ${config["elemDebug"] ?? false};

        console.time("compiling (main)");
        const val = script.compile(context,null,{...getDefaultFs(),...importFs(${JSON.stringify(config["projectPath"] + "/src")}),"apis":{...importFs(${JSON.stringify(config["projectPath"] + "/src")})}});
        console.timeEnd("compiling (main)");
        console.log("");
        val
        `);
    }
    const endm = performance.now();
    
    if (config["export"]) {
        let modOuts = null;

        if (!fs.existsSync(exportFolder))
            fs.mkdirSync(exportFolder);
        else {
            function delDir(dir,r = false) {
                const files = fs.readdirSync(dir);
                for (let i = 0; i < files.length; i++) {
                    const f = files[i];
                    if (fs.lstatSync(dir + "/" + f).isDirectory())
                        delDir(dir + "/" + f);
                    else
                        fs.rmSync(dir + "/" + f);
                }
                if (!r)
                    fs.rmdirSync(dir);
                
            }
            delDir(exportFolder,true);
        }

        if (fs.existsSync(config["projectPath"] + "/" + "modules") && doModules) {
            const modulesPath = config["projectPath"] + "/" + "modules";
            const modules = fs.readdirSync(modulesPath);
            const moduleOuts = {};
            FSF.settings["export"].desc = "the file path that the file can appear in the os that loads it";
            FSF.settings["noComp"] = { "type": "bool", "desc": "doesnt compile the module" };
            for (let i = 0; i < modules.length; i++) {
                const moduleName = modules[i];
                const modulePath = modulesPath + "/" + moduleName;
                const configPath = modulePath + "/" + "fclconfig.fsf";
                const localExport = `modules/${moduleName}.fbl`;
                const moduleExport = exportFolder + "/" + (localExport);
                const start = performance.now();
                
                let config2;
                if (fs.existsSync(configPath))
                    config2 = FSF.parse(fs.readFileSync(configPath, 'utf8'));

                if (config2 != null && config2["noComp"] && !config["allComp"]) {
                    continue;
                }

                const main = modulePath + "/" + (config2 != null ? config2["main"] ?? "main.fcl" : "main.fcl");
                
                let out = "";
                if (fs.existsSync(main))
                    out = eval(compiler + `
                    console.time("parsing (${moduleName})");
                    const script = new Script(${JSON.stringify(fs.readFileSync(main,'utf8'))});
                    console.timeEnd("parsing (${moduleName})");
                    const context = new CompileContext();
                    context.sharesVariables = ${config["shareVariables"] ?? false};
                    context.neqlSupport = ${!(config["legacyNotEqual"] ?? false)};
                    context.unsafe = ${config["unsafe"] ?? false};
                    context.elementDebug = ${config["elemDebug"] ?? false};
                    console.time("compiling (${moduleName})");
                    const val = script.compile(context,null,{...getDefaultFs(),...importFs(${JSON.stringify(config["projectPath"] + /*"/apis"*/ "/src")})});
                    console.timeEnd("compiling (${moduleName})");
                    console.log("");
                    val
                    `);
                else
                    console.warn(`module ${moduleName} is empty or has no main.fcl; and hasnt been compiled.`);
                
                if (!fs.existsSync(getParent(moduleExport)))
                    fs.mkdirSync(getParent(moduleExport));
                
                fs.writeFileSync(moduleExport, out);
                moduleOuts[localExport] = config2 != null ? config2["export"] : null;
                modOuts ??= [""];
                modOuts.push(`output (${moduleName}) put in ${getParent(config["export"])}/${localExport}, in ${Math.floor(performance.now()-start)}ms`)
            }
            if (modOuts)
                modOuts.push("");
            fs.writeFileSync(exportFolder + "/modules.json", JSON.stringify(moduleOuts));
        }

        if (out != null)
            fs.writeFileSync(exportPath, out, 'utf8');
        console.log(`compilation finished!${(modOuts ?? ["",""]).join("\n\n")}output (main) put in ${config["export"]}, in ${Math.floor(endm-startm)}ms`);
        console.timeLog("in");
    } else {
        let modOuts = null;
        if (fs.existsSync(config["projectPath"] + "/" + "modules") && doModules) {
            const modulesPath = config["projectPath"] + "/" + "modules";
            const modules = fs.readdirSync(modulesPath);
            delete FSF.settings["export"];
            for (let i = 0; i < modules.length; i++) {
                const moduleName = modules[i];
                const modulePath = modulesPath + "/" + moduleName;
                const configPath = modulePath + "/" + "fclconfig.fsf";

                let config2;
                if (fs.existsSync(configPath))
                    config2 = FSF.parse(fs.readFileSync(configPath, 'utf8'));

                const moduleExport = exportFolder + "/modules/" + (config2 != null ? config2["export"] ?? `${moduleName}.fbl` : `${moduleName}.fbl`)

                const main = modulePath + "/" + (config2 != null ? config2["main"] ?? "main.fcl" : "main.fcl");
                
                let out = "";
                if (fs.existsSync(main))
                    out = eval(compiler + `;const script = new Script(${JSON.stringify(fs.readFileSync(main,'utf8'))});const context = new CompileContext();context.sharesVariables = ${config["shareVariables"] ?? false};script.compile(context,null,{...getDefaultFs(),...importFs(${JSON.stringify(config["projectPath"] + /*"/apis"*/ "/src")})});`);
                else
                    console.warn(`module ${moduleName} is empty or has no main.fcl; and hasnt been compiled.`);

                modOuts ??= [""];
                modOuts.push(`compiled output (${moduleName}):\n${out || "[empty]\n"}`);
            }
            if (modOuts)
                modOuts.push("");
        }

        console.log(`compilation finished!\n${(modOuts ?? ["",""]).join("\n")}compiled output (main):\n${out}`);
        console.timeEnd("in");
    }
    process.exit()
}

if (!config && projectPath) {
    console.warn(`no fclconfig.fsf for project (there is a "src" folder),
a project's file structure should resemble this:
${drawStructure("project",{
    "modules?": {
        "moduleName": {
            "[fcl files]": null,
            "fcfconfig.fsf?": null
        }
    },
    "out?": {
        "modules?": {
            "[build files]": null
        },
        "[build files]": null
    },
    "src": {
        "[fcl files]": null
    },
    "fclconfig.fsf": null
})}
`)
}

const code = fs.readFileSync(process.argv[2], 'utf8');
const compiler = fs.readFileSync("D:/Flufi-OS/FCL/node/fbl.js", 'utf8').split("// NODE JS")[0];
    console.log("starting compilation...");
const out = eval(compiler + `;const script = new Script(${JSON.stringify(code)});script.compile(null,null,{...getDefaultFs(),...importFs("${path.join("/")}")});`)
console.log("compilation finished!\n\ncompiled output:\n" + out);