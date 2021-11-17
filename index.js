require("dotenv").config();
const express = require('express');
const PrismaClient = require('@prisma/client').PrismaClient;
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const db = new PrismaClient();
const app = express();

app.use(bodyParser.urlencoded());

// AUTH middlewares
async function checkAuth(req, res, next) {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      return res.status(401).send({ auth: false, message: 'No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.user.findUnique({
      where: {
        id: decoded.userId
      }
    });
  
    if (!user) {
      return res.status(404).send({ auth: false, message: 'No user found.' });
    }
  
    req.user = user;
    next(); 
  } catch (error) {
    console.error(error);
    res.status(401).send({ auth: false, message: 'Failed to authenticate token.' });
  }
}

app.get("/users", async (_req, res) => {
  const users = await db.user.findMany();
  res.json(users);
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: "User not found" });
  }
  const isValidPassword = await bcrypt.compare(password, user.password);
  if(!isValidPassword) {
    res.status(401).json({ error: "Invalid password" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {expiresIn: "6h"});
  res.json({ token, user: {role: user.role} });
})

app.get("/test", checkAuth, (_req, res) => {
  res.json({ message: "You are authenticated" });
})

app.post("/users", async (req, res) => {
  try {
    // create new user
    const {email, name} = req.body;
    const password = await bcrypt.hash(data.password, 10);
    await db.user.create({
      data: {
        email,
        password,
        name,
        role: "USER",
      }
    });
  
    res.json({success: true})
  } catch (error) {
    res.status(400).json({success: false, error})
  }
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Your server is running on port ${PORT}`)
})
