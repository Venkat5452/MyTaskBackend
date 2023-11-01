const express=require("express");
const cors=require("cors");
const mongoose=require("mongoose");
const nodemailer=require("nodemailer");
require("dotenv").config()
const bcrypt=require('bcryptjs')

const server=express();
server.use(express.json());
server.use(express.urlencoded());
server.use(cors());

mongoose
  .connect(process.env.MYURL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    hpassword:String,
    company:String,
    role:String,
    department:String,
})
const otpScheme=new mongoose.Schema({
  otp:String,
  email:String,
})

const User=new mongoose.model("users",userSchema);
const otpdata=new mongoose.model("otpdata",otpScheme);

server.post("/login",async(req,res)=>{
  const  {email , password}=req.body;
  const hpassword=await bcrypt.hash(password,6);
  User.findOne({email:email}).then((user)=>{
      if(user && user.hpassword) {
        bcrypt.compare(password,user.hpassword).then(result => {
          if(result===true) {
            res.send({message : "Log in successFull",user:user});
          }
          else {
            res.send({message:"Incorrect Password"});
          }
       })
       .catch(err => {
           console.log(err)
       })
      }
      else {
          res.send({message:"User not Found"})
      }
  }).catch((err) => console.log(err));
})

server.post("/signup",async(req,res)=>{
  //let testAcc=await nodemailer.createTestAccount();
  const {name,email,password,company,role,department,otp}=req.body;
  const hpassword=await bcrypt.hash(password,6)
  otpdata.findOne({email:email}).then((user)=> {
    if(user.otp!==otp) {
       res.send("Invalid OTP");
    }
    else {
        const user=new User({
            name,
            email,
            hpassword,
            company,
            role,
            department
        })
        user.save().then(res.send({message : "SuccessFully Registered"}));
    }})
})


server.post("/makemail",async(req, res) => {
  const {email,name}=req.body;
  User.findOne({email:email}).then((user)=> {
      if(user) {
          res.send("Email Already Registered");
      }
      else {
      try{
      const otp=Math.floor(100000 + Math.random()*900000);
      const transport=nodemailer.createTransport({
          service:'gmail',
          host: 'smtp.gmail.com',
          port:'587',
          auth:{
              user: process.env.EMAIL,
              pass: process.env.PASSWORD
          },
          secureConnection: 'true',
          tls: {
              ciphers: 'SSLv3',
              rejectUnauthorized: false
          }
      });
      let matter= 'Hello ' + name + ' Here is your otp to Sign up for Company Website ' + otp + '  Please Dont Share with Anyone , Thank You ';
      const mailOptions ={
       from:process.env.EMAIL,
       to :email,
       subject:"EMAIL FOR VERIFICATION",
       html:matter
      }
      otpdata.findOne({email:email}).then((user)=>{
         if(user) {
           user.otp=otp;
           user.save();
         }
         else {
          const newuser= new otpdata({
              email,
              otp
          })
          newuser.save();
         }
      })
      transport.sendMail(mailOptions,(err,info)=>{
       if(err) {
          res.send("Error in sending Mail");
       }
       else {
          //console.log("Email sent " + info.response);
          res.send("OTP SENT Succesfully");
       }
      })
   }catch(err) {
     res.send("No");
   }
  }
})
})

server.post("/passwordmail",async(req, res) => {
  const {email}=req.body;
  User.findOne({email:email}).then((user)=> {
      if(!user) {
          res.send("User Not Found");
      }
      else {
      try{
      const otp=Math.floor(100000 + Math.random()*900000);
      const transport=nodemailer.createTransport({
          service:'gmail',
          host: 'smtp.gmail.com',
          port:'587',
          auth:{
              user: process.env.EMAIL,
              pass: process.env.PASSWORD
          },
          secureConnection: 'true',
          tls: {
              ciphers: 'SSLv3',
              rejectUnauthorized: false
          }
      });
      let matter= 'Hello ' + user.name + ' Here is your otp to Reset Your Password ' + otp + '  Please Dont Share with Anyone , Thank You ';
      const mailOptions ={
       from:process.env.EMAIL,
       to :email,
       subject:"EMAIL FOR VERIFICATION",
       html:matter
      }
      otpdata.findOne({email:email}).then((user)=>{
         if(user) {
           user.otp=otp;
           user.save();
         }
         else {
          const newuser= new otpdata({
              email,
              otp
          })
          newuser.save();
         }
      })
      transport.sendMail(mailOptions,(err,info)=>{
       if(err) {
          res.send("Error in sending Mail");
       }
       else {
          //console.log("Email sent " + info.response);
          res.send("OTP SENT Succesfully");
       }
      })
   }catch(err) {
     res.send("No");
   }
  }
})
})


server.post("/resetpassword",(req,res)=>{
  //let testAcc=await nodemailer.createTestAccount();
  const {email,password,otp}=req.body;
  otpdata.findOne({email:email}).then((user)=> {
    if(user.otp!==otp) {
       res.send("Invalid OTP");
    }
    else {
        res.send("Verified");
    }})
})

server.post("/updatepassword",async(req,res)=>{
  const  {email , password}=req.body;
  const hpassword=await bcrypt.hash(password,6)
  User.findOne({email:email}).then((user)=>{
      if(user) {
       user.hpassword=hpassword;
       user.save();
       res.send("SuccessFully Updated");
      }
      else {
          res.send({message:"User not Found"})
      }
  }).catch((err) => console.log(err));
  })


server.listen(9005,()=>{
    console.log("Server running at port 9005");
})