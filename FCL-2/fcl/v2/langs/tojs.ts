import { Ast, BlockNode, Node, NodeKind } from "../ast";
import { FCLCompilerData, Script } from "../main";

// [--- utils ---]

export type ErrorData = {
    text: string;
    node?: Node;
}

export function error(context: ErrorData): string {
    return context.text;
}

export enum ErrorType {
    NoEntry
}

export const Errors: Record<keyof typeof ErrorType, (...args: any[]) => string> = {
    NoEntry: () => `no entry script specified or found.`
}

// [--- base classes ---]
export class Context {
    constructor(public scripts: Record<string, Script>) {

    }
}

export type NodeContext = {
    rootCtx: Context,
    module: Module
}

// [--- type base classes ---]
export abstract class Type {

}

// [--- type classes ---]

// [--- value base classes ---]
export abstract class Value {

}

// [--- value classes ---]
export class Module extends Value {
    compiled?: string;

    constructor(public script: Script) {
        super();
    }
}

export function CompileScripts(scripts: Record<string, Script>, data?: FCLCompilerData): string {
    const ctx = new Context(scripts);
    
    const entry = scripts[data?.entry] ?? scripts["main"];

    if (!entry)
        throw Errors.NoEntry();
    
    const entryOut = CompileScript(entry, ctx);

    return entryOut.compiled ?? "null";
}

export function CompileScript(script: Script, rootCtx: Context): Module {
    const mod = new Module(script);

    const ctx: NodeContext = {
        rootCtx: rootCtx,
        module: mod
    };

    mod.compiled = CompileNode(mod.script.ast.rootNode, ctx);

    return mod;
}

export function CompileNode(rawNode: Node, ctx: NodeContext): string {
    switch(rawNode.kind) {
        case NodeKind.Block: {
            const node = rawNode as BlockNode;
            let str = "";

            for (let i = 0; i < node.content.length; i++) {
                const element = node.content[i];
                str += CompileNode(element, ctx) + ";\n";
            }

            str += `
                console.debug("huh?");
                console.log("bleh");
                console.warn("maybe");
                console.error("sad");
            `.split("\n").map(l => l.trim()).join("\n");

            if (node.isRoot)
                return str;
            return "{\n" + str + "}";
        }
    }

    return `/* ${NodeKind[rawNode.kind]} node */ (() => {console.error("${NodeKind[rawNode.kind]} has no compilation");return null})()`;
}
