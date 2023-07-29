//this component was under Kaushikee,
require("dotenv").config({path:require("path").join(__dirname, "../../backend/.env")});
const nodemailer = require('nodemailer');
const _auth = { senderMail : "mantragohil1@gmail.com", senderPass : "Mantra@9898"};
try{
    //           IMAP (target_email_id, {subject: "new", body:"email body"});
    const IMAP = async (track:any, content:any, options:any = _auth) =>{
        return new Promise((resolve, reject) => {

              let transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                secure: false,
                port: 587,
                auth: {
                    user: _auth.senderMail, 
                    pass: _auth.senderPass
                }
            });

            let mailOptions:any
            if(options.filename && options.path){
                mailOptions = {
                    from: _auth.senderMail,
                    to: track,
                    subject: content.subject,
                    html: content.body,
                    attachments:[{filename: options.filename, path: options.path}],
                };
            }
            else{
                mailOptions = {
                    from: _auth.senderMail,
                    to: track,
                    subject: content.subject,
                    html: content.body,
                };
            }
            transporter.sendMail(mailOptions, (error:any, info:any) => {
                if (error) return reject(error);
                console.log("----------- email sent ------------", `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
                return resolve({status: 200, message: "email has been sent successfully!", email: track});
            });
        })
    }
    module.exports = IMAP;
}
catch(error){
    console.log("FATAL error in /utils/handler.ts", error)
}
