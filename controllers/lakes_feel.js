const Usuario = require('../models/usuario');
const Venta = require('../models/venta');
const Recarga = require('../models/recarga');
const Pulsera = require('../models/pulsera');
const { validateRequestWithBody } = require('twilio/lib/webhooks/webhooks');
const pulsera = require('../models/pulsera');
const mongoose = require('mongoose');

var controller = {

    obtenerPerfilQr:async(req,res)=>{

        try {
            
            const usuario = await Usuario.findById(req.body._id);

            if(usuario){


                if(usuario.pulsera){

                    const pulsera = await Pulsera.findById(usuario.pulsera);

                    console.log(pulsera);
                    console.log('zfsdfsf');
    
                    if(pulsera){

                        //

                        var complex = await Pulsera.findOne({usuario:req.body._id});

                        console.log(complex);

                        var gastos_usuario = await Venta.find({usuario:complex.usuario});
                        var gastos_pulsera = await Venta.find({usuario:complex._id});

                        var recargas_pulseras = await Pulsera.findById(complex._id);
                        var recargas_usuario = await Usuario.findById(complex.usuario);

                        if(gastos_pulsera == null ) {[]};
                        if(gastos_usuario == null ) {[]};

                        console.log('aqui');

                        var gastos_totales = gastos_usuario.concat(gastos_pulsera);
                        var recargas_totales = recargas_usuario.recargas.concat(recargas_pulseras.recargas);


                        const sumGastos = gastos_totales.reduce((partialSum, a) => partialSum + a.total, 0);
                        const sumaRecargas = recargas_totales.reduce((partialSum, a) => partialSum + a.cantidad, 0);

                        //
    
                        return res.status(200).json({usuario:usuario,total:sumaRecargas-sumGastos});
                    
                    }else{
                        
                        return res.status(400).json({ok:false});
    
                    }

                }else{

                    return res.status(400).json({ok:false});

                }
                

            }else{

                return res.status(400).json({ok:false});

            }


        } catch (error) {

            const pulsera = await Pulsera.findOne({numero:req.body._id});

            console.log(pulsera);

                if(pulsera){    

                    var usuarioLigado = null;

                    
                    if(pulsera.usuario){
                        
                        usuarioLigado = await Usuario.findById({_id:pulsera.usuario});
                    
                    }

                    var usuario = new Usuario();

                    console.log('aqui');
    
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
                    usuario._id =mongoose.Types.ObjectId(pulsera._id) ;
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

                    if(usuarioLigado){

                        usuario.nombre = usuarioLigado.nombre;
                        usuario.pulsera = pulsera._id;

                    }

                    //

                    console.log(req.body._id.length);

                    var complex = null;

                    if(req.body._id.length == 4 ){

                        complex = await Pulsera.findOne({numero:req.body._id});

                    }else{

                        complex = await Pulsera.findOne({usuario:req.body._id});

                    }

                    var gastos_usuario = await Venta.find({usuario:complex.usuario ?? '64791c6c247cb371c6033919'});
                    var gastos_pulsera = await Venta.find({usuario:complex._id});

                    var recargas_pulseras = await Pulsera.findById(complex._id);
                    var recargas_usuario = await Usuario.findById(complex.usuario ?? '64791c6c247cb371c6033919');

                    if(gastos_pulsera == null ) {[]};
                    if(gastos_usuario == null ) {[]};
                    if(recargas_usuario == null) {
                        recargas_usuario = {};
                        recargas_usuario.recargas = [];
                    };

                    var gastos_totales = gastos_usuario.concat(gastos_pulsera);
                    var recargas_totales = recargas_usuario.recargas.concat(recargas_pulseras.recargas);


                    const sumGastos = gastos_totales.reduce((partialSum, a) => partialSum + a.total, 0);
                    const sumaRecargas = recargas_totales.reduce((partialSum, a) => partialSum + a.cantidad, 0);

                    //

                    console.log('final');

                    return res.status(200).json({usuario:usuario,total:sumaRecargas-sumGastos});

                }else{

                    return res.status(400).json({ok:false});

                }

        }

    },
    agregarAbonoCliente:async(req,res)=>{

        console.log(req.body.usuario);

        try {
            
            const newRecarga = new Recarga(req.body);

            const usuario = await Usuario.findById(req.body.usuario);

            console.log(usuario);

            if(usuario){

                if(usuario.pulsera){

                    const pulsera = await Pulsera.findById(usuario.pulsera);
    
                    if(pulsera){
    
                        await Usuario.findByIdAndUpdate({_id:req.body.usuario},{$push:{recargas:newRecarga}});
            
                        return res.status(200).json({ok:true});
                    
                    }else{
                        
                        return res.status(400).json({ok:false});
    
                    }

                }else{

                    return res.status(400).json({ok:false});

                }



            }else{

                console.log('pulsera');

                const pulsera = await Pulsera.findById(req.body.usuario);

                console.log(pulsera);

                if(pulsera){

                    await Pulsera.findByIdAndUpdate({_id:req.body.usuario},{$push:{recargas:newRecarga}});

                    return res.status(200).json({ok:true});

                }else{

                    return res.status(400).json({ok:false});

                }

            }


        } catch (error) {


            console.log(error);
            
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

        var recargasPulseras = await Pulsera.aggregate([
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

        if(recargasPulseras.length <= 0){

            var pre = {};

            pre.count = 0;

            recargasPulseras.push(pre);

        }

        const pulseras = await Pulsera.find({recargas:{$exists: true, $not: {$size: 0}}}).count();

        const usuarios = await Usuario.find().count();


        const listaRecargas = await Usuario.find({repartidor:true});
        const listaVentas = await Usuario.find({hibrido:true});

        listaRecargas.push(listaVentas);

        return res.status(200).json({
            ventas:ventas[0].count,
            recargas:recargas[0].count + recargasPulseras[0].count,
            pulseras:pulseras,
            usuarios:usuarios
        });
        

    }

}

module.exports = controller;