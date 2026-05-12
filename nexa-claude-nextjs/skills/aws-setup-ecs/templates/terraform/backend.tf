terraform {
  backend "s3" {
    bucket         = "terraform-state-{{AWS_ACCOUNT_ID}}"
    key            = "{{PRODUCT}}/{{APP_NAME}}/terraform.tfstate"
    region         = "{{AWS_REGION}}"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
