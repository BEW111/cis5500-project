terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}
locals {
  client_image_tag = "ghcr.io/${var.github_repo_owner}/${var.github_repo_name}/frontend:latest"
  server_image_tag = "ghcr.io/${var.github_repo_owner}/${var.github_repo_name}/backend:latest"
}
provider "aws" {
  region = var.region
}
resource "aws_ecs_cluster" "cluster" {
  name = var.cluster_name
  # This uses up extra resources, but can set up logging
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
resource "aws_cloudwatch_log_group" "ecs_app_family_log_group" {
  name = "/ecs/app-family-cis5500"
  // Optionally you can set retention in days, the default is to keep logs forever
  // retention_in_days = 90
}
resource "aws_ecs_task_definition" "app" {
  family                   = "app-family-cis5500"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"  # Adjust based on your needs
  memory                   = "2048" # Adjust based on your needs
  execution_role_arn       = data.aws_iam_role.ecs_task_execution_role.arn
  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = local.client_image_tag
      cpu       = 256
      memory    = 1024
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
          protocol      = "tcp"
        }
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/app-family-cis5500"
          awslogs-region        = var.region
          awslogs-stream-prefix = "frontend"
        }
      }
    },
    {
      name      = "backend"
      image     = local.server_image_tag
      cpu       = 256
      memory    = 1024
      essential = true
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ],
      environment = [
        { "name" : "RDS_HOST", "value" : var.RDS_HOST },
        { "name" : "RDS_PASSWORD", "value" : var.RDS_HOST },
        { "name" : "GOOGLE_CLIENT_ID", "value" : var.GOOGLE_CLIENT_ID },
        { "name" : "GOOGLE_CLIENT_SECRET", "value" : var.GOOGLE_CLIENT_SECRET },
        { "name" : "SPOTIFY_CLIENT_ID", "value" : var.SPOTIFY_CLIENT_ID },
        { "name" : "SPOTIFY_CLIENT_SECRET", "value" : var.SPOTIFY_CLIENT_SECRET },
      ],
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/app-family-cis5500"
          awslogs-region        = var.region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])
}

// VPC configuration
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}


resource "aws_ecs_service" "app_service" {
  name            = "app-service-cis5500"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1 # Example count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    assign_public_ip = true
  }
}
# So that the ECS role can execute tasks
# For CREATING a role
# resource "aws_iam_role" "ecs_task_execution_role" {
#   name = "ecs_task_execution_role"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "ecs-tasks.amazonaws.com"
#         }
#       },
#     ]
#   })
# }
# For CREATING a policy
# resource "aws_iam_policy" "cloudwatch_logs_policy" {
#   name        = "ECSLogsPolicy"
#   description = "Allow ECS Task Execution Role to push logs to CloudWatch"
#   policy = jsonencode({
#     Version = "2012-10-17",
#     Statement = [
#       {
#         Effect = "Allow",
#         Action = [
#           "logs:CreateLogStream",
#           "logs:CreateLogGroup"
#         ],
#         Resource = "arn:aws:logs:*:*:*"
#       },
#       {
#         Effect = "Allow",
#         Action = [
#           "logs:PutLogEvents"
#         ],
#         Resource = [
#           "arn:aws:logs:*:*:log-group:/ecs/*:log-stream:*",
#           "arn:aws:logs:*:*:log-group:/ecs/*"
#         ]
#       }
#     ]
#   })
# }
# existing role/policy
data "aws_iam_role" "ecs_task_execution_role" {
  name = "ecs_task_execution_role"
}
data "aws_iam_policy" "cloudwatch_logs_policy" {
  arn = "arn:aws:iam::${var.aws_account_id}:policy/ECSLogsPolicy"
}
# Attach the policies to the role
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = data.aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_iam_role_policy_attachment" "cloudwatch_logs_policy_attachment" {
  role       = data.aws_iam_role.ecs_task_execution_role.name
  policy_arn = data.aws_iam_policy.cloudwatch_logs_policy.arn
}








# terraform {
#   required_providers {
#     aws = {
#       source  = "hashicorp/aws"
#       version = "~> 4.16"
#     }
#   }

#   required_version = ">= 1.2.0"
# }

# ///
# // Local variables
# ///
# locals {
#   client_image_tag = "ghcr.io/${var.github_repo_owner}/${var.github_repo_name}:client"
#   server_image_tag = "ghcr.io/${var.github_repo_owner}/${var.github_repo_name}:server"
# }


# ///
# // Provider
# ///
# provider "aws" {
#   region = var.region
# }

# ///
# // Load balancer
# ///
# # resource "aws_lb" "nlb" {
# #   name                             = "my-nlb"
# #   load_balancer_type               = "network"
# #   subnets                          = data.aws_subnets.default.ids
# #   enable_cross_zone_load_balancing = true
# #   internal                         = false // Set to false for internet-facing
# # }

# # resource "aws_eip" "nlb_ip" {
# #   vpc = true
# # }

# # resource "aws_lb_target_group" "nlb_tg" {
# #   name        = "my-nlb-tg"
# #   port        = 80
# #   protocol    = "TCP"
# #   vpc_id      = data.aws_vpc.default.id
# #   target_type = "ip"
# # }

# # resource "aws_lb_listener" "listener" {
# #   load_balancer_arn = aws_lb.nlb.arn
# #   port              = 80
# #   protocol          = "TCP"

# #   default_action {
# #     type             = "forward"
# #     target_group_arn = aws_lb_target_group.nlb_tg.arn
# #   }
# # }


# ///
# // ECS resources, tasks, and cloudwatch
# ///
# resource "aws_ecs_cluster" "cluster" {
#   name = var.cluster_name

#   # This uses up extra resources, but can set up logging
#   setting {
#     name  = "containerInsights"
#     value = "enabled"
#   }
# }

# resource "aws_cloudwatch_log_group" "ecs_app_family_log_group" {
#   name = "/ecs/app-family"
#   // Optionally you can set retention in days, the default is to keep logs forever
#   // retention_in_days = 90
# }

# resource "aws_ecs_task_definition" "app" {
#   family                   = "app-family"
#   network_mode             = "awsvpc"
#   requires_compatibilities = ["FARGATE"]
#   cpu                      = "512"
#   memory                   = "2048"
#   execution_role_arn       = data.aws_iam_role.ecs_task_execution_role.arn

#   container_definitions = jsonencode([
#     {
#       name      = "frontend"
#       image     = local.client_image_tag
#       cpu       = 256
#       memory    = 1024
#       essential = true
#       portMappings = [
#         {
#           containerPort = 3000
#           hostPort      = 3000
#           protocol      = "tcp"
#         }
#       ],
#       logConfiguration = {
#         logDriver = "awslogs"
#         options = {
#           awslogs-group         = "/ecs/app-family"
#           awslogs-region        = var.region
#           awslogs-stream-prefix = "frontend"
#         }
#       }
#     },
#     {
#       name      = "backend"
#       image     = local.server_image_tag
#       cpu       = 256
#       memory    = 1024
#       essential = true
#       portMappings = [
#         {
#           containerPort = 4000
#           hostPort      = 4000
#           protocol      = "tcp"
#         }
#       ],
#       environment = [
#         { "name" : "ATLAS_URI", "value" : var.atlas_uri },
#         { "name" : "COOKIE_SECRET", "value" : "any-string" },
#         { "name" : "SENDGRID_API_KEY", "value" : "SG.sendgrid-api-key-from-above" },
#         { "name" : "SENDGRID_EMAIL_ADDRESS", "value" : "sendgrid-sender-identity-email-from-above" }
#       ],
#       logConfiguration = {
#         logDriver = "awslogs"
#         options = {
#           awslogs-group         = "/ecs/app-family"
#           awslogs-region        = var.region
#           awslogs-stream-prefix = "backend"
#         }
#       }
#     }
#   ])
# }

# ///
# // VPC configuration
# ///
# data "aws_vpc" "default" {
#   default = true
# }

# data "aws_subnets" "default" {
#   filter {
#     name   = "vpc-id"
#     values = [data.aws_vpc.default.id]
#   }
# }

# ///
# // ECS service and discovery
# ///



# resource "aws_ecs_service" "app_service" {
#   name            = "app-service"
#   cluster         = aws_ecs_cluster.cluster.id
#   task_definition = aws_ecs_task_definition.app.arn
#   desired_count   = 1 # Example count
#   launch_type     = "FARGATE"

#   network_configuration {
#     subnets          = data.aws_subnets.default.ids
#     assign_public_ip = true
#   }

#   # load_balancer {
#   #   target_group_arn = aws_lb_target_group.nlb_tg.arn
#   #   container_name   = "frontend"
#   #   container_port   = 3000
#   # }

#   # depends_on = [aws_lb_listener.listener]
# }

# ///
# // ECS IAM roles
# ///
# # Declare based on existing roles
# data "aws_iam_role" "ecs_task_execution_role" {
#   name = "ecs_task_execution_role"
# }

# data "aws_iam_policy" "cloudwatch_logs_policy" {
#   arn = "arn:aws:iam::${var.aws_account_id}:policy/ECSLogsPolicy"
# }

# # Attach policies to roles
# resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
#   role       = data.aws_iam_role.ecs_task_execution_role.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
# }

# resource "aws_iam_role_policy_attachment" "cloudwatch_logs_policy_attachment" {
#   role       = data.aws_iam_role.ecs_task_execution_role.name
#   policy_arn = data.aws_iam_policy.cloudwatch_logs_policy.arn
# }
