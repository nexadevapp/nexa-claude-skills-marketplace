# Architecture Audit — Glossary

This glossary explains the terms in an architecture audit report. It is for the human reader. The
rules that the audit applies are in the [skill](../skills/architecture-audit/SKILL.md).

## Documentation

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| ADR (Architecture Decision Record) | A short document that records one architecture decision, its context, and its consequences. | The report lists each ADR with its title and status. |
| ADR status | The state of a decision, for example `Proposed`, `Accepted`, `Deprecated`, or `Superseded`. | An ADR with no status is a gap: the reader cannot know if the decision is still valid. |

## Dependencies

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Dependency | An external library, framework, or image that the implementation uses. | Each row comes from a manifest file or an import statement. |
| Manifest | The file that declares the dependencies, for example `package.json`, `go.mod`, or `pom.xml`. | The report has one table for each manifest. |
| Scope | Where a dependency is used: `runtime`, `dev`, `test`, or `infrastructure` (a base image or a service image). | A `runtime` dependency is part of the product. The other scopes are not. |
| Role | The part that a dependency plays in the architecture, for example `framework`, `database`, `http client`, or `auth`. | It shows the architecture choices at a glance. |
| Not imported | A declared dependency that no file imports. | It can be unused. It can also be used by a tool or a configuration file. Check before you remove it. |
| Imported but not declared | An import that no manifest declares. | The code depends on a transitive dependency, or a declaration is missing. A later update can break the build. |

## Diagrams

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| C4 model | A set of architecture diagrams at four levels of detail: context, container, component, and code. The report draws the first three. | Read from the context diagram down to the component diagram. |
| C4 context diagram | The system, its users, and the external systems that it calls. | It shows the boundary of the system. |
| C4 container diagram | The deployable units (applications, services, databases, queues) and the protocols between them. | "Container" means a deployable unit, not a Docker container. |
| C4 component diagram | The main modules inside one container. | The report draws it only where the code has clear module boundaries. |
| Sequence diagram | The order of calls between participants in one workflow, for example route → handler → service → database. | The participant names are the real identifiers in the code. |
| Entity relationship diagram (ERD) | The data entities, their keys, and the relationships between them. | The report draws one ERD for each cluster of related entities. |
| Cluster | A group of related entities, for example one bounded context or one domain module. | An entity that two clusters share is marked. It is a coupling point between the clusters. |
| PK, FK, UK | Primary key, foreign key, and unique key. | They show how the entities are identified and connected. |
| Cardinality | How many entities of one type relate to one entity of another type, for example one-to-many. | Read it from the line ends in the ERD. |
| Sources line | The `Sources:` line under each diagram. It lists the files that support the diagram. | Each element in the diagram comes from a file in this list. |
| Not drawn | The audit did not draw the diagram. The report gives the reason. | Usually the code has no clear boundaries for that diagram. |

## Views and quality attributes

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| 4+1 view model | Five views of an architecture: logical, process, development, physical, and scenarios. | The report maps each view to a diagram. It draws no extra diagrams. |
| Logical view | The functions and the data that the system gives to its users. | Covered by the component diagram and the ERDs. |
| Process view | The run-time behaviour: the calls, the order, and the concurrency. | Covered by the sequence diagrams. |
| Development view | The organization of the code in modules and folders. | Covered by the component diagram and the folder structure. |
| Physical view | The deployment of the software on infrastructure. | Covered by the container diagram. `/infra-audit` gives more detail. |
| Scenarios view | The important use cases that connect the other views. | Covered by the sequence diagrams. |
| Not covered | No diagram in the report supports the view. | It is a gap in the architecture documentation. |
| NFR (non-functional requirement) | A requirement for a quality of the system, for example performance, security, or availability, not for a function. | Each NFR row gives its source and the evidence in the code. |
| Quality attribute | A measurable quality of the system, for example a timeout, a rate limit, caching, or logging. | `Quality attributes with no requirement` lists qualities that the code has but no document requires. |
| NFR status | `implemented`: the code has full evidence. `partial`: the code has some evidence. `not found`: the code has no evidence. | `not found` is a gap. |

## Report

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
