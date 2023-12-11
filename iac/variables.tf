variable "project" {
  default = "nasr-learn"
}

variable "credentials_file" {
  default = "tf-service-credentials.json"
}

variable "region" {
  default = "us-central1"
}


variable "branch_name" {
  default = "main"
}

variable "repo_name" {
  default = "fgpt"
}

variable "artifact_repo_name" {
  default = "fgpt"
}

variable "zone" {
  default = "us-central1-c"
}

variable "project_slug" {
  default = "fgpt"
}

variable "repo_owner" {
  default = "nmaswood"
}

variable "gcp_service_list" {
  description = "The list of apis necessary for the project"
  type        = list(string)
  default = [
    "run.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudprofiler.googleapis.com",
    "servicenetworking.googleapis.com"

  ]
}


variable "database_user" {
  default = "pgwriter"
}

variable "github_repo" {
  default = "fgpt"
}

variable "database_password" {
}

variable "service_to_service_secret" {
}

variable "vercel_api_key" {
}

variable "database_name" {
  default = "fgpt"
}

variable "pinecone_environment" {
  default = "test"
}

// vercel

variable "public_api_endpoint" {
  default = "https://api.getparedo.com"
}

variable "vercel_domain" {
  default = "app.getparedo.com"
}

variable "vercel_team_id" {
  default = "team_3yoDXafHgvtzEAOO2hUyZeSK"
}

// AUTH0
variable "auth0_domain" {}
variable "auth0_client_id" {}
variable "auth0_client_secret" {}

variable "auth0_api_identifier" {
  default = "fgpt-api"
}


variable "auth0_secret" {}

variable "auth0_logo_uri" {
  default = "https://storage.googleapis.com/nasr-public/paredo-logo.svg"
}

variable "auth0_client_name" {
  default = "Paredo"
}

// ML SERVICE
variable "openai_api_key" {}
variable "pinecone_api_key" {}
variable "pinecone_env" {}
variable "pinecone_index" {}
variable "pinecone_namespace" {}

// PUBSUB
//

variable "pubsub_task_topic" {
  default = "task_queue"
}

variable "pubsub_task_subscription" {
  default = "task_subscription"
}

// ANTHROPIC
variable "anthropic_api_key" {}
