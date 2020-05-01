const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendActivationEmail = (email, name, activationToken) => {    
    sgMail
        .send({
            to: email,
            from: "ferraina.matthias@gmail.com",
            subject: "Tu ne le sais pas encore, mais tu vas en baver..",
            html: `<p>Bonjour ${name}, Toutes nos féliitations. Tu as déclenché la fin du monde !</p>
            <p>Nous voulons être sûrs que c'est bien toi le responsable de cet infâme chaos. Clique sur le lien pour nous confirmer ton entière responsabilité :</p><br>
            <a href="${process.env.FRONT_URL}/account/activate?activationToken=${activationToken}">Je confirme que c'est moi qui suis à l'origine de tout ça. Qu'est ce que vous allez faire bande de moulasses ?</a>
            
            `
        })    
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
    sendActivationEmail,
    sendCancelationEmail
}