terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.51.0"
    }

    vercel = {
      source  = "vercel/vercel"
      version = "0.11.5"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_key
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

resource "google_cloud_run_v2_job" "db" {
  name     = "${var.project_slug}-db"
  location = "us-central1"

  template {

    template {


      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.instance.connection_name]
        }
      }


      containers {
        image = "${var.region}-docker.pkg.dev/${var.project}/fgpt/db:latest"


        env {
          name  = "DATABASE_URL"
          value = "postgresql://${urlencode(var.database_user)}:${urlencode(var.database_password)}@/${urlencode(var.database_name)}fgpt?host=/cloudsql/${urlencode(google_sql_database_instance.instance.connection_name)}"
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

    }
  }

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

  filename       = "cloudbuild/build-api.cloudbuild.yaml"
  included_files = ["typescript/packages/**"]
}

resource "google_cloudbuild_trigger" "build-springtime" {
  location = var.region
  name     = "build-springtime-${var.project_slug}"

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

  filename       = "cloudbuild/build-springtime.cloudbuild.yaml"
  included_files = ["python/springtime/**"]
}

resource "google_cloudbuild_trigger" "build_db" {
  location = var.region
  name     = "build-db-${var.project_slug}"

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

  filename       = "cloudbuild/build-db.cloudbuild.yaml"
  included_files = ["db/**"]
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

resource "google_cloud_run_v2_service" "springtime" {
  name     = "${var.project_slug}-springtime"
  location = var.region


  template {

    scaling {
      max_instance_count = 2
    }
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project}/fgpt/springtime:latest"

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }


      env {
        name  = "OPENAI_API_KEY"
        value = var.openai_api_key
      }

      env {
        name  = "PINECONE_API_KEY"
        value = var.pinecone_api_key
      }

      env {
        name  = "PINECONE_ENV"
        value = var.pinecone_env
      }

      env {
        name  = "PINECONE_INDEX"
        value = var.pinecone_index
      }

      env {
        name  = "PINECONE_NAMESPACE"
        value = var.pinecone_namespace
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_v2_service" "api" {
  name     = "${var.project_slug}-api"
  location = var.region


  template {

    scaling {
      max_instance_count = 2
    }


    containers {
      image = "${var.region}-docker.pkg.dev/${var.project}/fgpt/api:latest"

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "ML_SERVICE_URI"
        value = "${google_cloud_run_v2_service.springtime.uri}:8080"

      }


      env {

        name  = "SQL_URI"
        value = "postgres://${urlencode(var.database_user)}:${urlencode(var.database_password)}@/fgpt?host=/cloudsql/${urlencode(google_sql_database_instance.instance.connection_name)}"
      }


      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.instance.connection_name]
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
  location    = google_cloud_run_v2_service.api.location
  project     = google_cloud_run_v2_service.api.project
  service     = google_cloud_run_v2_service.api.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}

resource "google_cloud_run_service_iam_policy" "springtime_public_access" {
  location    = google_cloud_run_v2_service.springtime.location
  project     = google_cloud_run_v2_service.springtime.project
  service     = google_cloud_run_v2_service.springtime.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}



resource "vercel_project" "front_end" {
  name      = "fgpt"
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = "nmaswood/fgpt"
  }

  install_command  = "make install-app"
  build_command    = "make build-app"
  root_directory   = "typescript"
  output_directory = "packages/app/.next"

}




data "google_iam_role" "artifact_registry_writer" {
  name = "roles/artifactregistry.writer"
}


data "google_project" "project" {}

resource "google_project_service_identity" "cloud_build_sa" {
  provider = google-beta

  project = data.google_project.project.project_id
  service = "cloudbuild.googleapis.com"
}

resource "google_project_iam_member" "hc_sa_bq_jobuser" {
  project = data.google_project.project.project_id
  role    = data.google_iam_role.artifact_registry_writer.name
  member  = "serviceAccount:${google_project_service_identity.cloud_build_.email}"
}
