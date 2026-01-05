const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET all pending substitute requests
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, u.name as teacher_name 
       FROM substitute_requests sr 
       JOIN users u ON sr.teacher_id = u.id 
       WHERE sr.status = 'pending' 
       ORDER BY sr.date ASC, sr.time ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET requests by teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const result = await pool.query(
      `SELECT sr.*, u.name as acceptor_name 
       FROM substitute_requests sr 
       LEFT JOIN users u ON sr.accepted_by = u.id 
       WHERE sr.teacher_id = $1 
       ORDER BY sr.created_at DESC`,
      [teacherId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teacher requests:', error);
    res.status(500).json({ error: 'Failed to fetch teacher requests' });
  }
});

// POST create new substitute request
router.post('/', async (req, res) => {
  try {
    const { teacher_id, subject, date, time, duration, classroom, notes } = req.body;

    // Validate required fields
    if (!teacher_id || !subject || !date || !time || !duration || !classroom) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO substitute_requests 
       (teacher_id, subject, date, time, duration, classroom, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [teacher_id, subject, date, time, duration, classroom, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// PUT accept a substitute request
router.put('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    if (!teacher_id) {
      return res.status(400).json({ error: 'teacher_id is required' });
    }

    // Check if request exists and is pending
    const checkResult = await pool.query(
      'SELECT * FROM substitute_requests WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (checkResult.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Request is not available' });
    }

    // Accept the request
    const result = await pool.query(
      `UPDATE substitute_requests 
       SET status = 'accepted', accepted_by = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [teacher_id, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// PUT cancel a substitute request
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    // Check if the request belongs to the teacher
    const checkResult = await pool.query(
      'SELECT * FROM substitute_requests WHERE id = $1 AND teacher_id = $2',
      [id, teacher_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    const result = await pool.query(
      `UPDATE substitute_requests 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// DELETE a substitute request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_id } = req.body;

    // Check if the request belongs to the teacher
    const checkResult = await pool.query(
      'SELECT * FROM substitute_requests WHERE id = $1 AND teacher_id = $2',
      [id, teacher_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or unauthorized' });
    }

    await pool.query('DELETE FROM substitute_requests WHERE id = $1', [id]);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

module.exports = router;
