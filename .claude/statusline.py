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

# --- Single transcript pass: duration + turn count + session signals ---
duration_str = '0h00m'
turn_count   = 0
_recent_text = []   # last 10 user message texts for signal detection

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
                        # Extract text content
                        content = obj.get('content', '')
                        if isinstance(content, list):
                            txt = ' '.join(p.get('text','') for p in content if isinstance(p,dict))
                        else:
                            txt = str(content)
                        _recent_text.append(txt.lower())
                        if len(_recent_text) > 10:
                            _recent_text.pop(0)
                except: continue
    except: pass
    if not started:
        try: started = os.path.getmtime(transcript)
        except: pass
    if started:
        e = int(time.time()) - int(started)
        duration_str = f'{e//3600}h{(e%3600)//60:02d}m'

# Keyword signals from recent messages
_recent = ' '.join(_recent_text)

EMOTION_TRIGGERS = {
    'frustrated': {
        'strong': {'wtf', 'hate', 'impossible', 'garbage', 'busted', 'argh', 'broken', 'cursed'},
        'weak':   {'issue', 'problem', 'wrong', 'stuck', 'bug', 'error', 'fail', 'again', 'still', 'ugh'},
    },
    'excited': {
        'strong': {'nailed', 'finally', 'yes!', 'yay', 'nailed it', 'works!', 'fan-tastic', 'excellent'},
        'weak':   {'great', 'nice', 'awesome', 'perfect', 'works', 'good', 'progress', 'clean'},
    },
    'happy': {
        'strong': {':-)', ':)', 'haha', 'lol', 'hehe', 'love it'},
        'weak':   {'thanks', 'good job', 'pleasant', 'smooth', 'easy'},
    },
    'sad': {
        'strong': {':-(', ":'(", 'sad', 'disappointed', 'sigh'},
        'weak':   {'unfortunate', 'bummer', 'oh well', 'not great', 'rough'},
    },
    'pr_work': {
        'strong': {'pull request', 'open pr', 'merge request', 'approved', 'lgtm'},
        'weak':   {' pr ', 'merge', 'branch', 'review', 'pushed', 'diff'},
    },
    'debugging': {
        'strong': {'reproduc', 'root cause', 'stack trace', 'breakpoint', 'stepping through'},
        'weak':   {'debug', 'why', 'confused', 'not sure', 'investigate', 'check', 'inspect', 'trace'},
    },
    'building': {
        'strong': {'dotnet build', 'npm run', 'cargo build', 'compil', 'linking'},
        'weak':   {'build', 'make', 'assembl', 'creat', 'implement', 'add'},
    },
    'testing': {
        'strong': {'test pass', 'test fail', 'assertion', 'coverage', 'green', 'red bar'},
        'weak':   {'test', 'spec', 'assert', 'check', 'verify', 'passing', 'failing'},
    },
    'refactor': {
        'strong': {'refactor', 'restructur', 'rewrite', 'reorgani', 'extract method'},
        'weak':   {'clean', 'tidy', 'simplif', 'rename', 'move', 'split'},
    },
}

def _score(emotion):
    """2 = strong hit, 1 = weak hit, 0 = none."""
    t = EMOTION_TRIGGERS[emotion]
    if any(k in _recent for k in t['strong']): return 2
    if any(k in _recent for k in t['weak']):   return 1
    return 0

_scores = {e: _score(e) for e in EMOTION_TRIGGERS}

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

# --- Flavor text: tiered by session context ---
TOOL_MSGS = {
    'Bash':      [
        "You fire a bolt of lightning.", "The wand crackles with energy.",
        "Thunder echoes through the corridor.", "Sparks fly from your fingertips.",
        "The air smells of ozone.", "A sharp crack splits the silence.",
    ],
    'Edit':      [
        "You inscribe runes on the wall.", "The scroll rewrites itself.",
        "Words shift and reform.", "You carve symbols into the stone.",
        "The ink moves of its own accord.", "A glyph flares and fades.",
    ],
    'Write':     [
        "You don new armor.", "The forge hisses with steam.",
        "Metal clangs in the distance.", "You etch your mark into the steel.",
        "The smith nods with approval.", "Your shield bears a fresh dent.",
    ],
    'Read':      [
        "You unroll an ancient scroll.", "Dusty pages whisper secrets.",
        "You squint at the inscription.", "The text shifts before your eyes.",
        "You mouth the words silently.", "The parchment is brittle with age.",
    ],
    'Grep':      [
        "Your amulet glows faintly.", "You sense something nearby.",
        "The runes pulse with recognition.", "A faint trail leads deeper in.",
        "You sniff the air carefully.", "Something leaves traces in the dust.",
    ],
    'Glob':      [
        "Your amulet glows faintly.", "You scan the shadows.",
        "Something catches your eye.", "Your lantern sweeps the room.",
        "You count the passages ahead.", "The map shivers in your hands.",
    ],
    'Agent':     [
        "A demon materializes beside you.", "You feel a presence enter the room.",
        "Something ancient stirs.", "The air grows cold and still.",
        "A voice speaks that has no mouth.", "The shadows coalesce.",
    ],
    'WebSearch': [
        "Your crystal ball swirls with images.", "Visions flash before you.",
        "You gaze into the scrying gem.", "The orb fills with distant light.",
        "Faces and places flicker past.", "The future is murky but present.",
    ],
    'WebFetch':  [
        "You reach through the ethereal plane.", "A distant voice answers.",
        "The crystal hums.", "Something crosses over from beyond.",
        "The veil between worlds thins.", "You grasp at smoke and find substance.",
    ],
    'TaskCreate':["You bind a spirit to your service.", "The ring tightens on your finger.", "A contract is sealed.",
        "A new name is written in the book.", "The binding glows white-hot.",
    ],
    'TaskUpdate':["The binding holds.", "You tighten the spirit's leash.", "Your ring pulses.",
        "The contract is amended.", "The spirit strains against its bonds.",
    ],
}
SIGNAL_MSGS = {
    'frustrated': [
        "You kick the machine in disgust.",
        "A hollow curse escapes your lips.",
        "The problem resists all reason.",
        "Nothing behaves as it ought to.",
        "Your tools seem to mock you.",
        "A wave of irritation washes over you.",
        "You glare at the stubborn apparatus.",
        "The whole contraption feels accursed.",
        "Progress slips through your fingers.",
        "You are seized by sudden annoyance.",
    ],
    'excited': [
        "You feel a surge of momentum.",
        "The pieces begin to fall into place.",
        "A promising idea sparks to life.",
        "You sense a breakthrough approaching.",
        "Your pulse quickens with possibility.",
        "The path ahead suddenly looks clear.",
        "A jolt of inspiration runs through you.",
        "Things are starting to click.",
        "You lean in with renewed energy.",
        "Fortune seems briefly on your side.",
    ],
    'pr_work': [
        "You prepare your work for judgment.",
        "The diff looks almost respectable.",
        "You brace for the scrutiny of others.",
        "A terse summary forms in your mind.",
        "The review queue awaits.",
        "You smooth the rough edges before submission.",
        "Your changes are laid bare.",
        "You offer the patch to the tribunal.",
    ],
    'debugging': [
        "You descend into the depths of the bug.",
        "A faint clue flickers in the darkness.",
        "The failure refuses to reproduce cleanly.",
        "You trace the fault through twisting paths.",
        "A hidden cause begins to reveal itself.",
        "The logs whisper of some deeper malice.",
        "You prod the system for signs of weakness.",
        "At last, the bug shows its face.",
    ],
    'building': [
        "You set to work.",
        "The structure begins to take shape.",
        "Fresh pieces lock into place.",
        "You assemble the thing with care.",
        "A new form emerges from effort.",
        "You lay another stone on the foundation.",
        "What was imagined starts becoming real.",
        "The work advances.",
    ],
    'testing': [
        "You put the thing to trial.",
        "The system is made to prove itself.",
        "You wait for the verdict.",
        "A careful check begins.",
        "The gauntlet is thrown down.",
        "Now comes the moment of truth.",
        "You probe for weakness.",
        "The results begin to trickle in.",
    ],
    'refactor': [
        "You rearrange the old machinery.",
        "Ancient tangles are carefully undone.",
        "The shape improves, though the function remains.",
        "You carve a cleaner path through the thicket.",
        "Old structures yield to better order.",
        "The code grows leaner under your hand.",
        "You disturb much, but change little.",
        "A clearer design emerges from the rubble.",
    ],
    'happy': [
        "You feel quietly pleased.",
        "A small satisfaction settles over you.",
        "For a moment, all seems well.",
        "You allow yourself a thin smile.",
        "The work rewards you.",
        "You feel unexpectedly light.",
    ],
    'sad': [
        "A heaviness settles over you.",
        "The victory, if any, feels distant.",
        "You are visited by a quiet gloom.",
        "The work seems lonelier than before.",
        "A faint sadness clings to you.",
        "Your spirits sink.",
    ],
}

AMBIENT = [
    "The torchlight flickers.",         "You hear a faint rumbling.",
    "The dungeon is strangely quiet.",   "Something smells awful.",
    "You feel a sudden chill.",          "You hear distant thunder.",
    "The walls glisten with moisture.",  "You feel watched.",
    "A cold wind blows through the passage.", "The ground trembles.",
    "You hear a door slam in the distance.", "You notice scratch marks on the floor.",
    "The air smells of old stone.",      "A bat flies overhead.",
    "You feel disoriented.",             "A distant howl echoes.",
    "The shadows seem to move.",         "You step on something soft.",
    "You hear the drip of water.",       "The silence is oppressive.",
    "A rat scurries past your feet.",    "You hear breathing that isn't yours.",
    "The corridor narrows ahead.",       "Bones crunch underfoot.",
    "Something drips from the ceiling.", "You smell smoke.",
    "A door creaks open somewhere.",     "The walls are warm to the touch.",
    "Your torch gutters in a breeze.",   "You hear coins jingling.",
    "A distant scream fades to silence.","The floor feels unstable.",
    "You taste iron in the air.",        "Your shadow moves a moment late.",
    "Something watches from the dark.",  "The torch casts strange shapes.",
]

# Read active tool name + context for flavor lookup
_active_tool = ''
if os.path.exists(tf):
    try: _active_tool = re.sub(r'[^a-zA-Z0-9]', '', open(tf).read()[:32])
    except: pass

_tool_ctx = ''
ctx_file = os.path.join(config_dir, '.current-tool-ctx')
if os.path.exists(ctx_file):
    try: _tool_ctx = open(ctx_file).read().strip()[:60]
    except: pass

# Session elapsed seconds (reuse started if available — computed above)
_elapsed_secs = 0
try:
    from datetime import datetime
    if transcript and os.path.exists(transcript):
        _elapsed_secs = int(time.time()) - int(os.path.getmtime(transcript))
except: pass

def _pick(pool): return pool[now_sec % len(pool)]

if used_int >= 95:
    dung_msg = "The walls close in around you!"
elif used_int >= 90:
    dung_msg = "You feel a sense of dread."
elif used_int >= 80:
    dung_msg = "Your pack feels very heavy."
elif used_int >= 70:
    dung_msg = "You sense danger ahead."
elif _active_tool in TOOL_MSGS:
    base = _pick(TOOL_MSGS[_active_tool])
    # Splice in tool context where we have it
    if _tool_ctx:
        short_ctx = _tool_ctx[:30].rstrip()
        if _active_tool in ('Edit', 'Write', 'Read', 'MultiEdit'):
            dung_msg = f'{base}  ({short_ctx})'
        elif _active_tool == 'Bash':
            dung_msg = f'{base}  -- {short_ctx}'
        elif _active_tool in ('Grep', 'Glob'):
            dung_msg = f'{base}  [{short_ctx}]'
        else:
            dung_msg = base
    else:
        dung_msg = base
elif cost > 0.10 and now_sec % 180 < 20:
    dung_msg = f"Your gold pouch grows lighter. ({cost_fmt} spent)"
elif _elapsed_secs > 3600 and now_sec % 240 < 25:
    dung_msg = "Your torch is burning dangerously low."
elif turn_count > 30 and now_sec % 300 < 20:
    dung_msg = f"Your legs ache from the long journey.  ({turn_count} turns)"
elif git_remote_short and now_sec % 600 < 15:
    repo = git_remote_short.split(':')[-1].split('/')[-1]
    dung_msg = f'You recognise these halls -- {repo}.'
else:
    EMOTION_PRIORITY = [
        'pr_work', 'debugging', 'testing', 'refactor', 'building',
        'frustrated', 'excited', 'happy', 'sad',
    ]
    # Strong score (2) = always active; weak score (1) = active 40s per 2min
    _signal_map = {
        e: (_scores[e] == 2 or (_scores[e] == 1 and now_sec % 120 < 40))
        for e in EMOTION_PRIORITY
    }
    # Cycle through active signals on 25s slots — priority order
    active = [e for e in EMOTION_PRIORITY if _signal_map.get(e)]
    _signal_msg = None
    if active:
        slot_size = 25
        cycle = len(active) * slot_size
        slot = now_sec % cycle
        idx = slot // slot_size
        _signal_msg = _pick(SIGNAL_MSGS[active[idx]])
    dung_msg = _signal_msg if _signal_msg else AMBIENT[(seed + now_sec // 60) % len(AMBIENT)]

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
