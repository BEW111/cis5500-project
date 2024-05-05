variable "github_repo_owner" {
  default     = "bew111"
  type        = string
  description = "Name of the GH repo owner, used the pull the docker images"
}

variable "github_repo_name" {
  default     = "cis5500-project"
  type        = string
  description = "Name of the GH repo, used to pull the docker images"
}

variable "region" {
  default     = "us-east-1"
  type        = string
  description = "Launch region for the ECS cluster"
}

variable "cluster_name" {
  default     = "cis5500-cluster"
  type        = string
  description = "Name of the ECS cluster"
}

///
// ENV VARIABLES
// These are set in .auto.tfvars
///
variable "aws_account_id" {
  type = string
}

variable "RDS_HOST" {
  type = string
}

variable "RDS_PASSWORD" {
  type = string
}

variable "GOOGLE_CLIENT_ID" {
  type = string
}

variable "GOOGLE_CLIENT_SECRET" {
  type = string
}

variable "SPOTIFY_CLIENT_ID" {
  type = string
}

variable "SPOTIFY_CLIENT_SECRET" {
  type = string
}
