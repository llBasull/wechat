var express = require("express");
var router = express.Router();
var userModel = require("../models/users");
const passport = require("passport");
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));
const { ObjectId } = require("mongoose").Types;

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/createuser", (req, res) => {
  res.render("createUser");
});

router.post("/createuser", (req, res) => {
  const Users = new userModel(req.body);
  userModel.register(Users, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      return res.redirect("/");
    }
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.get("/login", (req, res) => {
  res.render("login");
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  }),
  (req, res) => {}
);

router.get("/profile", isLoggedin, async function (req, res) {
  try {
    const loggedInUser = await userModel.findOne({
      username: req.session.passport.user,
    });

    const allUsers = await userModel.find(
      { _id: { $ne: loggedInUser._id } },
      "username"
    );

    const friendRequestsReceived = await userModel
      .find({ _id: { $in: loggedInUser.friendRequestsReceived } })
      .select("username");
      
    const friends = await userModel.find({ _id: { $in: loggedInUser.friends } })

    res.render("profile", {
      user: loggedInUser,
      allUsers,
      friendRequestsReceived,
      friends
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/addfriend", isLoggedin, async (req, res) => {
  try {
    const receiverId = new ObjectId(req.body.receiverId);
    const senderId = req.user._id;
    await userModel.findByIdAndUpdate(
      receiverId,
      { $addToSet: { friendRequestsReceived: senderId } },
      { new: true }
    );
    await userModel.findByIdAndUpdate(
      senderId,
      { $addToSet: { friendRequestsSent: receiverId } },
      { new: true }
    );

    console.log("Friend request sent successfully.");

    res.redirect("/profile"); // Redirect back to the profile page
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post('/accept', async (req, res) => {
  try {
    const sendersId = new ObjectId(req.body.sendersId);
    const userId = req.user._id;

    // Update current user's friendRequestsReceived field
    await userModel.findByIdAndUpdate(userId, { $pull: { friendRequestsReceived: sendersId } });
    await userModel.findByIdAndUpdate(sendersId, { $pull: { friendRequestsSent: userId } });

    // Update current user's friends field
    await userModel.findByIdAndUpdate(userId, { $addToSet: { friends: sendersId } });
    await userModel.findByIdAndUpdate(sendersId, { $addToSet: { friends: userId } });

    res.redirect('/profile');
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/delete', async (req, res) => {
  try {
    const sendersId = new ObjectId(req.body.sendersId);
    const userId = req.user._id;

    // Update current user's friendRequestsReceived field
    await userModel.findByIdAndUpdate(userId, { $pull: { friendRequestsReceived: sendersId } });
    await userModel.findByIdAndUpdate(sendersId, { $pull: { friendRequestsSent: userId } });
    res.redirect('/profile');
  }
  catch(error){
    console.error('Error deleting friend request:', error);
  }
});


router.get('/chat/:friendId', isLoggedin, async (req, res) => {
  try {
    // Fetch friend details, you can use Mongoose or your preferred method
    const friend = await userModel.findById(req.params.friendId);

    if (!friend) {
      return res.status(404).send('Friend not found');
    }

    res.render('chat', { user: req.user, friend });
  } catch (error) {
    console.error('Error fetching friend details:', error);
    res.status(500).send('Internal Server Error');
  }
});


function isLoggedin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}
module.exports = router;
