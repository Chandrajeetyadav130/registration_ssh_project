require('dotenv').config();
const express=require("express");
const cookieParser=require("cookie-parser");
const hbs=require("hbs");
const path=require("path");
const bcrypt=require("bcryptjs");
require("./db/conn");
const Register=require("./models/registers");
const auth=require("./middleware/auth");
const { METHODS } = require("http");
const app=express();
const port=process.env.PORT || 8000;

const static_path=path.join(__dirname,"../public");
const templates_path=path.join(__dirname,"../templates/views");
const partials_path=path.join(__dirname,"../templates/partials");

app.use(express.static(static_path));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

app.set("view engine","hbs");
app.set("views",templates_path);
hbs.registerPartials(partials_path);
app.get("/",(req,res)=>{
    // console.log(`this is cookie parser ${req.cookies.jwt}`);
    res.render("index");
});
app.get("/course",auth,(req,res)=>{
    console.log(`this is  token inside cookie and call by cookie parser ${req.cookies.jwt}`);
    res.render("course");
});
app.get("/logout",auth,async (req,res)=>{
try{
    // logout from one device
    // req.user.tokens=req.user.tokens.filter((curEle)=>{
    //     curEle.token!=req.token
    // })
    // logout from all device
    req.user.tokens=[];
    res.clearCookie("jwt");
    console.log(`logout successfully`)
     await req.user.save();
    res.render("login")


}
catch(error){
    res.status(500).send(error);
}
})
app.get("/register",(req,res)=>{
    res.render("register");
})
app.get("/login",(req,res)=>{
    res.render("login");
})
// creating data on database
app.post("/register",  async (req,res)=>{
    try{
        // console.log(req.body.firstname);
        // res.send(req.body.firstname);
        const password=req.body.password;
        const confirmpassword=req.body.confirmpassword;
        if(password===confirmpassword){

            const registerEmp=new Register({
                firstname:req.body.firstname,
                lastname:req.body.lastname,
                email:req.body.email,
                gender:req.body.gender,
                phone:req.body.phone,
                age:req.body.age,
                password:password,
                confirmpassword:confirmpassword
            })
            // call a token generate METHODS()
            const token=await registerEmp.generateAuthToken();
            console.log(`token part is ${token}`);
            // store token in cookies
            res.cookie("jwt",token,{
                expires:new Date(Date.now()+30000),
                httpOnly:true
            });
            console.log(res.cookie);
            const registered=await registerEmp.save();
            console.log(`after save token part ${token}`)
          
            res.status(201).render("index");
        }

        else{
            res.send("passwword not matched");
        }

    }catch(e){
       res.status(400).send(e);
    }

})
// login Credential
app.post("/login",async (req,res)=>{
    try{
        const email=req.body.email;
        const password=req.body.password;
        const regEmail=await Register.findOne({email:email});
        const isMatch=await bcrypt.compare(password,regEmail.password);
         const token=await regEmail.generateAuthToken();
         console.log(`login token;${token}`);
        //  save token in cookies
        res.cookie("jwt",token,{
            expires:new Date(Date.now()+30000),
            httpOnly:true
        });
        // console.log(`this is cookie login parser ${req.cookies.jwt}`);
        if(isMatch){
             res.status(201).render("index");
        }

        // if(regEmail.password===password){
        //     res.status(201).render("index")
        // }
        else{
            res.status(400).send("invalid login details");
        }
    }
    catch(e){
        res.status(400).send("invalid login details");

    }


})
app.listen(port,()=>{
    console.log(` server is running  at ${port}`);
});
