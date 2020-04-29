const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendActivationEmail = (email, name) => {
    console.log('sending an email');
    
    sgMail
        .send({
            to: email,
            from: "ferraina.matthias@gmail.com",
            subject: "Tu ne le sais pas encore, mais tu vas en baver..",
            text: `<p>Bonjour ${name}, Toutes nos féliitations. Tu as déclenché la fin du monde !</p>
            <p>Nous voulons être sûr que c'est bien toi le responsable de ce chaos clique ici pour nous confirmer ton entière responsabilité :</p>
            
            `
        })
        console.log('email sent');
    
}

const sendCancelationEmail = (email, name) => {
    sgMail
        .send({
            to: email,
            from: "ferraina.matthias@gmail.com",
            subject: "Mais non il ne faut pas partir !",
            text: `Bha alors ${name}? Pourquoi nous quittes-tu ? :( . On compte sur toi pour nous dire tout ce qui n'a pas été, on alors ce sur quoi on peut s'améliorer.`
        })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}