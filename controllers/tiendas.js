const stripe = require('stripe')('sk_test_51IDv5qAJzmt2piZ3A5q7AeIGihRHapcnknl1a5FbjTcqkgVlQDHyRIE7Tlc4BDST6pEKnXlcomoyFVAjeIS2o7SB00OgsOaWqW');
const ListaProductos = require('../models/lista_productos');
const UsuarioVenta = require('../models/usuario_venta');
const Notificacion = require('../notificaciones');
const Direccion = require('../models/direccion');
const haversine = require('haversine-distance')
const Usuario = require('../models/usuario');
const Horario = require('../models/horario');
const Tienda = require('../models/tiendas');
const Pedido = require('../models/pedido');
const Venta = require('../models/venta');
const Ruta = require('../models/rutas');
const mongoose = require('mongoose');
const moment = require('moment');
const Axios = require('axios');
const pedido = require('../models/pedido');
const Abono = require('../models/abono');
const Pulsera = require('../models/pulsera');
const { json } = require('express');
const Estado = require("../models/estado");
const { TrustProductsEntityAssignmentsList } = require('twilio/lib/rest/trusthub/v1/trustProducts/trustProductsEntityAssignments');

var controller = {

    crearPedido:async (req,res)=>{


        var {total,tarjeta,productos,efectivo,codigo,direccion} = JSON.parse(req.body.cesta);

        var {abonoReq,envio,usuario,servicio,customer,tienda_ropa,liquidado,apartado} = req.body;

        //

        Venta.
        find({usuario:mongoose.Types.ObjectId(req.body.usuario)}).
        sort({'updatedAt':-1}).
        populate('pedidos.repartidor').
        populate({
            path:'pedidos.repartidor',
            populate:{path:'negocios'},
        }).
        exec( async function(err,data){

            if(err) {

                return res.json({ok:false});

            }
            const sumGastos = data.reduce((partialSum, a) => partialSum + a.total, 0);
            
            var recargas = await Usuario.findById(req.body.usuario);

            const pulsera = await Pulsera.findOne({usuario:req.body.usuario});


            if(pulsera){

                var bubble = recargas.recargas.concat(pulsera.recargas);

                recargas.recargas = bubble;

                console.log(bubble);

            }
            
            const sumaRecargas = recargas.recargas.reduce((partialSum, a) => partialSum + a.cantidad, 0);


            if((sumaRecargas-sumGastos)>total){

                var venta = new Venta();
    
                venta.total = total;
                venta.envioPromo = codigo ? envio.toFixed(2) :0;
                venta.codigo_promo = codigo ? codigo : '';
                venta.envio = envio.toFixed(2);
                venta.direccion = direccion;
                venta.efectivo = true;
                venta.servicio = servicio;
                venta.usuario = usuario;
                venta.apartado = apartado;
                venta.plus = true;
                venta.liquidado = liquidado;
                venta.abonos = [];
    
                var pedidos = [];
        
                for(const element in productos){
        
                    if(!pedidos.some(elem=> elem.tienda == productos[element].tienda)){
        
                        var subElement = {};
    
                        var usuarioData = await Usuario.findById({_id:usuario});
                        var usuarioVenta = new UsuarioVenta();
                        var direccion_negocio = new Direccion();

                        direccion_negocio.coordenadas={};
                        direccion_negocio.coordenadas.lat = 0.0;
                        direccion_negocio.coordenadas.lng = 0.0;
                        direccion_negocio.titulo = '';
                        direccion_negocio.predeterminado = false;
                

                        usuarioVenta.imagen = 'https://www.blogdelfotografo.com/wp-content/uploads/2020/02/apoyado12-scaled.jpg';
                        usuarioVenta.nombre = usuarioData.nombre;
                        usuarioVenta._id = usuarioData._id;
                    
                        subElement.total = (productos[element].precio + productos[element].extra) * productos[element].cantidad;
                        subElement.tienda = productos[element].tienda;
                        subElement.productos = [productos[element]];
                        subElement.imagen = '';
                        subElement.punto_venta = '';
                        subElement.efectivo = efectivo;
                        subElement.usuario = usuarioVenta;
                        subElement.tiempo_espera = 0;
                        subElement.envio = 0;
                        subElement.direccion_negocio = direccion_negocio;
                        subElement.direccion_cliente = direccion;
                
                        pedidos.push(subElement);
        
                    }else{
        
                        var objIndex = pedidos.findIndex((obj => obj.tienda == productos[element].tienda));
                        pedidos[objIndex].total = pedidos[objIndex].total + ((productos[element].precio + productos[element].extra) * productos[element].cantidad);
                        pedidos[objIndex].productos.push(productos[element]);
                    
                    }

                }
        
                var pedidosSchema = [];
            
                for(const element in pedidos){
                
                    var pedidosModel = new Pedido(pedidos[element]);
        
                    pedidosModel.entregado_cliente = false;
                    pedidosModel.entregado_repartidor = false;
                    pedidosModel.confirmado = false;
                    pedidosModel.createdAt = new Date();
                    pedidosModel.updatedAt = new Date();
                    pedidosModel.repartidor_domicilio = false;
                    pedidosModel.repartidor_calificado = false;
                    pedidosModel.id_venta = venta._id;
                    pedidosModel.codigo_repartidor = Math.floor(1000 + Math.random() * 9000);
                    pedidosModel.codigo_cliente = Math.floor(1000 + Math.random() * 9000);
    
                    pedidosSchema.push(pedidosModel);
                }
            
                venta.pedidos = pedidosSchema;
                venta.negocio = pedidosSchema[0].tienda;

            
                await venta.save();
    
    
                return res.status(200).json(venta);

            }else{

                return res.status(400).json({ok:false});

            }

        });
        //
    },
    construirPantallaPrincipalTiendas:async (req,res)=>{

        const tiendas = await Tienda.aggregate(
            [
                {
                    $match:{
                        tienda_ropa:false,
                        disponible:true
                    }
                
                },{
                    $lookup:{
                        from: 'listaproductos',
                        localField: 'productos',
                        foreignField: '_id',
                        as:'listaProductos'
                    }
                },
                {
                    $project:{
                        auto_impresion:'$auto_impresion',
                        tiempo_espera:'$tiempo_espera',
                        nombre:'$nombre',
                        propietario:'$propietario',
                        disponible:'$disponible',
                        productos:'$productos',
                        aniversario:'$aniversario',
                        createdAt:'$createdAt',
                        updatedAt:'$updatedAt',
                        uid:'$uid',
                        horario:'$horario',
                        coordenadas:'$coordenadas',
                        fotografias:'$fotografias',
                        inventario:'$inventario',
                        equipo:'$equipo',
                        ventas:'$ventas',
                        direccion:'$direccion',
                        online:'$online',
                        punto_venta:'$punto_venta',
                        imagen_perfil:'$imagen_perfil',
                        sugerencia:"$sugerencia",
                        listaProductos:{
                            $arrayElemAt:['$listaProductos',0]
                        }
                    }
                },
                {
                    $project:{
                        auto_impresion:'$auto_impresion',
                        tiempo_espera:'$tiempo_espera',
                        nombre:'$nombre',
                        propietario:'$propietario',
                        disponible:'$disponible',
                        productos:'$productos',
                        aniversario:'$aniversario',
                        createdAt:'$createdAt',
                        updatedAt:'$updatedAt',
                        uid:'$uid',
                        horario:'$horario',
                        coordenadas:'$coordenadas',
                        direccion:'$direccion',
                        fotografias:'$fotografias',
                        inventario:'$inventario',
                        online:'$online',
                        equipo:'$equipo',
                        ventas:'$ventas',
                        sugerencia:"$sugerencia",
                        punto_venta:'$punto_venta',
                        imagen_perfil:'$imagen_perfil',
                        listaProductos:'$listaProductos.productos'
                },
                
    
            },{
                $sort:{
                    "nombre":1
                }
            }
                
            ]
        );
    
        return res.json({
            ok:true,        
            tiendas,
        });

    },
    busqueda:async(req,res)=>{

        const listaTiendas = await Tienda.aggregate(
            [
                {
                        $match:{
                            tienda_ropa:false,
                            disponible:true
                        }
                
                },{
                    $lookup:{
                        from: 'listaproductos',
                        localField: 'productos',
                        foreignField: '_id',
                        as:'listaProductos'
                    }
                },
                {
                    $project:{
                        auto_impresion:'$auto_impresion',
                        tiempo_espera:'$tiempo_espera',
                        nombre:'$nombre',
                        propietario:'$propietario',
                        disponible:'$disponible',
                        productos:'$productos',
                        aniversario:'$aniversario',
                        createdAt:'$createdAt',
                        updatedAt:'$updatedAt',
                        uid:'$uid',
                        horario:'$horario',
                        coordenadas:'$coordenadas',
                        fotografias:'$fotografias',
                        inventario:'$inventario',
                        equipo:'$equipo',
                        ventas:'$ventas',
                        direccion:'$direccion',
                        online:'$online',
                        punto_venta:'$punto_venta',
                        sugerencia:"$sugerencia",
                        imagen_perfil:'$imagen_perfil',
                        listaProductos:{
                            $arrayElemAt:['$listaProductos',0]
                        }
                    }
                },
                {
                    $project:{
                        auto_impresion:'$auto_impresion',
                        tiempo_espera:'$tiempo_espera',
                        nombre:'$nombre',
                        propietario:'$propietario',
                        disponible:'$disponible',
                        productos:'$productos',
                        aniversario:'$aniversario',
                        createdAt:'$createdAt',
                        updatedAt:'$updatedAt',
                        uid:'$uid',
                        horario:'$horario',
                        coordenadas:'$coordenadas',
                        direccion:'$direccion',
                        fotografias:'$fotografias',
                        inventario:'$inventario',
                        online:'$online',
                        equipo:'$equipo',
                        ventas:'$ventas',
                        sugerencia:"$sugerencia",
                        punto_venta:'$punto_venta',
                        imagen_perfil:'$imagen_perfil',
                        listaProductos:'$listaProductos.productos'
                },
    
            }
                
            ]
        );
    
        const listaProductos = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        'tienda':{
                            $not:{
                                $eq:'Black Shop'
                            }
                        }
                    }
                },{
                    $unwind:'$productos'
                },{
                    $project:{
                        _id:'$productos._id',
                        precio:'$productos.precio',
                        nombre:'$productos.nombre',
                        descuentoP:'$productos.descuentoP',
                        descuentoC:'$productos.descuentoC',
                        descripcion:'$productos.descripcion',
                        disponible:'$productos.disponible',
                        categorias:'$productos.categoria',
                        imagen:'$productos.imagen',
                        comentarios:'$productos.comentarios',
                        opciones:'$productos.opciones',
                        tienda:'$productos.tienda',
    
                    }
                }
            ]
        );
    
        var busqueda = req.body.busqueda.toLowerCase();
    
        function autocompleteMatchProductos(input) {
            if (input == '') {
              return [];
            }
            var reg = new RegExp(input)
            
            return listaProductos.filter(function(term) {
                if (term.categorias.toLowerCase().match(reg)) {
                  return term;
                }
            });
        }
    
        function autocompleteMatchTiendas(input) {
            if (input == '') {
              return [];
            }
            var reg = new RegExp(input)
            
            return listaTiendas.filter(function(term) {
                if (term.nombre.toLowerCase().match(reg)) {
                  return term;
                }
            });
        }
    
        var productos = autocompleteMatchProductos(busqueda)
    
        var tiendas = autocompleteMatchTiendas(busqueda);

    
        return res.json({
            ok:true,
            productos,
            tiendas
        })

    },
    busquedaPrendaSku: async(req,res)=> {

        const listaProductos = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        'tienda':{
                                $eq:'Black Shop'
                        }
                    }
                },{
                    $unwind:'$productos'
                },{
                    $project:{
                        _id:'$productos._id',
                        precio:'$productos.precio',
                        nombre:'$productos.nombre',
                        descuentoP:'$productos.descuentoP',
                        descuentoC:'$productos.descuentoC',
                        descripcion:'$productos.descripcion',
                        disponible:'$productos.disponible',
                        categorias:'$productos.categoria',
                        imagen:'$productos.imagen',
                        comentarios:'$productos.comentarios',
                        opciones:'$productos.opciones',
                        tienda:'$productos.tienda',
                        sku:'$productos.sku'
                    }
                }
            ]
        );

         function autocompleteMatchProductos(input) {
            if (input == '') {
              return [];
            }
            var reg = new RegExp(input)
            
            return listaProductos.filter(function(term) {
                if (term.sku.toLowerCase().match(reg)) {
                  return term;
                }
            });
        }

        return res.status(200).json({
            productos:autocompleteMatchProductos(listaProductos)
        });

    },
    busquedaPrenda: async(req,res)=> {

        const listaProductos = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        'tienda':{
                                $eq:'Black Shop'
                        }
                    }
                },{
                    $unwind:'$productos'
                },{
                    $project:{
                        _id:'$productos._id',
                        precio:'$productos.precio',
                        nombre:'$productos.nombre',
                        descuentoP:'$productos.descuentoP',
                        descuentoC:'$productos.descuentoC',
                        descripcion:'$productos.descripcion',
                        disponible:'$productos.disponible',
                        categorias:'$productos.categoria',
                        imagen:'$productos.imagen',
                        comentarios:'$productos.comentarios',
                        opciones:'$productos.opciones',
                        tienda:'$productos.tienda',
                        sku:'$productos.sku'
                    }
                }
            ]
        );

        var busqueda = req.body.busqueda.toLowerCase();

         function autocompleteMatchProductos(input) {
            if (input == '') {
              return [];
            }
            var reg = new RegExp(input)
            
            return listaProductos.filter(function(term) {
                if (term.nombre.toLowerCase().match(reg) || term.sku.match(reg)) {
                  return term;
                }
            });
        }

        return res.status(200).json({
            ok:true,
            productos:autocompleteMatchProductos(busqueda),
            tiendas:[]
        });

    },
    verTodoProductos:async(req,res)=>{

        const productos = await ListaProductos.aggregate(
            [
                {
                    $match:{}
                },{
                    $unwind:'$productos'
                },{
                    $project:{
                        _id:'$productos._id',
                        categorias:'$productos.categoria',
                        nombre:'$productos.nombre',
                        precio:'$productos.precio',
                        descripcion:'$productos.descripcion',
                        descuentoP:'$productos.descuentoP',
                        descuentoC:'$productos.descuentoC',
                        sugerencia:"$productos.sugerencias",
                        disponible:'$productos.disponible',
                        comentarios:'$productos.comentarios',
                        tienda:'$productos.tienda',
                        subCategoria:'$productos.subCategoria',
                        
                        opciones:'$productos.opciones',
    
                    }
                }
            ]
        );
    
        return res.json({
            ok:true,        
            productos
        });

    },
    verTodoTiendas:async (req,res)=>{

        const tiendas = await Tienda.aggregate(
            [
                {
                    $match:{
                        tienda_ropa:false,
                        disponible:true
                    }
                
                },
                {
                    $addFields:{
                        'uid':'$_id',
                        'listaProductos':[]
                    }
                },{
                    $sort:{
                        "nombre":1
                    }
                }
                
                
            ]
        );

        return res.json({
            ok:true,        
            tiendas,
        });

    },
    obtenerProductosTienda : async (req,res)=>{

        const body = req.body;
    
        const tienda = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        '_id':mongoose.Types.ObjectId(body.id)
                    }
                
                },
                {
                    $lookup:{
                        from: 'listaproductos',
                        localField: 'productos',
                        foreignField: '_id',
                        as:'listaProductos'
                    }
                }
                
                
            ]
        );
    
        const categorias = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        '_id':mongoose.Types.ObjectId(body.id)
                    }
                },{
                    $unwind:'$productos'
                },{
                    $group:{
                        _id:0,
                        categorias:{$addToSet:'$productos.subCategoria'}
                    }
                }
            ]
        );
    
        var definitivo =  [];
    
        if(categorias.length > 0){
    
            categorias[0].categorias.forEach(function(currentValue1, index1){
    
                var pre = {};
          
                pre.titulo = currentValue1;
                pre.productos = [];
    
                definitivo.push(pre);
    
                tienda[0].productos.forEach(function(currentValue2, index2){
              
                    if(currentValue1 == currentValue2.subCategoria){
                        
                        definitivo[index1].productos.push(currentValue2);
                
                    }
              
                });
          
            });
      
        }

        definitivo.sort((a, b) => a.titulo.localeCompare(b.titulo));
    
        return res.json(
            {
                ok:true,
                productos:definitivo
            }
        );
    
    },
    construirPantallaPrincipalCategorias : async (req,res)=>{

        const categorias = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        'tienda':{
                            $not:{
                                $eq:'Black Shop'
                            }
                        }
                    }
                },{
                    $unwind:'$productos'
                },{
                    $group:{
                        _id:0,
                        categorias:{$addToSet:'$productos.categoria'}
                    }
                }
            ]
        );

        categorias[0].categorias.sort();
    
        return res.json(
                categorias[0].categorias
        );
    
    },
    obtenerProductosCategoria : async(req,res)=>{

        var productos = await ListaProductos.aggregate(
            [
                {
                    $match:{}
                },{
                    $project:{
                       productos:{
                               $filter:{
                                   input:'$productos',
                                   as:'item',
                                   cond:{$eq:['$$item.categoria',req.body.filtro]}
                               }
                       },
                       tienda:'$tienda'
                    }
                },{
                    $lookup:{
                        from:'tiendas',
                        localField:'tienda',
                        foreignField:'nombre',
                        as:'tiendas'
                    }
                }
            ]
        );
    
        
        var productosFilter = productos.filter(function(obj){

            return obj.productos.length > 0;

        });
    
        return res.json({
            ok:true,
            productos:productosFilter[0].productos,
            tiendas:productosFilter[0].tiendas
        });

    },construirPantallaPrincipalProductos : async (req,res)=>{

        const productos = await ListaProductos.aggregate(
            [
                {
                    $match:{
                        'tienda':{
                            $not:{
                                $eq:'Black Shop'
                            }
                        }
                    }
                },{
                    $unwind:'$productos'
                },{
                    $project:{
                        _id:'$productos._id',
                        categorias:'$productos.categoria',
                        nombre:'$productos.nombre',
                        precio:'$productos.precio',
                        descripcion:'$productos.descripcion',
                        sugerencia:'$productos.sugerencia',
                        descuentoP:'$productos.descuentoP',
                        descuentoC:'$productos.descuentoC',
                        disponible:'$productos.disponible',
                        comentarios:'$productos.comentarios',
                        tienda:'$productos.tienda',
                        opciones:'$productos.opciones',
                        subCategoria:'$productos.subCategoria'
                    }
                }
            ]
        );
    
        var index = 0;
        var separados = [];
        var contador = 1;
        var limite = 0;

        var shuffledArray = productos.sort(function(){
            return Math.random() - 0.5;
        });

        shuffledArray.splice(15,shuffledArray.length-14);

    
        do{

            if(index==0){

                var nuevo = {};
                nuevo.linea = limite;
                nuevo.productos = [];
                separados.push(nuevo);

            }else if(contador >= 4){

                limite ++;
                contador = 1;
                var nuevo = {};
                nuevo.linea = limite;
                nuevo.productos = [];
                separados.push(nuevo);
            
            }

            separados[limite].productos.push(shuffledArray[index])
            index++;
            contador ++;
            
        }while(index<shuffledArray.length);
    

            return res.json({
                ok:true,
                separados
            });

        
    
    },
    obtenerTienda : async (req,res)=>{

        const usuario = await Usuario.findOne({_id:req.uid});


        if(req.body.token){
    
            var tienda = await Tienda.findOne({punto_venta:req.body.token});


            if(tienda){

                
                const productos = await ListaProductos.findById(tienda.productos);
                
                tienda.listaProductos = productos.productos;
                
                return res.json(   
                    tienda
                    );
            }else{
                

                if(usuario.negocios.length > 0){
                    
                    var tienda = await Tienda.findById(usuario.negocios[0]);
            
                    const productos = await ListaProductos.findById(tienda.productos);
            
                    tienda.listaProductos = productos.productos;
            
                    return res.json(   
                        tienda
                    );
    
                }else{
    
                    return res.status(400).json({ok:false});
    
                }
    
            }
    
        }else{

            if(req.body.tienda){
    
                const tienda = await Tienda.findById(req.body.tienda);
        
                const productos = await ListaProductos.findById(tienda.productos);
        
                tienda.listaProductos = productos.productos;
        
                return res.json(   
                    tienda
                );
        
            }else{
                
                if(usuario.negocios.length > 0){
                    
                    const tienda = await Tienda.findById(usuario.negocios[0]);
            
                    const productos = await ListaProductos.findById(tienda.productos);
            
                    tienda.listaProductos = productos.productos;
            
                    return res.json(   
                        tienda
                    );
    
                }else{
    
                    return res.status(400).json({ok:false});
    
                }
    
            }
        }
    
    },
    confirmarPedidoRestaurante : async (req,res)=>{

        try{

            const value = await Venta.findOneAndUpdate(
                {
                    "_id":mongoose.Types.ObjectId(req.body.uidVenta)
                },{
                    $set:{'pedidos.$[i].confirmado':true,'pedidos.$[i].confirmacion_tiempo':new Date()}
                },{
                    arrayFilters:[
                        {
                            "i._id":mongoose.Types.ObjectId(req.body.uid)
                        }
                    ]
                }
            )
    
            if(value){
    
                return res.status(200).json({ok:true});
    
            }else{
    
                return res.status(400).json({ok:false});
    
            }
        
        }catch(e){
    
            return res.status(400).json({ok:false});
    
        }
    
    },
    confirmarPedidoRepartidor : async(req,res)=>{

        try{

            await Venta.findOneAndUpdate(
                {
                    "_id":mongoose.Types.ObjectId(req.body.uid)
                },{
                    $set:{'pedidos.$[i].entregado_repartidor':true,'pedidos.$[i].entrega_repartidor_tiempo':new Date()}
                },{
                    arrayFilters:[
                        {
                            "i._id":mongoose.Types.ObjectId(req.body.uidVenta)
                        }
                    ]
                }
            )

            const tienda = Tienda.findById(req.body.tienda);
            
            await stripe.payouts.create({
                amount: (req.body.total*86.4).toFixed(2)*100,
                currency: 'mxn',
                method: 'instant',
            }, {
                stripe_account: tienda.stripe_account_id,
            });
    
            return res.status(200).json({ok:true});

        }catch(e){
    
            return res.status(400).json({ok:false});
    
        }
    
    },
    confirmarPedidoCliente : async(req,res)=>{

        try{

            await Venta.findOneAndUpdate(
                {
                    "_id":mongoose.Types.ObjectId(req.body.uid)
                },{
                    $set:{'pedidos.$[i].entregado_cliente':true,'pedidos.$[i].entrega_cliente_tiempo':new Date()}
                },{
                    arrayFilters:[
                        {
                            "i._id":mongoose.Types.ObjectId(req.body.uidVenta)
                        }
                    ]
                }
            )
    
    
            const usuarioCheck =  await Usuario.findByIdAndUpdate(req.uid,{$set:{notificado:false,transito:false,ultima_tarea:new Date()}});
            
            await stripe.payouts.create({
                amount: req.body.envio.toFixed(2)*100,
                currency: 'mxn',
                method: 'instant',
            }, {
                stripe_account: usuarioCheck.stripe_account_id,
            });

            return res.status(200).json({ok:true});

        }catch(e){
    
            return res.status(400).json({ok:false});
    
        }
    
    },
    lista_pedidos : async(req,res)=>{

        const dateP= new Date();
    
        const myDate = moment(dateP).format('L');
    
        var gte = moment(myDate).subtract(0,'hours');
        var lt = moment( myDate).add(1,'days');
    
        var tienda_nombre = await Tienda.findOne({punto_venta:req.body.token});
    
        if(!tienda_nombre){
    
            const usuario = await Usuario.findById({_id:req.uid});
            const tienda = await Tienda.findById(usuario.negocios[0]);
        
            tienda_nombre = {};
            tienda_nombre.nombre = tienda.nombre;
    
        }
    
        if(req.body.tienda){
            const tienda = await Tienda.findById(req.body.tienda);
        
            tienda_nombre = {};
            tienda_nombre.nombre = tienda.nombre;
        }
    

        var tienda_ropa =  req.body.tienda_ropa;
    
        if(req.body.filtro){
    

    
            let text = req.body.filtro;
    
            const myArray = text.split(" - ");
            const horario = [];
    
            myArray.forEach((element) =>{

                const myArray2 = element.split('/');
                horario.push(myArray2);

            });
    
            const gte2 = horario[0][2]+'/'+horario[0][1]+'/'+horario[0][0];
            const lt2 =  horario[1][2]+'/'+horario[1][1]+'/'+horario[1][0];
    
            var gteParse = new Date(gte2);
            var gteSubs = moment(gteParse).subtract(0,'hours');
    
            var ltParse = new Date(lt2);
            var ltSubs = moment(ltParse).add(1,'days');
    
            gte = gteSubs;
            lt = ltSubs;
    
        }
    
        const pedidos = await Venta.aggregate(
            [
            {$match:{}},
            {$unwind:'$pedidos'},
            {$project:{'pedido':'$pedidos'}},
            {$project:{
                "productos": "$pedido.productos",
                "_id": "$pedido._id",
                "total": "$pedido.total",
                "tienda": "$pedido.tienda",
                "repartidor": "$pedido.repartidor",
                "imagen": "$pedido.imagen",
                "ubicacion":"$pedido.ubicacion",
                "direccion":"$pedido.direccion" ,
                "punto_venta":"$pedido.punto_venta" ,
                "efectivo":"$pedido.efectivo" ,
                "usuario":"$pedido.usuario" ,
                "confirmado":"$pedido.confirmado",
                "createdAt":"$pedido.createdAt",
                "updatedAt":"$pedido.updatedAt",
                "tiempo_espera":"$pedido.tiempo_espera",
                "entregado_cliente":"$pedido.entregado_cliente" ,
                "entregado_repartidor":"$pedido.entregado_repartidor",
                "confirmacion_tiempo":"$pedido.confirmacion_tiempo",
                "entrega_repartidor_tiempo":"$pedido.entrega_repartidor_tiempo",
                "entrega_cliente_tiempo":"$pedido.entrega_cliente_tiempo",
                "codigo_repartidor":"$pedido.codigo_repartidor",
                "codigo_cliente":"$pedido.codigo_cliente",
                "id_venta":"$pedido.id_venta",
                "repartidor_domicilio":"$pedido.repartidor_domicilio",
                "repartidor_domicilio_tiempo":"$pedido.repartidor_domicilio_tiempo",
                "repartidor_calificado":"$pedido.repartidor_calificado",
                "repartidor_calificado_tiempo":"$pedido.repartidor_calificado_tiempo",
                "direccion_cliente":'$pedido.direccion_cliente',
                "direccion_negocio":'$pedido.direccion_negocio',
                "envio":'$pedido.envio',
                "ruta":"$pedido.ruta",
            }},
            {
                $match:{
                'tienda': tienda_nombre.nombre,
                'createdAt':{
                    $gte : new Date(gte), 
                    $lt :  new Date(lt), 
                }
            }},
            {
                $lookup:{
                    from:'usuarios',
                    localField:'repartidor',
                    foreignField:'_id',
                    as:'repartidor'
                }
            },
            {$project:{
                "productos": "$productos",
                "_id": "$_id",
                "total": "$total",
                "tienda": "$tienda",
                "repartidor": {$arrayElemAt:["$repartidor",0]},
                "imagen": "$imagen",
                "ubicacion":"$ubicacion",
                "direccion":"$direccion" ,
                "punto_venta":"$punto_venta" ,
                "efectivo":"$efectivo" ,
                "usuario":"$usuario" ,
                "confirmado":"$confirmado",
                "createdAt":"$createdAt",
                "updatedAt":"$updatedAt",
                "tiempo_espera":"$tiempo_espera",
                "entregado_cliente":"$entregado_cliente" ,
                "entregado_repartidor":"$entregado_repartidor",
                "confirmacion_tiempo":"$confirmacion_tiempo",
                "entrega_repartidor_tiempo":"$entrega_repartidor_tiempo",
                "entrega_cliente_tiempo":"$entrega_cliente_tiempo",
                "codigo_repartidor":"$codigo_repartidor",
                "codigo_cliente":"$codigo_cliente",
                "id_venta":"$id_venta",
                "repartidor_domicilio":"$repartidor_domicilio",
                "repartidor_domicilio_tiempo":"$repartidor_domicilio_tiempo",
                "repartidor_calificado":"$repartidor_calificado",
                "repartidor_calificado_tiempo":"$repartidor_calificado_tiempo",
                "direccion_cliente":'$direccion_cliente',
                "direccion_negocio":'$direccion_negocio',
                "envio":'$envio',
                "ruta":"$ruta",
                "fix":true,
                "abonos":[]
            }},{
                $sort:{
                    "createdAt":-1
                }
            }

            
        ])
        
        function calcularPedidosCompletos( pedidos ){
    
            var completos = 0;
    
            pedidos.forEach(element => element.entregado_repartidor ?  completos++ :completos );
    
            return completos;
            
        }
    
        function calcularGananciaAprox( pedidos ){
    
            var ganancia = 0;
    
            if(tienda_ropa){

                pedidos.forEach(element => ganancia +=  element.total );

            }else{

                pedidos.forEach(element => ganancia += element.entregado_repartidor ? element.total :0 );

            }

    
            return ganancia;
            
        }
    
        var pedidosPrev = {
            ventas: pedidos,
            size : pedidos.length,
            completados:calcularPedidosCompletos(pedidos),
            ganancia:calcularGananciaAprox(pedidos)
        };
    
        pedidos.forEach(function(element,index){

            if(element.repartidor){
            
                pedidos[index].repartidor.negocios = [];
            
            }

        });
    
        return res.json(pedidosPrev);
    
    },
    lista_pedidos_tienda : async(req,res)=>{

        const dateP= new Date();
    
        const myDate = moment(dateP).format('L');
    
        var gte = moment(myDate).subtract(0,'hours');
        var lt = moment( myDate).add(1,'days');
    
        var tienda_nombre = await Tienda.findOne({punto_venta:req.body.token});
    
        if(!tienda_nombre){
    
            const usuario = await Usuario.findById({_id:req.uid});
            const tienda = await Tienda.findById(usuario.negocios[0]);
        
            tienda_nombre = {};
            tienda_nombre.nombre = tienda.nombre;
    
        }
    
        if(req.body.tienda){
            const tienda = await Tienda.findById(req.body.tienda);
        
            tienda_nombre = {};
            tienda_nombre.nombre = tienda.nombre;
        }
    

        var tienda_ropa =  req.body.tienda_ropa;
    
        if(req.body.filtro){
    

    
            let text = req.body.filtro;
    
            const myArray = text.split(" - ");
            const horario = [];
    
            myArray.forEach((element) =>{

                const myArray2 = element.split('/');
                horario.push(myArray2);

            });
    
            const gte2 = horario[0][2]+'/'+horario[0][1]+'/'+horario[0][0];
            const lt2 =  horario[1][2]+'/'+horario[1][1]+'/'+horario[1][0];
    
            var gteParse = new Date(gte2);
            var gteSubs = moment(gteParse).subtract(0,'hours');
    
            var ltParse = new Date(lt2);
            var ltSubs = moment(ltParse).add(1,'days');
    
            gte = gteSubs;
            lt = ltSubs;
    
        }
    
        const pedidos = await Venta.aggregate(
            [
            {$match:{}},
            {$unwind:'$pedidos'},
            {$project:{'pedido':'$pedidos','apartado':'$apartado','liquidado':'$liquidado','abonos':'$abonos'}},
            {$project:{
                "productos": "$pedido.productos",
                "_id": "$pedido._id",
                "total": "$pedido.total",
                "tienda": "$pedido.tienda",
                "repartidor": "$pedido.repartidor",
                "imagen": "$pedido.imagen",
                "ubicacion":"$pedido.ubicacion",
                "direccion":"$pedido.direccion" ,
                "punto_venta":"$pedido.punto_venta" ,
                "efectivo":"$pedido.efectivo" ,
                "usuario":"$pedido.usuario" ,
                "confirmado":"$pedido.confirmado",
                "createdAt":"$pedido.createdAt",
                "updatedAt":"$pedido.updatedAt",
                "tiempo_espera":"$pedido.tiempo_espera",
                "entregado_cliente":"$pedido.entregado_cliente" ,
                "entregado_repartidor":"$pedido.entregado_repartidor",
                "confirmacion_tiempo":"$pedido.confirmacion_tiempo",
                "entrega_repartidor_tiempo":"$pedido.entrega_repartidor_tiempo",
                "entrega_cliente_tiempo":"$pedido.entrega_cliente_tiempo",
                "codigo_repartidor":"$pedido.codigo_repartidor",
                "codigo_cliente":"$pedido.codigo_cliente",
                "id_venta":"$pedido.id_venta",
                "repartidor_domicilio":"$pedido.repartidor_domicilio",
                "repartidor_domicilio_tiempo":"$pedido.repartidor_domicilio_tiempo",
                "repartidor_calificado":"$pedido.repartidor_calificado",
                "repartidor_calificado_tiempo":"$pedido.repartidor_calificado_tiempo",
                "direccion_cliente":'$pedido.direccion_cliente',
                "direccion_negocio":'$pedido.direccion_negocio',
                "envio":'$pedido.envio',
                "ruta":"$pedido.ruta",
                "apartado":"$apartado",
                "liquidado":"$liquidado",
                "abonos":"$abonos",
                "abonosSafe":"$abonos",
            }},
            {$unwind:'$abonos'},
            {
                $match:{
                'tienda': tienda_nombre.nombre,
                'abonos.fecha':{
                    $gte : new Date(gte), 
                    $lt :  new Date(lt), 
                }
            }},
            {
                $lookup:{
                    from:'usuarios',
                    localField:'repartidor',
                    foreignField:'_id',
                    as:'repartidor'
                }
            },
            {$project:{
                "productos": "$productos",
                "_id": "$_id",
                "total": "$total",
                "tienda": "$tienda",
                "repartidor": {$arrayElemAt:["$repartidor",0]},
                "imagen": "$imagen",
                "ubicacion":"$ubicacion",
                "direccion":"$direccion" ,
                "punto_venta":"$punto_venta" ,
                "efectivo":"$efectivo" ,
                "usuario":"$usuario" ,
                "confirmado":"$confirmado",
                "createdAt":"$createdAt",
                "updatedAt":"$updatedAt",
                "tiempo_espera":"$tiempo_espera",
                "entregado_cliente":"$entregado_cliente" ,
                "entregado_repartidor":"$entregado_repartidor",
                "confirmacion_tiempo":"$confirmacion_tiempo",
                "entrega_repartidor_tiempo":"$entrega_repartidor_tiempo",
                "entrega_cliente_tiempo":"$entrega_cliente_tiempo",
                "codigo_repartidor":"$codigo_repartidor",
                "codigo_cliente":"$codigo_cliente",
                "id_venta":"$id_venta",
                "repartidor_domicilio":"$repartidor_domicilio",
                "repartidor_domicilio_tiempo":"$repartidor_domicilio_tiempo",
                "repartidor_calificado":"$repartidor_calificado",
                "repartidor_calificado_tiempo":"$repartidor_calificado_tiempo",
                "direccion_cliente":'$direccion_cliente',
                "direccion_negocio":'$direccion_negocio',
                "envio":'$envio',
                "ruta":"$ruta",
                "apartado":"$apartado",
                "liquidado":"$liquidado",
                "fix":true,
                "concepto_titulo":"$abonos.titulo",
                "total_safe":"$abonos.cantidad",
                "abonos":"$abonosSafe",
            }},{
                $sort:{
                    "createdAt":-1
                }
            }
            
        ])

    
        function calcularPedidosCompletos( pedidos ){
    
            var completos = 0;
    
            pedidos.forEach(element => element.entregado_repartidor ?  completos++ :completos );
    
            return completos;
            
        }
    
        function calcularGananciaAprox( pedidos ){
    
            var ganancia = 0;
    
            if(tienda_ropa){

                pedidos.forEach(element => ganancia +=  element.total_safe );

            }else{

                pedidos.forEach(element => ganancia += element.entregado_repartidor ? element.total :0 );

            }
    
            return ganancia;
            
        }
    
        var pedidosPrev = {
            ventas: pedidos,
            size : pedidos.length,
            completados:calcularPedidosCompletos(pedidos),
            ganancia:calcularGananciaAprox(pedidos)
        };
    
        pedidos.forEach(function(element,index){

            if(element.repartidor){
            
                pedidos[index].repartidor.negocios = [];
            
            }

        });
    
        return res.json(pedidosPrev);
    
    },
    modificarNombreTienda : async(req,res)=>{

        await Tienda.findByIdAndUpdate({_id:req.body.tienda},{$set:{nombre:req.body.nombre}});
    
        return res.json({
            ok:true
        });
    
    },
    modificarStatus : async (req,res)=>{
    
        await Tienda.findByIdAndUpdate({_id:req.body.tienda},{$set:{disponible:req.body.disponible}});
    
        return res.json({
            ok:true
        });
    
    },
    modificarAniversario : async(req,res) =>{
    
        await Tienda.findByIdAndUpdate({_id:req.body.tienda},{$set:{aniversario:req.body.aniversario}});
    
        res.json({
            ok:true,
        })
    
    },
    modificarHorarioTienda : async(req,res) =>{
    
        const apertura = moment(req.body.apertura,'hh:mm').format();
        const cierre = moment(req.body.cierre,'hh:mm').format();
    
        var data = {apertura,cierre};
    
        const nuevoHorario = new Horario(data);
    
        await  Tienda.findByIdAndUpdate({_id:req.body.tienda},{$set:{horario:nuevoHorario}});
    
        res.json({
            ok:true,
        });
    },
    searchOne :async (req,res) =>{
        
        const tienda = await Tienda.findOne(req.body.uid);
    
        res.json({ok:true,tienda});

    },
    macChangue : async(req,res)=>{
    
        await Tienda.findByIdAndUpdate({_id:req.body.id},{$set:{'mac':req.body.mac}});
    
        return res.status(200).json({ok:true});
    
    },    
    autoImpresion : async(req,res)=>{
    
        await Tienda.findByIdAndUpdate({_id:req.body.id},{$set:{'auto_impresion':req.body.status}});
    
        return res.status(200).json({ok:true});
    
    },
    nuevaTienda : async (req,res) =>{
    
        const newLista = await new ListaProductos();
        const newHorario = await new Horario();
    
        newHorario.apertura = new Date();
        newHorario.cierre = new Date();
        
        await newLista.save();
    
        req.body.horario = newHorario;
        req.body.propietario = req.uid;
        req.body.disponible = false;
        req.body.aniversario = new Date();
        req.body.productos = newLista._id;
    
        const nuevaTienda = new Tienda(req.body);
    
        await nuevaTienda.save();
    
        await Usuario.findOneAndUpdate({_id:req.uid},{$push:{tiendas:nuevaTienda._id}});
    
        res.json({
            ok:true,
            nuevaTienda,
        });
    
    },
    obtenerTiendaMasVendido : async (req,res) =>{

    },
    obtenerProductosMasVendido : async(req,res)=>{
    
    },
    obtenerTiendaPopulares : async (req,res) =>{

    },
    obtenerProductosPopulares : async(req,res)=>{

    },
    busquedaQRVenta: async(req,res)=>{


        try{

            var pedidos = await Venta.aggregate(
                [
                {$match:{'_id': mongoose.Types.ObjectId(req.body.qr),'negocio':'Black Shop'}},
                {$unwind:'$pedidos'},
                
                {$project:{'pedido':'$pedidos','apartado':'$apartado','liquidado':'$liquidado','abonos':'$abonos'}},
                {$project:{
                    "productos": "$pedido.productos",
                    "_id": "$pedido._id",
                    "total": "$pedido.total",
                    "tienda": "$pedido.tienda",
                    "imagen": "$pedido.imagen",
                    "ubicacion":"$pedido.ubicacion",
                    "direccion":"$pedido.direccion" ,
                    "punto_venta":"$pedido.punto_venta" ,
                    "efectivo":"$pedido.efectivo" ,
                    "usuario":"$pedido.usuario" ,
                    "confirmado":"$pedido.confirmado",
                    "createdAt":"$pedido.createdAt",
                    "updatedAt":"$pedido.updatedAt",
                    "tiempo_espera":"$pedido.tiempo_espera",
                    "entregado_cliente":"$pedido.entregado_cliente" ,
                    "entregado_repartidor":"$pedido.entregado_repartidor",
                    "confirmacion_tiempo":"$pedido.confirmacion_tiempo",
                    "entrega_repartidor_tiempo":"$pedido.entrega_repartidor_tiempo",
                    "entrega_cliente_tiempo":"$pedido.entrega_cliente_tiempo",
                    "codigo_repartidor":"$pedido.codigo_repartidor",
                    "codigo_cliente":"$pedido.codigo_cliente",
                    "id_venta":"$pedido.id_venta",
                    "repartidor_domicilio":"$pedido.repartidor_domicilio",
                    "repartidor_domicilio_tiempo":"$pedido.repartidor_domicilio_tiempo",
                    "repartidor_calificado":"$pedido.repartidor_calificado",
                    "repartidor_calificado_tiempo":"$pedido.repartidor_calificado_tiempo",
                    "direccion_cliente":'$pedido.direccion_cliente',
                    "direccion_negocio":'$pedido.direccion_negocio',
                    "envio":'$pedido.envio',
                    "ruta":"$pedido.ruta",
                    "apartado":"$apartado",
                    "liquidado":"$liquidado",
                    "abonos":"$abonos",
                    "concepto_titulo":"",
                    "total_safe":"0",
                }},
                
                
            ]);

    
            if(pedidos.length > 0){

                var venta_general = await Venta.findById(req.body.qr);

                venta_general.pedidos = pedidos[0];
                venta_general.apartado = pedidos[0].apartado;
                venta_general.liquidado = pedidos[0].liquidado;
                venta_general.abonos = pedidos[0].abonos;


                return res.status(200).json(venta_general);
    
            }else{
    
                return res.status(400);
    
            }

        }catch(e){


            return res.status(400);

        }


    },
    busquedaApartados: async(req,res)=>{

        const pedidos = await Venta.aggregate(
            [
            {$match:{
                'negocio':'Black Shop',
                'apartado':true,
                'liquidado':false
            }},
            {$unwind:'$pedidos'},
            {$project:{'pedido':'$pedidos','apartado':'$apartado','liquidado':'$liquidado','abonos':'$abonos'}},
            {$project:{
                "productos": "$pedido.productos",
                "_id": "$pedido._id",
                "total": "$pedido.total",
                "tienda": "$pedido.tienda",
                "repartidor": "$pedido.repartidor",
                "imagen": "$pedido.imagen",
                "ubicacion":"$pedido.ubicacion",
                "direccion":"$pedido.direccion" ,
                "punto_venta":"$pedido.punto_venta" ,
                "efectivo":"$pedido.efectivo" ,
                "usuario":"$pedido.usuario" ,
                "confirmado":"$pedido.confirmado",
                "createdAt":"$pedido.createdAt",
                "updatedAt":"$pedido.updatedAt",
                "tiempo_espera":"$pedido.tiempo_espera",
                "entregado_cliente":"$pedido.entregado_cliente" ,
                "entregado_repartidor":"$pedido.entregado_repartidor",
                "confirmacion_tiempo":"$pedido.confirmacion_tiempo",
                "entrega_repartidor_tiempo":"$pedido.entrega_repartidor_tiempo",
                "entrega_cliente_tiempo":"$pedido.entrega_cliente_tiempo",
                "codigo_repartidor":"$pedido.codigo_repartidor",
                "codigo_cliente":"$pedido.codigo_cliente",
                "id_venta":"$pedido.id_venta",
                "repartidor_domicilio":"$pedido.repartidor_domicilio",
                "repartidor_domicilio_tiempo":"$pedido.repartidor_domicilio_tiempo",
                "repartidor_calificado":"$pedido.repartidor_calificado",
                "repartidor_calificado_tiempo":"$pedido.repartidor_calificado_tiempo",
                "direccion_cliente":'$pedido.direccion_cliente',
                "direccion_negocio":'$pedido.direccion_negocio',
                "envio":'$pedido.envio',
                "ruta":"$pedido.ruta",
                "apartado":"$apartado",
                "liquidado":"$liquidado",
                "abonos":"$abonos"
            }},
            {
                $lookup:{
                    from:'usuarios',
                    localField:'repartidor',
                    foreignField:'_id',
                    as:'repartidor'
                }
            },
            {$project:{
                "productos": "$productos",
                "_id": "$_id",
                "total": "$total",
                "tienda": "$tienda",
                "repartidor": {$arrayElemAt:["$repartidor",0]},
                "imagen": "$imagen",
                "ubicacion":"$ubicacion",
                "direccion":"$direccion" ,
                "punto_venta":"$punto_venta" ,
                "efectivo":"$efectivo" ,
                "usuario":"$usuario" ,
                "confirmado":"$confirmado",
                "createdAt":"$createdAt",
                "updatedAt":"$updatedAt",
                "tiempo_espera":"$tiempo_espera",
                "entregado_cliente":"$entregado_cliente" ,
                "entregado_repartidor":"$entregado_repartidor",
                "confirmacion_tiempo":"$confirmacion_tiempo",
                "entrega_repartidor_tiempo":"$entrega_repartidor_tiempo",
                "entrega_cliente_tiempo":"$entrega_cliente_tiempo",
                "codigo_repartidor":"$codigo_repartidor",
                "codigo_cliente":"$codigo_cliente",
                "id_venta":"$id_venta",
                "repartidor_domicilio":"$repartidor_domicilio",
                "repartidor_domicilio_tiempo":"$repartidor_domicilio_tiempo",
                "repartidor_calificado":"$repartidor_calificado",
                "repartidor_calificado_tiempo":"$repartidor_calificado_tiempo",
                "direccion_cliente":'$direccion_cliente',
                "direccion_negocio":'$direccion_negocio',
                "envio":'$envio',
                "ruta":"$ruta",
                "fix":true,
                "apartado":"$apartado",
                "liquidado":"$liquidado",
                "abonos":"$abonos"
            }},{
                $sort:{
                    "createdAt":-1
                }
            }
            
        ]);

        var pedidosPrev = {
            ventas: pedidos,
            size : pedidos.length,
            completados:0,
            ganancia:0
        };
    -
        pedidos.forEach(function(element,index){

            if(element.repartidor){
            
                pedidos[index].repartidor.negocios = [];
            
            }

        });

    
        return res.json(pedidosPrev);

    },
    agregarNuevoAbono:async(req,res)=>{

        try {


            const nuevoAbono = new Abono();
    
            nuevoAbono.cantidad = req.body.cantidad;
            nuevoAbono.fecha = new Date();
            nuevoAbono.titulo = 'Abono';
    
            await Venta.findByIdAndUpdate({'_id':req.body.ventaId},{$push:{abonos:nuevoAbono}});
            await Venta.findByIdAndUpdate({'_id':req.body.ventaId},{$set:{liquidado:req.body.liquidado}});
    
            res.status(200).json({
                ok:true
    
            });

        } catch (error) {


            res.status(400).json({
                ok:false
    
            });

        }

    }
}

module.exports = controller;








