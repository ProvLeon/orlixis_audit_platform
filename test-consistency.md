# PDF vs Web Report Consistency Test

## Purpose
This document helps verify that the PDF generation and web report viewer show consistent data for the same report.

## Test Steps

### 1. Generate Reports
1. Navigate to a project with vulnerabilities
2. Generate a security report
3. View the report in the web interface
4. Download the PDF version

### 2. Compare Key Metrics
Check that the following values match exactly between web and PDF:

#### Overall Score
- [ ] Web Score: ____
- [ ] PDF Score: ____
- [ ] ✅ Match / ❌ Mismatch

#### Risk Level
- [ ] Web Risk: ____
- [ ] PDF Risk: ____
- [ ] ✅ Match / ❌ Mismatch

#### Total Issues Found
- [ ] Web Issues: ____
- [ ] PDF Issues: ____
- [ ] ✅ Match / ❌ Mismatch

#### Project Statistics
- [ ] Web Files: ____
- [ ] PDF Files: ____
- [ ] ✅ Match / ❌ Mismatch

- [ ] Web Lines: ____
- [ ] PDF Lines: ____
- [ ] ✅ Match / ❌ Mismatch

#### Scan Duration
- [ ] Web Duration: ____
- [ ] PDF Duration: ____
- [ ] ✅ Match / ❌ Mismatch

### 3. Debug Information
Check the browser console and server logs for debug output:

#### Web Report Logs
```
Web Raw vulnerability count: ____
Web After deduplication: ____
Web After grouping/final count: ____
Web Overall Score: ____ Risk Level: ____ Total Vulnerabilities: ____
```

#### PDF Report Logs
```
PDF Raw vulnerability count: ____
PDF After deduplication: ____
PDF After grouping/final count: ____
PDF Overall Score: ____ Risk Level: ____ Total Vulnerabilities: ____
```

### 4. Troubleshooting

#### If Raw Counts Differ
- Check if vulnerabilities are being fetched from different scopes
- Verify both use `WHERE projectId = project.id`

#### If Deduplication Counts Differ
- Verify both use `dedupeVulnerabilities()` from `reportTheme.ts`
- Check for differences in vulnerability data structure

#### If Final Counts Differ
- Verify both use identical grouping logic (`title|category|cwe`)
- Check for differences in how locations are handled

#### If Scores Differ
- Verify both use `computeScoreAndRisk()` from `reportTheme.ts`
- Check that vulnerability severities are consistent

## Expected Behavior
✅ All metrics should match exactly between PDF and web reports
✅ Debug logs should show identical processing steps
✅ Risk levels should be calculated using the same thresholds

## Fixed Issues
- ✅ Buffer type conversion in PDF generation
- ✅ Consistent vulnerability queries (both use projectId)
- ✅ Identical deduplication and grouping logic
- ✅ Scan duration calculation from startedAt/completedAt
- ✅ Shared scoring utilities from reportTheme.ts

## Notes
- Both reports now fetch vulnerabilities using the same query
- Both apply identical deduplication and grouping
- Both use shared utilities for scoring calculations
- Debug logging helps identify any remaining discrepancies
