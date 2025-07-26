# API Testing Plan for E-Voting System

## 🎯 **API Endpoints to Test**

### **Base URL**: `http://localhost:4000`

### **1. Health Check**
```bash
GET /health
```
**Expected Response**:
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "timestamp": "2025-07-26T00:XX:XX.XXXZ"
}
```

### **2. Main Endpoint**
```bash
GET /
```
**Expected Response**:
```json
{
  "message": "Welcome to the e-Voting Backend API",
  "status": "running",
  "timestamp": "2025-07-26T00:XX:XX.XXXZ"
}
```

### **3. Voter Registration**
```bash
POST /api/register
Content-Type: application/json

{
  "matricNumber": "TEST001",
  "surname": "Test User"
}
```
**Expected Response**:
```json
{
  "message": "Voter registered successfully. Use the code to vote.",
  "code": "A3F2D1"
}
```

### **4. Cast Vote**
```bash
POST /api/vote
Content-Type: application/json

{
  "matricNumber": "TEST001",
  "code": "A3F2D1",
  "candidate": "Candidate A"
}
```
**Expected Response**:
```json
{
  "message": "Vote cast successfully"
}
```

### **5. Get Voting Results**
```bash
GET /api/results
```
**Expected Response**:
```json
[
  {
    "voterId": "TEST001",
    "candidate": "Candidate A",
    "timestamp": 1753486540
  }
]
```

### **6. View Individual Vote**
```bash
POST /api/view-vote
Content-Type: application/json

{
  "matricNumber": "TEST001"
}
```
**Expected Response**:
```json
{
  "voterId": "TEST001",
  "candidate": "Candidate A",
  "timestamp": 1753486540
}
```

## 🧪 **Manual Testing Commands**

### **Using curl**:
```bash
# Health check
curl http://localhost:4000/health

# Main endpoint
curl http://localhost:4000/

# Register voter
curl -X POST http://localhost:4000/api/register \
  -H "Content-Type: application/json" \
  -d '{"matricNumber":"TEST001","surname":"Test User"}'

# Cast vote
curl -X POST http://localhost:4000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"matricNumber":"TEST001","code":"A3F2D1","candidate":"Candidate A"}'

# Get results
curl http://localhost:4000/api/results

# View individual vote
curl -X POST http://localhost:4000/api/view-vote \
  -H "Content-Type: application/json" \
  -d '{"matricNumber":"TEST001"}'
```

### **Using Postman/Insomnia**:
1. Import the endpoints
2. Test each endpoint with the provided JSON data
3. Verify responses match expected format

## ✅ **Success Criteria**

- [ ] All endpoints return 200 status codes
- [ ] JSON responses are properly formatted
- [ ] Error handling works for invalid inputs
- [ ] MongoDB integration is working
- [ ] Fabric blockchain integration (optional, with fallback)

## 🚀 **Next Steps**

1. **Frontend Development**: Create React.js frontend
2. **Integration Testing**: Connect frontend with backend
3. **End-to-End Testing**: Full voting workflow
4. **Deployment**: Production setup

---

**Status**: Backend API ready for testing and frontend integration 