# 🤖💎 Claude-Gemini Real-Time Collaboration Strategy

## Current Status

- **Claude Branch**: `claude-gemini-collab-1756108901`
- **Claude Focus**: Fixing export errors in @altamedica/ui, @altamedica/hooks, patients app
- **Gemini Focus**: [To be detected by monitoring]

## File Ownership Strategy

### 🤖 Claude Territory

- `apps/patients/` - Patient app components and fixes
- `packages/ui/` - UI component exports and stubs
- `packages/hooks/` - Hook definitions and exports
- `packages/marketplace-hooks/` - useDoctorProfile additions

### 💎 Gemini Territory (Presumed)

- `apps/companies/` - Company/marketplace functionality
- Company-specific components and services
- Marketplace-related features

### 🤝 Shared Territory (Requires Coordination)

- `packages/types/` - Type definitions
- `packages/medical/` - Medical utilities
- Root configuration files
- `pnpm-lock.yaml` updates

## Conflict Prevention Rules

### Rule 1: Check Before Edit

```bash
# Before editing ANY file, check if it was recently modified
git log -1 --format="%ci %s" -- <filename>
```

### Rule 2: Communicate via Stash Names

```bash
# Use descriptive stash messages to communicate intent
git stash push -m "Claude: UI exports fix - safe to merge"
git stash push -m "Gemini: Marketplace features - needs coordination"
```

### Rule 3: Atomic Commits

```bash
# Commit small, focused changes frequently
git add packages/ui/src/index.ts
git commit -m "fix: export Tooltip components from UI package"
```

### Rule 4: Monitor File Activity

```bash
# Run the monitor to see real-time changes
node monitor-gemini.js
```

## Merge Strategy

### For Claude (Current Session):

1. **Finish current export fixes**
2. **Test builds pass**
3. **Commit to collaboration branch**
4. **Create PR with clear scope**

### For Gemini Integration:

1. **Gemini can pull collaboration branch**
2. **Work on separate files/components**
3. **Use different branch for marketplace work**
4. **Coordinate via file modification timestamps**

## Emergency Conflict Resolution

### If Conflicts Occur:

```bash
# 1. Stop work immediately
# 2. Check what files conflict
git status

# 3. Communicate via branch names
git checkout -b "CONFLICT-DETECTED-claude-needs-help"

# 4. Create summary of intent
echo "Claude was fixing: UI exports, Tooltip, DropdownMenu, useToast" > CONFLICT-SUMMARY.md
git add CONFLICT-SUMMARY.md
git commit -m "CONFLICT: Claude export fixes summary"
```

## Success Metrics

### ✅ Success Indicators:

- Both AIs can work simultaneously without file conflicts
- Changes merge cleanly
- Builds pass after collaboration
- No lost work or duplicate effort

### ⚠️ Warning Signs:

- Same file modified by both AIs within 5 minutes
- Merge conflicts on shared packages
- Build failures after merging branches

## Communication Protocol

### Via Git Messages:

- **Branch names**: Indicate AI and purpose
- **Commit messages**: Clear scope and intent
- **Stash messages**: Current status and next steps

### Via File Monitoring:

- Monitor script shows real-time activity
- Detects which AI is likely working on which files
- Suggests when to sync/commit

---

**Last Updated**: $(date)
**Active Collaboration**: TRUE
**Monitor Status**: RUNNING
