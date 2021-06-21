const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Items = require("./models/items");
const { passwordValidator, emailValidator } = require("./validators");
const authMiddleware = require("./middleware/authMiddleware");

const jwtKey = "*******";

const PORT = process.env.PORT || 8080;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extends: false }));

async function start() {
  try {
    await mongoose.connect(
      "mongodb+srv://admin:***********0.nmcpk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      }
    );

    app.post("/api/auth/register", async (req, res) => {
      //REGISTER
      console.log("POST REGISTER", req.body);
      try {
        const { email, password } = req.body;

        if (!passwordValidator(password) || !emailValidator(email)) {
          return res.status(400).json({
            message: "Invalid email of parameters",
          });
        }

        const isExist = await User.findOne({ email });

        if (isExist) {
          return res.status(409).json({ message: "User already exist" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ email, password: hashedPassword });

        await user.save();

        res.status(200).json({ message: "User created" });
      } catch (e) {
        res.status(500).json("Server error, try later...");
      }
    }); //REGISTER END

    app.post("/api/auth/login", async (req, res) => {
      //LOGIN
      console.log("POST LOGIN", req.body);
      try {
        const { email, password } = req.body;
        if (!passwordValidator(password) || !emailValidator(email)) {
          return res.status(400).json({
            message: "Invalid email of parameters",
          });
        }

        const user = await User.findOne({ email });

        if (!user) {
          return res.status(400).json({ message: "User didnt found" });
        }

        const passMatch = await bcrypt.compare(password, user.password);

        if (!passMatch) {
          return res.status(403).json({
            message: "Incorrect password",
          });
        }

        const token = jwt.sign(
          {
            userId: user.id,
            userEmail: user.email,
          },
          jwtKey,
          {
            expiresIn: "24h",
          }
        );

        res.json({ token, userId: user.id });
      } catch (err) {
        res.status(500).json("Server error, try later...");
      }
    }); //LOGIN END

    app.post("/api/item", authMiddleware, async (req, res) => {
      //CREATE ITEM
      console.log("CREATE ITEM");

      try {
        const { name, description, date, imageUrl } = req.body;

        const { userId, userEmail } = req.user;
        console.log(req.user);
        let item = new Items({
          name: name,
          description: description,
          date: date,
          imageUrl: imageUrl,
          authorId: userId,
          authorEmail: userEmail,
          modifide: false,
        });

        await item.save();
        res.status(200).json("Succesfully added");
      } catch (error) {
        res.status(500).json("Server error, try later...");
      } //CREATE ITEM END
    });

    app.get("/api/all", authMiddleware, async (req, res) => {
      try {
        Items.find({}, (err, doc) => {
          if (err || !doc) {
            res.status(404).json("Not found");
          } else {
            res.status(200).send(doc.reverse());
          }
        });
      } catch (error) {
        res.status(500).json("Server error, try later...");
      }
    });

    app.get("/api/item/:id", authMiddleware, async (req, res) => {
      try {
        Items.findById(req.params.id, (err, doc) => {
          if (err || !doc) {
            res.status(404).json("Not found");
          } else {
            res.status(200).send(doc);
          }
        });
      } catch (error) {
        res.status(500).json("Server error, try later...");
      }
    });

    app.patch("/api/item/:id", authMiddleware, (req, res) => {
      try {
        const { name, description, date, imageUrl } = req.body;
        console.log("PATCH", description, date, name, imageUrl);

        Items.findOneAndUpdate(
          { _id: req.params.id },
          {
            name: name,
            description: description,
            date: date,
            imageUrl: imageUrl,
            modifide: true,
          },
          { new: true },
          (err, doc) => {
            if (err || !doc) {
              res.status(404).json("Not found");
            } else {
              res.status(200).send(doc);
            }
          }
        );
      } catch (error) {
        res.status(500).json("Server error, try later...");
      }
    });

    app.delete("/api/item/:id", authMiddleware, (req, res) => {
      console.log("DELTE");
      console.log(req.params.id);
      try {
        Items.findById(req.params.id, (err, doc) => {
          if (err || !doc) {
            res.status(404).json("Not found");
          } else {
            if (req.user.userId === doc.authorId) {
              Items.findOneAndRemove({ _id: req.params.id }, (err, doc) => {
                if (err || !doc) {
                  res.status(500).json("server error");
                } else {
                  res.status(200).json("Sucess");
                }
              });
            }
          }
        });
      } catch (error) {
        res.status(500).json("Server error, try later...");
      }
    });

    //app.get("/api/all");
  } catch (err) {
    console.log("Error", err);
  }
}

start();

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});
