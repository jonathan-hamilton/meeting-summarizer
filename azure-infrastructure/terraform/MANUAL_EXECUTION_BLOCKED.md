# 🚫 MANUAL TERRAFORM EXECUTION BLOCKED

## ⚠️ WARNING: DO NOT RUN TERRAFORM MANUALLY

This Terraform configuration is designed to be executed **ONLY** through the GitHub Actions CI/CD pipeline.

### Why Manual Execution is Prohibited:

1. **State Management**: Terraform state is managed in Azure Storage with proper locking
2. **Environment Consistency**: CI/CD ensures consistent variable and secret management
3. **Audit Trail**: All infrastructure changes must be tracked through Git commits
4. **Security**: Sensitive credentials are managed through GitHub secrets and Azure OIDC
5. **Approval Gates**: Production changes require proper review and approval

### ❌ DO NOT RUN:
- `terraform plan`
- `terraform apply`
- `terraform destroy`
- `terraform import`
- Any other terraform commands

### ✅ CORRECT PROCESS:

#### For Development Environment:
1. Make your Terraform changes
2. Commit and push to any branch
3. GitHub Actions will automatically deploy to development

#### For Production Environment:
1. Ensure changes are merged to `main` branch
2. Navigate to GitHub Actions
3. Run "Deploy to Production" workflow
4. Wait for approval from authorized team members
5. Monitor deployment progress

### 🆘 Emergency Procedures:

If you absolutely must make emergency infrastructure changes:

1. **Contact DevOps Team Lead** for authorization
2. **Document emergency justification** in incident ticket
3. **Use emergency CI/CD workflow** with skip flags if available
4. **Never bypass CI/CD system** - it contains critical safety checks

### 📞 Support Contacts:

- **DevOps Team**: [Slack: #devops-team]
- **Emergency**: [On-call rotation]
- **Infrastructure Issues**: [GitHub Issues]

---

**This directive is enforced for:**
- Infrastructure consistency
- Security compliance  
- Change management
- Audit requirements
- Team safety

**Last Updated**: October 11, 2025