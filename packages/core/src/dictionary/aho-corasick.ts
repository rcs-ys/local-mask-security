export interface AhoPattern {
  id: number;
  text: string;
}

export interface AhoMatch {
  start: number;
  end: number;
  id: number;
}

interface Node {
  next: Map<string, number>;
  fail: number;
  outputs: number[];
}

/**
 * 複数パターンの同時照合（Aho-Corasick）。辞書のリテラル検出向け。
 */
export class AhoCorasick {
  private readonly nodes: Node[] = [
    { next: new Map(), fail: 0, outputs: [] },
  ];

  constructor(patterns: AhoPattern[]) {
    for (const p of patterns) {
      if (!p.text) continue;
      this.insert(p.id, p.text);
    }
    this.buildFailures();
  }

  search(text: string): AhoMatch[] {
    const matches: AhoMatch[] = [];
    let state = 0;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i]!;
      while (state !== 0 && !this.nodes[state]!.next.has(char)) {
        state = this.nodes[state]!.fail;
      }
      if (this.nodes[state]!.next.has(char)) {
        state = this.nodes[state]!.next.get(char)!;
      }

      for (const id of this.nodes[state]!.outputs) {
        const pattern = this.patternLength.get(id) ?? 0;
        if (pattern > 0) {
          matches.push({
            start: i - pattern + 1,
            end: i + 1,
            id,
          });
        }
      }
    }

    return matches;
  }

  private readonly patternLength = new Map<number, number>();

  private insert(id: number, text: string): void {
    this.patternLength.set(id, text.length);
    let state = 0;
    for (const char of text) {
      if (!this.nodes[state]!.next.has(char)) {
        const nextIndex = this.nodes.length;
        this.nodes[state]!.next.set(char, nextIndex);
        this.nodes.push({ next: new Map(), fail: 0, outputs: [] });
      }
      state = this.nodes[state]!.next.get(char)!;
    }
    this.nodes[state]!.outputs.push(id);
  }

  private buildFailures(): void {
    const queue: number[] = [];
    for (const [, next] of this.nodes[0]!.next) {
      this.nodes[next]!.fail = 0;
      queue.push(next);
    }

    while (queue.length > 0) {
      const state = queue.shift()!;
      for (const [char, next] of this.nodes[state]!.next) {
        queue.push(next);
        let fail = this.nodes[state]!.fail;
        while (fail !== 0 && !this.nodes[fail]!.next.has(char)) {
          fail = this.nodes[fail]!.fail;
        }
        if (this.nodes[fail]!.next.has(char)) {
          fail = this.nodes[fail]!.next.get(char)!;
        }
        this.nodes[next]!.fail = fail;
        this.nodes[next]!.outputs.push(
          ...this.nodes[fail]!.outputs,
        );
      }
    }
  }
}
