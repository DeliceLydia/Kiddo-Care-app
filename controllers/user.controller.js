const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const register = async (req, res, next) => {
  const { firstname, lastname, country, phoneNumber, gender, email, password } =
    req.body;
  try {
    const haspassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstname,
      lastname,
      country,
      phoneNumber,
      gender,
      email,
      password: haspassword,
    });
    const generateUniqueToken = () => {
      return crypto.randomBytes(20).toString("hex");
    };

    const verificationToken = generateUniqueToken();
    await sendVerificationEmail(email, verificationToken);
    await user.save();
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    res.status(201).json({
      message: "Account created successfully",
      token,
    });
  } catch (error) {
    next(error);
  }
};

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `http://localhost:3001/api/login${verificationToken}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "barefootnomad771@gmail.com",
      pass: "eqtt kcci jtda scxw",
    },
  });

  let mailOptions = {
    from: "barefootnomad771@gmail.com",
    to: email,
    subject: "Email Verification",
    text: `Click the following link to verify your email: ${verificationLink}`,
  };

  await transporter.sendMail(mailOptions);
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ message: "Invalid login credentials" });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    res.status(200).send({ message: "Logged in successfully", token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login };