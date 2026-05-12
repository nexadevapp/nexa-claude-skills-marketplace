---
name: aws-setup-ecs
description: >
  Generates Terraform infrastructure for ECS Express Mode with ECR, IAM roles,
  Secrets Manager integration, per-product remote state, and a GitHub Actions
  CI/CD workflow for automated image builds. Use when the user asks to "deploy
  to AWS", "set up ECS", "create AWS infrastructure", "deploy a container to
  AWS", or mentions ECS, Fargate, or cloud deployment setup.
---

# AWS Setup — ECS Express

## Instructions

Generate ECS Express Mode Terraform infrastructure for the current project: $ARGUMENTS.
$ARGUMENTS may specify the app name, product, region, or special requirements.

## Nexa Rules Gate

Read and follow `~/.claude/plugins/cache/nexa-claude-marketplace/nexa-claude-core/1.0.0/shared/readiness/NEXA_RULES_GATE.md`.

## Prerequisites

- The project must already have a Dockerfile (use the `aws-dockerize` skill first if needed)
- Terraform CLI must be installed (`terraform -version`)
- AWS CLI must be installed and configured with appropriate permissions
- The user must have an AWS account with permissions for: ECS, ECR, IAM, Secrets Manager, S3, DynamoDB

## Workflow

### 1. Read project context

- Check the existing Dockerfile to determine the exposed port
- Check for any existing Terraform files in `infra/`
- Read `.env.local` to discover application secret names (keys only — never use values)
- If `.env.local` does not exist, ask the user to provide the secret names manually
- Ask the user for: app name (lowercase, hyphens), product name (e.g. `volant-x`), environment (`prod`/`staging`/`dev`), AWS region (default: `eu-central-1`), AWS account ID, owner (team name)

### 2. Fetch current Terraform ECS documentation

Use context7 to fetch the latest HashiCorp AWS provider documentation for:
- `aws_ecs_service` — specifically ECS Express Mode parameters
- `aws_ecs_task_definition`
- `aws_ecs_cluster`

Verify the ECS Express Mode Terraform resource syntax before writing templates. ECS Express Mode requires a task execution role and an infrastructure role — confirm the exact resource attributes from the docs.

### 3. Create the bootstrap script at `infra/bootstrap/bootstrap.sh`

This script runs **once per AWS account** to create the shared Terraform state backend:
- S3 bucket: `terraform-state-<account-id>` with versioning and AES256 encryption
- DynamoDB table: `terraform-state-lock` with `LockID` (String) as the hash key and PAY_PER_REQUEST billing
- Make the script executable (`chmod +x`)

Use the template at `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/bootstrap/bootstrap.sh`.

### 4. Create Terraform configuration at `infra/terraform/`

Use the templates at `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/terraform/` as the base. Fill in all placeholders with values collected in step 1.

The Terraform configuration must include:

**`backend.tf`** — Remote state using per-product S3 prefix:
- Bucket: `terraform-state-<account-id>`
- Key: `<product>/<app-name>/terraform.tfstate`
- Region, DynamoDB table, encryption enabled

**`variables.tf`** — All parameterised values: `app_name`, `product`, `environment`, `aws_region`, `aws_account_id`, `container_port`, `cpu`, `memory`, `owner`, `secrets` (map of name → description)

**`main.tf`** — Resources:
- `aws_ecr_repository` with image tag mutability `MUTABLE` and force delete disabled
- ECR lifecycle policy pruning untagged images after 7 days
- `aws_secretsmanager_secret` + `aws_secretsmanager_secret_version` for each secret discovered from `.env.local` — values set to placeholder `"REPLACE_ME"` with a comment instructing the user to update them before deploying
- IAM task execution role (`<app-name>-ecs-task-execution-role`) trusted by `ecs-tasks.amazonaws.com` with `AmazonECSTaskExecutionRolePolicy` + inline policy for `secretsmanager:GetSecretValue` scoped to the created secret ARNs
- IAM infrastructure role (`<app-name>-ecs-infrastructure-role`) — allows ECS Express to manage networking and load balancer on your behalf; trust `ecs.amazonaws.com`; attach the AWS managed policy for ECS infrastructure access (verify exact policy name from context7)
- ECS cluster (`<app-name>-cluster`) with Container Insights enabled
- ECS task definition with Fargate compatibility, `awsvpc` network mode, the execution role, secrets injected as environment secrets from Secrets Manager
- ECS Express service (`<app-name>-service`) referencing the task definition, with auto-scaling enabled

Apply `local.common_tags` to every resource:
```hcl
locals {
  common_tags = {
    Product     = var.product
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.owner
  }
}
```

**`outputs.tf`** — `service_url`, `ecr_repository_url`, `cluster_name`, `service_name`

**`terraform.tfvars`** — Pre-filled with all collected values. Secret values are set to `"REPLACE_ME"`.

### 5. Create the GitHub Actions workflow at `.github/workflows/deploy-<app-name>.yml`

Use the template at `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/github-actions/deploy-ecr.yml`.

Fill in all placeholders. The workflow:
- Triggers on push to `main`/`master` with path filter for the project directory
- OIDC authentication (`id-token: write`) — no stored credentials
- Builds and pushes Docker image to ECR (`:latest` + git SHA tag) using `docker/build-push-action@v6` with GHA cache
- After push: runs `aws ecs update-service --cluster <app-name>-cluster --service <app-name>-service --force-new-deployment` to trigger a rolling update

The OIDC IAM role must have permissions for ECR push and `ecs:UpdateService` — note this in the output summary.

### 6. Output a summary

Print:
- What was created and where
- Next steps in order:
  1. Run `infra/bootstrap/bootstrap.sh` (once per account, if not already done)
  2. Update secret values in `infra/terraform/terraform.tfvars` (replace all `"REPLACE_ME"` values)
  3. Run `terraform init && terraform apply` from `infra/terraform/`
  4. Set up the OIDC IAM role in AWS for GitHub Actions (provide the exact trust policy and permission policy to attach)
  5. Push to `main` to trigger the first automated build

## Reference Templates

- **Bootstrap script**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/bootstrap/bootstrap.sh`
- **`backend.tf`**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/terraform/backend.tf`
- **`variables.tf`**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/terraform/variables.tf`
- **`main.tf`**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/terraform/main.tf`
- **`outputs.tf`**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/terraform/outputs.tf`
- **`terraform.tfvars`**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/terraform/terraform.tfvars.example`
- **GitHub Actions workflow**: `${CLAUDE_PLUGIN_ROOT}/skills/aws-setup-ecs/templates/github-actions/deploy-ecr.yml`

## DO NOT

- Hard-code AWS account IDs, ARNs, region, or secret values — always use variables
- Store AWS credentials in the GitHub Actions workflow — use OIDC federation
- Create overly permissive IAM policies — scope to least privilege
- Write secret values into any committed file — use `"REPLACE_ME"` placeholders
- Overwrite existing Terraform files without reading them first and asking the user
- Skip applying `common_tags` to any resource — tags are mandatory for multi-product accounts
- Run `terraform apply` — instruct the user to run it; Claude does not have AWS credentials
