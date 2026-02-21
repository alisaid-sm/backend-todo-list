const express = require("express");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware agar Express bisa membaca JSON dari body request
app.use(express.json());
app.use(cors());

// 1. Koneksi ke MongoDB (Gunakan nama Service Kubernetes)
const mongoURI = process.env.MONGO_URL || "mongodb://localhost:27017/todo-db";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Todo List API",
      version: "1.0.0",
      description: "API untuk mengelola daftar tugas di K3s",
    },
    servers: [
      {
        url: "http://192.168.56.10:32000", // Sesuaikan dengan IP dan NodePort kamu
        description: "Development server",
      },
    ],
  },
  apis: ["./app.js"], // Lokasi file yang berisi dokumentasi route
};

mongoose
  .connect(mongoURI)
  .then(() => console.log("Berhasil terhubung ke MongoDB di K3s! 🍃"))
  .catch((err) => console.error("Gagal koneksi database:", err));

// 2. Definisi Model Todo
const Todo = mongoose.model("Todo", {
  task: String,
  isCompleted: { type: Boolean, default: false },
});

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.get("/", (req, res) => {
  res.send("<h1>Halo dari Express JS di K3s! 🚀</h1>");
});

/**
 * @openapi
 * /todos:
 *   get:
 *     summary: Mengambil semua daftar tugas
 *     tags:
 *       - Todos
 *     responses:
 *       200:
 *         description: Berhasil mengambil data
 */
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /todos:
 *   post:
 *     summary: Menambah tugas baru
 *     tags:
 *       - Todos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tugas berhasil dibuat
 */
app.post("/todos", async (req, res) => {
  try {
    const newTodo = new Todo({
      task: req.body.task,
    });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   put:
 *     summary: Memperbarui status tugas
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID unik dari tugas (dari MongoDB)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tugas berhasil diperbarui
 *       404:
 *         description: ID tugas tidak ditemukan
 */
app.put("/todos/:id", async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { isCompleted: req.body.isCompleted },
      { new: true }, // Agar mengembalikan data yang sudah terupdate
    );
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @openapi
 * /todos/{id}:
 *   delete:
 *     summary: Menghapus tugas dari daftar
 *     tags:
 *       - Todos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tugas berhasil dihapus
 */
app.delete("/todos/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Tugas berhasil dihapus!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
