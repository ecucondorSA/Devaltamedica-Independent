variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "altamedica.com"
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
  default     = ""
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention days must be between 1 and 35."
  }
}

variable "instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = map(list(string))
  default = {
    general = ["t3.medium", "t3.large"]
    monitoring = ["t3.large"]
    database = ["t3.micro", "t3.small"]
  }
}

variable "enable_autoscaling" {
  description = "Enable EKS cluster autoscaling"
  type        = bool
  default     = true
}

variable "min_nodes" {
  description = "Minimum number of nodes in EKS cluster"
  type        = number
  default     = 1
  
  validation {
    condition     = var.min_nodes >= 1
    error_message = "Minimum nodes must be at least 1."
  }
}

variable "max_nodes" {
  description = "Maximum number of nodes in EKS cluster"
  type        = number
  default     = 10
  
  validation {
    condition     = var.max_nodes > var.min_nodes
    error_message = "Maximum nodes must be greater than minimum nodes."
  }
}

variable "enable_encryption" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "enable_logging" {
  description = "Enable CloudWatch logging"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
  
  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 365
    error_message = "Log retention days must be between 1 and 365."
  }
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default = {
    Project     = "AltaMedica"
    ManagedBy   = "Terraform"
    Owner       = "DevOps Team"
  }
}
