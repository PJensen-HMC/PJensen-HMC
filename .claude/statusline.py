#!/usr/bin/env python3
"""NetHack-style Claude Code status line."""
import sys, json, os, re, random, time, subprocess, math

data = json.loads(sys.stdin.read())
config_dir = os.environ.get('CLAUDE_CONFIG_DIR', os.path.expanduser('~/.claude'))

# --- Session seed ---
transcript = data.get('transcript_path', '')
if transcript:
    import hashlib
    seed = int(hashlib.md5(transcript.encode()).hexdigest(), 16) % (2**31)
else:
    seed = 0

# --- Model ---
model_obj = data.get('model', {})
model = (model_obj.get('display_name', 'unknown') if isinstance(model_obj, dict) else 'unknown')

# --- Tokens / cost ---
ctx = data.get('context_window', {}) or {}
total_in  = int(ctx.get('total_input_tokens',  0) or 0)
total_out = int(ctx.get('total_output_tokens', 0) or 0)
used_pct  = float(ctx.get('used_percentage',   0) or 0)
used_int  = round(used_pct)

def fmt_tok(n): return f'{n/1000:.1f}k' if n >= 1000 else str(n)
in_fmt, out_fmt = fmt_tok(total_in), fmt_tok(total_out)
cost = (total_in * 3 + total_out * 15) / 1_000_000
cost_fmt = f'${cost:.4f}' if cost > 0 else '$0.0000'

# --- CWD ---
cwd = data.get('cwd', '') or os.getcwd()
parts = cwd.rstrip('/').split('/')
cwd_short = cwd if len(parts) <= 3 else f'.../{parts[-2]}/{parts[-1]}'

# --- Git remote ---
git_remote_short = ''
try:
    last_git = open(os.path.join(config_dir, '.last-git-dir')).read().strip()
except: last_git = cwd
try:
    raw = subprocess.check_output(
        ['git', '-C', last_git, 'remote', 'get-url', 'origin'],
        stderr=subprocess.DEVNULL, text=True).strip()
    clean = re.sub(r'https://[^@]*@', 'https://', raw)
    if 'github.com' in clean:
        git_remote_short = 'gh:' + re.sub(r'.*github\.com[:/]', '', clean).removesuffix('.git')
    elif 'dev.azure.com' in clean:
        git_remote_short = 'ado:' + re.sub(r'.*/_git/', '', clean).removesuffix('.git')
    else:
        git_remote_short = re.sub(r'.*/', '', clean).removesuffix('.git')
except: pass

# --- Single transcript pass: duration + turn count ---
duration_str = '0h00m'
turn_count   = 0
if transcript and os.path.exists(transcript):
    from datetime import datetime
    started = None
    try:
        with open(transcript) as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    if started is None:
                        ts = obj.get('timestamp')
                        if ts:
                            started = datetime.fromisoformat(ts.replace('Z','+00:00')).timestamp()
                    if obj.get('role') == 'user':
                        turn_count += 1
                except: continue
    except: pass
    if not started:
        try: started = os.path.getmtime(transcript)
        except: pass
    if started:
        e = int(time.time()) - int(started)
        duration_str = f'{e//3600}h{(e%3600)//60:02d}m'

# --- Flags ---
now_sec    = int(time.time())
is_thinking = os.path.exists(os.path.join(config_dir, '.thinking'))

caveman_text = ''
cf = os.path.join(config_dir, '.caveman-active')
if os.path.exists(cf):
    try: mode = open(cf).read().strip()
    except: mode = ''
    caveman_text = '[CAVEMAN]' if not mode or mode == 'full' else f'[CAVEMAN:{mode.upper()}]'

# --- Spinner / tool indicator ---
SPINNER = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
spinner  = SPINNER[now_sec % len(SPINNER)]
TOOL_SYM = {
    'Bash':'!', 'Edit':'/', 'Write':'[', 'Read':'?',
    'Grep':'"', 'Glob':'"', 'Agent':'&',
    'WebSearch':'*', 'WebFetch':'*',
    'TaskCreate':'=', 'TaskUpdate':'=', 'TaskGet':'=',
}
active_indicator = spinner
tf = os.path.join(config_dir, '.current-tool')
if os.path.exists(tf):
    try:
        tn = re.sub(r'[^a-zA-Z0-9]', '', open(tf).read()[:32])
        sym = TOOL_SYM.get(tn, '(')
        active_indicator = f'\033[1;33m{sym}\033[0m' if now_sec % 2 else spinner
    except: pass

# --- Context-aware dungeon message ---
MESSAGES = [
    "The torchlight flickers.",      "You hear a faint rumbling.",
    "The dungeon is strangely quiet.","Something smells awful.",
    "You feel a sudden chill.",       "You hear distant thunder.",
    "The walls glisten with moisture.","You feel watched.",
    "A cold wind blows through the passage.", "The ground trembles.",
    "You hear a door slam in the distance.",  "You notice scratch marks on the floor.",
    "The air smells of old stone.",   "A bat flies overhead.",
    "You feel disoriented.",          "A distant howl echoes.",
    "The shadows seem to move.",      "You step on something soft.",
    "You hear the drip of water.",    "The silence is oppressive.",
]
if   used_int >= 95: dung_msg = "The walls close in around you!"
elif used_int >= 90: dung_msg = "You feel a sense of dread."
elif used_int >= 80: dung_msg = "Your pack feels very heavy."
elif used_int >= 70: dung_msg = "You sense danger ahead."
else:                dung_msg = MESSAGES[(seed + now_sec // 60) % len(MESSAGES)]

# --- Terminal width ---
cols = 120
try:
    v = int(open(os.path.join(config_dir, '.term-cols')).read().strip())
    if v > 20: cols = v
except:
    try:
        import shutil
        v = shutil.get_terminal_size().columns
        if v > 20: cols = v
    except: pass

# =============================================================================
# DUNGEON CORRIDOR
# =============================================================================
RST='\033[0m'; DIM='\033[2m'; BLD='\033[1;37m'; RED='\033[0;31m'
YEL='\033[0;33m'; CYN='\033[0;36m'; GRN='\033[0;32m'; MAG='\033[0;35m'
BRT='\033[1;33m'; WHT='\033[0;37m'; LBL='\033[1;34m'; ORG='\033[38;5;172m'

W    = max(cols - 8, 20)
rng  = random.Random(seed)
d1   = int(W * 0.35)
d2   = int(W * 0.68)

# Stable floor items (seeded per session)
ITEM_THRESHOLDS = [(')', .012), ('%', .022), ('!', .030), ('?', .036), ('^', .042), ('$', .048)]
floor = []
for i in range(W):
    if i in (d1, d2):
        floor.append('+'); continue
    r = rng.random()
    floor.append(next((sym for sym, t in ITEM_THRESHOLDS if r < t), '·'))

# Stairs near right wall at high context
if used_int >= 85 and W - 3 >= 0:
    floor[W - 3] = '>'

# Player position (ctx% → x, ±1 drift per second for animation)
ppos = max(0, min(W - 1, int(used_int * (W - 1) / 100) + now_sec % 3 - 1))

# Pickup: clear all items player has already passed
for i in range(ppos):
    if floor[i] not in ('+', '/', '>'):
        floor[i] = '·'

# Cat: wanders independently using two overlapping sine waves (unique freq per session)
# Moves on same 1s tick as spinner. Stays off player and stairs.
f1 = 0.05 + (seed % 11) * 0.004   # ~0.05–0.09 Hz
f2 = 0.03 + (seed %  7) * 0.003   # ~0.03–0.05 Hz
cpos = int(W / 2 + (W / 3) * math.sin(now_sec * f1) * math.cos(now_sec * f2))
cpos = max(1, min(W - 2, cpos))
if cpos == ppos: cpos = max(1, ppos - 2)
if floor[cpos] not in ('@', '>'):
    floor[cpos] = 'f'

# Clear adjacent tiles around player
for i in range(ppos - 1, ppos + 2):
    if 0 <= i < W and i != ppos and floor[i] not in ('f', '>'):
        floor[i] = '·'
floor[ppos] = '@'

# Open doors player has passed
if ppos > d1 and floor[d1] not in ('@', 'f'): floor[d1] = '/'
if ppos > d2 and floor[d2] not in ('@', 'f'): floor[d2] = '/'

# Demon + wand bolt when thinking
if is_thinking:
    mpos = ppos + 3 if ppos + 3 < W else max(0, ppos - 3)
    if floor[mpos] != '@':
        floor[mpos] = 'd'
        if now_sec % 4 == 0:
            lo, hi = (ppos+1, mpos-1) if ppos < mpos else (mpos+1, ppos-1)
            for i in range(lo, hi+1):
                if floor[i] not in ('@','d','f','>'):
                    floor[i] = '-'

COLOR_MAP = {
    '@':BLD, 'd':RED, '-':BRT, 'f':WHT, '>':LBL,
    '/':YEL, '+':YEL, '^':RED, '$':YEL,
    '·':DIM, ')':YEL, '%':GRN, '!':MAG, '?':CYN,
}
corridor = f'{DIM}#{RST}{YEL}/{RST}'
for ch in floor:
    col = COLOR_MAP.get(ch, '')
    corridor += f'{col}{ch}{RST}' if col else ch
corridor += f'{DIM}#{RST}'

# =============================================================================
# NETHACK STATS LINE
# =============================================================================
dlvl = turn_count
ac   = 2 if 'opus' in model.lower() else 7 if 'haiku' in model.lower() else 4
model_short = re.sub(r'[Cc]laude[- ]', '', model)[:16]
hp_col = RED if used_int >= 90 else YEL if used_int >= 70 else GRN

stats  = f'{DIM}Dlvl:{dlvl}{RST}'
stats += f'  {YEL}{cost_fmt}{RST}'
stats += f'  {hp_col}HP:{used_int}(100){RST}'
stats += f'  {CYN}Pw:{in_fmt}({out_fmt}){RST}'
stats += f'  {DIM}AC:{ac}{RST}'
stats += f'  T:{duration_str}'
stats += f'  {active_indicator} {DIM}{model_short}{RST}'
stats += f'  {DIM}{cwd_short}{RST}'
if git_remote_short: stats += f'  {CYN}{git_remote_short}{RST}'
if caveman_text:     stats += f'  {ORG}{caveman_text}{RST}'

# --- Output ---
sys.stdout.write(f'{DIM}{dung_msg}{RST}\n{corridor}\n{stats}\n')
