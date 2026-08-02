#!/usr/bin/env python3
"""Replay every file operation this session performed on the lost React app.

The project lived in /private/tmp and was wiped. Every Write, Edit and file-mutating
Bash call is recorded in the session transcripts, with timestamps, so the app can be
rebuilt deterministically by replaying them in order against a fresh clone.

  python3 .replay.py plan     -> write the ordered plan, change nothing
  python3 .replay.py run      -> execute it
"""
import json, glob, os, re, subprocess, sys

HOME = '/Users/damir12'
OLD = '/private/tmp/claude-501/-Users-damir12/f498a7c6-e138-4fd5-a75e-8a6755e470c2/scratchpad/pubsite'
NEW = f'{HOME}/solutions101'
PROJ = '/Users/damir12/.claude/projects/-Users-damir12'
MAIN = f'{PROJ}/f498a7c6-e138-4fd5-a75e-8a6755e470c2.jsonl'
SINCE = '2026-08-02T02:26:18Z'   # commit c0a2586, the state the clone is already at
SUBS = sorted(glob.glob(f'{PROJ}/f498a7c6-e138-4fd5-a75e-8a6755e470c2/subagents/agent-*.jsonl'))

# a Bash call is replayed only if it actually creates or rewrites project files
MUTATES = ('writeFileSync', 'npm install', 'npm i ', 'npm create', 'npx create',
           'mkdir -p', 'cat >', 'cp -R', 'cp ', 'mv ', 'tee ')
# never replay these, whatever else they contain
FORBID = ('rm -rf /', 'git push', 'git reset --hard', 'git clean', 'preview_stop', 'kill ')


def walk(o, out):
    if isinstance(o, dict):
        if o.get('type') == 'tool_use':
            out.append(o)
        for v in o.values():
            walk(v, out)
    elif isinstance(o, list):
        for v in o:
            walk(v, out)


def collect():
    ops = []
    seen = set()
    for path in [MAIN] + SUBS:
        for line in open(path, errors='ignore'):
            if OLD not in line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue
            ts = rec.get('timestamp', '')
            found = []
            walk(rec, found)
            for t in found:
                key = t.get('id')
                if key in seen:
                    continue
                seen.add(key)
                name = t.get('name')
                inp = t.get('input', {})
                if name == 'Write' and OLD in inp.get('file_path', ''):
                    ops.append((ts, 'Write', inp))
                elif name == 'Edit' and OLD in inp.get('file_path', ''):
                    ops.append((ts, 'Edit', inp))
                elif name == 'Bash':
                    cmd = inp.get('command', '')
                    if OLD in cmd and any(m in cmd for m in MUTATES) \
                       and not any(f in cmd for f in FORBID):
                        ops.append((ts, 'Bash', inp))
    ops.sort(key=lambda x: x[0])
    # The clone already contains everything up to commit c0a2586 (02:26:18Z). Replaying
    # earlier operations would apply them twice; start from just after that commit.
    return [o for o in ops if o[0] > SINCE]


def rewrite(s):
    return s.replace(OLD, NEW)


def run(ops, execute):
    log = []
    ok = fail = 0
    for i, (ts, kind, inp) in enumerate(ops):
        if kind == 'Write':
            p = rewrite(inp['file_path'])
            body = rewrite(inp.get('content', ''))
            log.append(f'{i:4d} {ts} WRITE {p[len(NEW)+1:]}  ({len(body)}b)')
            if execute:
                os.makedirs(os.path.dirname(p), exist_ok=True)
                open(p, 'w').write(body)
                ok += 1
        elif kind == 'Edit':
            p = rewrite(inp['file_path'])
            old = rewrite(inp.get('old_string', ''))
            new = rewrite(inp.get('new_string', ''))
            log.append(f'{i:4d} {ts} EDIT  {p[len(NEW)+1:]}')
            if execute:
                if not os.path.exists(p):
                    log.append('       !! missing file, skipped')
                    fail += 1
                    continue
                s = open(p).read()
                if old not in s:
                    log.append('       !! old_string not found, skipped')
                    fail += 1
                    continue
                s = s.replace(old, new) if inp.get('replace_all') else s.replace(old, new, 1)
                open(p, 'w').write(s)
                ok += 1
        else:
            cmd = rewrite(inp['command'])
            log.append(f'{i:4d} {ts} BASH  {cmd.splitlines()[0][:100]}')
            if execute:
                r = subprocess.run(['/bin/zsh', '-lc', cmd], capture_output=True,
                                   text=True, cwd=NEW, timeout=900)
                if r.returncode != 0:
                    log.append(f'       !! exit {r.returncode}: {r.stderr.strip()[:180]}')
                    fail += 1
                else:
                    ok += 1
    open(f'{NEW}/.replay.log', 'w').write('\n'.join(log))
    return ok, fail, len(ops)


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'plan'
    ops = collect()
    if mode == 'full':
        # everything that shapes files, minus the one-off scaffolding and installs which have
        # already run once. The converter script that generated the section components is
        # re-inserted at its original moment so later hand edits land on top of it, not under it.
        # Skip ONLY the one-off scaffolding and installs. The earlier filter dropped anything
        # containing 'npx', which silently threw away every site.css patch script that ended
        # with '&& npx vite build' - that is why ten hero values were missing after the first
        # recovery. Match on the scaffold/install verbs themselves, not on the build tail.
        SKIP = ('npm create', 'create vite', 'npm install', 'npm i ', 'git checkout', 'cp -R ')
        ops = [o for o in ops if not (o[1] == 'Bash' and any(k in o[2].get('command','') for k in SKIP))]
        ops.append(('2026-08-02T02:46:54.500Z', 'Bash',
                    {'command': 'node /Users/damir12/solutions101/.recovery/convert.mjs'}))
        ops.sort(key=lambda x: x[0])
    if mode == 'files':
        # second pass: the converter script regenerated the section files from scratch, so the
        # hand edits that landed on top of them have to be replayed again. Writes and Edits only
        # - the scaffolding and npm installs already happened and must not run twice.
        ops = [o for o in ops if o[1] != 'Bash']
    ok, fail, n = run(ops, mode in ('run','files','full'))
    kinds = {}
    for _, k, _ in ops:
        kinds[k] = kinds.get(k, 0) + 1
    print(f'ops={n} {kinds}')
    if mode == 'run':
        print(f'applied={ok} failed={fail}')
    print(f'log -> {NEW}/.replay.log')
