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
  ]
}


variable "database_user" {
  default = "pgwriter"
}

variable "github_repo" {
  default = "fgpt"
}

variable "github_uri" {
  default = "https://github.com/nmaswood/fgpt.git"
}

variable "database_password" {
}
