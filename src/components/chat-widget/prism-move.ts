/**
 * Prism/refractor language definition for Move (Aptos Move).
 *
 * Move is a smart-contract language designed for the Aptos blockchain.
 * This grammar covers Move 2.x syntax including modules, structs, enums,
 * functions, abilities, address literals, and common control flow.
 *
 * Compatible with react-syntax-highlighter's PrismLight (refractor-based).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function move(Prism: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Prism.languages.move = {
    comment: [
      { pattern: /\/\/\/.*/, greedy: true, alias: "doc-comment" },
      { pattern: /\/\/.*/, greedy: true },
      { pattern: /\/\*[\s\S]*?\*\//, greedy: true },
    ],

    // String and byte-string literals
    string: [
      { pattern: /b"(?:[^"\\]|\\.)*"/, greedy: true },
      { pattern: /"(?:[^"\\]|\\.)*"/, greedy: true },
    ],

    // Annotations like #[view], #[test], #[expected_failure]
    annotation: {
      pattern: /#\[[\s\S]*?\]/,
      greedy: true,
      alias: "punctuation",
    },

    // Address literals: @0x1, @aptos_framework, @std
    "address-literal": {
      pattern: /@(?:0x[0-9a-fA-F]+|\w+)/,
      alias: "constant",
    },

    // Hex literals: 0x1, 0xCAFE
    "hex-literal": {
      pattern: /\b0x[0-9a-fA-F][0-9a-fA-F_]*\b/,
      alias: "number",
    },

    // Abilities: has key, store, copy, drop
    ability: {
      pattern: /\b(?:copy|drop|key|store)\b/,
      alias: "keyword",
    },

    // Keywords
    keyword: [
      {
        // Declaration and control-flow keywords
        pattern:
          /\b(?:abort|acquires|address|as|break|const|continue|else|entry|enum|friend|fun|has|if|inline|let|loop|macro|match|module|move|mut|native|public|return|script|spec|struct|use|while)\b/,
      },
      {
        // Visibility scopes: public(friend), public(package), public(script)
        pattern: /\b(?:public)\s*\(\s*(?:friend|package|script)\s*\)/,
      },
    ],

    // Built-in types
    builtin: {
      pattern: /\b(?:address|bool|signer|u8|u16|u32|u64|u128|u256|vector)\b/,
    },

    // Boolean literals
    boolean: /\b(?:false|true)\b/,

    // Numeric literals (decimal with optional type suffix)
    number: /\b\d[\d_]*(?:u8|u16|u32|u64|u128|u256)?\b/,

    // Constants (UPPER_SNAKE_CASE)
    constant: /\b[A-Z][A-Z0-9_]+\b/,

    // Type names (PascalCase)
    "class-name": /\b[A-Z]\w*\b/,

    // Function calls
    function: /\b[a-z_]\w*(?=\s*(?::<[^>]*>)?\s*\()/,

    // Operators
    operator: /=>|->|::|&&|\|\||[!=<>]=?|[+\-*/%&|^]=?|<<|>>/,

    // Punctuation
    punctuation: /[{}[\]();,.:]/,
  };
}

move.displayName = "move";
move.aliases = [] as string[];

export default move;
