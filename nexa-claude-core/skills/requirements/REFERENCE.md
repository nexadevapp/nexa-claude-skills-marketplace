# Requirements Reference

## ID Prefixes

| Prefix | Type                       | Example |
|--------|----------------------------|---------|
| FR     | Functional Requirement     | FR-001  |
| NFR    | Non-Functional Requirement | NFR-001 |
| C      | Constraint                 | C-001   |

## Priority

Used during initial requirements gathering (`/requirements`):

| Priority | Description                                         |
|----------|-----------------------------------------------------|
| High     | Must have. Core functionality or critical quality.  |
| Medium   | Should have. Important but system works without it. |
| Low      | Nice to have. Can be deferred to future releases.   |

## MoSCoW

Added during requirements engineering (`/engineer-requirements`). Provides a more rigorous
classification informed by CRUD analysis, traceability, and dependency evidence:

| Category              | Code | Description                                                                 |
|-----------------------|------|-----------------------------------------------------------------------------|
| Must have             | M    | Without this the system has no value; the release cannot ship               |
| Should have           | S    | Important and painful to omit, but the system is still usable without it    |
| Could have            | C    | Desirable; included only if time and budget allow                           |
| Won't have (this time)| W    | Explicitly out of scope for the current release but acknowledged for future |

## Status

| Status      | Description                                    |
|-------------|------------------------------------------------|
| Open        | Requirement defined but not yet implemented.   |
| In Progress | Currently being implemented.                   |
| Implemented | Implementation complete, pending verification. |
| Verified    | Tested and confirmed working.                  |
| Deferred    | Postponed to a future release.                 |
| Rejected    | Removed from scope.                            |

## NFR Categories

| Category        | Description                                   |
|-----------------|-----------------------------------------------|
| Performance     | Speed, throughput, response time              |
| Scalability     | Ability to handle growth                      |
| Availability    | Uptime, fault tolerance                       |
| Security        | Authentication, authorization, encryption     |
| Usability       | User experience, accessibility                |
| Maintainability | Code quality, documentation, modularity       |
| Portability     | Platform independence, deployment flexibility |

## Constraint Categories

| Category    | Description                                   |
|-------------|-----------------------------------------------|
| Technical   | Technology stack, platforms, integrations     |
| Business    | Budget, resources, organizational policies    |
| Schedule    | Deadlines, milestones, time constraints       |
| Regulatory  | Legal, compliance, industry standards         |
| Operational | Deployment, maintenance, support requirements |
