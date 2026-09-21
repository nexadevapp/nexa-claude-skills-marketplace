---
name: infra-audit
description: >
  Writes a dated infrastructure audit report for the current repository: where and how the
  infrastructure is defined (Terraform, Pulumi, CDK, Helm, Kubernetes, Dockerfiles, Compose,
  serverless configs), the environments and how one is selected, the secret references (names
  only), and the local development infrastructure. Works on any repository and any tech stack.
  Writes only docs/audit/infra-audit/infra-audit-YYYY-MM-DD-<hash>.md. This skill must only be
  invoked explicitly via /infra-audit — never inferred from user messages.
disable-model-invocation: true
---

# Infrastructure Audit

## When to use

- The user types `/infra-audit`.
- Never run this skill on your own initiative, and never from another skill.

## Process

### 1. Follow the audit contract

Read and follow `${CLAUDE_PLUGIN_ROOT}/shared/AUDIT_CONTRACT.md`: establish the report context,
detect the stack, and select the report path. Skill name: `infra-audit`.
Title: `Infrastructure Audit`.

### 2. Find the infrastructure definitions

Search for Infrastructure as Code and container definitions:

- Terraform / OpenTofu (`*.tf`, `*.tofu`, `*.tfvars`), Pulumi (`Pulumi.*`), AWS CDK (`cdk.json`),
  CloudFormation and SAM (`template.yaml`, `*.cfn.*`), Bicep (`*.bicep`);
- Helm (`charts/`, `Chart.yaml`), Kubernetes manifests (`k8s/`, `kubernetes/`, `manifests/`),
  Kustomize (`kustomization.yaml`);
- `Dockerfile*`, `docker-compose*.yml`, `compose*.yml`;
- serverless and platform configs: `vercel.json`, `netlify.toml`, `serverless.yml`, `fly.toml`,
  `render.yaml`, `app.yaml`, `Procfile`;
- folders such as `infra/`, `deploy/`, `ops/`, `ansible/`.

For each definition, record the tool, the environments it targets (workspaces, overlays,
`*.tfvars`, values files), and the main resources it creates.

### 3. Find the environments and configuration

List the environment files and profiles (`.env.example`, `.env.*`, `config/<env>.*`,
`application-<profile>.*`) and how an environment is selected (an env var such as `NODE_ENV`,
`APP_ENV`, a CLI flag, a profile name).

### 4. Find the secret references

List the names of the secrets and where each is referenced: env var names, secret manager keys,
Kubernetes `Secret` names, CI secret names in infrastructure files. Never copy a value. When a
committed file seems to contain a real secret (a key, a token, a password that is not a
placeholder), report it as a gap with the file and the key name only.

### 5. Find the local development infrastructure

List what a developer runs locally: Compose files, Testcontainers usage, dev containers
(`.devcontainer/`), seed and setup scripts, `Makefile` or `Taskfile` targets.

### 6. Write the report

Use this template after the contract header, `## Summary`, and `## Gaps`. Gaps include, for
example, files that seem to hold a real secret, environments with no definition, and secrets that
are referenced but not documented in an example env file.

```markdown
## Infrastructure definitions

| Tool | Folder or file | Environments | Main resources |
|------|----------------|--------------|----------------|

## Environments and configuration

| Environment | Files | How it is selected |
|-------------|-------|--------------------|

## Secret references

| Secret name | Kind | Referenced in |
|-------------|------|---------------|

## Local development infrastructure

| Item | File | What it starts or prepares |
|------|------|----------------------------|
```

## Verification

Confirm the contract checklist, then:

- [ ] Each infrastructure row links to a file or folder that exists.
- [ ] The secret table holds names only; no value appears anywhere in the report.
- [ ] Each suspected real secret is in `## Gaps`, with the file and the key name only.
