# Commit and Push Workflow

## Command: `commit-push`

This prompt handles the complete workflow for updating sprint documentation and committing completed work to git.

## Workflow Steps

### Step 1: Update Sprint Documentation

- Identify the current story being worked on from context
- Update the appropriate `docs/sprint_*_stories.md` file
- Mark story status as COMPLETE with ✅
- Add completion timestamp and summary details
- Update implementation progress section
- Document any technical notes or deviations from original plan
- Update the technical-debt.md where/if appropriate
- Before making updates to documentation, present propsed changes to the User for confirmation

### Step 2: Git Status Check

- Before executing any git operations, Step 1 needs to be complete
- Run `git status` to show current changes
- Present changes to user for confirmation
- Wait for user approval before proceeding

### Step 3: Stage Changes

- Run `git add .` to stage all changes
- Confirm staging completed successfully

### Step 4: Commit with Smart Message

- Generate intelligent commit message based on:
  - Story number and title
  - Key features implemented
  - Backend/frontend changes
  - Technical improvements
  - Acceptance criteria completion
- Use conventional commit format: `feat:`, `fix:`, `docs:`, etc.
- Include story reference and completion status

### Step 5: Push to Remote

- Run `git push origin main`
- Confirm push completed successfully
- Provide completion summary

## Example Commit Message Format

```text
feat: Complete S2.2 Speaker Role Mapping Interface

- Implement backend SpeakerMapping models and REST API endpoints
- Create frontend SpeakerMappingDialog and integration components  
- Add real-time transcript updates with resolved speaker names
- Integrate Material-UI components with TypeScript type safety
- Resolve build system issues and test file conflicts

Story: S2.2 Speaker Role Mapping Interface
Status: COMPLETE ✅
Acceptance Criteria: All requirements met
```

## Story Status Update Format

When updating sprint documentation, use this format:

```markdown
### S2.X Status: COMPLETE ✅ (Story Title)

**Completion Date:** [Current Date]

**Implementation Summary:**
- [Key feature 1 implemented]
- [Key feature 2 implemented]
- [Technical improvements made]

**Acceptance Criteria Status:**
✅ [Requirement 1] - Implemented and tested
✅ [Requirement 2] - Implemented and tested
✅ [Requirement 3] - Implemented and tested

**Technical Notes:**
- [Any deviations from original plan]
- [Architecture decisions made]
- [Future considerations]

**Integration Points:**
- [How this integrates with other stories]
- [Dependencies satisfied]
```

## Usage Instructions

1. Ensure you are in the project root directory
2. Use the command `#commit-push` when story work is complete
3. The system will automatically:
   - Detect which story you've been working on
   - Update the appropriate sprint documentation
   - Guide you through the git workflow
   - Generate appropriate commit messages
   - Handle the complete commit and push process

## Smart Story Detection

The system will identify the current story by:

- Recent file changes and commit patterns
- Context from conversation history
- Active file being edited
- Sprint story dependencies and progression

## Error Handling

If any step fails:

- The process will stop at the failed step
- Clear error message will be provided
- Instructions for manual recovery will be given
- Process can be resumed from the failed step

## Supported Story Types

- Feature implementation (feat:)
- Bug fixes (fix:)
- Documentation updates (docs:)
- Test improvements (test:)
- Build system changes (build:)
- CI/CD improvements (ci:)

## Integration with Sprint Planning

This workflow automatically:

- Updates sprint progress tracking
- Maintains story dependency chains
- Documents completion status for project management
- Provides audit trail for development progress
- Enables sprint retrospective analysis
