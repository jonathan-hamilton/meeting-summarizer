# Update Documentation and Commit Workflow

## Command: `update-commit`

This prompt handles the complete workflow for updating sprint documentation and committing completed work to git.

## Workflow Steps

### Step 1: Git Status Check

- Before executing any git operations, Step 1 needs to be complete
- Run `git status` to show current changes
- Identify modified files to inform documentation updates

### Step 2: Comprehensive Documentation Update

- Use results of git changes and any changed files
- Identify the current story being worked on from context
- Before making updates to documentation, present proposed changes to the User for confirmation

#### Core Documentation Updates (Always Update):

1. **Sprint Progress Documentation**
   - Update the appropriate `docs/sprints/sprint_*_stories.md` file
   - Mark story status as COMPLETE with ✅
   - Add completion timestamp and summary details
   - Update implementation progress section
   - Document any technical notes or deviations from original plan

2. **Project Status Dashboard**
   - Update the **root README.md** file to reflect current sprint status
   - Update feature completion status and current sprint progress
   - Ensure status section reflects latest accomplishments

3. **Requirements Tracking**
   - Update `docs/requirements/requirements-roadmap.md` to reflect implemented requirements
   - Mark completed requirements and update progress tracking
   - Document any new requirements discovered during implementation

#### Technical Documentation Updates (Update If Applicable):

4. **Technical Health Tracking**
   - Update `docs/features/technical-debt.md` if technical debt was addressed or created
   - Update `docs/features/technical-improvements.md` if improvements were implemented
   - Document performance optimizations or refactoring completed

5. **Architecture Documentation**
   - Update `docs/features/architecture.md` if architectural changes were made
   - Document new components, services, or integration patterns
   - Update system diagrams if structure changed

#### Feature-Specific Documentation Updates (Check If Story-Related):

6. **Feature Requirements**
   - Review and update relevant files in `docs/features/` that relate to the completed story:
     - `speaker-*-requirements.md` for speaker management stories
     - `state-management-redesign.md` for state architecture changes
     - `transcription-alternatives.md` for audio processing stories
   
7. **Detailed Requirements**
   - Check relevant files in `docs/requirements/` for updates:
     - `speaker-management.md`, `audio-processing-and-file-handling.md`, etc.
   - Update specific requirement status and implementation notes

#### Strategic Documentation Updates (Update If Vision/Planning Affected):

8. **Planning Documentation**
   - Update `docs/planning/vision.md` if story completion affects long-term product vision
   - Update `docs/planning/demo-tour-steps.md` if demo functionality was modified
   - Review `docs/planning/monetization-analysis.md` if business features were implemented

#### Final Review
- Present all proposed documentation changes to user for confirmation
- Ensure all documentation is synchronized with code changes
- Verify story completion is properly tracked across all relevant files

### Step 3: Commit with Smart Message

- Generate intelligent commit message based on:
  - Story number and title
  - Key features implemented
  - Backend/frontend changes
  - Technical improvements
  - Acceptance criteria completion
- Use conventional commit format: `feat:`, `fix:`, `docs:`, etc.
- Include story reference and completion status

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
- Modified files in git status to determine story scope

## Documentation Update Intelligence

The system will determine which documentation to update by:

- **File Change Analysis**: Analyzing git diff to identify affected areas (frontend, backend, both)
- **Story Context**: Understanding story type (feature, technical, infrastructure) to target relevant docs
- **Dependency Mapping**: Identifying related requirements and architecture components
- **Impact Assessment**: Determining if changes affect broader system architecture or planning

## Documentation Update Checklist

### Always Update:
- [ ] `docs/sprints/sprint_X_stories.md` - Story completion status
- [ ] `README.md` - Project status dashboard
- [ ] `docs/requirements/requirements-roadmap.md` - Requirements tracking

### Update If Applicable:
- [ ] `docs/features/technical-debt.md` - Technical debt changes
- [ ] `docs/features/technical-improvements.md` - Improvements made
- [ ] `docs/features/architecture.md` - Architecture changes

### Story-Specific Updates:
- [ ] `docs/features/speaker-*-requirements.md` - For speaker management stories
- [ ] `docs/features/state-management-redesign.md` - For state architecture changes
- [ ] `docs/requirements/audio-processing-and-file-handling.md` - For audio stories
- [ ] `docs/requirements/speaker-management.md` - For speaker functionality
- [ ] Other relevant requirement files based on story scope

### Strategic Updates (If Applicable):
- [ ] `docs/planning/vision.md` - If affecting product direction
- [ ] `docs/planning/demo-tour-steps.md` - If demo functionality changed
- [ ] `docs/planning/monetization-analysis.md` - If business features added

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
