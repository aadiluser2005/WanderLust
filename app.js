if(process.env.NODE_ENV!="production"){
  require('dotenv').config();
}
const express=require("express");
const app=express();
const port=3000;
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const Localstrategy=require("passport-local");
const User=require("./models/user");
const MyExpressError=require("./utils/ExpressError");


const listingRouter=require("./routes/listing");
const reviewRouter=require("./routes/review");
const userRouter=require("./routes/user");
const categoryRouter=require("./routes/category");


app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));

app.engine("ejs",ejsMate);

app.use(express.static(path.join(__dirname,"/public")));

//app.set(express.static(path.join(__dirname,public)));

const atlasDb_Url=process.env.ATLASDB_URL;

main().then(()=>{console.log("Connection successful")}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(atlasDb_Url);

  
}

const mongoSessionOptions=MongoStore.create({
  mongoUrl: atlasDb_Url,
  crypto: {
    secret: process.env.SECRET
  },
  touchAfter: 24*3600,
});

mongoSessionOptions.on("Error has been occured in mongo",()=>{
        console.log("Error has been occured",err);
});

const sessionOptions={
  store:mongoSessionOptions,
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+ 7*24*60*60*1000,
    httpOnly:true,
  }
}

//Session & flash
app.use(session(sessionOptions));
app.use(flash());


//Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Localstrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//Flash messages
app.use((req,res,next)=>{
  res.locals.successMsg=req.flash("success");
  res.locals.errorMsg=req.flash("error");
  res.locals.currUser=req.user;
  if(req.user){
    res.locals.currUsername=req.user.username;
  //  console.log(res.locals.currUsername);
  }
 // console.log(res.locals.successMsg);
  next();
});

app.get("/test",(res,res)=>{
   res.json("OK");
})

//Router calls
app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);
app.use("/listings/category",categoryRouter);



// app.get("/demoUser",async(req,res)=>{
//   let fakeUser=new User({
//     email:"studen@gmail.com",
//     username:"delta-student",
//   });

//   let registeredUser=await User.register(fakeUser,"helloworld");
//   res.send(registeredUser);
// })

 
// app.all("*",(req,res,next)=>{
//   //res.send("done");
//  // next();
//   //throw new MyExpressError(404,"Page not found");
// next(new MyExpressError(404,"Page not found"));
  
// });
 

app.use((req,res,next)=>{
  throw new MyExpressError(404,"Page not found");
  //console.log("catched");
  
})



//Error Handling middleware
app.use((err,req,res,next)=>{
  let{statusCode=500,message}=err;
  console.log(err.name);
  res.status(statusCode).render("listings/error.ejs",{message});
})




// app.get("/",(req,res)=>{
//     console.log("root is working fine");
//     res.send("working");
// });


app.listen(port,()=>{
    console.log("app is listening on port 3000");
});