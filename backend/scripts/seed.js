import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { defaultCategories } from "../utils/defaultCategories.js";

const DEMO_USER = {
  name: "Krishna Chaurasiya",
  email: "krishna1234@gmail.com",
  password: "Krishna@1234",
  currency: "INR",
};

const BUDGETS = [
  { name: "Rent", amount: 35000 }, // Amber (~91% used)
  { name: "Food & Dining", amount: 8000 }, // Red (Will breach explicitly)
  { name: "Groceries", amount: 15000 }, // Green / Amber mix
  { name: "Transportation", amount: 6000 }, // Red (Will breach explicitly)
  { name: "Shopping", amount: 10000 }, // Green / Amber mix
  { name: "Utilities", amount: 5000 }, // Red (Will breach explicitly)
  { name: "Entertainment", amount: 1500 }, // Green (~68% used)
  { name: "Healthcare", amount: 5000 }, // Dynamic / Can be ₹0
  { name: "Personal Care", amount: 2000 }, // Dynamic / Can be ₹0
];

const generateTransactions = (catMap) => {
  const txns = [];
  const today = new Date();

  let seed = 1;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const rangeFloat = (min, max) => min + rng() * (max - min);
  const rangeInt = (min, max) => Math.floor(rangeFloat(min, max + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const monthStart = new Date(
      today.getFullYear(),
      today.getMonth() - monthsAgo,
      1,
    );
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();
    const monthLastDay = monthsAgo === 0 ? today.getDate() : daysInMonth;

    const dateOn = (day) => {
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth() + 1;
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    const add = (day, categoryName, amount, type, description) => {
      if (day < 1 || day > monthLastDay) return;
      const catId = catMap[categoryName];
      if (!catId) return;
      txns.push({
        categoryId: catId,
        amount: parseFloat(amount.toFixed(2)),
        type,
        description,
        date: dateOn(day),
      });
    };

    // --- 1. INCOME ENGINE ---
    const baseSalary = rangeFloat(72000, 78000);
    add(1, "Salary", baseSalary, "income", "Monthly Base Salary (Part 1)");
    add(15, "Salary", baseSalary, "income", "Monthly Base Salary (Part 2)");

    if ([9, 6, 3, 0].includes(monthsAgo)) {
      add(
        10,
        "Salary",
        rangeFloat(35000, 55000),
        "income",
        "Quarterly Performance Bonus",
      );
    }

    if (monthsAgo % 2 === 0) {
      add(
        rangeInt(5, 12),
        "Freelance",
        rangeFloat(25000, 48000),
        "income",
        "UI/UX Design Contract Work",
      );
      add(
        rangeInt(18, 26),
        "Freelance",
        rangeFloat(15000, 30000),
        "income",
        "Web Portal Bug Bounty",
      );
    } else {
      add(
        rangeInt(10, 20),
        "Freelance",
        rangeFloat(10000, 22000),
        "income",
        "Consulting & Code Audit",
      );
    }

    add(
      25,
      "Investments",
      rangeFloat(4000, 12000),
      "income",
      "Mutual Fund Capital Gains Distribution",
    );

    if (rng() < 0.6) {
      add(
        rangeInt(4, 28),
        "Gifts",
        rangeFloat(2000, 8000),
        "income",
        pick(["Birthday Gift", "Festival Shagun", "Family Cash Token"]),
      );
    }
    if (rng() < 0.4) {
      add(
        rangeInt(1, 28),
        "Other Income",
        rangeFloat(200, 1500),
        "income",
        pick(["Credit Card Cashback", "E-Store Refund"]),
      );
    }

    // --- 2. EXPENSES ENGINE ---
    add(2, "Rent", 32000, "expense", "Monthly Flat Rent");

    // Pushing Utilities slightly up to breach the lower 5,000 threshold
    add(
      rangeInt(5, 8),
      "Utilities",
      rangeFloat(3800, 5200),
      "expense",
      "Society Electricity Bill",
    );
    add(
      rangeInt(10, 12),
      "Utilities",
      rangeFloat(1400, 1900),
      "expense",
      "High-Speed Broadband WiFi",
    );

    add(3, "Entertainment", 649, "expense", "Netflix Premium Plan");
    add(5, "Entertainment", 179, "expense", "Spotify Premium");
    add(7, "Entertainment", 189, "expense", "YouTube Premium");

    // Daily Spends Loop
    for (let day = 1; day <= monthLastDay; day++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const dow = d.getDay();
      const isWeekend = dow === 0 || dow === 6;

      // Higher frequencies to generate explicit Red breach indicators on Food & Dining
      if (!isWeekend && rng() < 0.65) {
        add(
          day,
          "Food & Dining",
          rangeFloat(120, 250),
          "expense",
          pick(["Office Tea & Snacks", "Cafeteria Snack", "Filter Coffee"]),
        );
      }
      if (!isWeekend && rng() < 0.45) {
        add(
          day,
          "Food & Dining",
          rangeFloat(220, 500),
          "expense",
          pick(["Lunch Order", "Food Delivery", "Quick Meal"]),
        );
      }
      if (isWeekend && rng() < 0.6) {
        add(
          day,
          "Food & Dining",
          rangeFloat(800, 2200),
          "expense",
          pick(["Weekend Outing", "Restaurant Dinner", "Cafe Hangout"]),
        );
      }

      if (!isWeekend && rng() < 0.45) {
        add(
          day,
          "Transportation",
          rangeFloat(100, 220),
          "expense",
          pick(["Auto Rickshaw Ride", "Metro SmartCard Topup", "Cab Share"]),
        );
      }
      if (rng() < 0.15) {
        add(
          day,
          "Shopping",
          rangeFloat(500, 2500),
          "expense",
          "E-Commerce Online Order",
        );
      }
    }

    // Weekly Groceries
    for (let day = 1; day <= monthLastDay; day++) {
      const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      if (d.getDay() === 0) {
        add(
          day,
          "Groceries",
          rangeFloat(1500, 3200),
          "expense",
          pick([
            "Zepto Grocery Delivery",
            "Blinkit Order",
            "Supermarket Visit",
          ]),
        );
      }
    }

    // Transportation periodic top-ups (Pushes transportation budget into Red)
    for (let day = 4; day <= monthLastDay; day += 6) {
      add(
        day,
        "Transportation",
        rangeFloat(1200, 2000),
        "expense",
        "Vehicle Fuel Refill",
      );
    }

    // Occasional Spends
    if (monthsAgo % 2 === 0 && rng() < 0.7) {
      add(
        rangeInt(10, 24),
        "Shopping",
        rangeFloat(1500, 5000),
        "expense",
        pick(["Apparel Shopping", "New Tech Accessories"]),
      );
    }
    if ([10, 6, 2].includes(monthsAgo)) {
      add(
        rangeInt(12, 18),
        "Healthcare",
        rangeFloat(1500, 4000),
        "expense",
        pick(["Medical Checkup", "Pharmacy Prescription"]),
      );
    }
    if (monthsAgo % 2 === 1) {
      add(
        rangeInt(5, 12),
        "Personal Care",
        rangeFloat(500, 1800),
        "expense",
        "Salon Care / Grooming",
      );
    }
    if ([11, 7, 3].includes(monthsAgo)) {
      add(
        rangeInt(14, 20),
        "Travel",
        rangeFloat(8000, 18000),
        "expense",
        "Weekend Resort Trip Stay",
      );
    }
  }

  return txns;
};

const seed = async () => {
  const client = await pool.connect();

  try {
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [DEMO_USER.email],
    );
    if (existing.rows.length > 0) {
      console.log(`Removing existing demo user (${DEMO_USER.email})...`);
      await client.query("DELETE FROM users WHERE email = $1", [
        DEMO_USER.email,
      ]);
    }

    await client.query("BEGIN");

    console.log(`Creating user ${DEMO_USER.email}...`);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEMO_USER.password, salt);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, currency)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
      [DEMO_USER.name, DEMO_USER.email, passwordHash, DEMO_USER.currency],
    );

    const userId = userResult.rows[0].id;

    console.log(`Seeding ${defaultCategories.length} default categories...`);
    for (const cat of defaultCategories) {
      await client.query(
        `INSERT INTO categories (user_id, name, type, icon, color, is_default)
                VALUES ($1, $2, $3, $4, $5, true)`,
        [userId, cat.name, cat.type, cat.icon, cat.color],
      );
    }

    const catRes = await client.query(
      "SELECT id, name FROM categories WHERE user_id = $1",
      [userId],
    );

    const catMap = {};
    catRes.rows.forEach((c) => {
      catMap[c.name] = c.id;
    });

    const transactions = generateTransactions(catMap);
    console.log(
      `Inserting ${transactions.length} transactions across 12 months...`,
    );

    const placeholders = [];
    const params = [];
    transactions.forEach((t, i) => {
      const base = i * 6;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`,
      );
      params.push(
        userId,
        t.categoryId,
        t.amount,
        t.type,
        t.description,
        t.date,
      );
    });

    if (placeholders.length > 0) {
      await client.query(
        `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_date)
                VALUES ${placeholders.join(", ")}`,
        params,
      );
    }

    const today = new Date();
    const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

    console.log(`Inserting ${BUDGETS.length} budgets...`);
    for (const b of BUDGETS) {
      await client.query(
        `INSERT INTO budgets (user_id, category_id, amount, period, start_date)
                VALUES ($1, $2, $3, 'monthly', $4)`,
        [userId, catMap[b.name], b.amount, monthStartStr],
      );
    }

    await client.query("COMMIT");

    console.log("");
    console.log("Demo data seeded successfully!");
    console.log("");
    console.log("  Email:", DEMO_USER.email);
    console.log("  Password:", DEMO_USER.password);
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();