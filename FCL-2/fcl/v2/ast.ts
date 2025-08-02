
const debug = false;

// [--- general stuff ---]

export type ErrorData = {
    text: string;
    context?: NodeContext;
}

export function error(context: ErrorData): string {
    return context.text;
}

export type nullish = null | undefined;
export type nullishVoid = void | nullish;

// [--- token definitions ---]

export enum TokenKind {
    Text,
    Symbol,
    Whitespace
}

export enum TokenType {
    Equal,
    Add, Sub, Mul, Div, Pow, Mod,

    SemiColon, Comma,
    Period, Colon,

    OpenParen, CloseParen,
    OpenSquare, CloseSquare,
    OpenCurly, CloseCurly,
    LeftChevron, RightChevron,

    Backslash,
    SingleQuote, DoubleQuote, BackQuote,

    Space, Newline
}

export enum QuoteType {
    Single, // 'hi'
    Double, // "hi"
    Back // `hi`
}

const quoteTypeMap: Partial<Record<TokenType, QuoteType>> = {
    [TokenType.SingleQuote]: QuoteType.Single,
    [TokenType.DoubleQuote]: QuoteType.Double,
    [TokenType.BackQuote]: QuoteType.Back,
}

export type Token = {
    kind: TokenKind,
    type?: TokenType,
    text?: string
};

export const TokenMap: Record<string, Token> = {
    "=": { kind: TokenKind.Symbol, type: TokenType.Equal },

    "+": { kind: TokenKind.Symbol, type: TokenType.Add },
    "-": { kind: TokenKind.Symbol, type: TokenType.Sub },
    "*": { kind: TokenKind.Symbol, type: TokenType.Mul },
    "/": { kind: TokenKind.Symbol, type: TokenType.Div },
    "^": { kind: TokenKind.Symbol, type: TokenType.Pow },
    "%": { kind: TokenKind.Symbol, type: TokenType.Mod },

    ";": { kind: TokenKind.Symbol, type: TokenType.SemiColon },
    ",": { kind: TokenKind.Symbol, type: TokenType.Comma },

    ".": { kind: TokenKind.Symbol, type: TokenType.Period },
    ":": { kind: TokenKind.Symbol, type: TokenType.Colon },

    "(": { kind: TokenKind.Symbol, type: TokenType.OpenParen },
    ")": { kind: TokenKind.Symbol, type: TokenType.CloseParen },

    "[": { kind: TokenKind.Symbol, type: TokenType.OpenSquare },
    "]": { kind: TokenKind.Symbol, type: TokenType.CloseSquare },

    "{": { kind: TokenKind.Symbol, type: TokenType.OpenCurly },
    "}": { kind: TokenKind.Symbol, type: TokenType.CloseCurly },

    "<": { kind: TokenKind.Symbol, type: TokenType.LeftChevron },
    ">": { kind: TokenKind.Symbol, type: TokenType.RightChevron },

    "\\": { kind: TokenKind.Symbol, type: TokenType.Backslash },

    "'": { kind: TokenKind.Symbol, type: TokenType.SingleQuote },
    "\"": { kind: TokenKind.Symbol, type: TokenType.DoubleQuote },
    "`": { kind: TokenKind.Symbol, type: TokenType.BackQuote },

    " ": { kind: TokenKind.Whitespace, type: TokenType.Space },
    "\n": { kind: TokenKind.Whitespace, type: TokenType.Newline },
};

// [--- token functions ---]

export const getKind = (type: TokenType): TokenKind => Object.values(TokenMap).find(v => v.type == type).kind;
export const formatToken = (token: Token): string =>
    `token<${TokenKind[token.kind]}>{ ${[TokenKind.Symbol, TokenKind.Whitespace].includes(token.kind) ? TokenType[token.type] : token.text} }`;

export const getRaw = (token: Token): string => {
    let char = Object.keys(TokenMap)[Object.values(TokenMap).findIndex(v => v.kind == token.kind && v.type == token.type)];
    char ??= token.text;
    char ??= "?";

    return char;
};
export const getText = (token: Token): string => getRaw(token).replace(" ","space").replace("\n", "newline");
export const getErrFormat = (token: Token): string => token.kind != TokenKind.Text ? getText(token) : `token ${getText(token)}`;

export function Tokenise(text: string): Array<string> {
    const tokens = [""];
    
    const lastI = () => tokens.length - 1;
    const last = () => tokens[lastI()];
    const next = (i: number) => text[i + 1];

    const combChar = [ // tokens that will combine if theyre after another, == splits to ["=="]
        "=",
        "+","-","*","/","^","%"
    ];
    const sepChar = [ // tokens that will split if theyre after another, "?:" splits to ["?",":"]
        ";",",",
        ".",":",
        "!","?",

        "(",")",
        "[","]",
        "{","}",
        "<",">",

        "\\",
        "'", "\"", "`",

        " ","\n"
    ];
    const symChar = [ ...combChar, ...sepChar ]; // an array of all tokens that can split

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (combChar.includes(char)) {
            const lastChar = last();
            if (combChar.includes(lastChar) || lastChar == "")
                tokens[lastI()] += char;
            else
                tokens.push(...(combChar.includes(next(i)) ? [char] : [char, ""]));
            continue;
        }

        if (sepChar.includes(char)) {
            if (last() == "")
                tokens[lastI()] = char;
            else
                tokens.push(char);
            tokens.push("");
        } else
            tokens[lastI()] += char;
    }

    if (last() == "")
        tokens.pop();

    return tokens;
}

export const ConvertTokens = (tokens: Array<string>): Array<Token> =>
    tokens.map(t => TokenMap[t] ?? { kind: TokenKind.Text, text: t });

// [--- node data ---]

export type ParserContext = {
    token: number;

    depth: number;

    quoteType: QuoteType | nullish;
    quoteInside: boolean;
}

export type NodePosition = {
    start: number;
    end?: number;
}

export type NodeContext = NodePosition & {
    scriptCode: Array<Token>;
}

export enum NodeKind {
    // syntax
    Empty,
    Block,

    // literal
    String,

    // operations
    Execution,

    // accessing
    Identifier,

    // defs
    FunctionDefinition
}

export type NodeFilter = Array<NodeKind | null>;

export const NodeFilters: Record<string, NodeFilter> = {
    types: [
        NodeKind.Identifier
    ],
    executables: [
        NodeKind.Identifier,
        NodeKind.FunctionDefinition,
        null
        //NodeKind.Execution,
    ]
}

// [--- node classes ---]

export abstract class Node {
    constructor(public position: NodePosition) {

    }
}

export abstract class LiteralNode extends Node {

}

// syntax

export class EmptyNode extends Node {

}

export class BlockNode extends Node {
    constructor(position: NodePosition, public content: Array<Node>) {
        super(position);
    }
}

// accessing

export class IdentifierNode extends Node {
    constructor(position: NodePosition, public name: string) {
        super(position);
    }
}

// literals

export class StringNode extends LiteralNode {
    constructor(position: NodePosition, public nodes: Array<Node | Token>) {
        super(position);
    }
}

// operations

export class ExecutionNode extends Node {
    constructor(position: NodePosition, public func: Node, public args: Array<Node>) {
        super(position);
    }
}

// defs

export abstract class FunctionDefinitionNode extends LiteralNode {
    constructor(position: NodePosition, public content: Node) {
        super(position);
    }
}

export class NamedFunctionDefinitionNode extends FunctionDefinitionNode {
    constructor(position: NodePosition, public name: string, content: Node) {
        super(position, content);
    }
}

export class InlineFunctionDefinitionNode extends FunctionDefinitionNode {
    constructor(position: NodePosition, content: Node) {
        super(position, content);
    }
}

// [--- node parsing ---]

export type NodeParseOut = {
    node: Node | nullish,
    position: ParserContext
};

let depth = 0;

export function ParseNode(context: NodeContext, filter?: Array<NodeKind>): NodeParseOut {
    const tokens = context.scriptCode;

    let currentNode: nullish | NodeKind;

    let position: ParserContext = {
        token: context.start,

        depth: 0,
        
        quoteType: null,
        quoteInside: false
    };

    if (tokens.length == 0 || context.start >= tokens.length)
        return {
            node: new EmptyNode({start: 0, end: tokens.length}),
            position
        }

    const peek = (i: number = 0): Token | null => tokens[position.token + i];
    const consume = (): Token | null => tokens[position.token++];
    const consumeWhitespace = (): void => {
        while (peek().kind == TokenKind.Whitespace)
            consume();
    }
    const account = (t: Token): Token => {
        switch (t.type) {
            case TokenType.SingleQuote: case TokenType.DoubleQuote: case TokenType.BackQuote: {
                const type: QuoteType | undefined = quoteTypeMap[t.type];
                if (!position.quoteInside) {
                    position.quoteInside = true;
                    position.quoteType = type;
                } else {
                    if (position.quoteType == type) {
                        position.quoteInside = false;
                    }
                }
            }
        }
        if (!position.quoteInside) {
            switch (t.type) {
                case TokenType.OpenCurly: case TokenType.OpenSquare: case TokenType.OpenParen: position.depth ++; break;
                case TokenType.CloseCurly: case TokenType.CloseSquare: case TokenType.CloseParen: position.depth --; break;
            }
        }

        return t;
    }
    const ConsumeNode = (filter?: Array<NodeKind>): Node => {
        const out = ParseNode({
            scriptCode: tokens,
            start: position.token
        }, filter);

        position.token = out.position.token;
        return out.node;
    }
    
    const getNodePos = (): NodePosition => ({ start: context.start, end: position.token });
    const nodesExceptSelf = () => parsers.map(p => p[0]).filter(p => p != currentNode);

    const expectSymbol = (token: TokenType, sure: boolean = false): Token | nullish => {
        const next = account(consume());
        if (next.type == token)
            return next;
        if (!sure)
            return
        throw `expected ${getText({ kind: TokenKind.Symbol, type: token })} got ${getText(next)}`;
    };

    if (debug) {
        console.log("|   ".repeat(depth), "node", ...(filter != null ? [`filter: ${filter.map(f => NodeKind[f]).join(" and ")}`] : []), "{");
        depth ++;
        console.log("|   ".repeat(depth), "following token", getText(peek()));
    }

    const parsers: Array<[NodeKind, () => Node | nullishVoid]> = [
        // Block
        [NodeKind.Block, () => {
            const token = consume();
            if (token.type == TokenType.OpenCurly) {
                const content: Array<Node> = [];
                while (
                    peek() != null
                ) {
                    consumeWhitespace();

                    let peektoken = peek();
                    if (![TokenType.CloseCurly, TokenType.SemiColon].includes(peektoken.type)) {
                        const node = ConsumeNode();
                        if (node)
                            content.push(node);
                        continue;
                    }

                    if (position.quoteInside) continue;
                    if (position.depth > 0) continue;

                    account(peek());

                    consumeWhitespace();

                    let tkn = consume();

                    if (tkn.type == TokenType.SemiColon)
                        continue;

                    if (tkn.type == TokenType.CloseCurly) {
                        return new BlockNode(getNodePos(), content);
                    }

                    throw error({
                        text: `got ${getErrFormat(tkn)} expected ; or }`
                    });
                }
            }
        }],

        // String
        [NodeKind.String, () => {
            const token = account(consume());
            const type: QuoteType | undefined = quoteTypeMap[token.type];
            if (type) {
                const buf: Array<Node | Token> = [];
                while (true) {
                    const token = account(consume());
                    if (quoteTypeMap[token.type] == type)
                        return new StringNode(getNodePos(), buf);

                    buf.push(token);
                }
            }
        }],

        // NamedFunctionDefinition
        [NodeKind.FunctionDefinition, () => {
            try {
                const typeNode = ConsumeNode(NodeFilters.types);
            } catch {
                return;
            }
            if (peek().type != TokenType.Space) return; else consume();
            
            const functionNameToken = peek();

            const functionName = ConsumeNode([NodeKind.Identifier]);
            if (!(functionName instanceof IdentifierNode))
                throw `invalid function name ${getText(functionNameToken)}`;

            const out = expectSymbol(TokenType.OpenParen);
            if (!out) return

            // TODO: parameters

            expectSymbol(TokenType.CloseParen);

            consumeWhitespace();

            const content = ConsumeNode();

            return new NamedFunctionDefinitionNode(getNodePos(), functionName.name, content);
        }],
        
        // InlineFunctionDefinition
        [NodeKind.FunctionDefinition, () => {
            try {
                const typeNode = ConsumeNode(NodeFilters.types);
            } catch {
                return;
            }

            const out = expectSymbol(TokenType.OpenParen);
            if (!out) return

            // TODO: parameters

            expectSymbol(TokenType.CloseParen);

            consumeWhitespace();

            if (peek().type != TokenType.Equal) return;

            expectSymbol(TokenType.Equal);
            expectSymbol(TokenType.RightChevron);

            consumeWhitespace();

            const content = ConsumeNode();

            return new InlineFunctionDefinitionNode(getNodePos(), content);
        }],

        // Execution
        [NodeKind.Execution, () => {
            const func = ConsumeNode(NodeFilters.executables);
            if (func == null) return;
            
            consumeWhitespace();

            const token = consume();
            if (token.type == TokenType.OpenParen) {

                const args: Array<Node> = [];

                while (
                    peek() != null
                ) {
                    consumeWhitespace();

                    const peektoken = peek();
                    if (![TokenType.CloseParen, TokenType.Comma].includes(peektoken.type)) {
                        const node = ConsumeNode();
                        if (node)
                            args.push(node);
                    }

                    consumeWhitespace();

                    account(peek());

                    if (position.quoteInside) continue;
                    if (position.depth > 0) continue;

                    let tkn = consume();

                    if (tkn.type == TokenType.Comma)
                        continue;

                    if (tkn.type == TokenType.CloseParen) {
                        return new ExecutionNode(getNodePos(), func, args);
                    }

                    throw error({
                        text: `got ${getErrFormat(tkn)} expected , or )`
                    });
                }
            }
        }],

        // Parenthesis
        [null, () => {
            const tkn = account(consume());
            if (tkn.type == TokenType.OpenParen) {
                const node = ConsumeNode();
                const etkn = account(consume());
                if (etkn.type != TokenType.CloseParen)
                    return;
                return node;
            }
        }],

        // Identifier
        [NodeKind.Identifier, () => {
            const token = consume();
            if (token.kind == TokenKind.Text && /^\w+$/.test(token.text))
                return new IdentifierNode(getNodePos(), token.text);
        }],
    ];

    consumeWhitespace();

    let nodeOut: [Node, ParserContext] = null;
    
    const runParser = (parser: [NodeKind, () => Node | nullishVoid]): void => {
        const parserFunc = parser[1];
        const parserType = parser[0];

        currentNode = parserType;

        const savePos: ParserContext = { ...position };
        
        if (nodeOut/* || (filter && !filter.includes(Number(parserType)) && parserType)*/)
            return;
        
        if (debug) {
            console.log("|   ".repeat(depth), `parser ${NodeKind[parserType]} {`);
            depth ++;
        }
        
        const out = parserFunc();
        if (out)
            nodeOut = [out,position];
        
        if (debug) {
            depth --;
            console.log("|   ".repeat(depth), "} ->", out);
        }

        position = savePos;
    }

    if (filter == null) {
        for (let i = 0; i < parsers.length; i++) {
            const parser = parsers[i];
            runParser(parser);
        }
    } else {
        const parserRunList = filter.map(f => parsers.filter(p => p[0] == f)).flat();
        //parserRunList.unshift(...parsers.filter(p => p[0] == null));
        for (let i = 0; i < parserRunList.length; i++) {
            const parser = parserRunList[i];
            if (parser)
                runParser(parser);
        }
    }

    if (debug) {
        depth --;
        console.log("|   ".repeat(depth), "} ->", nodeOut && nodeOut[0]);
    }

    if (nodeOut && nodeOut[0] != null)
        return {
            node: nodeOut[0],
            position: nodeOut[1]
        };
    
    throw error({
        text: `unexpected ${getErrFormat(consume())}`
    });
}

// [--- ast ---]

export class Ast {
    public rootNode: Node;

    constructor(code: string) {
        const tokens = ConvertTokens(Tokenise("{" + code + "}"));
        const node = ParseNode({
            scriptCode: tokens,
            start: 0,
            end: tokens.length
        });
        this.rootNode = node.node;
        
        if (debug)
            console.log(this.rootNode);
    }
}
