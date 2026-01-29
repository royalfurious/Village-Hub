const express = require("express");
const cors = require("cors");
const app = express();
const db = require("../db");
const { jwtGenerator, jwtDecoder } = require("../utils/jwtToken");

app.use(cors());
app.use(express.json());

const decodeUser = async (token) => {
  try {
    if (!token) return null;
    // accept "Bearer <token>" or raw token
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    console.log(decodedToken);

    const { user_id, type } = decodedToken.user;
    let userInfo;

    if (type === "student") {
      const query = `
        SELECT student_id, room, block_id
        FROM student 
        WHERE student_id = $1
      `;

      const result = await db.pool.query(query, [user_id]);
      console.log("Student lookup result:", result.rows);
      if (result.rows.length > 0) {
        userInfo = result.rows[0];
      } else {
        console.log("No student record found for user_id:", user_id);
      }
    }

    if (type === "warden") {
      const query = `
        SELECT warden_id, block_id
        FROM warden 
        WHERE warden_id = $1
      `;

      const result = await db.pool.query(query, [user_id]);
      console.log("Warden lookup result:", result.rows);

      if (result.rows.length > 0) {
        userInfo = result.rows[0];
      } else {
        console.log("No warden record found for user_id:", user_id);
      }
    }

    return userInfo;
  } catch (err) {
    console.error("Error in decodeUser:", err.message);
    return null;
  }
};

// Removed - this export was moved below

exports.putComplaintsByid = async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    console.log("Decoded Token:", decodedToken);
    
    const { user_id, type } = decodedToken.user;
    const { id } = req.params;

    if (type === "warden") {
      const result = await db.pool.query(
        "UPDATE complaint SET is_completed = NOT is_completed, assigned_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      const complaint = result.rows[0];
      const shaped = { ...complaint, complaint_id: complaint.id };
      res.json(shaped);
    } else {
      res.status(403).json({ error: "Only wardens can update complaints" });
    }
  } catch (err) {
    console.log("Error in putComplaintsByid:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllComplaintsByUser = async (req, res) => {
  const token = req.headers.authorization;
  console.log(token);
  
  try {
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    console.log("Decoded Token:", decodedToken);

    const { user_id, type } = decodedToken.user;

    if (type === "warden") {
      // Warden can see all complaints
      const allComplaints = await db.pool.query(
        "SELECT * FROM complaint ORDER BY created_at DESC"
      );
      const shaped = allComplaints.rows.map((r) => ({ ...r, complaint_id: r.id }));
      console.log("Returning complaints (warden):", shaped.length);
      res.json(shaped);
    } else if (type === "student") {
      // Student can only see their own complaints
      // Need to get student_id from user_id
      const studentRecord = await db.pool.query(
        "SELECT student_id FROM student WHERE student_id = $1",
        [user_id]
      );
      
      if (studentRecord.rows.length === 0) {
        console.log("No student record found for user_id:", user_id);
        return res.json([]);
      }
      
      const student_id = studentRecord.rows[0].student_id;
      
      const myComplaints = await db.pool.query(
        "SELECT * FROM complaint WHERE student_id = $1 ORDER BY created_at DESC",
        [student_id]
      );
      const shaped = myComplaints.rows.map((r) => ({ ...r, complaint_id: r.id }));
      console.log("Returning complaints (student):", shaped.length);
      res.json(shaped);
    } else {
      res.status(403).json({ error: "Unauthorized" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserType = async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    console.log("Decoded Token:", decodedToken);
    const { type } = decodedToken.user;

    res.json({ userType: type });
  } catch (err) {
    console.error("Error in getUserType:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    console.log("getUserDetails called with params:", req.params);
    const token = req.headers.authorization;
    console.log("Authorization header:", token);
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    console.log("Decoded Token in getUserDetails:", decodedToken);
    
    const { user_id, type } = decodedToken.user;

    console.log("User Type:", type);
    console.log("User ID:", user_id);

    if (type === "student") {
      console.log("Fetching student details for user_id:", user_id);
      const studentDetails = await db.pool.query(
        `SELECT u.full_name, u.email, u.phone, s.usn, s.block_id, b.block_name, s.room
        FROM users u
        INNER JOIN student s ON u.user_id = s.student_id
        LEFT JOIN block b ON s.block_id = b.block_id
        WHERE u.user_id = $1`,
        [user_id]
      );
      console.log("Student details query result:", studentDetails.rows);
      res.json(studentDetails.rows);
    } else if (type === "warden") {
      console.log("Fetching warden details for user_id:", user_id);
      const wardenDetails = await db.pool.query(
        `SELECT u.full_name, u.email, u.phone
        FROM users u 
        WHERE user_id = $1`,
        [user_id]
      );
      console.log("Warden details query result:", wardenDetails.rows);
      res.json(wardenDetails.rows);
    } else {
      res.status(403).json({ error: "Unknown user type" });
    }
  } catch (err) {
    console.error("Error in getUserDetails:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteComplaints = async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    console.log("Decoded Token:", decodedToken);
    const { type } = decodedToken.user;
    const { id } = req.params;

    if (type === "warden") {
      const result = await db.pool.query(
        "DELETE FROM complaint WHERE id = $1 RETURNING *",
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      res.json({ message: "Complaint deleted successfully" });
    } else {
      res.status(403).json({ error: "Only wardens can delete complaints" });
    }
  } catch (err) {
    console.log("Error in deleteComplaints:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Main complaint posting function - handles auto-creation of student record if needed
exports.postComplaints = async (req, res) => {
  try {
    const token = req.headers.authorization;
    console.log("Token received:", token);
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    // Extract raw token from "Bearer <token>" or use as-is
    let userInfo = await decodeUser(token);

    // If userInfo missing, attempt to auto-create a student record
    if (!userInfo) {
      try {
        const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
        const decoded = jwtDecoder(raw);
        const { user_id, type } = decoded.user;

        if (type === "student") {
          const { block_id, usn, room } = req.body;
          console.log("Creating student record for user_id:", user_id);
          
          // Try to insert student record if it doesn't exist
          try {
            await db.pool.query(
              "INSERT INTO student (student_id, block_id, usn, room) VALUES ($1, $2, $3, $4)",
              [user_id, block_id || null, usn || 'UNKNOWN', room || null]
            );
          } catch (insertErr) {
            // Student record might already exist, try to retrieve it
            console.log("Student record may already exist, retrieving...");
          }
          
          // Retrieve the student record
          const r = await db.pool.query(
            "SELECT student_id, room, block_id FROM student WHERE student_id = $1",
            [user_id]
          );
          if (r.rows.length > 0) {
            userInfo = r.rows[0];
            console.log("Student record found/created:", userInfo);
          }
        }
      } catch (e) {
        console.error("Error during auto-create userInfo:", e.message);
      }
    }

    if (!userInfo) {
      return res.status(404).json({ error: "User information not found. Please ensure your student profile is created." });
    }

    const { student_id, block_id } = userInfo;
    const { name, description, room } = req.body;

    // Validate required fields
    if (!name || !description || !room) {
      return res.status(400).json({ error: "Missing required fields: name, description, room" });
    }

    const query = `INSERT INTO complaint 
            (name, block_id, student_id, description, room, is_completed, created_at, assigned_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`;

    const newComplaint = await db.pool.query(query, [
      name,
      block_id,
      student_id,
      description,
      room,
      false,
      new Date().toISOString(),
      null,
    ]);
    
    const created = newComplaint.rows[0];
    const shaped = { ...created, complaint_id: created.id };
    console.log("Complaint created successfully:", shaped);
    res.json(shaped);
  } catch (err) {
    console.error("Error in postComplaints:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
};

// Debug endpoint to return user info for testing
exports.debugUser = async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ error: "Authorization token missing" });
    }
    
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const decodedToken = jwtDecoder(raw);
    
    const { user_id, type } = decodedToken.user;
    
    const userInfo = await decodeUser(token);
    
    res.json({
      decodedToken,
      user_id,
      type,
      userInfo
    });
  } catch (err) {
    console.error("Error in debugUser:", err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
};
