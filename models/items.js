const { Schema, model } = require("mongoose");

const schema = new Schema({
  name: { type: String, require: true },
  description: { type: String },
  date: { type: String, require: true },
  imageUrl: { type: String },
  authorId: { type: String, require: true },
  authorEmail: { type: String, require: true },
  modifide: { type: String, require: true },
});

module.exports = model("Items", schema);
