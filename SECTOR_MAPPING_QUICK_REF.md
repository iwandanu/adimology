# Sector Mapping Quick Reference

## Quick Commands

```bash
# Fetch sectors for specific stocks
node scripts/fetch-sectors.js TLKM ASII BBCA

# Fetch all syariah stocks
node scripts/fetch-sectors.js

# Run screener to check for missing mappings
npm run dev
# → Navigate to /minervini-screener
# → Check console for warnings
```

## Monthly Update Checklist

- [ ] Run screener and check console logs
- [ ] Note any missing sector mappings
- [ ] Run `node scripts/fetch-sectors.js [missing stocks]`
- [ ] Copy output to `lib/sectorMapping.ts`
- [ ] Update `SECTOR_VERSION` (e.g., 1.0.0 → 1.1.0)
- [ ] Update `LAST_UPDATED` date
- [ ] Test by running screener again
- [ ] Commit: `git commit -m "chore: update sector mappings v1.1.0"`

## Important Files

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `lib/sectorMapping.ts` | Static sector database | Monthly |
| `lib/UPDATE_SECTORS_GUIDE.md` | Detailed update guide | Rarely |
| `scripts/fetch-sectors.js` | Helper script | Never (unless API changes) |
| `docs/SECTOR_MAPPING_SYSTEM.md` | System documentation | Rarely |

## Log Messages to Watch

✅ **Good:**
```
[Minervini] Building sector map from static data...
[Minervini] Built sector map with 70 entries (0 unknown)
```

⚠️ **Action Needed:**
```
[Minervini] Missing sector mappings for: NEWSTOCK, ANOTHER
```
→ Run fetch script and update mapping file

## Performance Metrics

- **Before**: ~35 seconds for 70 stocks
- **After**: <0.1 seconds for 70 stocks
- **API Calls**: 70 → 0 (100% reduction)

## Help

- Detailed guide: `lib/UPDATE_SECTORS_GUIDE.md`
- System overview: `docs/SECTOR_MAPPING_SYSTEM.md`
- Implementation summary: `docs/STATIC_SECTOR_IMPLEMENTATION.md`
