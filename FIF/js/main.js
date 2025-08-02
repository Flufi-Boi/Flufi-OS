
function split(text, type, useendbracket) {
    text = text.trim();
    const tokens = [];
    let current = "";

    let bracketDepth = 0,
        curlyDepth = 0,
        squareDepth = 0,
        arrowDepth = 0;
    let inSingle = false,
        inDouble = false,
        inTick = false;
    
    const brackets = {"bracket":["(",")"],"curly":["{","}"],"square":["[","]"],"arrow":["<",">"]}[type] ?? ["",""]; // get the bracket pairs
    const open = brackets[0],
        close = brackets[1];
    const splitChars = (typeof type == "string") ? (type.length === 1 ? type : "") : type;

    const operators = [
        "+","-","*","/","^","%",
        "."
    ]
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char == "\\") { current += char + text[i + 1]; i ++; continue; }

        if (char == "'" && !(inDouble || inTick))
            inSingle = !inSingle;
        if (char == "\"" && !(inSingle || inTick))
            inDouble = !inDouble;
        if (char == "`" && !(inSingle || inDouble))
            inTick = !inTick;

        const inQuotes = inSingle || inDouble || inTick;

        if (inQuotes) {
            current += char;
            continue;
        }

        if (char === "(")
            bracketDepth ++;
        if (char === ")")
            bracketDepth --;
        if (char === "{")
            curlyDepth ++;
        if (char === "}")
            curlyDepth --;
        if (char === "[")
            squareDepth ++;
        if (char === "]")
            squareDepth --;
        if (char === "<" && type == "arrow")
            arrowDepth ++;
        if (char === ">" && type == "arrow")
            arrowDepth --;
        
        if (char === open && 
            bracketDepth == (type == "bracket" ? 1 : 0) &&
            curlyDepth == (type == "curly" ? 1 : 0) &&
            squareDepth == (type == "square" ? 1 : 0) &&
            arrowDepth == (type == "arrow" ? 1 : 0)
        ) {
            if (current.trim())
                tokens.push(current.trim());
            if (text[i+1] == close && !tokens[tokens.length - 1])
                tokens.push("");
            else
                current = ")";
            current = open;
            continue;
        }
        if (char === close && bracketDepth == 0 && curlyDepth == 0 && squareDepth == 0 && arrowDepth == 0) {
            current += close;
            if (current.trim())
                tokens.push(current.trim());
            current = "";
            continue;
        }

        if (useendbracket && char === "}" && !operators.includes(text[i + 1]) && bracketDepth == 0 && curlyDepth == 0 && squareDepth == 0 && arrowDepth == 0) {
            current += char;
            tokens.push(current.trim());
            current = "";
            continue;
        }

        if (splitChars.includes(char) && bracketDepth == 0 && curlyDepth == 0 && squareDepth == 0 && arrowDepth == 0) {
            if (current.trim())
                tokens.push(current.trim());
            tokens.push(char);
            current = "";
            continue;
        }

        current += char;
    }

    if (current.trim())
        tokens.push(current.trim());

    return tokens;
}

function is(text, type) {
    const first = text[0],
        last = text[text.length - 1];
    
    const pairs = {
        "bracket": ["(",")"],
        "curly":["{","}"],
        "square":["[","]"],
        "arrow":["<",">"],
        "single-q":["'","'"],
        "double-q":['"','"'],
        "back-q":["`","`"]
    }

    const pair = pairs[type];
    return pair ? (first === pair[0] && last === pair[1]) : false;
}

function getDecimalPlace(num) {
    const str = num.toString();
    const decimalPart = str.split(".")[1];
    const decimalDigits = decimalPart ? decimalPart.length : 0;
    return 10 ** decimalDigits;
}

function parseFIF(code) {
    const tokens = split(code, [" ", "\n"]).filter(t => ![" ", "\n"].includes(t));
    const outSplit = [];
    const params = {};
    const flags = {};
    let isNeeded = false;
    
    const isNumeric = (t) => /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t);
    const parseArg = (arg) => {const isNum = isNumeric(arg); if (!isNum) isNeeded = true; return isNum ? arg : arg[0] == "?" ? ["flag",arg.slice(1)] : ["arg",arg]}

    const shiftArg = () => parseArg(tokens.shift());

    while (tokens.length > 0) {
        let token = tokens.shift();
        
        if (tokens[0] === "=") {
            const name = token;
            tokens.shift();
            outSplit.push(["assignment",name,shiftArg()]);
            continue;
        }

        switch (token) {
            case "#": {
                const kind = tokens.shift();
                switch (kind) {
                    case "param": {
                        const name = tokens.shift();
                        const param = {"name":name};
                        if (tokens[0] === "default") {
                            tokens.shift();
                            param["default"] = tokens.shift();
                        }
                        params[name] = param;
                        break;
                    }
                    case "flag": {
                        const name = tokens.shift();
                        const flag = {"name":name};
                        if (tokens[0] === "default") {
                            tokens.shift();
                            flag["default"] = Boolean(tokens.shift());
                        }
                        flag["default"] ??= false;
                        flags[name] = flag;
                        break;
                    }
                }
                continue;
            }

            case "if": {
                isNeeded = true;
                const condition = shiftArg();
                const stackToken = tokens.shift();
                let stack;
                if (is(stackToken,"curly"))
                    stack = parseFIF(stackToken.slice(1,-1));
                else
                    throw Error("unknown content for if statement");

                outSplit.push(["if", condition, stack]);
                continue;
            }
            case "else": {
                isNeeded = true;
                const stackToken = tokens.shift();
                let stack;
                if (is(stackToken,"curly"))
                    stack = parseFIF(stackToken.slice(1,-1));
                else
                    throw Error("unknown content for else");

                outSplit.push(["else", stack]);
                continue;
            }
            case "every": {
                isNeeded = true;
                const variable = tokens.shift();
                const start = shiftArg();
                const end = shiftArg();
                let step = 1;
                if (!is(tokens[0], "curly"))
                    step = shiftArg();
                const stackToken = tokens.shift();
                let stack;
                if (is(stackToken,"curly"))
                    stack = parseFIF(stackToken.slice(1,-1));
                else
                    throw Error("unknown content for every");

                outSplit.push(["every", variable, start, end, step, stack]);
                continue;
            }
            
            case "w":
                outSplit.push(["w", shiftArg()]);
                continue;
            case "c":
                outSplit.push(["c", shiftArg()]);
                continue;
            
            case "line":
                outSplit.push(["square", shiftArg(), shiftArg(), shiftArg(), shiftArg()]);
                continue;
            case "cont":
                outSplit.push(["square", shiftArg(), shiftArg()]);
                continue;
            case "square":
                outSplit.push(["square", shiftArg(), shiftArg(), shiftArg(), shiftArg()]);
                continue;
            case "dot":
                outSplit.push(["dot", shiftArg(), shiftArg()]);
                continue;
            case "cutcircle":
                outSplit.push(["cutcircle", shiftArg(), shiftArg(), shiftArg(), shiftArg(), shiftArg()]);
                continue;
            case "circle":
                outSplit.push(["cutcircle", shiftArg(), shiftArg(), shiftArg(), "0", "180"]);
                continue;
            case "ellipse":
                outSplit.push(["ellipse", shiftArg(), shiftArg(), shiftArg(), shiftArg(), shiftArg()]);
                continue;
        }

        throw Error("unexpected token '" + token + "'");
    }
    let out = outSplit.map(o => o.map(a => Array.isArray(a) ? a[0] + ":" + a[1] : a).join(" ")).join(" ");
    return {"icn":out.trim(),"split":outSplit,"params":params,"flags":flags,"isNeeded":isNeeded};
}

function compileFIF(compiled, args, flags) {
    args ??= {};
    flags ??= [];
    const compileArg = (a) => {
        if (a[0] == "arg") {
            const param = compiled["params"][a[1]];
            const arg = args[a[1]];
            if (param) {
                if (arg || param["default"]) {
                    return arg ?? param["default"];
                } else {
                    throw Error("arg '" + a[1] + "' not given");
                }
            } else {
                if (args[a[1]])
                    return args[a[1]];
                return 0;
            }
        }
        if (a[0] == "flag") {
            return (flags ?? []).includes(a[1]);
        }
        return a;
    }
    let stackValue = false;
    const compileCommand = (c) => {
        switch (c[0]) {
            case "if":
                stackValue = compileArg(c[1]);
                if (stackValue)
                    return compileFIF(c[2], args, flags) + " ";
                else
                    return "";
            case "else":
                if (!stackValue)
                    return compileFIF(c[1], args, flags) + " ";
                else
                    return "";
            case "every":
                args[c[1]] = Number(compileArg(c[2]));
                let outEvery = "";
                const step = Number(compileArg(c[4]));
                const div = getDecimalPlace(step);
                for (; 0 <= compileArg(c[3]) - args[c[1]];) {
                    outEvery += compileFIF(c[5], args, flags) + " ";
                    args[c[1]] = Math.round((Number(args[c[1]]) + step) * div) / div;
                }
                return outEvery;
            case "assignment":
                args[c[1]] = compileArg(c[2]);
                return "";
        }
        return c[0] + " " + c.slice(1).map(a => compileArg(a).toString()).join(" ").trim() + " ";
    }
    return compiled["split"].map(c => compileCommand(c)).join("").trim();
}

const code = `
# param funny default 2
# param crazy
# flag sigma

circle 0 0 10

if ?sigma {
    dot 0 0
} else {
    every x -10 10 5 {
        dot x -5
    }
}

`;

console.log(compileFIF(parseFIF(code), {"crazy": "5"}, ["crazy"]));