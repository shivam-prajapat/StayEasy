const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const Listing = require("./models/listing");
const Review = require("./models/review.js")
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/wrapAsync");

const MONGO_URL = "mongodb://127.0.0.1:27017/StayEasy";

// ------------------ DB CONNECTION ------------------
async function main() {
  await mongoose.connect(MONGO_URL);
}
main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

// ------------------ VIEW ENGINE ------------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ------------------ MIDDLEWARE ------------------
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// ------------------ SERVER ------------------
app.listen(8080, () => {
  console.log("Server running on port 8080");
});

// ------------------ ROUTES ------------------
app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

// INDEX
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

// NEW
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// SHOW
// SHOW ✅
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("reviews");

    if (!listing) throw new ExpressError(404, "Listing not found");

    res.render("listings/show.ejs", { listing });
  })
);


// CREATE
app.post(
  "/listings",
  wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

// EDIT
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.render("listings/edit.ejs", { listing });
  })
);

// UPDATE
app.put(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(
      id,
      { ...req.body.listing },
      { new: true, runValidators: true }
    );
    if (!listing) throw new ExpressError(404, "Listing not found");
    res.redirect(`/listings/${id}`);
  })
);

// DELETE
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (!deletedListing) throw new ExpressError(404, "Listing not found");
    res.redirect("/listings");
  })
);
//REVIEWS

app.post(
  "/listings/:id/reviews",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body.review;


    const listing = await Listing.findById(id);
    if (!listing) throw new ExpressError(404, "Listing not found");

    const review = new Review({ rating, comment });

    listing.reviews.push(review);

    await review.save();
    await listing.save();

    res.redirect(`/listings/${id}`);
  })
);
 // DELETE REVIEWS

 app.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId }
    });

    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  })
);



// ------------------ 404 HANDLER ------------------
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// ------------------ ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  res.status(statusCode).render("error.ejs", { err });
});

 