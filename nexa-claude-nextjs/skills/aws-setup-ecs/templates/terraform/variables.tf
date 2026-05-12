variable "app_name" {
  description = "Application name (lowercase, hyphens only). Used as prefix for all resource names."
  type        = string
}

variable "product" {
  description = "Product identifier (e.g. volant-x). Used for tagging and S3 state prefix."
  type        = string
}

variable "environment" {
  description = "Deployment environment: prod, staging, or dev."
  type        = string
  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "environment must be one of: prod, staging, dev."
  }
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "eu-central-1"
}

variable "aws_account_id" {
  description = "AWS account ID."
  type        = string
}

variable "owner" {
  description = "Team or individual responsible for this service. Used for tagging."
  type        = string
}

variable "container_port" {
  description = "Port the container listens on."
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "Fargate task CPU units (256, 512, 1024, 2048, 4096)."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory in MiB (512, 1024, 2048, ...)."
  type        = number
  default     = 512
}

variable "secrets" {
  description = "Map of secret environment variable names to their descriptions."
  type        = map(string)
  default     = {}
}
