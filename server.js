require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname, { dotfiles: 'deny' }));

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/api/signup', async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    // 1) PostgreSQL local (base combox)
    await pool.query(
      'INSERT INTO usuarios (nombre, apellido, email, password) VALUES ($1, $2, $3, $4)',
      [nombre, apellido, email, hash]
    );

    // 2) Supabase
    const { error } = await supabase
      .from('usuarios')
      .insert([{ nombre, apellido, email, password: hash }]);
    if (error) throw new Error('Supabase: ' + error.message);

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Servidor en http://localhost:${process.env.PORT}`));