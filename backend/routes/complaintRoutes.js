const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const complaintController = require('../controllers/complaintController');

// Import the specific functions from your existing auth middleware
const { authenticateJWT, authorizeAdmin } = require('../middlewares/authMiddleware');

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `complaint-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

// --- Route Definitions ---

// The user-facing routes below require a user to be logged in.
// We apply the authenticateJWT middleware to all of them.
router.post('/submit', authenticateJWT, upload.single('image'), complaintController.createComplaint);
router.get('/my-complaints', authenticateJWT, complaintController.getUserComplaints);
router.get('/:id', authenticateJWT, complaintController.getComplaintById);
router.delete('/:id', authenticateJWT, complaintController.deleteComplaint);

// --- Admin-only Routes ---
// These routes should require both authentication and an admin role.
router.get('/', authenticateJWT, authorizeAdmin, complaintController.getAllComplaints);
router.put('/:id/status', authenticateJWT, authorizeAdmin, complaintController.updateComplaintStatus);

module.exports = router;