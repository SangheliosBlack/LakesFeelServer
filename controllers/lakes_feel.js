const Usuario = require('../models/usuario');
const Recarga = require('../models/recarga');
const Pulsera = require('../models/pulsera');
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

    },
    crearPulseras:async(req,res)=>{


        for (let i = 0000; i < 1000; i++) {
           
            let number = i
            let result = number.toString().padStart(4, '0')
            
            var nuevaPulsera = new Pulsera();

            nuevaPulsera.numero = result;
            nuevaPulsera.recargas = [];

            await nuevaPulsera.save();
            
        }

        return res.status(200).json();

    },
    sincronizarPulsera:async(req,res)=>{

        const { numero, usuario } = req.body;

        const pulsera = await Pulsera.findOne({numero:numero,usuario:null});

        if(pulsera){

            await Pulsera.findOneAndUpdate({numero:req.body.numero},{$set:{usuario:usuario}});

            await Usuario.findByIdAndUpdate({_id:usuario},{$set:{pulsera:pulsera._id}})

            return res.status(200).json({ok:true});
            
        }else{
            
            return res.status(400).json({ok:false});

        }

    },
    calcularEntradasVendidas:async(req,res)=>{

        const pulseras = await Pulsera.find({recargas:{$exists: true, $not: {$size: 0}}}).count();

        return res.status(200).json({pulseras});

    },
    calcularEquipo:async(req,res)=>{

        const listaRecargas = await Usuario.find({campox:true});
        const listaVentas = await Usuario.find({campoy:true});

        return res.status(200).json({
            usuarios_recargas:listaRecargas,
            usuatios_venta:listaVentas
        });

    },
    calcularRecargas:async(req,res)=>{

        var recargas = await Usuario.aggregate([
            {
                $match:{}
            },{
                $unwind:'$recargas'
            },{
                $group:{
                    _id:'',
                    count:{$sum:"$recargas.cantidad"}
                }
            }
        ]);

        return res.status(200).json({
            recargas
        })

    }

}

module.exports = controller;