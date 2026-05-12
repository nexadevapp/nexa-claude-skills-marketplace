#!/usr/bin/env bash
# One-time bootstrap: creates the shared Terraform remote state backend for this AWS account.
# Run once per account. Safe to re-run — checks for existing resources before creating.
set -euo pipefail

echo "=== Terraform State Backend Bootstrap ==="
echo ""
read -rp "AWS Account ID: " AWS_ACCOUNT_ID
read -rp "AWS Region [eu-central-1]: " AWS_REGION
AWS_REGION="${AWS_REGION:-eu-central-1}"

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "Error: AWS Account ID is required."
  exit 1
fi

BUCKET_NAME="terraform-state-${AWS_ACCOUNT_ID}"
TABLE_NAME="terraform-state-lock"

export AWS_DEFAULT_REGION="$AWS_REGION"

echo ""
echo "--- Configuration ---"
echo "S3 Bucket:      $BUCKET_NAME"
echo "DynamoDB Table: $TABLE_NAME"
echo "Region:         $AWS_REGION"
echo "---------------------"
echo ""
read -rp "Proceed? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# --- S3 Bucket ---
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
  echo "S3 bucket already exists: $BUCKET_NAME"
else
  echo "Creating S3 bucket: $BUCKET_NAME"
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --no-cli-pager
  else
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION" \
      --no-cli-pager
  fi

  aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }]
    }'

  aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

  echo "  S3 bucket created and configured."
fi

# --- DynamoDB Table ---
if aws dynamodb describe-table --table-name "$TABLE_NAME" &>/dev/null; then
  echo "DynamoDB table already exists: $TABLE_NAME"
else
  echo "Creating DynamoDB table: $TABLE_NAME"
  aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --no-cli-pager > /dev/null

  echo "Waiting for table to become active..."
  aws dynamodb wait table-exists --table-name "$TABLE_NAME"
  echo "  DynamoDB table created."
fi

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "Remote state backend is ready."
echo "Configure your Terraform backend with:"
echo ""
echo "  bucket         = \"$BUCKET_NAME\""
echo "  dynamodb_table = \"$TABLE_NAME\""
echo "  region         = \"$AWS_REGION\""
echo ""
echo "Use a unique key per product/service, e.g.:"
echo "  key = \"<product>/<app-name>/terraform.tfstate\""
