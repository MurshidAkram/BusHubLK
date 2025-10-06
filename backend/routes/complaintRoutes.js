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

// Routes for admin and depot operations
const authorizeComplaintAccess = (req, res, next) => {
  if (!['admin', 'depot_operations'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access restricted to admin and depot operations staff' });
  }
  next();
};

router.get('/', authenticateJWT, authorizeComplaintAccess, complaintController.getAllComplaints);
router.put('/:id/status', authenticateJWT, authorizeComplaintAccess, complaintController.updateComplaintStatus);


module.exports = router;