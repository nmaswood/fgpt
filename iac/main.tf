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


    auth0 = {
      source  = "auth0/auth0"
      version = "~> 0.46.0" # Refer to docs for latest version
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
          value = "postgres://${urlencode(var.database_user)}:${urlencode(var.database_password)}@/${var.database_name}?socket=${urlencode("/cloudsql/${google_sql_database_instance.instance.connection_name}")}"
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

    }
  }

}



locals {
  job_runner_jobs = ["get-earnings-call-href", "process-earnings-call", "load-into-vector-db"]
}

resource "google_cloud_run_v2_job" "job-runner" {
  for_each = toset(local.job_runner_jobs)

  name     = "${var.project_slug}-job-runner-${each.key}"
  location = "us-central1"

  template {

    template {


      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.instance.connection_name]
        }
      }


      timeout = "3600s"

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project}/fgpt/job-runner:latest"

        env {

          name  = "SQL_URI"
          value = "socket://${urlencode(var.database_user)}:${urlencode(var.database_password)}@${urlencode("/cloudsql/${google_sql_database_instance.instance.connection_name}")}/fgpt"
        }

        env {
          name  = "ML_SERVICE_URI"
          value = google_cloud_run_v2_service.springtime.uri
        }

        env {

          name  = "JOB_TYPE"
          value = each.key

        }

        env {
          name  = "CHROMIUM_EXECUTABLE_PATH"
          value = "/usr/bin/google-chrome"

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

resource "google_cloudbuild_trigger" "build-job-runner" {
  location = var.region
  name     = "build-job-runner-${var.project_slug}"

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

  filename       = "cloudbuild/build-job-runner.cloudbuild.yaml"
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
        value = google_cloud_run_v2_service.springtime.uri
      }

      env {
        name  = "SQL_URI"
        value = "socket://${urlencode(var.database_user)}:${urlencode(var.database_password)}@${urlencode("/cloudsql/${google_sql_database_instance.instance.connection_name}")}/fgpt"
      }

      env {
        name  = "AUTH0_AUDIENCE"
        value = var.auth0_api_identifier
      }



      env {
        name  = "AUTH0_ISSUER"
        value = "https://${var.auth0_domain}/"
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
    type              = "github"
    repo              = "nmaswood/fgpt"
    production_branch = "main"
  }

  install_command  = "make install-app"
  build_command    = "make build-app"
  root_directory   = "typescript"
  output_directory = "packages/app/.next"

  team_id = var.vercel_team_id

  environment = [
    {
      key    = "AUTH0_SCOPE"
      target = ["production", "preview"]
      value  = "openid profile email offline_access"
    },
    {
      key    = "AUTH0_AUDIENCE"
      target = ["production", "preview"]
      value  = var.auth0_api_identifier
    },

    {
      key    = "AUTH0_CLIENT_ID"
      target = ["production", "preview"]
      value  = auth0_client.frontend.client_id
    },

    {
      key    = "AUTH0_CLIENT_SECRET"
      target = ["production", "preview"]
      value  = var.auth0_api_identifier
      value  = auth0_client.frontend.client_secret
    },

    {
      key    = "AUTH0_BASE_URL"
      target = ["production", "preview"]
      value  = "https://www.${var.vercel_domain}"
    },
    {
      key    = "AUTH0_SECRET"
      target = ["production", "preview"]
      value  = var.auth0_secret
    },
    {
      key    = "PUBLIC_API_ENDPOINT"
      target = ["production", "preview"]
      value  = var.public_api_endpoint
    },
    {
      key    = "AUTH0_ISSUER_BASE_URL"
      target = ["production", "preview"]
      value  = "https://${var.auth0_domain}"
    }
  ]
}

resource "vercel_deployment" "git" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.front_end.id
  ref        = "main"
}

resource "vercel_project_domain" "domain" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.front_end.id
  domain     = "www.${var.vercel_domain}"
}

# A redirect of a domain name to a second domain name.
# The status_code can optionally be controlled.
resource "vercel_project_domain" "bare_domain" {
  team_id    = var.vercel_team_id
  project_id = vercel_project.front_end.id
  domain     = var.vercel_domain

  redirect             = vercel_project_domain.domain.domain
  redirect_status_code = 308
}

provider "auth0" {
  domain        = var.auth0_domain
  client_id     = var.auth0_client_id
  client_secret = var.auth0_client_secret
}

resource "auth0_client" "frontend" {
  name        = "FGPT Next.js"
  description = "Frontend app"
  app_type    = "spa"
  callbacks = [
    "https://www.${var.vercel_domain}/api/auth/callback",
    "https://${var.vercel_domain}/api/auth/callback",
  ]

  allowed_logout_urls = [
    "https://www.${var.vercel_domain}",
    "https://${var.vercel_domain}",
  ]

  oidc_conformant = true


  logo_uri = var.auth0_logo_uri
  jwt_configuration {
    alg = "RS256"
  }
}

resource "auth0_branding" "my_brand" {
  logo_url = var.auth0_logo_uri

  colors {
    primary         = "#635dff"
    page_background = "#635dff"
  }
}


resource "auth0_connection" "google" {
  name     = "google"
  strategy = "google-oauth2"

}


resource "auth0_resource_server" "backend" {
  name       = "fgpt-backend"
  identifier = var.auth0_api_identifier

  enforce_policies                                = true
  allow_offline_access                            = true
  skip_consent_for_verifiable_first_party_clients = true

}


resource "auth0_prompt_custom_text" "example" {
  prompt   = "login"
  language = "en"
  body = jsonencode(
    {
      "login" : {
        "buttonText" : "Sign into FGPT",
        "title" : "Welcome",
      }
    }
  )
}
