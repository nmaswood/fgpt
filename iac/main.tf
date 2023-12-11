terraform {
  required_providers {

    google = {
      source  = "hashicorp/google"
      version = "~> 4.72.1"
    }

    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.14.0"
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


resource "google_project" "project" {
  name       = var.project
  project_id = var.project
}


provider "google" {
  project     = var.project
  region      = var.region
  zone        = var.zone
  credentials = file(var.credentials_file)
}

resource "google_compute_network" "vpc_network" {
  name                    = "vpc-network"
  auto_create_subnetworks = "true"
}

resource "google_compute_global_address" "vpc_access_connector_ip" {
  name          = "connector-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc_network.self_link
}


resource "google_service_networking_connection" "private_vpc_connection" {
  provider = google-beta

  network                 = google_compute_network.vpc_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.vpc_access_connector_ip.name]
}


resource "google_vpc_access_connector" "connector" {
  name          = "connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc_network.name
}


resource "google_project_service" "enable_services" {
  for_each                   = toset(var.gcp_service_list)
  project                    = var.project
  service                    = each.key
  disable_dependent_services = true
  disable_on_destroy         = false
}


resource "google_sql_database_instance" "instance" {
  provider         = google-beta
  project          = var.project
  name             = "${var.project_slug}-db"
  database_version = "POSTGRES_15"
  region           = var.region


  depends_on = [google_service_networking_connection.private_vpc_connection]


  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = google_compute_network.vpc_network.id
      enable_private_path_for_google_cloud_services = true
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 4500
      record_client_address   = true
      record_application_tags = true
    }
    backup_configuration {
      enabled            = true
      binary_log_enabled = true
    }
  }
}


resource "google_storage_bucket" "asset_store" {
  name     = "${var.project_slug}-asset-store"
  location = "US"

  cors {
    origin          = ["http://${var.vercel_domain}", "https://${var.vercel_domain}", "http://*.${var.vercel_domain}", "https://*.${var.vercel_domain}"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
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

      service_account = google_service_account.cloud_run_service_account.email


      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.instance.connection_name]
        }
      }


      containers {
        image = "${var.region}-docker.pkg.dev/${var.project}/${var.project_slug}/db:latest"


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
  asset_bucket = google_storage_bucket.asset_store.name
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
  included_files = [
    "typescript/packages/yarn.lock",
    "typescript/packages/tsconfig.base.json",
    "typescript/packages/precedent-iso/**",
    "typescript/packages/precedent-node/**",
    "typescript/packages/api/**",
  ]
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

  filename = "cloudbuild/build-job-runner.cloudbuild.yaml"
  included_files = [
    "typescript/packages/yarn.lock",
    "typescript/packages/tsconfig.base.json",
    "typescript/packages/precedent-iso/**",
    "typescript/packages/precedent-node/**",
    "typescript/packages/job-runner/**",
  ]
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

resource "google_sql_user" "pgwriter" {
  instance = google_sql_database_instance.instance.name
  name     = var.database_user
  password = var.database_password
}

resource "google_cloud_run_v2_service" "springtime" {
  name     = "${var.project_slug}-springtime"
  location = var.region


  template {

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }


    timeout         = "900s"
    service_account = google_service_account.cloud_run_service_account.email


    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }


    containers {
      image = "${var.region}-docker.pkg.dev/${var.project}/${var.project_slug}/springtime:latest"



      resources {
        limits = {
          cpu    = "2"
          memory = "8Gi"
        }

        startup_cpu_boost = true
      }



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

      #env {
      #name  = "TRACING_ENABLED"
      #value = "true"
      #}

      env {
        name  = "SERVICE_TO_SERVICE_SECRET"
        value = var.service_to_service_secret
      }

      env {
        name  = "ANTHROPIC_API_KEY"
        value = var.anthropic_api_key
      }

      env {
        name  = "REPORTS_OPENAI_MODEL"
        value = "gpt-4-0613"
      }

    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_v2_service" "tika" {
  name     = "${var.project_slug}-tika"
  location = var.region


  template {
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    service_account = google_service_account.cloud_run_service_account.email

    scaling {
      max_instance_count = 4
    }
    containers {

      resources {
        limits = {
          cpu    = "1"
          memory = "4Gi"
        }
      }

      ports {
        container_port = 9998
      }

      image = "apache/tika:latest-full"

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.enable_services]
}




resource "google_cloud_run_v2_service" "api" {
  name     = "${var.project_slug}-api"
  location = var.region


  template {

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    service_account = google_service_account.cloud_run_service_account.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }


    containers {
      image = "${var.region}-docker.pkg.dev/${var.project}/${var.project_slug}/api:latest"


      resources {
        limits = {
          cpu    = "1"
          memory = "4Gi"
        }
        startup_cpu_boost = true
      }

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
        value = "socket://${urlencode(var.database_user)}:${urlencode(var.database_password)}@${urlencode("/cloudsql/${google_sql_database_instance.instance.connection_name}")}/${var.project_slug}"
      }

      env {
        name  = "AUTH0_AUDIENCE"
        value = var.auth0_api_identifier
      }


      env {
        name  = "AUTH0_ISSUER"
        value = "https://${var.auth0_domain}/"
      }

      env {
        name  = "ASSET_BUCKET"
        value = local.asset_bucket
      }

      env {
        name  = "TRACING_ENABLED"
        value = "true"
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project
      }

      env {
        name  = "PUBSUB_TOPIC"
        value = var.pubsub_task_topic
      }

      env {
        name  = "PUBSUB_SUBSCRIPTION"
        value = var.pubsub_task_subscription
      }

      env {
        name  = "CORS_DOMAIN"
        value = var.vercel_domain
      }

      env {
        name  = "SERVICE_TO_SERVICE_SECRET"
        value = var.service_to_service_secret
      }

      env {
        name  = "CLAUDE_REPORT_GENERATION"
        value = "true"
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

resource "google_cloud_run_v2_service" "job_runner_server" {
  name     = "${var.project_slug}-job-runner-server"
  location = var.region


  template {
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }


    service_account                  = google_service_account.cloud_run_service_account.email
    timeout                          = "900s"
    max_instance_request_concurrency = 30

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }


    containers {
      image   = "${var.region}-docker.pkg.dev/${var.project}/${var.project_slug}/job-runner:latest"
      command = ["yarn", "run-server"]

      resources {
        limits = {
          cpu    = "1"
          memory = "4Gi"
        }
      }

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "CLAUDE_REPORT_GENERATION"
        value = "true"
      }

      env {

        name  = "SQL_URI"
        value = "socket://${urlencode(var.database_user)}:${urlencode(var.database_password)}@${urlencode("/cloudsql/${google_sql_database_instance.instance.connection_name}")}/${var.project_slug}"
      }

      env {
        name  = "ML_SERVICE_URI"
        value = google_cloud_run_v2_service.springtime.uri
      }

      env {
        name  = "ASSET_BUCKET"
        value = local.asset_bucket
      }

      env {
        name  = "TIKA_CLIENT"
        value = "${google_cloud_run_v2_service.tika.uri}/tika"
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project
      }

      env {
        name  = "PUBSUB_TOPIC"
        value = var.pubsub_task_topic
      }

      env {
        name  = "PUBSUB_SUBSCRIPTION"
        value = var.pubsub_task_subscription
      }

      env {
        name  = "SERVICE_TO_SERVICE_SECRET"
        value = var.service_to_service_secret
      }

      env {
        name  = "TRACING_ENABLED"
        value = "true"
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


// policies

data "google_iam_policy" "no_auth" {
  binding {
    role = "roles/run.invoker"

    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_v2_service_iam_policy" "api_public_access" {
  location    = google_cloud_run_v2_service.api.location
  project     = google_cloud_run_v2_service.api.project
  name        = google_cloud_run_v2_service.api.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}

resource "google_cloud_run_v2_service_iam_policy" "springtime_public_access" {
  location    = google_cloud_run_v2_service.springtime.location
  project     = google_cloud_run_v2_service.springtime.project
  name        = google_cloud_run_v2_service.springtime.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}

resource "google_cloud_run_v2_service_iam_policy" "tika_public_access" {
  location    = google_cloud_run_v2_service.tika.location
  project     = google_cloud_run_v2_service.tika.project
  name        = google_cloud_run_v2_service.tika.name
  policy_data = data.google_iam_policy.no_auth.policy_data
}


resource "vercel_project" "front_end" {
  name      = var.project_slug
  framework = "nextjs"
  git_repository = {
    type              = "github"
    repo              = "${var.repo_owner}/${var.github_repo}"
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
      key    = "NEXT_PUBLIC_API_ENDPOINT"
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
  name        = var.auth0_client_name
  description = "Frontend app"
  app_type    = "spa"
  callbacks = [
    "https://www.${var.vercel_domain}/api/auth/callback",
    "https://${var.vercel_domain}/api/auth/callback"
  ]

  allowed_logout_urls = [
    "https://www.${var.vercel_domain}",
    "https://${var.vercel_domain}"
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
    primary         = "#2B1657"
    page_background = "#2B1657"
  }
  font {
    url = "https://cdnjs.cloudflare.com/ajax/libs/lato-font/3.0.0/fonts/lato-normal/lato-normal.woff2"
  }

}


resource "auth0_connection" "google" {
  name     = "google"
  strategy = "google-oauth2"

}


resource "auth0_resource_server" "backend" {
  name                                            = "${var.project_slug}-backend"
  identifier                                      = "${var.project_slug}-api"
  enforce_policies                                = true
  allow_offline_access                            = true
  skip_consent_for_verifiable_first_party_clients = true

}


resource "auth0_prompt_custom_text" "auth0_custom_copy" {
  prompt   = "login"
  language = "en"
  body = jsonencode(
    {
      "login" : {
        "buttonText" : "Sign in",
        "title" : "Welcome",
      }
    }
  )
}


resource "google_pubsub_topic" "default" {
  name = var.pubsub_task_topic
}

resource "google_pubsub_topic" "task_queue_dead_letter" {
  name = "${var.pubsub_task_topic}-dead-letter"
}

resource "google_pubsub_subscription" "subscription" {
  name  = var.pubsub_task_subscription
  topic = google_pubsub_topic.default.name
  # 300 seconds = 5 minutes
  ack_deadline_seconds = 300


  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.task_queue_dead_letter.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "300s"
  }

  push_config {
    push_endpoint = google_cloud_run_v2_service.job_runner_server.uri
    oidc_token {
      service_account_email = google_service_account.cloud_run_service_account.email
    }
    attributes = {
      x-goog-version = "v1"
    }
  }
  depends_on = [google_cloud_run_v2_service.job_runner_server]
}

resource "google_pubsub_subscription" "dead_letter_subscription" {
  name  = "${var.pubsub_task_subscription}-dead-letter"
  topic = google_pubsub_topic.task_queue_dead_letter.name
  # 300 seconds = 5 minutes
  ack_deadline_seconds = 300

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.job_runner_server.uri}/dead-letter"
    oidc_token {
      service_account_email = google_service_account.cloud_run_service_account.email
    }
    attributes = {
      x-goog-version = "v1"
    }
  }


  depends_on = [google_cloud_run_v2_service.job_runner_server]
}


## Service Accounts


resource "google_service_account" "cloud_run_service_account" {
  account_id   = "cloud-run-service-account-v6"
  display_name = "Cloud run service account"
}

resource "google_project_iam_member" "cloudrun_service_account_sql_role" {
  project = var.project
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_project_iam_member" "cloudrun_service_profile_agent" {
  project = var.project
  role    = "roles/cloudprofiler.agent"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_project_iam_member" "cloudrun_service_trace_agent" {
  project = var.project
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_project_iam_member" "cloudrun_service_metrics" {
  project = var.project
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_project_iam_member" "cloudrun_service_account_storage_role" {
  project = var.project
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}


resource "google_project_iam_member" "service_account_token_creator" {
  project = var.project
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_project_iam_member" "cloud_run_service_binding" {
  project = var.project
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}

resource "google_project_iam_member" "pubsub_publisher" {
  project = var.project
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run_service_account.email}"
}


resource "google_project_iam_member" "project" {
  project = google_project.project.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_project.project.number}@cloudservices.gserviceaccount.com"
}



