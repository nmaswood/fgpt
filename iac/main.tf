terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }
  }
}


provider "google" {
  project     = var.project
  region      = var.region
  zone        = var.zone
  credentials = file(var.credentials_file)

}

resource "google_project_service" "enable_services" {
  for_each                   = toset(var.gcp_service_list)
  project                    = var.project
  service                    = each.key
  disable_dependent_services = true
  disable_on_destroy         = false
}


resource "google_sql_database_instance" "instance" {
  name             = "${var.project_slug}-db"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {

    tier = "db-f1-micro"
  }
  deletion_protection = "false"

}



resource "google_artifact_registry_repository" "project-registry" {
  location      = var.region
  repository_id = var.artifact_repo_name
  description   = "assets for the ${var.project_slug} project"
  format        = "DOCKER"
}



resource "google_cloudbuild_trigger" "build-api" {
  location = var.region
  name     = "build-api-${var.project_slug}"

  github {
    owner = var.repo_owner
    name  = var.repo_name
    push {
      branch = "^main$"
    }
  }

  substitutions = {
    _LOCATION     = var.region
    _REPOSITORY   = var.artifact_repo_name
    _PROJECT_SLUG = var.project_slug
  }

  filename = "cloudbuild/build-api.cloudbuild.yaml"
}

resource "google_cloudbuild_trigger" "build-api" {
  location = var.region
  name     = "build-ml-${var.project_slug}"

  github {
    owner = var.repo_owner
    name  = var.repo_name
    push {
      branch = "^main$"
    }
  }

  substitutions = {
    _LOCATION     = var.region
    _REPOSITORY   = var.artifact_repo_name
    _PROJECT_SLUG = var.project_slug
  }

  filename = "cloudbuild/build-api.cloudbuild.yaml"
}





resource "google_sql_database" "database" {
  name     = "fgpt"
  instance = google_sql_database_instance.instance.name
}

resource "google_sql_user" "database-user" {
  name     = var.database_user
  instance = google_sql_database_instance.instance.name
  password = var.database_password
}

resource "google_cloud_run_service" "ml_svc" {
  name     = "${var.project_slug}-ml_svc"
  location = var.region

  template {
    spec {
      containers {
        image = "us-docker.pkg.dev/cloudrun/container/hello"


      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service" "api" {
  name     = "${var.project_slug}-node-api"
  location = var.region
  template {
    spec {
      containers {
        image = "us-docker.pkg.dev/cloudrun/container/hello"

        ports {
          container_port = 5000
        }

        env {
          name  = "ENV"
          value = "production"
        }

        env {
          name  = "SQL_URI"
          value = "postgresql://${var.database_user}:${var.database_password}@/socialmedia?host=/cloudsql/${google_sql_database_instance.instance.connection_name}"
        }

        env {
          name  = "ML_SERVICE_URI"
          value = google_cloud_run_service.ml_svc.status[0].url

        }

      }
    }
    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.instance.connection_name
      }
    }
  }
}

data "google_iam_policy" "no_auth" {
  binding {
    role = "roles/run.invoker"

    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "api_public_access" {
  location    = google_cloud_run_service.api.location
  project     = google_cloud_run_service.api.project
  service     = google_cloud_run_service.api.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}

resource "google_cloud_run_service_iam_policy" "ml_svc_public_access" {
  location    = google_cloud_run_service.ml_svc.location
  project     = google_cloud_run_service.ml_svc.project
  service     = google_cloud_run_service.ml_svc.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}

#resource "google_cloud_run_service_iam_member" "ml_svc_member" {
#service  = google_cloud_run_service.ml_svc.name
#location = google_cloud_run_service.ml_svc.location
#role     = "roles/run.invoker"
#member   = "allUsers"
#}

#resource "google_cloud_run_service_iam_member" "api_member" {
#service  = google_cloud_run_service.api.name
#location = google_cloud_run_service.api.location
#role     = "roles/run.invoker"
#member   = "allUsers"
#}

