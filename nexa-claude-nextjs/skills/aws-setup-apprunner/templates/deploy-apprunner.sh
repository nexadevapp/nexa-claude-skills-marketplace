#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 [--teardown]"
  echo ""
  echo "  (no flag)    Create the App Runner service with ECR, secrets, and IAM roles"
  echo "  --teardown   Delete the App Runner service, IAM roles, ECR repo, and secrets"
  exit 1
}

# --- Application Secrets Definition ---
# Each entry: ENV_VAR_NAME:description
# Customize this array for your application's secrets.
SECRETS=(
  "DATABASE_URL:Database connection string (pooled)"
  "DIRECT_URL:Direct database connection string (non-pooled, for migrations)"
)

MODE="create"
if [[ "${1:-}" == "--teardown" ]]; then
  MODE="teardown"
elif [[ -n "${1:-}" ]]; then
  usage
fi

# --- Common prompts ---
echo "=== App Runner Deployment ==="
echo ""
read -rp "App Name (lowercase, hyphens only): " APP_NAME
read -rp "AWS Region [eu-central-1]: " AWS_REGION
AWS_REGION="${AWS_REGION:-eu-central-1}"

if [[ -z "$APP_NAME" ]]; then
  echo "Error: App Name is required."
  exit 1
fi

if ! [[ "$APP_NAME" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: App name must be lowercase alphanumeric and hyphens only."
  exit 1
fi

export AWS_DEFAULT_REGION="$AWS_REGION"

# Derived names
ACCESS_ROLE_NAME="${APP_NAME}-apprunner-access-role"
INSTANCE_ROLE_NAME="${APP_NAME}-apprunner-instance-role"
SERVICE_NAME="${APP_NAME}-service"

# =============================================================================
# TEARDOWN
# =============================================================================
if [[ "$MODE" == "teardown" ]]; then
  echo ""
  echo "This will PERMANENTLY DELETE:"
  echo "  - App Runner service: $SERVICE_NAME"
  echo "  - IAM roles: $ACCESS_ROLE_NAME, $INSTANCE_ROLE_NAME"
  for entry in "${SECRETS[@]}"; do
    secret_env="${entry%%:*}"
    echo "  - Secrets Manager secret: ${APP_NAME}/${secret_env}"
  done
  echo ""
  read -rp "Are you sure? (y/N): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 0
  fi

  # Delete App Runner service
  SERVICE_ARN=$(aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn | [0]" \
    --output text 2>/dev/null) || SERVICE_ARN="None"

  if [[ "$SERVICE_ARN" != "None" && -n "$SERVICE_ARN" ]]; then
    echo "Deleting App Runner service: $SERVICE_NAME"
    aws apprunner delete-service --service-arn "$SERVICE_ARN" --no-cli-pager
    echo "Waiting for service deletion..."
    while true; do
      STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" \
        --query 'Service.Status' --output text 2>/dev/null) || break
      if [[ "$STATUS" == "DELETED" ]]; then
        break
      fi
      echo "  Status: $STATUS — waiting..."
      sleep 10
    done
    echo "Service deleted."
  else
    echo "App Runner service not found, skipping."
  fi

  # Delete IAM roles (detach policies first)
  for role in "$ACCESS_ROLE_NAME" "$INSTANCE_ROLE_NAME"; do
    if aws iam get-role --role-name "$role" &>/dev/null; then
      echo "Deleting IAM role: $role"
      for policy_arn in $(aws iam list-attached-role-policies --role-name "$role" \
        --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null); do
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy_arn"
      done
      for policy_name in $(aws iam list-role-policies --role-name "$role" \
        --query 'PolicyNames[]' --output text 2>/dev/null); do
        aws iam delete-role-policy --role-name "$role" --policy-name "$policy_name"
      done
      aws iam delete-role --role-name "$role"
      echo "  Deleted."
    else
      echo "IAM role $role not found, skipping."
    fi
  done

  # Force-delete Secrets Manager secrets
  echo "Force-deleting Secrets Manager secrets..."
  for entry in "${SECRETS[@]}"; do
    secret_env="${entry%%:*}"
    aws secretsmanager delete-secret \
      --secret-id "${APP_NAME}/${secret_env}" \
      --force-delete-without-recovery 2>/dev/null \
      || echo "  Secret ${secret_env} not found or already deleted."
    echo "  Deleted: ${APP_NAME}/${secret_env}"
  done

  echo ""
  echo "=== Teardown complete ==="
  exit 0
fi

# =============================================================================
# CREATE
# =============================================================================
read -rp "AWS Account ID: " AWS_ACCOUNT_ID
read -rp "ECR Repository Name: " ECR_REPO_NAME
read -rp "Container Port [3000]: " CONTAINER_PORT
CONTAINER_PORT="${CONTAINER_PORT:-3000}"
read -rp "CPU [256] (256|512|1024|2048|4096): " CPU
CPU="${CPU:-256}"
read -rp "Memory [512] (512|1024|2048|3072|4096|...): " MEMORY
MEMORY="${MEMORY:-512}"
read -rp "Image Tag [latest]: " IMAGE_TAG
IMAGE_TAG="${IMAGE_TAG:-latest}"

if [[ -z "$AWS_ACCOUNT_ID" || -z "$ECR_REPO_NAME" ]]; then
  echo "Error: Account ID and ECR Repository Name are required."
  exit 1
fi

ECR_IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${IMAGE_TAG}"

echo ""
echo "--- Configuration ---"
echo "Account:    $AWS_ACCOUNT_ID"
echo "Region:     $AWS_REGION"
echo "App Name:   $APP_NAME"
echo "ECR Image:  $ECR_IMAGE_URI"
echo "Port:       $CONTAINER_PORT"
echo "CPU/Memory: ${CPU} / ${MEMORY}"
echo "---------------------"
echo ""
read -rp "Proceed? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# --- Step 1: Application Secrets ---
echo ""
echo "--- Step 1: Application Secrets ---"
echo "You will be prompted for each secret value."
echo ""

declare -A SECRET_ARNS

for entry in "${SECRETS[@]}"; do
  secret_env="${entry%%:*}"
  secret_desc="${entry#*:}"
  secret_name="${APP_NAME}/${secret_env}"

  read -rp "${secret_env} (${secret_desc}): " secret_value
  if [[ -z "$secret_value" ]]; then
    echo "Error: ${secret_env} is required."
    exit 1
  fi

  if aws secretsmanager describe-secret --secret-id "$secret_name" &>/dev/null; then
    echo "  Updating secret: $secret_name"
    aws secretsmanager put-secret-value \
      --secret-id "$secret_name" \
      --secret-string "$secret_value" \
      --no-cli-pager > /dev/null
  else
    echo "  Creating secret: $secret_name"
    aws secretsmanager create-secret \
      --name "$secret_name" \
      --description "$secret_desc" \
      --secret-string "$secret_value" \
      --no-cli-pager > /dev/null
  fi

  SECRET_ARNS["$secret_env"]=$(aws secretsmanager describe-secret \
    --secret-id "$secret_name" --query 'ARN' --output text)
  echo "  ARN: ${SECRET_ARNS[$secret_env]}"
done

# --- Step 2: IAM Roles ---
echo ""
echo "--- Step 2: IAM Roles ---"

# Access Role — allows App Runner to pull images from ECR
if aws iam get-role --role-name "$ACCESS_ROLE_NAME" &>/dev/null; then
  echo "Access role already exists: $ACCESS_ROLE_NAME"
else
  echo "Creating access role: $ACCESS_ROLE_NAME"
  aws iam create-role \
    --role-name "$ACCESS_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "Service": "build.apprunner.amazonaws.com" },
          "Action": "sts:AssumeRole"
        }
      ]
    }' \
    --no-cli-pager > /dev/null

  aws iam attach-role-policy \
    --role-name "$ACCESS_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
fi

# Instance Role — allows the running container to read secrets
if aws iam get-role --role-name "$INSTANCE_ROLE_NAME" &>/dev/null; then
  echo "Instance role already exists: $INSTANCE_ROLE_NAME"
else
  echo "Creating instance role: $INSTANCE_ROLE_NAME"
  aws iam create-role \
    --role-name "$INSTANCE_ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "Service": "tasks.apprunner.amazonaws.com" },
          "Action": "sts:AssumeRole"
        }
      ]
    }' \
    --no-cli-pager > /dev/null
fi

# Inline policy for Secrets Manager access — scoped to all application secrets
echo "Attaching secrets policy to instance role..."
RESOURCE_ARNS=""
for secret_env in "${!SECRET_ARNS[@]}"; do
  if [[ -n "$RESOURCE_ARNS" ]]; then
    RESOURCE_ARNS="${RESOURCE_ARNS},"
  fi
  RESOURCE_ARNS="${RESOURCE_ARNS}\"${SECRET_ARNS[$secret_env]}\""
done

aws iam put-role-policy \
  --role-name "$INSTANCE_ROLE_NAME" \
  --policy-name "SecretsManagerAccess" \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Effect\": \"Allow\",
        \"Action\": \"secretsmanager:GetSecretValue\",
        \"Resource\": [
          ${RESOURCE_ARNS}
        ]
      }
    ]
  }"

# IAM roles take a moment to propagate
echo "Waiting for IAM role propagation..."
sleep 10

# --- Step 3: App Runner Service ---
echo ""
echo "--- Step 3: App Runner Service ---"

ACCESS_ROLE_ARN=$(aws iam get-role --role-name "$ACCESS_ROLE_NAME" --query 'Role.Arn' --output text)
INSTANCE_ROLE_ARN=$(aws iam get-role --role-name "$INSTANCE_ROLE_NAME" --query 'Role.Arn' --output text)

# Check if service already exists
EXISTING_SERVICE_ARN=$(aws apprunner list-services \
  --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn | [0]" \
  --output text 2>/dev/null) || EXISTING_SERVICE_ARN="None"

# Build RuntimeEnvironmentSecrets JSON map
RUNTIME_SECRETS=""
for secret_env in "${!SECRET_ARNS[@]}"; do
  if [[ -n "$RUNTIME_SECRETS" ]]; then
    RUNTIME_SECRETS="${RUNTIME_SECRETS},"
  fi
  RUNTIME_SECRETS="${RUNTIME_SECRETS}\"${secret_env}\": \"${SECRET_ARNS[$secret_env]}\""
done

SERVICE_CONFIG='{
  "ImageRepository": {
    "ImageIdentifier": "'"${ECR_IMAGE_URI}"'",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "'"${CONTAINER_PORT}"'",
      "RuntimeEnvironmentSecrets": {
        '"${RUNTIME_SECRETS}"'
      }
    }
  },
  "AuthenticationConfiguration": {
    "AccessRoleArn": "'"${ACCESS_ROLE_ARN}"'"
  },
  "AutoDeploymentsEnabled": true
}'

INSTANCE_CONFIG='{
  "Cpu": "'"${CPU}"'",
  "Memory": "'"${MEMORY}"'",
  "InstanceRoleArn": "'"${INSTANCE_ROLE_ARN}"'"
}'

HEALTH_CHECK_CONFIG='{
  "Protocol": "HTTP",
  "Path": "/",
  "Interval": 20,
  "Timeout": 5,
  "HealthyThreshold": 1,
  "UnhealthyThreshold": 5
}'

if [[ "$EXISTING_SERVICE_ARN" != "None" && -n "$EXISTING_SERVICE_ARN" ]]; then
  echo "Updating existing App Runner service: $SERVICE_NAME"
  aws apprunner update-service \
    --service-arn "$EXISTING_SERVICE_ARN" \
    --source-configuration "$SERVICE_CONFIG" \
    --instance-configuration "$INSTANCE_CONFIG" \
    --health-check-configuration "$HEALTH_CHECK_CONFIG" \
    --no-cli-pager

  SERVICE_ARN="$EXISTING_SERVICE_ARN"
else
  echo "Creating App Runner service: $SERVICE_NAME"
  SERVICE_ARN=$(aws apprunner create-service \
    --service-name "$SERVICE_NAME" \
    --source-configuration "$SERVICE_CONFIG" \
    --instance-configuration "$INSTANCE_CONFIG" \
    --health-check-configuration "$HEALTH_CHECK_CONFIG" \
    --no-cli-pager \
    --query 'Service.ServiceArn' --output text)
fi

echo ""
echo "Waiting for App Runner service to become active..."
while true; do
  STATUS=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" \
    --query 'Service.Status' --output text)
  if [[ "$STATUS" == "RUNNING" ]]; then
    break
  elif [[ "$STATUS" == "CREATE_FAILED" || "$STATUS" == "UPDATE_FAILED" ]]; then
    echo "Error: Service entered $STATUS state."
    exit 1
  fi
  echo "  Status: $STATUS — waiting..."
  sleep 15
done

SERVICE_URL=$(aws apprunner describe-service --service-arn "$SERVICE_ARN" \
  --query 'Service.ServiceUrl' --output text)

echo ""
echo "=== Deployment complete ==="
echo ""
echo "Service ARN: $SERVICE_ARN"
echo "Service URL: https://${SERVICE_URL}"
echo ""
echo "ECR Image:   $ECR_IMAGE_URI"
echo ""
echo "Secrets mapped to environment variables:"
for secret_env in "${!SECRET_ARNS[@]}"; do
  echo "  ${secret_env} -> ${SECRET_ARNS[$secret_env]}"
done
echo ""
echo "Push a new image to ECR and App Runner will auto-deploy."
