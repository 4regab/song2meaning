# Requirements Document

## Introduction

This feature enables users to share song analysis results through unique links and implements a caching system using Supabase to reduce API calls to Gemini AI. When a user analyzes a song, the result is stored in Supabase with a unique shareable link. If another user searches for the same song (artist + title combination), the cached result is returned instead of making a new API call to Gemini.

## Requirements

### Requirement 1

**User Story:** As a user, I want to share my song analysis results with others through a unique link, so that I can discuss the meaning and interpretation with friends and social media followers.

#### Acceptance Criteria

1. WHEN a song analysis is completed successfully THEN the system SHALL generate a unique shareable link for that analysis
2. WHEN a user clicks the share button THEN the system SHALL copy the shareable link to their clipboard
3. WHEN someone visits a shared link THEN the system SHALL display the complete song analysis with artist, title, and all analysis sections
4. WHEN a shared link is accessed THEN the system SHALL display a "Analyze Another Song" button to encourage further engagement
5. IF a shared link contains an invalid or non-existent analysis ID THEN the system SHALL redirect to the home page with an appropriate error message

### Requirement 2

**User Story:** As a system administrator, I want to cache song analysis results in Supabase, so that repeated searches for the same song don't consume unnecessary Gemini API credits.

#### Acceptance Criteria

1. WHEN a song analysis is requested THEN the system SHALL first check if a cached result exists for the artist-title combination
2. IF a cached result exists and is valid THEN the system SHALL return the cached analysis without calling Gemini API
3. WHEN a new song analysis is completed THEN the system SHALL store the result in Supabase with artist, title, analysis data, and timestamp
4. WHEN storing analysis results THEN the system SHALL normalize artist and song title (lowercase, trimmed) for consistent cache key generation
5. WHEN checking cache THEN the system SHALL use case-insensitive matching for artist and song title combinations

### Requirement 3

**User Story:** As a user, I want to see when an analysis was originally created and if it came from cache, so that I understand the freshness and source of the information.

#### Acceptance Criteria

1. WHEN displaying a song analysis THEN the system SHALL show the original analysis date
2. IF an analysis came from cache THEN the system SHALL display a subtle indicator that the result was previously analyzed
3. WHEN showing cached results THEN the system SHALL display how many times this song has been analyzed
4. WHEN an analysis is shared THEN the shared page SHALL include the original analysis timestamp

### Requirement 4

**User Story:** As a developer, I want the system to handle Supabase connection errors gracefully, so that the application continues to work even when the database is unavailable.

#### Acceptance Criteria

1. IF Supabase is unavailable during cache lookup THEN the system SHALL proceed with a fresh Gemini API call
2. IF Supabase is unavailable during result storage THEN the system SHALL log the error but still return the analysis to the user
3. WHEN database errors occur THEN the system SHALL not expose internal error details to the user
4. IF sharing functionality fails due to database issues THEN the system SHALL show an appropriate user-friendly error message

