terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.6"
}

provider "aws" {
  region = var.aws_region
}

locals {
  common_tags = {
    Product     = var.product
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.owner
  }

  ecr_image_uri = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.app_name}:latest"
}

# --- ECR Repository ---

resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Remove untagged images after 7 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 7
      }
      action = { type = "expire" }
    }]
  })
}

# --- Secrets Manager ---
# NOTE: Secret values are set to "REPLACE_ME". Update terraform.tfvars before applying.

resource "aws_secretsmanager_secret" "app" {
  for_each = var.secrets

  name        = "${var.app_name}/${each.key}"
  description = each.value

  tags = local.common_tags
}

# --- IAM: Task Execution Role ---
# Allows ECS to pull images from ECR and write logs to CloudWatch.

data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "${var.app_name}-ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "SecretsManagerRead"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = [for s in aws_secretsmanager_secret.app : s.arn]
    }]
  })
}

# --- IAM: Infrastructure Role ---
# Allows ECS Express to manage networking, load balancer, and auto-scaling on your behalf.
# NOTE: Verify the exact managed policy name from AWS docs / context7 before applying.

data "aws_iam_policy_document" "ecs_infra_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "infrastructure" {
  name               = "${var.app_name}-ecs-infrastructure-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_infra_assume.json

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "infrastructure_managed" {
  role       = aws_iam_role.infrastructure.name
  # Verify this policy ARN from the ECS Express Mode documentation or context7.
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSInfrastructureRolePolicyForVolumes"
}

# --- ECS Cluster ---

resource "aws_ecs_cluster" "app" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# --- ECS Task Definition ---

resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_execution.arn

  container_definitions = jsonencode([{
    name      = var.app_name
    image     = local.ecr_image_uri
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    secrets = [
      for name, _ in var.secrets : {
        name      = name
        valueFrom = aws_secretsmanager_secret.app[name].arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.app_name}"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
        "awslogs-create-group"  = "true"
      }
    }
  }])

  tags = local.common_tags
}

# --- ECS Express Service ---
# NOTE: ECS Express Mode is a new AWS feature. Verify the exact Terraform resource
# attributes using context7 (hashicorp/aws provider docs for aws_ecs_service Express Mode)
# before applying. The configuration below follows the standard ECS Fargate pattern;
# update with Express-specific parameters once confirmed.

resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # ECS Express Mode: set infrastructure role and enable managed networking/ALB.
  # Verify exact attribute names from AWS Terraform provider docs.
  iam_role = aws_iam_role.infrastructure.arn

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  tags = local.common_tags

  lifecycle {
    ignore_changes = [desired_count]
  }
}
