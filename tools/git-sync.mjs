// Keeps this checkout and GitHub in step, so local sessions and cloud (phone) sessions see the same repo. Usage:
//   node git-sync.mjs push     commit everything and push the current branch           (Stop hook)
//   node git-sync.mjs pull     fetch, fast-forward, report work pushed from elsewhere   (SessionStart / UserPromptSubmit hooks)
//   node git-sync.mjs status   print where this checkout and GitHub stand
// pull takes --throttle=<seconds> to skip the fetch when one ran that recently, and --merge to fold branches pushed
// by other sessions into the default branch instead of only reporting them.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Cloud sessions commit and push their own branch; mirroring from inside one would fight that.
if (process.env.CLAUDE_CODE_REMOTE === 'true') process.exit(0);

const [mode = 'status', ...flags] = process.argv.slice(2);
const throttle = +(flags.find(f => f.startsWith('--throttle='))?.split('=')[1] ?? 0);
const autoMerge = flags.includes('--merge');
const MAX_BYTES = 50 * 1024 * 1024; // GitHub warns at 50 MB and rejects at 100 MB
const SECRET = /(^|\/)(\.env(\.[^/]*)?|id_(rsa|ed25519|ecdsa)|[^/]*\.(pem|key|pfx|p12)|credentials[^/]*\.json)$/i;
const SECRET_OK = /\.env\.(example|sample|template)$/i;

let root = dirname(fileURLToPath(import.meta.url));
const env = { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' }; // fail instead of hanging on a credential prompt
const git = (args, timeout = 30000) => {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout, env });
  return { ok: r.status === 0, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() };
};
const top = git(['rev-parse', '--show-toplevel']);
if (!top.ok || !git(['remote', 'get-url', 'origin']).ok) process.exit(0);
root = top.out;

// Hook input arrives as JSON on stdin; a manual run has none.
let hook = {};
if (mode !== 'status' && !process.stdin.isTTY) try { hook = JSON.parse(readFileSync(0, 'utf8')); } catch {}
const event = hook.hook_event_name;
const forUser = [], forClaude = [];

const gitDir = git(['rev-parse', '--absolute-git-dir']).out;
const stateFile = join(git(['rev-parse', '--path-format=absolute', '--git-common-dir']).out, 'claude-sync.json');
const busy = ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply'].find(f => existsSync(join(gitDir, f)));
const branch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']).out; // empty when detached
const upstream = () => { const u = git(['rev-parse', '--abbrev-ref', '@{u}']); return u.ok ? u.out : ''; };
const count = range => +git(['rev-list', '--count', range]).out || 0;
const size = f => { try { return statSync(join(root, f)).size; } catch { return 0; } };
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const firstLine = s => s.split('\n').find(l => /fatal|error|rejected/i.test(l)) ?? s.split('\n')[0];
const brief = files => files.length > 12 ? `${files.slice(0, 12).join(', ')} (+${files.length - 12} more)` : files.join(', ');
// Every branch on GitHub other than the one this checkout tracks, as [name, sha].
const remoteBranches = up => git(['for-each-ref', 'refs/remotes/origin', '--format=%(refname:short) %(objectname)']).out
  .split('\n').map(l => l.split(' ')).filter(([name]) => name.includes('/') && !name.endsWith('/HEAD') && name !== up);

function push() {
  if (!branch) return forUser.push('Mirror skipped: HEAD is detached.');
  if (busy) return forUser.push('Mirror paused: a merge or rebase is in progress here.');
  const add = git(['add', '-A']);
  if (!add.ok) return forUser.push(`Mirror failed at git add: ${firstLine(add.err)}`);

  // Never auto-publish something that looks like a credential or that GitHub would refuse.
  const added = git(['diff', '--cached', '--name-only', '--diff-filter=A', '-z']).out.split('\0').filter(Boolean);
  const held = added.filter(f => (SECRET.test(f) && !SECRET_OK.test(f)) || size(f) > MAX_BYTES);
  if (held.length) {
    git(['reset', '-q', '--', ...held]);
    forUser.push(`Not mirrored (looks like a secret, or is over 50 MB): ${held.join(', ')}. Add it to .gitignore, or commit it yourself to include it.`);
  }

  const staged = git(['diff', '--cached', '--name-status']).out.split('\n').filter(Boolean);
  if (staged.length) {
    const names = staged.map(l => l.split('\t').pop().split('/').pop());
    const subject = `sync: ${names.slice(0, 2).join(', ')}${names.length > 2 ? ` (+${names.length - 2} more)` : ''}`;
    const commit = git(['commit', '-q', '-m', subject, '-m', staged.map(l => l.replace(/\t/g, ' ')).join('\n')]);
    if (!commit.ok) return forUser.push(`Mirror failed at git commit: ${firstLine(commit.err || commit.out)}`);
  }
  if (upstream() && !count('@{u}..HEAD')) return;

  const send = () => git(['push', '-u', 'origin', 'HEAD'], 90000);
  let pushed = send(), onTopOf = 0;
  if (!pushed.ok && /rejected|fetch first|non-fast-forward/i.test(pushed.err)) {
    // GitHub moved (a cloud session pushed to this branch): replay the local commits on top of it.
    git(['fetch', 'origin', '--quiet'], 30000);
    onTopOf = count(`HEAD..origin/${branch}`);
    if (!git(['rebase', `origin/${branch}`], 60000).ok) {
      git(['rebase', '--abort']);
      const msg = `Mirror blocked: local commits on ${branch} conflict with ${plural(onTopOf, 'commit')} pushed to origin/${branch} from another session. The rebase was aborted, so nothing is lost and nothing was pushed.`;
      // Exit 2 from a Stop hook hands stderr to Claude and keeps the turn going; stop_hook_active means we already did that once.
      if (event === 'Stop' && !hook.stop_hook_active) { console.error(`${msg} Use the sync-resolver subagent to reconcile the two histories and push, then report what it did.`); process.exit(2); }
      return forUser.push(`${msg} Run the sync-resolver subagent to reconcile them.`);
    }
    pushed = send();
  }
  if (!pushed.ok) return forUser.push(`Mirror to GitHub failed: ${firstLine(pushed.err)}. Local commits are safe and go up with the next turn.`);
  forUser.push(`Mirrored to GitHub: ${branch} @ ${git(['rev-parse', '--short', 'HEAD']).out}${onTopOf ? ` (on top of ${plural(onTopOf, 'commit')} from another session)` : ''}`);
}

function pull() {
  let state = {};
  try { state = JSON.parse(readFileSync(stateFile, 'utf8')); } catch {}
  if (throttle && Date.now() - (state.fetched ?? 0) < throttle * 1000) return;
  if (!git(['fetch', 'origin', '--prune', '--quiet'], 15000).ok) return; // offline: try again next time
  state.fetched = Date.now();

  const up = upstream();
  if (branch && up && !busy) {
    const behind = count(`HEAD..${up}`), ahead = count(`${up}..HEAD`);
    if (behind && !ahead) {
      const files = brief(git(['diff', '--name-only', `HEAD..${up}`]).out.split('\n'));
      if (git(['merge', '--ff-only', up]).ok) {
        forUser.push(`Pulled ${plural(behind, 'commit')} from GitHub into ${branch}.`);
        forClaude.push(`${plural(behind, 'commit')} from another session just landed in ${branch}. Files changed on disk: ${files}. Re-read any of them before editing.`);
      } else forClaude.push(`${up} is ${plural(behind, 'commit')} ahead, but uncommitted local changes to the same files block a fast-forward. The next mirror will commit them and rebase; if that conflicts, the sync-resolver subagent is needed.`);
    } else if (behind && ahead) forClaude.push(`${branch} and ${up} have diverged (${ahead} local, ${behind} remote). The next mirror will rebase; if that conflicts, use the sync-resolver subagent.`);
  }

  // Cloud sessions push to their own branches. Report the ones that moved since we last looked; with --merge, on the
  // default branch, fold them in so every session's work ends up in the one copy that new sessions start from.
  const onDefault = up && up === (git(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']).out || 'origin/main');
  // 'seen' tracks what was folded in (or found to clash); otherwise branches are only 'noted', so they can still merge later.
  const refs = remoteBranches(up), key = autoMerge && onDefault && !busy ? 'seen' : 'noted', prior = state[key] ?? {}, next = Object.fromEntries(refs);
  const landed = [], changed = [], clashing = [], waiting = [];
  for (const [name, sha] of refs) {
    const n = prior[name] === sha ? 0 : count(`HEAD..${name}`);
    if (!n) continue;
    const short = name.replace('origin/', ''), label = `${short} (${plural(n, 'commit')})`;
    if (key === 'noted') { waiting.push(label); continue; }
    const files = git(['diff', '--name-only', `HEAD...${name}`]).out.split('\n');
    if (git(['merge', '--no-edit', '-m', `sync: merge ${short} from another session`, name], 60000).ok) { landed.push(label); changed.push(...files); }
    else if (existsSync(join(gitDir, 'MERGE_HEAD'))) { git(['merge', '--abort']); clashing.push(label); }
    else delete next[name]; // uncommitted edits were in the way: retry on the next pull
  }
  state[key] = next;
  writeFileSync(stateFile, JSON.stringify(state));
  if (landed.length) {
    git(['push', '-u', 'origin', 'HEAD'], 30000); // if this fails, the Stop hook pushes and reports
    forUser.push(`Brought in from other sessions: ${landed.join(', ')}.`);
    forClaude.push(`Work from other sessions was just merged into ${branch}: ${landed.join(', ')}. Files changed on disk: ${brief([...new Set(changed)])}. Re-read any of them before editing, and tell the user in plain language what arrived.`);
  }
  if (clashing.length) {
    forUser.push(`Could not combine automatically: ${clashing.join(', ')} overlaps with work already in ${branch}. Nothing was changed.`);
    forClaude.push(`Work from another session conflicts with ${branch}: ${clashing.join(', ')}. The merge was aborted and nothing changed. Tell the user in plain language, and offer to combine the two with the sync-resolver subagent.`);
  }
  if (waiting.length) {
    forUser.push(`New on GitHub, not in ${branch || 'this checkout'}: ${waiting.join(', ')}`);
    forClaude.push(`Branches pushed from other sessions have commits this checkout lacks: ${waiting.join(', ')}. Mention it to the user; if they want one merged here, use the git-inbound subagent.`);
  }
}

function status() {
  git(['fetch', 'origin', '--prune', '--quiet'], 15000);
  const up = upstream(), dirty = git(['status', '--porcelain']).out.split('\n').filter(Boolean).length;
  console.log(`branch    ${branch || '(detached)'}${busy ? `  [${busy} in progress]` : ''}`);
  console.log(`upstream  ${up ? `${up}  ahead ${count(`${up}..HEAD`)}, behind ${count(`HEAD..${up}`)}` : '(none yet: the next push creates it)'}`);
  console.log(`changes   ${dirty ? plural(dirty, 'uncommitted file') : 'clean'}`);
  for (const [name] of remoteBranches(up)) { const n = count(`HEAD..${name}`); if (n) console.log(`waiting   ${name} (+${n})`); }
}

({ push, pull, status })[mode]?.();

if (!event) { const lines = [...forUser, ...forClaude]; if (lines.length) console.log(lines.join('\n')); }
else {
  const out = {};
  if (forUser.length) out.systemMessage = forUser.join('\n');
  if (forClaude.length && event !== 'Stop') out.hookSpecificOutput = { hookEventName: event, additionalContext: forClaude.join('\n') };
  if (Object.keys(out).length) console.log(JSON.stringify(out));
}
