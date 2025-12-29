const mongoose = require("mongoose");
const Schema =mongoose.Schema;
const Review =require("./review.js");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    filename: String,
    url: String,
  },
  price: Number,
  location: String,
  country: String,
  reviews : [
    {
      type : Schema.Types.ObjectId,
      ref :"Review",
    },

  ],
});

listingSchema.post("findOneDelete",async (listing)=>{
  if(listing){
     await Review.deleteMany({_id :{$in : listing.reviews}});
  }
})

module.exports = mongoose.model("Listing", listingSchema);
