const router = require("express").Router({mergeParams: true});
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const passport = require("passport");
const session = require('express-session');
const mail = require("../utils/IMAP");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const path = require("path");
const crypt0 = require('crypto');
const { v4: uuidv4 } = require('uuid');
const proxy = require("../config/proxy");
const frontendProxy = require("../config/frontendProxy");
const {redisClient} = require("../config/db");

require('dotenv').config({path: path.resolve(__dirname + '/../.env')});

//-–––––––––––––––––––––––––––––––––––––––––––––-----------------
const jwtKey = process.env.jwtkey
const ConnectionT0kenKey = process.env.ConnectionT0kenKey;
const emailVerificationKey = process.env.emailVerificationKey; //secret key to decode email verification urls
//-–––––––––––––––––––––––––––––––––––––––––––––-----------------

router.get("/test", async (req:any, res:any, next:any)=>{
    return res.status(200).send({status: 200, message:"/auth endpoint is up and running!"})
});

// router.get("/login", (req:any, res:any, next:any)=>{
//     return res.sendFile("index.html", {root: "/Users/surge/Desktop/code/dicot/v2/frontend/login/build"})
// });

// //passport google strategy
// passport.use(new GoogleStrategy({
//     clientID: "1014276340059-orscm84ijkimm5vp5qkemp1kmjl4cvpe.apps.googleusercontent.com",
//     clientSecret: "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",
//     callbackURL: "http://localhost:3000/auth/login"
// },
//     async (accessToken:any, refreshToken:any, profile:any, done:any)=>{
//         await done(null, profile);
//     }
// ));

passport.use(new LocalStrategy(
    function(username:String, password:String, done:any) {
      User.findOne({ username: username }, function (err:any, user:any) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        bcrypt.compare(password, user.password).then((resolve:any)=>{
            if(!resolve) { return done(null, false);}
            else return done(null, user);
        })
        
      });
    }
  ));

passport.serializeUser(function(user:any, done:any) {
    done(null, user);
});

passport.deserializeUser(function(user:any, done:any) {
    done(null, user);
});

//google oauth functionalities
// router.get("/google", passport.authenticate("google", {scope: ["profile"]}));

// router.get("/google/callback", passport.authenticate("google", {
//     successRedirect: "proxy/",
//     failureRedirect: "/auth/login"
// }));

router.post("/google", (req:any, res:any)=>{
    console.log(req.body)
    console.log("google login request")
    const body = req.body;
    const IP = "0.0.0.0";
    User.findOne({email: req.body.profileObj.email}).then((user:any)=>{
        //user logged in via google for the first time
        if(!user){
            new User({
                username: req.body.profileObj.name,
                email: req.body.profileObj.email,
                password: req.body.tokenObj.access_token,
                contactNumber: 1234567890,
                location: "India",
                lastKnownLoginMethod: "google",
                lastLoginTime: new Date().getTime(),
                lastLoggedInIp: IP,
                img: req.body.profileObj.imageUrl
            }).save().then((newUser:any)=>{

                const token = jwt.sign({ip:IP, creation: new Date().getTime(), expires: null, username: req.body.profileObj.name, email: req.body.profileObj.email}, jwtKey);
                return res.status(200).send({status: 200, message:"a new user created successfully", user: newUser, jwt: token});

            })
        }
        //user already exists
        else{
            user.lastKnownLoginMethod = "google";
            user.lastLoginTime = new Date().getTime();
            user.lastLoggedInIp = IP;
            user.save().then((updatedUser:any)=>{
                const token = jwt.sign({ip:IP, creation: new Date().getTime(), expires: null, username: req.body.profileObj.name, email: req.body.profileObj.email}, jwtKey);
                return res.status(200).send({status: 200, message:"user updated successfully", user: updatedUser, jwt: token})
            })
        }
    })
});

async function Login(email:any, password:any, res:any){
    if(!email || !password) return res.status(202).send({status: 202, message:"username or password is in invalid format from the client's end"});
    await User.findOne({email: email}).then(async (user:any)=>{
        if(user){
            bcrypt.compare(password, user.password, (err:any, isMatch:any)=>{
                if(err){ console.log("had error while matching passwords"); return res.json({status:404, message: 'cannot match password'});}
                //jwt token will be given here...

                if(isMatch){
                    const Ip = "0.0.0.0";
                    const token = jwt.sign({ip:Ip, creation: new Date().getTime(), expires: null, username: user.username, email: email}, jwtKey);
                    return res.json({token:token, status: 'ok', message: "login done(t0ken also sent)"})
                }
                else{
                    if(user.lastKnownLoginMethod == "google-oauth"){
                        return res.json({status: 401, message: `Email: ${user.email} already linked with google account, try loggin in with Google instead.`});
                    }
                    return res.json({status: 404, message: "Wrong credentials, try checking email or password again."});
                }
            })
        }
        else return res.json({status: 404, message:"Wrong credentials, try checking email or password again."});
    }).catch((ERRor:any)=>{
        console.log(ERRor);
    })
}

//tradition login method
router.post("/login", async (req:any, res:any, next:any) => {
    try{
        await Login(req?.body?.email, req.body?.password, res);
    }
    catch(LoginError){
        console.log(LoginError);
    }
});

// //passport method
// router.post('/login', 
//   passport.authenticate('local', { failureRedirect: '/login' }),
//   function(req:any, res:any) {
//     res.redirect('localhost:3000/billing');
//   });

router.get("/localLoginDone", (req:any, res:any)=>{
    res.status(200).send("<h1>login done</h1>");
});

//this endpoint will be used when user logges in from cookie
router.post("/verifyjwt", (req:any, res:any)=>{
    const {token, Ip} = req.body;
    jwt.verify(token, jwt.verify, (decoded:any)=>{
        console.log("cookie is expired, redirecting user to login/register");
        if((-decoded.creation) + (new Date().getTime()) > decoded.expires) return res.redirect("/");
        if(Ip == decoded.ip){
            return res.status(200).json({statusCode:200, message:"jwt verified", token: token, jwtKey});
        }
        else return res.redirect("/");
    })
});
router.post("/register", async (req:any, res:any)=>{
    console.log("//regster", req.body)
    if(!req.body.username || !req.body.email || !req.body.password || !req.body.contactNumber) return res.status(200).send({status: 404, message: "One of your input field(s) is missing from your side"});
    const {username, email, password, contactNumber} = req.body;
    const cookie = req.body?.otpToken;
    const otp = req.body?.otp;
    if (!cookie) return res.status(200).send({ status: 404, message: "invalid /verify-otp token from the client" });
    if (!otp) return res.status(200).send({ status: 404, message: "invalid /verify-otp otp from the client" });
    redisClient.get(`OTPTOKEN-${cookie}`).then((reply:any)=>{
        if(!reply) return res.status(404).send({status: 404, message:"invalid/null otp token"})
        if(Number(reply) != Number(otp)){
            return res.status(200).send({status: 404, message: "otp-mismatch", otp: otp});
        }

        redisClient.del(`OTPTOKEN-${cookie}`).then(async (del:any)=>{
            console.log("otp matched")
            await User.findOne({email : email}).then(async (err2:any, user:any)=>{
                if(!user){
                    await User.findOne({username: username}).then(async (err2:any, user2:any)=>{
                        if(!user2){
                            const setNewUser = new User({
                                username: username,
                                email: email,
                                password: password,
                                location: "India",
                                contactNumber: contactNumber,
                                img:`https://avatars.dicebear.com/api/bottts/${uuidv4()}.svg`,
                                lastKnownLoginMethod: "traditional",
                                lastLoginTime: new Date().getTime(),
                            });
                                bcrypt.genSalt(10, async (err:any, salt:any)=> 
                                        bcrypt.hash(setNewUser.password, salt, (err:any, hash:any)=> {
                                            if(err) return res.status(200).send({status: 404, message:"error generating hash from the server, mail us on nandan@dicot.in"});
                                                setNewUser.password = hash;
                                                setNewUser.save()
                                            .then(async(value:any)=>{
                                                console.log('a user succesfully registered', setNewUser.email);
                                                //do login him
                                                return Login(email, password, res);
                                            })
                                            .catch((value:any) => console.log(value));
                                }));
                        }
                        else return res.status(200).send({status:404, message: "Sorry but that username is already in use"})
                    });
                }
                else {
                    if(user.lastKnownLoginMethod == "google"){
                        return res.status(200).send({status:404, message: "Sorry but that email is already is linked to another google account", lastLoginMethod: user.lastKnownLoginMethod})
                    }
                    return res.status(200).send({status:404, message: "Sorry but that email is already in use"})
                }
            });
        })

    })
    
});

router.get("/verifyme", (req: any, res: any, next: any) => {
    try {
        //uncooking the unique url
        let decodedValue = crypt0.createDecipher('aes-128-cbc', emailVerificationKey);
        let MydecodedParams = decodedValue.update(req.query.token, 'hex', 'utf8')
        MydecodedParams += decodedValue.final('utf8');
        //responsing the client with ans from the decrypted url
        const q1 = JSON.parse(MydecodedParams);
        User.findOneAndUpdate({ email: q1.email }, { isEmailVerified: true }).then((resolve: any) => {
            if (resolve) return res.render("idle", { username: q1.email });
        })
    }
    catch (e) { 
        return res.status(404).send(`<h1>An Error occured, we're redirecting you to the homepage in 3 seconds. </h1><script>setTimeout(()=>{window.location.replace("${frontendProxy}");}, 3000)</script>`); }
});

router.get('/logout', function(req:any, res:any, next:any) {
    req.logout(function(err:any) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});

router.get("/*", (req:any, res:any, next:any)=>{
    return res.redirect("/404");
});

export {}
module.exports = router;