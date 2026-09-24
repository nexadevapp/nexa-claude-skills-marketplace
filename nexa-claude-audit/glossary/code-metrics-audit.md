# Code Metrics Audit — Glossary

This glossary explains the terms in a code metrics audit report. It is for the human reader. The
rules and the thresholds that the audit applies are in the
[skill](../skills/code-metrics-audit/SKILL.md).

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Static analysis | An analysis of the source code without running it. | This audit runs no tests and no builds. |
| Cyclomatic complexity (CCN) | The number of independent paths through a function. Each `if`, loop, `case`, and `&&` / `\|\|` adds one path. | A high value means that the function is hard to read and needs many tests. `Complexity hotspots` lists the functions to refactor first. |
| Average, P90, maximum | The mean value, the value that 90 % of the units are at or below, and the highest value. | The average hides outliers. P90 and the maximum show them. |
| Duplicated lines | The percentage of source lines that are part of a copied block (a clone). | A change in duplicated code must be made in each copy. A missed copy causes a defect. |
| Clone | Two or more blocks of code that are the same or almost the same. | `Duplicate blocks` shows both locations of each clone. |
| CBO (coupling between objects) | The number of other classes or modules that one class or module uses. The audit measures the outgoing direction only (efferent coupling). | A high value means that a change in many other places can break this unit. |
| DIT (depth of inheritance tree) | The number of ancestor classes of a class. A class with no base class has DIT 0. | A deep tree makes the behaviour of a class hard to find, because it comes from many ancestors. |
| Chain | The list of ancestor classes of a class, from the class to the root. | `≥ n` means that the chain leaves the repository at the named base class, so the true depth can be larger. |
| Unit | The code element that a metric measures: a function (CCN), a class (DIT, and CBO in Java), a file (CBO in most languages), or a package (CBO in Go). | Compare values only between units of the same kind. |
| Method | How the audit got a value: `tool: <name>` (an analyser) or `computed from source` (the audit read the imports and the class declarations). | A tool value is more precise. A value computed from source is an estimate. |
| Threshold | The limit that decides the status of a metric. | The skill gives the fixed thresholds. |
| Status | `pass`: the value is within the threshold. `warn`: the value is near the limit. `fail`: the value is outside the limit. | The status of a metric is the status of its worst unit. The `Units: pass / warn / fail` column shows how many units are in each status. |
| Not applicable | The metric has no meaning for the language, for example DIT in Go or Rust, which have no class inheritance. | It is not a gap. |
| Not measured | The audit could not measure the metric. The row gives the reason, for example "analyser not available". | It is a gap. The value is unknown, not good. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
