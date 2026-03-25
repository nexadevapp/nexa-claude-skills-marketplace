---
name: aws-setup-apprunner
description: >
  Generates an interactive deployment script that provisions AWS App Runner
  with ECR, IAM roles, Secrets Manager integration, and a GitHub Actions
  CI/CD workflow for automated image builds and deployments. Use when the
  user asks to "deploy to AWS", "set up App Runner", "create AWS
  infrastructure", "deploy a container to AWS", or mentions AWS App Runner,
  ECR deployment, or cloud deployment setup.
---

# AWS Setup — App Runner

## Instructions

Generate AWS App Runner deployment infrastructure for the current project: $ARGUMENTS.
$ARGUMENTS may specify the app name, region, or special requirements.

## Prerequisites

- The project must already have a Dockerfile (use the `aws-dockerize` skill first if needed)
- AWS CLI must be installed and configured with appropriate permissions
- The user must have an AWS account with permissions for: App Runner, ECR, IAM, Secrets Manager

## Workflow

1. **Read the project context**:
   - Check the existing Dockerfile to determine the exposed port
   - Check for any existing AWS infrastructure files in `infra/`
   - Ask the user for: app name, AWS region (default: `eu-central-1`), AWS account ID

2. **Create the deployment script** at `infra/aws.apprunner/deploy-apprunner.sh`:
   - Interactive prompts for app name, region, account ID, ECR repo, port, CPU/memory, image tag
   - **Step 1 — Test Secret**: Create a Secrets Manager secret to verify the integration
   - **Step 2 — IAM Roles**:
     - Access Role: allows App Runner to pull images from ECR (trust `build.apprunner.amazonaws.com`)
     - Instance Role: allows the container to read secrets at runtime (trust `tasks.apprunner.amazonaws.com`)
     - Inline policy granting `secretsmanager:GetSecretValue` scoped to the test secret ARN
   - **Step 3 — App Runner Service**:
     - Source configuration pointing to the ECR image
     - Runtime environment secrets mapping
     - Auto-deployments enabled (redeploy on new ECR image push)
     - Health check configuration (HTTP on `/`, 20s interval)
     - Instance configuration (CPU, memory, instance role)
   - Support `--teardown` flag to cleanly delete all created resources
   - Wait loops with status output for service creation/deletion
   - Print the service URL on successful deployment
   - Make the script executable (`chmod +x`)

3. **Create the GitHub Actions workflow** at `.github/workflows/deploy-<app-name>.yml`:
   - Trigger on push to `main`/`master` branch with path filter for the project directory
   - OIDC authentication (no stored credentials) — requires `id-token: write` permission
   - Steps: checkout, configure AWS credentials, login to ECR, setup Docker Buildx, create ECR repo if missing, build & push image
   - Use `docker/build-push-action@v6` with GHA cache (`cache-from: type=gha`, `cache-to: type=gha,mode=max`)
   - Platform: `linux/amd64`

4. **Output a summary** with:
   - What was created and where
   - Next steps: how to run the deploy script, what GitHub secrets/OIDC to configure

## Reference Templates

Use these reference templates from the plugin:

- **Deploy script**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/aws-setup-apprunner/templates/deploy-apprunner.sh`
- **GitHub Actions workflow**: `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-nextjs/1.0.0/skills/aws-setup-apprunner/templates/github-actions/deploy-ecr-apprunner.yml`

### GitHub Actions Workflow Placeholders

The workflow template uses these placeholders that must be filled in:

| Placeholder | Description | Example |
|---|---|---|
| `{{APP_NAME}}` | Application name for the workflow title | `my-web-app` |
| `{{AWS_ACCOUNT_ID}}` | AWS account ID for ECR URI and OIDC role ARN | `048643934642` |
| `{{AWS_REGION}}` | AWS region | `eu-central-1` |
| `{{OIDC_ROLE_NAME}}` | IAM role name for GitHub Actions OIDC federation | `GitHubActions-ECR-Push` |
| `{{ECR_REPO_NAME}}` | ECR repository name | `my-web-app-ecr` |
| `{{PROJECT_PATH}}` | Path to the project within the repo (for path filter and working dir) | `.` or `apps/web` |
| `{{BRANCH}}` | Branch that triggers the workflow | `main` |

## DO NOT

- Hard-code AWS account IDs, ARNs, or region — always parameterize
- Store AWS credentials in the workflow — use OIDC federation
- Create overly permissive IAM policies — scope to least privilege
- Skip the `--teardown` option — always provide a clean way to remove resources
- Overwrite existing infrastructure files without reading them first and asking the user
