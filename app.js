//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');
const app = express();

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');

mongoose.connect("mongodb://localhost:27017/myblogDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const homeStartingContent = "The secret of change is to focus all of your energy, not on fighting the old, but building on the new.";
const author = "Socrates, Philosopher";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(passport.initialize());
app.use(passport.session());

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
}); //post schema


const Post = mongoose.model("Post", postSchema); //posts model

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
}); //User details schema

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.get("/", function(req, res){
  res.render("welcome")
});

app.get("/register", function(req, res){
  res.render("register")
});

app.get("/login", function(req, res){
  res.render("login")
});

app.get("/home", function(req, res){
  Post.find({}, function(err, posts){
    res.render("home", {
      startingContent: homeStartingContent,
      author: author,
      posts: posts
    });
  });
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){

  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });
  post.save(function(err){
    if(err){
      res.redirect("/");
    }
  });
  console.log(post);
  res.redirect("/home");
});

app.use(function(req,res,next){
  res.locals.currentUser = req.user;
  next();
})

app.post("/register", function(req, res){

  const user =new User({
    name: req.body.fullname,
    username: req.body.username,
    
  });

  User.register(user, req.body.password, function(err, user){
    if(err){
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      })
    }
  })

});

app.post("/login", function(req, res){

const user =new User({
  username:req.body.username,
  password:req.body.password
});
  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });
});


app.get("/home", function(req, res){
  if (req.isAuthenticated()){
    res.render("home");
  }else{
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

const postId = Post._id;
app.get("/posts/:postId", function(req, res){
  const requiredPostId = req.params.postId;
  Post.findOne({_id: requiredPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content
    });
  });
});
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
