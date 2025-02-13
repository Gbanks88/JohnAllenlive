terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

variable "project_id" {
  description = "The ID of the GCP project"
  type        = string
}

variable "domain_name" {
  description = "The domain name for the website"
  type        = string
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
  default     = "us-central1"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "services" {
  for_each = toset([
    "compute.googleapis.com",
    "dns.googleapis.com",
    "storage.googleapis.com",
    "monitoring.googleapis.com",
    "clouderrorreporting.googleapis.com"
  ])
  service = each.key
  disable_on_destroy = false
}

# Create main storage bucket
resource "google_storage_bucket" "cg4f_site" {
  name          = "cg4f-site-${var.project_id}"
  location      = "US"
  force_destroy = true

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Allow public access to the bucket
resource "google_storage_bucket_iam_member" "cg4f_site_public" {
  bucket = google_storage_bucket.cg4f_site.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Create development bucket
resource "google_storage_bucket" "dev" {
  name          = "cg4f-site-dev-${var.project_id}"
  location      = "US"
  force_destroy = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Create backup bucket
resource "google_storage_bucket" "backup" {
  name          = "cg4f-site-backup-${var.project_id}"
  location      = "US"
  force_destroy = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# Create logs bucket
resource "google_storage_bucket" "cg4f_site_logs" {
  name          = "cg4f-site-logs-${var.project_id}"
  location      = "US"
  force_destroy = false

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# Reserve a static IP address
resource "google_compute_global_address" "cg4f_site" {
  name = "cg4f-site-ip"
}

# Create SSL certificate
resource "google_compute_managed_ssl_certificate" "cg4f_site" {
  name = "cg4f-site-cert-new"

  managed {
    domains = [var.domain_name]
  }
}

# Create backend bucket
resource "google_compute_backend_bucket" "cg4f_site" {
  name        = "cg4f-site-backend"
  bucket_name = google_storage_bucket.cg4f_site.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl          = 86400
    negative_caching = true
  }
}

# Create URL map for HTTPS
resource "google_compute_url_map" "cg4f_site" {
  name            = "cg4f-site-url-map"
  default_service = google_compute_backend_bucket.cg4f_site.id
}

# Create HTTPS proxy
resource "google_compute_target_https_proxy" "cg4f_site" {
  name             = "cg4f-site-https-proxy"
  url_map          = google_compute_url_map.cg4f_site.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cg4f_site.id]
}

# Create forwarding rule for HTTPS
resource "google_compute_global_forwarding_rule" "cg4f_site" {
  name       = "cg4f-site-lb"
  target     = google_compute_target_https_proxy.cg4f_site.id
  port_range = "443"
  ip_address = google_compute_global_address.cg4f_site.address
}

# Create URL map for HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "http-redirect"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

# Create HTTP proxy for redirect
resource "google_compute_target_http_proxy" "http_redirect" {
  name    = "http-redirect-proxy"
  url_map = google_compute_url_map.http_redirect.id
}

# Create forwarding rule for HTTP redirect
resource "google_compute_global_forwarding_rule" "http_redirect" {
  name       = "http-redirect-lb"
  target     = google_compute_target_http_proxy.http_redirect.id
  port_range = "80"
  ip_address = google_compute_global_address.cg4f_site.address
}

# Create Cloud DNS zone
resource "google_dns_managed_zone" "cg4f_site" {
  name        = "cg4f-site-zone"
  dns_name    = "${var.domain_name}."
  description = "DNS zone for ${var.domain_name}"
}

# Create DNS A record
resource "google_dns_record_set" "cg4f_site_a" {
  name         = google_dns_managed_zone.cg4f_site.dns_name
  managed_zone = google_dns_managed_zone.cg4f_site.name
  type         = "A"
  ttl          = 300
  rrdatas      = [google_compute_global_address.cg4f_site.address]
}

# Create security policy
resource "google_compute_security_policy" "cg4f_site" {
  name = "cg4f-site-security-policy"

  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "default rule"
  }
}

# Create uptime check
resource "google_monitoring_uptime_check_config" "cg4f_site" {
  display_name = "cg4f-site-uptime-check"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/"
    port         = "443"
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain_name
    }
  }
}

# Create notification channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification Channel"
  type         = "email"
  labels = {
    email_address = "admin@${var.domain_name}"
  }
}

# Create alert policy
resource "google_monitoring_alert_policy" "cg4f_site_uptime" {
  display_name = "Uptime Alert Policy"
  combiner     = "OR"
  conditions {
    display_name = "Uptime Check Failure"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      trigger {
        count = 1
      }
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_NEXT_OLDER"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]

  alert_strategy {
    auto_close = "1800s"
  }
}

# Create a VPC network
resource "google_compute_network" "vpc_network" {
  name                    = "cg-network"
  auto_create_subnetworks = false
}

# Create a subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "cg-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# Create a firewall rule to allow HTTP, HTTPS, and SSH
resource "google_compute_firewall" "allow_web" {
  name    = "allow-web"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# Create a static IP for the server
resource "google_compute_address" "server_ip" {
  name   = "cg-server-ip"
  region = var.region
}

# Create the server instance
resource "google_compute_instance" "server" {
  name         = "cg-innovation-hub"
  machine_type = "e2-medium"
  zone         = "${var.region}-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
      size  = 20
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.self_link
    access_config {
      nat_ip = google_compute_address.server_ip.address
    }
  }

  metadata = {
    ssh-keys = "admin:${file("~/.ssh/id_rsa.pub")}"
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y nginx
    cat <<'EOT' > /var/www/html/index.html
    <!DOCTYPE html>
    <html>
    <head>
        <title>CG Innovation Hub</title>
        <style>
            body { 
                font-family: Arial, sans-serif;
                margin: 40px;
                background: #1a1a2e;
                color: white;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                text-align: center;
            }
            h1 { color: #4CAF50; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to CG Innovation Hub</h1>
            <p>Your gateway to global innovation and collaboration.</p>
            <p>Server Status: Online</p>
        </div>
    </body>
    </html>
    EOT
    systemctl enable nginx
    systemctl start nginx
  EOF

  tags = ["web-server"]
}

# Output the server's IP address
output "server_ip" {
  value = google_compute_address.server_ip.address
}

output "nameservers" {
  value = google_dns_managed_zone.cg4f_site.name_servers
}

output "load_balancer_ip" {
  value = google_compute_global_address.cg4f_site.address
}
