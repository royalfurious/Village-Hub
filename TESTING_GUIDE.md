# Testing Guide for Complaint Storage Fix

## Quick Test Using cURL

### 1. Register a Student
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "type": "student",
    "block_id": 1,
    "usn": "USN123",
    "room": "101"
  }'
```
Save the returned `jwtToken` as `$TOKEN`

### 2. Submit a Complaint
```bash
curl -X POST http://localhost:3000/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Water Leakage",
    "description": "Water is leaking from the ceiling in my room",
    "room": "101"
  }'
```

Expected Response:
```json
{
  "id": 1,
  "name": "Water Leakage",
  "block_id": 1,
  "student_id": 1,
  "description": "Water is leaking from the ceiling in my room",
  "room": "101",
  "is_completed": false,
  "created_at": "2024-01-29T...",
  "assigned_at": null,
  "complaint_id": 1
}
```

### 3. Retrieve Your Complaints
```bash
curl -X GET http://localhost:3000/complaints \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Should return the complaint you just created

### 4. Debug User Info (For Troubleshooting)
```bash
curl -X GET http://localhost:3000/debugUser \
  -H "Authorization: Bearer $TOKEN"
```

Returns decoded token and user mapping info.

## Using Postman

### Setup:
1. Create a new request collection
2. Set Base URL: `http://localhost:3000`

### Test Flow:
1. **POST /register** - Register student/warden
2. Copy the jwtToken from response
3. Set Authorization header globally:
   - Type: Bearer Token
   - Token: `{paste_jwtToken_here}`
4. **POST /complaints** - Submit complaint
5. **GET /complaints** - View complaints

## Expected Behavior After Fix

### For Students:
- ✅ Can submit complaints
- ✅ Complaints are stored with their student_id
- ✅ Can only see their own complaints
- ✅ Complaints appear in their profile

### For Wardens:
- ✅ Can see all complaints
- ✅ Can mark complaints as complete
- ✅ Can delete complaints

## Common Issues & Solutions

### Issue 1: "Authorization token missing"
**Cause**: Not sending Bearer token in Authorization header
**Solution**: Make sure header format is: `Authorization: Bearer {token}`

### Issue 2: "User information not found"
**Cause**: Student record not created during registration
**Solution**: System now auto-creates student record. If persists, check database:
```sql
SELECT * FROM student WHERE student_id = {user_id};
```

### Issue 3: Student sees no complaints
**Cause**: Complaints stored with wrong student_id
**Solution**: Fixed! Verify with debug endpoint that user_id matches student_id

### Issue 4: Token decoding fails
**Cause**: Malformed token or expired JWT
**Solution**: 
- Verify token wasn't modified
- Check JWT_SECRET in .env matches backend
- Get new token by logging in again

## Database Verification

Check if complaints are properly stored:
```sql
-- View all complaints with student details
SELECT c.*, s.room as student_room, u.full_name
FROM complaint c
JOIN student s ON c.student_id = s.student_id
JOIN users u ON s.student_id = u.user_id
ORDER BY c.created_at DESC;

-- View specific student's complaints
SELECT * FROM complaint 
WHERE student_id = {student_id}
ORDER BY created_at DESC;
```

## Files Modified

1. **frontend/src/utils/Auth.jsx** - Fixed Bearer token format
2. **backend/controller/complaintController.js** - Fixed all endpoints:
   - postComplaints
   - getAllComplaintsByUser
   - putComplaintsByid
   - deleteComplaints
   - getUserType
   - getUserDetails
   - debugUser (new)

## Environment Variables to Check

Ensure your `.env` file has:
```
JWTSECRET={your_secret}
DATABASE_URL={postgres_url}
PORT=3000
```

## Performance Notes

- Complaints are indexed by student_id
- JWT decoding happens once per request
- No socket.io needed with these fixes
- API responses are now consistent and predictable
