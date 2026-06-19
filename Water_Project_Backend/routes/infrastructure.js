const express        = require('express');
const db             = require('../config/db');
const authMiddleware = require('../middleware/auth');
const getClientIp    = require('../config/getClientIp');

const router = express.Router();

// All infrastructure routes are protected
router.use(authMiddleware);


// ============================================================
// WATER ZONE
// ============================================================

// GET /api/infrastructure/zones — get all zones
router.get('/zones', async (req, res) => {
  try {
    const query = req.user.role === 'zonal_admin'
      ? `SELECT * FROM water_zone WHERE is_active = 1 AND id = ? ORDER BY name`
      : `SELECT * FROM water_zone WHERE is_active = 1 ORDER BY name`;
    const params = req.user.role === 'zonal_admin' ? [req.user.zone_id] : [];

    const [zones] = await db.query(query, params);
    res.status(200).json({ zones });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/infrastructure/zones/:id — get one zone
router.get('/zones/:id', async (req, res) => {
  try {
    const [zones] = await db.query(
      `SELECT * FROM water_zone WHERE id = ?`,
      [req.params.id]
    );
    if (zones.length === 0) {
      return res.status(404).json({ error: 'Zone not found.' });
    }
    if (req.user.role === 'zonal_admin' && zones[0].id !== req.user.zone_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.status(200).json({ zone: zones[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/infrastructure/zones — create a zone (system_admin only)
router.post('/zones', async (req, res) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Zone name is required.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO water_zone (name, description) VALUES (?, ?)`,
      [name, description || null]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'water_zone.create', 'water_zone', result.insertId,
       JSON.stringify({ name, description }), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Zone created successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A zone with this name already exists.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/infrastructure/zones/:id — update a zone (system_admin only)
router.put('/zones/:id', async (req, res) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { name, description, is_active } = req.body;
  try {
    const [existing] = await db.query(
      `SELECT * FROM water_zone WHERE id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Zone not found.' });
    }
    await db.query(
      `UPDATE water_zone SET name = ?, description = ?, is_active = ? WHERE id = ?`,
      [
        name        || existing[0].name,
        description || existing[0].description,
        is_active   !== undefined ? is_active : existing[0].is_active,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'water_zone.update', 'water_zone', req.params.id,
       JSON.stringify(existing[0]), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Zone updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/infrastructure/zones/:id — soft delete (system_admin only)
router.delete('/zones/:id', async (req, res) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM water_zone WHERE id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Zone not found.' });
    }
    await db.query(
      `UPDATE water_zone SET is_active = 0 WHERE id = ?`, [req.params.id]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'water_zone.delete', 'water_zone', req.params.id,
       JSON.stringify(existing[0]), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Zone deactivated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// WATER TANK
// ============================================================

// GET /api/infrastructure/tanks — get all tanks
router.get('/tanks', async (req, res) => {
  try {
    const query = req.user.role === 'zonal_admin'
      ? `SELECT wt.*, wz.name AS zone_name
         FROM water_tank wt
         JOIN water_zone wz ON wz.id = wt.zone_id
         WHERE wt.deleted_at IS NULL AND wt.zone_id = ?
         ORDER BY wt.name`
      : `SELECT wt.*, wz.name AS zone_name
         FROM water_tank wt
         JOIN water_zone wz ON wz.id = wt.zone_id
         WHERE wt.deleted_at IS NULL
         ORDER BY wt.name`;
    const params = req.user.role === 'zonal_admin' ? [req.user.zone_id] : [];

    const [tanks] = await db.query(query, params);
    res.status(200).json({ tanks });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/infrastructure/tanks/:id — get one tank
router.get('/tanks/:id', async (req, res) => {
  try {
    const [tanks] = await db.query(
      `SELECT wt.*, wz.name AS zone_name
       FROM water_tank wt
       JOIN water_zone wz ON wz.id = wt.zone_id
       WHERE wt.id = ? AND wt.deleted_at IS NULL`,
      [req.params.id]
    );
    if (tanks.length === 0) {
      return res.status(404).json({ error: 'Tank not found.' });
    }
    if (req.user.role === 'zonal_admin' && tanks[0].zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.status(200).json({ tank: tanks[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/infrastructure/tanks — create a tank
router.post('/tanks', async (req, res) => {
  if (['representative', 'user'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { zone_id, name, location_description, latitude, longitude,
          capacity_litres, installation_date, status } = req.body;
  if (!zone_id || !name || !capacity_litres) {
    return res.status(400).json({ error: 'zone_id, name and capacity_litres are required.' });
  }
  if (req.user.role === 'zonal_admin' && zone_id !== req.user.zone_id) {
    return res.status(403).json({ error: 'You can only create tanks in your zone.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO water_tank
         (zone_id, name, location_description, latitude, longitude,
          capacity_litres, current_level, installation_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [zone_id, name, location_description || null, latitude || null,
       longitude || null, capacity_litres, installation_date || null,
       status || 'operational']
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'water_tank.create', 'water_tank', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Tank created successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A tank with this name already exists.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/infrastructure/tanks/:id — update a tank
router.put('/tanks/:id', async (req, res) => {
  if (['representative', 'user'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM water_tank WHERE id = ? AND deleted_at IS NULL`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tank not found.' });
    }
    const t = existing[0];
    if (req.user.role === 'zonal_admin' && t.zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'You can only update tanks in your zone.' });
    }
    const { zone_id, name, location_description, latitude, longitude,
            capacity_litres, current_level, installation_date, status } = req.body;
    if (req.user.role === 'zonal_admin' && zone_id && zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'You cannot move a tank to another zone.' });
    }
    await db.query(
      `UPDATE water_tank SET
         zone_id = ?, name = ?, location_description = ?,
         latitude = ?, longitude = ?, capacity_litres = ?,
         current_level = ?, installation_date = ?, status = ?
       WHERE id = ?`,
      [
        zone_id              || t.zone_id,
        name                 || t.name,
        location_description || t.location_description,
        latitude             || t.latitude,
        longitude            || t.longitude,
        capacity_litres      || t.capacity_litres,
        current_level        !== undefined ? current_level : t.current_level,
        installation_date    || t.installation_date,
        status               || t.status,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'water_tank.update', 'water_tank', req.params.id,
       JSON.stringify(t), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Tank updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/infrastructure/tanks/:id — soft delete
router.delete('/tanks/:id', async (req, res) => {
  if (['representative', 'user'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM water_tank WHERE id = ? AND deleted_at IS NULL`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tank not found.' });
    }
    if (req.user.role === 'zonal_admin' && existing[0].zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'You can only delete tanks in your zone.' });
    }
    await db.query(
      `UPDATE water_tank SET deleted_at = NOW() WHERE id = ?`, [req.params.id]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'water_tank.delete', 'water_tank', req.params.id,
       JSON.stringify(existing[0]), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Tank deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// PUBLIC TAP
// ============================================================

// GET /api/infrastructure/taps — get all taps
router.get('/taps', async (req, res) => {
  try {
    const query = req.user.role === 'zonal_admin'
      ? `SELECT pt.*, wz.name AS zone_name, wt.name AS tank_name
         FROM public_tap pt
         JOIN water_zone wz ON wz.id = pt.zone_id
         JOIN water_tank wt ON wt.id = pt.tank_id
         WHERE pt.deleted_at IS NULL AND pt.zone_id = ?
         ORDER BY pt.name`
      : `SELECT pt.*, wz.name AS zone_name, wt.name AS tank_name
         FROM public_tap pt
         JOIN water_zone wz ON wz.id = pt.zone_id
         JOIN water_tank wt ON wt.id = pt.tank_id
         WHERE pt.deleted_at IS NULL
         ORDER BY pt.name`;
    const params = req.user.role === 'zonal_admin' ? [req.user.zone_id] : [];

    const [taps] = await db.query(query, params);
    res.status(200).json({ taps });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/infrastructure/taps/:id — get one tap
router.get('/taps/:id', async (req, res) => {
  try {
    const [taps] = await db.query(
      `SELECT pt.*, wz.name AS zone_name, wt.name AS tank_name
       FROM public_tap pt
       JOIN water_zone wz ON wz.id = pt.zone_id
       JOIN water_tank wt ON wt.id = pt.tank_id
       WHERE pt.id = ? AND pt.deleted_at IS NULL`,
      [req.params.id]
    );
    if (taps.length === 0) {
      return res.status(404).json({ error: 'Tap not found.' });
    }
    if (req.user.role === 'zonal_admin' && taps[0].zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.status(200).json({ tap: taps[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/infrastructure/taps — create a tap
router.post('/taps', async (req, res) => {
  if (['representative', 'user'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { zone_id, tank_id, name, location_description,
          latitude, longitude, installation_date, status } = req.body;
  if (!zone_id || !tank_id || !name) {
    return res.status(400).json({ error: 'zone_id, tank_id and name are required.' });
  }
  if (req.user.role === 'zonal_admin' && zone_id !== req.user.zone_id) {
    return res.status(403).json({ error: 'You can only create taps in your zone.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO public_tap
         (zone_id, tank_id, name, location_description,
          latitude, longitude, installation_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [zone_id, tank_id, name, location_description || null,
       latitude || null, longitude || null,
       installation_date || null, status || 'active']
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'public_tap.create', 'public_tap', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Tap created successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A tap with this name already exists.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/infrastructure/taps/:id — update a tap
router.put('/taps/:id', async (req, res) => {
  if (['representative', 'user'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM public_tap WHERE id = ? AND deleted_at IS NULL`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tap not found.' });
    }
    const t = existing[0];
    if (req.user.role === 'zonal_admin' && t.zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'You can only update taps in your zone.' });
    }
    const { zone_id, tank_id, name, location_description,
            latitude, longitude, installation_date, status } = req.body;
    if (req.user.role === 'zonal_admin' && zone_id && zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'You cannot move a tap to another zone.' });
    }
    await db.query(
      `UPDATE public_tap SET
         zone_id = ?, tank_id = ?, name = ?,
         location_description = ?, latitude = ?, longitude = ?,
         installation_date = ?, status = ?
       WHERE id = ?`,
      [
        zone_id              || t.zone_id,
        tank_id              || t.tank_id,
        name                 || t.name,
        location_description || t.location_description,
        latitude             || t.latitude,
        longitude            || t.longitude,
        installation_date    || t.installation_date,
        status               || t.status,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'public_tap.update', 'public_tap', req.params.id,
       JSON.stringify(t), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Tap updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/infrastructure/taps/:id — soft delete
router.delete('/taps/:id', async (req, res) => {
  if (['representative', 'user'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM public_tap WHERE id = ? AND deleted_at IS NULL`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Tap not found.' });
    }
    if (req.user.role === 'zonal_admin' && existing[0].zone_id !== req.user.zone_id) {
      return res.status(403).json({ error: 'You can only delete taps in your zone.' });
    }
    await db.query(
      `UPDATE public_tap SET deleted_at = NOW() WHERE id = ?`, [req.params.id]
    );
    await db.query(
      `INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'public_tap.delete', 'public_tap', req.params.id,
       JSON.stringify(existing[0]), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Tap deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;
