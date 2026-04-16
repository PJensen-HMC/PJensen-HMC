#!/usr/bin/env bash
input="$(cat)"

# --- Session seed ---
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty')
if [ -n "$transcript" ]; then
  hash=$(printf '%s' "$transcript" | cksum | cut -d' ' -f1)
else
  hash=0
fi

# --- Model ---
model=$(printf '%s' "$input" | jq -r '.model.display_name // "unknown"')

# --- Tokens ---
total_in=$(printf '%s' "$input" | jq -r '.context_window.total_input_tokens // 0')
total_out=$(printf '%s' "$input" | jq -r '.context_window.total_output_tokens // 0')

fmt_tokens() {
  local n=$1
  if [ "$n" -ge 1000 ] 2>/dev/null; then
    printf '%.1fk' "$(echo "scale=1; $n / 1000" | bc)"
  else
    printf '%s' "$n"
  fi
}
in_fmt=$(fmt_tokens "$total_in")
out_fmt=$(fmt_tokens "$total_out")

# --- Cost (claude-sonnet-4-6: $3/1M input, $15/1M output) ---
cost=$(echo "scale=4; ($total_in * 3 + $total_out * 15) / 1000000" | bc 2>/dev/null)
if [ -n "$cost" ] && [ "$cost" != "0" ] && [ "$cost" != ".0000" ]; then
  cost_fmt=$(printf '$%.4f' "$cost")
else
  cost_fmt='$0.0000'
fi

# --- Context % ---
used_raw=$(printf '%s' "$input" | jq -r '.context_window.used_percentage // empty')
if [ -n "$used_raw" ]; then
  used_int=$(printf '%.0f' "$used_raw")
else
  used_int=0
fi

# --- CWD (last 2 path components) ---
cwd=$(printf '%s' "$input" | jq -r '.cwd // empty')
[ -z "$cwd" ] && cwd="$(pwd)"
cwd_short=$(echo "$cwd" | awk -F/ '{
  n = split($0, parts, "/")
  if (n <= 3) print $0
  else print ".../" parts[n-1] "/" parts[n]
}')

# --- Git remote (short, sanitized) ---
# Prefer last active git repo (written by PostToolUse Bash hook); fall back to session cwd
last_git_dir=$(cat /home/devadmin/.claude/.last-git-dir 2>/dev/null)
git_lookup_dir="${last_git_dir:-$cwd}"
git_remote_raw=$(git -C "$git_lookup_dir" remote get-url origin 2>/dev/null)
git_remote_short=""
if [ -n "$git_remote_raw" ]; then
  # strip embedded PAT/credentials
  clean=$(echo "$git_remote_raw" | sed 's|https://[^@]*@|https://|')
  if echo "$clean" | grep -q "github.com"; then
    slug=$(echo "$clean" | sed 's|.*github\.com[:/]||' | sed 's|\.git$||')
    git_remote_short="gh:${slug}"
  elif echo "$clean" | grep -q "dev.azure.com"; then
    repo=$(echo "$clean" | sed 's|.*/_git/||' | sed 's|\.git$||')
    git_remote_short="ado:${repo}"
  else
    git_remote_short=$(echo "$clean" | sed 's|.*/||' | sed 's|\.git$||')
  fi
fi

# --- Session duration ---
duration_str="0h00m"
started_epoch=""
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  # First entry with a timestamp field (ISO 8601)
  ts=$(jq -r 'select(.timestamp != null) | .timestamp' "$transcript" 2>/dev/null | head -1)
  if [ -n "$ts" ]; then
    started_epoch=$(date -d "$ts" +%s 2>/dev/null)
  fi
  # Fall back to transcript file mtime
  if [ -z "$started_epoch" ]; then
    started_epoch=$(stat -c %Y "$transcript" 2>/dev/null)
  fi
fi
if [ -n "$started_epoch" ]; then
  now_epoch=$(date +%s)
  elapsed=$(( now_epoch - started_epoch ))
  hrs=$(( elapsed / 3600 ))
  mins=$(( (elapsed % 3600) / 60 ))
  duration_str=$(printf '%dh%02dm' "$hrs" "$mins")
fi

# --- Flags ---
config_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
thinking_flag="$config_dir/.thinking"
caveman_flag="$config_dir/.caveman-active"
is_thinking=0
[ -f "$thinking_flag" ] && is_thinking=1

# --- Caveman badge ---
caveman_text=""
if [ -f "$caveman_flag" ]; then
  caveman_mode=$(cat "$caveman_flag" 2>/dev/null)
  if [ "$caveman_mode" = "full" ] || [ -z "$caveman_mode" ]; then
    caveman_text="[CAVEMAN]"
  else
    caveman_suffix=$(echo "$caveman_mode" | tr '[:lower:]' '[:upper:]')
    caveman_text="[CAVEMAN:${caveman_suffix}]"
  fi
fi

# --- Spinner (braille, advances each second) ---
SPINNER=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
spin_idx=$(( $(date +%s) % ${#SPINNER[@]} ))
spinner="${SPINNER[$spin_idx]}"

# --- Tool indicator: replaces spinner when a tool is active ---
# PreToolUse hook writes tool name to .current-tool; Stop clears it.
# Symbol shown instead of braille spinner — shows what Claude is wielding.
tool_flag="$config_dir/.current-tool"
active_indicator="$spinner"
if [ -f "$tool_flag" ]; then
  current_tool=$(head -c 32 "$tool_flag" 2>/dev/null | tr -cd '[:alnum:]')
  case "$current_tool" in
    Bash)                          tool_sym='!' ;;  # wand (zap)
    Edit)                          tool_sym='/' ;;  # weapon (slash)
    Write)                         tool_sym='[' ;;  # armor (donning)
    Read)                          tool_sym='?' ;;  # scroll (reading)
    Grep|Glob)                     tool_sym='"' ;;  # amulet (sight)
    Agent)                         tool_sym='&' ;;  # demon (summoned)
    WebSearch|WebFetch)            tool_sym='*' ;;  # gem (scrying)
    TaskCreate|TaskUpdate|TaskGet) tool_sym='=' ;;  # ring (binding)
    *)                             tool_sym='(' ;;  # misc tool
  esac
  active_indicator='\033[1;33m'"${tool_sym}"'\033[0m'
fi

# --- Stairs flag (ctx >= 85% = time to descend) ---
stairs_flag=0
[ "$used_int" -ge 85 ] && stairs_flag=1

# --- Random dungeon message (context-aware at high %, time-varying otherwise) ---
now_min=$(( $(date +%s) / 60 ))

MESSAGES=(
  "The torchlight flickers."
  "You hear a faint rumbling."
  "The dungeon is strangely quiet."
  "Something smells awful."
  "You feel a sudden chill."
  "You hear distant thunder."
  "The walls glisten with moisture."
  "You feel watched."
  "A cold wind blows through the passage."
  "The ground trembles."
  "You hear a door slam in the distance."
  "You notice scratch marks on the floor."
  "The air smells of old stone."
  "A bat flies overhead."
  "You feel disoriented."
  "A distant howl echoes."
  "The shadows seem to move."
  "You step on something soft."
  "You hear the drip of water."
  "The silence is oppressive."
)

if [ "$used_int" -ge 95 ]; then
  dung_msg="The walls close in around you!"
elif [ "$used_int" -ge 90 ]; then
  dung_msg="You feel a sense of dread."
elif [ "$used_int" -ge 80 ]; then
  dung_msg="Your pack feels very heavy."
elif [ "$used_int" -ge 70 ]; then
  dung_msg="You sense danger ahead."
else
  msg_idx=$(( (hash + now_min) % ${#MESSAGES[@]} ))
  dung_msg="${MESSAGES[$msg_idx]}"
fi

now_sec=$(date +%s)
cols=$(cat "$config_dir/.term-cols" 2>/dev/null | tr -cd '0-9')
[ -z "$cols" ] && cols=$(tput cols 2>/dev/null)
[ -z "$cols" ] && cols=120

# =============================================================================
# DUNGEON CORRIDOR (NetHack-style) — primary display
# dim msg1 / dim msg2
# #/ . f @ - - - d . ) ^ % ! .              > +#
# Dlvl stats
#   @  = player — ctx% sets base position; second-tick drift adds ±1 animation
#   f  = cat pet (one step behind @, always)
#   d  = demon, visible when thinking; @---d wand zap bolt (bright yellow)
#   >  = stairs down, near right wall when ctx >= 85%
#   +  = door (closed); / = door (open, player passed through)
#   )%!?^$  = items/traps scattered by session seed (stable per session)
# =============================================================================
dungeon_colored=$(awk \
  -v seed="$hash" \
  -v ctx="$used_int" \
  -v thinking="$is_thinking" \
  -v stairs="$stairs_flag" \
  -v now="$now_sec" \
  -v cols="$cols" \
'BEGIN {
  srand(seed)
  W = (cols > 20) ? cols - 8 : 72  # floor width, adapts to terminal; #/ floor #

  # Door positions (structural — stable per session)
  d1 = int(W * 0.35)
  d2 = int(W * 0.68)

  # Generate stable floor items seeded by session hash
  for (i = 0; i < W; i++) {
    if (i == d1 || i == d2) { f[i] = "+"; continue }
    r = rand()
    if      (r < 0.020) f[i] = ")"
    else if (r < 0.038) f[i] = "%"
    else if (r < 0.052) f[i] = "!"
    else if (r < 0.062) f[i] = "?"
    else if (r < 0.072) f[i] = "^"
    else if (r < 0.082) f[i] = "$"
    else if (r < 0.140) f[i] = "."
    else                f[i] = " "
  }

  # Stairs: near right wall when context running out
  if (stairs) f[W - 3] = ">"

  # Player base position from context; drift ±1 each second for animation
  pbase = int(ctx * (W - 1) / 100)
  drift = int(now) % 3 - 1          # cycles -1, 0, +1 every second
  ppos  = pbase + drift
  if (ppos < 0)     ppos = 0
  if (ppos >= W)    ppos = W - 1

  # Cat: one step behind @; yields to stairs
  cpos = ppos - 1
  if (cpos < 0) cpos = ppos + 1
  if (f[cpos] != ">") f[cpos] = "f"

  # Clear floor around player (not cat, not stairs)
  for (i = ppos - 1; i <= ppos + 1; i++) {
    if (i >= 0 && i < W && i != ppos && f[i] != "f" && f[i] != ">") f[i] = "."
  }
  f[ppos] = "@"

  # Open doors player has passed
  if (ppos > d1 && f[d1] != "@" && f[d1] != "f") f[d1] = "/"
  if (ppos > d2 && f[d2] != "@" && f[d2] != "f") f[d2] = "/"

  # Thinking: demon + wand zap bolt (bolt flashes 1s out of 4, then gone)
  if (thinking) {
    mpos = ppos + 3
    if (mpos >= W) mpos = ppos - 3
    if (mpos < 0)  mpos = 0
    if (f[mpos] != "@") {
      f[mpos] = "d"
      if (now % 4 == 0) {
        lo = (ppos < mpos) ? ppos + 1 : mpos + 1
        hi = (ppos < mpos) ? mpos - 1 : ppos - 1
        for (i = lo; i <= hi; i++) {
          if (f[i] != "@" && f[i] != "d" && f[i] != "f" && f[i] != ">") f[i] = "-"
        }
      }
    }
  }

  # ANSI codes
  RST = "\033[0m"
  DIM = "\033[2m"
  BLD = "\033[1;37m"
  RED = "\033[0;31m"
  YEL = "\033[0;33m"
  CYN = "\033[0;36m"
  GRN = "\033[0;32m"
  MAG = "\033[0;35m"
  BRT = "\033[1;33m"   # wand bolt — bright yellow
  WHT = "\033[0;37m"   # cat
  LBL = "\033[1;34m"   # stairs

  # Corridor: #/ floor #
  printf DIM "#" RST YEL "/" RST
  for (i = 0; i < W; i++) {
    c = f[i]
    if      (c == "@") printf BLD "@" RST
    else if (c == "d") printf RED "d" RST
    else if (c == "-") printf BRT "-" RST
    else if (c == "f") printf WHT "f" RST
    else if (c == ">") printf LBL ">" RST
    else if (c == "/") printf YEL "/" RST
    else if (c == "+") printf YEL "+" RST
    else if (c == "^") printf RED "^" RST
    else if (c == "$") printf YEL "$" RST
    else if (c == ".") printf DIM "." RST
    else if (c == ")") printf YEL ")" RST
    else if (c == "%") printf GRN "%" RST
    else if (c == "!") printf MAG "!" RST
    else if (c == "?") printf CYN "?" RST
    else               printf " "
  }
  printf DIM "#\n" RST
}')

# =============================================================================
# NETHACK STATS LINE
# Dlvl:N  $:cost  HP:ctx(100)  Pw:in(out)  AC:N  T:dur  spinner model  cwd  badge
# =============================================================================
reset='\033[0m'
dim='\033[2m'
yellow='\033[0;33m'
cyan='\033[0;36m'
green='\033[0;32m'
orange='\033[38;5;172m'

# HP color by context saturation
if [ "$used_int" -ge 90 ]; then
  hp_col='\033[0;31m'
elif [ "$used_int" -ge 70 ]; then
  hp_col='\033[0;33m'
else
  hp_col='\033[0;32m'
fi

# Dlvl: stable 1-9 derived from session hash
dlvl=$(( (hash % 9) + 1 ))

# AC: reflects model capability tier (better model = lower AC = harder to hit)
case "$model" in
  *[Oo]pus*)   ac=2 ;;
  *[Hh]aiku*)  ac=7 ;;
  *)            ac=4 ;;
esac

# Short model name
model_short=$(printf '%s' "$model" | sed 's/[Cc]laude[- ]//g' | cut -c1-16)

# Print message line (dim, above corridor)
printf "${dim}%s${reset}\n" "$dung_msg"

# Print dungeon corridor
printf '%s' "$dungeon_colored"

# Print nethack stats
printf "${dim}Dlvl:${dlvl}${reset}"
printf "  ${yellow}\$:${cost_fmt}${reset}"
printf "  ${hp_col}HP:${used_int}(100)${reset}"
printf "  ${cyan}Pw:${in_fmt}(${out_fmt})${reset}"
printf "  ${dim}AC:${ac}${reset}"
printf "  T:${duration_str}"
printf "  ${active_indicator} ${dim}${model_short}${reset}"
printf "  ${dim}${cwd_short}${reset}"
[ -n "$git_remote_short" ] && printf "  ${cyan}${git_remote_short}${reset}"
[ -n "$caveman_text" ] && printf "  ${orange}${caveman_text}${reset}"
printf '\n'
