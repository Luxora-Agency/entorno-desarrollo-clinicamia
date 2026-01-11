
#!/bin/bash

rename_model() {
  lower=$1
  pascal=$2
  sed -i '' "s/^model $lower {/model $pascal {\\n  @@map(\"$lower\")/" prisma/schema.prisma
  sed -i '' -E "s/^(\s+\w+\s+)$lower(\[\]|\?)?/\1$pascal\2/g" prisma/schema.prisma
}

rename_model "user_roles" "UserRole"
rename_model "roles" "Role"
rename_model "permissions" "Permission"
rename_model "role_permissions" "RolePermission"
rename_model "audit_logs" "AuditLog"
rename_model "workflow_approvals" "WorkflowApproval"
