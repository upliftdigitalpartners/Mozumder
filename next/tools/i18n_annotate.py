#!/usr/bin/env python3
"""Mark every translatable text block on the /next/ pages for the Bangla toggle.

Run from next/:  python3 tools/i18n_annotate.py [--write]

A "text block" is the outermost element whose contents are only text and
inline markup (links, bold, line breaks...). Each gets
data-i18n-auto="<key>", where the key is a short hash of its English HTML,
so the same sentence shares one translation across pages (nav, footer...).

js/i18n-bn.js maps those keys to Bangla HTML; enhance-v2.js swaps them in
and restores the original English when switching back. Without --write the
script only reports; with it, pages are updated and tools/i18n-en.json is
regenerated (every key with its English HTML) as the reference to translate
from. Keys whose English changes get a new hash, so stale translations are
simply not applied: rerun, then translate the keys reported as missing.
"""
import hashlib, html, json, pathlib, re, sys
from html.parser import HTMLParser

PAGES = ["index.html", "about.html", "services.html", "fleet.html",
         "sister-concerns.html", "partners.html", "contact.html"]
INLINE = {"a", "strong", "b", "em", "i", "span", "br", "small", "abbr", "time", "sup", "sub", "u", "mark"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SKIP = {"script", "style", "svg", "noscript", "template", "head", "select", "textarea", "video", "canvas", "picture"}
BLOCKISH = {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "a", "button", "label", "option", "span", "div",
            "address", "dt", "dd", "td", "th", "figcaption", "blockquote", "b", "strong", "em", "small"}


class Node:
    def __init__(self, tag, attrs, start, start_end, parent):
        self.tag, self.attrs, self.start, self.start_end, self.parent = tag, dict(attrs), start, start_end, parent
        self.children, self.end = [], None
        self.text = ""          # direct text


class P(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer("\n", src):
            self.lines.append(m.end())
        self.root = Node("#root", [], 0, 0, None)
        self.stack = [self.root]

    def off(self):
        l, c = self.getpos()
        return self.lines[l - 1] + c

    def handle_starttag(self, tag, attrs):
        s = self.off()
        e = s + len(self.get_starttag_text())
        n = Node(tag, attrs, s, e, self.stack[-1])
        self.stack[-1].children.append(n)
        if tag not in VOID:
            self.stack.append(n)
        else:
            n.end = e

    def handle_startendtag(self, tag, attrs):
        s = self.off()
        e = s + len(self.get_starttag_text())
        n = Node(tag, attrs, s, e, self.stack[-1])
        n.end = e
        self.stack[-1].children.append(n)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                for n in self.stack[i:]:
                    n.end_tag = self.off()
                    n.end = self.off() + len(f"</{tag}>")
                del self.stack[i:]
                return

    def handle_data(self, d):
        self.stack[-1].text += d

    def handle_entityref(self, name):
        self.stack[-1].text += f"&{name};"

    def handle_charref(self, name):
        self.stack[-1].text += f"&#{name};"


def inline_only(n):
    for c in n.children:
        if c.tag in SKIP or c.tag not in INLINE:
            return False
        if "data-count" in c.attrs or "data-i18n" in c.attrs:
            return False
        if not inline_only(c):
            return False
    return True


def visible_text(n):
    return html.unescape(n.text + "".join(visible_text(c) for c in n.children if c.tag not in SKIP))


def inner(src, n):
    return src[n.start_end:getattr(n, "end_tag", n.end)]


def wants(n):
    t = re.sub(r"\s+", " ", visible_text(n)).strip()
    if not re.search(r"[A-Za-z]{2,}", t):
        return False                       # numbers, symbols, empty
    if t in {"Mozumder", "EN"} or re.fullmatch(r"[\w.+-]+@[\w.-]+", t) or re.fullmatch(r"\+?[\d\s()-]+", t):
        return False
    return True


def walk(n, out):
    for c in n.children:
        if c.tag in SKIP:
            continue
        if "data-i18n" in c.attrs or "data-i18n-auto" in c.attrs:
            if "data-i18n-auto" in c.attrs:
                out.append(c)
            continue
        cls = c.attrs.get("class") or ""
        if "brand" in cls.split() or "marquee" in cls.split():
            continue
        if c.tag in BLOCKISH and c.children is not None and inline_only(c) and wants(c):
            out.append(c)
            continue
        walk(c, out)


def key_for(eng):
    norm = re.sub(r"\s+", " ", eng).strip()
    return hashlib.sha1(norm.encode()).hexdigest()[:10], norm


def main():
    write = "--write" in sys.argv
    strings = {}
    for page in PAGES:
        p = pathlib.Path(page)
        src = p.read_text()
        parser = P(src)
        parser.feed(src)
        found = []
        walk(parser.root, found)
        edits = []
        for n in found:
            k, eng = key_for(inner(src, n))
            strings[k] = eng
            if "data-i18n-auto" not in n.attrs:
                tag_text = src[n.start:n.start_end]
                close = tag_text.rstrip()[-2:] == "/>" and 2 or 1
                pos = n.start + len(tag_text.rstrip()) - close
                edits.append((pos, f' data-i18n-auto="{k}"'))
            elif n.attrs["data-i18n-auto"] != k:
                # English changed since the last run: refresh the key.
                old = f'data-i18n-auto="{n.attrs["data-i18n-auto"]}"'
                i = src.index(old, n.start)
                edits.append((i, None, len(old), f'data-i18n-auto="{k}"'))
        for e in sorted(edits, key=lambda e: e[0], reverse=True):
            if len(e) == 2:
                src = src[:e[0]] + e[1] + src[e[0]:]
            else:
                src = src[:e[0]] + e[3] + src[e[0] + e[2]:]
        print(f"{page}: {len(found)} blocks, {len(edits)} changed")
        if write:
            p.write_text(src)
    print(f"unique strings: {len(strings)}")
    if write:
        pathlib.Path("tools/i18n-en.json").write_text(json.dumps(strings, ensure_ascii=False, indent=1))
    bn = pathlib.Path("js/i18n-bn.js")
    if bn.exists():
        have = set(re.findall(r'"([0-9a-f]{10})"\s*:', bn.read_text()))
        missing = [k for k in strings if k not in have]
        print(f"missing Bangla: {len(missing)}")


if __name__ == "__main__":
    main()
