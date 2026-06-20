import pool from "../config/db.js";

export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
        `SELECT * FROM categories
            WHERE user_id = $1
            ORDER BY type, name`,
        [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('GetCategories error', err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createCategory = async (req, res) => {
    const { name, type, icon, color } = req.body;

    if(!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO categories (user_id, name, type, icon, color, is_default)
                VALUES ($1, $2, $3, $4, $5, false)
                RETURNING *`,
            [req.userId, name, type, icon || null, color || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if(error.code === '23505') {
            return res.status(400).json({ error: "Category with this name already exists." });
        }
        console.error('CreateCategory error', err);
        res.status(500).json({ error: "Server error" });
    }
};

export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    try {
        const result = await pool.query(
            `UPDATE categories
                SET name = COALESCE($1, name),
                icon = COALESCE($2, icon),
                color = COALESCE($3, color)
                WHERE id = $4 AND user_id = $5
                RETURNING *`,
            [name, icon, color, id, req.userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Category not found." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('UpdateCategory error', err);
        res.status(500).json({ error: "Server error" });
    }
};

export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM categories
                WHERE id = $1 AND user_id = $2
                RETURNING id`,
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Category not found." });
        }
        
        res.json({ message: "Category deleted successfully." });
    } catch (err) {
        console.error('DeleteCategory error', err);
        res.status(500).json({ error: "Server error" });
    }
};