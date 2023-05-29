const Usuario = require('../models/usuario');
const Venta = require('../models/venta');
const Recarga = require('../models/recarga');
const Pulsera = require('../models/pulsera');
const { validateRequestWithBody } = require('twilio/lib/webhooks/webhooks');
const pulsera = require('../models/pulsera');

var controller = {

    obtenerPerfilQr:async(req,res)=>{

        console.log(req.body._id);

        req.body._id = 0000;

        try {
            
            const usuario = await Usuario.findById(req.body._id);

            if(usuario){

                return res.status(200).json(usuario);

            }else{


                const pulsera = await Pulsera.findOne({numero:req.body._id});

                console.log(pulsera);

                if(pulsera){

                    const usuario = new Usuario();
    
                    usuario.online_repartidor = false;
                    usuario.online = false;
                    usuario.dialCode = '';
                    usuario.direcciones = [];
                    usuario.correo = '';
                    usuario.transito = false;
                    usuario.nombre_usuario = ''
                    usuario.nombre = '';
                    usuario.ultima_tarea = new Date();
                    usuario.socio = false;
                    usuario.repartidor = false;
                    usuario.createdAt = new Date();
                    usuario.updatedAt = new Date();
                    usuario.uid = pulsera._id;
                    usuario.numero_celular = '';
                    usuario.customer_id = '';
                    usuario.negocios = [];
                    usuario.recargas = pulsera.recargas;
                    usuario.hibrido = false;

                    console.log(usuario);

                    return res.status(200).json(usuario);

                }else{

                    return res.status(400).json({ok:false});

                }

            }


        } catch (error) {

            console.log('error');

            const pulsera = await Pulsera.findOne({numero:req.body._id});

                console.log(pulsera);

                if(pulsera){    

                    const usuario = new Usuario();
    
                    usuario.online_repartidor = false;
                    usuario.online = false;
                    usuario.dialCode = '';
                    usuario.direcciones = [];
                    usuario.correo = '';
                    usuario.transito = false;
                    usuario.nombre_usuario = ''
                    usuario.nombre = '';
                    usuario.ultima_tarea = new Date();
                    usuario.socio = false;
                    usuario.repartidor = false;
                    usuario.createdAt = new Date();
                    usuario.updatedAt = new Date();
                    usuario.uid = pulsera._id;
                    usuario.numero_celular = '';
                    usuario.customer_id = '';
                    usuario.negocios = [];
                    usuario.recargas = pulsera.recargas;
                    usuario.hibrido = false;

                    usuario.cesta = {};
                    usuario.cesta.productos = [];
                    usuario.cesta.total = 0;
                    usuario.cesta.tarjeta = '';
                    usuario.cesta.codigo = '';
                    usuario.cesta.efectivo = '';
                    usuario.cesta.direccion = {};
                    usuario.cesta.direccion._id = pulsera._id;
                    usuario.cesta.direccion.titulo = '';
                    usuario.cesta.direccion.predeterminado = false;
                    usuario.cesta.direccion.coodernadas = {};
                    usuario.cesta.direccion.coodernadas.lat =0.0;
                    usuario.cesta.direccion.coodernadas.lng =0.0;
                    usuario.cesta.direccion.coodernadas.id =0.0;

                    console.log(usuario);

                    return res.status(200).json(usuario);

                }else{

                    return res.status(400).json({ok:false});

                }

        }

    },
    agregarAbonoCliente:async(req,res)=>{

        try {
            
            const newRecarga = new Recarga(req.body);

            const usuario = Usuario.findById(req.body.usuario);

            if(usuario){

                await Usuario.findByIdAndUpdate({'_id':req.body.usuario},{$push:{recargas:newRecarga}});
    
                return res.status(200).json({ok:true});

            }else{

                const pulsera = Pulsera.findOne({usuario:req.body.usuario});

                if(pulsera){

                    await Pulsera.findByIdAndUpdate({_id:pulsera._id},{$push:{recargas:newRecarga}});

                    return res.status(200).json({ok:true});

                }else{

                    return res.status(400).json({ok:false});

                }

            }


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

        

    },
    admin:async(req,res)=>{

        var ventas = await Venta.aggregate([
            {
                $match:{}
            },{
                $group:{
                    _id:'',
                    count:{$sum:"$total"}
                }
            }
        ]);

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

        const pulseras = await Pulsera.find({recargas:{$exists: true, $not: {$size: 0}}}).count();

        const usuarios = await Usuario.find().count();


        const listaRecargas = await Usuario.find({repartidor:true});
        const listaVentas = await Usuario.find({hibrido:true});

        listaRecargas.push(listaVentas);

        return res.status(200).json({
            ventas:ventas[0].count,
            recargas:recargas[0].count,
            pulseras:pulseras,
            usuarios:usuarios
        });
        

    }

}

module.exports = controller;