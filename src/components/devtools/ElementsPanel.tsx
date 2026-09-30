// Lapia DevTools — Elements tab: live DOM tree, element picker support,
// breadcrumbs, attributes + computed styles for the selected node.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SKIP_PANEL = "[data-lapia-devtools]";

let nextNodeId = 1;
const nodeIds = new WeakMap<Node, number>();
function nodeId(n: Node): number {
  let id = nodeIds.get(n);
  if (!id) {
    id = nextNodeId++;
    nodeIds.set(n, id);
  }
  return id;
}

function collapseText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function renderableChildren(el: Element): Node[] {
  const out: Node[] = [];
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      if (collapseText(n.textContent || "").length > 0) out.push(n);
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      if (!(n instanceof Element && n.closest(SKIP_PANEL))) out.push(n);
    }
  });
  return out;
}

function describe(el: Element): { tag: string; label: string; search: string } {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : "";
  const cls = el.classList.length
    ? `.${Array.from(el.classList).slice(0, 4).join(".")}`
    : "";
  const label = `${tag}${id}${cls}`;
  return { tag, label, search: `${tag} ${id} ${el.className}`.toLowerCase() };
}

const COMPUTED_KEYS = [
  "display", "position", "width", "height", "margin", "padding",
  "color", "background-color", "font-size", "font-family", "font-weight",
  "border-radius", "border", "box-shadow", "opacity", "overflow", "z-index",
  "transform", "pointer-events",
] as const;

interface Props {
  selected: Element | null;
  onSelect: (el: Element | null) => void;
  pickerOn: boolean;
  onTogglePicker: () => void;
}

export default function ElementsPanel({ selected, onSelect, pickerOn, onTogglePicker }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([nodeId(document.body)]));
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [filterSet, setFilterSet] = useState<Set<number> | null>(null);
  const rowRefs = useRef(new Map<number, HTMLElement>());

  // live refresh on DOM mutations (ignore our own panel)
  useEffect(() => {
    let timer = 0;
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        const t = m.target;
        if (t instanceof Element && t.closest(SKIP_PANEL)) return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTick((v) => v + 1), 400);
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });
    return () => {
      window.clearTimeout(timer);
      mo.disconnect();
    };
  }, []);

  // search filter: matching elements + all their ancestors
  useEffect(() => {
    if (query.trim().length < 2) {
      setFilterSet(null);
      return;
    }
    const q = query.trim().toLowerCase();
    const keep = new Set<number>();
    const walk = (el: Element): boolean => {
      let any = false;
      renderableChildren(el).forEach((c) => {
        if (c instanceof Element && walk(c)) any = true;
      });
      const self = describe(el).search.includes(q);
      if (self || any) {
        keep.add(nodeId(el));
        if (any) return true;
      }
      return self;
    };
    document.body.childNodes.forEach((n) => {
      if (n instanceof Element && !n.closest(SKIP_PANEL)) walk(n);
    });
    setFilterSet(keep);
  }, [query, tick]);

  // reveal selected node in the tree (from picker or breadcrumb)
  useEffect(() => {
    if (!selected) return;
    setExpanded((prev) => {
      const nx = new Set(prev);
      let p: Element | null = selected;
      while (p) {
        nx.add(nodeId(p));
        p = p.parentElement;
      }
      return nx;
    });
    const id = nodeId(selected);
    window.setTimeout(() => {
      rowRefs.current.get(id)?.scrollIntoView({ block: "nearest" });
    }, 60);
  }, [selected]);

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const nx = new Set(prev);
      if (nx.has(id)) nx.delete(id);
      else nx.add(id);
      return nx;
    });
  }, []);

  const breadcrumbs = useMemo(() => {
    const chain: Element[] = [];
    let p = selected;
    while (p) {
      chain.unshift(p);
      p = p.parentElement;
    }
    return chain;
  }, [selected, tick]);

  const styles = useMemo(() => {
    if (!selected) return [];
    const cs = getComputedStyle(selected);
    return COMPUTED_KEYS.map((k) => [k, cs.getPropertyValue(k)] as const).filter(
      ([, v]) => v && v !== "none" && v !== "normal",
    );
  }, [selected, tick]);

  const renderTextNode = (n: Node) => {
    const text = collapseText(n.textContent || "");
    if (!text) return null;
    return (
      <div className="ldev-row" key={nodeId(n)}>
        <span className="ldev-text-preview">
          "{text.length > 90 ? text.slice(0, 90) + "…" : text}"
        </span>
      </div>
    );
  };

  const renderNode = (n: Node, depth: number): React.ReactNode => {
    if (n.nodeType === Node.TEXT_NODE) return renderTextNode(n);
    if (!(n instanceof Element)) return null;

    const id = nodeId(n);
    if (filterSet && !filterSet.has(id)) return null;

    const kids = renderableChildren(n);
    const isOpen = filterSet ? true : expanded.has(id);
    const isSel = selected === n;
    const { tag, label } = describe(n);
    const soleText =
      kids.length === 1 && kids[0].nodeType === Node.TEXT_NODE
        ? collapseText(kids[0].textContent || "")
        : null;
    const classesAfterTag =
      n.classList.length
        ? "." + Array.from(n.classList).slice(0, 4).join(".")
        : "";

    return (
      <div key={id}>
        <div
          ref={(el) => {
            if (el) rowRefs.current.set(id, el);
            else rowRefs.current.delete(id);
          }}
          className={`ldev-row${isSel ? " ldev-row-selected" : ""}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => onSelect(n)}
        >
          <span
            className={`ldev-caret${kids.length ? "" : " ldev-caret-leaf"}${isOpen ? " ldev-caret-open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (kids.length) toggle(id);
            }}
          >
            ▸
          </span>
          <span className="ldev-tag">&lt;{tag}</span>
          {n.id ? <span className="ldev-attr-name"> #{n.id}</span> : null}
          {classesAfterTag ? <span className="ldev-attr-value"> {classesAfterTag}</span> : null}
          <span className="ldev-tag">&gt;</span>
          {soleText !== null ? (
            <span className="ldev-text-preview">
              {" "}
              {soleText.length > 70 ? soleText.slice(0, 70) + "…" : soleText}{" "}
            </span>
          ) : null}
          {!isOpen && kids.length && soleText === null ? (
            <>
              <span className="ldev-ellipsis">…</span>
              <span className="ldev-tag">&lt;/{tag}&gt;</span>
            </>
          ) : null}
        </div>
        {isOpen && kids.length ? (
          <div>
            {kids.map((c) => renderNode(c, depth + 1))}
            <div className="ldev-row" style={{ paddingLeft: 8 + depth * 14 }}>
              <span className="ldev-tag">&lt;/{tag}&gt;</span>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="ldev-elements">
      <div className="ldev-elements-toolbar">
        <button className={`ldev-chip${pickerOn ? " ldev-chip-active" : ""}`} onClick={onTogglePicker}>
          ⌖ {pickerOn ? "Picking…" : "Select element"}
        </button>
        <input
          className="ldev-search"
          placeholder="Filter by tag, .class or #id"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        {query ? (
          <button className="ldev-chip" onClick={() => setQuery("")}>Clear</button>
        ) : null}
      </div>

      <div className="ldev-elements-body">
        <div className="ldev-tree" key={`tree-${tick}`}>
          {renderNode(document.body, 0)}
        </div>

        <div className="ldev-inspect">
          {selected ? (
            <>
              <div className="ldev-pane-title">
                &lt;{selected.tagName.toLowerCase()}&gt;
                {selected.id ? <span className="ldev-attr-name">#{selected.id}</span> : null}
                <button
                  className="ldev-chip ldev-chip-right"
                  onClick={() => selected.scrollIntoView({ block: "center", behavior: "smooth" })}
                >
                  Scroll into view
                </button>
              </div>
              <div className="ldev-pane-section">
                <div className="ldev-pane-label">Box</div>
                <div className="ldev-kv">
                  <span>
                    {Math.round(selected.getBoundingClientRect().width)} ×{" "}
                    {Math.round(selected.getBoundingClientRect().height)} px
                  </span>
                  <span className="ldev-dim">
                    x {Math.round(selected.getBoundingClientRect().left)} · y{" "}
                    {Math.round(selected.getBoundingClientRect().top)}
                  </span>
                </div>
              </div>
              <div className="ldev-pane-section">
                <div className="ldev-pane-label">Attributes</div>
                {selected.attributes.length === 0 ? (
                  <div className="ldev-muted">No attributes</div>
                ) : (
                  Array.from(selected.attributes).map((a) => (
                    <div className="ldev-kv" key={a.name}>
                      <span className="ldev-attr-name">{a.name}</span>
                      <span className="ldev-attr-value">{a.value.slice(0, 120)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="ldev-pane-section">
                <div className="ldev-pane-label">Computed styles</div>
                {styles.map(([k, v]) => (
                  <div className="ldev-kv" key={k}>
                    <span className="ldev-attr-name">{k}</span>
                    <span className="ldev-attr-value">{v.slice(0, 110)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="ldev-muted ldev-pane-empty">
              Select a node in the tree, or use "Select element" to pick anything on the page.
            </div>
          )}
        </div>
      </div>

      <div className="ldev-breadcrumbs">
        {breadcrumbs.length ? (
          breadcrumbs.map((el, i) => (
            <span
              key={`${nodeId(el)}-${i}`}
              className={`ldev-crumb${i === breadcrumbs.length - 1 ? " ldev-crumb-active" : ""}`}
              onClick={() => onSelect(el)}
            >
              {el.tagName.toLowerCase()}
              {el.id ? `#${el.id}` : ""}
            </span>
          ))
        ) : (
          <span className="ldev-muted">—</span>
        )}
      </div>
    </div>
  );
}
