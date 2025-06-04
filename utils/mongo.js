const mongoose = require("mongoose");
require("dotenv").config();

const dbURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mgclf5a.mongodb.net/KhataBook`;

mongoose.connect(dbURI)
.then(()=>{
  console.log("Connection was a hit.");
})
.catch(function(err){
  console.log("Failed due to:", err);
}) 