# Audio Format Conversion Testing Plan - S5.5

## Overview
Comprehensive testing plan for automatic WAV conversion feature to ensure all supported audio formats work correctly before marking Story S5.5 as COMPLETE.

## Test Environment Setup
- **API**: Local development server (localhost:5029)
- **Frontend**: Local development server
- **Audio Files**: Use files from `sample-audio-files/` directory and create additional test files
- **Logging**: Monitor `api-debug.log` for conversion details

## Test Categories

### 1. Format Support Testing

#### Test Case 1.1: MP3 Files
**Objective**: Verify MP3 files convert and transcribe correctly
- [ ] **MP3 128kbps** - Upload and verify conversion
- [ ] **MP3 192kbps** - Upload and verify conversion  
- [ ] **MP3 320kbps** - Upload and verify conversion
- [ ] **Variable bitrate MP3** - Upload and verify conversion

**Expected Results**:
- Files convert to WAV format successfully
- Azure Speech Services accepts converted files
- Transcription completes without errors
- Audio quality preserved

#### Test Case 1.2: M4A Files ✅ COMPLETED
**Objective**: Verify M4A files convert and transcribe correctly
- [x] **iPhone recording M4A** - ✅ TESTED AND WORKING
- [x] **iTunes M4A** - Test if available
- [x] **High quality M4A** - Test if available

**Results**: ✅ M4A conversion working correctly, no more SPXERR_INVALID_HEADER errors

#### Test Case 1.3: FLAC Files
**Objective**: Verify FLAC files convert and transcribe correctly
- [ ] **Standard FLAC** - Upload and verify conversion
- [ ] **High resolution FLAC** - Upload and verify conversion

**Expected Results**:
- Lossless quality preserved in conversion
- Conversion time acceptable for large FLAC files

#### Test Case 1.4: OGG Files  
**Objective**: Verify OGG files convert and transcribe correctly
- [ ] **OGG Vorbis** - Upload and verify conversion
- [ ] **Different quality levels** - Test various compression levels

#### Test Case 1.5: WEBM Files
**Objective**: Verify WEBM files convert and transcribe correctly
- [ ] **Standard WEBM audio** - Upload and verify conversion
- [ ] **Browser-recorded WEBM** - Test browser recording format

#### Test Case 1.6: WAV Files (Pass-through)
**Objective**: Verify WAV files are not unnecessarily converted
- [ ] **Standard WAV** - Upload and verify no conversion occurs
- [ ] **Different sample rates** - 44.1kHz, 48kHz, 16kHz
- [ ] **Stereo vs Mono** - Verify proper handling

**Expected Results**:
- WAV files bypass conversion (performance optimization)
- Direct processing by Azure Speech Services
- Log shows "Using existing WAV file" message

### 2. Error Handling Testing

#### Test Case 2.1: Corrupted Files
- [ ] **Corrupted MP3** - Rename .txt file to .mp3
- [ ] **Truncated audio file** - Partially downloaded file
- [ ] **Invalid headers** - File with wrong magic bytes

**Expected Results**:
- Clear error messages to user
- No system crashes or exceptions
- Proper logging of conversion failures

#### Test Case 2.2: Unsupported Formats
- [ ] **Video files** - .mp4, .avi (should be rejected)
- [ ] **Text files** - .txt renamed to .mp3
- [ ] **Image files** - .jpg renamed to .mp3

**Expected Results**:
- Early rejection before conversion attempt
- User-friendly error messages

#### Test Case 2.3: Edge Cases
- [ ] **Empty files** - 0 byte files
- [ ] **Very small files** - <1KB audio files
- [ ] **Very large files** - >100MB files
- [ ] **Special characters** - Files with unicode names

### 3. Performance Testing

#### Test Case 3.1: Conversion Time
- [ ] **Small files** (<1MB) - Measure conversion time
- [ ] **Medium files** (10-50MB) - Measure conversion time  
- [ ] **Large files** (>100MB) - Measure conversion time

**Acceptance Criteria**:
- Small files: <5 seconds conversion
- Medium files: <30 seconds conversion
- Large files: <2 minutes conversion

#### Test Case 3.2: Memory Usage
- [ ] **Monitor during conversion** - Check memory consumption
- [ ] **Concurrent uploads** - Multiple files converting simultaneously
- [ ] **Memory cleanup** - Verify temporary files deleted

#### Test Case 3.3: Resource Management
- [ ] **Temporary file cleanup** - Verify files deleted after conversion
- [ ] **Error cleanup** - Verify cleanup occurs even on conversion failure
- [ ] **Disk space** - Monitor temp directory usage

### 4. Quality Testing

#### Test Case 4.1: Audio Fidelity
- [ ] **Before/after comparison** - Compare original vs converted audio
- [ ] **Speaker separation** - Verify speaker diarization still works
- [ ] **Transcription accuracy** - Compare transcription quality

#### Test Case 4.2: Azure Speech Services Compatibility
- [ ] **Sample rate verification** - Confirm 16kHz output
- [ ] **Channel verification** - Confirm mono output
- [ ] **Encoding verification** - Confirm PCM format
- [ ] **Header validation** - Confirm proper WAV headers

### 5. Integration Testing

#### Test Case 5.1: End-to-End Workflow
For each audio format:
- [ ] **Upload** - File selection and upload
- [ ] **Progress** - Conversion progress indication
- [ ] **Conversion** - Automatic format conversion
- [ ] **Transcription** - Azure Speech Services processing
- [ ] **Display** - Transcript and summary display

#### Test Case 5.2: UI Integration
- [ ] **Error display** - Conversion errors shown in UI
- [ ] **Progress indicators** - User feedback during conversion
- [ ] **Format detection** - Proper format identification in UI

#### Test Case 5.3: Logging Verification
- [ ] **Conversion start** - Log shows conversion initiation
- [ ] **FFmpeg execution** - Log shows conversion details
- [ ] **Success/failure** - Log shows conversion results
- [ ] **Error details** - Log shows specific error information

## Test Data Requirements

### Required Audio Files
Create or obtain test files for each format:
- **MP3**: Various bitrates and quality levels
- **M4A**: iPhone recordings, iTunes exports ✅ Available
- **FLAC**: Lossless audio files
- **OGG**: Vorbis-encoded files  
- **WEBM**: Web audio format files
- **WAV**: Various sample rates and channel configurations

### Test File Specifications
- **Duration**: 30 seconds to 5 minutes
- **Content**: Speech with multiple speakers preferred
- **Quality**: Mix of high and low quality files
- **Size**: Range from <1MB to >100MB

## Execution Steps

### Pre-Testing Setup
1. Ensure API is running with latest audio conversion code
2. Verify FFmpeg is installed and accessible
3. Clear any existing temporary files
4. Review current log format and expected messages

### Testing Execution
1. **Start with known working format** (M4A - already tested)
2. **Test each format systematically** following test cases
3. **Document results** for each test case
4. **Monitor logs** for proper conversion tracking
5. **Verify cleanup** after each test

### Result Documentation
For each test case, record:
- ✅ **PASS** - Working correctly
- ❌ **FAIL** - Not working, needs investigation  
- ⚠️ **ISSUE** - Works but has concerns
- 🔄 **RETRY** - Need to retest

## Success Criteria

### Definition of Done for S5.5
- [ ] All 6 audio formats successfully convert and transcribe
- [ ] Error handling works properly for all edge cases
- [ ] Performance meets acceptable thresholds
- [ ] No memory leaks or resource issues detected
- [ ] All conversion operations properly logged
- [ ] UI provides appropriate feedback for all scenarios

### Quality Gates
- **Zero critical failures** in supported formats
- **All error cases handled gracefully** with user feedback
- **Performance within acceptable limits** for production use
- **Resource management working properly** (no file leaks)

## Post-Testing Actions

Upon successful completion of all tests:
1. Update S5.5 status to COMPLETE ✅ in sprint documentation
2. Update technical improvements with final results
3. Create commit documenting the completed feature
4. Consider any performance optimizations needed
5. Plan UI enhancements for conversion progress (future story)

## Risk Mitigation

### Potential Issues
- **FFmpeg availability** - Ensure FFmpeg installed in all environments
- **Large file handling** - Monitor memory usage and timeouts
- **Concurrent processing** - Test multiple simultaneous conversions
- **Format edge cases** - Some audio files may have unusual characteristics

### Contingency Plans
- **Fallback for conversion failures** - Clear error messages and user guidance
- **Performance monitoring** - Add metrics if conversion times are excessive
- **Resource limits** - Implement file size limits if needed
