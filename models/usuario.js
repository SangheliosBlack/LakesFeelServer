const {Schema,model} = require ('mongoose');

const UsuarioSchema =  Schema({
    envio_promo:{
        type:Boolean,
        required:true
    },
    codigo:{
        type:String,
        required:false,
        unique:true,
        sparse:true,
    },
    avatar:{
        type:Object,
        required:false
    },
    nombre_usuario:{
        type:String,
        require:true
    },
    dialCode:{
        type:String,
        require:true
    },
    nombre:{
        type:String,
        require:true
    },
    online:{
        type:Boolean,
        default:false
    },
    online_repartidor:{
        type:Boolean,
        default:false
    },
    correo:{
        type:String,
        require:true,
        
        unique:true
    },
    contrasena:{
        type:String,
        required:true
    },
    direcciones:{
        type:Array,
        required:false
    },
    socio:{
        type:Boolean,
        required:true
    },
    customer_id:{
        type:String,
        required:false,
        sparse:true,
        unique:true,
    },
    profile_photo_key:{
        type:String,
        require: false
    },
    numero_celular:{
        type:String,
        unique:true,
        required:false
    },
    negocios:[{
        type:Schema.Types.ObjectId,
        ref:'Tiendas'
    }],
    cesta:{
        type:Object,
        require :true
    },
    tokenFB:{
        type:String,
        require:false
    },
    impresora:{
        type:Object,
        require:false
    },
    repartidor:{
        type:Boolean,
        require:true
    },
    ultima_tarea:{
        type:Date,
        require:true
    },
    transito:{
        type:Boolean,
        require:true
    },
    notificado:{
        type:Boolean,
        require:false
    },
    hibrido:{
        type:Boolean,
        require:false
    },
    stripe_account_id:{
        type:String,
        require:false
    },
    pulsera:{
        type:Schema.Types.ObjectId,
        require:false
    },
    recargas:[
        {
            type:Schema(
                {
                    cantidad:{
                        type:Number,
                        require:true
                    },
                    usuario:{
                        type:Schema.Types.ObjectId,
                        require:true
                    }
                },
                {
                    timestamps: true
                }
            )
        }
    ]
    
},{
    timestamps:true
});

UsuarioSchema.method('toJSON',function(){
    const {__v,_id,contrasena,...object} = this.toObject();
    object.uid = _id;
    return object;
});

module.exports = model('Usuario',UsuarioSchema);