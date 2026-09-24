# Infrastructure Audit — Glossary

This glossary explains the terms in an infrastructure audit report. It is for the human reader.
The rules that the audit applies are in the [skill](../skills/infra-audit/SKILL.md).

| Term | Meaning | How to read it in the report |
|------|---------|------------------------------|
| Infrastructure as Code (IaC) | Infrastructure that files define, for example Terraform, Pulumi, AWS CDK, CloudFormation, Bicep, Helm, or Kubernetes manifests. | IaC can be reviewed and repeated. Infrastructure that no file defines cannot. |
| Infrastructure definition | One file or folder that defines infrastructure, with its tool, its environments, and its main resources. | Each row links to the file or folder. |
| Main resources | The most important items that a definition creates, for example a database, a cluster, a bucket, or a service. | It is a summary, not a complete list. |
| Environment | One deployment of the system with its own configuration, for example local, development, staging, or production. | An environment with no definition is a gap. |
| Environment selection | How the system selects its environment: an environment variable (`NODE_ENV`, `APP_ENV`), a command-line flag, or a profile name. | It shows how to start the system in each environment. |
| Profile | A named set of configuration values for one environment, for example `application-prod.yml` or `.env.production`. | It is one of the files in the `Environments and configuration` table. |
| Secret | A value that must stay private, for example a password, an API key, or a token. | The report never shows a secret value. |
| Secret reference | The name of a secret and the place where the code or the configuration uses it: an environment variable name, a secret manager key, or a Kubernetes `Secret` name. | It shows which secrets the system needs, without their values. |
| Suspected real secret | A committed file that seems to contain a real secret value, not a placeholder. | It is a gap. The report gives the file and the key name only. Rotate the secret and remove it from the repository history. |
| Placeholder | A value in an example file that is not a real secret, for example `changeme` or `your-api-key`. | A placeholder is not a gap. |
| Local development infrastructure | What a developer runs on a local machine: Compose files, Testcontainers, dev containers, seed and setup scripts, `Makefile` or `Taskfile` targets. | It shows how to start the system locally. |
| Testcontainers | A library that starts real services (for example a database) in Docker containers for tests. | It is local infrastructure for tests, not for production. |
| Dev container | A container definition (`.devcontainer/`) for the development environment. | It gives each developer the same tools. |
| Gap | A finding that needs attention, in the `## Gaps` list. | Read the gaps first. Each gap links to its evidence. |
| Not found | The audit searched and found nothing. The report lists the places that it searched. | It means "not in the places searched". It does not prove that the item does not exist. |
