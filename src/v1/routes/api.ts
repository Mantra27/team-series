const router = require('express').Router();
const mail = require('../utils/IMAP');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const User = require("../models/user");
const Entry = require("../models/entry");
const Book = require("../models/Book");
const crypt0 = require('crypto');
const pwdreset = require('../models/pwdresetwh');
const proxy = require("../config/proxy");
const {redisClient} = require("../config/db");
const axios = require("axios");
const { otpGen } = require('otp-gen-agent');

require('dotenv').config({ path: path.resolve(__dirname + '/../.env') });
//--------------------------------------------------------------------------------------------------------
const emailVerificationKey = process.env.emailVerificationKey; //secret key to decode email verification urls
const decryptKey4pwdrst = process.env.decryptKey4pwdrst; //secret key to decode password reset urls
// const AiUserDataT0ken = process.env.AiUserDataT0ken; //secret key for storing data for ai model
const jwtKey = process.env.jwtkey; //secret key for all jwt token validation
const fast2smsToken = process.env.fast2smsToken
//--------------------------------------------------------------------------------------------------------

router.use(fileUpload());

router.post("/send-otp", async (req: any, res: any) => {
  const userPhoneNumber = req.body?.phone;
  if(!userPhoneNumber) return res.status(404).send({ status: 404, message: "missing param(s) [phone-number] from the client side"});

  const SessionCookie = uuidv4();
  const otp = await otpGen();

  // Query parameters for the request
  const queryParams = {
    authorization: fast2smsToken,
    route: 'q',
    message: `Hello user, your Series-Store OTP is ${otp}`,
    numbers: userPhoneNumber,
    flash: '0',
  };
  
  // Making the Axios GET request with the query parameters
  axios.get("https://www.fast2sms.com/dev/bulkV2", {
    params: queryParams,
  })
    .then((response:any )=> {
      // Handle the successful response here
      redisClient.set(`OTPTOKEN-${SessionCookie}`, otp, (err:any, reply:any)=>{
        if (err) {
          console.error("Error setting value in Redis:", err);
          return;
        }
        console.log("Value set in Redis:", reply);
      });
      return res.status(200).send({status:200, response: response.data, token: SessionCookie});
    })
    .catch((error:any) => {
      // Handle errors here
      console.error('Error:', error);
    });

});

router.get("/get-books", require("../middlewares/apiTokenVerifier"), async (req:any, res:any)=>{
    await axios.get("http://localhost:8080/books").then((result:any)=>{
      console.log(result.data)
      return res.status(200).send({status: 200, message: "success", books: result.data});
    });
});

router.get("/profile", require("../middlewares/apiTokenVerifier"), async (req:any, res:any)=>{
  req.body = req.body.secret;
  const username = req.body.username;
  const email = req.body.email;
  const img = req.body.email
});

router.post("/add-book", require("../middlewares/apiTokenVerifier"), (req:any, res:any)=>{
    const {title=undefined, genre=undefined, author=undefined, summary=undefined, status=undefined, price=undefined} = req.body;
    if(!title || !genre || !author || !summary || !status || !price) return res.status(404).send({status: 404, message: "param(s) missing from the client side"});
    axios.post("http://localhost:8080/write", {

      title: title,
      genre: genre,
      summary: summary,
      status: status,
      price: price

    }).then((result:any)=>{
      console.log({result})
    })
});

router.get("/get-book-by-title", require("../middlewares/apiTokenVerifier"), (req:any, res:any)=>{
  const title = req.query.title;
  axios(`http://localhost:8080/books/get?title=${title}`).then((result:any)=>{
    return res.send(result.data)
  })
});


router.get("/get-book-by-author", require("../middlewares/apiTokenVerifier"), (req:any, res:any)=>{
  const author = req.query.author;
  axios(`http://localhost:8080/books/get?author=${author}`).then((result:any)=>{
    return res.send(result.data)
  })
});

router.get("/get-book-by-cat", require("../middlewares/apiTokenVerifier"), (req:any, res:any)=>{
  const cat = req.query.cat;
  axios(`http://localhost:8080/books/get?cat=${cat}`).then((result:any)=>{
    return res.send(result.data)
  })
});

router.get("/get-book", require("../middlewares/apiTokenVerifier"), async (req:any, res:any)=>{
  const search = req.query.search;
  let SET:any = [];

  await axios(`https://teamseries.avineshtripathi.repl.co/books/get?cat=${search}`).then((result:any)=>{
    if(result.data.length){
      result.data.map((value:any, key:Number)=>{
        SET.push(value)
      })
    }
  })
  await axios(`https://teamseries.avineshtripathi.repl.co/books/get?author=${search}`).then((result:any)=>{
    if(result.data.length){
      result.data.map((value:any, key:Number)=>{
        SET.push(value)
      })
    }
  })
  await axios(`https://teamseries.avineshtripathi.repl.co/books/get?title=${search}`).then((result:any)=>{
    if(result.data.length){
      result.data.map((value:any, key:Number)=>{
        SET.push(value)
      })
    }
  });
  return res.send(SET)

});



// router.put("/verify-otp", (req: any, res: any) => {
//   const cookie = req.headers?.otptoken;
//   const otp = req.headers?.otp;
//   if (!cookie) return res.status(200).send({ status: 404, message: "invalid /verify-otp token from the client" });
//   if (!otp) return res.status(200).send({ status: 404, message: "invalid /verify-otp otp from the client" });
//   redisClient.get(`OTPTOKEN-${cookie}`).then((reply:any)=>{
//     if(!reply) return res.status(404).send({status: 404, message:"invalid/null otp token"})
//     if(Number(reply) != Number(otp)){
//       return res.status(200).send({status: 404, message: "otp-mismatch", otp: otp});
//     }

//     redisClient.del(`OTPTOKEN-${cookie}`).then((del:any)=>{
//       return res.status(200).send({status: 200, message: "success", otp: otp});
//     })

//   })
// });

router.get("/start-chat", require("../middlewares/apiTokenVerifier"), (req:any, res:any)=>{
    const object = req.query.params.object;
    const subject = req.body.body.username;
    if(!object) return res.send("invalid subject/object");
});

router.post("/add-on-sale", require("../middlewares/apiTokenVerifier"), (req:any, res:any)=>{
    console.log("req.body", req.body);
    const {title, summary, genre, status, price, currentOwner: {name, contactNumber, location, prefferedPaymentMethod}} = req.body;
    if(!title || !summary || !genre || !status || !price || !name || !contactNumber || !location || !prefferedPaymentMethod) return res.status(404).send({status: 404, message: "missing param(s) from the client side"});

});

//-> /fp route is to request password reset
// router.post("/requestpasswordreset", async (req: any, res: any, next: any) => {
//     const { email, IP = "0.0.0.0" } = req.body;
//     try {
//         //cooking the unique url
//         User.findOne({ email: email }).then((resolve: any) => {
//             if (resolve) {
//                 pwdreset.findOne({ email: email }).then(async (Resolve: any) => {
//                     if (Resolve){
//                         console.log({Resolve});
//                         return res.status(200).send({ status: 202, message: `user already resetting his password (${email})` });
//                     }
//                     else {
//                         if(resolve.lastKnownLoginMethod == "google-oauth"){
//                             await mail(email, { subject: "@Dicot Password Reset", body: `` }).then((RESOLVE: any) => {

//                             });
//                         }
//                         const CurrentTime = new Date().getTime();
//                         let mykey = crypt0.createCipher('aes-128-cbc', decryptKey4pwdrst);
//                         let mystr = mykey.update(`{"email": "${email}", "token":"${resolve.username}", "t":"${CurrentTime}"}`, 'utf8', 'hex')
//                         mystr += mykey.final('hex');
//                         await mail(email, { subject: "@Dicot Password Reset", body: proxy + `/api/resetpw?end=${mystr}` }).then((RESOLVE: any) => {
//                             const passwordResetRequest = new pwdreset({
//                                 email: email,
//                                 t: CurrentTime,
//                                 token: resolve.username,
//                                 ip: IP
//                             });
//                             passwordResetRequest.save().then((resolve: any) => {
//                                 console.log("email must be sent");
//                                 return res.status(202).send({ status: 202, message: { respolve: resolve, message: "email also sent" } })
//                             });
//                         });
//                     }
//                 }).catch((error: any) => {
//                     console.log(error);
//                     return res.status(404).send({ status: 404, message: "error while seeing if the current password resetting webhook is in use or not" })
//                 })
//             }
//             else return res.status(404).send({ status: 404, message: `user not even registered` });
//         }).catch((errr: any) => {
//             //this catch means theres no user attached with certain email, hence he/she can't reset the password
//             console.log(errr)
//             return res.status(404).send({ status: 404, message: "error while checking if the user is connected with the email or not(pwd reset)" })

//         })
//     }
//     catch (error) {
//         console.log("!serverWh-line 103!", error);
//         return res.status(404).send({ status: 404, message: 'Internal server error /requestresetpassword' });
//     }

// })

//remember this is a GET request
// router.get("/resetpw", (req: any, res: any, next: any) => {
//     try {
//         if (!req.query.end) return res.status(404).send({ status: 404, message: "unknown endpoint, was expecting endpoint with a query" });
//         let decodedObject = crypt0.createDecipher('aes-128-cbc', decryptKey4pwdrst);
//         let MydecodedParams = decodedObject.update(req.query.end, 'hex', 'utf8')
//         MydecodedParams += decodedObject.final('utf8');

//         //decoding unique url key into normal json format
//         const q1 = JSON.parse(MydecodedParams);
//         console.log(q1)
//         pwdreset.findOneAndDelete({ email: q1.email }).then((RESOLVE: any) => {
//             if (!RESOLVE) {
//                 console.log("pwdreset already exists");
//                 return res.status(404).send({ status: 404, message: "password reset session has been ended" });
//             }
//             else {
//                 res.render("fp", { portal: req.query.end });
//             }

//         })
//     }
//     catch (error) {
//         console.log("!serverWh-line 128!", error);
//         return res.status(404).send({ status: 404, message: 'Internal server error /resetpw' })
//     }
// })

//endpoint for changing password not (resetting it)

// router.post("/changepassword", async (req: any, res: any, next: any) => {
//     if (!req.body.currentPassword || !req.body.newPassword || !req.body.confirmNewPassword || !req.body.email) return res.status(404).send({ status: 404, message: "missing param(s) from the client side" });
//     const { currentPassword, newPassword, confirmNewPassword, email } = req.body;
//     try {
//         //seachingif user exists or not
//         User.findOne({ email: email }).then((zol: any) => {
//             //confirm if user exists w/ basic if & else conditions
//             if (!zol) return res.status(404).send({ status: 404, message: "no user found with the specified email" });
//             if (newPassword != confirmNewPassword) return res.status(404).send({ status: 404, message: "confirm password is incorrect" });
//             bcrypt.compare(currentPassword, zol.password, (err: any, isMatch: any) => {
//                 if (err) return res.json({ status: 404, message: 'cannot match current password' });

//                 //if hashed password in db and currentpassword matches
//                 if (isMatch) {
//                     bcrypt.genSalt(10, async (err: any, salt: any) =>
//                         bcrypt.hash(newPassword, salt, (err: any, newHash: any) => {
//                             if (err) return res.status(404).send({ status: 202, message: "error generating hash from the server, mail us on nandan@dicot.in" });
//                             User.findOneAndUpdate({ email: zol.email, password: newHash }).then((U: any) => {
//                                 if (U) {
//                                     //+ve ultimate password-change endpoint
//                                     return res.status(200).send({ status: 200, message: "password has been changed successfully" });
//                                 }
//                                 else {
//                                     //-ve ultimate password-change endpoint
//                                     console.log("no user found, cannot change the password");
//                                     return res.status(404).send({ status: 404, message: "password cannot be changed!" });
//                                 }
//                             }).catch((eRRor: any) => { console.log("something went wrong while changing password") })
//                         }));
//                 }
//                 else return res.json({ status: 404, message: "current password is incorrect!" });
//             })

//         }).catch((error: any) => {
//             console.log(error);
//             return res.status(404).send({ status: 404, message: JSON.stringify(error) });
//         })
//     }
//     catch (error) {
//         //!logger here
//         console.log("!serverWh-line 172!", error)
//         return res.status(404).send({ status: 404, message: 'Internal server error /changepassword' })
//     }
// });

//ultimate endpoint to change password(critical endpoint)
// router.post("/resetpw", require("../middlewares/passwordresetTimeout"), async (req: any, res: any, next: any) => {
//     try {
//         if (!req.body.password || !req.body.confirmPassword || !req.body.portalToken) return res.status(404).send({ status: 404, message: "missing param(s) from the client side" });
//         const { password, confirmPassword, portalToken } = req.body;

//         if (password != confirmPassword) return res.status(403).send({ status: 403, message: "password mismatch, session also expired" });

//         //decoding using decypher to get email and username
//         let decodedObject = crypt0.createDecipher('aes-128-cbc', decryptKey4pwdrst);
//         let MydecodedParams = decodedObject.update(portalToken, 'hex', 'utf8')
//         MydecodedParams += decodedObject.final('utf8');

//         //json parsening
//         const q1 = JSON.parse(MydecodedParams);

//         //searching for the user via email
//         User.find({ email: q1.email }).then((user: any) => {
//             if (user) {
//                 //double checking user's email and username before resetting the password.
//                 User.find({ username: q1.token }).then((found: any) => {
//                     if (!found) return res.status(404).send({ status: 404, message: "failed to get current username for password reset from the server" });

//                     //resetting the password.
//                     bcrypt.genSalt(10, async (err: any, salt: any) =>
//                         bcrypt.hash(confirmPassword, salt, (err: any, newHash: any) => {
//                             if (err) return res.status(404).send({ status: 202, message: "error generating hash from the server, mail us on nandan@dicot.in" });
//                             User.findOne({ email: q1.email }).then((U: any) => {
//                                 if (U) {
//                                     //+ve ultimate password-change endpoint
//                                     U.password = newHash;
//                                     U.save().then(()=>{
//                                         return res.status(200).send({ status: 200, message: "password has been changed successfully" });
//                                     });
//                                 }
//                                 else {
//                                     //-ve ultimate password-change endpoint
//                                     console.log("no user found, cannot change the password");
//                                     return res.status(404).send({ status: 404, message: "password cannot be changed!" });
//                                 }
//                             }).catch((eRRor: any) => { console.log("something went wrong while changing password") })
//                         }));

//                 })
//             }
//             else return res.status(404).send({ status: 404, message: "failed to get current email for password reset from the server" })
//         })
//     }
//     catch (error) {

//         console.log("!serverWh-line 199!", error)
//         return res.status(404).send({ status: 404, message: 'Internal server error /resetpw(post)' })
//     }

// });


export { }
module.exports = router