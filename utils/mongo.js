const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://shubhamgodofthunder13:dHjw71kHcOxRHA9n@cluster0.mgclf5a.mongodb.net/KhataBook")
.then(()=>{
  console.log("Connection was a hit.");
})
.catch(function(err){
  console.log("Failed due to:", err);
  
}) 