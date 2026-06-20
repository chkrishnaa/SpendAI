import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { defaultCategories } from "../utils/defaultCategories.js";

const signToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = async (req, res) => {
  const { name, email, password, currency = "USD" } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email and password" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters long" });
  }

  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT id FROM users
        WHERE email = $1`,
      [email],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    await client.query("BEGIN");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, currency)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, currency, created_at`,
      [name, email, passwordHash, currency],
    );

    const user = userResult.rows[0];

    for (const category of defaultCategories) {
      await client.query(
        `INSERT INTO categories (user_id, name, type, icon, color, is_default)
              VALUES ($1, $2, $3, $4, $5, true)`,
        [user.id, category.name, category.type, category.icon, category.color],
      );
    }

    await client.query("COMMIT");

    const token = signToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Register error", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, password_hash, currency FROM users
        WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken(user.id);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      token,
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
    try{
        const result = await pool.query(
            `SELECT id, name, email, currency, created_at FROM users
                WHERE id = $1`,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("GetMe error", error);
        res.status(500).json({ message: "Server error" });
    }
};