const {Schema,model} = require('mongoose');

const ProductosSchema = Schema({
    tienda:{
        type:String,
        required:true
    },
    categoria:{
        type:String,
        require:true
    },
    comentarios:{
        type:Array,
        require:false
    },
    nombre:{
        type:String,
        require:true
    },
    precio:{
        type:Number,
        require:true,
    },
    descripcion:{
        type:String,
        require:true
    },
    descuentoP:{
        type:Number,
        require:true
    },
    descuentoC:{
        type:Number,
        require:true
    },
    promocion:{
        type:Schema.Types.ObjectId,
        require:false
    },
    disponible:{
        type:Boolean,
        require:true
    },
    foto:{
        type:String,
        require:false
    },
    cantidad:{
        type:Number,
        require:true
    },opciones:[
        {
            titulo:{
                type:String,
                require:true
            },
            maximo:{
                type:Number,
                require:true
            },
            minimo:{
                type:Number,
                require:true
            },
            listado:[{
                precio:{
                    type:Number,
                    require:true
                },
                tipo:{
                    type:String,
                    require:true
                },
                activo:{
                    type:Boolean,
                    require:true
                },
                auto:{
                    type:Boolean,
                    require:true,
                    
                },
                fijo:{
                    type:Boolean,
                    require:true,

                }
            }]
        }
    ],
    extra:{
        type:Number,
        require:true,
    },
    sku:{
        type:String,
        require:true
    }
});

ProductosSchema.method('toJson',function(){
    const{__v,id,...object} = this.toObject();
    return object;
});

module.exports = model('Productos',ProductosSchema);