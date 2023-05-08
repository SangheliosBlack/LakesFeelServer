const Usuario = require('../models/usuario');
const Recarga = require('../models/recarga');
const { validateRequestWithBody } = require('twilio/lib/webhooks/webhooks');

var controller = {

    obtenerPerfilQr:async(req,res)=>{

        try {
            
            const usuario = await Usuario.findById(req.body._id);

            return res.status(200).json(usuario);

        } catch (error) {
            
            return res.status(400).json({ok:false})

        }

    },
    agregarAbonoCliente:async(req,res)=>{

        console.log(req.body);

        try {
            
            const newRecarga = new Recarga(req.body);

            await Usuario.findByIdAndUpdate({'_id':req.body.usuario},{$push:{recargas:newRecarga}});

            return res.status(200).json({ok:true});

        } catch (error) {

            
            return res.status(400).json({ok:false});

        }

    }

}

module.exports = controller;