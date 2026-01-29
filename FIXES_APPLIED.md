# Hostel Grievance System - Bug Fixes and Improvements

## Issue Identified
Complaints were not being stored in user profiles correctly. The problem was related to how JWT tokens were being parsed and how student_id was being retrieved from user_id.

## Root Causes
1. **Bearer Token Handling**: Authorization headers were being sent with raw JWT tokens instead of "Bearer {token}" format
2. **User ID vs Student ID**: The system was confusing `user_id` from the JWT token with `student_id` from the student table
3. **Token Parsing**: JWT tokens were not being properly extracted when sent as "Bearer {token}"
4. **Error Handling**: Missing error handling and validation in token parsing

## Changes Made

### 1. Frontend - Auth Utility (`frontend/src/utils/Auth.jsx`)
**Problem**: Authorization header was not using proper Bearer format
**Fix**: Updated to include "Bearer " prefix in Authorization header
```javascript
// Before
const headers = {
  "Content-Type": "application/json",
  "Authorization": authToken
};

// After
const headers = {
  "Content-Type": "application/json",
  "Authorization": authToken ? `Bearer ${authToken}` : ""
};
```

### 2. Backend - Complaint Controller (`backend/controller/complaintController.js`)

#### A. Fixed `decodeUser` Helper Function
- Added better logging and error handling
- Properly handles Bearer token format

#### B. Fixed `postComplaints` Endpoint
**Problems**:
- Was not properly converting user_id to student_id
- Had duplicate function definitions
- Missing student record auto-creation logic

**Improvements**:
- Properly retrieves student_id from the student table using user_id
- Auto-creates student record if it doesn't exist
- Better error messages and validation
- Proper Bearer token handling

#### C. Fixed `getAllComplaintsByUser` Endpoint
**Problem**: 
- Students' complaints were being filtered by user_id instead of student_id, causing incorrect results

**Fix**:
- Now properly converts user_id to student_id before querying complaints
- Returns empty array if no student record exists
- Better error handling

#### D. Fixed `putComplaintsByid` (Update Complaint Status)
**Changes**:
- Moved token parsing inside try-catch block
- Added proper Bearer token handling
- Added validation for complaint existence
- Returns proper error messages

#### E. Fixed `deleteComplaints` Endpoint
**Changes**:
- Added Bearer token parsing
- Added authorization check
- Added validation for complaint existence
- Returns descriptive response

#### F. Fixed `getUserType` Endpoint
**Changes**:
- Added Bearer token handling
- Added missing token validation

#### G. Fixed `getUserDetails` Endpoint
**Changes**:
- Added Bearer token handling
- Added proper error handling for missing token

#### H. Added Missing `debugUser` Endpoint
- Returns user information for debugging purposes
- Useful for troubleshooting token and user mapping issues

## How It Works Now

### Complaint Submission Flow:
1. User submits complaint from frontend
2. Frontend sends request with header: `Authorization: Bearer {jwtToken}`
3. Backend receives request and extracts Bearer token
4. Decodes JWT to get `user_id`
5. Queries student table to get `student_id` using `user_id`
6. If student record doesn't exist, auto-creates it
7. Stores complaint with proper `student_id`

### Complaint Retrieval Flow:
1. Student requests their complaints
2. Backend decodes JWT token from Authorization header
3. Extracts `user_id` from token
4. Queries student table to get `student_id`
5. Returns only complaints where `student_id` matches

### Database Schema (No Changes Needed)
The existing schema was correct:
- `users` table stores user authentication info with `user_id`
- `student` table maps `user_id` to `student_id` and stores student-specific info
- `complaint` table stores complaints linked to `student_id`

## Testing Recommendations

1. **Test Student Registration**: Ensure students are properly linked with student records
2. **Test Complaint Submission**: Verify complaints are saved with correct student_id
3. **Test Complaint Retrieval**: Verify students only see their own complaints
4. **Test as Warden**: Verify wardens can see all complaints and update them
5. **Test API Responses**: Check that all endpoints return proper error messages

## Debugging Tools

Use the debug endpoint to verify token and user mapping:
- **GET** `/debugUser` - Returns decoded token and user information
- Requires Authorization header with Bearer token

## Summary

All issues with storing complaints in user profiles have been fixed by:
- Properly handling Bearer token format throughout the backend
- Correctly mapping user_id to student_id before storing/retrieving complaints
- Adding auto-creation of student records when posting complaints
- Improving error handling and validation
- Maintaining consistent token parsing across all endpoints
