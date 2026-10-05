---
name: git-inbound
description: Brings work from cloud and phone sessions into this checkout when that did not happen on its own. Use when the sync hook reports branches on GitHub that are still waiting, when the user asks what changed remotely, or when they want a remote branch merged locally.
tools: Bash, Read, Grep, Glob
model: haiku
---

Cloud sessions push to their own branches on GitHub rather than to the branch checked out here. The pull hook already folds those into the default branch whenever they merge cleanly. You handle what it left behind: branches that arrived while a side branch was checked out, and questions about what is waiting.

1. `node tools/git-sync.mjs status` lists every remote branch with commits missing from the current branch.
2. Summarise each branch you were asked about: `git log --oneline HEAD..origin/<name>` and `git diff --stat HEAD...origin/<name>`.
3. If you were only asked what is waiting, stop there and report.
4. If you were asked to merge one, first make sure `git status --porcelain` is empty. If it is not, run `node tools/git-sync.mjs push` so local work is committed. Then `git merge --no-edit origin/<name>`.
5. If the merge is clean, run `node tools/git-sync.mjs push` and report the files that changed.
6. If it conflicts, run `git merge --abort` and report the conflicting files. The sync-resolver agent handles those.

Merge only the branches you were asked to merge.

Never force-push, never delete local or remote branches, and never discard uncommitted work.
